import { NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import type { NextRequest } from "next/server";
import { canAccessAdmin, requiresAdminRole } from "@/lib/access-control";

const SECURITY_HEADERS: Record<string, string> = {
  "x-content-type-options": "nosniff",
  "x-frame-options": "DENY",
  "referrer-policy": "strict-origin-when-cross-origin",
  "permissions-policy": "camera=(), microphone=(), geolocation=()",
  "content-security-policy":
    "default-src 'self'; base-uri 'self'; frame-ancestors 'none'; form-action 'self'; img-src 'self' data: https:; font-src 'self' data:; style-src 'self' 'unsafe-inline'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; connect-src 'self' https:;",
};

function applySecurityHeaders(response: NextResponse, requestId: string): NextResponse {
  for (const [key, value] of Object.entries(SECURITY_HEADERS)) {
    response.headers.set(key, value);
  }
  response.headers.set("x-request-id", requestId);
  return response;
}

function isMutatingMethod(method: string): boolean {
  return method === "POST" || method === "PUT" || method === "PATCH" || method === "DELETE";
}

function isCsrfProtectedPath(pathname: string): boolean {
  if (pathname.startsWith("/api/admin")) return true;
  if (pathname.startsWith("/api/events/") && pathname.includes("/registrations")) return true;
  if (pathname === "/api/events/registrations") return true;
  return false;
}

function normalizeOrigin(value: string | null): string | null {
  if (!value) return null;
  try {
    const url = new URL(value);
    return url.origin;
  } catch {
    return null;
  }
}

function requestOrigin(request: NextRequest): string {
  const proto = request.headers.get("x-forwarded-proto") ?? "http";
  const host = request.headers.get("x-forwarded-host") ?? request.headers.get("host") ?? "";
  return `${proto}://${host}`.toLowerCase();
}

function hasValidOrigin(request: NextRequest): boolean {
  const origin = normalizeOrigin(request.headers.get("origin"));
  if (!origin) return false;

  const allowed = new Set<string>();
  const envOrigin = normalizeOrigin(process.env.NEXTAUTH_URL ?? null);
  if (envOrigin) allowed.add(envOrigin.toLowerCase());
  allowed.add(requestOrigin(request));
  allowed.add(request.nextUrl.origin.toLowerCase());

  return allowed.has(origin.toLowerCase());
}

function apiError(status: number, error: string, requestId: string): NextResponse {
  return applySecurityHeaders(NextResponse.json({ error, requestId }, { status }), requestId);
}

export async function middleware(request: NextRequest) {
  const requestId = request.headers.get("x-request-id") ?? crypto.randomUUID();
  const pathname = request.nextUrl.pathname;
  const isAdminPage = pathname === "/admin" || pathname.startsWith("/admin/");
  const isAdminApi = pathname.startsWith("/api/admin");
  const isAdminLoginAlias = pathname === "/admin/login";

  if (isMutatingMethod(request.method) && isCsrfProtectedPath(pathname) && !hasValidOrigin(request)) {
    if (pathname.startsWith("/api/")) {
      return apiError(403, "Invalid origin for state-changing request.", requestId);
    }
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("callbackUrl", "/admin");
    return applySecurityHeaders(
      NextResponse.redirect(loginUrl),
      requestId
    );
  }

  if (isAdminPage || isAdminApi) {
    const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });
    const role = token?.role;

    if (isAdminLoginAlias) {
      if (canAccessAdmin(role)) {
        return applySecurityHeaders(NextResponse.redirect(new URL("/admin", request.url)), requestId);
      }
      const requestHeaders = new Headers(request.headers);
      requestHeaders.set("x-request-id", requestId);
      const response = NextResponse.next({ request: { headers: requestHeaders } });
      return applySecurityHeaders(response, requestId);
    }

    if (!canAccessAdmin(role)) {
      if (isAdminApi) {
        return apiError(401, "Authentication required.", requestId);
      }
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("callbackUrl", request.nextUrl.pathname);
      return applySecurityHeaders(NextResponse.redirect(loginUrl), requestId);
    }

    if (requiresAdminRole(pathname) && role !== "admin") {
      if (isAdminApi) {
        return apiError(403, "Insufficient permissions.", requestId);
      }
      return applySecurityHeaders(
        NextResponse.redirect(new URL("/admin?forbidden=1", request.url)),
        requestId
      );
    }

  }

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-request-id", requestId);
  const response = NextResponse.next({ request: { headers: requestHeaders } });
  return applySecurityHeaders(response, requestId);
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml).*)"],
};
