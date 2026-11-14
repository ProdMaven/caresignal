// GET /api/health: Railway healthcheck.
export const dynamic = "force-dynamic";

export function GET() {
  return Response.json({ ok: true });
}
