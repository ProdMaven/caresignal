// Mock for GET /api/patterns. Counts are computed from the in-memory events with
// the deterministic rule in docs/DATA_MODEL.md, so a judge's saved note moves the
// numbers. The summary line is a template here; Lane 2 swaps in Claude's wording,
// Lane 3 moves the counting to src/lib/patterns.ts.
import type { LogRecord, PatternCard, PatternsResponse, TimeBand } from "../lib/types";
import { addDays, demoToday, TIME_BAND_LABEL, wallParts } from "../lib/time";
import { caregiverName, label } from "../config/modes";
import { WINDOW_DAYS } from "./data";
import { features } from "../lib/features";
import { similarityTags } from "../lib/semantic/index";

const MIN_EVENTS = 4;
const MIN_RATIO = 0.6;
const MAX_CARDS = 3;
const CROSS_WINDOW_MS = 18 * 60 * 60 * 1000;

// Event types that another caregiver may have logged earlier, standing for the same context.
const RELATED_EVENT_TYPES: Record<string, string[]> = {
  skipped_meal: ["refused_food", "food_refusal"],
  poor_sleep: ["sleep_trouble", "sleep_disturbance"],
};

const CONTEXT_PHRASE: Record<string, string> = {
  skipped_meal: "a skipped or small meal",
  poor_sleep: "a night of poor sleep",
  visitor: "a visit",
  routine_change: "a change in routine",
  transition: "a transition",
  toileting_need: "needing the toilet",
  loud_noise: "loud noise",
  screen_time_ended: "screen time ending",
  bathing: "bath or shower time",
};

// Most contexts come before the moment. Bathing happens at the same time, so the line says so.
const SUMMARY_LINK: Record<string, string> = { bathing: "happened around" };

const CROSS_PHRASE: Record<string, string> = {
  skipped_meal: "the small or skipped meal",
  poor_sleep: "the poor sleep",
};

// Possible unmet needs to check. Never causes, never diagnoses.
const THINGS_TO_CHECK: Record<string, string[]> = {
  skipped_meal: ["Hunger", "Pain or discomfort", "Tiredness"],
  poor_sleep: ["Tiredness", "A rushed or changed morning", "Hunger before leaving the house"],
  visitor: ["Tiredness after a busy day", "Too much noise or activity", "Need for quiet time"],
  routine_change: ["Not knowing what comes next", "Need for more warning before a change", "Tiredness"],
  bathing: ["Feeling cold or exposed", "Pain when moving or being touched", "Fear of the water or of falling"],
  screen_time_ended: ["Not enough warning before it ends", "Tiredness or hunger at that time of day", "Not knowing what comes next"],
  loud_noise: ["Too much noise for too long", "Tiredness after a busy day", "Needing a quiet break sooner"],
};
const DEFAULT_THINGS = ["Hunger or thirst", "Tiredness", "Pain or discomfort"];

export interface PatternDetail extends PatternCard {
  crossCount: number; // match events where another caregiver logged the context earlier
  crossNames: string[];
  crossEventIds: string[];
  loggedByCounts: Record<string, number>;
}

export function contextPhrase(tag: string): string {
  return CONTEXT_PHRASE[tag] ?? label(tag).toLowerCase();
}

export function eventsInWindow(events: LogRecord[], days: number = WINDOW_DAYS, today: string = demoToday()): LogRecord[] {
  const cutoff = addDays(today, -(days - 1));
  return events.filter((e) => {
    const p = wallParts(e.occurredAt);
    return p ? p.date >= cutoff : true;
  });
}

function joinNames(names: string[]): string {
  if (names.length <= 1) return names[0] ?? "Another caregiver";
  return `${names.slice(0, -1).join(", ")} and ${names[names.length - 1]}`;
}

export function computePatterns(personId: string, allEvents: LogRecord[], today: string = demoToday()): PatternDetail[] {
  const events = eventsInWindow(allEvents.filter((e) => e.personId === personId), WINDOW_DAYS, today);
  const groups = new Map<string, LogRecord[]>();
  for (const e of events) {
    const key = `${e.eventType}|${e.timeBand}`;
    groups.set(key, [...(groups.get(key) ?? []), e]);
  }

  const found: PatternDetail[] = [];
  for (const [key, group] of groups) {
    if (group.length < MIN_EVENTS) continue;
    const [eventType, timeBand] = key.split("|") as [string, TimeBand];
    // Semantic matching (flag): an entry whose wording is close in meaning to a tag is counted with it.
    // The index only says which entries are related; the counting below is unchanged.
    const joined = new Map<string, Map<string, { clause: string; score: number }>>();
    if (features.semanticMatch()) {
      for (const e of group) for (const t of similarityTags(e)) {
        if (!joined.has(t.tag)) joined.set(t.tag, new Map());
        joined.get(t.tag)!.set(e.id, { clause: t.clause, score: t.score });
      }
    }
    const tags = new Set([...group.flatMap((e) => e.contextBefore), ...joined.keys()]);
    for (const tag of tags) {
      const bySimilarity = joined.get(tag);
      const matches = group.filter((e) => e.contextBefore.includes(tag) || bySimilarity?.has(e.id));
      const ratio = matches.length / group.length;
      if (matches.length < MIN_EVENTS || ratio < MIN_RATIO) continue;

      // Cross-caregiver: a different person logged the same context earlier that day.
      const related = RELATED_EVENT_TYPES[tag] ?? [];
      const crossNames: string[] = [];
      const crossEventIds: string[] = [];
      let crossCount = 0;
      for (const m of matches) {
        const at = Date.parse(m.occurredAt);
        const earlier = events.filter((o) => {
          if (o.id === m.id || o.loggedBy === m.loggedBy || !related.includes(o.eventType)) return false;
          const gap = at - Date.parse(o.occurredAt);
          return gap >= 0 && gap <= CROSS_WINDOW_MS;
        });
        if (earlier.length === 0) continue;
        crossCount++;
        for (const o of earlier) {
          crossEventIds.push(o.id);
          const name = caregiverName(o.loggedBy);
          if (!crossNames.includes(name)) crossNames.push(name);
        }
      }

      const loggedByCounts: Record<string, number> = {};
      for (const m of matches) loggedByCounts[m.loggedBy] = (loggedByCounts[m.loggedBy] ?? 0) + 1;

      let summary =
        `${TIME_BAND_LABEL[timeBand]} ${label(eventType).toLowerCase()} ${SUMMARY_LINK[tag] ?? "followed"} ${contextPhrase(tag)} ` +
        `on ${matches.length} of ${group.length} occasions in the last 3 weeks.`;
      if (crossCount > 0) {
        summary += ` ${joinNames(crossNames)} logged ${CROSS_PHRASE[tag] ?? contextPhrase(tag)} earlier on ${crossCount} of those days.`;
      }

      found.push({
        id: `pat_${personId}_${eventType}_${timeBand}_${tag}`,
        personId,
        eventType,
        timeBand,
        contextTag: tag,
        matchCount: matches.length,
        totalCount: group.length,
        windowDays: WINDOW_DAYS,
        confidence: group.length >= 6 && ratio >= 0.75 ? "high" : "medium",
        crossShift: crossCount > 0,
        summary,
        thingsToCheck: THINGS_TO_CHECK[tag] ?? DEFAULT_THINGS,
        patternKey: `${eventType}|${tag}`,
        evidenceEventIds: matches.map((m) => m.id),
        crossCount,
        crossNames,
        crossEventIds,
        loggedByCounts,
        ...(bySimilarity && bySimilarity.size > 0
          ? { similarityJoined: matches.filter((m) => bySimilarity.has(m.id)).map((m) => ({ eventId: m.id, ...bySimilarity.get(m.id)! })) }
          : {}),
      });
    }
  }

  found.sort((a, b) => {
    if (a.confidence !== b.confidence) return a.confidence === "high" ? -1 : 1;
    if (a.crossShift !== b.crossShift) return a.crossShift ? -1 : 1;
    return b.matchCount - a.matchCount;
  });
  return found.slice(0, MAX_CARDS);
}

export function toPatternCard(detail: PatternDetail): PatternCard {
  const { crossCount, crossNames, crossEventIds, loggedByCounts, ...card } = detail;
  void crossCount; void crossNames; void crossEventIds; void loggedByCounts;
  return card;
}

export function mockPatterns(personId: string, allEvents: LogRecord[]): PatternsResponse {
  return { patterns: computePatterns(personId, allEvents).map(toPatternCard) };
}
