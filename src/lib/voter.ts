// Anonymous per-browser id used to allow one "Did this help?" answer per caregiver per strategy.
// Not an account and not linked to any person or note.
export const VOTER_COOKIE = "cs_voter";

export function readVoterId(request: Request): string | null {
  const cookie = request.headers.get("cookie") ?? "";
  const match = /(?:^|;\s*)cs_voter=([A-Za-z0-9-]{8,64})/.exec(cookie);
  return match ? match[1] : null;
}
