// PATCH /api/people/[id]  UpdatePersonRequest -> UpdatePersonResponse. Owner: Lane 3.
// Edits a Care Profile, including its history. Demo people cannot be edited.
import { badRequest, dataMocksEnabled, notFound, notImplemented } from "@/lib/env";
import { firstIssue, updatePersonRequestSchema } from "@/lib/schemas";
import type { UpdatePersonResponse } from "@/lib/types";
import { findPerson, mockUpdatePerson } from "@/mocks";

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const body = await request.json().catch(() => null);
  if (body === null || typeof body !== "object") return badRequest("Request body must be a JSON object.");
  const parsed = updatePersonRequestSchema.safeParse(body);
  if (!parsed.success) return badRequest(firstIssue(parsed.error));
  if (!dataMocksEnabled()) return notImplemented("PATCH /api/people/[id]", "Lane 3");

  const existing = findPerson(id);
  if (!existing) return notFound(`No person with id ${id}.`);
  if (existing.isFeatured) return badRequest("Demo profiles cannot be edited. Add your own Care Profile to edit it.");
  const person = mockUpdatePerson(id, parsed.data);
  if (!person) return notFound(`No person with id ${id}.`);
  const res: UpdatePersonResponse = { person };
  return Response.json(res);
}
