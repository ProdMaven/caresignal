// Shared types. Source of truth. Changes only through the PM.
// Scaffold copies this to src/lib/types.ts.

export type Mode = "dementia" | "autism";
export type TimeBand = "early_morning" | "morning" | "afternoon" | "evening" | "night";
export type Intensity = 1 | 2 | 3;
export type Outcome = "calmed" | "partly_calmed" | "escalated" | "unknown";
export type Source = "voice" | "tap";

export interface Person {
  id: string;
  mode: Mode;
  displayName: string;
  aliases: string[];
  ageBandOrSetting: string;
  isFeatured: boolean;
}

export interface LogRecord {
  id: string;
  mode: Mode;
  personId: string;
  loggedBy: string;
  occurredAt: string; // ISO
  timeBand: TimeBand;
  loggedAt: string; // ISO
  source: Source;
  eventType: string; // from DATA_MODEL vocabulary for the mode
  behaviors: string[];
  intensity: Intensity;
  durationMin: number | null;
  contextBefore: string[];
  environment: string[];
  responseTried: string[];
  outcome: Outcome;
  rawNote: string;
  confidence: Record<string, number>;
  needsReview: string[];
  redFlags: string[];
}

// POST /api/log  (parse only; does not save)
export interface ParseLogRequest {
  mode: Mode;
  transcript: string;
  loggedBy: string;
  now: string; // ISO, client clock, used to resolve "around 3"
}
export interface ParseLogResponse {
  draft: Omit<LogRecord, "id" | "loggedAt">;
  unmatchedPerson: boolean; // true if name not in roster
  candidates: Person[]; // if ambiguous
}

// POST /api/events  (save a confirmed draft)
export interface SaveEventRequest { record: Omit<LogRecord, "id" | "loggedAt"> }
export interface SaveEventResponse { record: LogRecord }

// GET /api/people?mode=
export interface PeopleResponse { people: Person[] }

// GET /api/people/[id]/events?days=21
export interface EventsResponse { events: LogRecord[] }

export interface PatternCard {
  id: string;
  personId: string;
  eventType: string;
  timeBand: TimeBand;
  contextTag: string;
  matchCount: number;
  totalCount: number;
  windowDays: number;
  confidence: "medium" | "high";
  crossShift: boolean;
  summary: string; // Claude one-liner from the numbers only
  thingsToCheck: string[]; // possible unmet needs, never diagnoses
  patternKey: string; // eventType|contextTag
  evidenceEventIds: string[];
}
// GET /api/patterns?personId=
export interface PatternsResponse { patterns: PatternCard[] }

// POST /api/ask
export interface AskRequest { mode: Mode; personId: string; question: string }
export interface AskResponse {
  redFlag: boolean;
  redFlagMessage: string | null; // shown first when redFlag
  answer: string;
  evidence: { text: string; eventIds: string[] }[];
  relatedPatternKeys: string[];
  dataSufficient: boolean;
}

export type Tier =
  | "not_recommended"
  | "emerging"
  | "promising"
  | "winning"
  | "winning_research";

export interface StrategyCard {
  id: string;
  name: string;
  description: string;
  patternKey: string;
  score: number;
  tier: Tier;
  families: number;
  pctImproved: number; // 0..1
  avgDropPct: number; // 0..1, negative if worse
  durabilityPct: number; // 0..1
  researchBacked: boolean;
}
// GET /api/strategies?mode=&patternKey=
export interface StrategiesResponse { strategies: StrategyCard[]; disclaimer: string }
