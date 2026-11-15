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
  // v6: the people who care for this person. "Who is logging?" lists these, not another family's caregivers.
  caregivers?: CaregiverRef[];
  // v9: the caregiver's own account of the journey so far, as dated milestones. Reported by the caregiver, never a diagnosis by the app.
  history?: Milestone[];
}

export interface CaregiverRef { id: string; name: string; role: string } // role in plain words, for example "father" or "home aide"

export type AgeBand = "2_5" | "6_11" | "12_17" | "adult";
export type Gender = "girl_or_woman" | "boy_or_man" | "nonbinary" | "prefer_not_to_say";
export type SpectrumLevel = "mild" | "medium" | "severe"; // as the caregiver describes it
export type CommunicationLevel = "speaks_in_sentences" | "some_words" | "mostly_non_speaking";

// How one thing the caregiver tried turned out, as the caregiver described it.
export type StepResult = "helped" | "helped_a_little" | "did_not_help" | "unknown";
export interface ResponseStep { tag: string; result: StepResult }

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
  responseTried: string[]; // the tags from `responses`, as a flat list
  // v5: what was tried, in the order it was tried, each with its own result. Optional so older records stay valid.
  responses?: ResponseStep[];
  outcome: Outcome;
  rawNote: string;
  confidence: Record<string, number>;
  needsReview: string[];
  redFlags: string[];
  // v10: language of the note as given (BCP 47, for example "en", "es", "hi", "zh"; "mixed" allowed). rawNote is never translated.
  noteLanguage?: string;
}

// POST /api/log  (parse only; does not save)
export interface ParseLogRequest {
  mode: Mode;
  transcript: string;
  loggedBy: string;
  now: string; // ISO, client clock, used to resolve "around 3"
  // v7: the person picked on screen. It wins unless the note clearly names someone else on the list;
  // then the draft keeps the picked person and `candidates` holds [named person, picked person] so the card can ask.
  personId?: string;
  speechLang?: string; // v10: from the mic language picker; a hint only
  followUpAnswered?: boolean; // v10: true when this note already includes a follow-up answer, so no second question is asked
}
export interface ParseLogResponse {
  // event: a normal log. caregiver_distress: the speaker is in distress (show care + 988, do not log).
  // out_of_scope: a question the app does not answer (diagnosis, medication, placement); show message, log any event part only.
  kind: "event" | "caregiver_distress" | "out_of_scope";
  message: string | null; // safety or scope message shown before anything else
  draft: Omit<LogRecord, "id" | "loggedAt"> | null;
  unmatchedPerson: boolean; // true if name not in roster
  candidates: Person[]; // if ambiguous
  followUp?: FollowUp | null; // v10: at most one question for the piece that would help most; null or absent when nothing is asked
}

// v10: one follow-up question. Code picks the field; the model only phrases the question.
export interface FollowUp { field: "contextBefore" | "stepResult" | "occurredAt"; question: string }

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
  intent?: AskIntent; // v10: what the question was understood to be
  source?: "model" | "fallback" | "safety"; // v10: which path chose the intent
}

// v10: Ask router. A fast model returns only a label and parameters; code computes the answer.
export type AskIntent =
  | "when_does_it_happen" | "what_comes_before" | "what_helped" | "how_often"
  | "who_saw_it" | "compare_periods" | "what_is_new" | "about_the_app"
  | "medical_out_of_scope" | "crisis" | "other";
export interface AskUnderstanding { intent: AskIntent; eventType?: string; timeBand?: TimeBand; days?: 7 | 14 | 30 }

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

// POST /api/reset  (restore seeded demo data; test servers only, there is no button)
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
  caregivers?: { name: string; role: string }[]; // first names or nicknames only; the first entry is the person filling in the form
  history?: MilestoneInput[];
}
export interface CreatePersonResponse { person: Person }

// POST /api/invite  (invitation-only entry; sets an httpOnly cookie when the code is valid)
export interface InviteRequest { code: string }
export interface InviteResponse { ok: boolean; message: string | null }

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

// GET /api/overview?personId=&days=7|30  (weekly or monthly overview; counts only, computed in code)
export interface OverviewCount { key: string; count: number }
export interface OverviewResponse {
  personId: string;
  days: 7 | 30;
  hardMoments: number; // logged events in the period
  previousHardMoments: number | null; // same-length period before; null when the logs do not go back that far
  daysWithNone: number; // days in the period with no logged event
  byTimeBand: { timeBand: TimeBand; count: number }[]; // all five bands, in day order
  topContexts: OverviewCount[]; // contextBefore tags, most frequent first
  whatHelped: { key: string; tried: number; calmed: number }[]; // responseTried tags and how often the outcome was calmed
}

// History: milestones since the condition was first noticed or diagnosed, up to today.
// The caregiver speaks or types the story; POST /api/history/format turns it into milestones they can check and edit.
export type MilestoneCategory = "diagnosis" | "change" | "support" | "health" | "setting" | "other";
export interface Milestone {
  id: string;
  when: string; // as shown, for example "2021", "March 2023", "About 3 years ago"
  year: number | null; // for ordering; null when the caregiver gave no date
  month: number | null; // 1 to 12, or null
  category: MilestoneCategory;
  text: string; // one plain sentence. No medicine names or doses.
}
export type MilestoneInput = Omit<Milestone, "id"> & { id?: string };

// POST /api/history/format  (parse only; does not save)
export interface FormatHistoryRequest { mode: Mode; text: string; now: string }
export interface FormatHistoryResponse {
  // milestones: the story was turned into milestones. caregiver_distress: the speaker is in distress (care + 988).
  // out_of_scope: a question or request the app does not answer.
  kind: "milestones" | "caregiver_distress" | "out_of_scope";
  message: string | null;
  milestones: MilestoneInput[];
}

// PATCH /api/people/[id]  (edit a Care Profile, including its history). Only people added through intake can be edited.
export interface UpdatePersonRequest {
  displayName?: string;
  aliases?: string[];
  ageBand?: AgeBand;
  gender?: Gender | null;
  spectrumLevel?: SpectrumLevel;
  communicationLevel?: CommunicationLevel;
  caregivers?: { id?: string; name: string; role: string }[]; // an id keeps an existing caregiver; no id adds one
  history?: MilestoneInput[];
}
export interface UpdatePersonResponse { person: Person }

// v10: visit and handoff summary. POST /api/summary
// Code builds the facts; the model only writes the sections; code checks the draft and falls back to templates.
export type SummaryAudience = "doctor" | "therapist_school" | "caregiver_handoff";
export interface SummaryRequest { mode: Mode; personId: string; audience: SummaryAudience; days: 7 | 14 | 30 }
export interface SummarySection { heading: string; text: string; eventIds: string[] }
export interface SummaryResponse {
  safetyNotes: { text: string; eventIds: string[] }[]; // red-flag entries in the window, listed first, fixed wording
  title: string; // for example "Helen: last 14 days"
  sections: SummarySection[];
  questionsToAsk: string[]; // questions for the professional, never conclusions
  dataSufficient: boolean; // false when fewer than 3 entries; then sections explain what to log
  source: "model" | "fallback";
  disclaimer: string; // fixed: "Written from caregiver logs. Not a diagnosis. Discuss with your care team."
}

// v10: which optional AI features are switched on for this server. GET /api/features
export interface FeaturesResponse { multilingualSafety: boolean; summary: boolean; followUp: boolean; askRouter: boolean }
