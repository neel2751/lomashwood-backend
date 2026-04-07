import { type NextRequest } from "next/server";

type LogApiErrorInput = {
  request: NextRequest;
  route: string;
  operation: string;
  error: unknown;
};

type JwtPayload = {
  sub?: string;
  userId?: string;
  email?: string;
  role?: string;
};

function decodeJwtPayload(token: string): JwtPayload | null {
  try {
    const [, payload] = token.split(".");
    if (!payload) {
      return null;
    }

    const decoded = Buffer.from(payload, "base64url").toString("utf-8");
    return JSON.parse(decoded) as JwtPayload;
  } catch {
    return null;
  }
}

function getTokenFromRequest(request: NextRequest): string | null {
  const authHeader = request.headers.get("authorization");
  if (authHeader?.startsWith("Bearer ")) {
    return authHeader.slice(7);
  }

  const cookieToken = request.cookies.get("lw_access_token")?.value;
  return cookieToken ?? null;
}

function getUserFromRequest(request: NextRequest) {
  const token = getTokenFromRequest(request);
  if (!token) {
    return { id: "anonymous", role: "unknown" };
  }

  const payload = decodeJwtPayload(token);
  if (!payload) {
    return { id: "unknown", role: "unknown" };
  }

  return {
    id: payload.userId ?? payload.sub ?? payload.email ?? "unknown",
    role: payload.role ?? "unknown",
  };
}

export function logApiRouteError({ request, route, operation, error }: LogApiErrorInput) {
  const requestId = request.headers.get("x-request-id") ?? crypto.randomUUID();
  const user = getUserFromRequest(request);
  const status =
    typeof (error as { status?: unknown })?.status === "number"
      ? (error as { status: number }).status
      : 500;
  const code = (error as { code?: string })?.code ?? "UNEXPECTED_ERROR";
  const message = error instanceof Error ? error.message : "Unknown error";

  console.error(
    JSON.stringify({
      level: "error",
      event: "api_route_error",
      requestId,
      route,
      operation,
      method: request.method,
      path: request.nextUrl.pathname,
      userId: user.id,
      userRole: user.role,
      status,
      code,
      message,
      timestamp: new Date().toISOString(),
    }),
  );

  return requestId;
}
