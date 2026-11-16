// POST /api/semantic/exclude  { eventId, tag } -> { ok: true }
// The caregiver says an entry that was joined to a pattern by similar wording does not belong there.
// Only exists while FEATURE_SEMANTIC_MATCH is on.
import { z } from "zod";
import { badRequest, notFound } from "@/lib/env";
import { features } from "@/lib/features";
import { excludeJoin } from "@/lib/semantic/index";
import { allEvents, touchStore } from "@/mocks/store";

const schema = z.object({ eventId: z.string().min(1).max(40), tag: z.string().min(1).max(40) });

export async function POST(request: Request) {
  if (!features.semanticMatch()) return notFound("Not available.");
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return badRequest("eventId and tag are required.");
  if (!allEvents().some((e) => e.id === parsed.data.eventId)) return notFound(`No entry with id ${parsed.data.eventId}.`);
  excludeJoin(parsed.data.eventId, parsed.data.tag);
  touchStore(); // saved with the rest of the app state
  return Response.json({ ok: true });
}
