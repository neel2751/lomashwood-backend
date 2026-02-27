# Notification API

Base path: `/v1/notifications`

---

## Overview

The notification-service handles all outbound communication across email, SMS, and push channels. It is primarily event-driven — consuming events from other services via the event bus and dispatching notifications accordingly. The REST API exposes preference management and notification history for customers, and administrative endpoints for template management.

---

## Endpoints

### GET /v1/notifications/me

Get the notification history for the authenticated customer.

**Auth required:** Yes

**Query Parameters**

| Parameter | Type | Description |
|---|---|---|
| `page` | integer | Page number (default: 1) |
| `limit` | integer | Items per page (default: 20) |
| `channel` | string | Filter by `email`, `sms`, or `push` |
| `status` | string | Filter by `SENT`, `FAILED`, `PENDING` |

**Response `200`**

```json
{
  "data": [
    {
      "id": "uuid",
      "channel": "email",
      "subject": "Your Lomash Wood Appointment Confirmation",
      "status": "SENT",
      "sentAt": "2026-02-01T10:05:00Z",
      "template": "booking-confirmation"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 5,
    "totalPages": 1,
    "hasNextPage": false,
    "hasPrevPage": false
  }
}
```

---

### GET /v1/notifications/me/preferences

Get the notification preferences for the authenticated customer.

**Auth required:** Yes

**Response `200`**

```json
{
  "email": {
    "bookingConfirmations": true,
    "bookingReminders": true,
    "orderUpdates": true,
    "newsletter": true,
    "promotions": false
  },
  "sms": {
    "bookingReminders": true,
    "orderUpdates": false
  },
  "push": {
    "enabled": false
  }
}
```

---

### PATCH /v1/notifications/me/preferences

Update the authenticated customer's notification preferences.

**Auth required:** Yes

**Request Body** — partial update, all fields optional:

```json
{
  "email": {
    "promotions": true
  },
  "sms": {
    "bookingReminders": false
  }
}
```

**Response `200`** — returns the updated preferences object.

---

## Admin Endpoints

### GET /v1/admin/notifications/templates

List all notification templates.

**Auth required:** Yes (ADMIN)

**Response `200`**

```json
{
  "data": [
    {
      "id": "uuid",
      "name": "booking-confirmation",
      "channel": "email",
      "subject": "Your Appointment is Confirmed",
      "body": "Hi {{name}}, your appointment on {{date}} is confirmed...",
      "variables": ["name", "date", "appointmentType", "cancelLink"],
      "isActive": true,
      "updatedAt": "2026-01-15T10:00:00Z"
    }
  ]
}
```

---

### PATCH /v1/admin/notifications/templates/:id

Update a notification template.

**Auth required:** Yes (ADMIN)

**Request Body**

```json
{
  "subject": "Updated subject line",
  "body": "Updated template body with {{name}} variable...",
  "isActive": true
}
```

**Response `200`** — returns the updated template.

---

## Notification Templates

The notification-service uses the following templates triggered by events:

### Email Templates

| Template Name | Trigger Event | Description |
|---|---|---|
| `booking-confirmation` | `booking-created` | Sent to customer on successful booking |
| `booking-reminder-24h` | Cron: 24h before | 24-hour appointment reminder |
| `booking-cancellation` | `booking-cancelled` | Cancellation confirmation to customer |
| `payment-receipt` | `payment-succeeded` | Payment confirmation with order summary |
| `order-confirmation` | `order-created` | Order summary after payment |
| `brochure-delivery` | Brochure form submit | Brochure download link to customer |
| `password-reset` | Password reset request | Password reset link |
| `internal-booking-kitchen` | `booking-created` (forKitchen) | Internal alert to kitchen team |
| `internal-booking-bedroom` | `booking-created` (forBedroom) | Internal alert to bedroom team |
| `internal-business-enquiry` | Business form submit | Internal alert with enquiry details |
| `admin-low-stock` | `inventory-updated` (low stock) | Internal low-stock alert |

### SMS Templates

| Template Name | Trigger Event | Description |
|---|---|---|
| `booking-reminder-1h` | Cron: 1h before | 1-hour appointment reminder |
| `booking-confirmation-sms` | `booking-created` | Short booking confirmation |

---

## Channel Providers

| Channel | Primary Provider | Fallback Provider |
|---|---|---|
| Email | AWS SES | Nodemailer (SMTP) |
| SMS | Twilio | MSG91 |
| Push | Firebase Cloud Messaging | Web Push (VAPID) |

Provider selection and failover logic is managed in `notification-service/src/infrastructure/`.

---

## Delivery and Retry Policy

- All notifications are dispatched asynchronously after consuming the triggering event.
- Failed deliveries are retried up to 3 times with exponential backoff (5s, 25s, 125s).
- After 3 failures, the notification is moved to the dead-letter queue (DLQ).
- `retry-failed-messages.job.ts` processes the DLQ every 10 minutes.
- All delivery attempts are logged with `status`, `provider`, `error` (if any), and timestamps.

---

## Rate Limits (Outbound)

| Channel | Limit |
|---|---|
| Email per customer per hour | 10 |
| SMS per customer per day | 5 |
| Push per customer per hour | 20 |

Internal/admin notifications bypass per-customer rate limits.