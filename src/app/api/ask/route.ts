// POST /api/ask  AskRequest -> AskResponse. Owner: Lane 2.
import { askWithRouter } from "@/lib/askRouter";
import { badRequest, notFound, notImplemented, dataMocksEnabled } from "@/lib/env";
import { features } from "@/lib/features";
import { askRequestSchema, firstIssue } from "@/lib/schemas";
import { findPerson, mockAsk } from "@/mocks";
import { allEvents } from "@/mocks/store";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  if (body === null || typeof body !== "object") return badRequest("Request body must be a JSON object.");
  const parsed = askRequestSchema.safeParse(body);
  if (!parsed.success) return badRequest(firstIssue(parsed.error));

  if (dataMocksEnabled()) {
    // FEATURE_ASK_ROUTER (docs/AI_FEATURES.md, Feature 2): safety rules first, then a fast model labels the
    // question and code computes the answer. Any failure falls through to the keyword answer below.
    if (features.askRouter()) {
      const person = findPerson(parsed.data.personId);
      if (!person) return notFound(`No person with id ${parsed.data.personId}.`);
      try {
        const { response, source } = await askWithRouter(parsed.data, person, allEvents());
        return Response.json(response, { headers: { "x-caresignal-source": source } });
      } catch (err) {
        console.error("[ask_router] could not answer, using the keyword answer:", err instanceof Error ? err.message : err);
      }
    }

    const response = mockAsk(parsed.data);
    if (!response) return notFound(`No person with id ${parsed.data.personId}.`);
    return Response.json(response);
  }

  // TODO(Lane 2): red-flag rule first, then retrieve this person's events and patterns,
  // then callClaude for a grounded answer that only uses those counts.
  return notImplemented("POST /api/ask", "Lane 2");
}
