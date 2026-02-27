# Sequence Diagram — Notification Flow

## Overview

Covers the complete notification lifecycle: event consumption from the bus, multi-channel dispatch (email via SES, SMS via Twilio, push via FCM), template rendering, delivery tracking, retry logic on failure, dead-letter handling, and the admin notification dashboard. All notification sends are async and non-blocking to the originating HTTP response.

---

## 1. Notification Service Architecture

```
Event Bus (Redis pub/sub / SQS)
  │
  │  Topics consumed by notification-service:
  │  ├── user.created           → welcome email
  │  ├── booking.created        → confirmation email + optional dual-team alert
  │  ├── booking.cancelled      → cancellation email
  │  ├── booking.reminder       → 24h reminder email + SMS
  │  ├── payment.succeeded      → receipt email
  │  ├── payment.failed         → failure email + retry prompt
  │  ├── refund.issued          → refund confirmation email
  │  └── brochure.requested     → brochure delivery email (PDF attachment)
  │
  ▼
notification-service :3007
  │
  ├── EmailWorker (BullMQ queue: email:send)
  │     └── SES via Nodemailer → failover to SendGrid
  │
  ├── SmsWorker (BullMQ queue: sms:send)
  │     └── Twilio → failover to MSG91
  │
  └── PushWorker (BullMQ queue: push:send)
        └── Firebase Cloud Messaging (FCM)
```

---

## 2. Event Consumed → Email Dispatched (booking.created)

```
appointment-svc     Event Bus         notification-svc      PostgreSQL(notif)   BullMQ(Redis:6)   SES / Nodemailer
  │                    │                    │                      │                  │                  │
  │ Publish event      │                    │                      │                  │                  │
  │ "booking.created"  │                    │                      │                  │                  │
  │ {                  │                    │                      │                  │                  │
  │  id: "evt-uuid",   │                    │                      │                  │                  │
  │  topic: "booking.  │                    │                      │                  │                  │
  │   created",        │                    │                      │                  │                  │
  │  payload: {        │                    │                      │                  │                  │
  │   bookingId,       │                    │                      │                  │                  │
  │   referenceCode:   │                    │                      │                  │                  │
  │    "BK-0042",      │                    │                      │                  │                  │
  │   email,firstName, │                    │                      │                  │                  │
  │   slotStartsAt,    │                    │                      │                  │                  │
  │   forKitchen:true, │                    │                      │                  │                  │
  │   forBedroom:true  │                    │                      │                  │                  │
  │  }                 │                    │                      │                  │                  │
  │ }                  │                    │                      │                  │                  │
  │───────────────────▶│                    │                      │                  │                  │
  │                    │                    │ Consume event        │                  │                  │
  │                    │───────────────────▶│                      │                  │                  │
  │                    │                    │                      │                  │                  │
  │                    │                    │ Idempotency check:   │                  │                  │
  │                    │                    │ EXISTS processed:    │                  │                  │
  │                    │                    │ event:evt-uuid       │                  │                  │
  │                    │                    │──────────────────────────────────────── ▶│                  │
  │                    │                    │ ◀── false (not seen) │                  │                  │
  │                    │                    │ SET processed:event: │                  │                  │
  │                    │                    │ evt-uuid "1" EX 86400│                  │                  │
  │                    │                    │──────────────────────────────────────── ▶│                  │
  │                    │                    │                      │                  │                  │
  │                    │                    │ Route to handler:    │                  │                  │
  │                    │                    │ BookingCreatedHandler│                  │                  │
  │                    │                    │                      │                  │                  │
  │                    │                    │ Fetch template:      │                  │                  │
  │                    │                    │ SELECT * FROM        │                  │                  │
  │                    │                    │ email_templates      │                  │                  │
  │                    │                    │ WHERE key =          │                  │                  │
  │                    │                    │ "booking-confirmation│                  │                  │
  │                    │                    │──────────────────── ▶│                  │                  │
  │                    │                    │ ◀── { subject,       │                  │                  │
  │                    │                    │       htmlBody,      │                  │                  │
  │                    │                    │       textBody }     │                  │                  │
  │                    │                    │                      │                  │                  │
  │                    │                    │ Render template:     │                  │                  │
  │                    │                    │ Handlebars.compile({ │                  │                  │
  │                    │                    │  firstName,          │                  │                  │
  │                    │                    │  referenceCode,      │                  │                  │
  │                    │                    │  slotStartsAt,       │                  │                  │
  │                    │                    │  type:"Home Measure" │                  │                  │
  │                    │                    │ })                   │                  │                  │
  │                    │                    │                      │                  │                  │
  │                    │                    │ INSERT notification_ │                  │                  │
  │                    │                    │ logs {               │                  │                  │
  │                    │                    │  channel: EMAIL,     │                  │                  │
  │                    │                    │  recipient: email,   │                  │                  │
  │                    │                    │  templateKey,        │                  │                  │
  │                    │                    │  status: QUEUED,     │                  │                  │
  │                    │                    │  eventId: evt-uuid   │                  │                  │
  │                    │                    │ }                    │                  │                  │
  │                    │                    │──────────────────── ▶│                  │                  │
  │                    │                    │                      │                  │                  │
  │                    │                    │ Enqueue job:         │                  │                  │
  │                    │                    │ emailQueue.add(      │                  │                  │
  │                    │                    │  "send",             │                  │                  │
  │                    │                    │  { to, subject,      │                  │                  │
  │                    │                    │    html, text,       │                  │                  │
  │                    │                    │    notifLogId },     │                  │                  │
  │                    │                    │  { attempts:5,       │                  │                  │
  │                    │                    │    backoff:{         │                  │                  │
  │                    │                    │     type:'exponential│                  │                  │
  │                    │                    │     delay:1000}}     │                  │                  │
  │                    │                    │ )                    │                  │                  │
  │                    │                    │──────────────────────────────────────── ▶│                  │
  │                    │                    │                      │                  │                  │
  │                    │                    │                      │        EmailWorker dequeues         │
  │                    │                    │                      │                  │──────────────── ▶│
  │                    │                    │                      │                  │  nodemailer      │
  │                    │                    │                      │                  │  .sendMail({     │
  │                    │                    │                      │                  │   from:          │
  │                    │                    │                      │                  │    noreply@      │
  │                    │                    │                      │                  │    lomashwood,   │
  │                    │                    │                      │                  │   to, subject,   │
  │                    │                    │                      │                  │   html, text     │
  │                    │                    │                      │                  │  })              │
  │                    │                    │                      │                  │ ◀── messageId    │
  │                    │                    │                      │                  │                  │
  │                    │                    │                      │                  │ UPDATE notif_logs│
  │                    │                    │                      │                  │ SET status=SENT  │
  │                    │                    │                      │                  │ sentAt=NOW()     │
  │                    │                    │                      │                  │ messageId=...    │
  │                    │                    │──────────────────── ▶│                  │                  │
```

---

## 3. Dual-Team Alert — Kitchen + Bedroom Booking (FR5.6)

```
notification-svc       notification_templates     SES / Nodemailer
  │                           │                         │
  │ BookingCreatedHandler      │                         │
  │ detects forKitchen=true    │                         │
  │ AND forBedroom=true        │                         │
  │                           │                         │
  │ Enqueue TWO email jobs:   │                         │
  │                           │                         │
  │ Job 1: kitchen alert      │                         │
  │  to: kitchen-team@        │                         │
  │       lomashwood.co.uk    │                         │
  │  template: "internal-     │                         │
  │   kitchen-booking-alert"  │                         │
  │  data: { bookingId,       │                         │
  │   customerName,           │                         │
  │   slot, postcode }        │                         │
  │──────────────────────────────────────────────────── ▶│
  │                           │                         │ Send to kitchen team
  │                           │                         │
  │ Job 2: bedroom alert      │                         │
  │  to: bedroom-team@        │                         │
  │       lomashwood.co.uk    │                         │
  │  template: "internal-     │                         │
  │   bedroom-booking-alert"  │                         │
  │──────────────────────────────────────────────────── ▶│
  │                           │                         │ Send to bedroom team
  │                           │                         │
  │ UPDATE notification_logs  │                         │
  │ (two rows, one per alert) │                         │
```

---

## 4. Appointment Reminder — 24h Before (Cron Job)

```
Scheduler          appointment-svc     Event Bus        notification-svc      SES          Twilio
  │                    │                   │                  │                  │              │
  │ CRON: every 15min  │                   │                  │                  │              │
  │───────────────────▶│                   │                  │                  │              │
  │                    │ SELECT bookings   │                  │                  │              │
  │                    │ WHERE             │                  │                  │              │
  │                    │  status=CONFIRMED │                  │                  │              │
  │                    │  AND reminderSent │                  │                  │              │
  │                    │   =false          │                  │                  │              │
  │                    │  AND slot.startsAt│                  │                  │              │
  │                    │   BETWEEN NOW()+  │                  │                  │              │
  │                    │   23h AND NOW()+  │                  │                  │              │
  │                    │   25h             │                  │                  │              │
  │                    │                   │                  │                  │              │
  │                    │ FOR EACH booking: │                  │                  │              │
  │                    │ Publish           │                  │                  │              │
  │                    │ "booking.reminder"│                  │                  │              │
  │                    │───────────────── ▶│                  │                  │              │
  │                    │                   │                  │                  │              │
  │                    │ UPDATE bookings   │                  │                  │              │
  │                    │ SET reminderSent  │                  │                  │              │
  │                    │  =true            │                  │                  │              │
  │                    │                   │ Consume          │                  │              │
  │                    │                   │───────────────── ▶│                 │              │
  │                    │                   │                  │ Enqueue:         │              │
  │                    │                   │                  │  email job       │              │
  │                    │                   │                  │  template:       │              │
  │                    │                   │                  │  "appt-reminder" │              │
  │                    │                   │                  │──────────────── ▶│              │
  │                    │                   │                  │                  │ Reminder email
  │                    │                   │                  │                  │ to customer  │
  │                    │                   │                  │                  │              │
  │                    │                   │                  │ Enqueue:         │              │
  │                    │                   │                  │  SMS job         │              │
  │                    │                   │                  │  "Hi Jane, your  │              │
  │                    │                   │                  │  appointment is  │              │
  │                    │                   │                  │  tomorrow at     │              │
  │                    │                   │                  │  10:00am"        │              │
  │                    │                   │                  │─────────────────────────────── ▶│
  │                    │                   │                  │                  │  SMS delivered│
```

---

## 5. Email Failure → Retry → Fallback → Dead Letter

```
BullMQ (email:send)    EmailWorker      SES (primary)     SendGrid (fallback)    DLQ / Alert
  │                       │                  │                    │                   │
  │ Dequeue job           │                  │                    │                   │
  │ attempt 1             │                  │                    │                   │
  │──────────────────────▶│                  │                    │                   │
  │                       │ nodemailer       │                    │                   │
  │                       │ .sendMail(...)   │                    │                   │
  │                       │─────────────────▶│                    │                   │
  │                       │ ◀── Error 503    │                    │                   │
  │                       │ (SES outage)     │                    │                   │
  │                       │                  │                    │                   │
  │ Retry delay:          │                  │                    │                   │
  │ 1s (exponential)      │                  │                    │                   │
  │                       │                  │                    │                   │
  │ Dequeue attempt 2     │                  │                    │                   │
  │──────────────────────▶│                  │                    │                   │
  │                       │──────────────────▶│                   │                   │
  │                       │ ◀── Error 503    │                    │                   │
  │                       │                  │                    │                   │
  │ Retry delay: 2s ...   │                  │                    │                   │
  │ attempt 3,4,5         │                  │                    │                   │
  │ (all fail on SES)     │                  │                    │                   │
  │                       │                  │                    │                   │
  │                       │ After attempt 3: │                    │                   │
  │                       │ Switch to        │                    │                   │
  │                       │ fallback provider│                    │                   │
  │                       │────────────────────────────────────── ▶│                  │
  │                       │ ◀── 200 (sent)   │                    │                   │
  │                       │                  │                    │                   │
  │                       │ UPDATE notif_log │                    │                   │
  │                       │ status=SENT      │                    │                   │
  │                       │ provider=SENDGRID│                    │                   │
  │                       │                  │                    │                   │
  │ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ All 5 attempts fail ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ │                   │
  │                       │                  │                    │                   │
  │ Move to dead-letter   │                  │                    │                   │
  │ queue (DLQ)           │                  │                    │                   │
  │──────────────────────────────────────────────────────────────────────────────── ▶│
  │                       │                  │                    │                   │
  │                       │                  │                    │   SNS alert fired  │
  │                       │                  │                    │   → ops email +   │
  │                       │                  │                    │     Slack webhook  │
  │                       │                  │                    │                   │
  │                       │ UPDATE notif_log │                    │                   │
  │                       │ status=FAILED    │                    │                   │
  │                       │ failedAt=NOW()   │                    │                   │
  │                       │ errorMessage=... │                    │                   │
  │                       │                  │                    │                   │
  │                       │ retry-failed-    │                    │                   │
  │                       │ notifications.   │                    │                   │
  │                       │ job.ts replays   │                    │                   │
  │                       │ DLQ every 15min  │                    │                   │
  │                       │ for up to 24h    │                    │                   │
```

---

## 6. SMS Dispatch (Booking Reminder)

```
BullMQ (sms:send)      SmsWorker        Twilio API        MSG91 (fallback)
  │                       │                  │                    │
  │ Dequeue SMS job       │                  │                    │
  │ { to: "+447...",      │                  │                    │
  │   body: "Hi Jane,     │                  │                    │
  │    your Lomash Wood   │                  │                    │
  │    appointment is     │                  │                    │
  │    tomorrow at 10am.  │                  │                    │
  │    Ref: BK-0042",     │                  │                    │
  │   notifLogId }        │                  │                    │
  │──────────────────────▶│                  │                    │
  │                       │ twilio.messages  │                    │
  │                       │ .create({        │                    │
  │                       │  body,           │                    │
  │                       │  from:"+44800.." │                    │
  │                       │  to:"+447..."    │                    │
  │                       │ })               │                    │
  │                       │─────────────────▶│                    │
  │                       │ ◀── { sid,       │                    │
  │                       │  status:"queued" }│                   │
  │                       │                  │                    │
  │                       │ UPDATE notif_log │                    │
  │                       │ status=SENT      │                    │
  │                       │ providerId=sid   │                    │
  │                       │                  │                    │
  │ ─ ─ ─ ─ Twilio fails ─ ─ ─ ─ ─ ─ ─ ─ ─ │                    │
  │                       │ ◀── Error        │                    │
  │                       │ Switch fallback  │                    │
  │                       │────────────────────────────────────── ▶│
  │                       │ ◀── 200 (queued) │                    │
  │                       │ UPDATE notif_log │                    │
  │                       │ provider=MSG91   │                    │
```

---

## 7. Push Notification Dispatch

```
BullMQ (push:send)     PushWorker        FCM (Firebase)
  │                       │                  │
  │ Dequeue push job      │                  │
  │ { fcmToken: "...",    │                  │
  │   title: "Booking     │                  │
  │    Confirmed!",       │                  │
  │   body: "Your appt   │                  │
  │    is confirmed.      │                  │
  │    Ref: BK-0042",     │                  │
  │   data: { bookingId } │                  │
  │ }                     │                  │
  │──────────────────────▶│                  │
  │                       │ fcm.send({       │
  │                       │  token:fcmToken, │                  
  │                       │  notification:{  │                  
  │                       │   title, body }, │                  
  │                       │  data:{ bookingId│                  
  │                       │  },              │                  
  │                       │  apns:{          │
  │                       │   payload:{      │
  │                       │    aps:{         │
  │                       │     sound:'default'
  │                       │    }            │
  │                       │   }             │
  │                       │  }              │
  │                       │ })              │
  │                       │────────────────▶│
  │                       │ ◀── { name:     │
  │                       │  "projects/.../ │
  │                       │  messages/id" } │
  │                       │                 │
  │                       │ UPDATE notif_log│
  │                       │ status=SENT     │
  │                       │ providerId=name │
  │                       │                 │
  │  ─ ─ Invalid token ─ ─│                 │
  │                       │ ◀── UNREGISTERED│
  │                       │ → Log as FAILED │
  │                       │ → Remove stale  │
  │                       │   FCM token from│
  │                       │   customer      │
  │                       │   profile (via  │
  │                       │   event bus)    │
```

---

## 8. Brochure Delivery Email with PDF Attachment (FR8.2)

```
Event Bus          notification-svc       S3 (media bucket)      SES / Nodemailer
  │                    │                        │                       │
  │ "brochure.         │                        │                       │
  │  requested"        │                        │                       │
  │  { requestId,      │                        │                       │
  │    email,          │                        │                       │
  │    firstName }     │                        │                       │
  │───────────────────▶│                        │                       │
  │                    │ BrochureHandler        │                       │
  │                    │                        │                       │
  │                    │ Fetch PDF from S3:     │                       │
  │                    │ s3.getObject({         │                       │
  │                    │  Bucket:"lomash-assets"│                       │
  │                    │  Key:"brochures/       │                       │
  │                    │   lomash-wood-         │                       │
  │                    │   brochure-2026.pdf"   │                       │
  │                    │ })                     │                       │
  │                    │───────────────────────▶│                       │
  │                    │ ◀── PDF Buffer (4.2MB) │                       │
  │                    │                        │                       │
  │                    │ Render template:       │                       │
  │                    │ "brochure-delivery"    │                       │
  │                    │ { firstName,           │                       │
  │                    │   requestId }          │                       │
  │                    │                        │                       │
  │                    │ Send email:            │                       │
  │                    │ { to: customer,        │                       │
  │                    │   subject: "Your       │                       │
  │                    │    Lomash Wood          │                       │
  │                    │    Brochure",          │                       │
  │                    │   html: rendered,      │                       │
  │                    │   attachments: [{      │                       │
  │                    │    filename:           │                       │
  │                    │     "brochure.pdf",    │                       │
  │                    │    content: pdfBuffer, │                       │
  │                    │    contentType:        │                       │
  │                    │     "application/pdf"  │                       │
  │                    │   }]                   │                       │
  │                    │ }                      │                       │
  │                    │───────────────────────────────────────────────▶│
  │                    │ ◀── { messageId }      │                       │
  │                    │                        │                       │
  │                    │ UPDATE brochure_       │                       │
  │                    │ requests SET sentAt=   │                       │
  │                    │ NOW() (via event or    │                       │
  │                    │ internal API call)     │                       │
```

---

## 9. Notification Preferences & Unsubscribe

```
Client             API Gateway        customer-svc        notification-svc     PostgreSQL(cust)
  │                   │                    │                    │                    │
  │ PATCH /v1/        │                    │                    │                    │
  │  customers/me/    │                    │                    │                    │
  │  preferences      │                    │                    │                    │
  │ {                 │                    │                    │                    │
  │  emailMarketing:  │                    │                    │                    │
  │   false,          │                    │                    │                    │
  │  smsReminders:    │                    │                    │                    │
  │   true,           │                    │                    │                    │
  │  pushNotifications│                    │                    │                    │
  │   :true           │                    │                    │                    │
  │ }                 │                    │                    │                    │
  │──────────────────▶│───────────────────▶│                    │                    │
  │                   │                    │ UPDATE notif_      │                    │
  │                   │                    │ preferences WHERE  │                    │
  │                   │                    │ userId=me          │                    │
  │                   │                    │───────────────────────────────────────▶│
  │ ◀─────────────────│◀───────────────────│                    │                    │
  │ 200 { preferences }│                   │                    │                    │
  │                   │                    │                    │                    │
  │                   │                    │                    │                    │
  │  ─ ─ ─ ─ ─ ─ ─ notification-svc checks preferences before every send ─ ─ ─ ─ ─▶│
  │                   │                    │                    │ SELECT email_      │
  │                   │                    │                    │ marketing FROM     │
  │                   │                    │                    │ notif_preferences  │
  │                   │                    │                    │ WHERE userId=?     │
  │                   │                    │                    │ ◀── false          │
  │                   │                    │                    │ SKIP send          │
  │                   │                    │                    │ Log as SUPPRESSED  │
```

---

## 10. Delivery Status Tracking

```
notification-svc     SES (SNS bounce webhook)     PostgreSQL (notif)
  │                           │                         │
  │  SES delivers email       │                         │
  │  to recipient mailbox     │                         │
  │                           │                         │
  │  ─ ─ ─ Bounce scenario ─ ─│                         │
  │                           │                         │
  │  SES detects hard bounce  │                         │
  │  (invalid address)        │                         │
  │  POST /v1/webhooks/ses    │                         │
  │ ◀─────────────────────────│                         │
  │                           │                         │
  │ Update notif_logs:        │                         │
  │ status = BOUNCED          │                         │
  │ bouncedAt = NOW()         │                         │
  │──────────────────────────────────────────────────── ▶│
  │                           │                         │
  │ Publish "email.bounced"   │                         │
  │ → customer-service        │                         │
  │   flags email as invalid  │                         │
  │   on Profile              │                         │
```

---

## Notification Log States

```
QUEUED → SENT
QUEUED → FAILED (after max retries) → DLQ
SENT   → BOUNCED (SES bounce webhook)
QUEUED → SUPPRESSED (preference opt-out)
```

---

## Template Keys Reference

| Template Key | Trigger Event | Channel | Recipients |
|-------------|--------------|---------|-----------|
| `welcome-email` | `user.created` | EMAIL | Customer |
| `booking-confirmation` | `booking.created` | EMAIL | Customer |
| `internal-kitchen-booking-alert` | `booking.created` (forKitchen) | EMAIL | kitchen-team@ |
| `internal-bedroom-booking-alert` | `booking.created` (forBedroom) | EMAIL | bedroom-team@ |
| `booking-cancellation` | `booking.cancelled` | EMAIL | Customer |
| `appt-reminder-email` | `booking.reminder` | EMAIL | Customer |
| `appt-reminder-sms` | `booking.reminder` | SMS | Customer |
| `payment-receipt` | `payment.succeeded` | EMAIL | Customer |
| `payment-failed` | `payment.failed` | EMAIL | Customer |
| `refund-confirmation` | `refund.issued` | EMAIL | Customer |
| `brochure-delivery` | `brochure.requested` | EMAIL | Requester |

---

## Error States Summary

| Scenario | Resolution |
|----------|-----------|
| SES 503 (outage) | Retry × 3 → fallback SendGrid |
| SES hard bounce | Mark log BOUNCED, flag email on Profile |
| Invalid FCM token | Mark log FAILED, purge stale token |
| Twilio timeout | Retry × 2 → fallback MSG91 |
| All providers fail | Move to DLQ, alert ops via SNS, retry every 15 min for 24h |
| Preference opt-out | Skip send, log as SUPPRESSED (no retry) |
| Duplicate event delivery | Idempotency key blocks double-send |