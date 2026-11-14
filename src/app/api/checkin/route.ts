// POST /api/checkin  CheckInRequest -> CheckInResponse. Owner: Lane 2.
// Warm listening for the caregiver. Never stored. Crisis wording is fixed and comes first.
import { z } from "zod";
import { callClaude } from "@/lib/ai";
import { acceptableReply, screenCheckIn, templateReply } from "@/lib/checkin";
import { badRequest, mocksEnabled } from "@/lib/env";
import type { CheckInResponse } from "@/lib/types";
import { CHECKIN_SYSTEM } from "@/prompts/checkin";

const requestSchema = z.object({
  text: z.string().trim().max(2000).default(""),
  mood: z.enum(["okay", "tired", "overwhelmed", "sad", "worried", "hopeful"]).optional(),
});

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = requestSchema.safeParse(body);
  if (!parsed.success) return badRequest("Please tell us how you are feeling in up to 2000 characters.");
  const req = parsed.data;
  if (!req.text && !req.mood) return badRequest("Please pick a feeling or write a few words first.");

  const safety = screenCheckIn(req);
  if (safety) return Response.json(safety);

  let message = templateReply(req);
  if (!mocksEnabled() && req.text) {
    try {
      const reply = await callClaude({
        system: CHECKIN_SYSTEM,
        messages: [
          {
            role: "user",
            content: `Feeling picked: ${req.mood ?? "none"}\n<caregiver_words>\n${req.text}\n</caregiver_words>`,
          },
        ],
        maxTokens: 300,
        timeoutMs: 12_000,
      });
      if (acceptableReply(reply.text)) message = reply.text.trim();
    } catch {
      // Model unavailable: the template reply stands.
    }
  }

  const res: CheckInResponse = { kind: "listening", message, saved: false };
  return Response.json(res);
}
