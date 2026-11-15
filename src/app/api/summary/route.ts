// POST /api/summary  SummaryRequest -> SummaryResponse (docs/AI_FEATURES.md, Feature 1). Owner: Lane 2.
// Behind FEATURE_SUMMARY (default off). Every response carries x-caresignal-source ("model" or "fallback")
// so the eval runner can tell which path answered.
import { features } from "@/lib/features";
import { firstIssue } from "@/lib/schemas";
import { summaryRequestSchema, writeSummary } from "@/lib/summary";
import { findPerson } from "@/mocks";

export const dynamic = "force-dynamic";

function reply(body: unknown, status: number, source: "model" | "fallback"): Response {
  return Response.json(body, { status, headers: { "x-caresignal-source": source } });
}

export async function POST(request: Request) {
  if (!features.summary()) return reply({ error: "The visit summary is not switched on for this server." }, 404, "fallback");

  const body = await request.json().catch(() => null);
  if (body === null || typeof body !== "object") return reply({ error: "Request body must be a JSON object." }, 400, "fallback");
  const parsed = summaryRequestSchema.safeParse(body);
  if (!parsed.success) return reply({ error: firstIssue(parsed.error) }, 400, "fallback");

  // A person is only reachable in their own mode, the same way the person picker lists them.
  const person = findPerson(parsed.data.personId);
  if (!person || person.mode !== parsed.data.mode) return reply({ error: "No person with that id." }, 404, "fallback");

  try {
    const started = Date.now();
    const summary = await writeSummary(parsed.data);
    if (!summary) return reply({ error: "No person with that id." }, 404, "fallback");
    console.log(
      `[summary] ${JSON.stringify({ source: summary.source, audience: parsed.data.audience, days: parsed.data.days, dataSufficient: summary.dataSufficient, safetyNotes: summary.safetyNotes.length, latencyMs: Date.now() - started })}`,
    );
    return reply(summary, 200, summary.source);
  } catch (err) {
    console.error("[summary] could not write:", err instanceof Error ? err.message : err);
    return reply({ error: "Unspoken could not write the summary right now. Please try again in a moment." }, 503, "fallback");
  }
}
