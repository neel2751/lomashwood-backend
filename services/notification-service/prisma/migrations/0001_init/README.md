# Migration: 0001_init

## Overview

| Property    | Value                              |
|-------------|------------------------------------|
| Service     | `notification-service`             |
| Migration   | `0001_init`                        |
| Database    | PostgreSQL                         |
| ORM         | Prisma                             |
| Applied     | Initial schema creation            |
| Author      | Lomash Wood Engineering            |

This is the **initial baseline migration** for the Notification Service database. It creates all enums, tables, indexes, and foreign key constraints from scratch against a clean PostgreSQL database.

---

## What This Migration Creates

### Enums (14)

| Enum                    | Values                                                                 |
|-------------------------|------------------------------------------------------------------------|
| `NotificationChannel`   | `EMAIL`, `SMS`, `PUSH`                                                 |
| `NotificationStatus`    | `PENDING`, `QUEUED`, `PROCESSING`, `SENT`, `DELIVERED`, `FAILED`, `CANCELLED`, `BOUNCED`, `UNSUBSCRIBED` |
| `NotificationPriority`  | `LOW`, `NORMAL`, `HIGH`, `CRITICAL`                                    |
| `TemplateType`          | `EMAIL`, `SMS`, `PUSH`                                                 |
| `TemplateCategory`      | 33 values — covers all SRS-defined notification flows (see below)      |
| `TemplateStatus`        | `DRAFT`, `ACTIVE`, `ARCHIVED`                                          |
| `ProviderType`          | `SMTP`, `AWS_SES`, `TWILIO`, `MSG91`, `FIREBASE_FCM`, `WEB_PUSH`      |
| `ProviderStatus`        | `ACTIVE`, `INACTIVE`, `DEGRADED`, `FAILED`                             |
| `CampaignStatus`        | `DRAFT`, `SCHEDULED`, `RUNNING`, `PAUSED`, `COMPLETED`, `CANCELLED`, `FAILED` |
| `CampaignAudienceType`  | `ALL_USERS`, `SEGMENT`, `CUSTOM_LIST`                                  |
| `DeliveryReportStatus`  | `ACCEPTED`, `QUEUED`, `SENDING`, `SENT`, `DELIVERED`, `FAILED`, `BOUNCED`, `COMPLAINED`, `UNSUBSCRIBED`, `REJECTED` |
| `RetryPolicyStrategy`   | `EXPONENTIAL_BACKOFF`, `LINEAR_BACKOFF`, `FIXED_DELAY`, `IMMEDIATE`   |
| `SubscriptionStatus`    | `SUBSCRIBED`, `UNSUBSCRIBED`, `PENDING`, `BOUNCED`                     |
| `WebhookEventType`      | `DELIVERED`, `BOUNCED`, `COMPLAINED`, `UNSUBSCRIBED`, `OPENED`, `CLICKED`, `FAILED` |

### Tables (12)

| Table                          | Purpose                                                              |
|--------------------------------|----------------------------------------------------------------------|
| `notification_templates`       | Email/SMS/Push templates with Handlebars merge tag schema            |
| `notification_providers`       | Provider config, health tracking, and per-channel rate limits        |
| `campaigns`                    | Broadcast campaigns with denormalised engagement stats               |
| `notifications`                | Core dispatch record — covers all channels and lifecycle states      |
| `delivery_reports`             | Provider-driven delivery callbacks and email engagement metrics      |
| `webhook_events`               | Raw inbound webhook payloads from providers (email, SMS, push)       |
| `campaign_templates`           | Join table linking campaigns to templates with variable overrides    |
| `notification_subscriptions`   | Per-user/channel/address subscription records with push device data  |
| `notification_preferences`     | Per-category opt-in/out with quiet hours and timezone support        |
| `retry_policies`               | Named retry strategies with configurable backoff parameters          |
| `notification_logs`            | Append-only audit trail for every notification state transition      |
| `notification_rate_limits`     | Sliding window buckets for per-recipient throttling                  |

### Indexes

**Standard indexes:** 52 indexes created across all tables covering all FK columns, enum filter columns, timestamp columns used in range queries, and unique constraint columns.

**Composite indexes (8):**

| Index | Purpose |
|-------|---------|
| `notifications(channel, status, priority)` | Queue worker poll — fetch next batch by channel and priority |
| `notifications(status, next_retry_at) WHERE status = 'FAILED'` | Partial index for retry job — only failed rows with a scheduled retry |
| `notifications(status, scheduled_at) WHERE status = 'PENDING'` | Partial index for scheduler — only pending rows with a future send time |
| `webhook_events(processed, created_at) WHERE processed = FALSE` | Partial index for webhook processor — only unprocessed events |
| `notification_providers(channel, status, priority)` | Provider failover resolution — select best active provider per channel |
| `notification_rate_limits(window_end, channel)` | Rate limit window cleanup job |
| `notification_subscriptions(user_id, channel, status)` | Preference check at dispatch time |
| `notifications(campaign_id, status) WHERE campaign_id IS NOT NULL` | Campaign stats aggregation |

### Foreign Keys (11)

| Constraint | From | To | On Delete |
|-----------|------|----|-----------|
| `notifications_template_id_fkey` | `notifications.template_id` | `notification_templates.id` | `SET NULL` |
| `notifications_provider_id_fkey` | `notifications.provider_id` | `notification_providers.id` | `SET NULL` |
| `notifications_campaign_id_fkey` | `notifications.campaign_id` | `campaigns.id` | `SET NULL` |
| `delivery_reports_notification_id_fkey` | `delivery_reports.notification_id` | `notifications.id` | `CASCADE` |
| `delivery_reports_provider_id_fkey` | `delivery_reports.provider_id` | `notification_providers.id` | `SET NULL` |
| `webhook_events_notification_id_fkey` | `webhook_events.notification_id` | `notifications.id` | `SET NULL` |
| `campaign_templates_campaign_id_fkey` | `campaign_templates.campaign_id` | `campaigns.id` | `CASCADE` |
| `campaign_templates_template_id_fkey` | `campaign_templates.template_id` | `notification_templates.id` | `RESTRICT` |
| `notification_preferences_subscription_id_fkey` | `notification_preferences.subscription_id` | `notification_subscriptions.id` | `SET NULL` |
| `notification_logs_notification_id_fkey` | `notification_logs.notification_id` | `notifications.id` | `CASCADE` |

---

## SRS Traceability

Every `TemplateCategory` enum value maps directly to an SRS functional requirement:

| SRS Requirement | Template Categories |
|----------------|---------------------|
| FR5.5 — Appointment acknowledgement email | `APPOINTMENT_CONFIRMATION` |
| FR5.6 — Internal mail if both Kitchen & Bedroom booked | `APPOINTMENT_INTERNAL_ALERT` |
| FR8.1 / FR8.2 — Brochure request storage + admin alert | `BROCHURE_REQUEST_CONFIRMATION`, `BROCHURE_INTERNAL_ALERT`, `BROCHURE_DELIVERY` |
| FR8.4 — Business enquiry internal mail notification | `BUSINESS_ENQUIRY_CONFIRMATION`, `BUSINESS_ENQUIRY_INTERNAL_ALERT` |
| FR9.6 — Newsletter table management | `NEWSLETTER_WELCOME`, `NEWSLETTER_UNSUBSCRIBE_CONFIRMATION`, `NEWSLETTER_CAMPAIGN` |
| FR7.4 — Contact Us page | `CONTACT_ACKNOWLEDGEMENT`, `CONTACT_INTERNAL_ALERT` |
| FR10.1 — Client-side dashboard (order/booking history) | `ORDER_CONFIRMATION`, `ORDER_UPDATED`, `ORDER_CANCELLED`, `PAYMENT_RECEIPT` |

---

## Design Decisions

**FK delete behaviours are intentional:**
- `CASCADE` — child records with no standalone meaning (`delivery_reports`, `notification_logs`, `campaign_templates`) are deleted with their parent
- `SET NULL` — soft references (`template_id`, `provider_id`, `campaign_id` on `notifications`) are nulled so the notification record is preserved for audit purposes even if the referenced entity is deleted
- `RESTRICT` — `campaign_templates → notification_templates` prevents deleting a template that is actively used by a campaign

**FKs are declared after all tables:** All `ALTER TABLE ... ADD CONSTRAINT` statements are placed at the end of the migration to eliminate table creation ordering requirements and simplify future schema reorganisation.

**Partial indexes over full indexes:** Three partial indexes (`FAILED` notifications, `PENDING` scheduled notifications, unprocessed webhook events) dramatically reduce index size and write amplification since these filtered subsets are the hot query paths for background jobs.

**`JSONB` over `TEXT` for structured data:** `config`, `metadata`, `variables`, `push_data`, `provider_raw`, `audience_filter`, and `payload` columns use `JSONB` rather than `TEXT` to enable native PostgreSQL JSON operators and future GIN indexing if needed.

**`DOUBLE PRECISION` for `multiplier`:** The retry backoff multiplier uses `DOUBLE PRECISION` (PostgreSQL native) rather than `DECIMAL` to match Prisma's `Float` type mapping exactly and avoid precision mismatch on read.

**`idempotency_key` unique index:** Enforced at the database level (not just application level) to guarantee exactly-once delivery semantics even under concurrent queue workers.

---

## Running This Migration

```bash
# Apply via Prisma (recommended)
cd services/notification-service
npx prisma migrate deploy

# Apply manually (if needed)
psql $DATABASE_URL -f prisma/migrations/0001_init/migration.sql
```

## Rolling Back

Prisma does not support automatic rollback. To revert this migration manually:

```sql
-- Drop all tables (order respects FK dependencies)
DROP TABLE IF EXISTS "notification_rate_limits"     CASCADE;
DROP TABLE IF EXISTS "notification_logs"            CASCADE;
DROP TABLE IF EXISTS "retry_policies"               CASCADE;
DROP TABLE IF EXISTS "notification_preferences"     CASCADE;
DROP TABLE IF EXISTS "notification_subscriptions"   CASCADE;
DROP TABLE IF EXISTS "campaign_templates"           CASCADE;
DROP TABLE IF EXISTS "webhook_events"               CASCADE;
DROP TABLE IF EXISTS "delivery_reports"             CASCADE;
DROP TABLE IF EXISTS "notifications"               CASCADE;
DROP TABLE IF EXISTS "campaigns"                   CASCADE;
DROP TABLE IF EXISTS "notification_providers"      CASCADE;
DROP TABLE IF EXISTS "notification_templates"      CASCADE;

-- Drop all enums
DROP TYPE IF EXISTS "WebhookEventType";
DROP TYPE IF EXISTS "SubscriptionStatus";
DROP TYPE IF EXISTS "RetryPolicyStrategy";
DROP TYPE IF EXISTS "DeliveryReportStatus";
DROP TYPE IF EXISTS "CampaignAudienceType";
DROP TYPE IF EXISTS "CampaignStatus";
DROP TYPE IF EXISTS "ProviderStatus";
DROP TYPE IF EXISTS "ProviderType";
DROP TYPE IF EXISTS "TemplateStatus";
DROP TYPE IF EXISTS "TemplateCategory";
DROP TYPE IF EXISTS "TemplateType";
DROP TYPE IF EXISTS "NotificationPriority";
DROP TYPE IF EXISTS "NotificationStatus";
DROP TYPE IF EXISTS "NotificationChannel";
```

> ⚠️ Running the rollback script on a database containing live data will result in permanent data loss. Only execute against a non-production environment.