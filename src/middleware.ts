import { NextResponse } from "next/server";

import type { NextRequest } from "next/server";

const PUBLIC_PATHS = ["/login", "/register", "/forgot-password", "/reset-password"];

const API_PUBLIC_PATHS = [
  "/api/auth/login",
  "/api/auth/register",
  "/api/showrooms",
  "/api/appointments",
  "/api/v1/products",
  "/api/v1/showrooms",
  "/api/v1/appointments",
  "/api/v1/hero",
  "/api/v1/brochure",
  "/api/v1/brochures",
];

const DEFAULT_CORS_ALLOWED_ORIGINS = [
  "http://localhost:3000",
  "http://localhost:3001",
  "https://lomashwood.co.uk",
  "https://www.lomashwood.co.uk",
  "https://lomashwood-frontend.vercel.app",
];

const STATIC_EXTENSIONS = /\.(ico|svg|png|jpg|jpeg|webp|gif|woff|woff2|ttf|otf|css|js|map)$/;

function normalizeOrigin(value: string): string {
  return value.trim().replace(/\/$/, "");
}

function isPublicPath(pathname: string): boolean {
  return PUBLIC_PATHS.some((path) => pathname === path || pathname.startsWith(path + "/"));
}

function isApiPublicPath(pathname: string): boolean {
  return API_PUBLIC_PATHS.some((path) => pathname === path || pathname.startsWith(path + "/"));
}

function isStaticAsset(pathname: string): boolean {
  return STATIC_EXTENSIONS.test(pathname) || pathname.startsWith("/_next/");
}

function isApiRoute(pathname: string): boolean {
  return pathname.startsWith("/api/");
}

function getAllowedCorsOrigins(): Set<string> {
  const configured = (process.env.CORS_ALLOWED_ORIGINS ?? "")
    .split(",")
    .map((value) => normalizeOrigin(value))
    .filter(Boolean);

  const fallback = process.env.NEXT_PUBLIC_URL?.trim();
  const all = [...DEFAULT_CORS_ALLOWED_ORIGINS, ...(fallback ? [fallback] : []), ...configured];

  return new Set(all.map((value) => normalizeOrigin(value)).filter(Boolean));
}

function addApiCorsHeaders(request: NextRequest, response: NextResponse): NextResponse {
  const rawOrigin = request.headers.get("origin");
  const origin = rawOrigin ? normalizeOrigin(rawOrigin) : null;
  const requestedHeaders = request.headers.get("access-control-request-headers");
  const allowedOrigins = getAllowedCorsOrigins();

  response.headers.set("Access-Control-Allow-Methods", "GET,POST,PUT,PATCH,DELETE,OPTIONS");
  response.headers.set(
    "Access-Control-Allow-Headers",
    requestedHeaders || "Content-Type, Authorization, Accept, Origin, X-Requested-With",
  );
  response.headers.set("Access-Control-Max-Age", "86400");
  response.headers.set("Vary", "Origin");

  if (origin && allowedOrigins.has(origin)) {
    response.headers.set("Access-Control-Allow-Origin", origin);
    response.headers.set("Access-Control-Allow-Credentials", "true");
  }

  return response;
}

function getAccessToken(request: NextRequest): string | null {
  return (
    request.cookies.get("lw_access_token")?.value ??
    request.headers.get("Authorization")?.replace("Bearer ", "") ??
    null
  );
}

function getRefreshToken(request: NextRequest): string | null {
  return request.cookies.get("lw_refresh_token")?.value ?? null;
}

function isTokenExpired(token: string): boolean {
  try {
    const [, payloadB64] = token.split(".");
    if (!payloadB64) return true;
    const payload = JSON.parse(Buffer.from(payloadB64, "base64url").toString("utf-8"));
    if (!payload.exp) return false;
    const bufferSeconds = 60;
    return Date.now() / 1000 >= payload.exp - bufferSeconds;
  } catch {
    return true;
  }
}

function buildLoginRedirect(request: NextRequest): NextResponse {
  const loginUrl = new URL("/login", request.url);
  const pathname = request.nextUrl.pathname;
  if (pathname !== "/" && !isPublicPath(pathname)) {
    loginUrl.searchParams.set("returnUrl", pathname);
  }
  const response = NextResponse.redirect(loginUrl);
  response.cookies.delete("lw_access_token");
  return response;
}

function buildUnauthorizedApiResponse(): NextResponse {
  return NextResponse.json(
    { message: "Authentication required.", code: "UNAUTHORIZED" },
    { status: 401 },
  );
}

function buildForbiddenApiResponse(): NextResponse {
  return NextResponse.json(
    { message: "You do not have permission to access this resource.", code: "FORBIDDEN" },
    { status: 403 },
  );
}

function addSecurityHeaders(response: NextResponse): NextResponse {
  const connectSources = [
    "'self'",
    "https://api.lomashwood.com",
    "https://api.lomashwood.co.uk",
    "http://localhost:3000",
    "http://localhost:8000",
    "https://*.amazonaws.com",
    "https://*.r2.cloudflarestorage.com",
    "https://maps.googleapis.com",
    "https://*.google.com",
    "https://*.googleapis.com",
  ];

  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  response.headers.set("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
  response.headers.set(
    "Content-Security-Policy",
    [
      "default-src 'self'",
      "script-src 'self' 'unsafe-eval' 'unsafe-inline' https://www.googletagmanager.com https://maps.googleapis.com",
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "font-src 'self' https://fonts.gstatic.com",
      "img-src 'self' data: blob: https: https://*.googleapis.com https://*.gstatic.com",
      `connect-src ${connectSources.join(" ")}`,
      "frame-ancestors 'none'",
    ].join("; "),
  );
  return response;
}

function getUserRole(token: string): string | null {
  try {
    const [, payloadB64] = token.split(".");
    if (!payloadB64) return null;
    const payload = JSON.parse(Buffer.from(payloadB64, "base64url").toString("utf-8"));
    return payload.role ?? null;
  } catch {
    return null;
  }
}

const SUPER_ADMIN_ONLY_PATHS = [
  "/auth/roles",
  "/settings/security",
  "/settings/integrations",
  "/settings/audit-logs",
];

const ADMIN_AND_ABOVE_PATHS = ["/auth/users", "/auth/sessions", "/settings"];

function isAuthorizedForPath(pathname: string, role: string | null): boolean {
  if (!role) return false;

  if (SUPER_ADMIN_ONLY_PATHS.some((path) => pathname === path || pathname.startsWith(path + "/"))) {
    return role === "super_admin";
  }

  if (ADMIN_AND_ABOVE_PATHS.some((path) => pathname === path || pathname.startsWith(path + "/"))) {
    return role === "super_admin" || role === "admin";
  }

  return true;
}

export async function middleware(request: NextRequest): Promise<NextResponse> {
  const { pathname } = request.nextUrl;

  if (isStaticAsset(pathname)) {
    return NextResponse.next();
  }

  if (isApiRoute(pathname)) {
    if (request.method === "OPTIONS") {
      return addApiCorsHeaders(request, new NextResponse(null, { status: 204 }));
    }

    if (isApiPublicPath(pathname)) {
      return addApiCorsHeaders(request, NextResponse.next());
    }

    const token = getAccessToken(request);

    if (!token) {
      return addApiCorsHeaders(request, buildUnauthorizedApiResponse());
    }

    if (isTokenExpired(token)) {
      const refreshToken = getRefreshToken(request);
      if (!refreshToken) {
        return addApiCorsHeaders(request, buildUnauthorizedApiResponse());
      }

      try {
        const refreshRes = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/auth/refresh`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ refreshToken }),
        });

        if (!refreshRes.ok) {
          return addApiCorsHeaders(request, buildUnauthorizedApiResponse());
        }

        const { data } = await refreshRes.json();
        const response = NextResponse.next();
        response.cookies.set("lw_access_token", data.accessToken, {
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          sameSite: "lax",
          path: "/",
          maxAge: 15 * 60,
        });
        return addApiCorsHeaders(request, addSecurityHeaders(response));
      } catch {
        return addApiCorsHeaders(request, buildUnauthorizedApiResponse());
      }
    }

    const role = getUserRole(token);
    if (!isAuthorizedForPath(pathname, role)) {
      return addApiCorsHeaders(request, buildForbiddenApiResponse());
    }

    return addApiCorsHeaders(request, addSecurityHeaders(NextResponse.next()));
  }

  if (isPublicPath(pathname)) {
    const token = getAccessToken(request);

    if (token && !isTokenExpired(token)) {
      const returnUrl = request.nextUrl.searchParams.get("returnUrl");
      const destination = returnUrl && returnUrl.startsWith("/") ? returnUrl : "/";
      return NextResponse.redirect(new URL(destination, request.url));
    }

    return addSecurityHeaders(NextResponse.next());
  }

  const token = getAccessToken(request);

  if (!token) {
    return buildLoginRedirect(request);
  }

  if (isTokenExpired(token)) {
    const refreshToken = getRefreshToken(request);

    if (!refreshToken) {
      return buildLoginRedirect(request);
    }

    try {
      const refreshRes = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/auth/refresh`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refreshToken }),
      });

      if (!refreshRes.ok) {
        return buildLoginRedirect(request);
      }

      const { data } = await refreshRes.json();
      const response = NextResponse.next();

      response.cookies.set("lw_access_token", data.accessToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        maxAge: 15 * 60,
      });

      return addSecurityHeaders(response);
    } catch {
      return buildLoginRedirect(request);
    }
  }

  const role = getUserRole(token);

  if (!isAuthorizedForPath(pathname, role)) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  return addSecurityHeaders(NextResponse.next());
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|fonts|logo.svg|logo-dark.svg).*)"],
};
