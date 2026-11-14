// POST /api/ask  AskRequest -> AskResponse. Owner: Lane 2.
import { badRequest, notFound, notImplemented, mocksEnabled } from "@/lib/env";
import { askRequestSchema, firstIssue } from "@/lib/schemas";
import { mockAsk } from "@/mocks";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  if (body === null || typeof body !== "object") return badRequest("Request body must be a JSON object.");
  const parsed = askRequestSchema.safeParse(body);
  if (!parsed.success) return badRequest(firstIssue(parsed.error));

  if (mocksEnabled()) {
    const response = mockAsk(parsed.data);
    if (!response) return notFound(`No person with id ${parsed.data.personId}.`);
    return Response.json(response);
  }

  // TODO(Lane 2): red-flag rule first, then retrieve this person's events and patterns,
  // then callClaude for a grounded answer that only uses those counts.
  return notImplemented("POST /api/ask", "Lane 2");
}
