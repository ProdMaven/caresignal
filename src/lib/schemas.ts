// zod schemas for the shared types in src/lib/types.ts.
// Used to validate request bodies now, and AI output later (Lane 2).
import { z } from "zod";

export const modeSchema = z.enum(["dementia", "autism"]);
export const timeBandSchema = z.enum(["early_morning", "morning", "afternoon", "evening", "night"]);
export const outcomeSchema = z.enum(["calmed", "partly_calmed", "escalated", "unknown"]);
export const sourceSchema = z.enum(["voice", "tap", "text"]);
export const intensitySchema = z.union([z.literal(1), z.literal(2), z.literal(3)]);

export const draftRecordSchema = z.object({
  mode: modeSchema,
  personId: z.string().min(1),
  loggedBy: z.string().min(1),
  occurredAt: z.string().min(1),
  timeBand: timeBandSchema,
  source: sourceSchema,
  eventType: z.string().min(1),
  behaviors: z.array(z.string()),
  intensity: intensitySchema,
  durationMin: z.number().int().nonnegative().nullable(),
  contextBefore: z.array(z.string()),
  environment: z.array(z.string()),
  responseTried: z.array(z.string()),
  outcome: outcomeSchema,
  rawNote: z.string().max(2000),
  confidence: z.record(z.string(), z.number()),
  needsReview: z.array(z.string()),
  redFlags: z.array(z.string()),
});

export const parseLogRequestSchema = z.object({
  mode: modeSchema,
  transcript: z.string().trim().min(1, "Please say or type a note first.").max(2000),
  loggedBy: z.string().min(1),
  now: z.string().min(1),
});

export const saveEventRequestSchema = z.object({ record: draftRecordSchema });

export const askRequestSchema = z.object({
  mode: modeSchema,
  personId: z.string().min(1),
  question: z.string().trim().min(1, "Please ask a question first.").max(1000),
});

export const inviteRequestSchema = z.object({ code: z.string().trim().min(1, "Please enter your invite code.").max(64) });

export const ageBandSchema = z.enum(["2_5", "6_11", "12_17", "adult"]);
export const genderSchema = z.enum(["girl_or_woman", "boy_or_man", "nonbinary", "prefer_not_to_say"]);
export const spectrumLevelSchema = z.enum(["mild", "medium", "severe"]);
export const communicationLevelSchema = z.enum(["speaks_in_sentences", "some_words", "mostly_non_speaking"]);

export const createPersonRequestSchema = z
  .object({
    mode: modeSchema,
    displayName: z.string().trim().min(1, "Please add a first name or nickname.").max(40),
    aliases: z.array(z.string().trim().min(1).max(40)).max(6),
    ageBand: ageBandSchema,
    gender: genderSchema.optional(),
    spectrumLevel: spectrumLevelSchema.optional(),
    communicationLevel: communicationLevelSchema,
  })
  .refine((v) => v.mode !== "autism" || v.spectrumLevel !== undefined, {
    message: "Please choose a spectrum level.",
    path: ["spectrumLevel"],
  });

export function firstIssue(error: z.ZodError): string {
  const issue = error.issues[0];
  if (!issue) return "Invalid request.";
  const path = issue.path.join(".");
  return path ? `${path}: ${issue.message}` : issue.message;
}

// ---------------------------------------------------------------------------
// Formatter (POST /api/log, Lane 2). Additive: nothing above this line changed.
// ---------------------------------------------------------------------------

// Controlled vocabulary from docs/DATA_MODEL.md. The formatter may only output these values.
export const EVENT_TYPES = {
  dementia: ["agitation", "calling_out", "wandering", "refused_care", "refused_food", "restlessness", "crying", "sleep_disturbance"],
  autism: ["meltdown", "shutdown", "stimming_increase", "sleep_trouble", "food_refusal", "transition_distress", "aggression", "elopement"],
} as const;

export const BEHAVIORS = [
  "pacing", "calling_out", "crying", "hitting", "kicking", "throwing", "screaming", "rocking", "covering_ears",
  "withdrawing", "repetitive_speech", "grabbing", "biting", "running_off", "head_banging",
] as const;

export const CONTEXT_BEFORE = [
  "skipped_meal", "poor_sleep", "routine_change", "transition", "visitor", "toileting_need", "pain_signs",
  "medication_time", "bathing", "new_person", "screen_time_ended", "loud_noise", "crowd", "clothing_texture",
  "waiting", "denied_request",
] as const;

export const ENVIRONMENT = [
  "caregiver_handoff", "noisy", "crowded", "bright_lights", "new_place", "outing", "school", "car", "mealtime", "bedtime",
] as const;

export const RESPONSE_TRIED = [
  "offered_snack", "offered_drink", "quiet_space", "reassurance", "redirect_activity", "music", "toileting_assist",
  "pain_check_reported", "sensory_tool", "visual_schedule", "deep_pressure", "break_time", "walk",
] as const;

// Time words the formatter may report. Code turns them into a clock time (src/lib/formatter.ts).
export const TIME_ANCHORS = [
  "early_morning", "breakfast", "before_school", "morning", "lunch", "after_lunch", "afternoon", "after_school",
  "dinner", "evening", "bedtime", "night", "overnight",
] as const;

export const CONFIDENCE_LEVELS = ["high", "medium", "low"] as const;

// A list where anything that is not a string is dropped instead of failing the whole reply.
const looseStrings = z
  .array(z.unknown())
  .catch([])
  .transform((items) => items.filter((v): v is string => typeof v === "string"));

const confidenceLevel = z.enum(CONFIDENCE_LEVELS).catch("low");

// The JSON the formatter model returns. `kind` and `hasEvent` are strict (a reply without
// them is rejected and repaired once). Every other field degrades to a safe default, and
// vocabulary checks happen in code so one bad value never throws away the whole note.
export const formatterReplySchema = z.object({
  language: z.string().max(40).catch("unknown"),
  kind: z.enum(["event", "caregiver_distress", "out_of_scope"]),
  scopeReason: z.enum(["none", "medical", "privacy", "role"]).catch("none"),
  hasEvent: z.boolean(),
  person: z
    .object({
      rosterId: z.string().nullable().catch(null),
      mention: z.string().max(80).nullable().catch(null),
      type: z.enum(["roster", "unnamed", "other"]).catch("unnamed"),
    })
    .catch({ rosterId: null, mention: null, type: "unnamed" }),
  eventType: z.string().nullable().catch(null),
  behaviors: looseStrings,
  contextBefore: looseStrings,
  environment: looseStrings,
  responseTried: looseStrings,
  intensity: z.number().catch(2),
  durationMin: z.number().nullable().catch(null),
  outcome: outcomeSchema.catch("unknown"),
  time: z
    .object({
      hour: z.number().int().min(0).max(23).nullable().catch(null),
      minute: z.number().int().min(0).max(59).catch(0),
      meridiem: z.enum(["am", "pm"]).nullable().catch(null),
      anchor: z.enum(TIME_ANCHORS).nullable().catch(null),
      dayOffset: z.number().int().min(-7).max(0).catch(0),
    })
    .catch({ hour: null, minute: 0, meridiem: null, anchor: null, dayOffset: 0 }),
  redFlags: looseStrings,
  safety: z
    .object({
      emergency: z.boolean().catch(false),
      possibleAbuse: z.boolean().catch(false),
      personWishToDie: z.boolean().catch(false),
    })
    .catch({ emergency: false, possibleAbuse: false, personWishToDie: false }),
  confidence: z
    .object({ person: confidenceLevel, eventType: confidenceLevel, intensity: confidenceLevel, time: confidenceLevel })
    .catch({ person: "low", eventType: "low", intensity: "low", time: "low" }),
});
export type FormatterReply = z.infer<typeof formatterReplySchema>;

// A parsed draft may have an empty personId (nobody on the roster was named); a saved record may not.
export const parsedDraftSchema = draftRecordSchema.extend({ personId: z.string() });
