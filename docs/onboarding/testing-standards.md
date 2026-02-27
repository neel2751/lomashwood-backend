# Testing Standards

---

## Overview

Every microservice in the Lomash Wood backend maintains three layers of tests: unit, integration, and end-to-end. Tests are not optional — PRs without adequate test coverage for new code are not merged. The target is 80% line coverage on services and repositories, with critical paths (payments, bookings, auth) requiring 90%+.

---

## Test Stack

| Tool | Purpose |
|---|---|
| Jest | Test runner, assertions, mocking |
| Supertest | HTTP integration test client |
| `@faker-js/faker` | Test data generation |
| `jest-mock-extended` | Type-safe mocking of classes and interfaces |
| `testcontainers` | Ephemeral PostgreSQL for integration tests |
| Prisma `$transaction` rollback | Database isolation between integration tests |

---

## Test Layers

### Unit Tests

**Location:** `tests/unit/`

**What they test:** A single class in isolation with all dependencies mocked. Services, repositories, mappers, validators, utility functions.

**Rules:**
- No real database connections.
- No real HTTP calls.
- No real Redis connections.
- All dependencies injected via constructor and mocked with `jest-mock-extended`.
- Each test file tests exactly one module.
- Tests must run in under 100ms each.

**Example — Service Unit Test**

```typescript
// tests/unit/product.service.test.ts
import { mock } from 'jest-mock-extended';
import { ProductService } from '../../src/app/products/product.service';
import type { ProductRepository } from '../../src/app/products/product.repository';
import type { EventProducer } from '../../src/infrastructure/messaging/event-producer';
import { productFixture } from '../fixtures/products.fixture';
import { NotFoundError } from '../../src/shared/errors';

describe('ProductService', () => {
  const productRepository = mock<ProductRepository>();
  const eventProducer = mock<EventProducer>();
  const logger = mock<Logger>();

  let service: ProductService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new ProductService(productRepository, eventProducer, logger);
  });

  describe('findById', () => {
    it('returns a product DTO when the product exists', async () => {
      const product = productFixture.build();
      productRepository.findById.mockResolvedValueOnce(product);

      const result = await service.findById(product.id);

      expect(result.id).toBe(product.id);
      expect(result.title).toBe(product.title);
      expect(productRepository.findById).toHaveBeenCalledWith(product.id);
    });

    it('throws NotFoundError when product does not exist', async () => {
      productRepository.findById.mockResolvedValueOnce(null);

      await expect(service.findById('non-existent-id')).rejects.toThrow(NotFoundError);
    });
  });
});
```

### Integration Tests

**Location:** `tests/integration/`

**What they test:** A full HTTP request-response cycle through the Express router, middleware, controller, service, and repository against a real database. External services (Stripe, SES, Twilio) are mocked.

**Rules:**
- Use a real PostgreSQL instance via `testcontainers` or a dedicated test database.
- Each test wraps the test body in a Prisma transaction that is rolled back after the test — no persistent state between tests.
- External HTTP calls (Stripe, SES) are intercepted via `nock` or `jest.spyOn`.
- Tests are isolated: no shared state between `describe` blocks.
- Each test file covers one route module (e.g., `product.routes.test.ts`).

**Example — Route Integration Test**

```typescript
// tests/integration/product.routes.test.ts
import request from 'supertest';
import { app } from '../../src/app';
import { prisma } from '../../src/infrastructure/db/prisma.client';
import { productFixture } from '../fixtures/products.fixture';
import { generateAdminToken } from '../helpers/auth.helper';

describe('GET /v1/products', () => {
  beforeEach(async () => {
    await prisma.$executeRaw`BEGIN`;
  });

  afterEach(async () => {
    await prisma.$executeRaw`ROLLBACK`;
  });

  it('returns a paginated list of active products', async () => {
    await prisma.product.createMany({ data: productFixture.buildMany(5) });

    const response = await request(app)
      .get('/v1/products')
      .query({ category: 'KITCHEN', limit: 20 });

    expect(response.status).toBe(200);
    expect(response.body.data).toHaveLength(5);
    expect(response.body.pagination.total).toBe(5);
  });

  it('returns 401 when creating a product without auth', async () => {
    const response = await request(app)
      .post('/v1/products')
      .send(productFixture.buildCreateDto());

    expect(response.status).toBe(401);
    expect(response.body.code).toBe('UNAUTHORIZED');
  });

  it('returns 403 when creating a product with customer role', async () => {
    const token = generateAdminToken({ role: 'CUSTOMER' });

    const response = await request(app)
      .post('/v1/products')
      .set('Authorization', `Bearer ${token}`)
      .send(productFixture.buildCreateDto());

    expect(response.status).toBe(403);
  });
});
```

### End-to-End Tests

**Location:** `tests/e2e/`

**What they test:** Full multi-step user flows across the complete running application. E2E tests call the api-gateway, which routes to real internal services running against a seeded test database.

**Rules:**
- Run against a dedicated `test` environment with all services running (via Docker Compose in CI).
- Use `global-setup.ts` to seed the test database and `global-teardown.ts` to clean up.
- E2E tests may be slower (up to 30 seconds per test) — mark with `@slow` tag.
- No mocking of any service — tests real inter-service communication.
- Do not run E2E tests in watch mode.

**Example — E2E Booking Flow**

```typescript
// tests/e2e/booking-flow.e2e.ts
import request from 'supertest';

const GATEWAY_URL = process.env.GATEWAY_URL ?? 'http://localhost:4000';

describe('Booking Flow E2E', () => {
  let availableSlotId: string;

  it('fetches available slots for tomorrow', async () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);

    const response = await request(GATEWAY_URL)
      .get('/v1/appointments/availability')
      .query({ date: tomorrow.toISOString().split('T')[0], type: 'ONLINE' });

    expect(response.status).toBe(200);
    expect(response.body.slots.length).toBeGreaterThan(0);

    availableSlotId = response.body.slots.find((s: any) => s.isAvailable).id;
  });

  it('books an appointment with the available slot', async () => {
    const response = await request(GATEWAY_URL)
      .post('/v1/appointments')
      .send({
        appointmentType: 'ONLINE',
        forKitchen: true,
        forBedroom: false,
        slotId: availableSlotId,
        customerDetails: {
          name: 'E2E Test User',
          phone: '07700900000',
          email: 'e2e@lomashwood.test',
          postcode: 'SW1A 1AA',
          address: '10 Downing Street',
        },
      });

    expect(response.status).toBe(201);
    expect(response.body.status).toBe('CONFIRMED');
    expect(response.body.appointmentType).toBe('ONLINE');
  });
});
```

---

## Fixtures

All test data is generated via factory functions in `tests/fixtures/`. Fixtures use `@faker-js/faker` and builder pattern:

```typescript
// tests/fixtures/products.fixture.ts
import { faker } from '@faker-js/faker';
import type { Product } from '@prisma/client';

export const productFixture = {
  build(overrides: Partial<Product> = {}): Product {
    return {
      id: faker.string.uuid(),
      title: faker.commerce.productName(),
      description: faker.commerce.productDescription(),
      category: 'KITCHEN',
      price: parseFloat(faker.commerce.price({ min: 999, max: 9999 })),
      rangeName: faker.word.noun(),
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
      deletedAt: null,
      ...overrides,
    };
  },

  buildMany(count: number, overrides: Partial<Product> = {}): Product[] {
    return Array.from({ length: count }, () => this.build(overrides));
  },

  buildCreateDto(overrides = {}) {
    return {
      title: faker.commerce.productName(),
      description: faker.commerce.productDescription(),
      category: 'KITCHEN',
      price: 2999.99,
      ...overrides,
    };
  },
};
```

---

## Mocking External Services

### Stripe

```typescript
import Stripe from 'stripe';

jest.mock('stripe', () => {
  return jest.fn().mockImplementation(() => ({
    paymentIntents: {
      create: jest.fn().mockResolvedValue({
        id: 'pi_test_xxx',
        client_secret: 'pi_test_xxx_secret_xxx',
        status: 'requires_payment_method',
      }),
    },
  }));
});
```

### Email (Nodemailer)

```typescript
jest.mock('nodemailer', () => ({
  createTransport: jest.fn().mockReturnValue({
    sendMail: jest.fn().mockResolvedValue({ messageId: 'test-message-id' }),
  }),
}));
```

### Redis

```typescript
import { createClient } from 'redis';
jest.mock('redis', () => ({
  createClient: jest.fn().mockReturnValue({
    get: jest.fn(),
    set: jest.fn(),
    del: jest.fn(),
    connect: jest.fn(),
    on: jest.fn(),
  }),
}));
```

---

## Test Configuration

### jest.config.ts (per service)

```typescript
export default {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/tests'],
  collectCoverageFrom: ['src/**/*.ts', '!src/main.ts', '!src/**/*.types.ts'],
  coverageThresholds: {
    global: { lines: 80, functions: 80, branches: 75, statements: 80 },
  },
  testMatch: ['**/*.test.ts'],
  setupFilesAfterFramework: ['<rootDir>/tests/helpers/setup.ts'],
  testTimeout: 10000,
};
```

### Coverage Thresholds by Service

| Service | Line Coverage | Branch Coverage |
|---|---|---|
| auth-service | 90% | 85% |
| order-payment-service | 90% | 85% |
| appointment-service | 85% | 80% |
| product-service | 80% | 75% |
| content-service | 80% | 75% |
| customer-service | 80% | 75% |
| notification-service | 80% | 75% |
| analytics-service | 80% | 75% |

---

## Running Tests

```bash
# All tests
pnpm test

# Unit tests only
pnpm test:unit

# Integration tests only
pnpm test:integration

# E2E tests only
pnpm test:e2e

# Coverage report
pnpm test:coverage

# Watch mode (unit only)
pnpm test:watch

# Specific file
cd services/auth-service
npx jest tests/unit/auth.service.test.ts

# Specific test by name
npx jest --testNamePattern="returns a product DTO"
```

---

## Test Writing Rules

- One logical assertion per test case. Split multiple concerns into multiple `it` blocks.
- Test names must describe the expected behaviour, not the implementation: `it('returns 404 when product does not exist')` not `it('findById null check')`.
- Never test implementation details — test observable behaviour (return values, thrown errors, side effects).
- Never use `setTimeout` or `sleep` in tests. Use `jest.useFakeTimers()` for time-sensitive logic.
- All `async` tests must `await` all promises. Unawaited promises cause false passes.
- Never share mutable state between tests — use `beforeEach` to reset state.
- Prefer `toEqual` over `toBe` for object comparisons.
- Use `expect.objectContaining` when testing partial object shapes.