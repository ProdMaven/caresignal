// Ask router (docs/AI_FEATURES.md, Feature 2). Server only. Owner: Lane 2.
// Order: 1. the safety rules, before any model call, with fixed messages; 2. a fast model that returns only a
// label and parameters; 3. code computes the answer (src/lib/askAnswers.ts). The model writes nothing a person
// reads. If the model is off, fails, or returns anything that does not validate, a keyword router picks the label.
// Relative imports only (tsx scripts load this).
import { z } from "zod";
import { mockAsk as buildSafetyAnswer } from "../mocks/ask";
import { WINDOW_DAYS } from "../mocks/data";
import { computePatterns, eventsInWindow } from "../mocks/patterns";
import { OUT_OF_SCOPE_MESSAGE, screenSafety as screenAskSafety } from "../mocks/safety";
import { ASK_INTENTS, ASK_ROUTER_SYSTEM, ASK_TIME_BANDS, buildAskRouterUserMessage } from "../prompts/askRouter";
import { AiError, callClaude, parseJson } from "./ai";
import { ADVICE_QUESTION, answerFor } from "./askAnswers";
import { mocksEnabled } from "./env";
import { normalize, SCOPE_MESSAGES, screenSafety as screenNoteSafety } from "./safety";
import { EVENT_TYPES } from "./schemas";
import type { AskIntent, AskRequest, AskResponse, AskUnderstanding, LogRecord, Mode, Person, TimeBand } from "./types";

export type AskSource = "model" | "fallback" | "safety";

const DEFAULT_FAST_MODEL = "claude-haiku-5-5";
const ROUTER_TIMEOUT_MS = 8_000;
const ROUTER_MAX_TOKENS = 100;

// Shown when the MODEL labels a question as a crisis that the rule screen did not catch. The label does not say
// whether it is a red flag about the person or the caregiver's own distress, so this fixed text covers both:
// care team first, then 988, then 911.
export const ROUTER_CRISIS_MESSAGE =
  "Please contact your doctor or care team. What you described may need medical attention, and they are the right people to check. " +
  "If you feel you cannot go on, or anyone is thinking about harming themselves, please call or text 988, the 988 Suicide and Crisis Lifeline, at any time. " +
  "If anyone is in immediate danger, call 911 now. Unspoken supports caregivers and does not diagnose.";

const ROUTER_CRISIS_ANSWER =
  "This is something for your doctor or care team to look at, so Unspoken will not guess at a reason. " +
  "If you are the one who is struggling, your own wellbeing comes first and the logs can wait.";

// ---------- what the model may return ----------

// Exactly the four keys, nothing else. An extra key (for example an "answer") fails the whole reply.
const routerReplySchema = z.strictObject({
  intent: z.enum(ASK_INTENTS),
  eventType: z.string().max(40).nullable().optional(),
  timeBand: z.enum(ASK_TIME_BANDS).nullable().optional(),
  days: z.union([z.literal(7), z.literal(14), z.literal(30)]).nullable().optional(),
});

const NO_PARAMETER_INTENTS: readonly AskIntent[] = ["medical_out_of_scope", "crisis", "about_the_app", "other"];

// Turns the model's text into an understanding, or null when it is not a valid label with valid parameters.
// Exported so scripts can test the validation path without a model.
export function parseRouterReply(text: string, mode: Mode): AskUnderstanding | null {
  let raw: unknown;
  try {
    raw = parseJson(text);
  } catch {
    return null;
  }
  const parsed = routerReplySchema.safeParse(raw);
  if (!parsed.success) return null;
  const { intent, eventType, timeBand, days } = parsed.data;
  if (eventType && !(EVENT_TYPES[mode] as readonly string[]).includes(eventType)) return null;
  if (NO_PARAMETER_INTENTS.includes(intent)) return { intent };
  const understanding: AskUnderstanding = { intent };
  if (eventType) understanding.eventType = eventType;
  if (timeBand) understanding.timeBand = timeBand;
  if (days) understanding.days = days;
  return understanding;
}

// ---------- keyword fallback router ----------

const EVENT_WORDS: Record<Mode, [string, RegExp][]> = {
  dementia: [
    ["refused_food", /\brefus\w* (food|to eat|lunch|dinner|breakfast|her meal|his meal)\b|\b(not|won'?t|doesn'?t|didn'?t) eat\b|\bskip\w* (lunch|dinner|breakfast|a meal|meals)\b|\bsmall (lunch|meal)/],
    ["refused_care", /\brefus\w* (care|the bath|a bath|the shower|a shower|to bathe|to shower|to get dressed|to wash)\b|\b(bath|baths|bathing|shower|showers|banarse)\b/],
    ["agitation", /\bagitat|\bupset\b|\bworked up\b|\binquiet|\balter(a|e|ada|ado)\b|\bagitad/],
    ["calling_out", /\bcall(s|ing|ed)? out\b|\bshout|\byell/],
    ["wandering", /\bwander/],
    ["restlessness", /\brestless/],
    ["crying", /\bcry(ing)?\b|\bcries\b|\bcried\b|\btears\b|\bllora/],
    ["sleep_disturbance", /\bsleep|\bwak(e|es|ing) up\b|\bwoke\b|\bneend\b|\bduerm|नींद/],
  ],
  autism: [
    ["meltdown", /\bmelt ?downs?\b|\bcrisis nerviosa\b|मेल्टडाउन/],
    ["shutdown", /\bshut ?downs?\b|\b(goes|went|going) (quiet|silent)\b/],
    ["stimming_increase", /\bstim/],
    ["food_refusal", /\brefus\w* (food|to eat|dinner|lunch|breakfast)\b|\b(not|won'?t|doesn'?t|didn'?t) eat\b/],
    ["transition_distress", /\btransition|\bscreen time\b|\btablet\b/],
    ["aggression", /\bhit(s|ting)?\b|\bkick|\baggress/],
    ["elopement", /\b(run|runs|running|ran) (off|away)\b|\bbolt|\belop/],
    ["sleep_trouble", /\bsleep|\bneend\b|\bduerm|नींद/],
  ],
};

const BAND_WORDS: [TimeBand, RegExp][] = [
  ["early_morning", /\bearly (in the )?mornings?\b|\bdawn\b|\bmadrugada\b/],
  ["morning", /\bmornings?\b|\bmananas?\b|\bsubah\b|सुबह/],
  ["afternoon", /\bafternoons?\b|\btardes?\b|\bdopahar\b|दोपहर/],
  ["evening", /\bevenings?\b|\bafter dinner\b|\bshaam\b|\bsham\b|शाम/],
  ["night", /\bnights?\b|\bovernight\b|\bbedtime\b|\bnoches?\b|\braat\b|रात/],
];

function daysOf(t: string): 7 | 14 | 30 | undefined {
  if (/\b(three|3) weeks\b|\b21 days\b/.test(t)) return undefined; // the standard window
  if (/\b(two|2|couple of) weeks\b|\b14 days\b|\bfortnight\b|\bdos semanas\b|\bdo haft[ea]\b|दो हफ.?्ते/.test(t)) return 14;
  if (/\bmonths?\b|\b30 days\b|\bmes\b|\bmahin[ea]\b|महीने/.test(t)) return 30;
  if (/\bweek\b|\b(7|seven) days\b|\bsemana\b|\bhaft[ea]\b|हफ.?्ते|सप्ताह/.test(t)) return 7;
  return undefined;
}

// First match wins. The order settles questions that carry two cues ("how many more than last week" is a comparison).
const INTENT_RULES: [AskIntent, RegExp][] = [
  ["about_the_app", /\bwhat (can|do|does|will) (you|this app|the app|unspoken|it) (actually |really |even )?(do|not do)\b|\bhow (do|does) (you|this|the app|this app|unspoken|it) (work|know|come up|get|decide)\b|\bwhat is (this app|unspoken)\b|\bwho (are you|made (you|this))\b|\bare you (a|an|real)\b|\b(is|are) (my|the|our) (data|notes?|logs?) (safe|private|shared|stored|kept)\b|\bque (puedes|puede|haces|hace) (hacer|esta app)\b|\bcomo funciona\b|\bapp kya\b|\bkya kar(ta|ti|te)? (hai|sakt)|क्या कर(ता|ती|ते)? ?(है|सकत)/],
  ["compare_periods", /\bcompa|\b(more|less|fewer|worse|better)\b.{0,30}\bthan\b|\b(more|less) often\b|\bmore frequent|\bversus\b|\bvs\b|\bincreas|\bdecreas|\bgoing (up|down)\b|\bgetting (more|less|worse|better)\b|\bimprov|\bmas (que|veces que)\b|\bmenos que\b|\bse (zyada|jyada|kam)\b|से ज.?्यादा|से कम|की तुलना/],
  ["what_is_new", /\bnew\b|\banything (different|changed|unusual)\b|\bwhat('s| has| is)? ?changed\b|\bnot seen before\b|\bnever seen\b|\bfirst time\b|\b(started recently|recently started)\b|\bnuev[oa]s?\b|\bnay[ai]\b|\bkuch alag\b|नया|नई|नयी/],
  ["who_saw_it", /\bwho\b|\bwhich (caregiver|of us|one of us|person)\b|\bquien(es)?\b|\bkis ?ne\b|\bkaun\b|किसने|कौन/],
  ["what_helped", /\bhelp(s|ed|ing|ful)?\b|\bwork(s|ed|ing)?\b|\bcalm(s|ed|ing)?\b.{0,12}\bdown\b|\bcalm(s|ed)? (her|him|them)\b|\bsooth|\bsettle[sd]?\b|\bwhat (should|can|could|do) (i|we) (try|do)\b|\bwhat (did|have) (i|we) (try|tried)\b|\bayud|\bfuncion[ao]\b|\bcalm(a|o|arse|arla|arlo)\b|\bmadad\b|\bkaam (kiya|aaya|aya)\b|मदद|काम आया|शांत/],
  ["how_often", /\bhow (often|many|much|frequent\w*|regularly)\b|\bnumber of\b|\bcount\b|\btimes (a|per|each) (day|week|month)\b|\bcuant[ao]s\b|\bcon que frecuencia\b|\bkitn[iea] (baar|bar|dafa)\b|कितनी बार|कितने बार|कितनी दफा|कितने/],
  ["what_comes_before", /\bbefore\b|\btrigger|\bsets? (her|him|it|them) off\b|\blead(s|ing)? up\b|\bleads? to\b|\bwhy\b|\bcaus(e|es|ed|ing)\b|\bin common\b|\bhappen\w* (right |just )?after\b|\bpreced|\bantes\b|\bpor que\b|\bprovoca|\bdesencaden|\bpehle\b|\bpahle\b|\bkyu?n?\b|\bkyon\b|पहले|क्यों/],
  ["when_does_it_happen", /\b(when|wen|whn)\b|\b(what|which) times?\b|\btime of day\b|\b(what|which) days?\b|\bweekends?\b|\bweekdays?\b|\bcuando\b|\ba que hora\b|\bque dias?\b|\bkab\b|\bkis (samay|waqt|time)\b|कब|किस समय|किस वक्त/],
];

// Second pass for typos ("hepled", "offen", "befor"): a word within one edit of a cue word.
const TYPO_CUES: [AskIntent, string[]][] = [
  ["what_helped", ["helped", "helps", "helping", "worked", "settled"]],
  ["how_often", ["often", "frequently", "frequency"]],
  ["what_comes_before", ["before", "trigger", "triggers", "triggered"]],
  ["compare_periods", ["compare", "compared", "versus"]],
  ["what_is_new", ["different", "changed"]],
  ["when_does_it_happen", ["weekend", "weekends", "weekday", "weekdays", "usually"]],
];

// Optimal string alignment distance (insert, delete, substitute, swap neighbours), cut off above 1.
function withinOneEdit(a: string, b: string): boolean {
  if (a === b) return true;
  if (Math.abs(a.length - b.length) > 1) return false;
  const rows = a.length + 1;
  const cols = b.length + 1;
  const d: number[][] = Array.from({ length: rows }, (_, i) => Array.from({ length: cols }, (_, j) => (i === 0 ? j : j === 0 ? i : 0)));
  for (let i = 1; i < rows; i++) {
    for (let j = 1; j < cols; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + cost);
      if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) d[i][j] = Math.min(d[i][j], d[i - 2][j - 2] + 1);
    }
  }
  return d[a.length][b.length] <= 1;
}

function typoIntent(t: string): AskIntent | null {
  const words = t.split(/[^a-z]+/).filter((w) => w.length >= 5);
  for (const [intent, cues] of TYPO_CUES) {
    if (words.some((w) => cues.some((cue) => withinOneEdit(w, cue)))) return intent;
  }
  return null;
}

// Labels a question with rules only. Maps the same intents as the model, so Ask works with the model off.
export function keywordUnderstanding(question: string, mode: Mode): AskUnderstanding {
  const ask = screenAskSafety(question);
  const note = screenNoteSafety(question);
  if (ask.message || note.message) return { intent: "crisis" };
  if (ask.outOfScope || note.scope === "medical") return { intent: "medical_out_of_scope" };
  if (note.scope) return { intent: "other" }; // another person's data, or a request to change the rules

  const t = normalize(question);
  const intent = INTENT_RULES.find(([, pattern]) => pattern.test(t))?.[0] ?? typoIntent(t) ?? (ADVICE_QUESTION.test(t) ? "what_helped" : "other");
  if (NO_PARAMETER_INTENTS.includes(intent)) return { intent };

  const understanding: AskUnderstanding = { intent };
  const eventType = EVENT_WORDS[mode].find(([, pattern]) => pattern.test(t))?.[0];
  const timeBand = BAND_WORDS.find(([, pattern]) => pattern.test(t))?.[0];
  const days = daysOf(t);
  if (eventType) understanding.eventType = eventType;
  if (timeBand) understanding.timeBand = timeBand;
  if (days) understanding.days = days;
  return understanding;
}

// ---------- model call ----------

// Asks the fast model for a label. Falls back to the keyword router in mock mode, when the call fails,
// and when the reply is not a valid label with valid parameters. Never throws.
export async function understandQuestion(question: string, mode: Mode): Promise<{ understanding: AskUnderstanding; source: "model" | "fallback" }> {
  const fallback = () => ({ understanding: keywordUnderstanding(question, mode), source: "fallback" as const });
  if (mocksEnabled()) return fallback();
  try {
    const reply = await callClaude({
      system: ASK_ROUTER_SYSTEM,
      messages: [{ role: "user", content: buildAskRouterUserMessage({ mode, question }) }],
      model: process.env.ANTHROPIC_MODEL_FAST || DEFAULT_FAST_MODEL,
      maxTokens: ROUTER_MAX_TOKENS,
      timeoutMs: ROUTER_TIMEOUT_MS,
      maxRetries: 0,
      label: "ask_router",
    });
    const understanding = parseRouterReply(reply.text, mode);
    if (!understanding) {
      console.warn("[ask_router] reply was not a valid label, using the keyword router");
      return fallback();
    }
    return { understanding, source: "model" };
  } catch (err) {
    if (!(err instanceof AiError)) console.error("[ask_router] failed:", err instanceof Error ? err.message : err);
    return fallback();
  }
}

// ---------- the whole Ask flow with the router on ----------

function fixedAnswer(intent: AskIntent, answer: string): AskResponse {
  return { redFlag: false, redFlagMessage: null, answer, evidence: [], relatedPatternKeys: [], dataSufficient: true, intent };
}

// Step 1. The rules /api/ask has today (src/mocks/safety.ts) give exactly today's response. Then the wider
// note screen (src/lib/safety.ts: Spanish and Hindi crisis words, another person's data, role changes) catches
// what those rules miss. Fixed messages only. Returns null when nothing was triggered.
export function safetyAnswer(req: AskRequest, person: Person, allEvents: LogRecord[]): AskResponse | null {
  const ask = screenAskSafety(req.question);
  if (ask.message) return { ...buildSafetyAnswer(req, person, allEvents), intent: "crisis" };
  if (ask.outOfScope) return { ...buildSafetyAnswer(req, person, allEvents), intent: "medical_out_of_scope" };

  const note = screenNoteSafety(req.question);
  if (note.message) {
    if (note.caregiverDistress) {
      return {
        redFlag: true,
        redFlagMessage: note.message,
        answer: "Your own wellbeing comes first right now. The logs can wait.",
        evidence: [],
        relatedPatternKeys: [],
        dataSufficient: true,
        intent: "crisis",
      };
    }
    const flagged = eventsInWindow(allEvents.filter((e) => e.personId === person.id), WINDOW_DAYS).filter((e) => e.redFlags.length > 0);
    return {
      redFlag: true,
      redFlagMessage: note.message,
      answer:
        `This is something for your doctor or care team to look at, so Unspoken will not guess at a reason. ` +
        `You can share ${person.displayName}'s log with them to show what happened and when.`,
      evidence:
        flagged.length > 0
          ? [{ text: `${flagged.length} saved ${flagged.length === 1 ? "entry mentions" : "entries mention"} a red flag in the last 3 weeks.`, eventIds: flagged.map((e) => e.id) }]
          : [],
      relatedPatternKeys: [],
      dataSufficient: true,
      intent: "crisis",
    };
  }
  if (note.scope === "medical") return fixedAnswer("medical_out_of_scope", OUT_OF_SCOPE_MESSAGE);
  if (note.scope) return fixedAnswer("other", SCOPE_MESSAGES[note.scope]);
  return null;
}

// POST /api/ask with FEATURE_ASK_ROUTER on. `allEvents` may hold every person's entries; only the selected
// person's are read. Never throws: any failure after the safety step ends in the keyword router and templates.
export async function askWithRouter(req: AskRequest, person: Person, allEvents: LogRecord[]): Promise<{ response: AskResponse; source: AskSource }> {
  const safety = safetyAnswer(req, person, allEvents);
  if (safety) return { response: { ...safety, source: "safety" }, source: "safety" };

  const { understanding, source } = await understandQuestion(req.question, person.mode);

  if (understanding.intent === "crisis") {
    const response: AskResponse = {
      redFlag: true,
      redFlagMessage: ROUTER_CRISIS_MESSAGE,
      answer: ROUTER_CRISIS_ANSWER,
      evidence: [],
      relatedPatternKeys: [],
      dataSufficient: true,
      intent: "crisis",
      source,
    };
    return { response, source };
  }
  if (understanding.intent === "medical_out_of_scope") {
    return { response: { ...fixedAnswer("medical_out_of_scope", OUT_OF_SCOPE_MESSAGE), source }, source };
  }

  const mine = allEvents.filter((e) => e.personId === person.id);
  const patterns = computePatterns(person.id, mine);
  return { response: { ...answerFor(understanding, person, mine, patterns, undefined, req.question), source }, source };
}
