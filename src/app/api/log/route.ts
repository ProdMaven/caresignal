// POST /api/log  ParseLogRequest -> ParseLogResponse (parse only, does not save). Owner: Lane 2.
import { badRequest, notImplemented, mocksEnabled } from "@/lib/env";
import { firstIssue, parseLogRequestSchema } from "@/lib/schemas";
import { mockLog } from "@/mocks";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  if (body === null || typeof body !== "object") return badRequest("Request body must be a JSON object.");
  const parsed = parseLogRequestSchema.safeParse(body);
  if (!parsed.success) return badRequest(firstIssue(parsed.error));

  if (mocksEnabled()) return Response.json(mockLog(parsed.data));

  // TODO(Lane 2): safety screen first, then the demo cache (src/lib/demoCache.ts), then
  // callClaude from src/lib/ai.ts with the formatter prompt in src/prompts/, then zod
  // validation with draftRecordSchema before returning.
  return notImplemented("POST /api/log", "Lane 2");
}
