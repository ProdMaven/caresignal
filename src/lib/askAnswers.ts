// Answers for POST /api/ask when the Ask router is on (docs/AI_FEATURES.md, Feature 2). Owner: Lane 2.
// The model only labels the question (src/lib/askRouter.ts). Everything a caregiver reads here is a
// template filled with numbers counted in this file, from the selected person's entries and computed
// patterns only. No model text, no cause, no diagnosis, no medicine. Relative imports only (tsx scripts load this).
import { caregiverName, label } from "../config/modes";
import { WINDOW_DAYS } from "../mocks/data";
import { contextPhrase, type PatternDetail } from "../mocks/patterns";
import { EVENT_TYPES, RECORD_ONLY_RESPONSES } from "./schemas";
import { addDays, demoToday, formatDay, TIME_BAND_LABEL, TIME_BAND_ORDER, wallParts, weekday } from "./time";
import type { AskIntent, AskResponse, AskUnderstanding, LogRecord, Person, TimeBand } from "./types";

type Evidence = AskResponse["evidence"];

// Fewer entries than this in the window and the answer says so instead of counting.
export const MIN_ENTRIES = 3;
const MAX_LINES = 5;

export const ABOUT_ANSWER =
  "Unspoken turns spoken or typed care notes into log entries, then counts what those entries show: when hard moments happen, " +
  "what came before them, what was tried and how it went, how often, and which caregiver saw it. Answers here come only from the " +
  "selected person's own entries, with the entries linked so you can check them. " +
  "Unspoken never diagnoses, never names a cause, and never gives advice about medication, doses, treatment or care placement. " +
  "It never shows another person's or another family's entries. For anything medical, please ask your doctor or care team. " +
  "Supports caregivers. Does not diagnose.";

export const OTHER_LINE =
  "I can answer questions about when it happens, what comes before, what helped, how often, and who saw it.";
export const OTHER_EXAMPLES = [
  "When does it usually happen?",
  "What helped in the last two weeks?",
  "Who saw it most often?",
] as const;
export const OTHER_ANSWER =
  `${OTHER_LINE} For example: ${OTHER_EXAMPLES.map((q) => `"${q}"`).join(" ")} ` +
  `For anything medical, please ask your doctor or care team.`;

const COUNT_NOTE = "This is a count from the logs, not a cause or a diagnosis.";

// ---------- small helpers ----------

const plural = (n: number, one: string, many: string) => (n === 1 ? one : many);
const entries = (n: number) => `${n} ${plural(n, "entry", "entries")}`;
const times = (n: number) => `${n} ${plural(n, "time", "times")}`;
const capital = (text: string) => text.charAt(0).toUpperCase() + text.slice(1);
const ids = (list: LogRecord[]) => list.map((e) => e.id);
const dateOf = (e: LogRecord) => wallParts(e.occurredAt)?.date ?? null;

function joinWords(items: string[]): string {
  if (items.length <= 1) return items[0] ?? "";
  return `${items.slice(0, -1).join(", ")} and ${items[items.length - 1]}`;
}

function windowText(days: number): string {
  return days % 7 === 0 && days > 14 ? `the last ${days / 7} weeks` : `the last ${days} days`;
}

// Entries dated from `start` to `end`, both included. Entries without a readable date are left out.
function between(events: LogRecord[], start: string, end: string): LogRecord[] {
  return events.filter((e) => {
    const d = dateOf(e);
    return d !== null && d >= start && d <= end;
  });
}

function tally<T extends string>(values: T[]): { key: T; count: number }[] {
  const counts = new Map<T, number>();
  for (const v of values) counts.set(v, (counts.get(v) ?? 0) + 1);
  return [...counts.entries()].map(([key, count]) => ({ key, count })).sort((a, b) => b.count - a.count || a.key.localeCompare(b.key));
}

interface Scope {
  eventType: string | null; // only a value from this person's mode vocabulary
  timeBand: TimeBand | null;
}

function scopeOf(u: AskUnderstanding, person: Person): Scope {
  const vocab = EVENT_TYPES[person.mode] as readonly string[];
  return {
    eventType: u.eventType && vocab.includes(u.eventType) ? u.eventType : null,
    timeBand: u.timeBand && TIME_BAND_ORDER.includes(u.timeBand) ? u.timeBand : null,
  };
}

function inScope(events: LogRecord[], s: Scope, useBand = true): LogRecord[] {
  return events.filter((e) => (!s.eventType || e.eventType === s.eventType) && (!useBand || !s.timeBand || e.timeBand === s.timeBand));
}

// "afternoon agitation entries", "meltdown entries", "entries"
function noun(s: Scope, person: Person, useBand = true): string {
  const parts: string[] = [];
  if (useBand && s.timeBand) parts.push(TIME_BAND_LABEL[s.timeBand].toLowerCase());
  if (s.eventType) parts.push(label(s.eventType, person.mode).toLowerCase());
  parts.push("entries");
  return parts.join(" ");
}

function nameOf(person: Person, caregiverId: string): string {
  return person.caregivers?.find((c) => c.id === caregiverId)?.name ?? caregiverName(caregiverId);
}

function reply(intent: AskIntent, answer: string, evidence: Evidence, dataSufficient: boolean, relatedPatternKeys: string[] = []): AskResponse {
  return { redFlag: false, redFlagMessage: null, answer, evidence, relatedPatternKeys, dataSufficient, intent };
}

function tooFew(intent: AskIntent, person: Person, found: LogRecord[], what: string, window: string): AskResponse {
  const evidence: Evidence = found.length > 0 ? [{ text: `${entries(found.length)} found in ${window}.`, eventIds: ids(found) }] : [];
  return reply(
    intent,
    `There are not enough ${what} for ${person.displayName} in ${window} to answer that yet ` +
      `(${found.length} found, and at least ${MIN_ENTRIES} are needed). Keep logging and ask again in a few days.`,
    evidence,
    false,
  );
}

// ---------- when_does_it_happen ----------

function whenDoesItHappen(u: AskUnderstanding, person: Person, mine: LogRecord[], patterns: PatternDetail[], today: string): AskResponse {
  const days = u.days ?? WINDOW_DAYS;
  const window = windowText(days);
  const s = scopeOf(u, person);
  const start = addDays(today, -(days - 1));
  // The time of day is the answer here, so a time band in the question does not narrow the entries.
  const found = inScope(between(mine, start, today), s, false);
  const what = noun(s, person, false);
  if (found.length < MIN_ENTRIES) return tooFew("when_does_it_happen", person, found, what, window);

  const byBand = TIME_BAND_ORDER.map((band) => ({ band, list: found.filter((e) => e.timeBand === band) })).filter((b) => b.list.length > 0);
  const max = Math.max(...byBand.map((b) => b.list.length));
  const top = byBand.filter((b) => b.list.length === max);
  const isWeekend = (e: LogRecord) => {
    const d = dateOf(e);
    return d !== null && (weekday(d) === 0 || weekday(d) === 6);
  };
  const weekendList = found.filter(isWeekend);
  const weekdayList = found.filter((e) => !isWeekend(e));
  let weekendDays = 0;
  for (let i = 0; i < days; i++) {
    const wd = weekday(addDays(start, i));
    if (wd === 0 || wd === 6) weekendDays++;
  }
  const weekdayDays = days - weekendDays;

  const bandNames = joinWords(top.map((b) => TIME_BAND_LABEL[b.band].toLowerCase()));
  const lead =
    top.length === 1
      ? `${max} of ${found.length} ${what} were in the ${bandNames}, more than at any other time of day.`
      : `the ${what} were most often in the ${bandNames} (${max} each, of ${found.length}).`;
  const answer =
    `From ${person.displayName}'s logs in ${window}: ${lead} ` +
    `${weekdayList.length} were on weekdays and ${weekendList.length} on weekends ` +
    `(${window} hold ${weekdayDays} weekdays and ${weekendDays} weekend days). ${COUNT_NOTE}`;

  const evidence: Evidence = byBand
    .slice()
    .sort((a, b) => b.list.length - a.list.length)
    .map((b) => ({ text: `${TIME_BAND_LABEL[b.band]}: ${b.list.length} of ${found.length} ${what}.`, eventIds: ids(b.list) }));
  if (weekdayList.length > 0) evidence.push({ text: `Weekdays: ${entries(weekdayList.length)} across ${weekdayDays} weekdays.`, eventIds: ids(weekdayList) });
  if (weekendList.length > 0) evidence.push({ text: `Weekends: ${entries(weekendList.length)} across ${weekendDays} weekend days.`, eventIds: ids(weekendList) });

  const topBands = top.map((b) => b.band);
  // Related patterns only when the question named a kind of moment, so the screen does not suggest ideas for an unrelated pattern.
  const related = s.eventType ? patterns.filter((p) => topBands.includes(p.timeBand) && p.eventType === s.eventType).map((p) => p.patternKey) : [];
  return reply("when_does_it_happen", answer, evidence, true, [...new Set(related)]);
}

// ---------- what_comes_before ----------

function whatComesBefore(u: AskUnderstanding, person: Person, mine: LogRecord[], patterns: PatternDetail[], today: string): AskResponse {
  const s = scopeOf(u, person);
  // Computed patterns cover the standard 3 week window. A question about another period is counted directly.
  const matching =
    u.days === undefined
      ? patterns.filter((p) => (!s.eventType || p.eventType === s.eventType) && (!s.timeBand || p.timeBand === s.timeBand))
      : [];

  if (matching.length > 0) {
    const window = windowText(matching[0].windowDays);
    const evidence: Evidence = [];
    const sentences: string[] = [];
    for (const p of matching.slice(0, 3)) {
      const what = `${TIME_BAND_LABEL[p.timeBand].toLowerCase()} ${label(p.eventType, person.mode).toLowerCase()} entries`;
      const link = p.contextTag === "bathing" ? "came just before or during" : "came before";
      const line = `${capital(contextPhrase(p.contextTag))} ${link} ${p.matchCount} of ${p.totalCount} ${what}.`;
      sentences.push(line);
      evidence.push({ text: line, eventIds: p.evidenceEventIds });
      if (p.crossCount > 0) {
        const cross =
          `${joinWords(p.crossNames)} logged ${contextPhrase(p.contextTag)} earlier in the day on ${p.crossCount} of those ${p.matchCount} days, ` +
          `before the ${label(p.eventType, person.mode).toLowerCase()} was seen.`;
        sentences.push(cross);
        evidence.push({ text: cross, eventIds: p.crossEventIds });
      }
    }
    const answer =
      `From ${person.displayName}'s logs in ${window}: ${sentences.join(" ")} ` +
      `Possible things to check: ${matching[0].thingsToCheck.map((t) => t.toLowerCase()).join(", ")}. ` +
      `This is what came before in the logs, not a cause or a diagnosis.`;
    return reply("what_comes_before", answer, evidence, true, [...new Set(matching.slice(0, 3).map((p) => p.patternKey))]);
  }

  const days = u.days ?? WINDOW_DAYS;
  const window = windowText(days);
  const found = inScope(between(mine, addDays(today, -(days - 1)), today), s);
  const what = noun(s, person);
  if (found.length < MIN_ENTRIES) return tooFew("what_comes_before", person, found, what, window);

  const contexts = tally(found.flatMap((e) => e.contextBefore));
  if (contexts.length === 0) {
    return reply(
      "what_comes_before",
      `None of the ${found.length} ${what} for ${person.displayName} in ${window} say what came before. ` +
        `When a note says what happened just before a hard moment, Unspoken can count it.`,
      [{ text: `${entries(found.length)} with nothing logged as coming before.`, eventIds: ids(found) }],
      false,
    );
  }
  const lines = contexts.slice(0, 3).map((c) => ({
    text: `${capital(contextPhrase(c.key))} came before ${c.count} of ${found.length} ${what}.`,
    eventIds: ids(found.filter((e) => e.contextBefore.includes(c.key))),
  }));
  const answer =
    `From ${person.displayName}'s logs in ${window}: ${lines.map((l) => l.text).join(" ")} ` +
    `These are possible things to check. This is what came before in the logs, not a cause or a diagnosis.`;
  const related = patterns.filter((p) => contexts.slice(0, 3).some((c) => c.key === p.contextTag) && (!s.eventType || p.eventType === s.eventType));
  return reply("what_comes_before", answer, lines, true, [...new Set(related.map((p) => p.patternKey))]);
}

// ---------- what_helped ----------

interface StepStats {
  tag: string;
  events: LogRecord[];
  helped: number;
  helpedALittle: number;
  didNotHelp: number;
  endedCalm: number;
}

function stepStats(found: LogRecord[]): StepStats[] {
  const byTag = new Map<string, StepStats>();
  for (const e of found) {
    const tags = [...new Set([...(e.responses?.map((r) => r.tag) ?? []), ...e.responseTried])].filter((t) => !RECORD_ONLY_RESPONSES.includes(t));
    for (const tag of tags) {
      const stat = byTag.get(tag) ?? { tag, events: [], helped: 0, helpedALittle: 0, didNotHelp: 0, endedCalm: 0 };
      stat.events.push(e);
      if (e.outcome === "calmed") stat.endedCalm++;
      // Only a result the caregiver gave for this step is counted. How the whole moment ended is shown separately.
      const result = e.responses?.find((r) => r.tag === tag)?.result;
      if (result === "helped") stat.helped++;
      else if (result === "helped_a_little") stat.helpedALittle++;
      else if (result === "did_not_help") stat.didNotHelp++;
      byTag.set(tag, stat);
    }
  }
  return [...byTag.values()].sort((a, b) => b.events.length - a.events.length || b.helped - a.helped || a.tag.localeCompare(b.tag));
}

function whatHelped(u: AskUnderstanding, person: Person, mine: LogRecord[], today: string): AskResponse {
  const days = u.days ?? WINDOW_DAYS;
  const window = windowText(days);
  const s = scopeOf(u, person);
  const found = inScope(between(mine, addDays(today, -(days - 1)), today), s);
  const what = noun(s, person);
  if (found.length < MIN_ENTRIES) return tooFew("what_helped", person, found, what, window);

  const stats = stepStats(found);
  if (stats.length === 0) {
    return reply(
      "what_helped",
      `None of the ${found.length} ${what} for ${person.displayName} in ${window} say what was tried. ` +
        `When a note says what you tried and how it went, Unspoken can count it.`,
      [{ text: `${entries(found.length)} with nothing logged as tried.`, eventIds: ids(found) }],
      false,
    );
  }

  const evidence: Evidence = stats.slice(0, MAX_LINES).map((st) => {
    const n = st.events.length;
    const recorded = st.helped + st.helpedALittle + st.didNotHelp;
    const steps =
      recorded > 0
        ? `Result for this step: helped ${st.helped}, helped a little ${st.helpedALittle}, did not help ${st.didNotHelp}` +
          (recorded < n ? `, not said in ${n - recorded}.` : ".")
        : `The notes did not say how this step went on its own.`;
    const ended = n === 1 ? (st.endedCalm === 1 ? "That moment ended calm." : "That moment did not end calm.") : `${st.endedCalm} of those ${n} moments ended calm.`;
    return { text: `${label(st.tag)}: tried ${times(n)}. ${ended} ${steps}`, eventIds: ids(st.events) };
  });
  const lead = stats
    .slice(0, 3)
    .map((st) => `${label(st.tag).toLowerCase()} (tried ${times(st.events.length)}, ${st.endedCalm} of those moments ended calm)`);
  const answer =
    `From ${person.displayName}'s logs in ${window}, across ${found.length} ${what}, the things tried most often were: ${lead.join("; ")}. ` +
    `The result of each step, where the note gave one, is in the evidence below. ` +
    `This is a count of what was logged, not advice or a diagnosis.`;
  return reply("what_helped", answer, evidence, true);
}

// ---------- how_often ----------

function howOften(u: AskUnderstanding, person: Person, mine: LogRecord[], today: string): AskResponse {
  const days = u.days ?? WINDOW_DAYS;
  const window = windowText(days);
  const s = scopeOf(u, person);
  const all = between(mine, addDays(today, -(days - 1)), today);
  if (all.length < MIN_ENTRIES) return tooFew("how_often", person, all, "entries", window);

  const found = inScope(all, s);
  const what = noun(s, person);
  if (found.length === 0) {
    return reply(
      "how_often",
      `From ${person.displayName}'s logs in ${window}: no ${what} were logged. ${COUNT_NOTE}`,
      [{ text: `${person.displayName} has ${entries(all.length)} in ${window}, and none of them match.`, eventIds: ids(all) }],
      true,
    );
  }
  const perWeek = Math.round((found.length / (days / 7)) * 10) / 10;
  const activeDays = new Set(found.map(dateOf)).size;
  const answer =
    `From ${person.displayName}'s logs in ${window}: ${found.length} ${plural(found.length, what.replace(/entries$/, "entry"), what)}, ` +
    `on ${activeDays} of ${days} days. That is about ${perWeek} per week. ${COUNT_NOTE}`;
  const evidence: Evidence = [{ text: `${found.length} ${plural(found.length, what.replace(/entries$/, "entry"), what)} in ${window}.`, eventIds: ids(found) }];
  if (!s.eventType) {
    for (const t of tally(found.map((e) => e.eventType)).slice(0, 3)) {
      evidence.push({
        text: `${label(t.key, person.mode)}: ${t.count} of ${found.length}.`,
        eventIds: ids(found.filter((e) => e.eventType === t.key)),
      });
    }
  }
  return reply("how_often", answer, evidence, true);
}

// ---------- who_saw_it ----------

function whoSawIt(u: AskUnderstanding, person: Person, mine: LogRecord[], patterns: PatternDetail[], today: string): AskResponse {
  const days = u.days ?? WINDOW_DAYS;
  const window = windowText(days);
  const s = scopeOf(u, person);
  const found = inScope(between(mine, addDays(today, -(days - 1)), today), s);
  const what = noun(s, person);
  if (found.length < MIN_ENTRIES) return tooFew("who_saw_it", person, found, what, window);

  const by = tally(found.map((e) => e.loggedBy));
  const evidence: Evidence = by.map((c) => ({
    text: `${nameOf(person, c.key)} logged ${c.count} of ${found.length} ${what}.`,
    eventIds: ids(found.filter((e) => e.loggedBy === c.key)),
  }));
  let answer =
    `From ${person.displayName}'s logs in ${window}, ${found.length} ${what} were logged by: ` +
    `${by.map((c) => `${nameOf(person, c.key)} (${c.count})`).join(", ")}.`;

  // Cross-caregiver clues come from the computed patterns, which cover the standard window only.
  const cross = days === WINDOW_DAYS ? patterns.filter((p) => p.crossCount > 0 && (!s.eventType || p.eventType === s.eventType) && (!s.timeBand || p.timeBand === s.timeBand)) : [];
  for (const p of cross.slice(0, 2)) {
    const line =
      `${joinWords(p.crossNames)} logged ${contextPhrase(p.contextTag)} earlier in the day on ${p.crossCount} of the ${p.matchCount} days ` +
      `when it came before ${TIME_BAND_LABEL[p.timeBand].toLowerCase()} ${label(p.eventType, person.mode).toLowerCase()}.`;
    answer += ` ${line}`;
    evidence.push({ text: line, eventIds: p.crossEventIds });
  }
  answer += ` This shows who logged what. It is not a cause or a diagnosis.`;
  return reply("who_saw_it", answer, evidence, true, [...new Set(cross.slice(0, 2).map((p) => p.patternKey))]);
}

// ---------- compare_periods ----------

function comparePeriods(u: AskUnderstanding, person: Person, mine: LogRecord[], today: string): AskResponse {
  const days = u.days ?? 7;
  const s = scopeOf(u, person);
  const what = noun(s, person);
  const start = addDays(today, -(days - 1));
  const prevStart = addDays(start, -days);
  const prevEnd = addDays(start, -1);
  const dated = mine.map(dateOf).filter((d): d is string => d !== null);
  if (dated.length === 0) return tooFew("compare_periods", person, [], "entries", `the last ${days * 2} days`);

  const earliest = dated.reduce((min, d) => (d < min ? d : min));
  const current = inScope(between(mine, start, today), s);
  if (earliest > prevStart) {
    // Same rule as the overview: only compare when the logs reach back to the first day of the earlier period.
    return reply(
      "compare_periods",
      `${person.displayName}'s logs do not go back far enough to compare the last ${days} days with the ${days} days before. ` +
        `The first entry is from ${formatDay(earliest)}, and the comparison needs logs from ${formatDay(prevStart)} or earlier. ` +
        `In the last ${days} days there ${plural(current.length, "was", "were")} ${current.length} ${plural(current.length, what.replace(/entries$/, "entry"), what)}.`,
      current.length > 0 ? [{ text: `Last ${days} days: ${current.length} ${plural(current.length, what.replace(/entries$/, "entry"), what)}.`, eventIds: ids(current) }] : [],
      false,
    );
  }

  const previous = inScope(between(mine, prevStart, prevEnd), s);
  const diff = current.length - previous.length;
  const change = diff === 0 ? "That is the same number." : `That is ${Math.abs(diff)} ${diff > 0 ? "more" : "fewer"}.`;
  const answer =
    `From ${person.displayName}'s logs: ${current.length} ${plural(current.length, what.replace(/entries$/, "entry"), what)} in the last ${days} days, ` +
    `and ${previous.length} in the ${days} days before. ${change} ` +
    `A change in the count can also come from how many notes were written. This is a count from the logs, not a judgement about health or a diagnosis.`;
  const evidence: Evidence = [];
  if (current.length > 0) evidence.push({ text: `Last ${days} days: ${entries(current.length)}.`, eventIds: ids(current) });
  if (previous.length > 0) evidence.push({ text: `The ${days} days before: ${entries(previous.length)}.`, eventIds: ids(previous) });
  if (!s.eventType) {
    const types = [...new Set([...current, ...previous].map((e) => e.eventType))]
      .map((type) => ({ type, now: current.filter((e) => e.eventType === type), before: previous.filter((e) => e.eventType === type) }))
      .filter((t) => t.now.length !== t.before.length)
      .sort((a, b) => Math.abs(b.now.length - b.before.length) - Math.abs(a.now.length - a.before.length) || a.type.localeCompare(b.type));
    for (const t of types.slice(0, 3)) {
      evidence.push({
        text: `${label(t.type, person.mode)}: ${t.now.length} in the last ${days} days, ${t.before.length} in the ${days} days before.`,
        eventIds: ids([...t.now, ...t.before]),
      });
    }
  }
  return reply("compare_periods", answer, evidence, true);
}

// ---------- what_is_new ----------

const NEW_RECENT_DAYS = 7;
const NEW_EARLIER_DAYS = 14;

function whatIsNew(u: AskUnderstanding, person: Person, mine: LogRecord[], today: string): AskResponse {
  const s = scopeOf(u, person);
  const what = noun(s, person);
  const recentStart = addDays(today, -(NEW_RECENT_DAYS - 1));
  const earlierStart = addDays(recentStart, -NEW_EARLIER_DAYS);
  const recent = inScope(between(mine, recentStart, today), s);
  const earlier = inScope(between(mine, earlierStart, addDays(recentStart, -1)), s);
  const span = `the last ${NEW_RECENT_DAYS} days`;
  const before = `the ${NEW_EARLIER_DAYS} days before`;

  if (earlier.length === 0) {
    return reply(
      "what_is_new",
      `${person.displayName}'s logs do not go back far enough to tell what is new. There are no ${what} in ${before}, ` +
        `so there is nothing earlier to compare ${span} with (${entries(recent.length)}).`,
      recent.length > 0 ? [{ text: `${capital(span)}: ${entries(recent.length)}.`, eventIds: ids(recent) }] : [],
      false,
    );
  }
  if (recent.length === 0) {
    return reply(
      "what_is_new",
      `From ${person.displayName}'s logs: no ${what} were logged in ${span}, so nothing new was seen. ${capital(before)} hold ${entries(earlier.length)}.`,
      [{ text: `${capital(before)}: ${entries(earlier.length)}.`, eventIds: ids(earlier) }],
      true,
    );
  }

  const evidence: Evidence = [];
  const items: string[] = [];
  if (!s.eventType) {
    const seen = new Set(earlier.map((e) => e.eventType));
    for (const t of tally(recent.map((e) => e.eventType)).filter((t) => !seen.has(t.key))) {
      const list = recent.filter((e) => e.eventType === t.key);
      items.push(`${label(t.key, person.mode).toLowerCase()} (${entries(list.length)})`);
      evidence.push({ text: `${label(t.key, person.mode)}: ${entries(list.length)} in ${span}, none in ${before}.`, eventIds: ids(list) });
    }
  }
  const seenContexts = new Set(earlier.flatMap((e) => e.contextBefore));
  for (const c of tally(recent.flatMap((e) => e.contextBefore)).filter((c) => !seenContexts.has(c.key))) {
    const list = recent.filter((e) => e.contextBefore.includes(c.key));
    items.push(`${contextPhrase(c.key)} logged as coming before (${entries(list.length)})`);
    evidence.push({ text: `${capital(contextPhrase(c.key))} came before ${entries(list.length)} in ${span}, and none in ${before}.`, eventIds: ids(list) });
  }

  if (items.length === 0) {
    return reply(
      "what_is_new",
      `From ${person.displayName}'s logs: nothing new. Every kind of entry and everything logged as coming before in ${span} ` +
        `(${entries(recent.length)}) was also seen in ${before} (${entries(earlier.length)}).`,
      [
        { text: `${capital(span)}: ${entries(recent.length)}.`, eventIds: ids(recent) },
        { text: `${capital(before)}: ${entries(earlier.length)}.`, eventIds: ids(earlier) },
      ],
      true,
    );
  }
  const answer =
    `New in ${person.displayName}'s logs in ${span}, compared with ${before}: ${items.slice(0, MAX_LINES).join("; ")}. ` +
    `New here means new in the logs. It is not a cause or a diagnosis.`;
  return reply("what_is_new", answer, evidence.slice(0, MAX_LINES), true);
}

// ---------- entry point ----------

// Computes the answer for a data intent, or the fixed text for about_the_app and other.
// `events` may hold other people's entries: only the selected person's are ever read.
// medical_out_of_scope and crisis are answered with the fixed safety messages in src/lib/askRouter.ts;
// if one reaches this function it gets the guidance line, never a computed answer.
export function answerFor(
  understanding: AskUnderstanding,
  person: Person,
  events: LogRecord[],
  patterns: PatternDetail[],
  today: string = demoToday(),
): AskResponse {
  const mine = events.filter((e) => e.personId === person.id);
  const own = patterns.filter((p) => p.personId === person.id);
  switch (understanding.intent) {
    case "when_does_it_happen":
      return whenDoesItHappen(understanding, person, mine, own, today);
    case "what_comes_before":
      return whatComesBefore(understanding, person, mine, own, today);
    case "what_helped":
      return whatHelped(understanding, person, mine, today);
    case "how_often":
      return howOften(understanding, person, mine, today);
    case "who_saw_it":
      return whoSawIt(understanding, person, mine, own, today);
    case "compare_periods":
      return comparePeriods(understanding, person, mine, today);
    case "what_is_new":
      return whatIsNew(understanding, person, mine, today);
    case "about_the_app":
      return reply("about_the_app", ABOUT_ANSWER, [], true);
    default:
      return reply("other", OTHER_ANSWER, [], true);
  }
}
