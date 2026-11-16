// POST /api/events  SaveEventRequest -> SaveEventResponse. Owner: Lane 3.
import { badRequest, notFound, notImplemented, dataMocksEnabled } from "@/lib/env";
import { firstIssue, saveEventRequestSchema } from "@/lib/schemas";
import { features } from "@/lib/features";
import { findPerson, mockSaveEvent } from "@/mocks";
import { touchStore } from "@/mocks/store";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  if (body === null || typeof body !== "object") return badRequest("Request body must be a JSON object.");
  const parsed = saveEventRequestSchema.safeParse(body);
  if (!parsed.success) return badRequest(firstIssue(parsed.error));

  if (dataMocksEnabled()) {
    if (!findPerson(parsed.data.record.personId)) return notFound(`No person with id ${parsed.data.record.personId}.`);
    const saved = mockSaveEvent(parsed.data);
    // Semantic matching (flag): embed the caregiver's words and the fields now, so the entry can be found by meaning.
    // A failure here never blocks saving.
    if (features.semanticMatch()) {
      try {
        const { indexEntries, getEmbedding } = await import("@/lib/semantic/index");
        const { saveEmbedding } = await import("@/lib/semantic/store");
        await indexEntries([saved.record]);
        const rec = getEmbedding(saved.record.id);
        if (rec) await saveEmbedding(rec);
        touchStore();
      } catch (err) {
        console.error("[semantic] could not embed the saved entry:", err instanceof Error ? err.message : err);
      }
    }
    return Response.json(saved, { status: 201 });
  }

  // TODO(Lane 3): insert the Event row through prisma and return it.
  return notImplemented("POST /api/events", "Lane 3");
}
