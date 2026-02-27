# Analytics Service — Prisma

## Overview

This directory contains the Prisma ORM configuration, schema, seed data, and migration history for the Analytics Service database.

## Database

- **Provider:** PostgreSQL
- **ORM:** Prisma v5
- **Schema:** `analytics_service`

## Schema Overview

### Core Models

| Model | Table | Purpose |
|---|---|---|
| `AnalyticsSession` | `analytics_sessions` | User session tracking |
| `AnalyticsEvent` | `analytics_events` | Discrete event ingestion |
| `PageView` | `page_views` | Page view tracking |
| `ConversionEvent` | `conversion_events` | High-value conversion tracking |
| `Funnel` | `funnels` | Multi-step funnel definitions |
| `FunnelResult` | `funnel_results` | Computed funnel analysis |
| `Dashboard` | `dashboards` | Dashboard configurations |
| `DashboardWidget` | `dashboard_widgets` | Dashboard widget definitions |
| `MetricSnapshot` | `metric_snapshots` | Pre-aggregated metric values |
| `TrackingConfig` | `tracking_configs` | GTM/GSC tracking configuration |
| `Report` | `reports` | Async report generation jobs |
| `Export` | `exports` | Async data export jobs |
| `AuditLog` | `audit_logs` | Admin action audit trail |

## Commands

```bash
# Generate Prisma client
pnpm prisma:generate

# Run migrations (production)
pnpm prisma:migrate

# Create and run new migration (development)
pnpm prisma:migrate:dev

# Seed the database
pnpm prisma:seed

# Open Prisma Studio
pnpm prisma:studio

# Reset database (development only)
npx prisma migrate reset
```

## Environment Variables

```bash
DATABASE_URL=postgresql://user:password@host:5432/lomashwood_analytics?schema=public
```

## Migrations

| Migration | Description |
|---|---|
| `0001_init` | Initial schema — all tables, enums, indexes, and constraints |

## Seed Data

The seed script populates:

- **Tracking Configs** — GTM, Google Search Console, session recording, heatmap entries
- **Dashboards** — Default overview and sales dashboards with pre-configured widgets
- **Funnels** — Appointment booking, brochure request, and product discovery funnels
- **Metric Snapshots** — Sample daily metrics for development purposes