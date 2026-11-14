// GET /api/patterns?personId=  -> PatternsResponse. Owner: Lane 3 (numbers) + Lane 2 (summary text).
import { badRequest, notFound, notImplemented, mocksEnabled } from "@/lib/env";
import { findPerson, mockPatterns } from "@/mocks";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const personId = new URL(request.url).searchParams.get("personId");
  if (!personId) return badRequest("personId is required.");

  if (mocksEnabled()) {
    if (!findPerson(personId)) return notFound(`No person with id ${personId}.`);
    return Response.json(mockPatterns(personId));
  }

  // TODO(Lane 3): src/lib/patterns.ts over prisma events. TODO(Lane 2): summary line from the numbers only.
  return notImplemented("GET /api/patterns", "Lane 3");
}
