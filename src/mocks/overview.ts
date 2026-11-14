// Weekly and monthly overview. Plain counts from the logs and the caregiver's journal. No AI.
import { addDays, demoToday, TIME_BAND_ORDER, wallParts } from "../lib/time";
import { RECORD_ONLY_RESPONSES } from "../lib/schemas";
import type { JournalEntry, LogRecord, Mood, OverviewResponse } from "../lib/types";

// Did this step help in this event? Uses the step's own result when the note gave one;
// older records without step results fall back to how the whole event ended.
function stepHelped(e: LogRecord, tag: string): boolean {
  const step = e.responses?.find((r) => r.tag === tag);
  if (step && step.result !== "unknown") return step.result === "helped";
  return e.outcome === "calmed" && (e.responses === undefined || e.responseTried.length === 1);
}

function dateOf(iso: string): string | null {
  return wallParts(iso)?.date ?? null;
}

function tally(values: string[]): { key: string; count: number }[] {
  const counts = new Map<string, number>();
  values.forEach((v) => counts.set(v, (counts.get(v) ?? 0) + 1));
  return [...counts.entries()].map(([key, count]) => ({ key, count })).sort((a, b) => b.count - a.count || a.key.localeCompare(b.key));
}

export function buildOverview(
  personId: string, days: 7 | 30, events: LogRecord[], journal: JournalEntry[], today: string = demoToday(),
): OverviewResponse {
  const start = addDays(today, -(days - 1));
  const prevStart = addDays(start, -days);
  const mine = events.filter((e) => e.personId === personId);
  const dated = mine.map((e) => ({ e, date: dateOf(e.occurredAt) })).filter((x): x is { e: LogRecord; date: string } => x.date !== null);
  const current = dated.filter((x) => x.date >= start && x.date <= today).map((x) => x.e);
  const previous = dated.filter((x) => x.date >= prevStart && x.date < start);
  const earliest = dated.reduce<string | null>((min, x) => (min === null || x.date < min ? x.date : min), null);
  // Only compare with the period before when the logs reach back to its first day.
  const hasPrevious = earliest !== null && earliest <= prevStart;

  const eventDays = new Set(current.map((e) => dateOf(e.occurredAt)));
  const responses = tally(current.flatMap((e) => e.responseTried.filter((t) => !RECORD_ONLY_RESPONSES.includes(t))));

  const entries = journal.filter((j) => {
    const d = dateOf(j.createdAt);
    return d !== null && d >= start && d <= today;
  });

  return {
    personId,
    days,
    hardMoments: current.length,
    previousHardMoments: hasPrevious ? previous.length : null,
    daysWithNone: days - eventDays.size,
    byTimeBand: TIME_BAND_ORDER.map((timeBand) => ({ timeBand, count: current.filter((e) => e.timeBand === timeBand).length })),
    topContexts: tally(current.flatMap((e) => e.contextBefore)).slice(0, 5),
    whatHelped: responses.slice(0, 5).map((r) => ({
      key: r.key,
      tried: r.count,
      calmed: current.filter((e) => e.responseTried.includes(r.key) && stepHelped(e, r.key)).length,
    })),
    journal: {
      entries: entries.length,
      moods: tally(entries.flatMap((j) => (j.mood ? [j.mood] : []))).map((m) => ({ mood: m.key as Mood, count: m.count })),
    },
  };
}
