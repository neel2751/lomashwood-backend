# Analytics Tracking Event Flow

## Overview

This document describes the event-driven flow for analytics data ingestion, processing, and reporting on the Lomash Wood platform. The analytics-service consumes domain events from all other services and also accepts direct tracking events from the frontend. It processes raw events into metrics, funnels, and dashboard data.

---

## Actors

| Actor | Role |
|---|---|
| Frontend (Browser) | Sends pageview and interaction events directly |
| Google Tag Manager | Client-side tag management and event forwarding |
| All Backend Services | Publish domain events consumed by analytics-service |
| Analytics Service | Ingests, aggregates, and exposes analytics data |
| Admin / Dashboard | Queries analytics data via REST API |

---

## Data Sources

| Source | Transport | Examples |
|---|---|---|
| Frontend direct | `POST /v1/analytics/track` | Pageviews, clicks, filter interactions |
| Google Tag Manager | GTM → GA4 → (optional server-side) | Page views, goal completions |
| order-payment-service | Event bus | Order created, payment succeeded |
| appointment-service | Event bus | Booking created, booking cancelled |
| content-service | Event bus | Blog published, page published |
| customer-service | Event bus | Profile updated, review created |
| product-service | Event bus | Product created, inventory updated |

---

## Frontend Tracking Flow

```
Browser (Customer)
  │
  ├──► Google Tag Manager (GTM) fires on page load / interaction
  │         └──► GA4 / Google Search Console (NFR4.1, NFR4.2)
  │
  └──► Direct API call: [POST /v1/analytics/track]
            │
            ▼
       API Gateway ──► rate-limit.middleware (anonymous allowed)
            │
            ▼
       Analytics Service
            │
            ├──► [1] Validate tracking payload (Zod: tracking.schemas.ts)
            │         ├── eventType: PAGEVIEW | CLICK | FILTER_APPLY | PRODUCT_VIEW |
            │         │             ADD_TO_WISHLIST | BOOKING_START | BOOKING_COMPLETE |
            │         │             BROCHURE_REQUEST | CONTACT_SUBMIT
            │         ├── sessionId: uuid (generated client-side)
            │         ├── userId: uuid | null (if authenticated)
            │         ├── metadata: { url, referrer, userAgent, deviceType }
            │         └── properties: Record<string, unknown>
            │
            ├──► [2] Enrich event
            │         ├── Add server timestamp
            │         ├── Resolve geoIP from IP address
            │         └── Attach session data from Redis
            │
            ├──► [3] Write to events table (append-only)
            │         └── Prisma: INSERT tracking_events
            │
            └──► [4] Publish: event-tracked (for real-time dashboard consumers)
```

---

## Backend Event Consumption Flow

```
Event Bus (all services)
  │
  ├──► lomash.orders.created
  ├──► lomash.payments.succeeded
  ├──► lomash.bookings.created
  ├──► lomash.bookings.cancelled
  ├──► lomash.content.blog.published
  ├──► lomash.inventory.updated
  └──► lomash.customers.review.created
            │
            ▼
       Analytics Service (event-consumer.ts)
            │
            ├──► [1] Deserialise and validate event payload
            │
            ├──► [2] Map to internal analytics event schema
            │         └── event-consumer.ts → tracking.mapper.ts
            │
            ├──► [3] Persist to analytics_events table
            │
            ├──► [4] Trigger incremental aggregation
            │         └── aggregation.service.ts
            │               ├── Update metric counters (Redis INCR)
            │               └── Schedule full recompute if needed
            │
            └──► [5] Invalidate cached dashboard widgets
```

---

## Aggregation & Funnel Processing Flow

```
recompute-funnels.job.ts (cron: every 30 minutes)
  │
  ├──► [1] Query raw events for time window
  │
  ├──► [2] Compute funnel steps
  │         Booking Funnel:
  │           PAGEVIEW (product page)
  │             → BOOKING_START (appointment flow initiated)
  │             → BOOKING_COMPLETE (appointment confirmed)
  │         
  │         Checkout Funnel:
  │           PRODUCT_VIEW
  │             → ADD_TO_WISHLIST
  │             → order-created event
  │             → payment-succeeded event
  │
  ├──► [3] Write funnel results to funnels table
  │
  ├──► [4] Publish: funnel-completed
  │
  └──► [5] Invalidate funnel dashboard cache
```

```
rebuild-dashboards.job.ts (cron: every 1 hour)
  │
  ├──► [1] Recompute all dashboard widget metrics
  │         ├── Total bookings (today, week, month)
  │         ├── Total orders and revenue
  │         ├── Top products by views
  │         ├── Conversion rates by funnel
  │         └── New vs returning customers
  │
  ├──► [2] Write computed results to dashboard_snapshots table
  │
  └──► [3] Publish: dashboard-refreshed
```

---

## Dashboard Query Flow (Admin)

```
Admin
  │
  └──► [GET /v1/analytics/dashboard?from=ISO8601&to=ISO8601]
            │
            ▼
       API Gateway ──► auth.middleware (role: ADMIN required)
            │
            ▼
       Analytics Service
            │
            ├──► [1] Check Redis cache for dashboard snapshot
            │         └── Key: dashboard:snapshot:{from}:{to}
            │
            ├──► [2a] Cache hit: return cached snapshot
            │
            └──► [2b] Cache miss:
                        ├── Query dashboard_snapshots table
                        ├── Cache result (TTL: 300s)
                        └── Return response
```

---

## Report Export Flow

```
Admin
  │
  └──► [POST /v1/analytics/exports]
            │
            ▼
       Analytics Service
            │
            ├──► [1] Validate export request
            │         ├── reportType: BOOKINGS | ORDERS | REVENUE | PRODUCTS | FUNNELS
            │         ├── format: CSV | JSON
            │         └── dateRange: { from, to }
            │
            ├──► [2] Queue export job (async)
            │         └── Return 202 Accepted with exportId
            │
            ├──► [3] Export job executes:
            │         ├── Query analytics data for date range
            │         ├── Transform to requested format
            │         └── Upload to S3: exports/{exportId}.{format}
            │
            ├──► [4] Publish: report-generated
            │
            └──► [5] Admin polls: [GET /v1/analytics/exports/:id]
                        └── Returns download URL when status = READY
```

---

## Events Published

### `event-tracked`

**Topic:** `lomash.analytics.event.tracked`

**Producer:** analytics-service

**Consumers:** (internal real-time stream consumers)

```json
{
  "eventId": "uuid",
  "eventType": "event-tracked",
  "timestamp": "ISO8601",
  "version": "1.0",
  "payload": {
    "trackingEventId": "uuid",
    "eventType": "PAGEVIEW | CLICK | BOOKING_COMPLETE | ...",
    "sessionId": "uuid",
    "userId": "uuid | null",
    "properties": {}
  }
}
```

### `report-generated`

**Topic:** `lomash.analytics.report.generated`

**Producer:** analytics-service

**Consumers:** notification-service (email download link to admin)

```json
{
  "eventId": "uuid",
  "eventType": "report-generated",
  "timestamp": "ISO8601",
  "version": "1.0",
  "payload": {
    "exportId": "uuid",
    "reportType": "BOOKINGS | ORDERS | REVENUE | PRODUCTS | FUNNELS",
    "format": "CSV | JSON",
    "downloadUrl": "string",
    "expiresAt": "ISO8601",
    "requestedBy": "uuid"
  }
}
```

### `funnel-completed`

**Topic:** `lomash.analytics.funnel.completed`

**Producer:** analytics-service

**Consumers:** (internal)

```json
{
  "eventId": "uuid",
  "eventType": "funnel-completed",
  "timestamp": "ISO8601",
  "version": "1.0",
  "payload": {
    "funnelId": "uuid",
    "funnelName": "BOOKING | CHECKOUT",
    "periodFrom": "ISO8601",
    "periodTo": "ISO8601",
    "steps": [
      { "step": "PAGEVIEW", "count": 1000 },
      { "step": "BOOKING_START", "count": 150 },
      { "step": "BOOKING_COMPLETE", "count": 80 }
    ],
    "conversionRate": 8.0
  }
}
```

### `dashboard-refreshed`

**Topic:** `lomash.analytics.dashboard.refreshed`

**Producer:** analytics-service

**Consumers:** (internal cache invalidation)

```json
{
  "eventId": "uuid",
  "eventType": "dashboard-refreshed",
  "timestamp": "ISO8601",
  "version": "1.0",
  "payload": {
    "snapshotId": "uuid",
    "computedAt": "ISO8601"
  }
}
```

---

## Key Metrics Tracked

| Metric | Source Events | Update Frequency |
|---|---|---|
| Total bookings | `booking-created` | Real-time |
| Booking conversion rate | Funnel: PAGEVIEW → BOOKING_COMPLETE | Every 30 min |
| Total revenue | `payment-succeeded` | Real-time |
| Average order value | `payment-succeeded` | Every 1 hour |
| Product page views | `PAGEVIEW` tracking events | Real-time |
| Top products | `PRODUCT_VIEW` tracking events | Every 1 hour |
| Blog engagement | `PAGEVIEW` on `/v1/blog/*` | Real-time |
| Brochure requests | `brochure-request-submitted` event | Real-time |
| Newsletter signups | `newsletter-subscription-created` | Real-time |

---

## Google Tag Manager Integration (NFR4.1, NFR4.2)

GTM is injected via the frontend build. The backend exposes no GTM-specific endpoints. Analytics-service tracks server-side events independently of GTM.

Server-side validation of GTM dataLayer events is not required; GTM manages client-side tracking. Both systems operate in parallel for redundancy.

---

## Data Retention

Managed by `archive-historical-data.job.ts` and `purge-old-events.job.ts`:

| Data Type | Hot Storage (PostgreSQL) | Cold Storage (S3) |
|---|---|---|
| Raw tracking events | 90 days | Indefinite |
| Aggregated metrics | Indefinite | N/A |
| Dashboard snapshots | 30 days | N/A |
| Export files (S3) | N/A | 7 days (presigned URL expiry) |

---

## Failure Scenarios

### High-Volume Tracking Ingestion

- Rate limiting on `/v1/analytics/track`: 100 req/min per IP
- Events are written asynchronously; tracking endpoint returns `202 Accepted` immediately
- If DB write fails, event is queued in Redis for retry

### Aggregation Job Failure

- Dashboard falls back to previous snapshot
- Admin notified via notification-service if snapshot age > 2 hours
- Manual re-trigger: `POST /v1/admin/jobs/rebuild-dashboards`

---

## Monitoring

| Metric | Alert Threshold |
|---|---|
| `tracking_ingest_rate_per_second` | > 500 (scale trigger) |
| `aggregation_job_duration_ms` | > 60000ms |
| `dashboard_snapshot_age_minutes` | > 120 |
| `export_generation_duration_ms` | > 30000ms |
| `analytics_event_drop_rate` | > 0.1% |