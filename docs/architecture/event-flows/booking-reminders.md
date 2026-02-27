# Booking Reminders Event Flow

## Overview

This document describes the event-driven flow for appointment booking and automated reminder delivery on the Lomash Wood platform. The appointment-service orchestrates the booking lifecycle, while the notification-service handles all outbound communication to customers and internal teams.

---

## Actors

| Actor | Role |
|---|---|
| Customer | Books consultation appointment via frontend |
| API Gateway | Routes and authenticates booking requests |
| Appointment Service | Manages booking lifecycle, availability, and reminders |
| Notification Service | Sends email, SMS, and push notifications |
| Analytics Service | Tracks booking conversion metrics |
| Customer Service | Links bookings to customer profile history |

---

## Appointment Types

As defined in the SRS (FR5.1):

| Type | Identifier | Notes |
|---|---|---|
| Home Measurement | `HOME_MEASUREMENT` | Consultant visits customer address |
| Online | `ONLINE` | Video/call consultation |
| Showroom | `SHOWROOM` | Customer visits selected showroom |

---

## Booking Creation Flow

```
Customer
  │
  └──► [POST /v1/appointments]
            │
            ▼
       API Gateway ──► auth.middleware (authenticated or guest token)
            │
            ▼
       Appointment Service
            │
            ├──► [1] Validate booking request (Zod: booking.schemas.ts)
            │         ├── appointmentType: HOME_MEASUREMENT | ONLINE | SHOWROOM
            │         ├── forKitchen: boolean
            │         ├── forBedroom: boolean
            │         ├── customerDetails: { name, phone, email, postcode, address }
            │         └── slotId: uuid (from availability)
            │
            ├──► [2] Check slot availability
            │         └── availability.repository.ts: SELECT slot WHERE id = ? AND isBooked = false FOR UPDATE
            │
            ├──► [3a] Slot available
            │         ├── UPDATE slot SET isBooked = true
            │         ├── INSERT appointment record (status: CONFIRMED)
            │         └── COMMIT transaction
            │
            ├──► [3b] Slot unavailable
            │         ├── ROLLBACK
            │         └── Return 409 Conflict to customer
            │
            ├──► [4] Publish: booking-created
            │
            └──► [5] Return booking confirmation to customer
```

---

## Post-Booking Notification Flow

```
Appointment Service
  │
  └──► Publish: booking-created (lomash.bookings.created)
            │
            ▼
       Notification Service (event consumer)
            │
            ├──► [1] Consume booking-created event
            │
            ├──► [2] Send Acknowledgement Email to Customer (FR5.5)
            │         ├── Template: booking-confirmation
            │         ├── Channel: email
            │         └── Variables: { name, appointmentType, dateTime, location }
            │
            ├──► [3] Conditional: forKitchen === true AND forBedroom === true (FR5.6)
            │         ├── Send internal mail to Kitchen Team
            │         └── Send internal mail to Bedroom Team
            │
            └──► [4] SMS confirmation (if phone provided)
                        └── Template: booking-sms-confirmation
```

---

## Reminder Scheduling Flow

```
Appointment Service
  │
  └──► send-reminders.job.ts (cron: runs every 15 minutes)
            │
            ├──► [1] Query upcoming appointments
            │         └── SELECT appointments WHERE
            │               dateTime BETWEEN now() + 24h AND now() + 25h  (24h reminder)
            │               OR
            │               dateTime BETWEEN now() + 1h AND now() + 1h15m  (1h reminder)
            │               AND reminderSent24h = false / reminderSent1h = false
            │
            ├──► [2] For each appointment:
            │         ├── Publish: reminder-due (internal queue)
            │         └── Update: reminderSent24h = true / reminderSent1h = true
            │
            └──► Events consumed by Notification Service
                        │
                        ├──► 24h Reminder Email
                        │         ├── Template: booking-reminder-24h
                        │         └── Variables: { name, dateTime, appointmentType, cancelLink }
                        │
                        ├──► 1h Reminder SMS
                        │         └── Template: booking-reminder-1h-sms
                        │
                        └──► Publish: reminder-sent (lomash.reminders.sent)
```

---

## Booking Cancellation Flow

```
Customer or Admin
  │
  └──► [PATCH /v1/appointments/:id/cancel]
            │
            ▼
       Appointment Service
            │
            ├──► [1] Validate cancellation window (e.g., > 2h before appointment)
            │
            ├──► [2] Update appointment status: CONFIRMED → CANCELLED
            │
            ├──► [3] Release slot: UPDATE slot SET isBooked = false
            │
            ├──► [4] Publish: booking-cancelled
            │
            └──► Notification Service (booking-cancelled consumer)
                        ├──► Send cancellation confirmation email to customer
                        └──► Send internal alert to admin team
```

---

## Events Published

### `booking-created`

**Topic:** `lomash.bookings.created`

**Producer:** appointment-service

**Consumers:** notification-service, analytics-service, customer-service

```json
{
  "eventId": "uuid",
  "eventType": "booking-created",
  "timestamp": "ISO8601",
  "version": "1.0",
  "payload": {
    "appointmentId": "uuid",
    "customerId": "uuid | null",
    "appointmentType": "HOME_MEASUREMENT | ONLINE | SHOWROOM",
    "forKitchen": true,
    "forBedroom": false,
    "customerDetails": {
      "name": "string",
      "phone": "string",
      "email": "string",
      "postcode": "string",
      "address": "string"
    },
    "scheduledAt": "ISO8601",
    "showroomId": "uuid | null"
  }
}
```

### `booking-cancelled`

**Topic:** `lomash.bookings.cancelled`

**Producer:** appointment-service

**Consumers:** notification-service, analytics-service

```json
{
  "eventId": "uuid",
  "eventType": "booking-cancelled",
  "timestamp": "ISO8601",
  "version": "1.0",
  "payload": {
    "appointmentId": "uuid",
    "customerId": "uuid | null",
    "cancelledBy": "CUSTOMER | ADMIN | SYSTEM",
    "reason": "string | null",
    "cancelledAt": "ISO8601"
  }
}
```

### `reminder-sent`

**Topic:** `lomash.reminders.sent`

**Producer:** notification-service

**Consumers:** analytics-service

```json
{
  "eventId": "uuid",
  "eventType": "reminder-sent",
  "timestamp": "ISO8601",
  "version": "1.0",
  "payload": {
    "appointmentId": "uuid",
    "reminderType": "24H_EMAIL | 1H_SMS",
    "channel": "email | sms",
    "recipient": "email@example.com | +447xxx",
    "sentAt": "ISO8601"
  }
}
```

---

## Admin Appointment Table (FR5.7)

All bookings are queryable via:

```
GET /v1/appointments?status=CONFIRMED&page=1&limit=20&sortBy=scheduledAt&order=asc
```

Admin role required. Response includes full customer details, appointment type, kitchen/bedroom flags, and reminder status flags.

---

## Failure Scenarios

### Slot Race Condition

- `SELECT ... FOR UPDATE` pessimistic lock prevents double-booking
- Customer receives `409 Conflict` with message to select another slot

### Email Delivery Failure

- notification-service retries up to 3 times with exponential backoff
- After 3 failures: event sent to DLQ, `notification-failed` event published
- `retry-failed-messages.job.ts` reprocesses DLQ items

### Reminder Job Missed Run

- `reminderSent24h` and `reminderSent1h` flags on appointment record prevent duplicate sends
- Job queries by time window, so a delayed run catches up missed appointments within window

---

## Monitoring

| Metric | Alert Threshold |
|---|---|
| `bookings_created_total` | Informational |
| `booking_confirmation_email_lag_ms` | > 5000ms |
| `reminder_delivery_failure_rate` | > 5% |
| `cancelled_bookings_rate` | > 20% (business alert) |
| `slot_conflict_rate` | > 2% (capacity alert) |