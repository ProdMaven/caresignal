// Real (non-mock) pipeline for POST /api/log. Owner: Lane 2.
// Order: deterministic safety screen, demo cache, formatter model, code-side validation.
// The model only proposes field values. Code decides the person, the time, the time band,
// what needs review, the red flags (union with the screen, never fewer) and every message.
import type { LogRecord, Mode, ParseLogRequest, ParseLogResponse, Person, TimeBand } from "./types";
import { AiError, callClaude, parseJson, type ClaudeMessage } from "./ai";
import { cachedDemoResponse, clockFrom, resolveToday } from "./demoCache";
import {
  BEHAVIORS,
  CONTEXT_BEFORE,
  ENVIRONMENT,
  EVENT_TYPES,
  RESPONSE_TRIED,
  TIME_ANCHORS,
  firstIssue,
  formatterReplySchema,
  parsedDraftSchema,
  type FormatterReply,
} from "./schemas";
import {
  DISTRESS_MESSAGE,
  SCOPE_MESSAGES,
  finalizeFindings,
  normalize,
  safetyMessageFor,
  screenSafety,
  unionRedFlags,
  type SafetyFindings,
  type SafetyScreen,
  type ScopeReason,
} from "./safety";
import { addDays, bandForHour, isoAt, wallParts, type WallParts } from "./time";
import { mockLog } from "../mocks/log";
import { FORMATTER_SYSTEM_PROMPT, buildFormatterRepairMessage, buildFormatterUserMessage } from "../prompts/formatter";

type Draft = Omit<LogRecord, "id" | "loggedAt">;
type Anchor = (typeof TIME_ANCHORS)[number];

export type LogSource = "safety" | "demo_cache" | "model" | "fallback";

export interface AiUsageSummary {
  calls: number;
  model: string | null;
  latencyMs: number;
  inputTokens: number;
  outputTokens: number;
  cacheReadTokens: number;
  cacheWriteTokens: number;
  error: string | null;
}

export interface ParseLogOutcome {
  response: ParseLogResponse;
  source: LogSource;
  language: string | null;
  ai: AiUsageSummary | null;
}

// The UI gives up after 20 s, so the whole model step must finish well inside that.
// A slow call is not retried (one 9 s wait, then the keyword fallback). A fast failure
// (rate limit, overloaded, 5xx) gets one quick second try.
const ATTEMPT_TIMEOUT_MS = 9_000;
const TOTAL_BUDGET_MS = 14_000;
const REPAIR_MIN_BUDGET_MS = 3_000;
const QUICK_RETRY_WINDOW_MS = 3_000;
const RETRYABLE_STATUS = [408, 409, 429, 500, 502, 503, 504, 529];
const MAX_TOKENS = 1_500;

const REVIEW_THRESHOLD = 0.7;
const CONFIDENCE_VALUE = { high: 0.9, medium: 0.6, low: 0.4 } as const;
const ALL_REVIEW_FIELDS = [
  "personId", "eventType", "occurredAt", "intensity", "behaviors", "contextBefore", "responseTried", "outcome", "durationMin",
];

// ---------------------------------------------------------------------------
// Time: the model reports the time words, code works out the clock time.
// ---------------------------------------------------------------------------

const ANCHOR_TIME: Record<Anchor, [number, number]> = {
  early_morning: [6, 30],
  breakfast: [8, 0],
  before_school: [8, 15],
  morning: [9, 0],
  lunch: [12, 30],
  after_lunch: [13, 30],
  afternoon: [14, 30],
  after_school: [15, 30],
  dinner: [18, 30],
  evening: [19, 0],
  bedtime: [20, 30],
  night: [22, 0],
  overnight: [2, 0],
};

const ANCHOR_BANDS: Record<Anchor, TimeBand[]> = {
  early_morning: ["early_morning"],
  breakfast: ["early_morning", "morning"],
  before_school: ["early_morning", "morning"],
  morning: ["morning", "early_morning"],
  lunch: ["afternoon", "morning"],
  after_lunch: ["afternoon"],
  afternoon: ["afternoon"],
  after_school: ["afternoon"],
  dinner: ["evening"],
  evening: ["evening"],
  bedtime: ["evening", "night"],
  night: ["night", "evening"],
  overnight: ["night"],
};

export function resolveOccurredAt(time: FormatterReply["time"], now: WallParts): { occurredAt: string; confidence: number } {
  const dayOffset = Math.max(-7, Math.min(0, Math.trunc(time.dayOffset)));
  const place = (hour: number, minute: number): string => {
    if (dayOffset === 0) return resolveToday(now, hour, minute);
    // "Last night around 2 am" is after midnight, so it is today's date unless that is still ahead.
    if (dayOffset === -1 && hour < 6 && (time.anchor === "night" || time.anchor === "overnight")) {
      return resolveToday(now, hour, minute);
    }
    return isoAt(addDays(now.date, dayOffset), hour, minute, now.offset);
  };

  if (time.hour !== null) {
    const minute = time.minute;
    const said = time.hour;
    if (said === 0 || said >= 13) return { occurredAt: place(said, minute), confidence: 0.9 };
    const am = said % 12;
    const pm = (said % 12) + 12;
    if (time.meridiem) return { occurredAt: place(time.meridiem === "pm" ? pm : am, minute), confidence: 0.9 };

    if (time.anchor) {
      const bands = ANCHOR_BANDS[time.anchor];
      const amFits = bands.includes(bandForHour(am));
      const pmFits = bands.includes(bandForHour(pm));
      if (amFits !== pmFits) return { occurredAt: place(amFits ? am : pm, minute), confidence: 0.85 };
    }
    // No am or pm said. "Around 3" means the afternoon, not 3 AM.
    if (said >= 1 && said <= 6) return { occurredAt: place(pm, minute), confidence: 0.8 };
    if (said === 12) return { occurredAt: place(12, minute), confidence: 0.8 };
    // 7 to 11: the most recent one that is not ahead of the caregiver's clock.
    const nowMin = now.hour * 60 + now.minute + 60;
    const pick = dayOffset === 0 && pm * 60 + minute <= nowMin ? pm : dayOffset === 0 && am * 60 + minute > nowMin ? pm : am;
    return { occurredAt: place(pick, minute), confidence: 0.6 };
  }

  if (time.anchor) {
    const [hour, minute] = ANCHOR_TIME[time.anchor];
    return { occurredAt: place(hour, minute), confidence: 0.6 };
  }

  // No time words: assume it just happened.
  if (dayOffset === 0) return { occurredAt: isoAt(now.date, now.hour, now.minute, now.offset), confidence: 0.75 };
  return { occurredAt: isoAt(addDays(now.date, dayOffset), now.hour, now.minute, now.offset), confidence: 0.5 };
}

// ---------------------------------------------------------------------------
// Person: decided from the roster in code. The model's pick is only a hint.
// ---------------------------------------------------------------------------

function escapeRegExp(text: string): string {
  return text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export function matchRoster(transcript: string, roster: Person[]): Person[] {
  const text = normalize(transcript);
  return roster.filter((p) =>
    Array.from(new Set([p.displayName, ...p.aliases])).some((alias) => {
      const a = normalize(alias);
      if (a.length < 2) return false; // one-letter nicknames would match ordinary words
      return new RegExp(`(?<![\\p{L}\\p{N}])${escapeRegExp(a)}(?![\\p{L}\\p{N}])`, "u").test(text);
    }),
  );
}

// "Mrs. Gonzalez", "Mr Lee": a titled name that is not on the roster is someone else.
const TITLED_NAME = /\b(Mrs|Mr|Ms|Miss|Dr|Sr|Sra|Don|Doña)\.? +\p{Lu}/u;

interface PersonResult {
  personId: string;
  confidence: number;
  unmatchedPerson: boolean;
  candidates: Person[];
}

export function resolvePerson(transcript: string, roster: Person[], hint: FormatterReply["person"]): PersonResult {
  const matched = matchRoster(transcript, roster);
  const hinted = hint.rosterId ? roster.find((p) => p.id === hint.rosterId) : undefined;

  if (matched.length === 1) {
    // The model thinks the note is about someone else who is named: keep the match, ask for review.
    const disputed = hint.type === "other" && matchRoster(hint.mention ?? "", roster).length === 0;
    return { personId: matched[0].id, confidence: disputed ? 0.5 : 0.95, unmatchedPerson: false, candidates: [] };
  }
  if (matched.length > 1) {
    const pick = hinted && matched.some((p) => p.id === hinted.id) ? hinted.id : "";
    return { personId: pick, confidence: 0.5, unmatchedPerson: false, candidates: matched };
  }

  // Nobody on the roster is named in the note.
  if (hint.type === "other" || TITLED_NAME.test(transcript)) {
    return { personId: "", confidence: 0.3, unmatchedPerson: true, candidates: roster };
  }
  if (hint.type === "roster" && hinted) {
    // A translation or family variant of a roster name ("mamá" for "Mom"). Verified id, still reviewed.
    return { personId: hinted.id, confidence: 0.6, unmatchedPerson: false, candidates: [] };
  }
  if (roster.length === 1) {
    // Only a pronoun, and this caregiver logs for one person in this mode.
    return { personId: roster[0].id, confidence: 0.6, unmatchedPerson: false, candidates: [] };
  }
  return { personId: "", confidence: 0.3, unmatchedPerson: true, candidates: roster };
}

// ---------------------------------------------------------------------------
// Draft assembly and vocabulary enforcement.
// ---------------------------------------------------------------------------

function keepVocab(values: string[], vocab: readonly string[]): string[] {
  const said = new Set(values.map((v) => v.trim().toLowerCase()));
  return vocab.filter((v) => said.has(v)); // vocabulary order, so the same set always looks the same
}

function clampIntensity(value: number): 1 | 2 | 3 {
  if (!Number.isFinite(value)) return 2;
  return Math.max(1, Math.min(3, Math.round(value))) as 1 | 2 | 3;
}

function cleanDuration(value: number | null): number | null {
  if (value === null || !Number.isFinite(value) || value < 0) return null;
  return Math.min(1440, Math.round(value));
}

function buildDraft(
  req: ParseLogRequest,
  roster: Person[],
  reply: FormatterReply,
  redFlags: string[],
): { draft: Draft; unmatchedPerson: boolean; candidates: Person[] } {
  const now = clockFrom(req.now);
  const confidence: Record<string, number> = {};

  const person = resolvePerson(req.transcript, roster, reply.person);
  confidence.personId = person.confidence;

  const allowedEvents: readonly string[] = EVENT_TYPES[req.mode];
  const proposed = (reply.eventType ?? "").trim().toLowerCase();
  const eventKnown = allowedEvents.includes(proposed);
  const eventType = eventKnown ? proposed : defaultEventType(req.mode);
  confidence.eventType = eventKnown ? CONFIDENCE_VALUE[reply.confidence.eventType] : 0.3;

  const time = resolveOccurredAt(reply.time, now);
  const saidTime = reply.time.hour !== null || reply.time.anchor !== null;
  confidence.occurredAt =
    saidTime && reply.confidence.time === "low" ? Math.min(time.confidence, 0.5) : time.confidence;
  const hour = wallParts(time.occurredAt)?.hour ?? now.hour;

  confidence.intensity = CONFIDENCE_VALUE[reply.confidence.intensity];

  const draft: Draft = {
    mode: req.mode,
    personId: person.personId,
    loggedBy: req.loggedBy,
    occurredAt: time.occurredAt,
    timeBand: bandForHour(hour),
    source: "text", // the UI sets voice or text when it saves
    eventType,
    behaviors: keepVocab(reply.behaviors, BEHAVIORS),
    intensity: clampIntensity(reply.intensity),
    durationMin: cleanDuration(reply.durationMin),
    contextBefore: keepVocab(reply.contextBefore, CONTEXT_BEFORE),
    environment: keepVocab(reply.environment, ENVIRONMENT),
    responseTried: keepVocab(reply.responseTried, RESPONSE_TRIED),
    outcome: reply.outcome,
    rawNote: req.transcript.trim(),
    confidence,
    needsReview: ["personId", "eventType", "occurredAt", "intensity"].filter((f) => confidence[f] < REVIEW_THRESHOLD),
    redFlags,
  };
  // Shared-type check before anything is shown. Throws only on a programming error.
  const checked = parsedDraftSchema.parse(draft) as Draft;
  return { draft: checked, unmatchedPerson: person.unmatchedPerson, candidates: person.candidates };
}

function defaultEventType(mode: Mode): string {
  return mode === "dementia" ? "agitation" : "meltdown";
}

function distressResponse(): ParseLogResponse {
  return { kind: "caregiver_distress", message: DISTRESS_MESSAGE, draft: null, unmatchedPerson: false, candidates: [] };
}

function joinMessages(...parts: (string | null)[]): string | null {
  const text = parts.filter((p): p is string => Boolean(p)).join(" ");
  return text || null;
}

// Turns a validated model reply into the API response. Pure: no network, no clock besides req.now.
export function responseFromReply(
  req: ParseLogRequest,
  roster: Person[],
  screen: SafetyScreen,
  reply: FormatterReply,
): ParseLogResponse {
  if (screen.caregiverDistress || reply.kind === "caregiver_distress") return distressResponse();

  // Union of the deterministic screen and the model. The model can add, never remove.
  const findings: SafetyFindings = finalizeFindings({
    emergency: screen.emergency || reply.safety.emergency,
    possibleAbuse: screen.possibleAbuse || reply.safety.possibleAbuse,
    personWishToDie: screen.personWishToDie || reply.safety.personWishToDie,
    redFlags: unionRedFlags(
      screen.redFlags,
      reply.redFlags.concat(reply.behaviors.includes("head_banging") ? ["head_banging"] : []),
    ),
  });
  const safetyMessage = safetyMessageFor(findings);

  let scope: ScopeReason | null = screen.scope;
  if (!scope && reply.kind === "out_of_scope") scope = reply.scopeReason === "none" ? "role" : reply.scopeReason;

  // A flagged note always keeps a draft so the red flag is on the record.
  const hasEvent = reply.hasEvent || findings.redFlags.length > 0;
  // Not a care note at all (a greeting, a general question): nothing to log.
  if (!scope && !hasEvent) scope = "role";

  const message = joinMessages(safetyMessage, scope ? SCOPE_MESSAGES[scope] : null);
  const kind: ParseLogResponse["kind"] = scope ? "out_of_scope" : "event";
  if (!hasEvent) return { kind, message, draft: null, unmatchedPerson: false, candidates: [] };

  const built = buildDraft(req, roster, reply, findings.redFlags);
  return { kind, message, draft: built.draft, unmatchedPerson: built.unmatchedPerson, candidates: built.candidates };
}

// Deterministic keyword fallback (the mock's generic path) for when the model cannot be used.
// Everything is marked for review. Safety flags and messages come from the screen, never fewer.
export function fallbackResponse(req: ParseLogRequest, roster: Person[], screen: SafetyScreen): ParseLogResponse {
  if (screen.caregiverDistress) return distressResponse();
  const mock = mockLog(req, roster);
  if (mock.kind === "caregiver_distress") return distressResponse();

  const findings = finalizeFindings({
    emergency: screen.emergency,
    possibleAbuse: screen.possibleAbuse,
    personWishToDie: screen.personWishToDie,
    redFlags: unionRedFlags(screen.redFlags, mock.draft?.redFlags ?? []),
  });
  const scope: ScopeReason | null = screen.scope ?? (mock.kind === "out_of_scope" ? "medical" : null);
  const message = joinMessages(safetyMessageFor(findings), scope ? SCOPE_MESSAGES[scope] : null);
  const kind: ParseLogResponse["kind"] = scope ? "out_of_scope" : "event";

  // The keyword pass found a real event word or behavior (it guesses a default type otherwise).
  const hasContent =
    mock.draft !== null && ((mock.draft.confidence.eventType ?? 0) >= 0.8 || mock.draft.behaviors.length > 0);
  const keepDraft = mock.draft !== null && (findings.redFlags.length > 0 || !scope || hasContent);
  if (!mock.draft || !keepDraft) return { kind, message, draft: null, unmatchedPerson: false, candidates: [] };

  const hour = wallParts(mock.draft.occurredAt)?.hour;
  // The keyword pass reads "a bit" as biting. Keep biting only when the note really says it.
  const saysBiting = /\b(biting|bites|bitten|bite)\b|\bbit (him|her|me|my|his|them|their|the|at|on|into|down)\b/.test(normalize(req.transcript));
  const draft = parsedDraftSchema.parse({
    ...mock.draft,
    behaviors: mock.draft.behaviors.filter((b) => b !== "biting" || saysBiting),
    loggedBy: req.loggedBy,
    timeBand: hour === undefined ? mock.draft.timeBand : bandForHour(hour),
    needsReview: [...ALL_REVIEW_FIELDS],
    redFlags: findings.redFlags,
  }) as Draft;
  return { kind, message, draft, unmatchedPerson: mock.unmatchedPerson, candidates: mock.candidates };
}

// ---------------------------------------------------------------------------
// Model call with one repair attempt.
// ---------------------------------------------------------------------------

function parseReply(text: string): { reply: FormatterReply } | { problem: string } {
  let raw: unknown;
  try {
    raw = parseJson(text);
  } catch {
    return { problem: "it was not valid JSON" };
  }
  const parsed = formatterReplySchema.safeParse(raw);
  if (!parsed.success) return { problem: `it did not match the output shape (${firstIssue(parsed.error)})` };
  return { reply: parsed.data };
}

async function askFormatter(req: ParseLogRequest, roster: Person[], usage: AiUsageSummary): Promise<FormatterReply> {
  const started = Date.now();
  const userMessage = buildFormatterUserMessage({
    mode: req.mode,
    roster,
    loggedBy: req.loggedBy,
    now: req.now,
    transcript: req.transcript,
  });
  const track = (r: Awaited<ReturnType<typeof callClaude>>) => {
    usage.calls += 1;
    usage.model = r.model;
    usage.latencyMs += r.latencyMs;
    usage.inputTokens += r.usage.inputTokens;
    usage.outputTokens += r.usage.outputTokens;
    usage.cacheReadTokens += r.usage.cacheReadTokens;
    usage.cacheWriteTokens += r.usage.cacheWriteTokens;
  };

  const firstCall = () =>
    callClaude({
      system: FORMATTER_SYSTEM_PROMPT,
      messages: [{ role: "user", content: userMessage }],
      maxTokens: MAX_TOKENS,
      timeoutMs: ATTEMPT_TIMEOUT_MS,
      maxRetries: 0,
      label: "formatter",
    });
  let first;
  try {
    first = await firstCall();
  } catch (err) {
    const quick = Date.now() - started < QUICK_RETRY_WINDOW_MS;
    const retryable = err instanceof AiError && err.status !== undefined && RETRYABLE_STATUS.includes(err.status);
    if (!quick || !retryable) throw err;
    await new Promise((resolve) => setTimeout(resolve, 400));
    first = await firstCall();
  }
  track(first);
  const firstParse = parseReply(first.text);
  if ("reply" in firstParse) return firstParse.reply;

  // One repair attempt, only if there is still time before the UI gives up.
  const remaining = TOTAL_BUDGET_MS - (Date.now() - started);
  if (remaining < REPAIR_MIN_BUDGET_MS) throw new AiError(`Formatter reply rejected: ${firstParse.problem}.`, "bad_json");
  const repair = buildFormatterRepairMessage(firstParse.problem);
  const messages: ClaudeMessage[] = first.text
    ? [
        { role: "user", content: userMessage },
        { role: "assistant", content: first.text.slice(0, 4000) },
        { role: "user", content: repair },
      ]
    : [{ role: "user", content: `${userMessage}\n${repair}` }];
  const second = await callClaude({
    system: FORMATTER_SYSTEM_PROMPT,
    messages,
    maxTokens: MAX_TOKENS,
    timeoutMs: Math.min(ATTEMPT_TIMEOUT_MS, remaining),
    maxRetries: 0,
    label: "formatter_repair",
  });
  track(second);
  const secondParse = parseReply(second.text);
  if ("reply" in secondParse) return secondParse.reply;
  throw new AiError(`Formatter reply rejected after repair: ${secondParse.problem}.`, "bad_json");
}

// ---------------------------------------------------------------------------
// Entry point used by the route.
// ---------------------------------------------------------------------------

export async function parseLog(req: ParseLogRequest, roster: Person[]): Promise<ParseLogOutcome> {
  // 1. Deterministic safety screen, before any model call.
  const screen = screenSafety(req.transcript);
  if (screen.caregiverDistress) return { response: distressResponse(), source: "safety", language: null, ai: null };

  // 2. Scripted demo phrases never touch the network.
  if (!screen.message && !screen.scope) {
    const cached = cachedDemoResponse(req);
    if (cached) return { response: cached, source: "demo_cache", language: "en", ai: null };
  }

  // 3. Formatter model, then code-side validation.
  const usage: AiUsageSummary = {
    calls: 0, model: null, latencyMs: 0, inputTokens: 0, outputTokens: 0, cacheReadTokens: 0, cacheWriteTokens: 0, error: null,
  };
  try {
    const reply = await askFormatter(req, roster, usage);
    return { response: responseFromReply(req, roster, screen, reply), source: "model", language: reply.language, ai: usage };
  } catch (err) {
    usage.error = err instanceof AiError ? err.code : "unexpected";
    if (!(err instanceof AiError)) console.error("[log] formatter step failed:", err instanceof Error ? err.message : err);
  }

  // 4. Model unavailable or unusable: keyword fallback, everything marked for review.
  try {
    return { response: fallbackResponse(req, roster, screen), source: "fallback", language: null, ai: usage };
  } catch (err) {
    console.error("[log] fallback failed:", err instanceof Error ? err.message : err);
    // Safety messages are returned no matter what else failed.
    if (screen.message || screen.scope) {
      const response: ParseLogResponse = {
        kind: screen.scope ? "out_of_scope" : "event",
        message: joinMessages(screen.message, screen.scope ? SCOPE_MESSAGES[screen.scope] : null),
        draft: null,
        unmatchedPerson: false,
        candidates: [],
      };
      return { response, source: "safety", language: null, ai: usage };
    }
    throw err;
  }
}
