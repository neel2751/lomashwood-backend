# Order-Payment Service — E2E Test Suite

## Overview

End-to-end tests for the `order-payment-service`. These tests spin up **real PostgreSQL and Redis containers** via [Testcontainers](https://testcontainers.com/), run Prisma migrations, seed baseline data, and execute full HTTP flows against the live Express application.

---

## Structure

```
tests/e2e/
├── global-setup.ts              # Container boot, migrations, seed, token generation
├── global-teardown.ts           # Container stop, Prisma disconnect, cleanup
├── order-create-flow.e2e.ts     # Full order creation lifecycle
├── checkout-flow.e2e.ts         # Price summary → coupon → initiate → confirm
├── payment-success-flow.e2e.ts  # PaymentIntent creation → webhook → CONFIRMED + PAID
├── payment-failure-flow.e2e.ts  # Decline → retry → recovery + cancellation
├── refund-flow.e2e.ts           # Partial/full refund via Stripe webhook
├── invoice-download-flow.e2e.ts # Invoice retrieval, PDF download, void
├── coupon-apply-flow.e2e.ts     # Coupon CRUD, validation, deactivation
├── tax-calculation-flow.e2e.ts  # Tax rule CRUD, region override, FIXED type
├── shipping-selection-flow.e2e.ts # Rate listing, shipment tracking, delivery
├── webhook-processing-flow.e2e.ts # All Stripe webhook event types + edge cases
└── smoke.e2e.ts                 # Sanity: health, auth guards, route existence, 404s
```

---

## Prerequisites

| Tool | Version |
|------|---------|
| Node.js | ≥ 18 |
| Docker | ≥ 20 (required for Testcontainers) |
| pnpm | ≥ 8 |

---

## Running E2E Tests

```bash
# From the service root
pnpm test:e2e

# Or with Jest directly
npx jest --config jest.e2e.config.ts --runInBand --forceExit
```

> **`--runInBand` is required.** E2E tests share global state (containers, tokens, seeded IDs) and must run sequentially.

---

## Jest Config (`jest.e2e.config.ts`)

```typescript
export default {
  displayName: 'e2e',
  preset: 'ts-jest',
  testEnvironment: 'node',
  globalSetup: '<rootDir>/tests/e2e/global-setup.ts',
  globalTeardown: '<rootDir>/tests/e2e/global-teardown.ts',
  testMatch: ['<rootDir>/tests/e2e/**/*.e2e.ts'],
  testTimeout: 30000,
  runInBand: true,
};
```

---

## Global State

`global-setup.ts` writes a `.e2e-state.json` file containing connection strings and JWT tokens so individual test files can access them via Jest globals:

| Global | Type | Description |
|--------|------|-------------|
| `global.__E2E_ADMIN_TOKEN__` | `string` | JWT for admin user |
| `global.__E2E_USER_TOKEN__` | `string` | JWT for customer user |
| `global.__E2E_USER_ID__` | `string` | Customer user UUID |
| `global.__E2E_ADMIN_ID__` | `string` | Admin user UUID |
| `global.__PRISMA__` | `PrismaClient` | Connected client for DB assertions |
| `global.__PG_CONTAINER__` | `StartedTestContainer` | PostgreSQL container |
| `global.__REDIS_CONTAINER__` | `StartedTestContainer` | Redis container |

---

## Seeded Data

The following records are created during `global-setup.ts` and available across all test files:

| Entity | ID | Details |
|--------|----|---------|
| Admin User | `e2e-admin-uuid-001` | `admin@lomashwood-test.com` / `ADMIN` role |
| Customer User | `e2e-customer-uuid-001` | `customer@lomashwood-test.com` / `CUSTOMER` role |
| Product | `e2e-product-uuid-001` | Luna White Kitchen, £1500 |
| Shipping Rate | `e2e-ship-rate-uuid-001` | Standard Delivery, £9.95, free over £500 |
| Tax Rule | `e2e-tax-uuid-001` | UK Standard VAT 20%, GB, GENERAL |
| Coupon | `e2e-coupon-uuid-001` | `E2ETEST20` — 20% off, min £500, max £300 |

---

## Stripe Mocking

Stripe API calls are intercepted with [nock](https://github.com/nock/nock) in individual test files. The webhook signature verification middleware is configured to **bypass** verification when `process.env.NODE_ENV === 'test'` and the `stripe-signature` header value is `e2e-test-bypass-sig`.

---

## Coverage

| Flow | Key Scenarios |
|------|--------------|
| Order | Create, retrieve, cross-user 403, admin list, status update, cancel |
| Checkout | Summary, coupon apply, free shipping, initiate, confirm |
| Payment Success | PI creation, webhook succeeded, invoice auto-generation, duplicate-proof |
| Payment Failure | Decline, retry, recovery, cancellation webhook |
| Refund | Partial, full, over-amount 422, non-admin 403, webhook confirmation |
| Invoice | Retrieve, list, PDF download, auth guards, void |
| Coupon | CRUD, validation, deactivation, expiry, FIXED type |
| Tax | CRUD, region override, deactivation, FIXED type |
| Shipping | Rate listing, free threshold, shipment tracking, delivery guard |
| Webhook | All event types, signature validation, idempotency, malformed JSON |
| Smoke | Health probes, auth guards, admin guards, 404s, DB seed integrity |