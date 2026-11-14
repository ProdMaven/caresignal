// Server-side flags. Never import this from client components.

// Mocks are on unless USE_MOCKS is explicitly "false" (unset counts as true for now).
export function mocksEnabled(): boolean {
  return (process.env.USE_MOCKS ?? "true").toLowerCase() !== "false";
}

// Shared 501 for the non-mock branches that Lanes 2 and 3 fill in.
export function notImplemented(route: string, owner: string): Response {
  return Response.json(
    { error: `${route} has no real implementation yet (${owner}). Set USE_MOCKS=true to use mocks.` },
    { status: 501 },
  );
}

export function badRequest(message: string): Response {
  return Response.json({ error: message }, { status: 400 });
}

export function notFound(message: string): Response {
  return Response.json({ error: message }, { status: 404 });
}
