// POST /api/reset  -> ResetResponse. Restores the seeded demo data. Owner: Lane 3.
import { notImplemented, dataMocksEnabled } from "@/lib/env";
import { mockReset } from "@/mocks";

export async function POST() {
  if (dataMocksEnabled()) return Response.json(mockReset());

  // TODO(Lane 3): const { seed } = await import("../../../../scripts/seed"); return Response.json(await seed(prisma));
  return notImplemented("POST /api/reset", "Lane 3");
}
