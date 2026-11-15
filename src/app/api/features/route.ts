// GET /api/features -> FeaturesResponse. Lets screens show or hide the optional AI features.
import { featureFlags } from "@/lib/features";

export const dynamic = "force-dynamic";

export async function GET() {
  return Response.json(featureFlags());
}
