
# Analytics Service — E2E Tests

## Files

| File | Coverage |
|---|---|
| `global-setup.ts` | Migrate, seed, flush DB + Redis before suite |
| `global-teardown.ts` | Truncate DB, flush Redis after suite |
| `event-tracking-flow.e2e.ts` | Single event, batch event, filter, auth guard |
| `session-tracking-flow.e2e.ts` | Create, end, identify, retrieve session |
| `conversion-tracking-flow.e2e.ts` | Appointment, order, brochure conversions + rate |
| `funnel-analysis-flow.e2e.ts` | Create, populate, analyse, update, delete funnel |
| `cohort-analysis-flow.e2e.ts` | Create cohort, retention table, delete |
| `dashboard-view-flow.e2e.ts` | Create, widget data, update, default, delete |
| `report-export-flow.e2e.ts` | Report + export queue, status poll, delete |
| `real-time-ingestion-flow.e2e.ts` | track/identify/page ingest, idempotency, batch |
| `data-pipeline-flow.e2e.ts` | Full session→events→conversion→metrics pipeline |
| `admin-analytics-flow.e2e.ts` | Admin access, RBAC enforcement, all admin routes |
| `smoke.e2e.ts` | Health checks, auth guards, 404 handling |

## Environment
```env
TEST_DATABASE_URL=postgresql://postgres:postgres@localhost:5433/lomash_analytics_test
TEST_REDIS_URL=redis://localhost:6380
E2E_SERVICE_TOKEN=<internal-service-jwt>
E2E_ADMIN_TOKEN=<admin-jwt>
```

## Run
```bash
pnpm test:e2e
pnpm jest tests/e2e/smoke.e2e.ts --runInBand
```

## Jest Config
```ts
export default {
  preset: 'ts-jest',
  testEnvironment: 'node',
  globalSetup: './tests/e2e/global-setup.ts',
  globalTeardown: './tests/e2e/global-teardown.ts',
  testMatch: ['**/tests/e2e/**/*.e2e.ts'],
  testTimeout: 30000,
  runInBand: true,
};
```