import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const PUBLIC_PATHS = [
  "/login",
  "/forgot-password",
  "/reset-password",
];

const API_PUBLIC_PATHS = [
  "/api/auth/login",
];

const STATIC_EXTENSIONS = /\.(ico|svg|png|jpg|jpeg|webp|gif|woff|woff2|ttf|otf|css|js|map)$/;

function isPublicPath(pathname: string): boolean {
  return PUBLIC_PATHS.some(
    (path) => pathname === path || pathname.startsWith(path + "/"),
  );
}

function isApiPublicPath(pathname: string): boolean {
  return API_PUBLIC_PATHS.some(
    (path) => pathname === path || pathname.startsWith(path + "/"),
  );
}

function isStaticAsset(pathname: string): boolean {
  return STATIC_EXTENSIONS.test(pathname) || pathname.startsWith("/_next/");
}

function isApiRoute(pathname: string): boolean {
  return pathname.startsWith("/api/");
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
    const payload = JSON.parse(
      Buffer.from(payloadB64, "base64url").toString("utf-8"),
    );
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
    { message: "Authentication required.", code: "UNAUTHORISED" },
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
  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  response.headers.set(
    "Permissions-Policy",
    "camera=(), microphone=(), geolocation=()",
  );
  response.headers.set(
    "Content-Security-Policy",
    [
      "default-src 'self'",
      "script-src 'self' 'unsafe-eval' 'unsafe-inline' https://www.googletagmanager.com",
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "font-src 'self' https://fonts.gstatic.com",
      "img-src 'self' data: blob: https:",
      "connect-src 'self' https://api.lomashwood.com",
      "frame-ancestors 'none'",
    ].join("; "),
  );
  return response;
}

function getUserRole(token: string): string | null {
  try {
    const [, payloadB64] = token.split(".");
    if (!payloadB64) return null;
    const payload = JSON.parse(
      Buffer.from(payloadB64, "base64url").toString("utf-8"),
    );
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

const ADMIN_AND_ABOVE_PATHS = [
  "/auth/users",
  "/auth/sessions",
  "/settings",
];

function isAuthorisedForPath(pathname: string, role: string | null): boolean {
  if (!role) return false;

  if (
    SUPER_ADMIN_ONLY_PATHS.some(
      (path) => pathname === path || pathname.startsWith(path + "/"),
    )
  ) {
    return role === "super_admin";
  }

  if (
    ADMIN_AND_ABOVE_PATHS.some(
      (path) => pathname === path || pathname.startsWith(path + "/"),
    )
  ) {
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
    if (isApiPublicPath(pathname)) {
      return NextResponse.next();
    }

    const token = getAccessToken(request);

    if (!token) {
      return buildUnauthorizedApiResponse();
    }

    if (isTokenExpired(token)) {
      const refreshToken = getRefreshToken(request);
      if (!refreshToken) {
        return buildUnauthorizedApiResponse();
      }

      try {
        const refreshRes = await fetch(
          `${process.env.NEXT_PUBLIC_API_BASE_URL}/auth/refresh`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ refreshToken }),
          },
        );

        if (!refreshRes.ok) {
          return buildUnauthorizedApiResponse();
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
        return buildUnauthorizedApiResponse();
      }
    }

    const role = getUserRole(token);
    if (!isAuthorisedForPath(pathname, role)) {
      return buildForbiddenApiResponse();
    }

    return addSecurityHeaders(NextResponse.next());
  }

  if (isPublicPath(pathname)) {
    const token = getAccessToken(request);

    if (token && !isTokenExpired(token)) {
      const returnUrl = request.nextUrl.searchParams.get("returnUrl");
      const destination =
        returnUrl && returnUrl.startsWith("/") ? returnUrl : "/";
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
      const refreshRes = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/auth/refresh`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ refreshToken }),
        },
      );

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

  if (!isAuthorisedForPath(pathname, role)) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  return addSecurityHeaders(NextResponse.next());
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|fonts|logo.svg|logo-dark.svg).*)",
  ],
};