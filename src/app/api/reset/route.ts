// POST /api/reset  -> ResetResponse. Wipes everything that was added and restores the seeded demo data.
// There is no button for this any more (PM, Nov 14). The route only works on a server that sets ALLOW_RESET=true,
// which is the staging copy: the eval runner needs a clean store there. On the live app it always refuses.
import { dataMocksEnabled, notImplemented } from "@/lib/env";
import { mockReset } from "@/mocks";

export async function POST() {
  if ((process.env.ALLOW_RESET ?? "").toLowerCase() !== "true") {
    return Response.json({ error: "Reset is turned off on this server." }, { status: 403 });
  }
  if (dataMocksEnabled()) return Response.json(mockReset());

  // TODO(Lane 3): const { seed } = await import("../../../../scripts/seed"); return Response.json(await seed(prisma));
  return notImplemented("POST /api/reset", "Lane 3");
}
