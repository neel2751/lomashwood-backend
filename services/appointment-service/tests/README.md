# Appointment Service — Test Suite

Tests for `lomash-wood-backend/services/appointment-service`. The suite is split into two layers: **integration** tests that verify each route handler in isolation against a real database, and **end-to-end** tests that walk complete user journeys through the running Express application.

---

## Directory Structure

```
tests/
├── integration/
│   ├── appointment.routes.test.ts
│   ├── availability.routes.test.ts
│   ├── booking.routes.test.ts
│   ├── calendar.routes.test.ts
│   ├── cancellation.routes.test.ts
│   ├── consultant.routes.test.ts
│   ├── health.routes.test.ts
│   ├── location.routes.test.ts
│   ├── reminder.routes.test.ts
│   ├── reschedule.routes.test.ts
│   ├── service-type.routes.test.ts
│   └── time-slot.routes.test.ts
├── e2e/
│   ├── global-setup.ts
│   ├── global-teardown.ts
│   ├── appointment-book-flow.e2e.ts
│   ├── appointment-cancel-flow.e2e.ts
│   ├── appointment-reschedule-flow.e2e.ts
│   ├── admin-appointment-manage-flow.e2e.ts
│   ├── consultant-availability-flow.e2e.ts
│   ├── calendar-sync-flow.e2e.ts
│   ├── reminder-notification-flow.e2e.ts
│   ├── walkin-booking-flow.e2e.ts
│   ├── slot-conflict-flow.e2e.ts
│   └── smoke.e2e.ts
└── fixtures/
    ├── appointments.fixture.ts
    ├── availability.fixture.ts
    ├── bookings.fixture.ts
    ├── consultants.fixture.ts
    ├── locations.fixture.ts
    ├── reminders.fixture.ts
    ├── services.fixture.ts
    └── time-slots.fixture.ts
```

---

## Prerequisites

| Requirement | Version / Notes |
|---|---|
| Node.js | ≥ 18 |
| PostgreSQL | Running; test DB must be created before first run |
| Redis | Running on a separate DB index from development |
| Prisma | Migrations applied via `npx prisma migrate deploy` |

---

## Environment Variables

Create a `.env.test` file at the service root:

```env
NODE_ENV=test
TEST_DATABASE_URL=postgresql://postgres:postgres@localhost:5432/lomash_appointment_test
TEST_REDIS_URL=redis://localhost:6379/1
JWT_SECRET=test-jwt-secret-key-minimum-32-chars
JWT_REFRESH_SECRET=test-refresh-secret-key-minimum-32-chars
PORT=4004
SMTP_HOST=localhost
SMTP_PORT=1025
EMAIL_FROM=noreply@lomashwood.test
```

---

## Running the Tests

### Integration tests

```bash
# All integration tests
npx jest --config jest.integration.config.ts

# Single file
npx jest --config jest.integration.config.ts --testPathPattern="booking.routes"

# Watch mode during development
npx jest --config jest.integration.config.ts --watch
```

### E2E tests

```bash
# Full E2E suite (must be serial)
npx jest --config jest.e2e.config.ts --runInBand

# Smoke tests only (fast CI gate)
npx jest --config jest.e2e.config.ts --testPathPattern="smoke.e2e" --runInBand

# Single flow
npx jest --config jest.e2e.config.ts --testPathPattern="appointment-book-flow" --runInBand

# Verbose output
npx jest --config jest.e2e.config.ts --runInBand --verbose
```

> **`--runInBand` is required for E2E tests.** All flows share a single database and must run serially to avoid slot conflicts and state collisions.

---

## Jest Configuration

### `jest.integration.config.ts`

```ts
import type { Config } from 'jest';

const config: Config = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  testMatch: ['**/tests/integration/**/*.test.ts'],
  testTimeout: 15000,
  setupFilesAfterFramework: ['<rootDir>/src/tests-helpers/setup.ts'],
};

export default config;
```

### `jest.e2e.config.ts`

```ts
import type { Config } from 'jest';

const config: Config = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  globalSetup: './tests/e2e/global-setup.ts',
  globalTeardown: './tests/e2e/global-teardown.ts',
  testMatch: ['**/tests/e2e/**/*.e2e.ts'],
  testTimeout: 30000,
  runInBand: true,
};

export default config;
```

---

## Integration Test Coverage

Each file tests a single router. Every describe block covers one HTTP method + path combination, asserting status codes, response shape, auth guards, validation errors, and business-rule rejections.

### `appointment.routes.test.ts`
- `POST /v1/appointments` — HOME_MEASUREMENT, ONLINE, SHOWROOM creation; 400 on missing fields; 401 without token; 409 on slot conflict; dual kitchen+bedroom booking
- `GET /v1/appointments` — admin pagination; 403 for non-admin; status and type filters
- `GET /v1/appointments/:id` — admin and owner access; 404 for unknown id
- `PATCH /v1/appointments/:id` — admin status update to CONFIRMED/CANCELLED; 403 for non-admin; 400 for invalid transition
- `DELETE /v1/appointments/:id` — admin soft delete; 403 for non-admin

### `availability.routes.test.ts`
- `POST /v1/availability` — weekday window creation; 400 for overlapping windows; 400 for invalid time range
- `GET /v1/availability` — admin list with `consultantId` filter; public endpoint access
- `PATCH /v1/availability/:id` — time window updates; validation
- `DELETE /v1/availability/:id` — admin-only removal

### `booking.routes.test.ts`
- `POST /v1/bookings` — customer details; `forKitchen` / `forBedroom` flags; 409 on slot conflict; 400 for missing category; email/phone validation
- `GET /v1/bookings` — admin pagination; `forKitchen` filter; `/my-bookings` scoped to authenticated user
- `GET /v1/bookings/:id` — admin and owner access
- `PATCH /v1/bookings/:id/status` — CONFIRMED and CANCELLED transitions with reason

### `calendar.routes.test.ts`
- `GET /v1/calendar` — `from`/`to` date range; public hides booked slots; admin `includeBooked` flag
- `GET /v1/calendar/sync-status` — `lastSyncedAt` + provider; admin-only
- `POST /v1/calendar/sync` — manual trigger; admin-only; 403 for non-admin
- `GET /v1/calendar/appointments/upcoming` — admin sees all; user sees own only

### `cancellation.routes.test.ts`
- `POST /v1/cancellations` — reason required; 409 for already-cancelled; 403 for non-owner; slot freed after cancellation
- `GET /v1/cancellations` — admin pagination; date range filter
- `GET /v1/cancellations/:id` — admin and owner access

### `consultant.routes.test.ts`
- `POST /v1/consultants` — creation; 409 on duplicate email; field validation
- `GET /v1/consultants` — pagination; `isActive` filter; name search; public endpoint
- `GET /v1/consultants/:id` — includes availability; public access
- `PATCH /v1/consultants/:id` — name and `isActive` updates
- `DELETE /v1/consultants/:id` — soft delete; admin-only

### `health.routes.test.ts`
- `GET /health` — status, uptime, timestamp
- `GET /health/live` — liveness probe
- `GET /health/ready` — database and Redis readiness
- `GET /health/detailed` — memory, version, environment; admin-only
- `GET /health/metrics` — Prometheus text format
- Unknown routes → 404; unsupported methods → 405

### `location.routes.test.ts`
- `POST /v1/locations` — showroom creation; postcode, phone, email validation
- `GET /v1/locations` — pagination; name search; `isActive` filter; public endpoint
- `GET /v1/locations/:id` — `openingHours` and `mapLink` included; public access
- `PATCH /v1/locations/:id` — address, opening hours, `isActive` updates
- `DELETE /v1/locations/:id` — soft delete; admin-only

### `reminder.routes.test.ts`
- `POST /v1/reminders` — EMAIL and SMS channels; future `scheduledAt` required; 400 for past time
- `GET /v1/reminders` — admin pagination; `bookingId`, channel, status filters
- `GET /v1/reminders/:id` — admin access
- `PATCH /v1/reminders/:id` — update `scheduledAt`; cancel PENDING; 409 if already SENT
- `DELETE /v1/reminders/:id` — 409 if SENT

### `reschedule.routes.test.ts`
- `POST /v1/reschedules` — old slot freed; new slot booked; reason required; 409 for cancelled appointment; 403 for non-owner
- `GET /v1/reschedules` — admin pagination; `bookingId` filter
- `GET /v1/reschedules/:id` — admin and owner access

### `service-type.routes.test.ts`
- `POST /v1/service-types` — HOME_MEASUREMENT, ONLINE, SHOWROOM enum; 409 on duplicate name
- `GET /v1/service-types` — type and `isActive` filters; public endpoint
- `GET /v1/service-types/:id` — `durationMinutes` included; public access
- `PATCH /v1/service-types/:id` — title, description, duration, `isActive`; 400 for negative duration
- `DELETE /v1/service-types/:id` — soft delete; 409 if active bookings exist

### `time-slot.routes.test.ts`
- `POST /v1/time-slots` — overlap detection; past date rejection; consultant validation
- `POST /v1/time-slots/bulk` — bulk creation
- `GET /v1/time-slots` — pagination; `consultantId` filter; date range; public `/available` endpoint
- `PATCH /v1/time-slots/:id` — mark unavailable; 409 if already booked
- `DELETE /v1/time-slots/:id` — 409 if booked

---

## E2E Test Coverage

### `appointment-book-flow.e2e.ts`
- Full booking journey: type selection → slot browsing → booking → slot locked
- 409 on repeat booking of same slot
- Kitchen-only vs kitchen+bedroom dual-category booking
- Dual-booking triggers internal notification
- Admin filtered list shows dual-category appointments

### `appointment-cancel-flow.e2e.ts`
- Slot freed after cancellation
- 400 when reason is omitted
- 409 on double-cancellation
- 403 for ownership mismatch
- Cancellation visible in admin list

### `appointment-reschedule-flow.e2e.ts`
- Old slot freed; new slot locked on reschedule
- Appointment `timeSlotId` updated in DB
- 409 on reschedule of cancelled appointment
- 403 when another user attempts to reschedule

### `admin-appointment-manage-flow.e2e.ts`
- Pagination and multi-filter queries (type, status)
- Admin status transitions: CONFIRMED, CANCELLED
- 403 for non-admin status changes
- Soft delete: `deletedAt` set; record excluded from list
- Admin creates consultants and service types; verifies public visibility

### `consultant-availability-flow.e2e.ts`
- Admin creates weekday and weekend availability windows
- 400 for overlapping windows
- Public calendar reflects new availability
- Deactivating consultant hides them from public listings

### `calendar-sync-flow.e2e.ts`
- Public calendar hides booked slots
- Admin `includeBooked` exposes all slots
- 400 for missing or inverted date range
- Manual sync updates `lastSyncedAt`
- 403 for non-admin sync trigger
- User upcoming list scoped to own bookings; admin sees all

### `reminder-notification-flow.e2e.ts`
- EMAIL and SMS reminders with future `scheduledAt`
- 400 for past `scheduledAt`
- Cancel while PENDING succeeds
- Updates to SENT reminders return 409
- Deletion of SENT reminders rejected
- Non-admin cannot create, update, or delete reminders

### `walkin-booking-flow.e2e.ts`
- Public location browsing with opening hours and map link
- Location search by name
- SHOWROOM booking requires valid `locationId`; 400 if omitted
- Location deactivation removes it from public listings
- 403 for non-admin location management

### `slot-conflict-flow.e2e.ts`
- Concurrent double-booking returns 409
- Slot re-opens after cancellation and accepts new booking
- Overlapping time slots rejected (single and bulk)
- Deletion of booked slot rejected with 409
- Marking booked slot unavailable rejected with 409

### `smoke.e2e.ts`
- Health endpoints: `/health`, `/health/live`, `/health/ready`
- All public endpoints respond 200
- All protected endpoints return 401 without token
- Unknown routes return 404; unsupported methods return 405

---

## Global E2E Lifecycle

| File | Purpose |
|---|---|
| `global-setup.ts` | Runs migrations, truncates all tables, seeds users / service types / locations / consultants / availability / time slots, flushes Redis, exports globals |
| `global-teardown.ts` | Truncates all tables in dependency order, flushes Redis, disconnects Prisma and Redis clients |

Seeded globals available to all e2e files via `globalThis`:

| Global | Value |
|---|---|
| `__E2E_BASE_URL__` | `http://localhost:4004` |
| `__E2E_ADMIN_EMAIL__` | `admin@lomashwood.test` |
| `__E2E_ADMIN_PASSWORD__` | `password` |
| `__E2E_CUSTOMER_EMAIL__` | `customer@lomashwood.test` |
| `__E2E_CUSTOMER_PASSWORD__` | `password` |
| `__E2E_CUSTOMER2_EMAIL__` | `customer2@lomashwood.test` |
| `__E2E_CUSTOMER2_PASSWORD__` | `password` |

---

## Fixture Helpers

| Helper | File | Purpose |
|---|---|---|
| `appointmentFixtures` | `fixtures/appointments.fixture.ts` | Create/raw appointment payloads |
| `availabilityFixtures` | `fixtures/availability.fixture.ts` | Weekday availability windows |
| `bookingsFixture` | `fixtures/bookings.fixture.ts` | Booking payloads with category flags |
| `consultantFixtures` | `fixtures/consultants.fixture.ts` | Active and inactive consultant seeds |
| `locationsFixture` | `fixtures/locations.fixture.ts` | Showroom location with opening hours |
| `remindersFixture` | `fixtures/reminders.fixture.ts` | EMAIL/SMS reminder seeds |
| `servicesFixture` | `fixtures/services.fixture.ts` | Service type seeds per appointment type |
| `timeSlotFixtures` | `fixtures/time-slots.fixture.ts` | Available and booked slot seeds |
| `generateAdminToken()` | `src/tests-helpers/factories.ts` | Signed JWT for ADMIN role |
| `generateUserToken(userId?)` | `src/tests-helpers/factories.ts` | Signed JWT for CUSTOMER role |

---

## Notes

- All integration and E2E tests run against a real database and Redis — no mocking.
- Each integration test file cleans up its own records in `afterAll`.
- The E2E database is fully truncated before seeding in `globalSetup` and wiped again in `globalTeardown`.
- Time slots seeded in `globalSetup` are shared across E2E flows; each flow fetches a fresh available slot in its own `beforeAll` to avoid cross-suite conflicts.
- `--runInBand` is mandatory for E2E — parallel execution will cause slot conflicts between suites.