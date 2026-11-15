// Visit and handoff summary (docs/AI_FEATURES.md, Feature 1). Server only.
// Order: code builds the facts, code writes the safety notes (fixed wording), the model writes the sections,
// code checks the draft, one retry with the failure reasons, then the code-written fallback.
// The model never supplies a number, an entry id, or a safety line.
import { z } from "zod";
import { AiError, callClaude, parseJson, type ClaudeMessage } from "@/lib/ai";
import { mocksEnabled } from "@/lib/env";
import {
  allowedNumbers, buildSummaryFacts, factsForModel, MIN_ENTRIES_FOR_SUMMARY, windowLengths, type PatternFact, type SummaryFacts, type TriedFact,
} from "@/lib/summaryFacts";
import {
  checkHeadings, checkNoCause, checkNoCompliance, checkNoDiagnosis, checkNoLeak, checkNoMedication, checkNumbers, checkQuestions, checkQuotes,
  checkWordLimit, sameHeading, stripDashes, withoutQuotedSpans, type TextIssue,
} from "@/lib/textChecks";
import type { SummaryAudience, SummaryRequest, SummaryResponse, SummarySection } from "@/lib/types";
import {
  buildSummaryRetryMessage, buildSummaryUserMessage, maxQuestionsFor, requiredHeadings, SUMMARY_HEADINGS, SUMMARY_SYSTEM, wordLimitFor,
} from "@/prompts/summary";

export const SUMMARY_DISCLAIMER = "Written from caregiver logs. Not a diagnosis. Discuss with your care team.";
const CARE_TEAM_LINE = "Please contact your doctor or care team about this if you have not already.";
const EMERGENCY_LINE = "If anything like this is happening now, call 911 now.";
const MAX_SAFETY_NOTES = 6;

const ATTEMPT_TIMEOUT_MS = 22_000;
// The browser gives up after 30 s (src/lib/api.ts), so both attempts together must finish before that.
const TOTAL_BUDGET_MS = 27_000;
const MIN_RETRY_MS = 5_000;

export const summaryRequestSchema = z.object({
  mode: z.enum(["dementia", "autism"]),
  personId: z.string().min(1).max(60),
  audience: z.enum(["doctor", "therapist_school", "caregiver_handoff"]),
  days: z.union([z.literal(7), z.literal(14), z.literal(30)]),
});

// What the model returns. Ids, title, safety notes and the disclaimer are added by code.
export const summaryDraftSchema = z.object({
  sections: z.array(z.object({ heading: z.string().trim().min(1).max(80), text: z.string().trim().min(1).max(3000) })).min(1).max(8),
  questionsToAsk: z
    .array(z.unknown())
    .catch([])
    .transform((items) => items.filter((v): v is string => typeof v === "string" && v.trim().length > 0).map((v) => v.trim())),
});
export type SummaryDraft = z.infer<typeof summaryDraftSchema>;

// ---------------------------------------------------------------------------
// Safety notes: fixed wording, generated in code from the red-flag entries. Never model-written.
// ---------------------------------------------------------------------------
const FLAG_PHRASE: Record<string, string> = {
  fall: "a fall",
  injury: "an injury",
  head_banging: "head banging",
  self_injury: "self-injury",
  sudden_change: "a sudden change",
  signs_of_illness: "signs of illness",
  signs_of_pain_severe: "signs of severe pain",
  not_eating_days: "not eating for days",
};
const PLURAL_FLAGS = new Set(["signs_of_illness", "signs_of_pain_severe"]);

function joinWords(items: string[]): string {
  if (items.length <= 1) return items[0] ?? "";
  if (items.length === 2) return `${items[0]} and ${items[1]}`;
  return `${items.slice(0, -1).join(", ")}, and ${items[items.length - 1]}`;
}

const capital = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
const times = (n: number) => `${n} ${n === 1 ? "time" : "times"}`;
const entries = (n: number) => `${n} ${n === 1 ? "entry" : "entries"}`;

export function buildSafetyNotes(facts: SummaryFacts): SummaryResponse["safetyNotes"] {
  const notes = facts.redFlags.slice(0, MAX_SAFETY_NOTES).map((r) => {
    // Head banging already implies self-injury; one phrase is enough.
    const flags = r.flags.filter((f) => FLAG_PHRASE[f] && !(f === "self_injury" && r.flags.includes("head_banging")));
    const phrases = flags.map((f) => FLAG_PHRASE[f]);
    const subject = phrases.length ? capital(joinWords(phrases)) : "A red flag";
    const verb = phrases.length > 1 || flags.some((f) => PLURAL_FLAGS.has(f)) ? "were" : "was";
    const text = `${subject} ${verb} logged on ${r.dateLabel}. ${CARE_TEAM_LINE}${r.emergency ? ` ${EMERGENCY_LINE}` : ""}`;
    return { text, eventIds: [r.eventId] };
  });
  const rest = facts.redFlags.slice(MAX_SAFETY_NOTES);
  if (rest.length > 0) {
    notes.push({
      text: `${rest.length} more ${rest.length === 1 ? "entry" : "entries"} in this period ${rest.length === 1 ? "was" : "were"} also flagged. ${CARE_TEAM_LINE}`,
      eventIds: rest.map((r) => r.eventId),
    });
  }
  return notes;
}

// ---------------------------------------------------------------------------
// Entry ids per section. Always attached by code from the facts.
// ---------------------------------------------------------------------------
function unique(ids: string[]): string[] {
  return [...new Set(ids)];
}

export function eventIdsForHeading(heading: string, facts: SummaryFacts): string[] {
  if (sameHeading(heading, SUMMARY_HEADINGS.helped)) return unique(facts.helpedLastTime.map((h) => h.eventId));
  if (sameHeading(heading, SUMMARY_HEADINGS.before)) return unique(facts.patterns.flatMap((p) => p.eventIds));
  if (sameHeading(heading, SUMMARY_HEADINGS.tried)) return unique([...facts.tried.flatMap((t) => t.eventIds), ...(facts.remedyReported?.eventIds ?? [])]);
  if (sameHeading(heading, SUMMARY_HEADINGS.who)) {
    const cross = facts.patterns.filter((p) => p.crossCount > 0);
    return cross.length ? unique(cross.flatMap((p) => [...p.crossEventIds, ...p.eventIds])) : facts.eventIds;
  }
  return facts.eventIds;
}

// ---------------------------------------------------------------------------
// Code-written fallback: the same sections from templates. Used in mock mode and whenever the model
// fails or its draft does not pass the checks.
// ---------------------------------------------------------------------------
function countList(items: { label: string; count: number }[], max: number): string {
  return joinWords(items.slice(0, max).map((c) => `${c.label.toLowerCase()} (${c.count})`));
}

function patternSentence(p: PatternFact): string {
  return `${p.what} ${p.link} ${p.context} on ${p.matchCount} of ${p.totalCount} occasions in the last ${p.windowDays} days.`;
}

function triedSentence(t: TriedFact): string {
  const parts = [
    t.helped > 0 ? `helped ${times(t.helped)}` : "",
    t.helpedALittle > 0 ? `helped a little ${times(t.helpedALittle)}` : "",
    t.didNotHelp > 0 ? `did not help ${times(t.didNotHelp)}` : "",
    t.notSure > 0 ? `no result noted ${times(t.notSure)}` : "",
  ].filter(Boolean);
  return `${t.label}: tried ${times(t.timesTried)}, ${joinWords(parts)}.`;
}

export function fallbackDraft(facts: SummaryFacts): SummaryDraft {
  const brief = facts.audience === "caregiver_handoff";
  const name = facts.personName;
  const sections: { heading: string; text: string }[] = [];

  if (brief) {
    const last = facts.helpedLastTime[0];
    sections.push({
      heading: SUMMARY_HEADINGS.helped,
      text: last
        ? `Most recent: for ${last.what.toLowerCase()}, ${joinWords(last.tried.map((t) => t.toLowerCase()))} ${last.result}.`
        : "No entry in this period says what helped.",
    });
  }

  // What we have seen
  let seen = `In the last ${facts.windowDays} days, caregivers logged ${entries(facts.totalEntries)} for ${name}. Most common: ${countList(facts.byEventType, brief ? 2 : 3)}.`;
  if (!brief) {
    seen += ` By time of day: ${countList(facts.byTimeBand, 3)}.`;
    const quote = facts.quotes[0];
    if (quote) seen += ` In ${quote.caregiver}'s words: "${quote.text}"`;
  }
  sections.push({ heading: SUMMARY_HEADINGS.seen, text: seen });

  // What usually comes before
  const shown = facts.patterns.slice(0, brief ? 1 : 3);
  sections.push({
    heading: SUMMARY_HEADINGS.before,
    text: shown.length
      ? `${shown.map(patternSentence).join(" ")} ${brief ? "A pattern in the logs, not a cause." : "These are patterns in the logs, not causes."}`
      : "No repeated pattern shows in the logs yet. A pattern needs several similar entries.",
  });

  // What was tried and how it went
  const triedShown = facts.tried.slice(0, brief ? 2 : 4);
  let tried = triedShown.length ? triedShown.map(triedSentence).join(" ") : "Nothing that was tried has been logged in this period.";
  if (!brief && triedShown.length && facts.triedUsesOverallOutcome) tried += " Where a step was not rated on its own, the result of the whole entry is used.";
  if (facts.remedyReported) tried += ` A remedy or medicine was reported as given ${times(facts.remedyReported.count)}. This is noted as a fact only.`;
  sections.push({ heading: SUMMARY_HEADINGS.tried, text: tried });

  // Who saw what
  let who = `${joinWords(facts.caregivers.slice(0, 4).map((c, i) => (i === 0 || !brief ? `${c.label} logged ${entries(c.count)}` : `${c.label} ${c.count}`)))}.`;
  for (const p of facts.patterns.filter((x) => x.crossCount > 0).slice(0, brief ? 1 : 2)) {
    who += ` On ${p.crossCount} of the ${p.matchCount} days when ${p.what.toLowerCase()} ${p.link} ${p.context}, ${joinWords(p.crossNames)} had logged the earlier clue.`;
  }
  sections.push({ heading: SUMMARY_HEADINGS.who, text: who });

  // Questions: built from the patterns, never conclusions.
  const questions: string[] = [];
  const school = facts.audience === "therapist_school";
  for (const p of facts.patterns.slice(0, brief ? 1 : 2)) {
    if (brief) questions.push(`Has there been ${p.context} in the last day?`);
    else if (school) questions.push(`What support could be tried when ${p.what.toLowerCase()} ${p.link === "came after" ? "comes after" : "happens around"} ${p.context}?`);
    else questions.push(`What should we check when ${p.what.toLowerCase()} ${p.link === "came after" ? "comes after" : "happens around"} ${p.context}?`);
  }
  if (!brief && facts.redFlags.length > 0) questions.push("What should we watch for after the entries flagged at the top?");
  questions.push(brief ? "Is there anything from today that I should know?" : "Is there anything else we should be writing down?");

  return { sections, questionsToAsk: questions.slice(0, maxQuestionsFor(facts.audience)) };
}

function tooLittleData(facts: SummaryFacts): SummaryDraft {
  const n = facts.totalEntries;
  const seen =
    n === 0
      ? `There are no entries for ${facts.personName} in the last ${facts.windowDays} days.`
      : `There ${n === 1 ? "is" : "are"} ${entries(n)} for ${facts.personName} in the last ${facts.windowDays} days. That is too few to write a summary from.`;
  return {
    sections: [
      { heading: SUMMARY_HEADINGS.seen, text: seen },
      {
        heading: "What to log next",
        text: `Log each hard moment when it happens: what you saw, the time, what came before (meals, sleep, visits, changes in routine), what you tried, and how it went. A summary can be written once there are ${MIN_ENTRIES_FOR_SUMMARY} or more entries in this period.`,
      },
    ],
    questionsToAsk: [],
  };
}

// ---------------------------------------------------------------------------
// Checks on a draft, before anyone sees it.
// ---------------------------------------------------------------------------
export interface DraftContext {
  audience: SummaryAudience;
  allowedNumbers: number[];
  windowDays: number[];
  quotes: string[]; // the only words that may appear inside quotation marks
  forbiddenNames: string[];
}

export function contextFor(facts: SummaryFacts): DraftContext {
  return {
    audience: facts.audience,
    allowedNumbers: allowedNumbers(factsForModel(facts)),
    windowDays: windowLengths(facts),
    quotes: facts.quotes.map((q) => q.text),
    forbiddenNames: facts.otherPeopleNames,
  };
}

// Removes dashes, keeps only the required sections (in the required order), and trims the question list.
export function tidyDraft(draft: SummaryDraft, audience: SummaryAudience): SummaryDraft {
  const required = requiredHeadings(audience);
  const cleaned = draft.sections.map((s) => ({ heading: stripDashes(s.heading).trim(), text: stripDashes(s.text).trim() }));
  const kept = required.flatMap((r) => {
    const found = cleaned.find((s) => sameHeading(s.heading, r));
    return found ? [{ heading: r, text: found.text }] : [];
  });
  return {
    sections: kept,
    questionsToAsk: draft.questionsToAsk.map((q) => stripDashes(q).trim()).filter(Boolean).slice(0, maxQuestionsFor(audience)),
  };
}

export function checkDraft(draft: SummaryDraft, ctx: DraftContext): TextIssue[] {
  const body = draft.sections.map((s) => s.text).join("\n");
  const questions = draft.questionsToAsk.join("\n");
  const all = `${body}\n${questions}`;
  // The caregivers' own words may hold a clock time or the word "because". They are checked as quotes, not as claims.
  const unquoted = withoutQuotedSpans(all);
  const issues = [
    checkHeadings(draft.sections.map((s) => s.heading), requiredHeadings(ctx.audience)),
    checkQuotes(all, ctx.quotes),
    checkNumbers(unquoted, ctx.allowedNumbers, ctx.windowDays),
    checkNoDiagnosis(all),
    checkNoMedication(all),
    checkNoCause(withoutQuotedSpans(body)),
    checkNoCompliance(all),
    checkNoLeak(all, ctx.forbiddenNames),
    checkWordLimit(all, wordLimitFor(ctx.audience)),
    checkQuestions(draft.questionsToAsk),
  ];
  return issues.filter((i): i is TextIssue => i !== null);
}

// ---------------------------------------------------------------------------
// writeSummary
// ---------------------------------------------------------------------------
export interface SummaryDeps {
  // Sends the conversation to the model and returns its reply text. Tests pass a stand-in.
  callModel?: (messages: ClaudeMessage[], timeoutMs: number) => Promise<string>;
  // Overrides USE_MOCKS (tests only).
  useModel?: boolean;
  // Receives one line per step, for logs and tests.
  onStep?: (step: string) => void;
}

async function defaultCallModel(messages: ClaudeMessage[], timeoutMs: number): Promise<string> {
  const reply = await callClaude({
    system: SUMMARY_SYSTEM, // cached by callClaude (cache_control on the system block)
    messages,
    model: process.env.ANTHROPIC_MODEL_SUMMARY || undefined,
    maxTokens: 3000,
    timeoutMs,
    maxRetries: 0,
    label: "summary",
  });
  return reply.text;
}

function parseDraft(text: string): SummaryDraft {
  const parsed = summaryDraftSchema.safeParse(parseJson(text));
  if (!parsed.success) throw new AiError("Summary reply did not match the output shape.", "bad_json");
  return parsed.data;
}

function assemble(facts: SummaryFacts, draft: SummaryDraft, source: "model" | "fallback", dataSufficient: boolean): SummaryResponse {
  const sections: SummarySection[] = draft.sections.map((s) => ({ heading: s.heading, text: s.text, eventIds: eventIdsForHeading(s.heading, facts) }));
  return {
    safetyNotes: buildSafetyNotes(facts),
    title: `${facts.personName}: last ${facts.windowDays} days`,
    sections,
    questionsToAsk: draft.questionsToAsk,
    dataSufficient,
    source,
    disclaimer: SUMMARY_DISCLAIMER,
  };
}

// Same facts in, same summary out, with no second model call. Keyed by the facts themselves, so a new
// entry (or a new day) makes a new key. Only model-written summaries are kept; the fallback is instant anyway.
const cache = (() => {
  const g = globalThis as unknown as { __caresignalSummaryCache?: Map<string, SummaryDraft> };
  g.__caresignalSummaryCache ??= new Map<string, SummaryDraft>();
  return g.__caresignalSummaryCache;
})();
const MAX_CACHED = 60;

// Returns null when there is no such person.
export async function writeSummary(req: SummaryRequest, deps: SummaryDeps = {}): Promise<SummaryResponse | null> {
  const step = deps.onStep ?? (() => {});
  const facts = buildSummaryFacts(req.personId, req.days, req.audience);
  if (!facts) return null;

  if (facts.totalEntries < MIN_ENTRIES_FOR_SUMMARY) {
    step("too little data: code-written explanation");
    return assemble(facts, tooLittleData(facts), "fallback", false);
  }

  const fallback = () => assemble(facts, fallbackDraft(facts), "fallback", true);
  const useModel = deps.useModel ?? !mocksEnabled();
  if (!useModel) {
    step("mock mode: fallback");
    return fallback();
  }

  const modelFacts = factsForModel(facts);
  const ctx = contextFor(facts);
  const userMessage = buildSummaryUserMessage({ audience: facts.audience, facts: modelFacts, quotes: facts.quotes.map((q) => ({ by: q.caregiver, words: q.text })) });
  const cacheKey = `${facts.personId}|${userMessage}`;
  const cached = deps.callModel ? undefined : cache.get(cacheKey);
  if (cached) {
    step("served from the summary cache");
    return assemble(facts, cached, "model", true);
  }

  const callModel = deps.callModel ?? defaultCallModel;
  const started = Date.now();
  const messages: ClaudeMessage[] = [{ role: "user", content: userMessage }];

  for (let attempt = 1; attempt <= 2; attempt++) {
    const remaining = TOTAL_BUDGET_MS - (Date.now() - started);
    if (attempt === 2 && remaining < MIN_RETRY_MS) {
      step("no time left for a retry: fallback");
      break;
    }
    let reasons: string[];
    let replyText = "";
    try {
      replyText = await callModel(messages, Math.min(ATTEMPT_TIMEOUT_MS, remaining));
      const draft = tidyDraft(parseDraft(replyText), facts.audience);
      const issues = checkDraft(draft, ctx);
      if (issues.length === 0) {
        step(`attempt ${attempt}: accepted`);
        if (!deps.callModel) {
          if (cache.size >= MAX_CACHED) cache.delete(cache.keys().next().value as string);
          cache.set(cacheKey, draft);
        }
        return assemble(facts, draft, "model", true);
      }
      reasons = issues.map((i) => `${i.check}: ${i.reason}`);
    } catch (err) {
      if (err instanceof AiError && err.code === "bad_json") {
        reasons = ["format: the reply was not the JSON object described under Output"];
      } else {
        // The model could not be reached (no key, timeout, 429, 5xx). A second call would only make the caregiver wait longer.
        if (!(err instanceof AiError)) console.error("[summary] model call failed:", err instanceof Error ? err.message : err);
        step(`attempt ${attempt}: model call failed: fallback`);
        break;
      }
    }
    step(`attempt ${attempt}: rejected (${reasons.join(" | ")})`);
    console.log(`[summary] ${JSON.stringify({ attempt, rejected: reasons.map((r) => r.split(":")[0]) })}`);
    if (attempt === 2) break;
    messages.push({ role: "assistant", content: replyText || "(no usable reply)" }, { role: "user", content: buildSummaryRetryMessage(reasons) });
  }

  step("fallback");
  return fallback();
}
