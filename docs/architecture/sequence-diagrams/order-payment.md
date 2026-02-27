# Sequence Diagram — Order & Payment Flow

## Overview

Covers the complete order and payment lifecycle: order creation, Stripe payment intent, client-side card capture, webhook processing, invoice generation, and refund flow.

---

## 1. Create Order

```
Client             API Gateway       order-payment-svc    product-svc (internal)  PostgreSQL
  │                   │                    │                      │                    │
  │ POST /v1/orders   │                    │                      │                    │
  │ Authorization:    │                    │                      │                    │
  │  Bearer <token>   │                    │                      │                    │
  │ {                 │                    │                      │                    │
  │  items: [         │                    │                      │                    │
  │   { productId:    │                    │                      │                    │
  │     "uuid",       │                    │                      │                    │
  │     sizeId:"uuid",│                    │                      │                    │
  │     quantity: 1 } │                    │                      │                    │
  │  ],               │                    │                      │                    │
  │  couponCode:"SAVE"│                    │                      │                    │
  │ }                 │                    │                      │                    │
  │──────────────────▶│─────────────────── ▶│                     │                    │
  │                   │                    │ Validate items       │                    │
  │                   │                    │ (not empty, qty > 0) │                    │
  │                   │                    │                      │                    │
  │                   │                    │ Verify products exist│                    │
  │                   │                    │ GET /internal/       │                    │
  │                   │                    │ products/batch       │                    │
  │                   │                    │ { ids: [uuid1] }     │                    │
  │                   │                    │─────────────────────▶│                    │
  │                   │                    │ ◀── [{ id, price,    │                    │
  │                   │                    │       isActive }]    │                    │
  │                   │                    │                      │                    │
  │                   │                    │ Calculate totals:    │                    │
  │                   │                    │  subtotal = sum(     │                    │
  │                   │                    │   price × qty)       │                    │
  │                   │                    │  discount = coupon   │                    │
  │                   │                    │  tax = subtotal×0.20 │                    │
  │                   │                    │  total = all above   │                    │
  │                   │                    │                      │                    │
  │                   │                    │ BEGIN TRANSACTION    │                    │
  │                   │                    │ INSERT orders {      │                    │
  │                   │                    │  orderNumber:        │                    │
  │                   │                    │   LW-20260001,       │                    │
  │                   │                    │  userId, subtotal,   │                    │
  │                   │                    │  discount, tax,      │                    │
  │                   │                    │  total, currency:GBP │                    │
  │                   │                    │  status:PENDING      │                    │
  │                   │                    │ }                    │                    │
  │                   │                    │────────────────────────────────────────── ▶│
  │                   │                    │ INSERT order_items   │                    │
  │                   │                    │ (bulk)               │                    │
  │                   │                    │────────────────────────────────────────── ▶│
  │                   │                    │ COMMIT               │                    │
  │ ◀─────────────────│◀───────────────────│                      │                    │
  │ 201 {             │                    │                      │                    │
  │  orderId: "uuid", │                    │                      │                    │
  │  orderNumber:     │                    │                      │                    │
  │   "LW-20260001",  │                    │                      │                    │
  │  total: 8500.00,  │                    │                      │                    │
  │  currency: "GBP", │                    │                      │                    │
  │  status:"PENDING" │                    │                      │                    │
  │ }                 │                    │                      │                    │
```

---

## 2. Create Stripe Payment Intent

```
Client             API Gateway       order-payment-svc       Stripe API         Redis (db:2)
  │                   │                    │                      │                    │
  │ POST /v1/payments │                    │                      │                    │
  │  /create-intent   │                    │                      │                    │
  │ Authorization:    │                    │                      │                    │
  │  Bearer <token>   │                    │                      │                    │
  │ Idempotency-Key:  │                    │                      │                    │
  │  client-uuid-abc  │                    │                      │                    │
  │ {                 │                    │                      │                    │
  │  orderId: "uuid"  │                    │                      │                    │
  │ }                 │                    │                      │                    │
  │──────────────────▶│─────────────────── ▶│                     │                    │
  │                   │                    │ Check idempotency:   │                    │
  │                   │                    │ GET idempotency:     │                    │
  │                   │                    │ client-uuid-abc      │                    │
  │                   │                    │ ──────────────────────────────────────── ▶│
  │                   │                    │                      │         CACHE HIT ▼│
  │ ◀─────────────────│◀───────────────────│ ◀── cached intent    │                    │
  │ 200 { clientSecret│                    │                      │                    │
  │   (from cache) }  │                    │                      │                    │
  │                   │                    │                      │         CACHE MISS▼│
  │                   │                    │ ◀── null             │                    │
  │                   │                    │                      │                    │
  │                   │                    │ Verify orderId       │                    │
  │                   │                    │ belongs to userId    │                    │
  │                   │                    │ and status=PENDING   │                    │
  │                   │                    │                      │                    │
  │                   │                    │ stripe.payment       │                    │
  │                   │                    │ Intents.create({     │                    │
  │                   │                    │  amount: 850000,     │                    │
  │                   │                    │  currency:"gbp",     │                    │
  │                   │                    │  metadata:{orderId,  │                    │
  │                   │                    │   userId},           │                    │
  │                   │                    │  automatic_payment_  │                    │
  │                   │                    │  methods:{           │                    │
  │                   │                    │   enabled:true}      │                    │
  │                   │                    │ })                   │                    │
  │                   │                    │─────────────────────▶│                    │
  │                   │                    │ ◀── { id, clientSecret                    │
  │                   │                    │       status:requires_                    │
  │                   │                    │       payment_method }│                   │
  │                   │                    │                      │                    │
  │                   │                    │ INSERT payments {    │                    │
  │                   │                    │  orderId,            │                    │
  │                   │                    │  stripePaymentIntent │                    │
  │                   │                    │   Id,                │                    │
  │                   │                    │  amount:8500.00,     │                    │
  │                   │                    │  status:PENDING,     │                    │
  │                   │                    │  idempotencyKey      │                    │
  │                   │                    │ }                    │                    │
  │                   │                    │                      │                    │
  │                   │                    │ Cache idempotency    │                    │
  │                   │                    │ key + clientSecret   │                    │
  │                   │                    │ EX 86400 (24h)       │                    │
  │                   │                    │ ──────────────────────────────────────── ▶│
  │ ◀─────────────────│◀───────────────────│                      │                    │
  │ 200 {             │                    │                      │                    │
  │  clientSecret:    │                    │                      │                    │
  │   "pi_xxx_secret" │                    │                      │                    │
  │ }                 │                    │                      │                    │
```

---

## 3. Client-Side Card Capture (Stripe.js — frontend only)

```
Client (Browser)                    Stripe.js / Stripe Servers
  │                                         │
  │ Mount <PaymentElement />                │
  │──────────────────────────────────────── ▶│
  │ ◀── Card input rendered in iframe        │
  │                                         │
  │ User enters card details                │
  │ stripe.confirmPayment({                 │
  │   clientSecret,                         │
  │   elements,                             │
  │   confirmParams: {                      │
  │    return_url: "https://...success"     │
  │   }                                     │
  │ })                                      │
  │──────────────────────────────────────── ▶│
  │                                         │ Card data tokenised
  │                                         │ Payment processed
  │                                         │ Lomash Wood backend
  │                                         │ NEVER sees card data
  │                                         │ (SAQ A compliance)
  │ ◀── Redirect to return_url             │
  │  + ?payment_intent=pi_xxx              │
  │  + &payment_intent_client_secret=...   │
  │  + &redirect_status=succeeded          │
```

---

## 4. Stripe Webhook — payment_intent.succeeded

```
Stripe               API Gateway        order-payment-svc     PostgreSQL       Redis (db:2)     notification-svc   analytics-svc
  │                      │                    │                    │                │                  │                 │
  │ POST /v1/webhooks/   │                    │                    │                │                  │                 │
  │  stripe              │                    │                    │                │                  │                 │
  │ stripe-signature: t= │                    │                    │                │                  │                 │
  │  1700000,v1=abc123   │                    │                    │                │                  │                 │
  │─────────────────────▶│                    │                    │                │                  │                 │
  │                      │ ⚠ RAW BODY        │                    │                │                  │                 │
  │                      │ forwarded — no     │                    │                │                  │                 │
  │                      │ JSON.parse         │                    │                │                  │                 │
  │                      │ (signature breaks  │                    │                │                  │                 │
  │                      │  on parsed body)   │                    │                │                  │                 │
  │                      │───────────────────▶│                    │                │                  │                 │
  │                      │                    │ stripe.webhooks    │                │                  │                 │
  │                      │                    │ .constructEvent(   │                │                  │                 │
  │                      │                    │  rawBody,          │                │                  │                 │
  │                      │                    │  signature,        │                │                  │                 │
  │                      │                    │  webhookSecret     │                │                  │                 │
  │                      │                    │ )                  │                │                  │                 │
  │                      │                    │ → event verified ✓ │                │                  │                 │
  │                      │                    │                    │                │                  │                 │
  │                      │                    │ Idempotency check: │                │                  │                 │
  │                      │                    │ SET webhook:       │                │                  │                 │
  │                      │                    │ {stripeEventId}    │                │                  │                 │
  │                      │                    │ "1" NX EX 86400   │                │                  │                 │
  │                      │                    │ ────────────────────────────────── ▶│                  │                 │
  │ ◀── 200 (immediately)│◀───────────────────│ ◀── OK (not seen) │                │                  │                 │
  │ (Stripe needs 200    │                    │                    │                │                  │                 │
  │  within 30s)         │                    │                    │                │                  │                 │
  │                      │                    │                    │                │                  │                 │
  │                      │                    │ BEGIN TRANSACTION  │                │                  │                 │
  │                      │                    │ UPDATE payments    │                │                  │                 │
  │                      │                    │ SET status=SUCCEEDED               │                  │                 │
  │                      │                    │ WHERE stripePayment│                │                  │                 │
  │                      │                    │  IntentId = pi_xxx │                │                  │                 │
  │                      │                    │ ───────────────── ▶│                │                  │                 │
  │                      │                    │ UPDATE orders      │                │                  │                 │
  │                      │                    │ SET status=CONFIRMED                │                  │                 │
  │                      │                    │ ───────────────── ▶│                │                  │                 │
  │                      │                    │ INSERT invoices {  │                │                  │                 │
  │                      │                    │  orderId,          │                │                  │                 │
  │                      │                    │  number:INV-0001,  │                │                  │                 │
  │                      │                    │  issuedAt:NOW(),   │                │                  │                 │
  │                      │                    │  dueAt:NOW(),      │                │                  │                 │
  │                      │                    │  total,currency    │                │                  │                 │
  │                      │                    │ }                  │                │                  │                 │
  │                      │                    │ ───────────────── ▶│                │                  │                 │
  │                      │                    │ COMMIT             │                │                  │                 │
  │                      │                    │                    │                │                  │                 │
  │                      │                    │ Publish "payment.  │                │  ─ ─ async ─ ─ ─▶│                 │
  │                      │                    │  succeeded"        │                │  Send receipt    │                 │
  │                      │                    │  → event bus       │                │  email to cust   │                 │
  │                      │                    │                    │                │                  │                 │
  │                      │                    │                    │                │  ─ ─ async ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─▶│
  │                      │                    │                    │                │                  │ Record Conversion│
  │                      │                    │                    │                │                  │ TrackingEvent   │
```

---

## 5. Stripe Webhook — payment_intent.payment_failed

```
Stripe               API Gateway        order-payment-svc     PostgreSQL       notification-svc
  │                      │                    │                    │                  │
  │ POST /v1/webhooks/   │                    │                    │                  │
  │  stripe              │                    │                    │                  │
  │ { type:              │                    │                    │                  │
  │  "payment_intent.    │                    │                    │                  │
  │   payment_failed",   │                    │                    │                  │
  │  data.object: {      │                    │                    │                  │
  │   id: pi_xxx,        │                    │                    │                  │
  │   last_payment_error:│                    │                    │                  │
  │   { code:"card_     │                    │                    │                  │
  │     declined",       │                    │                    │                  │
  │     message:"..." }  │                    │                    │                  │
  │  }                   │                    │                    │                  │
  │ }                    │                    │                    │                  │
  │─────────────────────▶│───────────────────▶│                    │                  │
  │                      │                    │ Verify signature   │                  │
  │                      │                    │ Idempotency check  │                  │
  │ ◀── 200              │◀───────────────────│                    │                  │
  │                      │                    │ UPDATE payments    │                  │
  │                      │                    │ SET status=FAILED  │                  │
  │                      │                    │ failureCode=       │                  │
  │                      │                    │  "card_declined"   │                  │
  │                      │                    │ ───────────────── ▶│                  │
  │                      │                    │                    │                  │
  │                      │                    │ Publish "payment.  │                  │
  │                      │                    │  failed"           │  ─ ─ ─ async ─ ─▶│
  │                      │                    │  → event bus       │  Send failure    │
  │                      │                    │                    │  email + retry   │
  │                      │                    │                    │  prompt to cust  │
```

---

## 6. Refund Flow

```
Admin Client       API Gateway       order-payment-svc       Stripe API        PostgreSQL       notification-svc
  │                   │                    │                      │                  │                  │
  │ POST /v1/refunds  │                    │                      │                  │                  │
  │ Authorization:    │                    │                      │                  │                  │
  │  Bearer <admin>   │                    │                      │                  │                  │
  │ {                 │                    │                      │                  │                  │
  │  orderId: "uuid", │                    │                      │                  │                  │
  │  amount: 8500.00, │                    │                      │                  │                  │
  │  reason: "DEFECT" │                    │                      │                  │                  │
  │ }                 │                    │                      │                  │                  │
  │──────────────────▶│─────────────────── ▶│                     │                  │                  │
  │                   │                    │ Verify ADMIN role    │                  │                  │
  │                   │                    │ Fetch order +        │                  │                  │
  │                   │                    │ payment record       │                  │                  │
  │                   │                    │ Validate refund ≤    │                  │                  │
  │                   │                    │ paid amount          │                  │                  │
  │                   │                    │                      │                  │                  │
  │                   │                    │ stripe.refunds       │                  │                  │
  │                   │                    │ .create({            │                  │                  │
  │                   │                    │  payment_intent:     │                  │                  │
  │                   │                    │   pi_xxx,            │                  │                  │
  │                   │                    │  amount: 850000,     │                  │                  │
  │                   │                    │  reason:             │                  │                  │
  │                   │                    │   "fraudulent"       │                  │                  │
  │                   │                    │ })                   │                  │                  │
  │                   │                    │─────────────────────▶│                  │                  │
  │                   │                    │ ◀── { refund: {      │                  │                  │
  │                   │                    │   id, status:        │                  │                  │
  │                   │                    │   "succeeded" } }    │                  │                  │
  │                   │                    │                      │                  │                  │
  │                   │                    │ BEGIN TRANSACTION    │                  │                  │
  │                   │                    │ INSERT refunds {     │                  │                  │
  │                   │                    │  paymentId,          │                  │                  │
  │                   │                    │  stripeRefundId,     │                  │                  │
  │                   │                    │  amount, reason,     │                  │                  │
  │                   │                    │  status:SUCCEEDED    │                  │                  │
  │                   │                    │ }                    │                  │                  │
  │                   │                    │───────────────────────────────────────▶│                  │
  │                   │                    │ UPDATE orders        │                  │                  │
  │                   │                    │ SET status=REFUNDED  │                  │                  │
  │                   │                    │───────────────────────────────────────▶│                  │
  │                   │                    │ COMMIT               │                  │                  │
  │                   │                    │ Publish "refund.     │                  │  ─ ─ ─ async ─ ─▶│
  │                   │                    │  issued" → event bus │                  │  Send refund     │
  │ ◀─────────────────│◀───────────────────│                      │                  │  confirmation    │
  │ 201 {             │                    │                      │                  │  email to cust   │
  │  refundId,        │                    │                      │                  │                  │
  │  amount:8500.00,  │                    │                      │                  │                  │
  │  status:SUCCEEDED │                    │                      │                  │                  │
  │ }                 │                    │                      │                  │                  │
```

---

## 7. Nightly Payment Reconciliation Job

```
Scheduler          order-payment-svc       Stripe API        PostgreSQL
  │                    │                      │                  │
  │ CRON 02:00 UTC     │                      │                  │
  │ reconcile-         │                      │                  │
  │ payments.job.ts    │                      │                  │
  │───────────────────▶│                      │                  │
  │                    │ SELECT * FROM orders │                  │
  │                    │ WHERE status=PENDING │                  │
  │                    │ AND createdAt <      │                  │
  │                    │  NOW()-INTERVAL '1h' │                  │
  │                    │─────────────────────────────────────── ▶│
  │                    │ ◀── [stale orders]   │                  │
  │                    │                      │                  │
  │                    │ FOR EACH stale order │                  │
  │                    │  stripe.paymentIntent│                  │
  │                    │  s.retrieve(pi_id)   │                  │
  │                    │─────────────────────▶│                  │
  │                    │ ◀── { status }       │                  │
  │                    │                      │                  │
  │                    │ IF status=succeeded  │                  │
  │                    │  → update DB to      │                  │
  │                    │    CONFIRMED         │                  │
  │                    │ IF status=cancelled  │                  │
  │                    │  → update DB to      │                  │
  │                    │    CANCELLED         │                  │
  │                    │─────────────────────────────────────── ▶│
```

---

## Error States Summary

| Scenario | HTTP Status | Error Code |
|----------|------------|------------|
| Product not found during order | 422 | `PRODUCT_NOT_FOUND` |
| Product inactive | 422 | `PRODUCT_UNAVAILABLE` |
| Invalid coupon code | 422 | `COUPON_INVALID` |
| Order not owned by user | 403 | `FORBIDDEN` |
| Stripe API error | 502 | `PAYMENT_GATEWAY_ERROR` |
| Webhook signature invalid | 400 | `INVALID_WEBHOOK_SIGNATURE` |
| Duplicate webhook event | 200 | _(idempotent — silent skip)_ |
| Refund exceeds paid amount | 422 | `REFUND_EXCEEDS_PAYMENT` |
| Order already refunded | 409 | `ORDER_ALREADY_REFUNDED` |