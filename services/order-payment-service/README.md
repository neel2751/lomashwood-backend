# Order-Payment Service

Part of the **Lomash Wood** microservices backend — a Kitchen & Bedroom Design, Sales, and Consultation Platform.

The `order-payment-service` owns the full financial lifecycle of a customer transaction: order creation, Stripe payment processing, webhook event handling, refunds, invoices, tax calculation, coupon management, and shipping fulfilment.

---

## Table of Contents

1. [Responsibilities](#1-responsibilities)
2. [Tech Stack](#2-tech-stack)
3. [Architecture Overview](#3-architecture-overview)
4. [Project Structure](#4-project-structure)
5. [Domain Modules](#5-domain-modules)
6. [API Reference](#6-api-reference)
7. [Stripe Integration](#7-stripe-integration)
8. [Background Jobs](#8-background-jobs)
9. [Event Bus](#9-event-bus)
10. [Database Schema](#10-database-schema)
11. [Configuration & Environment Variables](#11-configuration--environment-variables)
12. [Getting Started (Local)](#12-getting-started-local)
13. [Running Tests](#13-running-tests)
14. [Docker](#14-docker)
15. [Deployment](#15-deployment)
16. [Error Handling](#16-error-handling)
17. [Security](#17-security)
18. [Observability](#18-observability)

---

## 1. Responsibilities

| Domain | Responsibility |
|--------|---------------|
| **Orders** | Create, read, update status, cancel, paginate |
| **Checkout** | Price summary, coupon application, initiate & confirm |
| **Payments** | Stripe PaymentIntent lifecycle, payment records |
| **Webhooks** | Stripe event ingestion, signature verification, idempotent processing |
| **Refunds** | Partial and full refunds via Stripe, status tracking |
| **Invoices** | Auto-generation on payment success, PDF download, void |
| **Coupons** | CRUD, validation, usage tracking, PERCENTAGE and FIXED types |
| **Tax** | Rule management, country/region-specific rates, live calculation |
| **Shipping** | Rate configuration, shipment records, tracking, delivery |

This service does **not** manage authentication, product catalogue, content, notifications, or analytics. Those concerns belong to their respective services.

---

## 2. Tech Stack

| Layer | Choice |
|-------|--------|
| Runtime | Node.js 20 LTS |
| Framework | Express.js |
| Language | TypeScript 5 (strict mode) |
| ORM | Prisma 5 |
| Database | PostgreSQL 15 |
| Cache | Redis 7 |
| Payments | Stripe Node SDK |
| Validation | Zod |
| Auth Middleware | Better Auth (JWT verification) |
| Testing | Jest + Supertest + Testcontainers |
| Logging | Pino (structured JSON) |
| Containerisation | Docker |
| CI/CD | GitHub Actions |

---

## 3. Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                     API Gateway                              │
│           (routes /v1/orders, /v1/payments, etc.)            │
└────────────────────────────┬────────────────────────────────┘
                             │ HTTP
┌────────────────────────────▼────────────────────────────────┐
│               order-payment-service (:4003)                  │
│                                                              │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌────────────────┐  │
│  │  Orders  │ │Payments  │ │ Refunds  │ │    Invoices    │  │
│  └──────────┘ └──────────┘ └──────────┘ └────────────────┘  │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌────────────────┐  │
│  │ Checkout │ │ Coupons  │ │   Tax    │ │    Shipping    │  │
│  └──────────┘ └──────────┘ └──────────┘ └────────────────┘  │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐   │
│  │               Infrastructure Layer                    │   │
│  │  Prisma ORM │ Redis Cache │ Stripe Client │ Event Bus │   │
│  └──────────────────────────────────────────────────────┘   │
└──────────────┬──────────────────────────┬───────────────────┘
               │                          │
        ┌──────▼──────┐           ┌───────▼────────┐
        │ PostgreSQL  │           │  Redis         │
        │   :5432     │           │  :6379         │
        └─────────────┘           └────────────────┘
                                          │
                               ┌──────────▼────────┐
                               │  Event Bus (Redis  │
                               │  Pub/Sub or Kafka) │
                               └───────────────────┘
```

### Request Lifecycle

```
HTTP Request
    │
    ├─ CORS Middleware
    ├─ Helmet (Security Headers)
    ├─ Rate Limiter
    ├─ Request Logger (Pino)
    ├─ Body Parser
    ├─ Auth Middleware (JWT verification via Better Auth)
    ├─ Zod Validation Middleware
    ├─ Route Handler
    │       └─ Controller → Service → Repository → Prisma → PostgreSQL
    └─ Global Error Handler
```

---

## 4. Project Structure

```
order-payment-service/
├── prisma/
│   ├── schema.prisma          # Full data model
│   ├── seed.ts                # Development seed data
│   └── migrations/            # Applied migration history
│
├── src/
│   ├── main.ts                # Entry point
│   ├── app.ts                 # Express app factory
│   ├── bootstrap.ts           # DI container wiring
│   │
│   ├── app/                   # Domain modules
│   │   ├── orders/
│   │   ├── payments/
│   │   ├── invoices/
│   │   └── refunds/
│   │
│   ├── infrastructure/        # External integrations
│   │   ├── db/                # Prisma client + helpers
│   │   ├── cache/             # Redis client
│   │   ├── payments/          # Stripe + webhook handler
│   │   ├── messaging/         # Event bus producer
│   │   └── http/              # Server bootstrap + graceful shutdown
│   │
│   ├── interfaces/            # HTTP + event adapters
│   │   ├── http/              # Express router factory
│   │   └── events/            # Event subscribers
│   │
│   ├── config/                # Validated env config
│   ├── jobs/                  # Background job definitions
│   ├── events/                # Outbound domain events
│   └── shared/                # Errors, types, pagination utils
│
└── tests/
    ├── unit/                  # Service + repository unit tests
    ├── integration/           # Route integration tests (mocked DB)
    └── e2e/                   # Full-stack tests (real DB via Testcontainers)
```

---

## 5. Domain Modules

Each module follows the same internal layout:

```
module/
├── module.controller.ts   # HTTP handler — delegates to service, no business logic
├── module.service.ts      # Business logic, orchestration
├── module.repository.ts   # Prisma data access
├── module.routes.ts       # Express router + middleware composition
├── module.schemas.ts      # Zod input/output schemas
├── module.types.ts        # TypeScript interfaces and DTOs
├── module.mapper.ts       # Entity ↔ DTO transformation
└── module.constants.ts    # Magic strings, limits, defaults
```

### Orders

Manages the order entity from creation through to fulfilment or cancellation.

- Customers can create orders with one or more product line items
- Orders carry computed `subtotal`, `taxAmount`, `shippingAmount`, `discountAmount`, and `totalAmount`
- Status transitions: `PENDING → CONFIRMED → PROCESSING → SHIPPED → DELIVERED | CANCELLED`
- Payment status transitions independently: `UNPAID → PAID | FAILED | REFUNDED`
- Regular users can only access their own orders; admins can access all

### Checkout

Orchestrates the multi-step checkout process before an order is committed.

- `POST /v1/checkout/summary` — returns a full price breakdown without persisting anything
- `POST /v1/checkout/apply-coupon` — validates a coupon against an order amount and returns discount details
- `POST /v1/checkout/initiate` — creates the order record, the payment record, and the Stripe PaymentIntent atomically inside a transaction
- `POST /v1/checkout/confirm` — marks the order as confirmed after client-side payment authorisation

### Payments

Wraps the Stripe PaymentIntent lifecycle.

- One PaymentIntent per payment attempt; multiple attempts per order are allowed (retry after decline)
- Payment records store the Stripe `paymentIntentId` for webhook correlation
- Idempotency keys are forwarded to Stripe to prevent double charges

### Webhooks

Processes inbound Stripe webhook events after verifying the `stripe-signature` header with `stripe.webhooks.constructEvent`.

| Stripe Event | Action |
|---|---|
| `payment_intent.succeeded` | Mark payment SUCCEEDED, order CONFIRMED + PAID, emit `payment-succeeded` event |
| `payment_intent.payment_failed` | Mark payment FAILED, order paymentStatus FAILED |
| `payment_intent.canceled` | Mark order CANCELLED |
| `charge.refunded` | Match refund by `stripeRefundId`, mark SUCCEEDED |

All processing is wrapped in a Prisma transaction to guarantee consistency. Events are processed idempotently — a duplicate webhook does not double-process.

### Refunds

- Admins only can issue refunds
- Refund amount must not exceed the original payment amount (including previously refunded amounts)
- Stripe `refunds.create` is called first; on success the refund record is persisted
- `charge.refunded` webhook confirms final status asynchronously

### Invoices

- Auto-generated when a `payment-succeeded` event is received
- Numbered sequentially: `INV-YYYY-NNNN`
- PDF generation is handled by the `InvoiceService` using a template engine
- Invoices can be voided by admin; voided invoices cannot be downloaded

### Coupons

- Supports `PERCENTAGE` (with optional `maxDiscountAmount` cap) and `FIXED` value types
- Validates: expiry date, ACTIVE status, usage limit, minimum order amount
- `usageCount` is atomically incremented with Prisma's `increment` operator
- Admin CRUD; customers can only call the read-only `validate` endpoint

### Tax

- Rules are keyed by `country` (ISO 3166-1 alpha-2), optional `region`, and `category`
- Region-specific rules always take priority over country-level defaults
- Supports `PERCENTAGE` and `FIXED` rate types
- The `calculate` endpoint is publicly accessible to authenticated users for live price previews

### Shipping

- Rates define `method` (STANDARD, EXPRESS, OVERNIGHT), `price`, optional `freeThreshold`, `estimatedDays`, and allowed `countries`
- When an order qualifies for free shipping (`orderAmount >= freeThreshold`), `effectiveCost` is zero
- A `Shipping` record is created per order at checkout initiation
- Admin can add tracking details → shipment transitions to `SHIPPED`
- Admin can mark delivery → `DELIVERED` with `deliveredAt` timestamp

---

## 6. API Reference

All routes are prefixed with `/v1`. Authentication is via `Authorization: Bearer <token>`.

### Orders

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `GET` | `/orders` | User / Admin | List orders (scoped to user; admin sees all) |
| `GET` | `/orders/:id` | Owner / Admin | Get order by ID |
| `POST` | `/orders` | User | Create a new order |
| `PATCH` | `/orders/:id/status` | Admin | Update order status |
| `DELETE` | `/orders/:id` | Admin | Cancel (soft-delete) an order |

### Checkout

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `POST` | `/checkout/summary` | User | Price breakdown preview |
| `POST` | `/checkout/apply-coupon` | User | Validate and calculate coupon discount |
| `POST` | `/checkout/initiate` | User | Create order + Stripe PaymentIntent |
| `POST` | `/checkout/confirm` | User | Confirm checkout session |

### Payments

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `POST` | `/payments/create-intent` | User | Create a Stripe PaymentIntent for an order |
| `GET` | `/payments` | Admin | List all payments (paginated) |
| `GET` | `/payments/:id` | Owner / Admin | Get payment by ID |
| `GET` | `/payments/order/:orderId` | Owner / Admin | Get all payments for an order |

### Webhooks

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `POST` | `/webhooks/stripe` | None (Stripe signature) | Ingest Stripe webhook events |

### Refunds

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `POST` | `/refunds` | Admin | Issue a refund |
| `GET` | `/refunds` | Admin | List all refunds (paginated) |
| `GET` | `/refunds/:id` | Owner / Admin | Get refund by ID |
| `GET` | `/refunds/payment/:paymentId` | Owner / Admin | Get refunds for a payment |

### Invoices

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `GET` | `/invoices` | Admin | List all invoices (paginated) |
| `GET` | `/invoices/:id` | Owner / Admin | Get invoice by ID |
| `GET` | `/invoices/:id/download` | Owner / Admin | Download invoice as PDF |
| `GET` | `/invoices/order/:orderId` | Owner / Admin | Get invoices for an order |
| `PATCH` | `/invoices/:id/void` | Admin | Void an issued invoice |

### Coupons

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `POST` | `/coupons` | Admin | Create a coupon |
| `GET` | `/coupons` | Admin | List all coupons (paginated) |
| `GET` | `/coupons/:id` | Admin | Get coupon by ID |
| `PATCH` | `/coupons/:id` | Admin | Update coupon |
| `PATCH` | `/coupons/:id/deactivate` | Admin | Deactivate coupon |
| `DELETE` | `/coupons/:id` | Admin | Delete coupon |
| `POST` | `/coupons/validate` | User | Validate a coupon code |

### Tax Rules

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `POST` | `/tax-rules` | Admin | Create a tax rule |
| `GET` | `/tax-rules` | Admin | List all tax rules (paginated) |
| `GET` | `/tax-rules/:id` | Admin | Get tax rule by ID |
| `PATCH` | `/tax-rules/:id` | Admin | Update tax rule |
| `PATCH` | `/tax-rules/:id/deactivate` | Admin | Deactivate tax rule |
| `DELETE` | `/tax-rules/:id` | Admin | Delete tax rule |
| `POST` | `/tax-rules/calculate` | User | Calculate tax for an amount |

### Shipping

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `GET` | `/shipping/rates` | User | List available rates for a country |
| `POST` | `/shipping/rates` | Admin | Create a shipping rate |
| `GET` | `/shipping` | Admin | List all shipments (paginated) |
| `GET` | `/shipping/:id` | Owner / Admin | Get shipment by ID |
| `PATCH` | `/shipping/:id/tracking` | Admin | Update tracking info |
| `PATCH` | `/shipping/:id/delivered` | Admin | Mark shipment as delivered |

### Health

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `GET` | `/health` | None | Full health check (DB + Redis) |
| `GET` | `/health/live` | None | Liveness probe |
| `GET` | `/health/ready` | None | Readiness probe (DB only) |
| `GET` | `/health/db` | None | Database connectivity + latency |
| `GET` | `/health/cache` | None | Redis connectivity |

---

## 7. Stripe Integration

### PaymentIntent Flow

```
Client                 Service                  Stripe
  │                       │                       │
  │  POST /checkout/initiate                      │
  ├──────────────────────►│                       │
  │                       │  paymentIntents.create │
  │                       ├──────────────────────►│
  │                       │◄──────────────────────┤
  │◄──────────────────────┤  { clientSecret }      │
  │                       │                       │
  │  (client confirms payment with Stripe.js)     │
  │                       │                       │
  │                       │◄── payment_intent.succeeded webhook
  │                       │  (update order + payment in DB)
```

### Webhook Security

Every inbound webhook request is verified using:

```typescript
stripe.webhooks.constructEvent(
  rawBody,         // raw Buffer — not parsed JSON
  signature,       // stripe-signature header
  webhookSecret,   // STRIPE_WEBHOOK_SECRET env var
);
```

The Express webhook route must receive the **raw body**. The `body-parser` middleware is **bypassed** for `/v1/webhooks/stripe` — the route uses `express.raw({ type: 'application/json' })`.

### Idempotency

- Each Stripe API call includes an `idempotencyKey` constructed from the internal payment record ID
- Webhook processing checks whether a payment/refund is already in its terminal state before applying updates
- Duplicate webhook deliveries are silently acknowledged with `{ received: true }`

---

## 8. Background Jobs

Defined in `src/jobs/` and scheduled via `node-cron`:

| Job | Schedule | Description |
|-----|----------|-------------|
| `reconcile-payments.job.ts` | `0 2 * * *` | Reconcile Stripe payment records with local DB |
| `expire-orders.job.ts` | `*/15 * * * *` | Cancel PENDING orders unpaid after 30 minutes |
| `retry-failed-webhooks.job.ts` | `*/5 * * * *` | Replay failed webhook events from the dead-letter log |
| `close-abandoned-checkouts.job.ts` | `*/10 * * * *` | Cancel PaymentIntents for abandoned checkouts |

---

## 9. Event Bus

Events are published after successful operations. Consumers in other services subscribe to these topics.

| Event | Topic | Payload |
|-------|-------|---------|
| `order-created` | `order.created` | `{ orderId, userId, totalAmount, items }` |
| `order-cancelled` | `order.cancelled` | `{ orderId, userId, reason }` |
| `payment-succeeded` | `payment.succeeded` | `{ orderId, paymentId, amount, currency }` |
| `refund-issued` | `refund.issued` | `{ orderId, refundId, amount, reason }` |

---

## 10. Database Schema

Key Prisma models (abbreviated):

```prisma
model Order {
  id              String        @id @default(uuid())
  userId          String
  status          OrderStatus   @default(PENDING)
  paymentStatus   PaymentStatus @default(UNPAID)
  subtotal        Int
  taxAmount       Int
  shippingAmount  Int
  discountAmount  Int           @default(0)
  totalAmount     Int
  currency        String        @default("GBP")
  shippingAddress Json
  notes           String?
  items           OrderItem[]
  payments        Payment[]
  shipping        Shipping?
  invoice         Invoice?
  createdAt       DateTime      @default(now())
  updatedAt       DateTime      @updatedAt
  deletedAt       DateTime?
}

model Payment {
  id                     String        @id @default(uuid())
  orderId                String
  stripePaymentIntentId  String        @unique
  amount                 Int
  currency               String
  status                 PaymentStatus
  method                 PaymentMethod
  refunds                Refund[]
  transactions           Transaction[]
  order                  Order         @relation(fields: [orderId], references: [id])
  createdAt              DateTime      @default(now())
  updatedAt              DateTime      @updatedAt
}

model Coupon {
  id               String       @id @default(uuid())
  code             String       @unique
  type             CouponType
  value            Int
  minOrderAmount   Int?
  maxDiscountAmount Int?
  usageLimit       Int?
  usageCount       Int          @default(0)
  expiresAt        DateTime
  status           CouponStatus @default(ACTIVE)
  createdAt        DateTime     @default(now())
  updatedAt        DateTime     @updatedAt
}
```

All monetary values are stored as **integers in the smallest currency unit** (pence for GBP). `150000` = £1500.00.

---

## 11. Configuration & Environment Variables

Copy `.env.example` to `.env` and fill in the values.

```bash
cp .env.example .env
```

| Variable | Required | Description |
|----------|----------|-------------|
| `NODE_ENV` | ✅ | `development` \| `production` \| `test` |
| `PORT` | ✅ | HTTP port (default `4003`) |
| `DATABASE_URL` | ✅ | PostgreSQL connection string |
| `REDIS_URL` | ✅ | Redis connection string |
| `JWT_SECRET` | ✅ | Shared JWT signing secret (from auth-service) |
| `JWT_EXPIRES_IN` | ✅ | Token expiry, e.g. `1h` |
| `STRIPE_SECRET_KEY` | ✅ | Stripe secret key (`sk_live_...` or `sk_test_...`) |
| `STRIPE_WEBHOOK_SECRET` | ✅ | Stripe webhook signing secret (`whsec_...`) |
| `STRIPE_CURRENCY` | | Default currency (default `gbp`) |
| `BCRYPT_ROUNDS` | | Password hash rounds (default `12`) |
| `RATE_LIMIT_WINDOW_MS` | | Rate limit window in ms (default `60000`) |
| `RATE_LIMIT_MAX` | | Max requests per window (default `100`) |
| `LOG_LEVEL` | | Pino log level (default `info`) |
| `CORS_ORIGINS` | | Comma-separated allowed origins |
| `EVENT_BUS_URL` | | Event bus connection string (Redis or Kafka) |

---

## 12. Getting Started (Local)

### Prerequisites

- Node.js ≥ 20
- pnpm ≥ 8
- Docker & Docker Compose

### Setup

```bash
# 1. Install dependencies
pnpm install

# 2. Start infrastructure (PostgreSQL + Redis)
docker compose -f ../../infra/docker/docker-compose.yml up -d postgres redis

# 3. Set up environment variables
cp .env.example .env
# Edit .env with your local values

# 4. Run database migrations
npx prisma migrate dev

# 5. Seed development data
npx prisma db seed

# 6. Start the service in watch mode
pnpm dev
```

The service starts at `http://localhost:4003`.

### Prisma Studio

```bash
npx prisma studio
```

Opens a visual database browser at `http://localhost:5555`.

---

## 13. Running Tests

### Unit Tests

Fast, isolated — all DB and external calls are mocked.

```bash
pnpm test:unit
```

### Integration Tests

Route-level tests with mocked Prisma and Stripe clients.

```bash
pnpm test:integration
```

### E2E Tests

Spins up real PostgreSQL and Redis containers via Testcontainers. **Requires Docker.**

```bash
pnpm test:e2e
```

> E2E tests must run with `--runInBand` (enforced in `jest.e2e.config.ts`). They share global state including container references and seeded IDs.

### All Tests

```bash
pnpm test
```

### Coverage Report

```bash
pnpm test:coverage
```

### Test Pyramid Summary

| Layer | Count | Speed | DB | Stripe |
|-------|-------|-------|----|--------|
| Unit | ~150 | Fast | Mocked | Mocked |
| Integration | ~100 | Medium | Mocked | Mocked |
| E2E | ~90 | Slow | Real (container) | Nocked |

---

## 14. Docker

### Build

```bash
docker build -t lomash-wood/order-payment-service:latest .
```

### Run

```bash
docker run \
  -p 4003:4003 \
  --env-file .env \
  lomash-wood/order-payment-service:latest
```

### Multi-service (docker compose)

```bash
# From monorepo root
docker compose up order-payment-service
```

---

## 15. Deployment

### Environment Stages

| Stage | Branch | Auto-deploy |
|-------|--------|-------------|
| Staging | `develop` | ✅ on push |
| Production | `main` | ✅ on tag `v*` |

### CI/CD Pipeline

Defined in `.github/workflows/`:

| Workflow | Trigger | Actions |
|----------|---------|---------|
| `ci.yml` | PR / push | Lint → type-check → unit tests → integration tests |
| `security-scan.yml` | Push | Trivy container scan + npm audit |
| `deploy-staging.yml` | Push to `develop` | Build → push ECR → ECS deploy |
| `deploy-production.yml` | Tag `v*` | Build → push ECR → ECS blue/green deploy |
| `rollback.yml` | Manual | Roll back ECS to previous task definition |

### Health Check (ECS / Kubernetes)

- **Liveness:** `GET /health/live` — expects `200`
- **Readiness:** `GET /health/ready` — expects `200`

### Prisma Migrations in Production

Migrations run as a one-shot ECS task before the new service version starts:

```bash
npx prisma migrate deploy
```

This is wired into the ECS task definition pre-start hook.

---

## 16. Error Handling

All errors flow through the global error handler in `src/middleware/error.middleware.ts`.

### AppError

Domain errors extend `AppError`:

```typescript
throw new AppError('Coupon has expired', 422, 'COUPON_EXPIRED');
```

### Standard Error Response

```json
{
  "success": false,
  "error": {
    "code": "COUPON_EXPIRED",
    "message": "Coupon has expired",
    "statusCode": 422
  }
}
```

### HTTP Status Codes

| Code | When |
|------|------|
| `400` | Invalid request body (Zod validation failure) |
| `401` | Missing or invalid JWT |
| `403` | Authenticated but insufficient permissions |
| `404` | Resource not found |
| `409` | Conflict (e.g. duplicate coupon code, already-paid order) |
| `422` | Business rule violation (e.g. coupon expired, refund exceeds payment) |
| `429` | Rate limit exceeded |
| `500` | Unexpected internal server error |

---

## 17. Security

- **JWT verification** on all protected routes via Better Auth middleware
- **Role-based access control** — `ADMIN` and `CUSTOMER` roles enforced per route
- **Ownership checks** — users can only access their own orders, payments, invoices
- **Stripe webhook signature** verification using `stripe.webhooks.constructEvent`
- **Raw body preservation** for webhook routes (bypasses JSON parsing)
- **Zod input validation** on all request bodies and query strings
- **Helmet** for HTTP security headers (CSP, HSTS, X-Frame-Options, etc.)
- **Rate limiting** via `express-rate-limit` (configurable per route group)
- **SQL injection protection** via Prisma's parameterised queries
- **No secrets in logs** — Pino redaction configured for `authorization`, `password`, `stripeKey`
- **Monetary values as integers** — no floating-point precision issues

---

## 18. Observability

### Structured Logging (Pino)

Every request is logged with:

```json
{
  "level": "info",
  "time": "2026-01-10T10:00:00.000Z",
  "service": "order-payment-service",
  "requestId": "uuid",
  "method": "POST",
  "path": "/v1/orders",
  "statusCode": 201,
  "durationMs": 45,
  "userId": "user-uuid"
}
```

### Health Endpoints

| Endpoint | Checks |
|----------|--------|
| `/health` | PostgreSQL + Redis + uptime + timestamp |
| `/health/live` | Process alive |
| `/health/ready` | PostgreSQL reachable |
| `/health/db` | PostgreSQL latency in ms |
| `/health/cache` | Redis PING |

### Metrics

Prometheus-compatible metrics are exposed at `/metrics` (scrape target for Grafana).

Key metrics:

- `http_request_duration_ms` — request latency histogram
- `http_requests_total` — request count by method, route, status
- `stripe_webhook_events_total` — webhook events by type and result
- `order_creation_total` — orders created by currency
- `payment_success_total` / `payment_failure_total`
- `refund_total` — refunds issued by currency

### Distributed Tracing

OpenTelemetry traces are emitted with `service.name = order-payment-service` and forwarded to Tempo via the collector sidecar.

---

## Contributing

See [`docs/onboarding/coding-standards.md`](../../docs/onboarding/coding-standards.md) and [`docs/onboarding/testing-standards.md`](../../docs/onboarding/testing-standards.md) in the monorepo root.

Branch naming: `feat/`, `fix/`, `chore/` prefixes. PRs require passing CI and one approval.

---

*Lomash Wood — Kitchen & Bedroom Design Platform*