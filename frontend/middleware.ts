import { NextRequest, NextResponse } from "next/server";

/**
 * Edge middleware — runs before every request matching the config below.
 * Protects /dashboard/* routes: redirects unauthenticated visitors to /login.
 * Redirects authenticated visitors away from /login to /dashboard.
 */
function decodeTokenPayload(token: string): { exp?: number } | null {
  const parts = token.split(".");
  if (parts.length !== 3) return null;

  try {
    const normalized = parts[1].replace(/-/g, "+").replace(/_/g, "/");
    const padded = normalized + "===".slice((normalized.length + 3) % 4);
    return JSON.parse(atob(padded)) as { exp?: number };
  } catch {
    return null;
  }
}

function isTokenExpired(token: string): boolean {
  const payload = decodeTokenPayload(token);
  if (!payload || typeof payload.exp !== "number") return true;
  const now = Math.floor(Date.now() / 1000);
  return payload.exp <= now;
}

export function middleware(request: NextRequest) {
  const token = request.cookies.get("access_token")?.value;
  const role = request.cookies.get("user_role")?.value;
  const { pathname } = request.nextUrl;
  const isExpired = token ? isTokenExpired(token) : true;

  if (pathname === "/login") {
    if (token && !isExpired) {
      const target = role === "tenant" ? "/dashboard/pay-rent" : "/dashboard";
      return NextResponse.redirect(new URL(target, request.url));
    }
    const response = NextResponse.next();
    if (token && isExpired) {
      response.cookies.delete("access_token");
      response.cookies.delete("user_role");
    }
    return response;
  }

  if (pathname.startsWith("/dashboard")) {
    if (!token || isExpired) {
      const loginUrl = new URL("/login", request.url);
      const nextPath = `${pathname}${request.nextUrl.search}`;
      loginUrl.searchParams.set("next", nextPath);
      const response = NextResponse.redirect(loginUrl);
      response.cookies.delete("access_token");
      response.cookies.delete("user_role");
      return response;
    }

    if (role === "tenant") {
      const landlordOnlyPrefixes = [
        "/dashboard/properties",
        "/dashboard/tenants",
        "/dashboard/payments/reconciliation",
      ];

      if (pathname === "/dashboard" || landlordOnlyPrefixes.some((p) => pathname.startsWith(p))) {
        return NextResponse.redirect(new URL("/dashboard/pay-rent", request.url));
      }
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*", "/login"],
};
