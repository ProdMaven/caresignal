// GET /api/people/[id]/events?days=21  -> EventsResponse. Owner: Lane 3.
import { badRequest, notFound, notImplemented, dataMocksEnabled } from "@/lib/env";
import { findPerson, mockEvents } from "@/mocks";

export const dynamic = "force-dynamic";

export async function GET(request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const rawDays = new URL(request.url).searchParams.get("days") ?? "21";
  const days = Number(rawDays);
  if (!Number.isInteger(days) || days < 1 || days > 90) return badRequest("days must be a whole number from 1 to 90.");

  if (dataMocksEnabled()) {
    if (!findPerson(id)) return notFound(`No person with id ${id}.`);
    return Response.json(mockEvents(id, days));
  }

  // TODO(Lane 3): read Event rows for this person through prisma.
  return notImplemented("GET /api/people/[id]/events", "Lane 3");
}
