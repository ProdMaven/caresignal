// POST /api/invite  InviteRequest -> InviteResponse. Owner: Lane 1.
// A valid code sets an httpOnly cookie. Wrong guesses are rate limited per address.
import { NextResponse } from "next/server";
import { badRequest } from "@/lib/env";
import { INVITE_COOKIE, isValidInvite, normalizeCode } from "@/lib/invite";
import { firstIssue, inviteRequestSchema } from "@/lib/schemas";
import type { InviteResponse } from "@/lib/types";

const MAX_TRIES = 8;
const WINDOW_MS = 10 * 60 * 1000;
const tries = new Map<string, { count: number; resetAt: number }>();

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = inviteRequestSchema.safeParse(body);
  if (!parsed.success) return badRequest(firstIssue(parsed.error));

  const who = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  const now = Date.now();
  const entry = tries.get(who);
  if (entry && entry.resetAt > now && entry.count >= MAX_TRIES) {
    const res: InviteResponse = { ok: false, message: "Too many tries. Please wait a few minutes and try again." };
    return NextResponse.json(res, { status: 429 });
  }

  if (!isValidInvite(parsed.data.code)) {
    tries.set(who, entry && entry.resetAt > now ? { ...entry, count: entry.count + 1 } : { count: 1, resetAt: now + WINDOW_MS });
    const res: InviteResponse = {
      ok: false,
      message: "That code did not match. Please check it with the person or group who invited you.",
    };
    return NextResponse.json(res, { status: 401 });
  }

  tries.delete(who);
  const res: InviteResponse = { ok: true, message: null };
  const response = NextResponse.json(res);
  response.cookies.set(INVITE_COOKIE, normalizeCode(parsed.data.code), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
  return response;
}
