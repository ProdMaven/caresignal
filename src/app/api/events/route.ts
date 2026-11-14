// POST /api/events  SaveEventRequest -> SaveEventResponse. Owner: Lane 3.
import { badRequest, notFound, notImplemented, dataMocksEnabled } from "@/lib/env";
import { firstIssue, saveEventRequestSchema } from "@/lib/schemas";
import { findPerson, mockSaveEvent } from "@/mocks";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  if (body === null || typeof body !== "object") return badRequest("Request body must be a JSON object.");
  const parsed = saveEventRequestSchema.safeParse(body);
  if (!parsed.success) return badRequest(firstIssue(parsed.error));

  if (dataMocksEnabled()) {
    if (!findPerson(parsed.data.record.personId)) return notFound(`No person with id ${parsed.data.record.personId}.`);
    return Response.json(mockSaveEvent(parsed.data), { status: 201 });
  }

  // TODO(Lane 3): insert the Event row through prisma and return it.
  return notImplemented("POST /api/events", "Lane 3");
}
