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

export function firstIssue(error: z.ZodError): string {
  const issue = error.issues[0];
  if (!issue) return "Invalid request.";
  const path = issue.path.join(".");
  return path ? `${path}: ${issue.message}` : issue.message;
}
