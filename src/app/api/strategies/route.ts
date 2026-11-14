// GET /api/strategies?mode=&patternKey=  -> StrategiesResponse. Owner: Lane 3.
import { badRequest, notImplemented, dataMocksEnabled } from "@/lib/env";
import { modeSchema } from "@/lib/schemas";
import { readVoterId } from "@/lib/voter";
import { mockStrategies } from "@/mocks";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const params = new URL(request.url).searchParams;
  const mode = modeSchema.safeParse(params.get("mode"));
  if (!mode.success) return badRequest('mode is required and must be "dementia" or "autism".');

  if (dataMocksEnabled()) return Response.json(mockStrategies(mode.data, params.get("patternKey"), readVoterId(request)));

  // TODO(Lane 3): read Strategy + StrategyScore through prisma (safetyApproved only), ranked by score.
  return notImplemented("GET /api/strategies", "Lane 3");
}
