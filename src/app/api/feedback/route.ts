// POST /api/feedback  FeedbackRequest -> FeedbackResponse. Owner: Lane 3.
// "Did this help?" One answer per caregiver per strategy; answering again changes the answer.
// Counts are shown next to the score and never change it.
import { NextResponse } from "next/server";
import { z } from "zod";
import { badRequest, notFound, notImplemented, dataMocksEnabled } from "@/lib/env";
import type { FeedbackResponse } from "@/lib/types";
import { readVoterId, VOTER_COOKIE } from "@/lib/voter";
import { recordFeedback, strategyExists } from "@/mocks";

const requestSchema = z.object({ strategyId: z.string().min(1).max(80), helped: z.boolean() });

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = requestSchema.safeParse(body);
  if (!parsed.success) return badRequest("strategyId and helped (true or false) are required.");

  if (!dataMocksEnabled()) {
    // TODO(Lane 3): store the answer through prisma (unique on strategyId + voterId).
    return notImplemented("POST /api/feedback", "Lane 3");
  }
  if (!strategyExists(parsed.data.strategyId)) return notFound(`No strategy with id ${parsed.data.strategyId}.`);

  const existing = readVoterId(request);
  const voterId = existing ?? crypto.randomUUID();
  const res: FeedbackResponse = {
    strategyId: parsed.data.strategyId,
    feedback: recordFeedback(parsed.data.strategyId, voterId, parsed.data.helped),
  };
  const response = NextResponse.json(res);
  if (!existing) {
    response.cookies.set(VOTER_COOKIE, voterId, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 24 * 365,
    });
  }
  return response;
}
