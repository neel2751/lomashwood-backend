# Migration: 0001_init

## Description

Initial database schema migration for the Analytics Service.

## Changes

### New Enums

- `EventType` — Defines all trackable analytics event types (PAGE_VIEW, PRODUCT_VIEW, APPOINTMENT_START, etc.)
- `DeviceType` — Device classification (DESKTOP, TABLET, MOBILE, BOT, UNKNOWN)
- `FunnelStatus` — Funnel lifecycle status (ACTIVE, PAUSED, ARCHIVED)
- `ExportStatus` — Export job status (PENDING, PROCESSING, COMPLETED, FAILED, EXPIRED)
- `ExportFormat` — Export file formats (CSV, JSON, XLSX)
- `ReportType` — Report categories (TRAFFIC, CONVERSIONS, APPOINTMENTS, PRODUCTS, FUNNELS, COHORTS, CUSTOM)
- `ReportStatus` — Report job status (PENDING, PROCESSING, COMPLETED, FAILED)
- `DashboardType` — Dashboard categories (OVERVIEW, MARKETING, SALES, OPERATIONS, CUSTOM)
- `MetricAggregation` — Metric computation types (SUM, AVG, COUNT, MIN, MAX, UNIQUE)
- `MetricPeriod` — Time granularity for metrics (HOURLY, DAILY, WEEKLY, MONTHLY, YEARLY)

### New Tables

| Table | Purpose |
|---|---|
| `analytics_sessions` | Tracks individual user sessions with device, geo, and UTM data |
| `analytics_events` | Stores every discrete analytics event tied to a session |
| `page_views` | Dedicated page view records with scroll depth and time on page |
| `conversion_events` | Tracks high-value conversion actions with optional monetary value |
| `funnels` | Defines multi-step conversion funnels |
| `funnel_results` | Stores computed funnel analysis results per time period |
| `dashboards` | Configurable dashboard definitions |
| `dashboard_widgets` | Individual widget configurations within a dashboard |
| `metric_snapshots` | Pre-aggregated metric values by period for fast retrieval |
| `tracking_configs` | Key-value tracking configuration store (GTM, GSC, etc.) |
| `reports` | Async report generation job records |
| `exports` | Async data export job records |
| `audit_logs` | Immutable audit trail for all admin actions |

### Foreign Keys

- `analytics_events.sessionId` → `analytics_sessions.id`
- `funnel_results.funnelId` → `funnels.id`
- `dashboard_widgets.dashboardId` → `dashboards.id` (CASCADE DELETE)
- `exports.reportId` → `reports.id` (SET NULL on DELETE)

### Unique Constraints

- `tracking_configs.key` — Enforces unique tracking config keys
- `metric_snapshots(metricKey, period, periodStart, periodEnd)` — Prevents duplicate metric snapshots

## Rollback

```sql
DROP TABLE IF EXISTS "audit_logs" CASCADE;
DROP TABLE IF EXISTS "exports" CASCADE;
DROP TABLE IF EXISTS "reports" CASCADE;
DROP TABLE IF EXISTS "tracking_configs" CASCADE;
DROP TABLE IF EXISTS "metric_snapshots" CASCADE;
DROP TABLE IF EXISTS "dashboard_widgets" CASCADE;
DROP TABLE IF EXISTS "dashboards" CASCADE;
DROP TABLE IF EXISTS "funnel_results" CASCADE;
DROP TABLE IF EXISTS "funnels" CASCADE;
DROP TABLE IF EXISTS "conversion_events" CASCADE;
DROP TABLE IF EXISTS "page_views" CASCADE;
DROP TABLE IF EXISTS "analytics_events" CASCADE;
DROP TABLE IF EXISTS "analytics_sessions" CASCADE;

DROP TYPE IF EXISTS "MetricPeriod";
DROP TYPE IF EXISTS "MetricAggregation";
DROP TYPE IF EXISTS "DashboardType";
DROP TYPE IF EXISTS "ReportStatus";
DROP TYPE IF EXISTS "ReportType";
DROP TYPE IF EXISTS "ExportFormat";
DROP TYPE IF EXISTS "ExportStatus";
DROP TYPE IF EXISTS "FunnelStatus";
DROP TYPE IF EXISTS "DeviceType";
DROP TYPE IF EXISTS "EventType";
```

## Applied At

Initial schema — applied on first deployment.