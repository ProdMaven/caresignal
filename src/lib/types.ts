// Shared types. Source of truth. Changes only through the PM.
// Scaffold copies this to src/lib/types.ts.

export type Mode = "dementia" | "autism";
export type TimeBand = "early_morning" | "morning" | "afternoon" | "evening" | "night";
export type Intensity = 1 | 2 | 3;
export type Outcome = "calmed" | "partly_calmed" | "escalated" | "unknown";
export type Source = "voice" | "tap" | "text"; // text: typed into the box next to the mic

export interface Person {
  id: string;
  mode: Mode;
  displayName: string;
  aliases: string[];
  ageBandOrSetting: string;
  isFeatured: boolean;
  // Intake profile (v3). Caregiver-reported, never a diagnosis. All optional so seeded people stay valid.
  ageBand?: AgeBand;
  gender?: Gender; // optional at intake; used for bias audits and display only, never to branch logic
  spectrumLevel?: SpectrumLevel; // autism mode only
  communicationLevel?: CommunicationLevel;
}

export type AgeBand = "2_5" | "6_11" | "12_17" | "adult";
export type Gender = "girl_or_woman" | "boy_or_man" | "nonbinary" | "prefer_not_to_say";
export type SpectrumLevel = "mild" | "medium" | "severe"; // as the caregiver describes it
export type CommunicationLevel = "speaks_in_sentences" | "some_words" | "mostly_non_speaking";

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
  // event: a normal log. caregiver_distress: the speaker is in distress (show care + 988, do not log).
  // out_of_scope: a question the app does not answer (diagnosis, medication, placement); show message, log any event part only.
  kind: "event" | "caregiver_distress" | "out_of_scope";
  message: string | null; // safety or scope message shown before anything else
  draft: Omit<LogRecord, "id" | "loggedAt"> | null;
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
  feedback?: StrategyFeedback; // "Did this help?" answers, shown next to the score, never part of it
}
// GET /api/strategies?mode=&patternKey=
export interface StrategiesResponse { strategies: StrategyCard[]; disclaimer: string }

// POST /api/reset  (restore seeded demo data; "Reset demo data" button)
export interface ResetResponse { ok: boolean; eventCount: number }

// POST /api/people  (caregiver intake: create a profile for the person they care for)
export interface CreatePersonRequest {
  mode: Mode;
  displayName: string; // first name or nickname only
  aliases: string[]; // for example "my son", "Mom"
  ageBand: AgeBand;
  gender?: Gender;
  spectrumLevel?: SpectrumLevel; // required in autism mode
  communicationLevel: CommunicationLevel;
}
export interface CreatePersonResponse { person: Person }

// POST /api/invite  (invitation-only entry; sets an httpOnly cookie when the code is valid)
export interface InviteRequest { code: string }
export interface InviteResponse { ok: boolean; message: string | null }

// POST /api/checkin  (caregiver check-in: warm listening only. Never saved, never added to anyone's log.)
export type Mood = "okay" | "tired" | "overwhelmed" | "sad" | "worried" | "hopeful";
export interface CheckInRequest { text: string; mood?: Mood }
export interface CheckInResponse {
  // listening: a warm reply, no advice. crisis: the caregiver may be in danger, show 988 first.
  // care_team: the note describes a red flag or emergency about the person they care for.
  kind: "listening" | "crisis" | "care_team";
  message: string;
  saved: false; // always false: check-ins are not stored
}

// "Did this help?" feedback on a suggested next step. One answer per caregiver per strategy.
// Counts are shown only when 5 or more caregivers answered, and never change the score.
export interface StrategyFeedback {
  helped: number;
  notHelped: number;
  yourAnswer: boolean | null; // this caregiver's own answer, if any
}
// POST /api/feedback
export interface FeedbackRequest { strategyId: string; helped: boolean }
export interface FeedbackResponse { strategyId: string; feedback: StrategyFeedback }

// Caregiver journal: the caregiver's own dated notes about their experience (voice or typed).
// Kept under the caregiver's name. Never added to the log of the person they care for.
export interface JournalEntry {
  id: string;
  loggedBy: string; // caregiver id
  mode: Mode;
  createdAt: string; // ISO
  text: string;
  mood: Mood | null;
  source: "voice" | "text";
}
// POST /api/journal
export interface JournalRequest { loggedBy: string; mode: Mode; text: string; mood?: Mood; source: "voice" | "text"; now: string }
export interface JournalResponse {
  entry: JournalEntry;
  // Safety message shown before anything else: 988 for caregiver distress, care team or 911 for a red flag
  // about the person they care for. null when nothing was triggered.
  kind: "saved" | "crisis" | "care_team";
  message: string | null;
}
// GET /api/journal?loggedBy=
export interface JournalListResponse { entries: JournalEntry[] } // newest first
