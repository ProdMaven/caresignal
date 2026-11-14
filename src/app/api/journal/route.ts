// GET /api/journal?loggedBy=  -> JournalListResponse.  POST /api/journal  JournalRequest -> JournalResponse. Owner: Lane 3.
// The caregiver's own journal. Kept under their name, never added to the log of the person they care for.
// The safety screen runs first: crisis wording is fixed and is shown before anything else.
import { z } from "zod";
import { screenCheckIn } from "@/lib/checkin";
import { badRequest, dataMocksEnabled, notImplemented } from "@/lib/env";
import { modeSchema } from "@/lib/schemas";
import { wallParts } from "@/lib/time";
import type { JournalListResponse, JournalResponse } from "@/lib/types";
import { addJournalEntry, listJournal } from "@/mocks";

export const dynamic = "force-dynamic";

const requestSchema = z.object({
  loggedBy: z.string().min(1).max(60),
  mode: modeSchema,
  text: z.string().trim().min(1, "Please write or say a few words first.").max(4000),
  mood: z.enum(["okay", "tired", "overwhelmed", "sad", "worried", "hopeful"]).optional(),
  source: z.enum(["voice", "text"]),
  now: z.string().min(1).max(40),
});

export async function GET(request: Request) {
  const loggedBy = new URL(request.url).searchParams.get("loggedBy");
  if (!loggedBy) return badRequest("loggedBy is required.");
  if (!dataMocksEnabled()) return notImplemented("GET /api/journal", "Lane 3");
  const res: JournalListResponse = { entries: listJournal(loggedBy) };
  return Response.json(res);
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = requestSchema.safeParse(body);
  if (!parsed.success) return badRequest(parsed.error.issues[0]?.message ?? "Invalid journal entry.");
  if (!wallParts(parsed.data.now)) return badRequest("now must be an ISO date and time.");
  if (!dataMocksEnabled()) return notImplemented("POST /api/journal", "Lane 3");

  const { loggedBy, mode, text, mood, source, now } = parsed.data;
  const entry = addJournalEntry({ loggedBy, mode, text, mood: mood ?? null, source, createdAt: now });
  if (!entry) return badRequest("This demo journal is full. Use Reset demo data on the Log screen to start over.");

  const safety = screenCheckIn({ text });
  const res: JournalResponse = safety
    ? {
        entry,
        kind: safety.kind === "crisis" ? "crisis" : "care_team",
        message: safety.kind === "crisis" ? safety.message.replace(" Nothing you write here is saved.", " This entry stays in your own journal only.") : safety.message,
      }
    : { entry, kind: "saved", message: null };
  return Response.json(res, { status: 201 });
}
