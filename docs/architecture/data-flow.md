# Data Flow — Lomash Wood Backend

## Overview

This document maps how data moves through the Lomash Wood system for each major business flow. Each flow traces the path from client request through the API gateway, into the relevant service(s), to storage, and any resulting async side effects.

---

## 1. User Registration & Login Flow

```
Client
  │ POST /v1/auth/register
  │ { email, password, firstName, lastName }
  ▼
API Gateway
  │ Zod validate → rate-limit check (5 req/min per IP)
  │ Forward to auth-service :3001
  ▼
auth-service
  │ AuthService.register()
  │   ├── Check email uniqueness (PostgreSQL lomash_auth)
  │   ├── bcrypt.hash(password, 12)
  │   ├── prisma.user.create()
  │   ├── Generate email verification OTP
  │   ├── Store OTP in Redis db:0  key=otp:{userId}  TTL=10min
  │   └── Publish event → event bus
  │         topic: "user.created"
  │         payload: { userId, email, firstName }
  ▼
PostgreSQL lomash_auth
  └── users table: new row

Redis db:0
  └── otp:{userId} = <6-digit code>  TTL 10 min

Event Bus (async)
  └── notification-service consumes "user.created"
        → Send welcome email via SES
        → Template: welcome-email
  └── analytics-service consumes "user.created"
        → Insert TrackingEvent { type: "user_registered" }

Response: 201 { userId, email, message: "Verify your email" }
```

---

## 2. Product Browse & Filter Flow (FR2.0 — Infinite Scroll)

```
Client
  │ GET /v1/products?category=KITCHEN
  │   &filter[colour]=white&filter[style]=shaker
  │   &sort=-createdAt&cursor=<last_id>&limit=20
  ▼
API Gateway
  │ Validate query params (Zod)
  │ No auth required (public route)
  │ Forward → product-service :3002
  ▼
product-service
  │ ProductService.list()
  │   ├── Build Redis cache key:
  │   │     key = product:list:{hash(queryString)}
  │   ├── Cache HIT → return cached JSON (TTL 60s)
  │   └── Cache MISS:
  │         ├── Prisma query with cursor pagination
  │         │     WHERE category = KITCHEN
  │         │     AND   colour IN (white)
  │         │     ORDER BY createdAt DESC
  │         │     TAKE 21  (one extra for hasNextPage)
  │         ├── Map to ProductDTO
  │         ├── Cache result in Redis  TTL 60s
  │         └── Return { data: Product[], nextCursor, hasNextPage }
  ▼
Response: 200 { data: [...20 products], nextCursor: "uuid", hasNextPage: true }

Client renders cards → user scrolls → repeat with nextCursor
```

---

## 3. Book Appointment Flow (FR5.0 — 4-step form)

```
Step 1–3: Client collects form data locally (no API calls)

Step 4: Client submits
  │ POST /v1/appointments
  │ Authorization: Bearer <token>
  │ {
  │   type: "HOME_MEASUREMENT",
  │   forKitchen: true,
  │   forBedroom: true,
  │   firstName, lastName, email, phone, postcode, address,
  │   slotId: "uuid"
  │ }
  ▼
API Gateway
  │ Verify JWT → attach userId to request
  │ Zod validate body
  │ Forward → appointment-service :3004
  ▼
appointment-service
  │ BookingService.create()
  │   ├── Verify slot exists and isBooked=false
  │   │     (Redis lock key=slot:lock:{slotId}  TTL=30s  to prevent race)
  │   ├── BEGIN TRANSACTION
  │   │     ├── prisma.timeSlot.update({ isBooked: true })
  │   │     ├── prisma.booking.create({ ...details, status: PENDING })
  │   │     └── COMMIT
  │   ├── Release Redis slot lock
  │   ├── Generate referenceCode (BK-YYYYMMDD-XXXX)
  │   └── Publish events:
  │         topic: "booking.created"
  │         payload: { bookingId, userId, type, forKitchen, forBedroom,
  │                    email, referenceCode, slotStartsAt }
  ▼
PostgreSQL lomash_appointments
  ├── time_slots: isBooked = true
  └── bookings: new row (status: PENDING)

Redis db:3
  └── slot:lock:{slotId} released

Event Bus (async — non-blocking to client)
  └── notification-service consumes "booking.created"
        ├── Send acknowledgement email to customer (FR5.5)
        │     Template: booking-confirmation
        │     To: customer email
        │     Data: { referenceCode, type, slotStartsAt, ... }
        │
        └── IF forKitchen=true AND forBedroom=true (FR5.6):
              Send internal alert emails
              To: kitchen-team@lomashwood.co.uk
              To: bedroom-team@lomashwood.co.uk
              Template: internal-dual-booking-alert

  └── analytics-service consumes "booking.created"
        → TrackingEvent { type: "booking_created", category: "appointment" }

Response: 201 { bookingId, referenceCode, status: "PENDING" }
```

---

## 4. Payment Flow (Stripe — FR payments)

```
Client
  │ POST /v1/payments/create-intent
  │ Authorization: Bearer <token>
  │ { orderId, amount, currency: "GBP" }
  ▼
API Gateway → order-payment-service :3003
  │
  ▼
PaymentService.createIntent()
  ├── Validate orderId belongs to authenticated user
  ├── Check idempotency key (Redis db:2  key=idempotency:{key}  TTL=24h)
  │     HIT → return cached PaymentIntent clientSecret
  ├── MISS:
  │     ├── stripe.paymentIntents.create({
  │     │     amount: <pence>,  ← £ × 100
  │     │     currency: "gbp",
  │     │     metadata: { orderId, userId }
  │     │   })
  │     ├── prisma.payment.create({ stripePaymentIntentId, status: PENDING })
  │     └── Cache idempotency key in Redis
  │
Response: 200 { clientSecret: "pi_xxx_secret_xxx" }

Client (Stripe.js)
  │ stripe.confirmPayment({ clientSecret, elements })
  │ Payment processed directly between client and Stripe

Stripe → POST /v1/webhooks/stripe
  │ stripe-signature header
  ▼
API Gateway
  │ Raw body preserved (no JSON parse — Stripe signature requires raw bytes)
  │ Forward → order-payment-service :3003/webhooks/stripe
  ▼
WebhookHandler.handle()
  ├── stripe.webhooks.constructEvent(rawBody, signature, webhookSecret)
  ├── Check event idempotency (Redis  key=webhook:{stripeEventId})
  │
  ├── CASE payment_intent.succeeded:
  │     BEGIN TRANSACTION
  │       ├── prisma.payment.update({ status: SUCCEEDED })
  │       ├── prisma.order.update({ status: CONFIRMED })
  │       └── prisma.invoice.create({ ... })
  │     COMMIT
  │     Publish "payment.succeeded" → event bus
  │
  └── CASE payment_intent.payment_failed:
        prisma.payment.update({ status: FAILED, failureCode, failureMessage })
        Publish "payment.failed" → event bus

Event Bus (async)
  └── notification-service consumes "payment.succeeded"
        → Send payment receipt email to customer
        → Template: payment-receipt
  └── customer-service consumes "payment.succeeded"
        → Credit loyalty points to LoyaltyAccount
  └── analytics-service consumes "payment.succeeded"
        → Record Conversion event
```

---

## 5. Brochure Request Flow (FR8.0)

```
Client (unauthenticated)
  │ POST /v1/brochures
  │ { firstName, lastName, email, phone, postcode, address }
  ▼
API Gateway
  │ Rate limit: 3 requests per email per hour
  │ Zod validate
  │ Forward → appointment-service :3004
  ▼
BrochureService.create()
  ├── prisma.brochureRequest.create({ ...fields })
  └── Publish "brochure.requested" → event bus

PostgreSQL lomash_appointments
  └── brochure_requests: new row

Event Bus (async)
  └── notification-service consumes "brochure.requested"
        ├── Send brochure PDF to customer
        │     Template: brochure-delivery
        │     Attachment: brochure.pdf (fetched from S3)
        └── (No internal alert required per FR8.2)

Response: 201 { message: "Brochure on its way" }
```

---

## 6. Content Publish Flow (CMS — FR9.6)

```
Admin (authenticated — role: ADMIN)
  │ POST /v1/blog
  │ Authorization: Bearer <admin-token>
  │ { title, content, status: "PUBLISHED", ... }
  ▼
API Gateway → content-service :3005
  ▼
BlogService.create()
  ├── Validate admin role
  ├── Generate slug from title (unaccent + lowercased)
  ├── prisma.blog.create({ status: PUBLISHED, publishedAt: NOW() })
  ├── Invalidate Redis cache: DEL blog:list:*
  └── Publish "blog.published" → event bus

PostgreSQL lomash_content
  └── blogs: new row

CloudFront cache invalidation
  └── content-service calls CloudFront API:
        CreateInvalidation paths=["/v1/blog/*"]

Event Bus (async)
  └── analytics-service consumes "blog.published"
        → Trigger sitemap rebuild job
        → Record TrackingEvent { type: "content_published" }

Response: 201 { blogId, slug, status: "PUBLISHED" }
```

---

## 7. Media Upload Flow (FR uploads)

```
Admin / Content Manager
  │ POST /v1/uploads
  │ Authorization: Bearer <admin-token>
  │ Content-Type: multipart/form-data
  │ file: <binary>
  ▼
API Gateway
  │ Check file size ≤ 10MB
  │ Validate MIME type (image/jpeg, image/png, image/webp, video/mp4)
  │ Forward → content-service :3005
  ▼
UploadService.upload()
  ├── Generate unique S3 key:
  │     media/{year}/{month}/{uuid}.{ext}
  ├── Resize image with sharp (if image/jpeg or image/png):
  │     - Original: stored as-is
  │     - Large:  1920px wide
  │     - Medium:  800px wide
  │     - Thumb:   300px wide
  ├── s3.putObject({ Bucket: lomash-media, Key, Body, ContentType })
  ├── prisma.mediaAsset.create({ key, url, mimeType, sizeBytes })
  └── Return CDN URL (CloudFront domain + key)

S3 (lomash-media bucket)
  └── media/2026/02/{uuid}.webp

CloudFront
  └── Serves file at https://cdn.lomashwood.co.uk/media/2026/02/{uuid}.webp

Response: 201 {
  mediaId: "uuid",
  url: "https://cdn.lomashwood.co.uk/media/...",
  variants: { original, large, medium, thumb }
}
```

---

## 8. Analytics Event Tracking Flow (FR — GTM integration)

```
Client browser (via GTM / direct beacon)
  │ POST /v1/analytics/track
  │ {
  │   event: "product_viewed",
  │   properties: { productId, category: "KITCHEN" },
  │   sessionId: "...",
  │   pageUrl: "...",
  │   referrer: "..."
  │ }
  ▼
API Gateway
  │ Rate limit: 100 events/min per IP
  │ No auth required (anonymous tracking)
  │ Forward → analytics-service :3008
  ▼
TrackingService.ingest()
  ├── Write to Redis event buffer:
  │     LPUSH analytics:buffer <serialized event>
  │     (Flushed to PostgreSQL every 10s by background job)
  └── Return immediately (fire-and-forget)

Response: 202 Accepted

Background job (every 10s):
  ├── LRANGE analytics:buffer 0 999 (batch of up to 1000)
  ├── prisma.trackingEvent.createMany([...])
  ├── LTRIM analytics:buffer 1000 -1
  └── Recompute funnel aggregates if conversion events present
```

---

## 9. Inter-Service Communication Pattern

Services never call each other's databases directly. The two approved patterns are:

### Pattern A — Synchronous HTTP (via API Gateway)
Used when a service needs validated data from another domain that it doesn't own.

```
order-payment-service needs to verify a product exists before creating an order

order-payment-service
  └── http-client.get(`${PRODUCT_SERVICE_URL}/internal/products/${productId}`)
        │ Internal route — not exposed through API gateway
        │ X-Internal-Token: <shared secret>
        ▼
      product-service /internal/products/:id
        └── Return ProductDTO
```

### Pattern B — Domain Events (async)
Used for side effects that should not block the response to the user.

```
appointment-service creates a booking
  └── eventBus.publish("booking.created", { ... })
        │
        ├── notification-service (subscribed)
        │     → send email
        └── analytics-service (subscribed)
              → record event
```

### What is NOT allowed

```
❌ appointment-service → SELECT * FROM lomash_products.products
❌ order-payment-service → import { UserRepository } from '../../auth-service/...'
❌ Any service → prisma.$executeRaw on another service's database URL
```

---

## Event Bus Envelope

All events published to the bus follow this standard shape:

```typescript
{
  id:         "01930000-0000-7000-0000-000000000000",  // UUIDv7
  topic:      "booking.created",
  version:    1,
  timestamp:  "2026-02-19T10:30:00.000Z",
  producerId: "appointment-service",
  correlationId: "req-abc123",  // ties back to originating HTTP request
  payload: {
    // topic-specific fields — defined in packages/shared-types
  }
}
```

Consumers use the `id` field as an idempotency key — if the same event is delivered twice (at-least-once delivery guarantee), the consumer checks Redis before processing:

```typescript
const alreadyProcessed = await redis.get(`processed:event:${event.id}`)
if (alreadyProcessed) return
await redis.set(`processed:event:${event.id}`, '1', 'EX', 86400)
// process event...
```