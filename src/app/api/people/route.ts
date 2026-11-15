// GET /api/people?mode=  -> PeopleResponse. POST /api/people  CreatePersonRequest -> CreatePersonResponse. Owner: Lane 3.
import { badRequest, notImplemented, dataMocksEnabled } from "@/lib/env";
import { createPersonRequestSchema, firstIssue, modeSchema } from "@/lib/schemas";
import { mockCreatePerson, mockPeople } from "@/mocks";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const raw = new URL(request.url).searchParams.get("mode");
  const mode = raw ? modeSchema.safeParse(raw) : null;
  if (mode && !mode.success) return badRequest('mode must be "dementia" or "autism".');

  if (dataMocksEnabled()) return Response.json(mockPeople(mode?.data));

  // TODO(Lane 3): read Person rows through prisma (src/lib/db.ts).
  return notImplemented("GET /api/people", "Lane 3");
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  if (body === null || typeof body !== "object") return badRequest("Request body must be a JSON object.");
  const parsed = createPersonRequestSchema.safeParse(body);
  if (!parsed.success) return badRequest(firstIssue(parsed.error));

  if (dataMocksEnabled()) {
    const created = mockCreatePerson(parsed.data);
    if (!created) return badRequest("This demo already has the most profiles it allows.");
    return Response.json(created, { status: 201 });
  }

  // TODO(Lane 3): insert the Person row through prisma and return it.
  return notImplemented("POST /api/people", "Lane 3");
}
