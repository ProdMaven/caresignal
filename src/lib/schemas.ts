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
