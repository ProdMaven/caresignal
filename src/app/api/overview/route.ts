// GET /api/overview?personId=&days=7|30  -> OverviewResponse. Owner: Lane 3.
// Counts only, computed in code from the logs. No model call.
import { badRequest, dataMocksEnabled, notFound, notImplemented } from "@/lib/env";
import { findPerson, mockOverview } from "@/mocks";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const params = new URL(request.url).searchParams;
  const personId = params.get("personId");
  const days = params.get("days") === "30" ? 30 : params.get("days") === "7" || params.get("days") === null ? 7 : null;
  if (!personId) return badRequest("personId is required.");
  if (days === null) return badRequest("days must be 7 or 30.");
  if (!dataMocksEnabled()) return notImplemented("GET /api/overview", "Lane 3");
  if (!findPerson(personId)) return notFound(`No person with id ${personId}.`);
  return Response.json(mockOverview(personId, days));
}
