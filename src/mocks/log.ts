// Mock for POST /api/log (parse only, never saves).
// Order: caregiver distress, cached demo phrases, safety screen, scope, generic draft.
// The generic draft is a keyword pass, not AI. Lane 2 replaces it with the formatter.
import type { LogRecord, Mode, ParseLogRequest, ParseLogResponse, Person } from "../lib/types";
import { addDays, bandForHour, isoAt, nowIso, wallParts, type WallParts } from "../lib/time";
import { DISTRESS_MESSAGE, normalize, OUT_OF_SCOPE_MESSAGE, screenSafety } from "./safety";

type Draft = Omit<LogRecord, "id" | "loggedAt">;

function demoKey(text: string): string {
  return normalize(text).replace(/[^a-z0-9 ]/g, "").replace(/\s+/g, " ").trim();
}

// Cached demo phrases from docs/PRD.md section 9.
export const DEMO_PHRASES = {
  D1: "Mom was agitated around 3, pacing and calling out for Dad. She barely ate lunch. A snack and some music helped, she settled after 20 minutes.",
  D2: "Rosa here, Helen only ate half her lunch today, she seemed tired.",
  A1: "Arjun had a big meltdown before school, he slept badly and we had a substitute driver today.",
} as const;

function clock(now: string): WallParts {
  return wallParts(now) ?? (wallParts(nowIso()) as WallParts);
}

// A wall-clock time today; if that is still more than an hour ahead, use yesterday.
function resolveToday(now: WallParts, hour: number, minute: number): string {
  const ahead = hour * 60 + minute - (now.hour * 60 + now.minute);
  const date = ahead > 60 ? addDays(now.date, -1) : now.date;
  return isoAt(date, hour, minute, now.offset);
}

function cachedDraft(req: ParseLogRequest): Draft | null {
  const key = demoKey(req.transcript);
  const now = clock(req.now);
  if (key === demoKey(DEMO_PHRASES.D1)) {
    return {
      mode: "dementia", personId: "p_helen", loggedBy: req.loggedBy,
      occurredAt: resolveToday(now, 15, 0), timeBand: "afternoon", source: "voice",
      eventType: "agitation", behaviors: ["pacing", "calling_out"], intensity: 2, durationMin: 20,
      contextBefore: ["skipped_meal"], environment: [], responseTried: ["offered_snack", "music"],
      outcome: "calmed", rawNote: req.transcript.trim(),
      confidence: { eventType: 0.95, occurredAt: 0.8, intensity: 0.6 },
      needsReview: ["intensity"], redFlags: [],
    };
  }
  if (key === demoKey(DEMO_PHRASES.D2)) {
    return {
      mode: "dementia", personId: "p_helen", loggedBy: "cg_rosa",
      occurredAt: resolveToday(now, 11, 45), timeBand: "morning", source: "voice",
      eventType: "refused_food", behaviors: [], intensity: 1, durationMin: null,
      contextBefore: [], environment: ["mealtime"], responseTried: [],
      outcome: "unknown", rawNote: req.transcript.trim(),
      confidence: { eventType: 0.9, occurredAt: 0.55, intensity: 0.7 },
      needsReview: ["occurredAt"], redFlags: [],
    };
  }
  if (key === demoKey(DEMO_PHRASES.A1)) {
    return {
      mode: "autism", personId: "p_arjun", loggedBy: req.loggedBy,
      occurredAt: resolveToday(now, 8, 15), timeBand: "morning", source: "voice",
      eventType: "meltdown", behaviors: [], intensity: 3, durationMin: null,
      contextBefore: ["poor_sleep", "routine_change"], environment: ["school"], responseTried: [],
      outcome: "unknown", rawNote: req.transcript.trim(),
      confidence: { eventType: 0.96, occurredAt: 0.6, intensity: 0.85 },
      needsReview: ["occurredAt"], redFlags: [],
    };
  }
  return null;
}

const EVENT_KEYWORDS: Record<Mode, [RegExp, string][]> = {
  dementia: [
    [/\bwander|\bwalked out\b|\bleft the house\b|\bgot out\b/, "wandering"],
    [/\b(refus\w+|would ?n'?t|did ?n'?t want|said no to) (her |his |the |a |to )?(shower|bath\w*|wash\w*|dress\w*|chang\w*|care|brush\w*)/, "refused_care"],
    [/\b(barely|hardly|only) ate\b|\b(would ?n'?t|did ?n'?t|refus\w+ to) eat\b|\bskipped (lunch|breakfast|dinner)\b|\bate (half|little|nothing)\b|\bno appetite\b/, "refused_food"],
    [/\b(woke|awake|up) (at|around|all|in the|during the) (night|\d)|\b(could ?n'?t|did ?n'?t) sleep\b|\bup all night\b/, "sleep_disturbance"],
    [/\bcry|\bcried\b|\btear(s|ful)\b|\bweep/, "crying"],
    [/\bagitat|\bupset\b|\bworked up\b|\bangry\b|\bshout|\byell/, "agitation"],
    [/\bcalling out\b|\bcalled out\b|\bkept asking\b/, "calling_out"],
    [/\brestless|\bunsettled\b|\bcould ?n'?t settle\b|\bpacing\b|\bfidget/, "restlessness"],
  ],
  autism: [
    [/\bmeltdown|\bmelted down\b|\bfell apart\b/, "meltdown"],
    [/\bshut ?down|\bwent quiet\b|\bstopped talking\b|\bwould ?n'?t (talk|respond)\b/, "shutdown"],
    [/\bran (off|away|out)\b|\bbolted\b|\brunning (off|away)\b/, "elopement"],
    [/\b(hit|hitting|kicked|kicking|(?<!a |little )bit|biting|pushed|threw|throwing)\b/, "aggression"],
    [/\b(woke|awake|up) (at|around|all|in the|during the) (night|\d)|\b(could ?n'?t|did ?n'?t) sleep\b|\bup all night\b/, "sleep_trouble"],
    [/\b(would ?n'?t|did ?n'?t|refus\w+ to) eat\b|\bpushed (his|her) (food|plate|dinner)\b/, "food_refusal"],
    [/\bstimm|\bflapping\b|\brocking\b|\bhumming\b/, "stimming_increase"],
    [/\btransition|\bleaving\b|\bswitching\b|\bstop(ping)? (his|her|the) (game|show|tablet)\b/, "transition_distress"],
    [/\bupset\b|\bscream|\bcry|\bcried\b|\bhard (morning|day|time)\b/, "meltdown"],
  ],
};

// Hurting their own body is never "aggression" and never "biting" or "hitting" (those mean toward someone else).
const SELF_BITE = /\b(bit|bite|bites|biting|chew\w*) (on )?(her|his|their) (own )?(hand|hands|arm|arms|finger|fingers|wrist|wrists|lip|lips)\b|\b(bit|biting) (him|her|them)sel(f|ves)\b/g;
const SELF_HIT = /\b(hit|hits|hitting|slap\w*|punch\w*) (her|his|their) (own )?(face|leg|legs|arm|arms|chest|thigh|thighs)\b|\b(hit|hitting) (him|her|them)sel(f|ves)\b/g;

const BEHAVIOR_KEYWORDS: [RegExp, string][] = [
  [/\bflapp\w*|\bshaking (her|his|their) (hands|arms|legs)\b/, "body_movement"],
  [/\bpac(ing|ed)\b/, "pacing"],
  [/\bcall(ing|ed) out\b/, "calling_out"],
  [/\bcry|\bcried\b|\btears\b/, "crying"],
  [/\bhit(ting)?\b/, "hitting"],
  [/\bkick/, "kicking"],
  [/\bthrew\b|\bthrow/, "throwing"],
  [/\bscream/, "screaming"],
  [/\brock(ing|ed)\b/, "rocking"],
  [/\bcover\w* (his|her|their) ears\b/, "covering_ears"],
  [/\bwithdr[ae]w|\bwent quiet\b|\bhid\b/, "withdrawing"],
  [/\bover and over\b|\bkept (asking|saying|repeating)\b/, "repetitive_speech"],
  [/\bgrabb/, "grabbing"],
  [/(?<!a |little )\bbit(ing|e)?\b/, "biting"],
  [/\bran (off|away|out)\b|\bbolted\b/, "running_off"],
  [/\bbang\w* (his|her|their) (own )?head\b|\bhead[- ]?bang|\bhitting (his|her|their) (own )?head\b/, "head_banging"],
];

const CONTEXT_KEYWORDS: [RegExp, string][] = [
  [/\b(barely|hardly|only) ate\b|\bskipped (lunch|breakfast|dinner|a meal)\b|\bate (half|little|nothing)\b|\b(did ?n'?t|would ?n'?t) eat\b|\bsmall (lunch|breakfast|dinner)\b/, "skipped_meal"],
  [/\bwoke (up )?(in|at|around|during)\b|\bwoke up\b/, "woke_from_sleep"],
  [/\bslept (badly|poorly|terribly)\b|\b(bad|rough|poor) (night|sleep)\b|\b(did ?n'?t|could ?n'?t) sleep\b|\bup (half|all) (the )?night\b/, "poor_sleep"],
  [/\bsubstitute\b|\bdifferent (driver|teacher|aide|bus|route)\b|\bchange in routine\b|\broutine (was|changed)\b|\bschedule changed\b|\blate start\b/, "routine_change"],
  [/\bvisit|\bcompany\b|\bguests?\b|\bgrandkids\b/, "visitor"],
  [/\bbathroom\b|\btoilet\b/, "toileting_need"],
  [/\bshower\b|\bbath\b|\bbathing\b/, "bathing"],
  [/\b(new|unfamiliar) (aide|sitter|teacher|person|nurse)\b/, "new_person"],
  [/\b(tablet|screen|tv|show|game|ipad) (time )?(ended|was over|off)\b|\bturned off the (tv|tablet|ipad)\b/, "screen_time_ended"],
  [/\bloud\b|\bnoise\b|\bfire drill\b|\bvacuum\b/, "loud_noise"],
  [/\bcrowd/, "crowd"],
  [/\bscratchy\b|\btag on\b|\bsocks?\b/, "clothing_texture"],
  [/\bwait(ing|ed)\b/, "waiting"],
  [/\b(told|said) (him|her) no\b|\bcould ?n'?t have\b/, "denied_request"],
];

const ENVIRONMENT_KEYWORDS: [RegExp, string][] = [
  [/\bschool\b|\bbus\b/, "school"],
  [/\bcar\b|\bdriv(e|er|ing)\b/, "car"],
  [/\blunch\b|\bdinner\b|\bbreakfast\b|\bmeal/, "mealtime"],
  [/\bbedtime\b|\bbed\b/, "bedtime"],
  [/\bstore\b|\bpark\b|\brestaurant\b|\bappointment\b/, "outing"],
  [/\bnoisy\b|\bloud\b/, "noisy"],
];

const RESPONSE_KEYWORDS: [RegExp, string][] = [
  [/\bsnack\b|\bsomething to eat\b|\btoast\b|\bbanana\b/, "offered_snack"],
  [/\bdrink\b|\bwater\b|\btea\b|\bjuice\b|\bmilk\b/, "offered_drink"],
  [/\bquiet (room|space|corner|place)\b/, "quiet_space"],
  [/\breassur|\bsat with\b|\bheld (her|his) hand\b|\bcomfort/, "reassurance"],
  [/\bdistract|\bredirect|\bphoto album\b|\bpuzzle\b/, "redirect_activity"],
  [/\bmusic\b|\bsongs?\b|\bsang\b|\brecords\b/, "music"],
  [/\bfidget|\bheadphones\b|\bchew/, "sensory_tool"],
  [/\bschedule\b|\bpicture card/, "visual_schedule"],
  [/\bhug\b|\bsqueez|\bweighted\b|\bdeep pressure\b/, "deep_pressure"],
  [/\bbreak\b/, "break_time"],
  [/\bwalk\b/, "walk"],
  [/\bice\b|\bcold (pack|cloth|compress|towel)\b/, "cold_or_ice"],
  [/\bmassag|\brubb(ed|ing)\b/, "massage"],
  [/\b(hold|held|holding|put|pull|pulled|move|moved) (her|his|their) (hand|hands|arm|arms|leg|legs) (still|away|down)\b|\bforcefully\b/, "blocked_behavior"],
  // Only a report that something WAS given. A question about medicine never adds this.
  [/\b(gave|given|took|taken|had) .{0,40}\b(medicine|medication|remedy|drops|pills?|tablets?|homeopath\w*)\b/, "remedy_given"],
];

function collect(text: string, table: [RegExp, string][]): string[] {
  const out: string[] = [];
  for (const [pattern, value] of table) if (pattern.test(text) && !out.includes(value)) out.push(value);
  return out;
}

function matchPeople(text: string, roster: Person[]): Person[] {
  return roster.filter((p) =>
    p.aliases.some((alias) => new RegExp(`\\b${alias.toLowerCase().replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`).test(text)),
  );
}

function resolveTime(text: string, now: WallParts): { occurredAt: string; confidence: number } {
  let date = now.date;
  if (/\byesterday\b/.test(text)) date = addDays(date, -1);

  const explicit = /\b(?:around|at|about|by|near)\s+(\d{1,2})(?::(\d{2}))?\s*(am|pm|a\.m\.|p\.m\.)?/.exec(text);
  if (explicit) {
    let hour = Number(explicit[1]);
    const minute = explicit[2] ? Number(explicit[2]) : 0;
    const suffix = explicit[3]?.replace(/\./g, "");
    if (hour >= 1 && hour <= 12 && minute < 60) {
      if (suffix === "pm" && hour < 12) hour += 12;
      else if (suffix === "am" && hour === 12) hour = 0;
      else if (!suffix && hour >= 1 && hour <= 6) hour += 12; // "around 3" most often means the afternoon
      const iso = date === now.date ? resolveToday(now, hour, minute) : isoAt(date, hour, minute, now.offset);
      return { occurredAt: iso, confidence: suffix ? 0.9 : 0.6 };
    }
  }

  const rough: [RegExp, number, number, number][] = [
    [/\blast night\b/, 22, 0, -1],
    [/\bbefore school\b/, 8, 15, 0],
    [/\bafter school\b/, 15, 30, 0],
    [/\bthis morning\b|\bbreakfast\b/, 9, 0, 0],
    [/\blunch\b|\bnoon\b|\bmidday\b/, 12, 30, 0],
    [/\bafternoon\b/, 14, 30, 0],
    [/\bdinner\b|\bevening\b|\bsupper\b/, 18, 30, 0],
    [/\bbedtime\b|\btonight\b/, 20, 30, 0],
    [/\bmorning\b/, 9, 0, 0],
    [/\bnight\b/, 22, 0, 0],
  ];
  for (const [pattern, hour, minute, dayShift] of rough) {
    if (!pattern.test(text)) continue;
    const d = addDays(date, dayShift);
    const iso = d === now.date ? resolveToday(now, hour, minute) : isoAt(d, hour, minute, now.offset);
    return { occurredAt: iso, confidence: 0.55 };
  }

  // No time words: assume it just happened.
  return { occurredAt: isoAt(date, now.hour, now.minute, now.offset), confidence: date === now.date ? 0.75 : 0.5 };
}

function genericDraft(req: ParseLogRequest, roster: Person[], redFlags: string[]) {
  const text = normalize(req.transcript);
  const now = clock(req.now);
  const confidence: Record<string, number> = {};

  const matched = matchPeople(text, roster);
  const unmatchedPerson = matched.length === 0;
  const candidates = matched.length === 1 ? [] : matched.length > 1 ? matched : roster;
  confidence.personId = matched.length === 1 ? 0.95 : 0.4;

  const selfBite = new RegExp(SELF_BITE.source).test(text);
  const selfHit = new RegExp(SELF_HIT.source).test(text);
  // Event type is read with self-directed phrases removed, so self-injury is not logged as aggression.
  const eventText = text.replace(SELF_BITE, " ").replace(SELF_HIT, " ");
  const hit = EVENT_KEYWORDS[req.mode].find(([pattern]) => pattern.test(eventText));
  const eventType = hit ? hit[1] : req.mode === "dementia" ? "agitation" : "meltdown";
  confidence.eventType = hit ? 0.8 : 0.35;

  let intensity: 1 | 2 | 3 = 2;
  confidence.intensity = 0.5;
  if (/\b(severe|big|huge|worst|really bad|very bad|terrible|extreme|major)\b/.test(text)) {
    intensity = 3;
    confidence.intensity = 0.85;
  } else if (
    // "calmed down a little bit" describes how it ended, not how strong it was.
    /\b(mild|a little|a bit|slightly|minor|small|briefly)\b/.test(
      text.replace(/\b(calm\w*( down)?|settled?( down)?|helped|better|eased|relaxed) (a little bit|a little|a bit|slightly)\b/g, " "),
    )
  ) {
    intensity = 1;
    confidence.intensity = 0.8;
  } else if (/\b(moderate|pretty|quite|fairly)\b/.test(text)) {
    confidence.intensity = 0.8;
  }

  let durationMin: number | null = null;
  const mins = /\b(\d{1,3})\s*(min|mins|minutes)\b/.exec(text);
  const hours = /\b(\d{1,2})\s*(hour|hours|hrs?)\b/.exec(text);
  if (mins) durationMin = Number(mins[1]);
  else if (hours) durationMin = Number(hours[1]) * 60;
  else if (/\bhalf an hour\b/.test(text)) durationMin = 30;
  else if (/\ban hour\b/.test(text)) durationMin = 60;

  const time = resolveTime(text, now);
  confidence.occurredAt = time.confidence;
  const hour = wallParts(time.occurredAt)?.hour ?? now.hour;

  let outcome: LogRecord["outcome"] = "unknown";
  if (/\b(worse|escalat\w+|did ?n'?t help|nothing helped)\b/.test(text)) outcome = "escalated";
  else if (/\b(a bit better|a little better|somewhat|partly|kind of settled)\b/.test(text)) outcome = "partly_calmed";
  else if (/\b(calm\w*|settled|helped|relaxed|better|fine after|ok after|okay after)\b/.test(text)) outcome = "calmed";

  // "Hitting his head" is head banging, not hitting someone else.
  let behaviors = collect(text, BEHAVIOR_KEYWORDS);
  if (behaviors.includes("head_banging")) {
    behaviors = behaviors.filter((b) => b !== "hitting");
    confidence.eventType = Math.min(confidence.eventType, 0.5);
  }
  if (selfBite) behaviors = [...behaviors.filter((b) => b !== "biting" || /(?<!a |little )\bbit(ing|e)?\b/.test(eventText)), "self_biting"];
  if (selfHit) behaviors = [...behaviors.filter((b) => b !== "hitting" || /\bhit(ting)?\b/.test(eventText)), "self_hitting"];
  if ((selfBite || selfHit) && !redFlags.includes("self_injury")) redFlags = [...redFlags, "self_injury"];

  const needsReview = ["personId", "eventType", "intensity", "occurredAt"].filter((f) => confidence[f] < 0.7);

  const draft: Draft = {
    mode: req.mode,
    personId: matched[0]?.id ?? "",
    loggedBy: req.loggedBy,
    occurredAt: time.occurredAt,
    timeBand: bandForHour(hour),
    source: "text",
    eventType,
    behaviors,
    intensity,
    durationMin,
    contextBefore: collect(text, CONTEXT_KEYWORDS),
    environment: collect(text, ENVIRONMENT_KEYWORDS),
    responseTried: collect(text, RESPONSE_KEYWORDS),
    // Keyword rules cannot tell which step did what, so every result is unknown.
    responses: collect(text, RESPONSE_KEYWORDS).map((tag) => ({ tag, result: "unknown" as const })),
    outcome,
    rawNote: req.transcript.trim(),
    confidence,
    needsReview,
    redFlags,
  };
  const hasEventContent = Boolean(hit) || behaviors.length > 0;
  return { draft, unmatchedPerson, candidates, hasEventContent };
}

export function mockLog(req: ParseLogRequest, roster: Person[]): ParseLogResponse {
  const safety = screenSafety(req.transcript);

  // 1. The caregiver is the one in distress: care and 988, nothing is logged.
  if (safety.caregiverDistress) {
    return { kind: "caregiver_distress", message: DISTRESS_MESSAGE, draft: null, unmatchedPerson: false, candidates: [] };
  }

  // 2. Cached demo phrases.
  const cached = cachedDraft(req);
  if (cached) {
    return { kind: "event", message: null, draft: cached, unmatchedPerson: false, candidates: [] };
  }

  const generic = genericDraft(req, roster, safety.redFlags);

  // 3. Questions the app does not answer. Any safety message still comes first.
  if (safety.outOfScope) {
    return {
      kind: "out_of_scope",
      message: safety.message ? `${safety.message} ${OUT_OF_SCOPE_MESSAGE}` : OUT_OF_SCOPE_MESSAGE,
      draft: generic.hasEventContent ? generic.draft : null,
      unmatchedPerson: generic.hasEventContent ? generic.unmatchedPerson : false,
      candidates: generic.hasEventContent ? generic.candidates : [],
    };
  }

  // 4. A normal log. Red flags are kept on the draft and the message is shown first.
  return {
    kind: "event",
    message: safety.message,
    draft: generic.draft,
    unmatchedPerson: generic.unmatchedPerson,
    candidates: generic.candidates,
  };
}
