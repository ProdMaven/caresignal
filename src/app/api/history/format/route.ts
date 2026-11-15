// POST /api/history/format  FormatHistoryRequest -> FormatHistoryResponse (parse only, does not save). Owner: Lane 2.
import { badRequest } from "@/lib/env";
import { formatHistory } from "@/lib/history";
import { firstIssue, formatHistoryRequestSchema } from "@/lib/schemas";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  if (body === null || typeof body !== "object") return badRequest("Request body must be a JSON object.");
  const parsed = formatHistoryRequestSchema.safeParse(body);
  if (!parsed.success) return badRequest(firstIssue(parsed.error));
  try {
    return Response.json(await formatHistory(parsed.data));
  } catch (err) {
    console.error("[history] could not format:", err instanceof Error ? err.message : err);
    return Response.json({ error: "Unspoken could not read that right now. Please try again in a moment." }, { status: 503 });
  }
}
