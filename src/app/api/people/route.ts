// GET /api/people?mode=  -> PeopleResponse. Owner: Lane 3.
import { badRequest, notImplemented, mocksEnabled } from "@/lib/env";
import { modeSchema } from "@/lib/schemas";
import { mockPeople } from "@/mocks";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const raw = new URL(request.url).searchParams.get("mode");
  const mode = raw ? modeSchema.safeParse(raw) : null;
  if (mode && !mode.success) return badRequest('mode must be "dementia" or "autism".');

  if (mocksEnabled()) return Response.json(mockPeople(mode?.data));

  // TODO(Lane 3): read Person rows through prisma (src/lib/db.ts).
  return notImplemented("GET /api/people", "Lane 3");
}
