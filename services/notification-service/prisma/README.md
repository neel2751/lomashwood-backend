# Notification Service – Prisma

## Overview

This directory contains everything Prisma needs to manage the `notification-service` database — the schema definition, migration history, seed data, and the migration lock file.

| File / Directory | Purpose |
|-----------------|---------|
| `schema.prisma` | Single source of truth for all models, enums, relations, and indexes |
| `seed.ts` | Seeds default providers, retry policies, and notification templates |
| `migrations/` | Append-only migration history applied by `prisma migrate deploy` |
| `migrations/migration_lock.toml` | Locks the datasource provider to `postgresql` |

---

## Schema Summary

The schema defines **12 models** and **14 enums** for a fully self-contained notification dispatch system supporting Email, SMS, and Push channels.

### Models

```
notification_templates       – Handlebars templates for all 3 channels
notification_providers       – Provider config, health tracking, rate limits
campaigns                    – Broadcast campaigns with engagement stats
notifications                – Core dispatch record (all channels)
delivery_reports             – Provider webhook callbacks & engagement metrics
webhook_events               – Raw inbound provider payloads
campaign_templates           – Campaign ↔ template join table
notification_subscriptions   – Per-user/channel subscription records
notification_preferences     – Per-category opt-in/out with quiet hours
retry_policies               – Named backoff strategies per channel
notification_logs            – Append-only audit trail
notification_rate_limits     – Sliding window throttle buckets
```

### Key Design Decisions

**Soft deletes** — `notification_templates`, `notification_providers`, and `campaigns` carry a `deleted_at` column. Hard deletes are avoided to preserve audit trails and prevent orphaned FK references in historical `notifications`.

**Idempotency at DB level** — `notifications.idempotency_key` has a database-level unique constraint (not just application-level) to guarantee exactly-once delivery under concurrent BullMQ workers.

**JSONB for structured blobs** — `config`, `metadata`, `variables`, `push_data`, `provider_raw`, `audience_filter`, and `payload` use `JSONB` over `TEXT` to enable native PostgreSQL JSON operators and future GIN indexing.

**Denormalised campaign stats** — `campaigns` carries eight integer counters (`total_sent`, `total_delivered`, `total_opened`, etc.) updated incrementally to support fast dashboard reads without aggregation queries across millions of `notifications` rows.

**FK delete behaviours**

| Behaviour | Applied To |
|-----------|-----------|
| `CASCADE` | `delivery_reports`, `notification_logs`, `campaign_templates` — child records with no standalone meaning |
| `SET NULL` | `template_id`, `provider_id`, `campaign_id` on `notifications` — soft references; notification record is preserved for audit |
| `RESTRICT` | `campaign_templates → notification_templates` — prevents deleting a template in active use by a campaign |

---

## Prisma Client

The generated client is consumed exclusively through the singleton at:

```
src/infrastructure/db/prisma.client.ts
```

Never instantiate `PrismaClient` directly in application code. Always import the shared singleton to avoid connection pool exhaustion.

---

## Quick Reference Commands

```bash
# From: services/notification-service/

# Generate Prisma client after schema changes
npx prisma generate

# Create and apply a new migration (dev only)
npx prisma migrate dev --name your_description

# Apply pending migrations (staging / production / CI)
npx prisma migrate deploy

# Check migration status
npx prisma migrate status

# Open Prisma Studio (visual DB browser — dev only)
npx prisma studio

# Reset dev database and re-seed (destructive — dev only)
npx prisma migrate reset --force

# Run seed independently
npx ts-node --require tsconfig-paths/register prisma/seed.ts
```

---

## Seed Data

The seed (`seed.ts`) populates three categories of reference data required for the service to function on first boot:

### Retry Policies (5)

| Name | Channel | Strategy | Attempts |
|------|---------|----------|----------|
| `email-exponential-default` | EMAIL | Exponential backoff | 4 |
| `email-critical-fast` | EMAIL | Linear backoff | 6 |
| `sms-exponential-default` | SMS | Exponential backoff | 3 |
| `sms-immediate` | SMS | Immediate | 2 |
| `push-exponential-default` | PUSH | Exponential backoff | 3 |

### Providers (6)

| Name | Channel | Type | Default |
|------|---------|------|---------|
| `nodemailer-smtp` | EMAIL | SMTP | ✅ (dev) |
| `aws-ses` | EMAIL | AWS SES | ❌ (prod) |
| `twilio-sms` | SMS | Twilio | ✅ |
| `msg91-sms` | SMS | MSG91 | ❌ (fallback) |
| `firebase-fcm` | PUSH | Firebase FCM | ✅ |
| `web-push-vapid` | PUSH | Web Push | ❌ (fallback) |

### Notification Templates (17)

| Slug | Channel | SRS Ref |
|------|---------|---------|
| `account-welcome-email` | EMAIL | — |
| `account-password-reset-email` | EMAIL | — |
| `appointment-confirmation-email` | EMAIL | FR5.5 |
| `appointment-internal-alert-email` | EMAIL | FR5.6 |
| `appointment-reminder-email` | EMAIL | — |
| `order-confirmation-email` | EMAIL | FR10.1 |
| `payment-receipt-email` | EMAIL | FR10.1 |
| `brochure-request-confirmation-email` | EMAIL | FR8.1 / FR8.2 |
| `brochure-internal-alert-email` | EMAIL | FR8.2 |
| `business-enquiry-internal-alert-email` | EMAIL | FR8.4 |
| `newsletter-welcome-email` | EMAIL | FR9.6 |
| `contact-acknowledgement-email` | EMAIL | FR7.4 |
| `appointment-confirmation-sms` | SMS | FR5.5 |
| `appointment-reminder-sms` | SMS | — |
| `order-confirmation-sms` | SMS | FR10.1 |
| `payment-receipt-sms` | SMS | FR10.1 |
| `appointment-reminder-push` | PUSH | — |
| `order-confirmation-push` | PUSH | FR10.1 |
| `loyalty-points-earned-push` | PUSH | — |

All seed operations use `upsert` — the seed script is safe to re-run at any time without creating duplicates.

---

## Environment Variables

The following variables must be set before running any Prisma command:

| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | ✅ | Full PostgreSQL connection string |

See `.env.example` at the service root for the full connection string format including pool configuration.

---

## Adding a New Migration

1. Update `schema.prisma` with the desired model changes
2. Run `npx prisma migrate dev --name your_description`
3. Review the generated SQL in `migrations/{SEQUENCE}_your_description/migration.sql`
4. Add a `README.md` inside the new migration folder documenting what changed and why
5. Commit both the SQL file and the README — never commit one without the other

Refer to `migrations/README.md` for the full migration conventions and rollback strategy.

---

## Related Documentation

| Path | Description |
|------|-------------|
| `docs/architecture/domain-model.md` | Full domain model across all services |
| `docs/runbooks/database-failure.md` | Database incident response runbook |
| `docs/ADRs/002-postgresql.md` | ADR: Why PostgreSQL was chosen |
| `docs/ADRs/006-prisma.md` | ADR: Why Prisma was chosen as the ORM |