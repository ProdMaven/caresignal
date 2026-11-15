// POST /api/log  ParseLogRequest -> ParseLogResponse (parse only, does not save). Owner: Lane 2.
// Real branch: safety screen, demo cache, formatter model, code-side validation (src/lib/formatter.ts).
import { badRequest, mocksEnabled } from "@/lib/env";
import { parseLog } from "@/lib/formatter";
import { firstIssue, parseLogRequestSchema } from "@/lib/schemas";
import { applyFollowUp } from "@/lib/followUp";
import { applyNoteLanguage } from "@/lib/noteLanguage";
import { applySelectedPerson } from "@/lib/selectedPerson";
import { mockLog, mockPeople } from "@/mocks";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  if (body === null || typeof body !== "object") return badRequest("Request body must be a JSON object.");
  const parsed = parseLogRequestSchema.safeParse(body);
  if (!parsed.success) return badRequest(firstIssue(parsed.error));

  if (mocksEnabled()) {
    const mocked = applySelectedPerson(mockLog(parsed.data), mockPeople(parsed.data.mode).people, parsed.data.personId);
    return Response.json(applyFollowUp(parsed.data, applyNoteLanguage(mocked, parsed.data.transcript, null), null), { headers: { "x-caresignal-source": "mock" } });
  }

  const started = Date.now();
  try {
    // Same roster source the mock uses (people for this mode, with ids and aliases).
    const roster = mockPeople(parsed.data.mode).people;
    const outcome = await parseLog(parsed.data, roster);

    // One line per request for the eval runner and for cost tracking. No note text, no names.
    const meta = {
      source: outcome.source,
      kind: outcome.response.kind,
      mode: parsed.data.mode,
      language: (outcome.language ?? "").toLowerCase().replace(/[^a-z+-]/g, "").slice(0, 20) || null,
      latencyMs: Date.now() - started,
      redFlags: outcome.response.draft?.redFlags.length ?? 0,
      ai: outcome.ai,
    };
    console.log(`[log] ${JSON.stringify(meta)}`);

    const picked = applySelectedPerson(outcome.response, roster, parsed.data.personId);
    return Response.json(applyNoteLanguage(picked, parsed.data.transcript, outcome.language), {
      headers: { "x-caresignal-source": outcome.source, "x-caresignal-meta": JSON.stringify(meta) },
    });
  } catch (err) {
    console.error("[log] could not parse note:", err instanceof Error ? err.message : err);
    return Response.json(
      { error: "Unspoken could not read that note right now. Nothing was saved. Please try again in a moment, or use the tap form." },
      { status: 503 },
    );
  }
}
