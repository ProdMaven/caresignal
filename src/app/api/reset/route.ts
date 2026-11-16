// POST /api/reset  -> ResetResponse. Wipes everything that was added and restores the seeded demo data.
// There is no button for this any more (PM, Nov 14). The route only works on a server that sets ALLOW_RESET=true,
// which is the staging copy: the eval runner needs a clean store there. On the live app it always refuses.
import { dataMocksEnabled, notImplemented } from "@/lib/env";
import { features } from "@/lib/features";
import { mockReset } from "@/mocks";

export async function POST() {
  if ((process.env.ALLOW_RESET ?? "").toLowerCase() !== "true") {
    return Response.json({ error: "Reset is turned off on this server." }, { status: 403 });
  }
  if (dataMocksEnabled()) {
    const result = mockReset();
    // Semantic matching (flag): the seeded entries are embedded again so the index matches the fresh store.
    if (features.semanticMatch()) {
      try {
        await (await import("@/lib/semantic/warm")).warmSemantic();
      } catch (err) {
        console.error("[semantic] warm-up after reset failed:", err instanceof Error ? err.message : err);
      }
    }
    return Response.json(result);
  }

  // TODO(Lane 3): const { seed } = await import("../../../../scripts/seed"); return Response.json(await seed(prisma));
  return notImplemented("POST /api/reset", "Lane 3");
}
