-- =============================================================================
-- LOMASH WOOD – NOTIFICATION SERVICE
-- Migration: 0001_init
-- Database:  PostgreSQL
-- =============================================================================

-- -----------------------------------------------------------------------------
-- ENUMS
-- -----------------------------------------------------------------------------

CREATE TYPE "NotificationChannel" AS ENUM (
  'EMAIL',
  'SMS',
  'PUSH'
);

CREATE TYPE "NotificationStatus" AS ENUM (
  'PENDING',
  'QUEUED',
  'PROCESSING',
  'SENT',
  'DELIVERED',
  'FAILED',
  'CANCELLED',
  'BOUNCED',
  'UNSUBSCRIBED'
);

CREATE TYPE "NotificationPriority" AS ENUM (
  'LOW',
  'NORMAL',
  'HIGH',
  'CRITICAL'
);

CREATE TYPE "TemplateType" AS ENUM (
  'EMAIL',
  'SMS',
  'PUSH'
);

CREATE TYPE "TemplateCategory" AS ENUM (
  'ACCOUNT_WELCOME',
  'ACCOUNT_PASSWORD_RESET',
  'ACCOUNT_EMAIL_VERIFICATION',
  'ACCOUNT_PASSWORD_CHANGED',
  'ACCOUNT_DEACTIVATED',
  'APPOINTMENT_CONFIRMATION',
  'APPOINTMENT_REMINDER',
  'APPOINTMENT_CANCELLATION',
  'APPOINTMENT_RESCHEDULED',
  'APPOINTMENT_INTERNAL_ALERT',
  'ORDER_CONFIRMATION',
  'ORDER_UPDATED',
  'ORDER_CANCELLED',
  'PAYMENT_RECEIPT',
  'PAYMENT_FAILED',
  'REFUND_ISSUED',
  'BROCHURE_REQUEST_CONFIRMATION',
  'BROCHURE_DELIVERY',
  'BROCHURE_INTERNAL_ALERT',
  'BUSINESS_ENQUIRY_CONFIRMATION',
  'BUSINESS_ENQUIRY_INTERNAL_ALERT',
  'NEWSLETTER_WELCOME',
  'NEWSLETTER_UNSUBSCRIBE_CONFIRMATION',
  'NEWSLETTER_CAMPAIGN',
  'CONTACT_ACKNOWLEDGEMENT',
  'CONTACT_INTERNAL_ALERT',
  'REVIEW_REQUEST',
  'REVIEW_PUBLISHED',
  'LOYALTY_POINTS_EARNED',
  'LOYALTY_POINTS_EXPIRING',
  'LOYALTY_TIER_UPGRADED',
  'SYSTEM_ALERT',
  'CUSTOM'
);

CREATE TYPE "TemplateStatus" AS ENUM (
  'DRAFT',
  'ACTIVE',
  'ARCHIVED'
);

CREATE TYPE "ProviderType" AS ENUM (
  'SMTP',
  'AWS_SES',
  'TWILIO',
  'MSG91',
  'FIREBASE_FCM',
  'WEB_PUSH'
);

CREATE TYPE "ProviderStatus" AS ENUM (
  'ACTIVE',
  'INACTIVE',
  'DEGRADED',
  'FAILED'
);

CREATE TYPE "CampaignStatus" AS ENUM (
  'DRAFT',
  'SCHEDULED',
  'RUNNING',
  'PAUSED',
  'COMPLETED',
  'CANCELLED',
  'FAILED'
);

CREATE TYPE "CampaignAudienceType" AS ENUM (
  'ALL_USERS',
  'SEGMENT',
  'CUSTOM_LIST'
);

CREATE TYPE "DeliveryReportStatus" AS ENUM (
  'ACCEPTED',
  'QUEUED',
  'SENDING',
  'SENT',
  'DELIVERED',
  'FAILED',
  'BOUNCED',
  'COMPLAINED',
  'UNSUBSCRIBED',
  'REJECTED'
);

CREATE TYPE "RetryPolicyStrategy" AS ENUM (
  'EXPONENTIAL_BACKOFF',
  'LINEAR_BACKOFF',
  'FIXED_DELAY',
  'IMMEDIATE'
);

CREATE TYPE "SubscriptionStatus" AS ENUM (
  'SUBSCRIBED',
  'UNSUBSCRIBED',
  'PENDING',
  'BOUNCED'
);

CREATE TYPE "WebhookEventType" AS ENUM (
  'DELIVERED',
  'BOUNCED',
  'COMPLAINED',
  'UNSUBSCRIBED',
  'OPENED',
  'CLICKED',
  'FAILED'
);

-- -----------------------------------------------------------------------------
-- TABLE: notification_templates
-- -----------------------------------------------------------------------------

CREATE TABLE "notification_templates" (
  "id"           TEXT        NOT NULL,
  "name"         TEXT        NOT NULL,
  "slug"         TEXT        NOT NULL,
  "description"  TEXT,
  "category"     "TemplateCategory"  NOT NULL,
  "type"         "TemplateType"      NOT NULL,
  "status"       "TemplateStatus"    NOT NULL DEFAULT 'DRAFT',

  -- Email fields
  "subject"      TEXT,
  "preheader"    TEXT,
  "html_body"    TEXT,
  "text_body"    TEXT,

  -- SMS fields
  "sms_body"     TEXT,
  "sms_from"     TEXT,

  -- Push fields
  "push_title"   TEXT,
  "push_body"    TEXT,
  "push_icon"    TEXT,
  "push_image"   TEXT,
  "push_data"    JSONB,

  -- Merge tag schema
  "variables"    JSONB,

  -- Rendering engine
  "engine"       TEXT        NOT NULL DEFAULT 'handlebars',

  -- Versioning
  "version"      INTEGER     NOT NULL DEFAULT 1,
  "published_at" TIMESTAMP(3),
  "archived_at"  TIMESTAMP(3),

  -- Audit
  "created_by"   TEXT,
  "updated_by"   TEXT,
  "created_at"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at"   TIMESTAMP(3) NOT NULL,
  "deleted_at"   TIMESTAMP(3),

  CONSTRAINT "notification_templates_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "notification_templates_name_key"
  ON "notification_templates"("name");

CREATE UNIQUE INDEX "notification_templates_slug_key"
  ON "notification_templates"("slug");

CREATE INDEX "notification_templates_category_idx"
  ON "notification_templates"("category");

CREATE INDEX "notification_templates_type_idx"
  ON "notification_templates"("type");

CREATE INDEX "notification_templates_status_idx"
  ON "notification_templates"("status");

CREATE INDEX "notification_templates_slug_idx"
  ON "notification_templates"("slug");

CREATE INDEX "notification_templates_deleted_at_idx"
  ON "notification_templates"("deleted_at");

-- -----------------------------------------------------------------------------
-- TABLE: notification_providers
-- -----------------------------------------------------------------------------

CREATE TABLE "notification_providers" (
  "id"                    TEXT            NOT NULL,
  "name"                  TEXT            NOT NULL,
  "type"                  "ProviderType"  NOT NULL,
  "channel"               "NotificationChannel" NOT NULL,
  "status"                "ProviderStatus" NOT NULL DEFAULT 'ACTIVE',
  "is_default"            BOOLEAN         NOT NULL DEFAULT FALSE,
  "priority"              INTEGER         NOT NULL DEFAULT 1,

  -- Encrypted config blob
  "config"                JSONB           NOT NULL,

  -- Rate limiting
  "rate_limit_per_second" INTEGER,
  "rate_limit_per_minute" INTEGER,
  "rate_limit_per_hour"   INTEGER,
  "rate_limit_per_day"    INTEGER,

  -- Health tracking
  "last_health_check_at"  TIMESTAMP(3),
  "last_health_status"    BOOLEAN,
  "consecutive_failures"  INTEGER         NOT NULL DEFAULT 0,
  "failover_at"           TIMESTAMP(3),

  -- Audit
  "created_at"            TIMESTAMP(3)    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at"            TIMESTAMP(3)    NOT NULL,
  "deleted_at"            TIMESTAMP(3),

  CONSTRAINT "notification_providers_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "notification_providers_name_key"
  ON "notification_providers"("name");

CREATE INDEX "notification_providers_channel_idx"
  ON "notification_providers"("channel");

CREATE INDEX "notification_providers_status_idx"
  ON "notification_providers"("status");

CREATE INDEX "notification_providers_is_default_idx"
  ON "notification_providers"("is_default");

CREATE INDEX "notification_providers_deleted_at_idx"
  ON "notification_providers"("deleted_at");

-- -----------------------------------------------------------------------------
-- TABLE: campaigns
-- (defined before notifications to satisfy FK ordering)
-- -----------------------------------------------------------------------------

CREATE TABLE "campaigns" (
  "id"                  TEXT                    NOT NULL,
  "name"                TEXT                    NOT NULL,
  "description"         TEXT,
  "channel"             "NotificationChannel"   NOT NULL,
  "status"              "CampaignStatus"        NOT NULL DEFAULT 'DRAFT',
  "audience_type"       "CampaignAudienceType"  NOT NULL DEFAULT 'ALL_USERS',
  "audience_filter"     JSONB,
  "audience_list"       JSONB,

  -- Scheduling
  "scheduled_at"        TIMESTAMP(3),
  "started_at"          TIMESTAMP(3),
  "completed_at"        TIMESTAMP(3),
  "cancelled_at"        TIMESTAMP(3),

  -- Denormalised stats
  "total_recipients"    INTEGER                 NOT NULL DEFAULT 0,
  "total_sent"          INTEGER                 NOT NULL DEFAULT 0,
  "total_delivered"     INTEGER                 NOT NULL DEFAULT 0,
  "total_failed"        INTEGER                 NOT NULL DEFAULT 0,
  "total_opened"        INTEGER                 NOT NULL DEFAULT 0,
  "total_clicked"       INTEGER                 NOT NULL DEFAULT 0,
  "total_bounced"       INTEGER                 NOT NULL DEFAULT 0,
  "total_unsubscribed"  INTEGER                 NOT NULL DEFAULT 0,

  -- Audit
  "created_by"          TEXT,
  "updated_by"          TEXT,
  "created_at"          TIMESTAMP(3)            NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at"          TIMESTAMP(3)            NOT NULL,
  "deleted_at"          TIMESTAMP(3),

  CONSTRAINT "campaigns_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "campaigns_channel_idx"
  ON "campaigns"("channel");

CREATE INDEX "campaigns_status_idx"
  ON "campaigns"("status");

CREATE INDEX "campaigns_scheduled_at_idx"
  ON "campaigns"("scheduled_at");

CREATE INDEX "campaigns_deleted_at_idx"
  ON "campaigns"("deleted_at");

-- -----------------------------------------------------------------------------
-- TABLE: notifications
-- -----------------------------------------------------------------------------

CREATE TABLE "notifications" (
  "id"                   TEXT                    NOT NULL,
  "channel"              "NotificationChannel"   NOT NULL,
  "status"               "NotificationStatus"    NOT NULL DEFAULT 'PENDING',
  "priority"             "NotificationPriority"  NOT NULL DEFAULT 'NORMAL',

  -- Recipient
  "recipient_id"         TEXT,
  "recipient_email"      TEXT,
  "recipient_phone"      TEXT,
  "recipient_device"     TEXT,

  -- Sender overrides
  "from_name"            TEXT,
  "from_address"         TEXT,
  "reply_to"             TEXT,

  -- Content
  "template_id"          TEXT,
  "subject"              TEXT,
  "body"                 TEXT,
  "html_body"            TEXT,
  "metadata"             JSONB,
  "attachments"          JSONB,

  -- Provider
  "provider_id"          TEXT,
  "provider_message_id"  TEXT,
  "provider_response"    JSONB,

  -- Queue tracking
  "job_id"               TEXT,
  "queue_name"           TEXT,
  "scheduled_at"         TIMESTAMP(3),
  "processed_at"         TIMESTAMP(3),
  "sent_at"              TIMESTAMP(3),
  "delivered_at"         TIMESTAMP(3),
  "failed_at"            TIMESTAMP(3),

  -- Retry state machine
  "retry_count"          INTEGER                 NOT NULL DEFAULT 0,
  "max_retries"          INTEGER                 NOT NULL DEFAULT 3,
  "next_retry_at"        TIMESTAMP(3),
  "last_error"           TEXT,
  "last_error_at"        TIMESTAMP(3),

  -- Grouping
  "campaign_id"          TEXT,
  "batch_id"             TEXT,

  -- Idempotency
  "idempotency_key"      TEXT,

  -- Audit
  "created_at"           TIMESTAMP(3)            NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at"           TIMESTAMP(3)            NOT NULL,
  "deleted_at"           TIMESTAMP(3),

  CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "notifications_idempotency_key_key"
  ON "notifications"("idempotency_key");

CREATE INDEX "notifications_channel_idx"
  ON "notifications"("channel");

CREATE INDEX "notifications_status_idx"
  ON "notifications"("status");

CREATE INDEX "notifications_priority_idx"
  ON "notifications"("priority");

CREATE INDEX "notifications_recipient_id_idx"
  ON "notifications"("recipient_id");

CREATE INDEX "notifications_recipient_email_idx"
  ON "notifications"("recipient_email");

CREATE INDEX "notifications_recipient_phone_idx"
  ON "notifications"("recipient_phone");

CREATE INDEX "notifications_template_id_idx"
  ON "notifications"("template_id");

CREATE INDEX "notifications_provider_id_idx"
  ON "notifications"("provider_id");

CREATE INDEX "notifications_campaign_id_idx"
  ON "notifications"("campaign_id");

CREATE INDEX "notifications_batch_id_idx"
  ON "notifications"("batch_id");

CREATE INDEX "notifications_scheduled_at_idx"
  ON "notifications"("scheduled_at");

CREATE INDEX "notifications_sent_at_idx"
  ON "notifications"("sent_at");

CREATE INDEX "notifications_idempotency_key_idx"
  ON "notifications"("idempotency_key");

CREATE INDEX "notifications_job_id_idx"
  ON "notifications"("job_id");

CREATE INDEX "notifications_deleted_at_idx"
  ON "notifications"("deleted_at");

CREATE INDEX "notifications_created_at_idx"
  ON "notifications"("created_at");

-- -----------------------------------------------------------------------------
-- TABLE: delivery_reports
-- -----------------------------------------------------------------------------

CREATE TABLE "delivery_reports" (
  "id"                   TEXT                    NOT NULL,
  "notification_id"      TEXT                    NOT NULL,
  "provider_id"          TEXT,
  "status"               "DeliveryReportStatus"  NOT NULL,
  "provider_message_id"  TEXT,
  "provider_timestamp"   TIMESTAMP(3),
  "provider_raw"         JSONB,

  -- Email engagement
  "opened_at"            TIMESTAMP(3),
  "clicked_at"           TIMESTAMP(3),
  "bounced_at"           TIMESTAMP(3),
  "bounce_type"          TEXT,
  "bounce_reason"        TEXT,
  "complained_at"        TIMESTAMP(3),
  "unsubscribed_at"      TIMESTAMP(3),

  -- SMS billing
  "segments"             INTEGER,
  "units"                INTEGER,

  "created_at"           TIMESTAMP(3)            NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at"           TIMESTAMP(3)            NOT NULL,

  CONSTRAINT "delivery_reports_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "delivery_reports_notification_id_idx"
  ON "delivery_reports"("notification_id");

CREATE INDEX "delivery_reports_provider_id_idx"
  ON "delivery_reports"("provider_id");

CREATE INDEX "delivery_reports_status_idx"
  ON "delivery_reports"("status");

CREATE INDEX "delivery_reports_provider_message_id_idx"
  ON "delivery_reports"("provider_message_id");

CREATE INDEX "delivery_reports_created_at_idx"
  ON "delivery_reports"("created_at");

-- -----------------------------------------------------------------------------
-- TABLE: webhook_events
-- -----------------------------------------------------------------------------

CREATE TABLE "webhook_events" (
  "id"              TEXT                 NOT NULL,
  "notification_id" TEXT,
  "provider"        TEXT                 NOT NULL,
  "event_type"      "WebhookEventType"   NOT NULL,
  "payload"         JSONB                NOT NULL,
  "processed"       BOOLEAN              NOT NULL DEFAULT FALSE,
  "processed_at"    TIMESTAMP(3),
  "error"           TEXT,
  "created_at"      TIMESTAMP(3)         NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at"      TIMESTAMP(3)         NOT NULL,

  CONSTRAINT "webhook_events_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "webhook_events_notification_id_idx"
  ON "webhook_events"("notification_id");

CREATE INDEX "webhook_events_provider_idx"
  ON "webhook_events"("provider");

CREATE INDEX "webhook_events_event_type_idx"
  ON "webhook_events"("event_type");

CREATE INDEX "webhook_events_processed_idx"
  ON "webhook_events"("processed");

CREATE INDEX "webhook_events_created_at_idx"
  ON "webhook_events"("created_at");

-- -----------------------------------------------------------------------------
-- TABLE: campaign_templates
-- -----------------------------------------------------------------------------

CREATE TABLE "campaign_templates" (
  "id"          TEXT         NOT NULL,
  "campaign_id" TEXT         NOT NULL,
  "template_id" TEXT         NOT NULL,
  "sort_order"  INTEGER      NOT NULL DEFAULT 0,
  "variables"   JSONB,
  "created_at"  TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "campaign_templates_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "campaign_templates_campaign_id_template_id_key"
  ON "campaign_templates"("campaign_id", "template_id");

CREATE INDEX "campaign_templates_campaign_id_idx"
  ON "campaign_templates"("campaign_id");

CREATE INDEX "campaign_templates_template_id_idx"
  ON "campaign_templates"("template_id");

-- -----------------------------------------------------------------------------
-- TABLE: notification_subscriptions
-- -----------------------------------------------------------------------------

CREATE TABLE "notification_subscriptions" (
  "id"             TEXT                    NOT NULL,
  "user_id"        TEXT                    NOT NULL,
  "channel"        "NotificationChannel"   NOT NULL,
  "status"         "SubscriptionStatus"    NOT NULL DEFAULT 'SUBSCRIBED',
  "address"        TEXT                    NOT NULL,

  -- Push device metadata
  "device_id"      TEXT,
  "device_type"    TEXT,
  "push_token"     TEXT,

  "confirmed_at"    TIMESTAMP(3),
  "unsubscribed_at" TIMESTAMP(3),
  "bounced_at"      TIMESTAMP(3),

  "created_at"     TIMESTAMP(3)            NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at"     TIMESTAMP(3)            NOT NULL,

  CONSTRAINT "notification_subscriptions_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "notification_subscriptions_user_id_channel_address_key"
  ON "notification_subscriptions"("user_id", "channel", "address");

CREATE INDEX "notification_subscriptions_user_id_idx"
  ON "notification_subscriptions"("user_id");

CREATE INDEX "notification_subscriptions_channel_idx"
  ON "notification_subscriptions"("channel");

CREATE INDEX "notification_subscriptions_status_idx"
  ON "notification_subscriptions"("status");

CREATE INDEX "notification_subscriptions_address_idx"
  ON "notification_subscriptions"("address");

-- -----------------------------------------------------------------------------
-- TABLE: notification_preferences
-- -----------------------------------------------------------------------------

CREATE TABLE "notification_preferences" (
  "id"                   TEXT                    NOT NULL,
  "user_id"              TEXT                    NOT NULL,
  "subscription_id"      TEXT,
  "category"             "TemplateCategory"      NOT NULL,
  "channel"              "NotificationChannel"   NOT NULL,
  "enabled"              BOOLEAN                 NOT NULL DEFAULT TRUE,

  -- Quiet hours
  "quiet_hours_enabled"  BOOLEAN                 NOT NULL DEFAULT FALSE,
  "quiet_hours_start"    TEXT,
  "quiet_hours_end"      TEXT,
  "timezone"             TEXT                    DEFAULT 'Europe/London',

  "created_at"           TIMESTAMP(3)            NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at"           TIMESTAMP(3)            NOT NULL,

  CONSTRAINT "notification_preferences_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "notification_preferences_user_id_category_channel_key"
  ON "notification_preferences"("user_id", "category", "channel");

CREATE INDEX "notification_preferences_user_id_idx"
  ON "notification_preferences"("user_id");

CREATE INDEX "notification_preferences_category_idx"
  ON "notification_preferences"("category");

CREATE INDEX "notification_preferences_channel_idx"
  ON "notification_preferences"("channel");

-- -----------------------------------------------------------------------------
-- TABLE: retry_policies
-- -----------------------------------------------------------------------------

CREATE TABLE "retry_policies" (
  "id"               TEXT                    NOT NULL,
  "name"             TEXT                    NOT NULL,
  "channel"          "NotificationChannel"   NOT NULL,
  "strategy"         "RetryPolicyStrategy"   NOT NULL DEFAULT 'EXPONENTIAL_BACKOFF',
  "max_attempts"     INTEGER                 NOT NULL DEFAULT 3,
  "initial_delay_ms" INTEGER                 NOT NULL DEFAULT 3000,
  "max_delay_ms"     INTEGER                 NOT NULL DEFAULT 300000,
  "multiplier"       DOUBLE PRECISION        NOT NULL DEFAULT 2.0,
  "is_default"       BOOLEAN                 NOT NULL DEFAULT FALSE,
  "created_at"       TIMESTAMP(3)            NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at"       TIMESTAMP(3)            NOT NULL,

  CONSTRAINT "retry_policies_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "retry_policies_name_key"
  ON "retry_policies"("name");

CREATE INDEX "retry_policies_channel_idx"
  ON "retry_policies"("channel");

CREATE INDEX "retry_policies_is_default_idx"
  ON "retry_policies"("is_default");

-- -----------------------------------------------------------------------------
-- TABLE: notification_logs
-- -----------------------------------------------------------------------------

CREATE TABLE "notification_logs" (
  "id"              TEXT         NOT NULL,
  "notification_id" TEXT         NOT NULL,
  "event"           TEXT         NOT NULL,
  "status"          TEXT         NOT NULL,
  "message"         TEXT,
  "metadata"        JSONB,
  "occurred_at"     TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "notification_logs_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "notification_logs_notification_id_idx"
  ON "notification_logs"("notification_id");

CREATE INDEX "notification_logs_event_idx"
  ON "notification_logs"("event");

CREATE INDEX "notification_logs_occurred_at_idx"
  ON "notification_logs"("occurred_at");

-- -----------------------------------------------------------------------------
-- TABLE: notification_rate_limits
-- -----------------------------------------------------------------------------

CREATE TABLE "notification_rate_limits" (
  "id"           TEXT                    NOT NULL,
  "key"          TEXT                    NOT NULL,
  "channel"      "NotificationChannel"   NOT NULL,
  "count"        INTEGER                 NOT NULL DEFAULT 0,
  "window_start" TIMESTAMP(3)            NOT NULL,
  "window_end"   TIMESTAMP(3)            NOT NULL,
  "created_at"   TIMESTAMP(3)            NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at"   TIMESTAMP(3)            NOT NULL,

  CONSTRAINT "notification_rate_limits_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "notification_rate_limits_key_key"
  ON "notification_rate_limits"("key");

CREATE INDEX "notification_rate_limits_key_idx"
  ON "notification_rate_limits"("key");

CREATE INDEX "notification_rate_limits_channel_idx"
  ON "notification_rate_limits"("channel");

CREATE INDEX "notification_rate_limits_window_end_idx"
  ON "notification_rate_limits"("window_end");

-- -----------------------------------------------------------------------------
-- FOREIGN KEY CONSTRAINTS
-- (applied after all tables are created to avoid ordering issues)
-- -----------------------------------------------------------------------------

-- notifications → notification_templates
ALTER TABLE "notifications"
  ADD CONSTRAINT "notifications_template_id_fkey"
  FOREIGN KEY ("template_id")
  REFERENCES "notification_templates"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

-- notifications → notification_providers
ALTER TABLE "notifications"
  ADD CONSTRAINT "notifications_provider_id_fkey"
  FOREIGN KEY ("provider_id")
  REFERENCES "notification_providers"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

-- notifications → campaigns
ALTER TABLE "notifications"
  ADD CONSTRAINT "notifications_campaign_id_fkey"
  FOREIGN KEY ("campaign_id")
  REFERENCES "campaigns"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

-- delivery_reports → notifications
ALTER TABLE "delivery_reports"
  ADD CONSTRAINT "delivery_reports_notification_id_fkey"
  FOREIGN KEY ("notification_id")
  REFERENCES "notifications"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

-- delivery_reports → notification_providers
ALTER TABLE "delivery_reports"
  ADD CONSTRAINT "delivery_reports_provider_id_fkey"
  FOREIGN KEY ("provider_id")
  REFERENCES "notification_providers"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

-- webhook_events → notifications
ALTER TABLE "webhook_events"
  ADD CONSTRAINT "webhook_events_notification_id_fkey"
  FOREIGN KEY ("notification_id")
  REFERENCES "notifications"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

-- campaign_templates → campaigns
ALTER TABLE "campaign_templates"
  ADD CONSTRAINT "campaign_templates_campaign_id_fkey"
  FOREIGN KEY ("campaign_id")
  REFERENCES "campaigns"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

-- campaign_templates → notification_templates
ALTER TABLE "campaign_templates"
  ADD CONSTRAINT "campaign_templates_template_id_fkey"
  FOREIGN KEY ("template_id")
  REFERENCES "notification_templates"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE;

-- notification_preferences → notification_subscriptions
ALTER TABLE "notification_preferences"
  ADD CONSTRAINT "notification_preferences_subscription_id_fkey"
  FOREIGN KEY ("subscription_id")
  REFERENCES "notification_subscriptions"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

-- notification_logs → notifications
ALTER TABLE "notification_logs"
  ADD CONSTRAINT "notification_logs_notification_id_fkey"
  FOREIGN KEY ("notification_id")
  REFERENCES "notifications"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

-- -----------------------------------------------------------------------------
-- COMPOSITE INDEXES (query optimisation)
-- -----------------------------------------------------------------------------

-- Queue worker: pick up pending/queued notifications by channel + priority
CREATE INDEX "notifications_channel_status_priority_idx"
  ON "notifications"("channel", "status", "priority");

-- Retry job: find failed notifications due for retry
CREATE INDEX "notifications_status_next_retry_at_idx"
  ON "notifications"("status", "next_retry_at")
  WHERE "status" = 'FAILED' AND "next_retry_at" IS NOT NULL;

-- Scheduled notifications dispatcher
CREATE INDEX "notifications_status_scheduled_at_idx"
  ON "notifications"("status", "scheduled_at")
  WHERE "status" = 'PENDING' AND "scheduled_at" IS NOT NULL;

-- Webhook processing: find unprocessed webhook events
CREATE INDEX "webhook_events_processed_created_at_idx"
  ON "webhook_events"("processed", "created_at")
  WHERE "processed" = FALSE;

-- Provider health check: find degraded/failed providers per channel
CREATE INDEX "notification_providers_channel_status_priority_idx"
  ON "notification_providers"("channel", "status", "priority");

-- Rate limit window expiry cleanup job
CREATE INDEX "notification_rate_limits_window_end_channel_idx"
  ON "notification_rate_limits"("window_end", "channel");

-- Subscription lookup by user + channel for preference checks
CREATE INDEX "notification_subscriptions_user_id_channel_status_idx"
  ON "notification_subscriptions"("user_id", "channel", "status");

-- Delivery report engagement queries (opened/clicked analytics)
CREATE INDEX "delivery_reports_notification_id_status_idx"
  ON "delivery_reports"("notification_id", "status");

-- Campaign stats rollup
CREATE INDEX "notifications_campaign_id_status_idx"
  ON "notifications"("campaign_id", "status")
  WHERE "campaign_id" IS NOT NULL;