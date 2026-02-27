# Appointment API

Base path: `/v1/appointments`, `/v1/showrooms`

---

## Overview

The appointment-service manages the full consultation booking flow as defined in the SRS (FR5.0). It covers appointment type selection, availability checking, customer detail capture, slot booking, and showroom listing. Confirmation emails are dispatched by the notification-service upon booking creation.

---

## Endpoints

### GET /v1/appointments/availability

Fetch available time slots for a given date and appointment type.

**Auth required:** No

**Query Parameters**

| Parameter | Type | Required | Description |
|---|---|---|---|
| `date` | date | Yes | ISO 8601 date (e.g., `2026-03-15`) |
| `type` | string | Yes | `HOME_MEASUREMENT`, `ONLINE`, or `SHOWROOM` |
| `showroomId` | uuid | Conditional | Required when `type` is `SHOWROOM` |

**Response `200`**

```json
{
  "date": "2026-03-15",
  "slots": [
    {
      "id": "uuid",
      "startTime": "2026-03-15T09:00:00Z",
      "endTime": "2026-03-15T10:00:00Z",
      "isAvailable": true
    },
    {
      "id": "uuid",
      "startTime": "2026-03-15T10:00:00Z",
      "endTime": "2026-03-15T11:00:00Z",
      "isAvailable": false
    }
  ]
}
```

Slot availability is cached in Redis for 30 seconds (TTL) per `consultantId + date` key. Cache is invalidated immediately on slot booking.

---

### POST /v1/appointments

Book an appointment. Executes the booking transactionally: slot is locked via `SELECT FOR UPDATE`, marked as booked, and the appointment record is created atomically. Returns `409` if the slot was taken concurrently.

**Auth required:** No (guest booking supported)

**Request Body**

```json
{
  "appointmentType": "HOME_MEASUREMENT",
  "forKitchen": true,
  "forBedroom": false,
  "slotId": "uuid",
  "customerDetails": {
    "name": "Jane Smith",
    "phone": "07700900000",
    "email": "jane@example.com",
    "postcode": "SW1A 1AA",
    "address": "10 Downing Street, London"
  }
}
```

| Field | Type | Rules |
|---|---|---|
| `appointmentType` | string | required, one of the three types |
| `forKitchen` | boolean | required |
| `forBedroom` | boolean | required, at least one of kitchen/bedroom must be true |
| `showroomId` | uuid | required when `appointmentType` is `SHOWROOM` |
| `slotId` | uuid | required, must be an available slot |
| `customerDetails.name` | string | required |
| `customerDetails.phone` | string | required |
| `customerDetails.email` | string | required, valid email |
| `customerDetails.postcode` | string | required |
| `customerDetails.address` | string | required |

**Response `201`**

```json
{
  "id": "uuid",
  "appointmentType": "HOME_MEASUREMENT",
  "forKitchen": true,
  "forBedroom": false,
  "status": "CONFIRMED",
  "customerDetails": {
    "name": "Jane Smith",
    "phone": "07700900000",
    "email": "jane@example.com",
    "postcode": "SW1A 1AA",
    "address": "10 Downing Street, London"
  },
  "scheduledAt": "2026-03-15T09:00:00Z",
  "showroom": null,
  "createdAt": "2026-02-01T10:30:00Z"
}
```

**Post-booking side effects:**

- Acknowledgement email sent to customer (FR5.5)
- If `forKitchen: true` AND `forBedroom: true`, internal mail notifications sent to both kitchen and bedroom teams (FR5.6)
- `booking-created` event published to event bus

**Errors**

| Status | Code | Reason |
|---|---|---|
| 409 | `SLOT_UNAVAILABLE` | Slot was booked concurrently |
| 422 | `VALIDATION_ERROR` | Invalid fields |
| 422 | `NO_CATEGORY_SELECTED` | Both `forKitchen` and `forBedroom` are false |

---

### GET /v1/appointments/:id

Retrieve an appointment by ID.

**Auth required:** Yes (CUSTOMER sees own; ADMIN sees all)

**Response `200`** — returns the full `Appointment` object.

**Errors**

| Status | Code | Reason |
|---|---|---|
| 403 | `FORBIDDEN` | Appointment belongs to another customer |
| 404 | `APPOINTMENT_NOT_FOUND` | No appointment with this ID |

---

### PATCH /v1/appointments/:id/cancel

Cancel an appointment. Slot is released back to available. Cancellation email sent to customer.

**Auth required:** Yes

**Request Body**

```json
{
  "reason": "Change of plans"
}
```

**Response `200`**

```json
{
  "id": "uuid",
  "status": "CANCELLED",
  "cancelledAt": "2026-02-05T08:00:00Z"
}
```

**Errors**

| Status | Code | Reason |
|---|---|---|
| 400 | `CANCELLATION_WINDOW_EXPIRED` | Cancellation attempted < 2 hours before appointment |
| 404 | `APPOINTMENT_NOT_FOUND` | No appointment with this ID |

---

### GET /v1/appointments (Admin)

List all appointments. Admin only.

**Auth required:** Yes (ADMIN)

**Query Parameters**

| Parameter | Type | Description |
|---|---|---|
| `page` | integer | Page number |
| `limit` | integer | Items per page |
| `status` | string | Filter by status |
| `appointmentType` | string | Filter by type |
| `from` | date | Filter from date |
| `to` | date | Filter to date |

**Response `200`** — paginated list of `Appointment` objects with full customer details.

---

### GET /v1/showrooms

List all showrooms. Supports optional text search by name or postcode.

**Auth required:** No

**Query Parameters**

| Parameter | Type | Description |
|---|---|---|
| `search` | string | Filter by name or postcode |

**Response `200`**

```json
{
  "data": [
    {
      "id": "uuid",
      "name": "Lomash Wood Clapham",
      "address": "45 High Street, London, SW4 7UR",
      "imageUrl": "https://cdn.lomashwood.co.uk/showrooms/clapham.webp",
      "email": "clapham@lomashwood.co.uk",
      "phone": "020 7946 0958",
      "openingHours": "Mon-Sat 9:00-18:00, Sun 10:00-16:00",
      "mapLink": "https://maps.google.com/?q=..."
    }
  ]
}
```

---

### GET /v1/showrooms/:id

Get a single showroom with full detail.

**Auth required:** No

**Response `200`** — returns the full `Showroom` object.

**Errors**

| Status | Code | Reason |
|---|---|---|
| 404 | `SHOWROOM_NOT_FOUND` | No showroom with this ID |

---

## Data Models

### Appointment

| Field | Type | Description |
|---|---|---|
| `id` | uuid | Unique identifier |
| `appointmentType` | enum | `HOME_MEASUREMENT`, `ONLINE`, `SHOWROOM` |
| `forKitchen` | boolean | Booking includes kitchen consultation |
| `forBedroom` | boolean | Booking includes bedroom consultation |
| `status` | enum | `CONFIRMED`, `CANCELLED`, `COMPLETED` |
| `customerDetails` | object | Customer contact and address data |
| `scheduledAt` | datetime | Appointment date and time |
| `showroom` | Showroom | Populated when type is `SHOWROOM` |
| `createdAt` | datetime | Booking creation timestamp |

### Showroom

| Field | Type | Description |
|---|---|---|
| `id` | uuid | Unique identifier |
| `name` | string | Showroom display name |
| `address` | string | Full postal address |
| `imageUrl` | uri | Primary showroom image |
| `email` | string | Contact email |
| `phone` | string | Contact phone |
| `openingHours` | string | Human-readable opening hours |
| `mapLink` | uri | Google Maps or equivalent link |

---

## Reminder Schedule

After booking, the appointment-service schedules automated reminders:

| Reminder | Channel | Timing |
|---|---|---|
| 24-hour reminder | Email | 24 hours before `scheduledAt` |
| 1-hour reminder | SMS | 1 hour before `scheduledAt` |

Reminders are sent by the notification-service after consuming reminder events from the event bus. See the booking-reminders event flow documentation for full detail.