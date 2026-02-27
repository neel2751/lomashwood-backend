# Analytics API

Base path: `/v1/analytics`

---

## Overview

The analytics-service ingests frontend tracking events and domain events from all backend services, aggregates them into metrics and funnel data, and exposes dashboard and export endpoints for the admin team. Frontend tracking integrates alongside Google Tag Manager (GTM) and Google Search Console as required by the SRS (NFR4.1, NFR4.2).

---

## Endpoints

### POST /v1/analytics/track

Track a frontend event. This endpoint accepts anonymised tracking events from the browser. No authentication is required. The event is validated, enriched with server timestamp and geo data, then persisted asynchronously.

**Auth required:** No

**Rate limit:** 200 requests per minute per IP

**Request Body**

```json
{
  "eventType": "PRODUCT_VIEW",
  "sessionId": "uuid",
  "userId": "uuid",
  "properties": {
    "productId": "uuid",
    "category": "KITCHEN",
    "referrer": "https://lomashwood.co.uk/kitchens"
  }
}
```

| Field | Type | Rules |
|---|---|---|
| `eventType` | string | required, one of the supported event types |
| `sessionId` | uuid | required, generated client-side per browser session |
| `userId` | uuid | optional, provided when customer is authenticated |
| `properties` | object | optional, event-specific metadata |

**Supported Event Types**

| Event Type | Trigger |
|---|---|
| `PAGEVIEW` | Every page load |
| `CLICK` | CTA button clicks |
| `FILTER_APPLY` | Product filter interaction |
| `PRODUCT_VIEW` | Product detail page view |
| `ADD_TO_WISHLIST` | Wishlist addition |
| `BOOKING_START` | Appointment flow initiated |
| `BOOKING_COMPLETE` | Appointment booked successfully |
| `BROCHURE_REQUEST` | Brochure form submitted |
| `CONTACT_SUBMIT` | Contact form submitted |
| `NEWSLETTER_SIGNUP` | Newsletter subscription |

**Response `202`** — event accepted for async processing. No body.

**Errors**

| Status | Code | Reason |
|---|---|---|
| 422 | `VALIDATION_ERROR` | Unknown event type or missing sessionId |
| 429 | `RATE_LIMITED` | Too many requests |

---

### GET /v1/analytics/dashboard

Get the current admin dashboard snapshot with pre-computed business metrics.

**Auth required:** Yes (ADMIN)

**Query Parameters**

| Parameter | Type | Description |
|---|---|---|
| `from` | datetime | Period start (default: 30 days ago) |
| `to` | datetime | Period end (default: now) |

**Response `200`**

```json
{
  "totalBookings": 142,
  "totalRevenue": 287450.00,
  "totalOrders": 89,
  "averageOrderValue": 3229.78,
  "conversionRate": 8.4,
  "newCustomers": 63,
  "returningCustomers": 26,
  "topProducts": [
    {
      "productId": "uuid",
      "title": "Luna Kitchen",
      "views": 1240,
      "wishlistAdds": 87
    }
  ],
  "bookingsByType": {
    "HOME_MEASUREMENT": 68,
    "ONLINE": 45,
    "SHOWROOM": 29
  },
  "revenueByMonth": [
    { "month": "2026-01", "revenue": 142300.00 },
    { "month": "2026-02", "revenue": 145150.00 }
  ],
  "computedAt": "2026-02-01T12:00:00Z"
}
```

Dashboard snapshots are computed hourly by `rebuild-dashboards.job.ts` and cached in Redis (TTL: 5 minutes).

---

### GET /v1/analytics/funnels

Get funnel analysis data.

**Auth required:** Yes (ADMIN)

**Query Parameters**

| Parameter | Type | Description |
|---|---|---|
| `funnel` | string | `BOOKING` or `CHECKOUT` |
| `from` | datetime | Period start |
| `to` | datetime | Period end |

**Response `200`**

```json
{
  "funnelName": "BOOKING",
  "period": {
    "from": "2026-01-01T00:00:00Z",
    "to": "2026-02-01T00:00:00Z"
  },
  "steps": [
    { "step": "PAGEVIEW", "label": "Product Page Views", "count": 8240 },
    { "step": "BOOKING_START", "label": "Booking Flow Started", "count": 940 },
    { "step": "BOOKING_COMPLETE", "label": "Booking Confirmed", "count": 142 }
  ],
  "overallConversionRate": 1.72,
  "stepConversionRates": [
    { "from": "PAGEVIEW", "to": "BOOKING_START", "rate": 11.41 },
    { "from": "BOOKING_START", "to": "BOOKING_COMPLETE", "rate": 15.11 }
  ]
}
```

---

### POST /v1/analytics/exports

Request an async data export. Returns immediately with an `exportId`. The export is generated in the background and uploaded to S3. Poll the status endpoint or await the email notification containing the download link.

**Auth required:** Yes (ADMIN)

**Request Body**

```json
{
  "reportType": "BOOKINGS",
  "format": "CSV",
  "from": "2026-01-01T00:00:00Z",
  "to": "2026-02-01T00:00:00Z"
}
```

| Field | Type | Rules |
|---|---|---|
| `reportType` | string | `BOOKINGS`, `ORDERS`, `REVENUE`, `PRODUCTS`, `FUNNELS` |
| `format` | string | `CSV` or `JSON` |
| `from` | datetime | required |
| `to` | datetime | required |

**Response `202`**

```json
{
  "exportId": "uuid",
  "status": "PENDING",
  "message": "Your export is being generated. You will receive an email with the download link."
}
```

---

### GET /v1/analytics/exports/:id

Poll the status of an export request.

**Auth required:** Yes (ADMIN)

**Response `200`**

```json
{
  "exportId": "uuid",
  "status": "READY",
  "reportType": "BOOKINGS",
  "format": "CSV",
  "downloadUrl": "https://s3.eu-west-2.amazonaws.com/lomash-exports/...",
  "expiresAt": "2026-02-08T12:00:00Z",
  "createdAt": "2026-02-01T12:00:00Z",
  "completedAt": "2026-02-01T12:00:45Z"
}
```

| `status` | Description |
|---|---|
| `PENDING` | Export queued |
| `PROCESSING` | Being generated |
| `READY` | Download URL available |
| `FAILED` | Generation failed |

Download URLs are pre-signed S3 URLs valid for 7 days.

---

### GET /v1/analytics/metrics

Get real-time metric counters.

**Auth required:** Yes (ADMIN)

**Query Parameters**

| Parameter | Type | Description |
|---|---|---|
| `metrics` | string[] | Comma-separated metric names |
| `from` | datetime | Period start |
| `to` | datetime | Period end |

**Supported metrics:** `bookings_total`, `orders_total`, `revenue_total`, `pageviews_total`, `product_views_total`, `brochure_requests_total`, `newsletter_signups_total`

**Response `200`**

```json
{
  "period": {
    "from": "2026-02-01T00:00:00Z",
    "to": "2026-02-01T23:59:59Z"
  },
  "metrics": {
    "bookings_total": 8,
    "orders_total": 3,
    "revenue_total": 14997.00,
    "pageviews_total": 1247,
    "brochure_requests_total": 12
  }
}
```

---

## Google Tag Manager Integration

GTM is integrated via the frontend build. The backend does not expose GTM-specific endpoints. The analytics-service tracks events independently of GTM, providing server-side data that is not affected by ad blockers or client-side JavaScript failures.

GTM container ID and GA4 Measurement ID are injected as environment variables into the frontend build at deploy time. Google Search Console verification is handled via a `<meta>` tag in the frontend `<head>` (NFR4.2).

---

## Data Retention

| Data | Retention Period |
|---|---|
| Raw tracking events | 90 days in PostgreSQL |
| Aggregated metrics | Indefinite |
| Dashboard snapshots | 30 days |
| Export files (S3) | 7 days (presigned URL expiry) |

Historical raw events are archived to S3 after 90 days by `archive-historical-data.job.ts`.