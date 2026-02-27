# Appointment Service — E2E Test Suite

End-to-end tests for `lomash-wood-backend/services/appointment-service`. These tests run against a real database and Redis instance, verifying complete user journeys from HTTP request through to database state.

---

## Structure

```
tests/e2e/
├── global-setup.ts                    # Migrate DB, seed base fixtures, export env vars
├── global-teardown.ts                 # Clean all records, disconnect DB & Redis
├── appointment-book-flow.e2e.ts       # Full booking journey incl. dual kitchen+bedroom trigger
├── appointment-reschedule-flow.e2e.ts # Reschedule with slot swap and ownership guards
├── appointment-cancel-flow.e2e.ts     # Cancellation with slot release and repeat-cancel guard
├── consultant-availability-flow.e2e.ts# Availability CRUD, overlap detection, consultant toggle
├── calendar-sync-flow.e2e.ts          # Calendar view, admin sync trigger, upcoming appointments
├── reminder-notification-flow.e2e.ts  # EMAIL/SMS reminder lifecycle incl. SENT lock
├── admin-appointment-manage-flow.e2e.ts # Admin CRUD, status transitions, soft delete
├── walkin-booking-flow.e2e.ts         # Showroom/walk-in booking with location validation
├── slot-conflict-flow.e2e.ts          # Race-condition guards, overlap detection, delete protection
smoke.e2e.ts                           # Fast smoke checks — health, auth guards, 404s
README.md
```

---

## Prerequisites

| Requirement | Details |
|---|---|
| Node.js | ≥ 18 |
| PostgreSQL | Running and accessible via `TEST_DATABASE_URL` |
| Redis | Running and accessible via `REDIS_URL` |
| Prisma | Migrations applied via `npx prisma migrate deploy` |

---

## Environment Variables

```env
TEST_DATABASE_URL=postgresql://user:pass@localhost:5432/lomash_appointment_test
REDIS_URL=redis://localhost:6379
JWT_SECRET=your-test-secret
NODE_ENV=test
```

> `global-setup.ts` exports `E2E_ADMIN_TOKEN`, `E2E_USER_TOKEN`, `E2E_CONSULTANT_ID`, and `E2E_LOCATION_ID` automatically into `process.env` for all test files.

---

## Running the Tests

```bash
# All E2E tests
npx jest --testPathPattern="e2e" --runInBand

# Smoke tests only (fast CI gate)
npx jest --testPathPattern="smoke.e2e" --runInBand

# Single flow
npx jest --testPathPattern="appointment-book-flow" --runInBand

# With verbose output
npx jest --testPathPattern="e2e" --runInBand --verbose
```

> **`--runInBand` is required.** E2E tests share a single database and must run serially to avoid state collisions.

---

## Jest Config (`jest.e2e.config.ts`)

```ts
import type { Config } from 'jest';

const config: Config = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  globalSetup: './tests/e2e/global-setup.ts',
  globalTeardown: './tests/e2e/global-teardown.ts',
  testMatch: ['**/tests/e2e/**/*.e2e.ts', '**/tests/smoke.e2e.ts'],
  testTimeout: 30000,
  runInBand: true,
};

export default config;
```

---

## Test Scenarios Coverage

### `appointment-book-flow.e2e.ts`
- Step-by-step booking: type selection → slot browsing → booking → slot lock
- Slot unavailable after booking (409 on repeat attempt)
- Kitchen-only vs kitchen+bedroom dual-category booking
- Internal notification triggered on dual booking
- Admin can see dual-category appointments in filtered list

### `appointment-reschedule-flow.e2e.ts`
- Old slot freed, new slot locked on reschedule
- Appointment `timeSlotId` updated in DB
- 409 on attempt to reschedule a cancelled appointment
- 403 when another user attempts to reschedule

### `appointment-cancel-flow.e2e.ts`
- Slot freed after cancellation
- 400 when reason is omitted
- 409 on double-cancellation
- 403 for ownership mismatch
- Cancellation visible in admin filtered list

### `consultant-availability-flow.e2e.ts`
- Admin creates weekday and weekend availability windows
- 400 for overlapping windows
- Public calendar reflects new availability
- Deactivating consultant hides them from public listings

### `calendar-sync-flow.e2e.ts`
- Public calendar hides booked slots
- Admin `includeBooked` flag exposes all slots
- 400 for missing or inverted date range
- Manual sync updates `lastSyncedAt`
- 403 for non-admin sync trigger
- User upcoming list scoped to their bookings; admin sees all

### `reminder-notification-flow.e2e.ts`
- EMAIL and SMS reminders created with future `scheduledAt`
- 400 for past `scheduledAt`
- Status can be cancelled while PENDING
- Updates to SENT reminders return 409
- Deletion of SENT reminders rejected
- Non-admin cannot create, update, or delete reminders

### `admin-appointment-manage-flow.e2e.ts`
- Pagination and multi-filter queries (type, status)
- Admin status transitions: CONFIRMED, CANCELLED
- 403 for non-admin status changes
- Soft delete: `deletedAt` set, record excluded from list
- Admin creates consultants and service types, verifies public visibility

### `walkin-booking-flow.e2e.ts`
- Public location browsing with opening hours and map link
- Location search by name
- SHOWROOM booking requires valid `locationId` (400 if omitted)
- Location deactivation removes it from public listings
- 403 for non-admin location management

### `slot-conflict-flow.e2e.ts`
- Concurrent double-booking returns 409
- Slot re-opens after cancellation and accepts new booking
- Overlapping time slots rejected (both single and bulk)
- Deletion of booked slots rejected with 409
- Marking a booked slot unavailable rejected with 409

### `smoke.e2e.ts`
- Health endpoints: `/health`, `/health/live`, `/health/ready`
- All public endpoints respond 200
- All protected endpoints return 401 without token
- Unknown routes return 404
- Unsupported methods return 405

---

## Fixture Helpers

| Helper | Location | Purpose |
|---|---|---|
| `consultantFixtures.active()` | `tests/fixtures/consultants.fixture.ts` | Active consultant seed |
| `locationsFixture.raw(...)` | `tests/fixtures/locations.fixture.ts` | Showroom location seed |
| `servicesFixture.raw(...)` | `tests/fixtures/services.fixture.ts` | Service type seed |
| `availabilityFixtures.raw(...)` | `tests/fixtures/availability.fixture.ts` | Availability window seed |
| `timeSlotFixtures.rawWithDate(...)` | `tests/fixtures/time-slots.fixture.ts` | Dated time slot seed |
| `generateAdminToken()` | `src/tests-helpers/factories.ts` | JWT for admin role |
| `generateUserToken(...)` | `src/tests-helpers/factories.ts` | JWT for user role, optional `userId` |

---

## Notes

- All tests use **supertest** against the real Express app — no mocking.
- Database is cleaned in `globalSetup` before seeding, and wiped again in `globalTeardown`.
- Slots seeded in `globalSetup` are shared across flows; flows that consume slots fetch a fresh available one in their own `beforeAll`.
- `--runInBand` is mandatory — parallel execution will cause slot conflicts between test suites.