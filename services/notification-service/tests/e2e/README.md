# Notification Service — E2E Tests

End-to-end test suite for the Lomash Wood Notification Service.

## Structure

| File | Coverage |
|------|----------|
| `global-setup.ts` | DB migration, seed, Redis flush before all tests |
| `global-teardown.ts` | DB truncate, Redis flush after all tests |
| `email-send-flow.e2e.ts` | Email send, bulk send, log retrieval |
| `sms-send-flow.e2e.ts` | SMS send, raw SMS, bulk SMS, logs |
| `push-send-flow.e2e.ts` | Push send by userId/token, broadcast, device token management |
| `webhook-delivery-flow.e2e.ts` | Webhook register, signature verification, deactivation |
| `campaign-run-flow.e2e.ts` | Campaign CRUD, trigger, cancel, stats |
| `template-management-flow.e2e.ts` | Template CRUD, preview, deactivation |
| `subscription-management-flow.e2e.ts` | Subscribe, unsubscribe, newsletter opt-out |
| `preference-update-flow.e2e.ts` | Preference GET/PUT/upsert, opt-in/opt-out |
| `provider-failover-flow.e2e.ts` | SES→Nodemailer, Twilio→MSG91, Firebase→WebPush failover |
| `bulk-notification-flow.e2e.ts` | Bulk email/SMS, job status, cancellation, delivery report |
| `smoke.e2e.ts` | Health checks, auth guards, 404 routes |

## Prerequisites
```bash
# Test DB (separate from dev)
TEST_DATABASE_URL=postgresql://postgres:postgres@localhost:5433/lomash_notification_test

# Test Redis
TEST_REDIS_URL=redis://localhost:6380

# Service tokens for E2E
E2E_SERVICE_TOKEN=<internal-service-jwt>
E2E_ADMIN_TOKEN=<admin-jwt>
```

## Running Tests
```bash
# All E2E tests
pnpm test:e2e

# Single flow
pnpm jest tests/e2e/email-send-flow.e2e.ts --runInBand

# With coverage
pnpm test:e2e --coverage
```

## Jest Config (`jest.e2e.config.ts`)
```ts
export default {
  preset: 'ts-jest',
  testEnvironment: 'node',
  globalSetup: './tests/e2e/global-setup.ts',
  globalTeardown: './tests/e2e/global-teardown.ts',
  testMatch: ['**/tests/e2e/**/*.e2e.ts'],
  testTimeout: 30_000,
  runInBand: true,
};
```

## Notes

- All tests run **sequentially** (`--runInBand`) to avoid DB race conditions.
- Provider failover tests use `x-e2e-disable-provider` request header — this header is **only honoured in test environment** (`NODE_ENV=test`).
- `x-e2e-force-retry-scenario` triggers the retry flow in the email service for testing retry logic.
- The webhook receiver at `http://localhost:9999/webhook-receiver` should be started as part of your E2E Docker Compose setup.