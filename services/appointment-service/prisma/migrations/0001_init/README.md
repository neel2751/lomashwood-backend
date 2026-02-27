# Migration: 0001_init

## Overview

This is the initial database migration for the **Appointment Service** of the Lomash Wood platform — a Kitchen & Bedroom Design & Consultation system.

This migration establishes the complete foundational schema required by the appointment-service, including consultants, availability, bookings, and reminders.

---

## Migration Details

| Property        | Value                          |
|-----------------|-------------------------------|
| Migration Name  | `0001_init`                   |
| Service         | `appointment-service`         |
| Database        | PostgreSQL                    |
| ORM             | Prisma                        |
| Applied On      | Initial project bootstrap     |
| Status          | ✅ Baseline migration          |

---

## Schema Entities Created

### 1. `Consultant`
Represents a Lomash Wood design consultant who can accept appointments.

| Column           | Type        | Notes                          |
|------------------|-------------|-------------------------------|
| `id`             | UUID        | Primary key                   |
| `name`           | String      | Full name                     |
| `email`          | String      | Unique, used for notifications|
| `phone`          | String?     | Optional contact number       |
| `specialization` | Enum        | `KITCHEN`, `BEDROOM`, `BOTH`  |
| `isActive`       | Boolean     | Soft enable/disable           |
| `createdAt`      | DateTime    | Auto-set on creation          |
| `updatedAt`      | DateTime    | Auto-updated on change        |
| `deletedAt`      | DateTime?   | Soft delete support           |

---

### 2. `AvailabilitySlot`
Defines time windows during which a consultant is available.

| Column          | Type      | Notes                                      |
|-----------------|-----------|--------------------------------------------|
| `id`            | UUID      | Primary key                                |
| `consultantId`  | UUID      | FK → `Consultant`                          |
| `dayOfWeek`     | Int       | 0 = Sunday … 6 = Saturday                 |
| `startTime`     | String    | e.g. `"09:00"`                             |
| `endTime`       | String    | e.g. `"17:00"`                             |
| `slotDuration`  | Int       | Duration in minutes (e.g. 60)              |
| `isActive`      | Boolean   | Whether slot is currently offered          |
| `createdAt`     | DateTime  |                                            |
| `updatedAt`     | DateTime  |                                            |

---

### 3. `Booking`
Core entity representing a customer appointment.

| Column            | Type      | Notes                                                   |
|-------------------|-----------|---------------------------------------------------------|
| `id`              | UUID      | Primary key                                             |
| `consultantId`    | UUID?     | FK → `Consultant` (nullable for unassigned)             |
| `customerId`      | UUID?     | FK to auth-service user (cross-service reference)       |
| `customerName`    | String    | Captured at time of booking                             |
| `customerEmail`   | String    | For confirmation emails                                 |
| `customerPhone`   | String    |                                                         |
| `postcode`        | String    |                                                         |
| `address`         | String    |                                                         |
| `appointmentType` | Enum      | `HOME_MEASUREMENT`, `ONLINE`, `SHOWROOM`                |
| `forKitchen`      | Boolean   | Whether booking includes kitchen consultation           |
| `forBedroom`      | Boolean   | Whether booking includes bedroom consultation           |
| `scheduledAt`     | DateTime  | The confirmed date and time of the appointment          |
| `status`          | Enum      | `PENDING`, `CONFIRMED`, `CANCELLED`, `COMPLETED`, `NO_SHOW` |
| `notes`           | String?   | Internal notes                                          |
| `showroomId`      | UUID?     | FK → `Showroom` (only when type = SHOWROOM)             |
| `cancelledAt`     | DateTime? | Set when booking is cancelled                           |
| `cancelReason`    | String?   | Reason for cancellation                                 |
| `createdAt`       | DateTime  |                                                         |
| `updatedAt`       | DateTime  |                                                         |
| `deletedAt`       | DateTime? | Soft delete                                             |

**Indexes:** `customerEmail`, `scheduledAt`, `status`, `consultantId`, `showroomId`

---

### 4. `Showroom`
Lomash Wood showroom locations (referenced by bookings of type `SHOWROOM`).

| Column         | Type      | Notes                       |
|----------------|-----------|-----------------------------|
| `id`           | UUID      | Primary key                 |
| `name`         | String    | e.g. "Clapham Showroom"     |
| `address`      | String    |                             |
| `imageUrl`     | String?   |                             |
| `email`        | String    |                             |
| `phone`        | String    |                             |
| `openingHours` | String    | Human-readable string       |
| `mapLink`      | String?   | Google Maps URL             |
| `isActive`     | Boolean   |                             |
| `createdAt`    | DateTime  |                             |
| `updatedAt`    | DateTime  |                             |
| `deletedAt`    | DateTime? | Soft delete                 |

---

### 5. `Reminder`
Tracks reminder notifications sent (or scheduled to be sent) for bookings.

| Column        | Type      | Notes                                          |
|---------------|-----------|------------------------------------------------|
| `id`          | UUID      | Primary key                                    |
| `bookingId`   | UUID      | FK → `Booking`                                 |
| `channel`     | Enum      | `EMAIL`, `SMS`, `PUSH`                         |
| `scheduledAt` | DateTime  | When the reminder is due to fire               |
| `sentAt`      | DateTime? | Null until actually sent                       |
| `status`      | Enum      | `PENDING`, `SENT`, `FAILED`                    |
| `attempt`     | Int       | Retry count                                    |
| `payload`     | Json      | Template variables used                        |
| `createdAt`   | DateTime  |                                                |
| `updatedAt`   | DateTime  |                                                |

---

## Enums Introduced

```sql
-- Consultant specialization
CREATE TYPE "ConsultantSpecialization" AS ENUM ('KITCHEN', 'BEDROOM', 'BOTH');

-- Appointment type (matches FR5.1)
CREATE TYPE "AppointmentType" AS ENUM ('HOME_MEASUREMENT', 'ONLINE', 'SHOWROOM');

-- Booking lifecycle status
CREATE TYPE "BookingStatus" AS ENUM (
  'PENDING',
  'CONFIRMED',
  'CANCELLED',
  'COMPLETED',
  'NO_SHOW'
);

-- Reminder delivery channel
CREATE TYPE "ReminderChannel" AS ENUM ('EMAIL', 'SMS', 'PUSH');

-- Reminder delivery status
CREATE TYPE "ReminderStatus" AS ENUM ('PENDING', 'SENT', 'FAILED');
```

---

## Relations Map

```
Consultant ──< AvailabilitySlot
Consultant ──< Booking
Showroom   ──< Booking
Booking    ──< Reminder
```

---

## Business Logic Notes

- **FR5.1** — `AppointmentType` enum maps directly to the three booking types: Home Measurement, Online, and Showroom.
- **FR5.2** — `forKitchen` and `forBedroom` booleans on `Booking` capture dual-category selections. When both are `true`, the notification service dispatches emails to both the kitchen and bedroom internal teams (FR5.6).
- **FR5.5** — On `status` transitioning to `CONFIRMED`, the booking event fires `booking-created.event.ts`, which triggers the notification service to send a confirmation email.
- **FR5.7** — All records in this schema are visible in the Admin Appointment Table via the booking repository.
- **FR6.1 / FR6.2** — `Showroom` entity backs the Find a Showroom feature, including detail pages.
- Soft deletes (`deletedAt`) are implemented on `Consultant`, `Booking`, and `Showroom` per the auditing field requirements in the master prompt.

---

## How to Apply

This migration is managed by Prisma Migrate. It is applied automatically during service bootstrap or via:

```bash
# From within the appointment-service directory
pnpm prisma migrate deploy
```

To apply during local development:

```bash
pnpm prisma migrate dev --name 0001_init
```

---

## How to Roll Back

Prisma does not support automatic rollback. To revert this migration in a development environment:

```bash
# Drop the database and re-run from scratch
pnpm prisma migrate reset
```

For production rollback, refer to the runbook at:
`docs/runbooks/deployment-rollback.md`

---

## Seed Data

After applying this migration, seed initial data (showrooms, consultant records, default availability) using:

```bash
pnpm prisma db seed
```

Seed file: `prisma/seed.ts`

---

## Related Files

| File | Purpose |
|------|---------|
| `prisma/schema.prisma` | Full Prisma schema definition |
| `prisma/seed.ts` | Seed data for development/staging |
| `prisma/migrations/migration_lock.toml` | Prisma migration lock file |
| `src/infrastructure/db/prisma.client.ts` | Singleton Prisma client |
| `src/infrastructure/db/transaction.helper.ts` | Transaction utilities |
| `src/app/bookings/booking.repository.ts` | Booking data access layer |
| `src/app/availability/availability.repository.ts` | Slot data access layer |
| `src/app/consultants/consultant.repository.ts` | Consultant data access |
| `src/app/reminders/reminder.repository.ts` | Reminder data access |

---

## Notes for Developers

- All UUID primary keys use `gen_random_uuid()` (requires `pgcrypto` extension — enabled in `init.sql`).
- `updatedAt` fields are auto-managed by Prisma's `@updatedAt` decorator; do not set them manually.
- Never hard-delete `Booking` or `Consultant` records in production; always use soft delete (`deletedAt`).
- The `showroomId` FK on `Booking` must be populated when `appointmentType = SHOWROOM` and must be `null` otherwise — this is enforced at the service layer in `booking.service.ts`.