// Invitation-only entry. Codes come from the INVITE_CODES env var (comma separated).
// No accounts: a valid code sets an httpOnly cookie. Safe to import from src/proxy.ts.
export const INVITE_COOKIE = "cs_invite";
export const INVITE_HEADER = "x-invite-code"; // for scripts such as the eval runner

// Demo fallback so the public URL works for judges when INVITE_CODES is unset. Published in the README.
const DEFAULT_CODES = ["GTRANSFORMER-JUDGE"];

export function normalizeCode(raw: string): string {
  return raw.trim().toUpperCase();
}

export function inviteCodes(): string[] {
  const fromEnv = (process.env.INVITE_CODES ?? "").split(",").map(normalizeCode).filter(Boolean);
  return fromEnv.length ? fromEnv : DEFAULT_CODES;
}

export function isValidInvite(raw: string | null | undefined): boolean {
  if (!raw) return false;
  return inviteCodes().includes(normalizeCode(raw));
}
