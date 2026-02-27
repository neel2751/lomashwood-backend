CREATE TYPE "EventType" AS ENUM (
  'PAGE_VIEW',
  'PRODUCT_VIEW',
  'PRODUCT_FILTER',
  'PRODUCT_SORT',
  'ADD_TO_WISHLIST',
  'REMOVE_FROM_WISHLIST',
  'SEARCH',
  'APPOINTMENT_START',
  'APPOINTMENT_COMPLETE',
  'APPOINTMENT_ABANDON',
  'BROCHURE_REQUEST',
  'BUSINESS_INQUIRY',
  'CONTACT_FORM',
  'NEWSLETTER_SIGNUP',
  'SHOWROOM_VIEW',
  'BLOG_VIEW',
  'FINANCE_VIEW',
  'MEDIA_WALL_VIEW',
  'CTA_CLICK',
  'FORM_SUBMIT',
  'FORM_ABANDON',
  'SESSION_START',
  'SESSION_END',
  'CUSTOM'
);

CREATE TYPE "DeviceType" AS ENUM (
  'DESKTOP',
  'TABLET',
  'MOBILE',
  'BOT',
  'UNKNOWN'
);

CREATE TYPE "FunnelStatus" AS ENUM (
  'ACTIVE',
  'PAUSED',
  'ARCHIVED'
);

CREATE TYPE "ExportStatus" AS ENUM (
  'PENDING',
  'PROCESSING',
  'COMPLETED',
  'FAILED',
  'EXPIRED'
);

CREATE TYPE "ExportFormat" AS ENUM (
  'CSV',
  'JSON',
  'XLSX'
);

CREATE TYPE "ReportType" AS ENUM (
  'TRAFFIC',
  'CONVERSIONS',
  'APPOINTMENTS',
  'PRODUCTS',
  'FUNNELS',
  'COHORTS',
  'CUSTOM'
);

CREATE TYPE "ReportStatus" AS ENUM (
  'PENDING',
  'PROCESSING',
  'COMPLETED',
  'FAILED'
);

CREATE TYPE "DashboardType" AS ENUM (
  'OVERVIEW',
  'MARKETING',
  'SALES',
  'OPERATIONS',
  'CUSTOM'
);

CREATE TYPE "MetricAggregation" AS ENUM (
  'SUM',
  'AVG',
  'COUNT',
  'MIN',
  'MAX',
  'UNIQUE'
);

CREATE TYPE "MetricPeriod" AS ENUM (
  'HOURLY',
  'DAILY',
  'WEEKLY',
  'MONTHLY',
  'YEARLY'
);

CREATE TABLE "analytics_sessions" (
  "id"           TEXT          NOT NULL,
  "visitorId"    TEXT          NOT NULL,
  "userId"       TEXT,
  "startedAt"    TIMESTAMP(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "endedAt"      TIMESTAMP(3),
  "duration"     INTEGER,
  "pageViews"    INTEGER       NOT NULL DEFAULT 0,
  "deviceType"   "DeviceType"  NOT NULL DEFAULT 'UNKNOWN',
  "browser"      TEXT,
  "os"           TEXT,
  "country"      TEXT,
  "region"       TEXT,
  "city"         TEXT,
  "ipHash"       TEXT,
  "referrer"     TEXT,
  "landingPage"  TEXT,
  "exitPage"     TEXT,
  "utmSource"    TEXT,
  "utmMedium"    TEXT,
  "utmCampaign"  TEXT,
  "bounced"      BOOLEAN       NOT NULL DEFAULT false,
  "converted"    BOOLEAN       NOT NULL DEFAULT false,
  "properties"   JSONB         NOT NULL DEFAULT '{}',
  "createdAt"    TIMESTAMP(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"    TIMESTAMP(3)  NOT NULL,

  CONSTRAINT "analytics_sessions_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "analytics_events" (
  "id"          TEXT          NOT NULL,
  "sessionId"   TEXT          NOT NULL,
  "visitorId"   TEXT          NOT NULL,
  "userId"      TEXT,
  "eventType"   "EventType"   NOT NULL,
  "eventName"   TEXT          NOT NULL,
  "page"        TEXT,
  "referrer"    TEXT,
  "utmSource"   TEXT,
  "utmMedium"   TEXT,
  "utmCampaign" TEXT,
  "utmContent"  TEXT,
  "utmTerm"     TEXT,
  "deviceType"  "DeviceType"  NOT NULL DEFAULT 'UNKNOWN',
  "browser"     TEXT,
  "os"          TEXT,
  "country"     TEXT,
  "region"      TEXT,
  "city"        TEXT,
  "ipHash"      TEXT,
  "properties"  JSONB         NOT NULL DEFAULT '{}',
  "duration"    INTEGER,
  "createdAt"   TIMESTAMP(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "analytics_events_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "page_views" (
  "id"          TEXT          NOT NULL,
  "sessionId"   TEXT          NOT NULL,
  "visitorId"   TEXT          NOT NULL,
  "userId"      TEXT,
  "page"        TEXT          NOT NULL,
  "title"       TEXT,
  "referrer"    TEXT,
  "deviceType"  "DeviceType"  NOT NULL DEFAULT 'UNKNOWN',
  "timeOnPage"  INTEGER,
  "scrollDepth" INTEGER,
  "country"     TEXT,
  "createdAt"   TIMESTAMP(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "page_views_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "conversion_events" (
  "id"              TEXT          NOT NULL,
  "sessionId"       TEXT          NOT NULL,
  "visitorId"       TEXT          NOT NULL,
  "userId"          TEXT,
  "conversionType"  TEXT          NOT NULL,
  "value"           DECIMAL(10,2),
  "currency"        TEXT          DEFAULT 'GBP',
  "productId"       TEXT,
  "orderId"         TEXT,
  "appointmentId"   TEXT,
  "properties"      JSONB         NOT NULL DEFAULT '{}',
  "createdAt"       TIMESTAMP(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "conversion_events_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "funnels" (
  "id"          TEXT            NOT NULL,
  "name"        TEXT            NOT NULL,
  "description" TEXT,
  "status"      "FunnelStatus"  NOT NULL DEFAULT 'ACTIVE',
  "steps"       JSONB           NOT NULL,
  "createdBy"   TEXT            NOT NULL,
  "createdAt"   TIMESTAMP(3)    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"   TIMESTAMP(3)    NOT NULL,
  "deletedAt"   TIMESTAMP(3),

  CONSTRAINT "funnels_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "funnel_results" (
  "id"               TEXT          NOT NULL,
  "funnelId"         TEXT          NOT NULL,
  "periodStart"      TIMESTAMP(3)  NOT NULL,
  "periodEnd"        TIMESTAMP(3)  NOT NULL,
  "stepResults"      JSONB         NOT NULL,
  "totalEntries"     INTEGER       NOT NULL DEFAULT 0,
  "totalCompletions" INTEGER       NOT NULL DEFAULT 0,
  "conversionRate"   DECIMAL(5,2)  NOT NULL DEFAULT 0,
  "computedAt"       TIMESTAMP(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "funnel_results_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "dashboards" (
  "id"          TEXT              NOT NULL,
  "name"        TEXT              NOT NULL,
  "description" TEXT,
  "type"        "DashboardType"   NOT NULL DEFAULT 'CUSTOM',
  "config"      JSONB             NOT NULL,
  "isDefault"   BOOLEAN           NOT NULL DEFAULT false,
  "createdBy"   TEXT              NOT NULL,
  "createdAt"   TIMESTAMP(3)      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"   TIMESTAMP(3)      NOT NULL,
  "deletedAt"   TIMESTAMP(3),

  CONSTRAINT "dashboards_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "dashboard_widgets" (
  "id"          TEXT          NOT NULL,
  "dashboardId" TEXT          NOT NULL,
  "title"       TEXT          NOT NULL,
  "widgetType"  TEXT          NOT NULL,
  "metricKey"   TEXT,
  "config"      JSONB         NOT NULL DEFAULT '{}',
  "position"    JSONB         NOT NULL,
  "createdAt"   TIMESTAMP(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"   TIMESTAMP(3)  NOT NULL,

  CONSTRAINT "dashboard_widgets_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "metric_snapshots" (
  "id"          TEXT                  NOT NULL,
  "metricKey"   TEXT                  NOT NULL,
  "period"      "MetricPeriod"        NOT NULL,
  "periodStart" TIMESTAMP(3)          NOT NULL,
  "periodEnd"   TIMESTAMP(3)          NOT NULL,
  "value"       DECIMAL(20,4)         NOT NULL,
  "aggregation" "MetricAggregation"   NOT NULL DEFAULT 'SUM',
  "dimensions"  JSONB                 NOT NULL DEFAULT '{}',
  "computedAt"  TIMESTAMP(3)          NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "metric_snapshots_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "tracking_configs" (
  "id"          TEXT          NOT NULL,
  "key"         TEXT          NOT NULL,
  "name"        TEXT          NOT NULL,
  "description" TEXT,
  "enabled"     BOOLEAN       NOT NULL DEFAULT true,
  "config"      JSONB         NOT NULL DEFAULT '{}',
  "createdAt"   TIMESTAMP(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"   TIMESTAMP(3)  NOT NULL,

  CONSTRAINT "tracking_configs_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "reports" (
  "id"          TEXT            NOT NULL,
  "name"        TEXT            NOT NULL,
  "type"        "ReportType"    NOT NULL,
  "status"      "ReportStatus"  NOT NULL DEFAULT 'PENDING',
  "parameters"  JSONB           NOT NULL DEFAULT '{}',
  "result"      JSONB,
  "error"       TEXT,
  "requestedBy" TEXT            NOT NULL,
  "startedAt"   TIMESTAMP(3),
  "completedAt" TIMESTAMP(3),
  "createdAt"   TIMESTAMP(3)    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"   TIMESTAMP(3)    NOT NULL,

  CONSTRAINT "reports_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "exports" (
  "id"          TEXT            NOT NULL,
  "reportId"    TEXT,
  "name"        TEXT            NOT NULL,
  "format"      "ExportFormat"  NOT NULL,
  "status"      "ExportStatus"  NOT NULL DEFAULT 'PENDING',
  "filePath"    TEXT,
  "fileSize"    BIGINT,
  "rowCount"    INTEGER,
  "parameters"  JSONB           NOT NULL DEFAULT '{}',
  "error"       TEXT,
  "requestedBy" TEXT            NOT NULL,
  "expiresAt"   TIMESTAMP(3),
  "startedAt"   TIMESTAMP(3),
  "completedAt" TIMESTAMP(3),
  "createdAt"   TIMESTAMP(3)    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"   TIMESTAMP(3)    NOT NULL,

  CONSTRAINT "exports_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "audit_logs" (
  "id"         TEXT          NOT NULL,
  "actorId"    TEXT          NOT NULL,
  "actorType"  TEXT          NOT NULL DEFAULT 'user',
  "action"     TEXT          NOT NULL,
  "resource"   TEXT          NOT NULL,
  "resourceId" TEXT,
  "metadata"   JSONB         NOT NULL DEFAULT '{}',
  "ipAddress"  TEXT,
  "userAgent"  TEXT,
  "createdAt"  TIMESTAMP(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "analytics_events"
  ADD CONSTRAINT "analytics_events_sessionId_fkey"
  FOREIGN KEY ("sessionId") REFERENCES "analytics_sessions"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "funnel_results"
  ADD CONSTRAINT "funnel_results_funnelId_fkey"
  FOREIGN KEY ("funnelId") REFERENCES "funnels"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "dashboard_widgets"
  ADD CONSTRAINT "dashboard_widgets_dashboardId_fkey"
  FOREIGN KEY ("dashboardId") REFERENCES "dashboards"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "exports"
  ADD CONSTRAINT "exports_reportId_fkey"
  FOREIGN KEY ("reportId") REFERENCES "reports"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

CREATE UNIQUE INDEX "tracking_configs_key_key" ON "tracking_configs"("key");

CREATE UNIQUE INDEX "metric_snapshots_metricKey_period_periodStart_periodEnd_key"
  ON "metric_snapshots"("metricKey", "period", "periodStart", "periodEnd");

CREATE INDEX "analytics_sessions_visitorId_idx"     ON "analytics_sessions"("visitorId");
CREATE INDEX "analytics_sessions_userId_idx"         ON "analytics_sessions"("userId");
CREATE INDEX "analytics_sessions_startedAt_idx"      ON "analytics_sessions"("startedAt");
CREATE INDEX "analytics_sessions_country_idx"        ON "analytics_sessions"("country");
CREATE INDEX "analytics_sessions_utm_idx"            ON "analytics_sessions"("utmSource", "utmMedium", "utmCampaign");

CREATE INDEX "analytics_events_sessionId_idx"        ON "analytics_events"("sessionId");
CREATE INDEX "analytics_events_visitorId_idx"        ON "analytics_events"("visitorId");
CREATE INDEX "analytics_events_userId_idx"           ON "analytics_events"("userId");
CREATE INDEX "analytics_events_eventType_idx"        ON "analytics_events"("eventType");
CREATE INDEX "analytics_events_createdAt_idx"        ON "analytics_events"("createdAt");
CREATE INDEX "analytics_events_page_idx"             ON "analytics_events"("page");
CREATE INDEX "analytics_events_utm_idx"              ON "analytics_events"("utmSource", "utmMedium", "utmCampaign");

CREATE INDEX "page_views_sessionId_idx"              ON "page_views"("sessionId");
CREATE INDEX "page_views_visitorId_idx"              ON "page_views"("visitorId");
CREATE INDEX "page_views_page_idx"                   ON "page_views"("page");
CREATE INDEX "page_views_createdAt_idx"              ON "page_views"("createdAt");

CREATE INDEX "conversion_events_sessionId_idx"       ON "conversion_events"("sessionId");
CREATE INDEX "conversion_events_visitorId_idx"       ON "conversion_events"("visitorId");
CREATE INDEX "conversion_events_conversionType_idx"  ON "conversion_events"("conversionType");
CREATE INDEX "conversion_events_createdAt_idx"       ON "conversion_events"("createdAt");

CREATE INDEX "funnels_status_idx"                    ON "funnels"("status");
CREATE INDEX "funnels_createdAt_idx"                 ON "funnels"("createdAt");

CREATE INDEX "funnel_results_funnelId_idx"           ON "funnel_results"("funnelId");
CREATE INDEX "funnel_results_period_idx"             ON "funnel_results"("periodStart", "periodEnd");

CREATE INDEX "dashboards_type_idx"                   ON "dashboards"("type");
CREATE INDEX "dashboards_isDefault_idx"              ON "dashboards"("isDefault");

CREATE INDEX "dashboard_widgets_dashboardId_idx"     ON "dashboard_widgets"("dashboardId");

CREATE INDEX "metric_snapshots_metricKey_idx"        ON "metric_snapshots"("metricKey");
CREATE INDEX "metric_snapshots_period_idx"           ON "metric_snapshots"("period", "periodStart");

CREATE INDEX "tracking_configs_enabled_idx"          ON "tracking_configs"("enabled");

CREATE INDEX "reports_type_idx"                      ON "reports"("type");
CREATE INDEX "reports_status_idx"                    ON "reports"("status");
CREATE INDEX "reports_requestedBy_idx"               ON "reports"("requestedBy");
CREATE INDEX "reports_createdAt_idx"                 ON "reports"("createdAt");

CREATE INDEX "exports_reportId_idx"                  ON "exports"("reportId");
CREATE INDEX "exports_status_idx"                    ON "exports"("status");
CREATE INDEX "exports_requestedBy_idx"               ON "exports"("requestedBy");
CREATE INDEX "exports_expiresAt_idx"                 ON "exports"("expiresAt");

CREATE INDEX "audit_logs_actorId_idx"                ON "audit_logs"("actorId");
CREATE INDEX "audit_logs_action_idx"                 ON "audit_logs"("action");
CREATE INDEX "audit_logs_resource_idx"               ON "audit_logs"("resource");
CREATE INDEX "audit_logs_createdAt_idx"              ON "audit_logs"("createdAt");