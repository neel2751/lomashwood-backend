# Customer Service — E2E Tests

End-to-end test suite for the Lomash Wood customer-service microservice.

## Test Files

| File | Description |
|------|-------------|
| `global-setup.ts` | Database migration and seed before all tests |
| `global-teardown.ts` | Full database and Redis cleanup after all tests |
| `customer-onboarding-flow.e2e.ts` | New customer registration and initial setup |
| `profile-update-flow.e2e.ts` | Profile read and update operations |
| `address-management-flow.e2e.ts` | CRUD for customer addresses including primary promotion |
| `wishlist-flow.e2e.ts` | Wishlist item add, remove, check and clear |
| `review-submit-flow.e2e.ts` | Product review submission, approval and rejection |
| `support-ticket-flow.e2e.ts` | Full support ticket lifecycle including agent replies |
| `loyalty-points-flow.e2e.ts` | Loyalty earn, redeem, adjust and tier upgrade |
| `referral-flow.e2e.ts` | Referral code generation, application and completion |
| `notification-settings-flow.e2e.ts` | Notification preference management and opt-out |
| `customer-portal-flow.e2e.ts` | Customer dashboard and portal summary endpoints |
| `smoke.e2e.ts` | Rapid health and auth guard checks |

## Running Tests

```bash
# Run all e2e tests
pnpm test:e2e

# Run a specific test file
pnpm jest tests/e2e/customer-onboarding-flow.e2e.ts --runInBand

# Run with verbose output
pnpm jest tests/e2e --runInBand --verbose
```

## Environment Variables

```env
TEST_DATABASE_URL=postgresql://postgres:postgres@localhost:5432/lomash_wood_customer_test
TEST_REDIS_URL=redis://localhost:6379/1
JWT_SECRET=test-jwt-secret-key-for-e2e-tests
PORT=4006
```

## Prerequisites

- PostgreSQL running locally or via Docker
- Redis running locally or via Docker
- Prisma schema deployed to test database

## Notes

- All tests run with `--runInBand` to avoid parallel database conflicts
- Each test suite creates and cleans up its own isolated data using unique user IDs
- Global setup runs migrations; global teardown flushes all test data