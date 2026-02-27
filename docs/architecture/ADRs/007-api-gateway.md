# ADR 007: API Gateway as Single Entry Point

## Status

Accepted

## Date

2026-02-01

## Context

The Lomash Wood platform exposes nine microservices, each running on its own internal port and Kubernetes service. External clients (browser frontend, mobile app) must not be exposed to the internal service topology. A single, stable entry point is required that:

- Provides a unified base URL for all API consumers
- Enforces authentication and authorisation before requests reach internal services
- Applies rate limiting to protect internal services from abuse
- Handles CORS for browser-based clients
- Aggregates request logging and provides a single point for access auditing
- Allows internal services to change ports, DNS names, or be redeployed without affecting API consumers

Without an API gateway, each microservice would need to independently implement CORS, rate limiting, and auth validation — creating duplication and inconsistency.

## Decision

We implement a dedicated **api-gateway** service (`api-gateway/`) built with Node.js + Express + TypeScript that acts as the single external entry point for all client traffic. The api-gateway does not contain business logic; it routes requests to internal services via HTTP proxy.

The api-gateway is deployed as a Kubernetes service with an external LoadBalancer (AWS ALB), while all internal microservices are deployed as ClusterIP services (not externally reachable).

## Responsibilities

| Responsibility | Implementation |
|---|---|
| JWT validation | `auth.middleware.ts` — validates token on every protected route |
| Role enforcement | `auth.middleware.ts` — checks role claims against route requirements |
| Rate limiting | `rate-limit.middleware.ts` — per-IP sliding window via Redis |
| CORS | `cors.middleware.ts` — configured allowlist per environment |
| Request logging | `request-logger.middleware.ts` — structured JSON logs with request ID |
| Request timeout | `timeout.middleware.ts` — 30s default, configurable per route |
| Payload validation | `validation.middleware.ts` — Zod schema validation before proxying |
| Health check | `GET /health` — returns gateway and upstream service health |
| Proxy | `proxy.controller.ts` — forwards requests to internal service |

## Route-to-Service Mapping

| Route Prefix | Internal Service | Port |
|---|---|---|
| `/v1/auth/*` | auth-service | 3001 |
| `/v1/products/*` | product-service | 3002 |
| `/v1/categories/*` | product-service | 3002 |
| `/v1/appointments/*` | appointment-service | 3003 |
| `/v1/showrooms/*` | appointment-service | 3003 |
| `/v1/orders/*` | order-payment-service | 3004 |
| `/v1/payments/*` | order-payment-service | 3004 |
| `/v1/webhooks/stripe` | order-payment-service | 3004 |
| `/v1/blog/*` | content-service | 3005 |
| `/v1/pages/*` | content-service | 3005 |
| `/v1/media/*` | content-service | 3005 |
| `/v1/uploads` | content-service | 3005 |
| `/v1/customers/*` | customer-service | 3006 |
| `/v1/notifications/*` | notification-service | 3007 |
| `/v1/analytics/*` | analytics-service | 3008 |
| `/v1/brochures` | customer-service | 3006 |
| `/v1/business` | customer-service | 3006 |
| `/v1/newsletter` | customer-service | 3006 |
| `/v1/contact` | customer-service | 3006 |

Internal service URLs are configured in `api-gateway/src/config/services.ts` and injected via environment variables, allowing them to be updated per environment without code changes.

## Authentication Flow

```
Client Request
  │
  ▼
api-gateway: auth.middleware.ts
  │
  ├── Extract Bearer token from Authorization header
  ├── Verify JWT signature against AUTH_JWT_SECRET
  ├── Check token expiry
  ├── Check token JTI against Redis blacklist
  ├── Attach decoded { userId, role, sessionId } to req.user
  │
  ▼
Proxied to internal service with X-User-Id and X-User-Role headers
```

Internal services trust the `X-User-Id` and `X-User-Role` headers injected by the gateway. They do not independently verify the JWT, which avoids secret distribution across services.

## Rate Limiting Configuration

```
Default:         100 requests / 15 minutes / IP
Auth routes:     20 requests / 15 minutes / IP
Analytics track: 200 requests / 1 minute / IP
Stripe webhook:  No rate limit (Stripe IPs whitelisted)
```

Defined in `api-gateway/src/config/rate-limit.ts`.

## Stripe Webhook Exception

The Stripe webhook endpoint (`POST /v1/webhooks/stripe`) bypasses JWT auth and rate limiting. It is protected by Stripe signature verification performed inside the order-payment-service. The raw request body is forwarded unmodified (not parsed by body-parser middleware on this route).

## Consequences

### Positive

- Single stable external URL for all API consumers; internal topology is hidden.
- Auth and rate limiting enforced centrally; internal services do not duplicate this logic.
- Internal services are not publicly reachable (ClusterIP only), reducing attack surface.
- Request IDs propagated via `X-Request-Id` header enable cross-service trace correlation.
- CORS policy maintained in one place.

### Negative

- The api-gateway is a single point of failure; mitigated by running minimum 2 replicas with HPA and Kubernetes liveness probes.
- Adds one network hop to every request; mitigated by keeping the gateway lightweight (proxy only, no business logic).
- JWT secret must be shared between the gateway and the auth-service for verification.

## Alternatives Considered

### AWS API Gateway (Managed)

Evaluated. AWS API Gateway provides managed rate limiting, auth integration, and routing. Rejected because it introduces AWS lock-in, has limited request transformation capabilities, and does not support the custom middleware pipeline (token blacklist check, request ID injection) without Lambda authorisers, which add latency.

### NGINX / Kong

Evaluated. NGINX and Kong are performant API gateway solutions. Rejected because they require separate configuration management (Lua scripting for Kong, NGINX config files) outside the TypeScript codebase. The custom Express gateway keeps all gateway logic in the same language and toolchain as the rest of the platform, making it accessible to the full engineering team.

### No Gateway (Direct Service Exposure)

Rejected. Exposing each service individually requires each to implement CORS, rate limiting, and auth validation independently. This creates duplication, inconsistency, and expands the attack surface by exposing internal service ports externally.

## Related ADRs

- ADR 001: Microservices (gateway sits in front of all services)
- ADR 004: Redis (rate limit counters stored in Redis)
- ADR 005: Kubernetes (gateway deployed as external LoadBalancer service)
- ADR 008: Observability (request logging and tracing originate at the gateway)