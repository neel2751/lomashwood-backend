import { NextRequest, NextResponse } from "next/server";

const PUBLIC_ROUTES = ["/login", "/forgot-password", "/reset-password"];
const AUTH_COOKIE = "lomash_access_token";

export function authMiddleware(req: NextRequest): NextResponse {
  const { pathname } = req.nextUrl;
  const token = req.cookies.get(AUTH_COOKIE)?.value;

  const isPublicRoute = PUBLIC_ROUTES.some((route) =>
    pathname.startsWith(route)
  );

  if (isPublicRoute) {
    if (token) {
      return NextResponse.redirect(new URL("/", req.url));
    }
    return NextResponse.next();
  }

  if (!token) {
    const loginUrl = new URL("/login", req.url);
    loginUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}