# System Design — Lomash Wood Backend

## Overview

Lomash Wood is a kitchen and bedroom design, sales, and consultation platform. The backend is architected as a **microservices monorepo** — independently deployable services communicating through an API gateway and an internal event bus, all managed in a single pnpm workspace for cohesive tooling and shared packages.

---

## Architectural Style

**Pattern:** Microservices with API Gateway  
**Communication:** Synchronous REST (inter-client requests via API Gateway) + Asynchronous events (internal service-to-service via event bus)  
**Deployment target:** AWS ECS Fargate behind an Application Load Balancer  
**Orchestration:** Docker Compose (local dev) → Kubernetes / ECS (staging and production)

---

## High-Level Architecture

```
                        ┌─────────────────────────────────┐
                        │           Clients                │
                        │  Web Browser · Mobile · Admin UI │
                        └─────────────┬───────────────────┘
                                      │ HTTPS
                        ┌─────────────▼───────────────────┐
                        │        CloudFront CDN            │
                        │   Static assets · Media · Cache  │
                        └──────┬──────────────────────────┘
                               │ API requests
                ┌──────────────▼──────────────────────┐
                │      Application Load Balancer       │
                │   TLS termination · Health routing   │
                └──────────────┬──────────────────────┘
                               │
                ┌──────────────▼──────────────────────┐
                │           API Gateway                │
                │  port 3000                           │
                │  • Rate limiting (per-IP + per-user) │
                │  • Auth token verification           │
                │  • Request logging & tracing         │
                │  • Route → service proxy             │
                │  • CORS, helmet, timeout             │
                └──┬───┬───┬───┬───┬───┬───┬──────────┘
                   │   │   │   │   │   │   │
       ┌───────────┘   │   │   │   │   │   └─────────────────┐
       │           ┌───┘   │   │   │   └──────────┐          │
       │           │   ┌───┘   │   └──────┐        │          │
       ▼           ▼   ▼       ▼          ▼        ▼          ▼
  ┌─────────┐ ┌───────┐ ┌─────────┐ ┌────────┐ ┌───────┐ ┌────────┐ ┌──────────┐
  │  Auth   │ │Product│ │Order &  │ │Appoint-│ │Content│ │Customer│ │Analytics │
  │ Service │ │Service│ │Payment  │ │ment    │ │Service│ │Service │ │ Service  │
  │  :3001  │ │ :3002 │ │ Service │ │Service │ │ :3005 │ │  :3006 │ │  :3008   │
  │         │ │       │ │  :3003  │ │ :3004  │ │       │ │        │ │          │
  └────┬────┘ └───┬───┘ └────┬────┘ └───┬────┘ └───┬───┘ └───┬────┘ └────┬─────┘
       │          │          │           │           │          │           │
       └──────────┴──────────┴───────────┴───────────┴──────────┴───────────┘
                                         │
                          ┌──────────────▼──────────────────┐
                          │     Notification Service :3007   │
                          │  Email · SMS · Push · Templates  │
                          └─────────────────────────────────┘
                                         │
              ┌──────────────────────────┴──────────────────────────┐
              │                                                       │
   ┌──────────▼──────────┐                              ┌────────────▼──────────┐
   │    PostgreSQL 16     │                              │     Redis 7.2          │
   │  8 logical databases │                              │  8 logical DB indexes  │
   │  (one per service)   │                              │  Cache · Sessions      │
   └─────────────────────┘                              │  Queues · Rate limits  │
                                                         └───────────────────────┘
```

---

## Service Catalogue

| Service | Port | Responsibility |
|---------|------|---------------|
| **api-gateway** | 3000 | Single entry point — auth verification, rate limiting, proxying |
| **auth-service** | 3001 | Registration, login, logout, JWT, sessions, roles, OTP |
| **product-service** | 3002 | Products, categories, colours, sizes, inventory, pricing |
| **order-payment-service** | 3003 | Orders, Stripe payments, invoices, refunds, webhooks |
| **appointment-service** | 3004 | Bookings, availability, consultants, time slots, reminders |
| **content-service** | 3005 | CMS pages, blogs, media wall, SEO, landing pages, S3 |
| **customer-service** | 3006 | Profiles, wishlist, reviews, support tickets, loyalty points |
| **notification-service** | 3007 | Email (SES), SMS (Twilio), push (FCM), template engine |
| **analytics-service** | 3008 | Event tracking, funnels, dashboards, exports, GTM integration |

---

## Shared Packages

All packages live under `packages/` and are consumed by services via pnpm workspace:

| Package | Purpose |
|---------|---------|
| `shared-types` | TypeScript interfaces shared across service boundaries |
| `shared-utils` | Logger, crypto, date helpers, pagination, retry logic |
| `shared-validation` | Zod schemas reused in both gateway validators and service schemas |
| `auth-client` | HTTP client for auth-service (used by API gateway for token verification) |
| `payment-client` | Stripe wrapper used by order-payment-service |
| `event-bus` | Publisher/subscriber abstraction over the internal message broker |
| `eslint-config` | Shared ESLint rules enforced across all services |
| `tsconfig` | Base TypeScript config extended by every service |

---

## Request Lifecycle

```
Client
  │
  │  1. HTTPS request with Bearer token or session cookie
  ▼
CloudFront
  │  2. Cache HIT → return immediately (static assets, CDN-cached API responses)
  │  Cache MISS → forward to ALB
  ▼
ALB
  │  3. TLS termination, health-based routing, sticky sessions (none needed — stateless)
  ▼
API Gateway
  │  4. Extract JWT from Authorization header or session cookie
  │  5. Validate token via auth-client (calls auth-service /internal/verify)
  │  6. Rate-limit check (Redis sliding window per IP + per user)
  │  7. Zod validate request body/query/params against route schema
  │  8. Attach validated user context to request
  │  9. Proxy to target microservice via http-client
  ▼
Target Service (e.g. appointment-service)
  │  10. Controller receives typed request
  │  11. Service layer executes business logic
  │  12. Repository layer queries PostgreSQL via Prisma
  │  13. Cache read/write via Redis client
  │  14. Publish domain event to event bus (if state changed)
  ▼
Response
  │  15. Service returns typed response DTO
  │  16. API Gateway forwards response to client
  ▼
Event Bus (async, non-blocking)
  │  17. notification-service consumes event → sends email/SMS/push
  │  18. analytics-service consumes event → records tracking data
```

---

## Data Storage Strategy

### PostgreSQL — Source of Truth

Each microservice owns a dedicated logical database on the shared PostgreSQL 16 cluster. Cross-service data access is **never** done via direct DB query — services communicate through the API or event bus only.

```
lomash_auth          ← auth-service
lomash_products      ← product-service
lomash_orders        ← order-payment-service
lomash_appointments  ← appointment-service
lomash_content       ← content-service
lomash_customers     ← customer-service
lomash_notifications ← notification-service
lomash_analytics     ← analytics-service
```

All tables include:
- `id UUID DEFAULT uuid_generate_v4()` — universally unique, safe to expose
- `createdAt TIMESTAMPTZ DEFAULT NOW()`
- `updatedAt TIMESTAMPTZ` — maintained by `set_updated_at()` trigger
- `deletedAt TIMESTAMPTZ` — soft delete pattern; hard deletes reserved for GDPR erasure

### Redis — Ephemeral / High-Speed

Each service uses a dedicated Redis DB index (0–7). Key namespaces follow the pattern `<service>:<entity>:<id>` with explicit TTLs on all keys. Redis is never used as a system of record — all data can be reconstructed from PostgreSQL.

### S3 — Binary Assets

Product images, brochure PDFs, media wall assets, and CMS uploads are stored in S3 and served through CloudFront. The database stores only the S3 object key, never raw binary data.

---

## Authentication & Authorisation

**Library:** Better Auth  
**Token type:** JWT (short-lived access token, 15 min) + refresh token (HTTP-only cookie, 7 days)  
**Session storage:** Redis (auth DB index 0) — enables instant revocation  
**Roles:** `SUPER_ADMIN`, `ADMIN`, `CONSULTANT`, `CUSTOMER`

The API gateway verifies the access token on every request. Services receive a pre-validated user context in the `X-User-Id`, `X-User-Role`, and `X-Session-Id` headers — they do not re-verify tokens independently.

Role-based guards are enforced at the service controller layer using a `@RequireRole()` decorator pattern.

---

## Event-Driven Communication

Internal service-to-service side effects (emails, analytics, cache invalidation) are decoupled via an event bus implemented over Redis pub/sub (dev) and Amazon SQS (staging/production).

Key event flows:

| Producer | Event | Consumers |
|----------|-------|-----------|
| auth-service | `user.created` | notification-service (welcome email), analytics-service |
| appointment-service | `booking.created` | notification-service (confirmation + admin alert), analytics-service |
| appointment-service | `booking.created` (kitchen + bedroom) | notification-service (dual-team mail — FR5.6) |
| order-payment-service | `payment.succeeded` | notification-service (receipt), analytics-service, customer-service (loyalty) |
| order-payment-service | `refund.issued` | notification-service (refund confirmation) |
| content-service | `blog.published` | analytics-service (sitemap rebuild trigger) |
| customer-service | `review.created` | analytics-service |

Events are serialised as JSON with a standard envelope:

```typescript
interface DomainEvent<T> {
  id: string;          // UUID — idempotency key
  topic: string;       // e.g. "booking.created"
  version: number;     // schema version for forward compatibility
  timestamp: string;   // ISO 8601
  producerId: string;  // originating service name
  payload: T;
}
```

---

## API Design Conventions

- **Versioning:** URI prefix `/v1/`
- **Format:** JSON (`Content-Type: application/json`)
- **Pagination:** cursor-based for infinite scroll (product filter pages — FR2.5), offset-based for admin tables
- **Errors:** RFC 7807 Problem Details format
- **Idempotency:** `Idempotency-Key` header required on all `POST` payment and order endpoints
- **Filtering:** `?filter[colour]=white&filter[style]=shaker&sort=-createdAt`
- **Partial updates:** `PATCH` with JSON Merge Patch semantics

---

## Technology Decisions Summary

| Concern | Choice | Rationale |
|---------|--------|-----------|
| Runtime | Node.js 20 LTS | Non-blocking I/O fits the mixed read-heavy / webhook workload |
| Framework | Express.js | Minimal, well-understood, excellent middleware ecosystem |
| Language | TypeScript (strict) | Catches schema drift between services at compile time |
| ORM | Prisma | Type-safe queries, migration tooling, Prisma Client per-service |
| Auth | Better Auth | Modern, extensible, native session + JWT support |
| Validation | Zod | Runtime + compile-time schema sharing via `shared-validation` |
| Payments | Stripe | Industry standard; webhook idempotency, dispute management |
| Email | AWS SES / Nodemailer | SES for production volume; Nodemailer abstraction for provider swap |
| Cache / Queue | Redis 7.2 | Sessions, rate limiting, pub/sub, BullMQ job queues |
| Database | PostgreSQL 16 | ACID, JSONB for flexible CMS fields, btree_gist for slot exclusion |
| Package manager | pnpm | Workspace-aware, fast, strict hoisting avoids phantom deps |
| Container | Docker + Alpine | Minimal image size, fast CI builds |
| Infrastructure | AWS ECS Fargate | Serverless containers; no EC2 capacity management |
| CDN | CloudFront | Low-latency UK + global asset delivery |
| Observability | Prometheus + Grafana + Loki | Full metrics / logs / traces stack |