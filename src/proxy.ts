// Invitation-only gate. Runs before every page and API route.
// Pages without a valid invite cookie go to /invite; API calls get a 401.
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { INVITE_COOKIE, INVITE_HEADER, isValidInvite } from "@/lib/invite";

const OPEN_PATHS = ["/invite", "/api/invite", "/api/health"];

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  if (OPEN_PATHS.some((p) => pathname === p || pathname.startsWith(`${p}/`))) return NextResponse.next();

  const code = request.cookies.get(INVITE_COOKIE)?.value ?? request.headers.get(INVITE_HEADER);
  if (isValidInvite(code)) return NextResponse.next();

  if (pathname.startsWith("/api/")) {
    return NextResponse.json({ error: "Unspoken is invitation only. Please enter your invite code first." }, { status: 401 });
  }
  return NextResponse.redirect(new URL("/invite", request.url));
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
