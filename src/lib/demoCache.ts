// Exact-input cache for the scripted demo phrases (docs/PRD.md section 9), so the
// live demo never depends on the network and gives the same card every time. Owner: Lane 2.
// Only the three phrases below hit this cache. Everything else goes to the formatter.
import type { LogRecord, ParseLogRequest, ParseLogResponse } from "./types";
import { addDays, bandForHour, isoAt, nowIso, wallParts, type WallParts } from "./time";
import { DEMO_PHRASES } from "../mocks/log";

export { DEMO_PHRASES };

type Draft = Omit<LogRecord, "id" | "loggedAt">;

// Same note regardless of case, punctuation, or spacing (speech to text varies on those).
export function demoKey(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9 ]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function clockFrom(now: string): WallParts {
  return wallParts(now) ?? (wallParts(nowIso()) as WallParts);
}

// A wall-clock time today; if that is still more than an hour ahead of now, it was yesterday.
export function resolveToday(now: WallParts, hour: number, minute: number): string {
  const ahead = hour * 60 + minute - (now.hour * 60 + now.minute);
  const date = ahead > 60 ? addDays(now.date, -1) : now.date;
  return isoAt(date, hour, minute, now.offset);
}

type Entry = { mode: Draft["mode"]; hour: number; minute: number; fields: Omit<Draft, "mode" | "loggedBy" | "occurredAt" | "timeBand" | "rawNote" | "source"> & { loggedBy?: string } };

const ENTRIES: Record<string, Entry> = {
  [demoKey(DEMO_PHRASES.D1)]: {
    mode: "dementia", hour: 15, minute: 0,
    fields: {
      personId: "p_helen", eventType: "agitation", behaviors: ["pacing", "calling_out"], intensity: 2, durationMin: 20,
      contextBefore: ["skipped_meal"], environment: [], responseTried: ["offered_snack", "music"], outcome: "calmed",
      confidence: { personId: 0.95, eventType: 0.95, occurredAt: 0.8, intensity: 0.6 },
      needsReview: ["intensity"], redFlags: [],
    },
  },
  // D2 differs from the mock on purpose: eval case G02 expects the small lunch tagged as
  // skipped_meal in the afternoon band (lunch is 12:30), which is also what the live formatter returns.
  [demoKey(DEMO_PHRASES.D2)]: {
    mode: "dementia", hour: 12, minute: 30,
    fields: {
      personId: "p_helen", loggedBy: "cg_rosa", eventType: "refused_food", behaviors: [], intensity: 1, durationMin: null,
      contextBefore: ["skipped_meal"], environment: ["mealtime"], responseTried: [], outcome: "unknown",
      confidence: { personId: 0.95, eventType: 0.9, occurredAt: 0.6, intensity: 0.7 },
      needsReview: ["occurredAt"], redFlags: [],
    },
  },
  [demoKey(DEMO_PHRASES.A1)]: {
    mode: "autism", hour: 8, minute: 15,
    fields: {
      personId: "p_arjun", eventType: "meltdown", behaviors: [], intensity: 3, durationMin: null,
      contextBefore: ["poor_sleep", "routine_change"], environment: ["school"], responseTried: [], outcome: "unknown",
      confidence: { personId: 0.95, eventType: 0.96, occurredAt: 0.6, intensity: 0.85 },
      needsReview: ["occurredAt"], redFlags: [],
    },
  },
};

// Returns the cached response for D1, D2 or A1, or null for any other note.
// The phrase must be said in its own mode, so a dementia phrase typed in autism mode goes to the formatter.
export function cachedDemoResponse(req: ParseLogRequest): ParseLogResponse | null {
  const entry = ENTRIES[demoKey(req.transcript)];
  if (!entry || entry.mode !== req.mode) return null;
  const occurredAt = resolveToday(clockFrom(req.now), entry.hour, entry.minute);
  const { loggedBy, ...fields } = entry.fields;
  const draft: Draft = {
    mode: entry.mode,
    loggedBy: loggedBy ?? req.loggedBy,
    occurredAt,
    timeBand: bandForHour(entry.hour),
    source: "voice",
    rawNote: req.transcript.trim(),
    ...fields,
    behaviors: [...fields.behaviors],
    contextBefore: [...fields.contextBefore],
    environment: [...fields.environment],
    responseTried: [...fields.responseTried],
    confidence: { ...fields.confidence },
    needsReview: [...fields.needsReview],
    redFlags: [],
  };
  return { kind: "event", message: null, draft, unmatchedPerson: false, candidates: [] };
}
