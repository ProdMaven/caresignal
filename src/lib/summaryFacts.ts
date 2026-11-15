// Facts for the visit and handoff summary (docs/AI_FEATURES.md, Feature 1). Server only.
// "The model reads and writes; code counts": every number the summary may show is counted here,
// from this one person's entries, and every item carries the ids of the entries it came from.
import { caregiverName, label, RECORD_ONLY_RESPONSES } from "@/config/modes";
import { screenSafety } from "@/lib/safety";
import { CAUSE_CLAIM, COMPLIANCE, CONDITIONS, DOSE, DRUGS, wordCount } from "@/lib/textChecks";
import { TIME_BAND_LABEL, TIME_BAND_ORDER, wallParts } from "@/lib/time";
import type { LogRecord, Mode, StepResult, SummaryAudience, TimeBand } from "@/lib/types";
import { computePatterns, contextPhrase, eventsInWindow } from "@/mocks/patterns";
import { allEvents, findPerson, listPeople } from "@/mocks/store";

export const MIN_ENTRIES_FOR_SUMMARY = 3;
const MAX_QUOTES = 5;
const MAX_QUOTE_WORDS = 19; // "under 20 words"
const MIN_QUOTE_WORDS = 4;

export interface CountFact {
  key: string;
  label: string;
  count: number;
  eventIds: string[];
}

export interface PatternFact {
  patternKey: string;
  what: string; // "Afternoon agitation"
  context: string; // "a skipped or small meal"
  link: "came after" | "happened around";
  matchCount: number;
  totalCount: number;
  windowDays: number; // the window the pattern was counted over, which can be longer than the summary window
  thingsToCheck: string[];
  crossCount: number; // matching days where another caregiver logged the earlier clue
  crossNames: string[];
  eventIds: string[];
  crossEventIds: string[];
}

export interface TriedFact {
  tag: string;
  label: string;
  timesTried: number;
  helped: number;
  helpedALittle: number;
  didNotHelp: number;
  notSure: number;
  eventIds: string[];
}

export interface RedFlagFact {
  eventId: string;
  date: string; // YYYY-MM-DD
  dateLabel: string; // "Nov 12"
  flags: string[];
  emergency: boolean; // the note reads like a possible emergency (stroke signs, serious fall, hit head)
}

export interface QuoteFact {
  text: string; // verbatim piece of the caregiver's note
  caregiver: string;
  eventId: string;
}

export interface HelpedFact {
  what: string; // "Afternoon agitation"
  tried: string[]; // labels of what helped
  result: "helped" | "helped a little";
  eventId: string;
}

export interface SummaryFacts {
  personId: string;
  personName: string;
  mode: Mode;
  audience: SummaryAudience;
  windowDays: number;
  totalEntries: number;
  eventIds: string[];
  byEventType: CountFact[];
  byTimeBand: CountFact[];
  patterns: PatternFact[];
  tried: TriedFact[];
  // True when at least one result comes from the entry's overall outcome because no step was rated on its own.
  triedUsesOverallOutcome: boolean;
  remedyReported: { count: number; eventIds: string[] } | null; // a plain fact, never a statistic or a suggestion
  caregivers: (CountFact & { caregiverId: string })[];
  redFlags: RedFlagFact[]; // newest first
  quotes: QuoteFact[];
  helpedLastTime: HelpedFact[]; // newest first, at most 2
  // Display names of other people in the app. They must never appear in this person's summary.
  otherPeopleNames: string[];
}

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

function dateOf(e: LogRecord): string {
  return wallParts(e.occurredAt)?.date ?? e.occurredAt.slice(0, 10);
}

export function shortDate(date: string): string {
  const month = MONTHS[Number(date.slice(5, 7)) - 1] ?? "";
  return `${month} ${Number(date.slice(8, 10))}`.trim();
}

const newestFirst = (a: LogRecord, b: LogRecord) => Date.parse(b.occurredAt) - Date.parse(a.occurredAt);

// What was tried in one entry, each with its own result. Older entries have no per-step results;
// for those the entry's overall outcome stands in for every step.
function stepsOf(e: LogRecord): { steps: { tag: string; result: StepResult }[]; fromOutcome: boolean } {
  if (e.responses && e.responses.length > 0) return { steps: e.responses, fromOutcome: false };
  const result: StepResult =
    e.outcome === "calmed" ? "helped" : e.outcome === "partly_calmed" ? "helped_a_little" : e.outcome === "escalated" ? "did_not_help" : "unknown";
  return { steps: e.responseTried.map((tag) => ({ tag, result })), fromOutcome: e.responseTried.length > 0 };
}

function countBy(events: LogRecord[], keyOf: (e: LogRecord) => string, labelOf: (key: string) => string): CountFact[] {
  const groups = new Map<string, string[]>();
  for (const e of events) groups.set(keyOf(e), [...(groups.get(keyOf(e)) ?? []), e.id]);
  return [...groups.entries()]
    .map(([key, ids]) => ({ key, label: labelOf(key), count: ids.length, eventIds: ids }))
    .sort((a, b) => b.count - a.count || a.label.localeCompare(b.label));
}

// A note sentence is not quoted when it reads like an instruction to the app or the summary writer,
// asks a question, or carries a medicine, a dose, a condition label, a cause claim, or anything the safety screen reacts to.
const INSTRUCTION_LIKE =
  /\b(ignore|disregard|forget|override|bypass|pretend|roleplay)\b|\b(instructions?|prompt|system|assistant|developer|admin|rules?|summar\w+|report|doctorgpt|chatbot|ai)\b|\b(you are|you must|you should|you need|act as|write (that|in|the|this|down)|say that|tell (the|them|him|her|their)|include|list (all|every|everything)|add (this|that|the|all)|output|respond|reply|make sure|should|must)\b|[<>{}[\]"\u201C\u201D]|https?:|\?/i;

function quotable(sentence: string): boolean {
  const words = wordCount(sentence);
  if (words < MIN_QUOTE_WORDS || words > MAX_QUOTE_WORDS) return false;
  if (INSTRUCTION_LIKE.test(sentence) || DOSE.test(sentence) || CAUSE_CLAIM.test(sentence) || COMPLIANCE.test(sentence)) return false;
  if (/\b(medicat\w*|medicines?|meds?|pills?|dos(e|es|age)|supplements?|remed(y|ies)|mg)\b/i.test(sentence)) return false;
  if (DRUGS.some(([, p]) => p.test(sentence)) || CONDITIONS.some(([, p]) => p.test(sentence))) return false;
  if (/[\u2013\u2014]/.test(sentence)) return false;
  const screen = screenSafety(sentence);
  return !screen.caregiverDistress && !screen.emergency && !screen.possibleAbuse && !screen.personWishToDie && screen.redFlags.length === 0 && screen.scope === null;
}

function pickQuotes(events: LogRecord[], otherNames: string[]): QuoteFact[] {
  const perCaregiver = new Map<string, QuoteFact[]>();
  for (const e of [...events].sort(newestFirst)) {
    if (e.redFlags.length > 0 || !e.rawNote) continue; // flagged entries are covered by the fixed safety notes
    // The whole note has to be clean, not only the sentence that is quoted.
    if (DRUGS.some(([, p]) => p.test(e.rawNote)) || DOSE.test(e.rawNote)) continue;
    if (/\b(ignore|disregard|override|bypass)\b|\b(instructions?|prompt|system|summar\w+)\b/i.test(e.rawNote)) continue;
    if (otherNames.some((n) => new RegExp(`\\b${n.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`, "i").test(e.rawNote))) continue;
    const sentence = e.rawNote
      .split(/(?<=[.!?])\s+|\n+/)
      .map((s) => s.trim())
      .find(quotable);
    if (!sentence) continue;
    const name = caregiverName(e.loggedBy);
    perCaregiver.set(e.loggedBy, [...(perCaregiver.get(e.loggedBy) ?? []), { text: sentence, caregiver: name, eventId: e.id }]);
  }
  // Round robin so every caregiver's words can appear.
  const lists = [...perCaregiver.values()];
  const out: QuoteFact[] = [];
  for (let round = 0; out.length < MAX_QUOTES && lists.some((l) => l.length > round); round++) {
    for (const list of lists) {
      if (list[round] && out.length < MAX_QUOTES && !out.some((q) => q.text === list[round].text)) out.push(list[round]);
    }
  }
  return out;
}

// Returns null when there is no such person. Only this person's entries are ever read.
export function buildSummaryFacts(personId: string, days: number, audience: SummaryAudience): SummaryFacts | null {
  const person = findPerson(personId);
  if (!person) return null;

  const mine = allEvents().filter((e) => e.personId === personId);
  const events = eventsInWindow(mine, days).slice().sort(newestFirst);
  const mode = person.mode;

  const ownNames = new Set(
    [person.displayName, ...person.aliases, ...(person.caregivers ?? []).map((c) => c.name), ...events.map((e) => caregiverName(e.loggedBy))].map((n) => n.toLowerCase()),
  );
  const otherPeopleNames = [...new Set(listPeople().filter((p) => p.id !== personId).map((p) => p.displayName.trim()))].filter(
    (n) => n.length > 1 && !ownNames.has(n.toLowerCase()),
  );

  const byEventType = countBy(events, (e) => e.eventType, (k) => label(k, mode));
  const bandCounts = countBy(events, (e) => e.timeBand, (k) => TIME_BAND_LABEL[k as TimeBand] ?? label(k));
  const byTimeBand = bandCounts.sort(
    (a, b) => b.count - a.count || TIME_BAND_ORDER.indexOf(a.key as TimeBand) - TIME_BAND_ORDER.indexOf(b.key as TimeBand),
  );

  // Patterns are the same ones the Patterns screen shows, counted by the same code over its own window.
  const patterns: PatternFact[] = computePatterns(personId, mine).map((p) => ({
    patternKey: p.patternKey,
    what: `${TIME_BAND_LABEL[p.timeBand]} ${label(p.eventType, mode).toLowerCase()}`,
    context: contextPhrase(p.contextTag),
    link: p.contextTag === "bathing" ? "happened around" : "came after",
    matchCount: p.matchCount,
    totalCount: p.totalCount,
    windowDays: p.windowDays,
    thingsToCheck: p.thingsToCheck,
    crossCount: p.crossCount,
    crossNames: p.crossNames,
    eventIds: p.evidenceEventIds,
    crossEventIds: [...new Set(p.crossEventIds)],
  }));

  const triedMap = new Map<string, TriedFact>();
  const remedyIds: string[] = [];
  let remedyCount = 0;
  let triedUsesOverallOutcome = false;
  const helpedLastTime: HelpedFact[] = [];
  for (const e of events) {
    const { steps, fromOutcome } = stepsOf(e);
    const helpedHere: { label: string; result: StepResult }[] = [];
    for (const step of steps) {
      if (RECORD_ONLY_RESPONSES.includes(step.tag)) {
        remedyCount++;
        if (!remedyIds.includes(e.id)) remedyIds.push(e.id);
        continue;
      }
      if (fromOutcome) triedUsesOverallOutcome = true;
      const fact = triedMap.get(step.tag) ?? { tag: step.tag, label: label(step.tag), timesTried: 0, helped: 0, helpedALittle: 0, didNotHelp: 0, notSure: 0, eventIds: [] };
      fact.timesTried++;
      if (step.result === "helped") fact.helped++;
      else if (step.result === "helped_a_little") fact.helpedALittle++;
      else if (step.result === "did_not_help") fact.didNotHelp++;
      else fact.notSure++;
      if (!fact.eventIds.includes(e.id)) fact.eventIds.push(e.id);
      triedMap.set(step.tag, fact);
      if (step.result === "helped" || step.result === "helped_a_little") helpedHere.push({ label: label(step.tag), result: step.result });
    }
    if (helpedHere.length > 0 && helpedLastTime.length < 2) {
      const best = helpedHere.some((h) => h.result === "helped") ? "helped" : "helped_a_little";
      helpedLastTime.push({
        what: `${TIME_BAND_LABEL[e.timeBand]} ${label(e.eventType, mode).toLowerCase()}`,
        tried: [...new Set(helpedHere.filter((h) => h.result === best).map((h) => h.label))],
        result: best === "helped" ? "helped" : "helped a little",
        eventId: e.id,
      });
    }
  }
  const tried = [...triedMap.values()].sort((a, b) => b.timesTried - a.timesTried || b.helped - a.helped || a.label.localeCompare(b.label));

  const caregivers = countBy(events, (e) => e.loggedBy, caregiverName).map((c) => ({ ...c, caregiverId: c.key }));

  const redFlags: RedFlagFact[] = events
    .filter((e) => e.redFlags.length > 0)
    .map((e) => ({
      eventId: e.id,
      date: dateOf(e),
      dateLabel: shortDate(dateOf(e)),
      flags: [...e.redFlags],
      emergency: screenSafety(e.rawNote).emergency,
    }));

  return {
    personId,
    personName: person.displayName,
    mode,
    audience,
    windowDays: days,
    totalEntries: events.length,
    eventIds: events.map((e) => e.id),
    byEventType,
    byTimeBand,
    patterns,
    tried,
    triedUsesOverallOutcome,
    remedyReported: remedyCount > 0 ? { count: remedyCount, eventIds: remedyIds } : null,
    caregivers,
    redFlags,
    quotes: pickQuotes(events, otherPeopleNames),
    helpedLastTime,
    otherPeopleNames,
  };
}

// The slim copy the model sees: labels and counts only. No entry ids, no dates, no raw notes.
// Quotes travel separately, inside a marked data block (see src/prompts/summary.ts).
export function factsForModel(f: SummaryFacts): Record<string, unknown> {
  return {
    person: f.personName,
    mode: f.mode,
    windowDays: f.windowDays,
    totalEntries: f.totalEntries,
    byEventType: f.byEventType.map((c) => ({ what: c.label, count: c.count })),
    byTimeOfDay: f.byTimeBand.map((c) => ({ when: c.label, count: c.count })),
    patternCount: f.patterns.length,
    patterns: f.patterns.map((p) => ({
      what: p.what,
      [p.link === "came after" ? "cameAfter" : "happenedAround"]: p.context,
      matchCount: p.matchCount,
      totalCount: p.totalCount,
      countedOverDays: p.windowDays,
      possibleThingsToCheck: p.thingsToCheck,
      earlierClueLoggedBy: p.crossCount > 0 ? { caregivers: p.crossNames, onDays: p.crossCount, ofMatchingDays: p.matchCount } : null,
    })),
    tried: f.tried.map((t) => ({ what: t.label, timesTried: t.timesTried, helped: t.helped, helpedALittle: t.helpedALittle, didNotHelp: t.didNotHelp, notSure: t.notSure })),
    triedNote: f.triedUsesOverallOutcome ? "Where a step was not rated on its own, the result of the whole entry is used." : null,
    remedyOrMedicineReportedAsGiven: f.remedyReported ? { times: f.remedyReported.count } : null,
    caregiverCount: f.caregivers.length,
    caregivers: f.caregivers.map((c) => ({ name: c.label, entries: c.count })),
    helpedLastTime: f.helpedLastTime.map((h) => ({ what: h.what, tried: h.tried, result: h.result })),
    redFlagEntries: f.redFlags.length,
  };
}

// Every number the summary text may contain: the numeric leaves of the object the model was given.
export function allowedNumbers(modelFacts: unknown): number[] {
  const out = new Set<number>();
  const walk = (v: unknown): void => {
    if (typeof v === "number" && Number.isFinite(v)) out.add(v);
    else if (Array.isArray(v)) v.forEach(walk);
    else if (v && typeof v === "object") Object.values(v).forEach(walk);
  };
  walk(modelFacts);
  return [...out];
}

// Window lengths that may be named in days, or in whole weeks.
export function windowLengths(f: SummaryFacts): number[] {
  return [...new Set([f.windowDays, ...f.patterns.map((p) => p.windowDays)])];
}
