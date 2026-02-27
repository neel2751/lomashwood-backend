# Sequence Diagram — Booking Flow

## Overview

Covers the complete 4-step appointment booking journey (FR5.0): type selection, service selection, customer details, and slot booking. Includes slot conflict prevention, the dual-team email trigger (FR5.6), admin view (FR5.7), cancellation, and the brochure request form (FR8.0).

---

## 1. Check Availability — Slot Grid (FR5.4)

```
Client                API Gateway        appointment-service    PostgreSQL       Redis (db:3)
  │                       │                      │                  │                │
  │ GET /v1/appointments  │                      │                  │                │
  │  /availability        │                      │                  │                │
  │  ?type=HOME_MEASUREMENT                      │                  │                │
  │  &date=2026-03-01     │                      │                  │                │
  │  &category=KITCHEN    │                      │                  │                │
  │──────────────────────▶│─────────────────────▶│                  │                │
  │                       │                      │ Cache key:       │                │
  │                       │                      │ slot:availability│                │
  │                       │                      │ :HOME:2026-03-01 │                │
  │                       │                      │────────────────────────────────── ▶│
  │                       │                      │                  │   CACHE HIT ▼  │
  │ ◀─────────────────────│◀─────────────────────│◀── cached slots  │                │
  │ 200 { slots: [...] }  │                      │   (TTL 30s)      │                │
  │  < 10ms               │                      │                  │                │
  │                       │                      │                  │   CACHE MISS ▼ │
  │                       │                      │ ◀── null         │                │
  │                       │                      │                  │                │
  │                       │                      │ prisma.timeSlot  │                │
  │                       │                      │ .findMany({      │                │
  │                       │                      │  where: {        │                │
  │                       │                      │   isBooked:false │                │
  │                       │                      │   isBlocked:false│                │
  │                       │                      │   startsAt:{     │                │
  │                       │                      │    gte:start,    │                │
  │                       │                      │    lt: end }     │                │
  │                       │                      │  },              │                │
  │                       │                      │  include:{       │                │
  │                       │                      │   consultant:true│                │
  │                       │                      │  },              │                │
  │                       │                      │  orderBy:{       │                │
  │                       │                      │   startsAt:'asc'}│                │
  │                       │                      │ })               │                │
  │                       │                      │─────────────────▶│                │
  │                       │                      │ ◀── TimeSlot[]   │                │
  │                       │                      │                  │                │
  │                       │                      │ SET slot:        │                │
  │                       │                      │ availability:... │                │
  │                       │                      │ EX 30            │                │
  │                       │                      │────────────────────────────────── ▶│
  │ ◀─────────────────────│◀─────────────────────│                  │                │
  │ 200 {                 │                      │                  │                │
  │  slots: [             │                      │                  │                │
  │   { slotId, startsAt, │                      │                  │                │
  │     endsAt,           │                      │                  │                │
  │     consultant: {     │                      │                  │                │
  │      name, avatarUrl }│                      │                  │                │
  │   }, ...              │                      │                  │                │
  │  ]                    │                      │                  │                │
  │ }                     │                      │                  │                │
```

---

## 2. Submit Booking — Happy Path (FR5.1–FR5.5)

```
Client            API Gateway       appointment-service     PostgreSQL       Redis (db:3)    notification-svc
  │                   │                    │                    │                │                │
  │ POST              │                    │                    │                │                │
  │ /v1/appointments  │                    │                    │                │                │
  │ Authorization:    │                    │                    │                │                │
  │  Bearer <token>   │                    │                    │                │                │
  │ {                 │                    │                    │                │                │
  │  type: "HOME_     │                    │                    │                │                │
  │   MEASUREMENT",   │                    │                    │                │                │
  │  forKitchen: true,│                    │                    │                │                │
  │  forBedroom: true,│                    │                    │                │                │
  │  firstName:"Jane",│                    │                    │                │                │
  │  lastName: "Doe", │                    │                    │                │                │
  │  email:"j@e.com", │                    │                    │                │                │
  │  phone:"07...",   │                    │                    │                │                │
  │  postcode:"SW1A", │                    │                    │                │                │
  │  address: "...",  │                    │                    │                │                │
  │  slotId: "uuid"   │                    │                    │                │                │
  │ }                 │                    │                    │                │                │
  │──────────────────▶│                    │                    │                │                │
  │                   │ Verify JWT         │                    │                │                │
  │                   │ Zod validate body  │                    │                │                │
  │                   │ ─────────────────▶ │                    │                │                │
  │                   │                    │ Acquire slot lock: │                │                │
  │                   │                    │ SET slot:lock:     │                │                │
  │                   │                    │ {slotId} "1"       │                │                │
  │                   │                    │ NX EX 30           │                │                │
  │                   │                    │ ────────────────────────────────── ▶│                │
  │                   │                    │                    │                │                │
  │                   │                    │             ◀── OK (lock acquired)  │                │
  │                   │                    │                    │                │                │
  │                   │                    │ Verify slot still  │                │                │
  │                   │                    │ available:         │                │                │
  │                   │                    │ SELECT isBooked    │                │                │
  │                   │                    │ FROM time_slots    │                │                │
  │                   │                    │ WHERE id = slotId  │                │                │
  │                   │                    │ FOR UPDATE         │                │                │
  │                   │                    │ ───────────────── ▶│                │                │
  │                   │                    │ ◀── isBooked:false │                │                │
  │                   │                    │                    │                │                │
  │                   │                    │ BEGIN TRANSACTION  │                │                │
  │                   │                    │ ───────────────── ▶│                │                │
  │                   │                    │                    │                │                │
  │                   │                    │ UPDATE time_slots  │                │                │
  │                   │                    │ SET isBooked=true  │                │                │
  │                   │                    │ WHERE id=slotId    │                │                │
  │                   │                    │ ───────────────── ▶│                │                │
  │                   │                    │                    │                │                │
  │                   │                    │ INSERT bookings {  │                │                │
  │                   │                    │  referenceCode:    │                │                │
  │                   │                    │   BK-20260301-0042,│                │                │
  │                   │                    │  userId,type,      │                │                │
  │                   │                    │  forKitchen:true,  │                │                │
  │                   │                    │  forBedroom:true,  │                │                │
  │                   │                    │  firstName,email,  │                │                │
  │                   │                    │  slotId,           │                │                │
  │                   │                    │  status:PENDING    │                │                │
  │                   │                    │ }                  │                │                │
  │                   │                    │ ───────────────── ▶│                │                │
  │                   │                    │ COMMIT             │                │                │
  │                   │                    │ ◀─────────────────│                │                │
  │                   │                    │                    │                │                │
  │                   │                    │ Release slot lock: │                │                │
  │                   │                    │ DEL slot:lock:     │                │                │
  │                   │                    │ {slotId}           │                │                │
  │                   │                    │ ────────────────────────────────── ▶│                │
  │                   │                    │                    │                │                │
  │                   │                    │ Invalidate slot    │                │                │
  │                   │                    │ availability cache:│                │                │
  │                   │                    │ DEL slot:availability:*:2026-03-01  │                │
  │                   │                    │ ────────────────────────────────── ▶│                │
  │                   │                    │                    │                │                │
  │                   │                    │ Publish event:     │                │                │
  │                   │                    │ "booking.created"  │                │                │
  │                   │                    │ { bookingId,       │                │                │
  │                   │                    │   referenceCode,   │                │                │
  │                   │                    │   forKitchen:true, │                │                │
  │                   │                    │   forBedroom:true, │                │                │
  │                   │                    │   email, name,     │                │                │
  │                   │                    │   slotStartsAt }   │                │                │
  │ ◀─────────────────│◀───────────────────│                    │                │                │
  │ 201 {             │                    │                    │                │                │
  │  bookingId:"uuid",│                    │                    │                │                │
  │  referenceCode:   │                    │                    │                │                │
  │   "BK-20260301-   │                    │                    │                │                │
  │    0042",         │                    │                    │  ─── async ──── ─ ─ ─ ─ ─ ─ ─▶│
  │  status:"PENDING" │                    │                    │                │ consume event  │
  │ }                 │                    │                    │                │                │
  │                   │                    │                    │                │ Send confirm   │
  │                   │                    │                    │                │ email to Jane  │
  │                   │                    │                    │                │ (FR5.5)        │
  │                   │                    │                    │                │                │
  │                   │                    │                    │                │ forKitchen &&  │
  │                   │                    │                    │                │ forBedroom:    │
  │                   │                    │                    │                │ Send alert to  │
  │                   │                    │                    │                │ kitchen-team@  │
  │                   │                    │                    │                │ bedroom-team@  │
  │                   │                    │                    │                │ (FR5.6)        │
```

---

## 3. Slot Conflict — Concurrent Booking Race Condition

```
Client A          Client B          appointment-service     PostgreSQL       Redis (db:3)
  │                   │                    │                    │                │
  │ POST /appointments│                    │                    │                │
  │ slotId: "uuid-42" │                    │                    │                │
  │──────────────────────────────────────▶│                    │                │
  │                   │ POST /appointments │                    │                │
  │                   │ slotId: "uuid-42"  │                    │                │
  │                   │──────────────────▶│                    │                │
  │                   │                    │                    │                │
  │                   │                    │ Client A: SET slot:│                │
  │                   │                    │ lock:uuid-42 NX EX │                │
  │                   │                    │────────────────────────────────── ▶│
  │                   │                    │ ◀── OK (Client A wins lock)         │
  │                   │                    │                    │                │
  │                   │                    │ Client B: SET slot:│                │
  │                   │                    │ lock:uuid-42 NX EX │                │
  │                   │                    │────────────────────────────────── ▶│
  │                   │                    │ ◀── nil (lock held by A)            │
  │                   │                    │                    │                │
  │                   │                    │ Client A: transaction                │
  │                   │                    │ → isBooked = true  │                │
  │                   │                    │ → booking created  │                │
  │ ◀─────────────────────────────────────│                    │                │
  │ 201 { referenceCode }                  │                    │                │
  │                   │                    │                    │                │
  │                   │                    │ Client B: retry    │                │
  │                   │                    │ (3 attempts,       │                │
  │                   │                    │ 200ms backoff)     │                │
  │                   │                    │ SELECT isBooked    │                │
  │                   │                    │ → true (slot gone) │                │
  │                   │                    │─────────────────── ▶                │
  │                   │ ◀──────────────────│                    │                │
  │                   │ 409 {              │                    │                │
  │                   │  code:             │                    │                │
  │                   │  "SLOT_UNAVAILABLE"│                    │                │
  │                   │  message: "This    │                    │                │
  │                   │  slot was just     │                    │                │
  │                   │  booked. Please    │                    │                │
  │                   │  choose another." }│                    │                │
```

---

## 4. Admin Appointment Table View (FR5.7)

```
Admin Client       API Gateway       appointment-service     PostgreSQL
  │                   │                    │                    │
  │ GET /v1/admin/    │                    │                    │
  │   appointments    │                    │                    │
  │  ?status=PENDING  │                    │                    │
  │  &page=1&limit=25 │                    │                    │
  │  &sort=-createdAt │                    │                    │
  │ Authorization:    │                    │                    │
  │  Bearer <admin>   │                    │                    │
  │──────────────────▶│                    │                    │
  │                   │ Verify ADMIN role  │                    │
  │                   │ ─────────────────▶│                    │
  │                   │                   │ @RequireRole(ADMIN) │
  │                   │                   │                     │
  │                   │                   │ prisma.booking      │
  │                   │                   │ .findMany({         │
  │                   │                   │  where:{            │
  │                   │                   │   status:PENDING},  │
  │                   │                   │  include:{          │
  │                   │                   │   slot:true,        │
  │                   │                   │   consultant:true}, │
  │                   │                   │  orderBy:{          │
  │                   │                   │   createdAt:'desc'},│
  │                   │                   │  skip:0, take:25    │
  │                   │                   │ })                  │
  │                   │                   │────────────────────▶│
  │                   │                   │ ◀── Booking[]       │
  │                   │                   │                     │
  │                   │                   │ prisma.booking      │
  │                   │                   │ .count({where:      │
  │                   │                   │  {status:PENDING}}) │
  │                   │                   │────────────────────▶│
  │                   │                   │ ◀── 47              │
  │ ◀─────────────────│◀──────────────────│                     │
  │ 200 {             │                   │                     │
  │  data: [25 rows], │                   │                     │
  │  total: 47,       │                   │                     │
  │  page: 1,         │                   │                     │
  │  totalPages: 2    │                   │                     │
  │ }                 │                   │                     │
```

---

## 5. Cancel Booking

```
Client             API Gateway       appointment-service     PostgreSQL       Redis (db:3)    notification-svc
  │                   │                    │                    │                │                │
  │ PATCH /v1/        │                    │                    │                │                │
  │  appointments/    │                    │                    │                │                │
  │  {bookingId}/     │                    │                    │                │                │
  │  cancel           │                    │                    │                │                │
  │ { reason: "..." } │                    │                    │                │                │
  │──────────────────▶│─────────────────── ▶│                   │                │                │
  │                   │                    │ Verify ownership:  │                │                │
  │                   │                    │ booking.userId ==  │                │                │
  │                   │                    │ X-User-Id          │                │                │
  │                   │                    │                    │                │                │
  │                   │                    │ BEGIN TRANSACTION  │                │                │
  │                   │                    │ UPDATE bookings    │                │                │
  │                   │                    │ SET status=CANCELLED                │                │
  │                   │                    │ cancelledAt=NOW()  │                │                │
  │                   │                    │ cancelReason=...   │                │                │
  │                   │                    │ ───────────────── ▶│                │                │
  │                   │                    │ UPDATE time_slots  │                │                │
  │                   │                    │ SET isBooked=false │                │                │
  │                   │                    │ WHERE id=slotId    │                │                │
  │                   │                    │ ───────────────── ▶│                │                │
  │                   │                    │ COMMIT             │                │                │
  │                   │                    │                    │                │                │
  │                   │                    │ Invalidate slot    │                │                │
  │                   │                    │ cache for that day │                │                │
  │                   │                    │ ────────────────────────────────── ▶│                │
  │                   │                    │ Publish            │                │                │
  │                   │                    │ "booking.cancelled"│                │                │
  │ ◀─────────────────│◀───────────────────│                    │                │  ─ ─ ─ async─▶ │
  │ 200 { status:     │                    │                    │                │  Send cancel   │
  │  "CANCELLED" }    │                    │                    │                │  confirmation  │
  │                   │                    │                    │                │  email         │
```

---

## 6. Brochure Request Flow (FR8.1, FR8.2)

```
Client (anon)      API Gateway       appointment-service     PostgreSQL       notification-svc
  │                   │                    │                    │                    │
  │ POST /v1/brochures│                    │                    │                    │
  │ {                 │                    │                    │                    │
  │  firstName:"John",│                    │                    │                    │
  │  lastName:"Smith",│                    │                    │                    │
  │  email:"j@s.com", │                    │                    │                    │
  │  phone:"07...",   │                    │                    │                    │
  │  postcode:"M1",   │                    │                    │                    │
  │  address:"..."    │                    │                    │                    │
  │ }                 │                    │                    │                    │
  │──────────────────▶│                    │                    │                    │
  │                   │ Rate-limit:        │                    │                    │
  │                   │ 3 req/hr per email │                    │                    │
  │                   │ No auth required   │                    │                    │
  │                   │ Zod validate       │                    │                    │
  │                   │ ─────────────────▶│                    │                    │
  │                   │                   │ prisma.brochure     │                    │
  │                   │                   │ Request.create({    │                    │
  │                   │                   │  firstName,lastName │                    │
  │                   │                   │  email, phone,      │                    │
  │                   │                   │  postcode, address  │                    │
  │                   │                   │ })                  │                    │
  │                   │                   │────────────────────▶│                    │
  │                   │                   │ ◀── { requestId }   │                    │
  │                   │                   │                     │                    │
  │                   │                   │ Publish event:      │                    │
  │                   │                   │ "brochure.requested"│                    │
  │ ◀─────────────────│◀──────────────────│                     │   ─ ─ ─ async ─ ─▶│
  │ 201 { message:    │                   │                     │   consume event    │
  │  "Brochure on     │                   │                     │   Fetch PDF from S3│
  │   its way" }      │                   │                     │   Send email with  │
  │                   │                   │                     │   brochure attached│
  │                   │                   │                     │   Template:        │
  │                   │                   │                     │   brochure-delivery│
```

---

## Error States Summary

| Scenario | HTTP Status | Error Code |
|----------|------------|------------|
| Slot already booked | 409 | `SLOT_UNAVAILABLE` |
| Slot not found | 404 | `SLOT_NOT_FOUND` |
| Slot in the past | 422 | `SLOT_IN_PAST` |
| Booking not owned by user | 403 | `FORBIDDEN` |
| Booking already cancelled | 409 | `BOOKING_ALREADY_CANCELLED` |
| Brochure rate limit exceeded | 429 | `RATE_LIMIT_EXCEEDED` |
| Missing required fields | 400 | `VALIDATION_ERROR` |