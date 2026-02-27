# Order & Payment Event Flow

## Overview

This document describes the event-driven flow between the order-payment-service, product-service, notification-service, analytics-service, and customer-service when a customer places an order and completes payment on the Lomash Wood platform.

---

## Actors

| Actor | Role |
|---|---|
| Customer | Initiates checkout |
| API Gateway | Routes and authenticates requests |
| Order-Payment Service | Orchestrates order lifecycle and payment processing |
| Product Service | Validates inventory and pricing |
| Notification Service | Sends confirmations and alerts |
| Analytics Service | Ingests conversion events |
| Customer Service | Updates loyalty points and order history |

---

## Event Flow Diagram

```
Customer
  │
  ▼
[POST /v1/orders/checkout]
  │
  ▼
API Gateway ──► auth.middleware (JWT validation)
  │
  ▼
Order-Payment Service
  │
  ├──► [1] Validate cart items
  │         └──► HTTP: Product Service /internal/products/validate
  │                   └── Returns: price snapshot, stock availability
  │
  ├──► [2] Create Order (status: PENDING)
  │         └── Prisma: INSERT orders, order_items
  │
  ├──► [3] Create Stripe PaymentIntent
  │         └── Stripe API: /v1/payment_intents
  │                   └── Returns: client_secret
  │
  ├──► [4] Return client_secret to Customer
  │
  ▼
Customer confirms payment on frontend (Stripe.js)
  │
  ▼
Stripe Webhook ──► [POST /v1/webhooks/stripe]
  │
  ▼
Order-Payment Service (webhook-handler.ts)
  │
  ├──► [5] Verify Stripe signature
  │
  ├──► [6] Handle payment_intent.succeeded
  │         ├── Update Order status: PENDING → CONFIRMED
  │         ├── Create PaymentTransaction record
  │         └── Publish: payment-succeeded
  │
  ├──► [7] Publish: order-created
  │
  └──► Events dispatched to event bus
            │
            ├──► Notification Service (payment-succeeded)
            │         ├── Send payment receipt email to customer
            │         └── Send order confirmation email to customer
            │
            ├──► Product Service (order-created)
            │         └── Decrement inventory stock
            │
            ├──► Analytics Service (order-created + payment-succeeded)
            │         ├── Track conversion event
            │         └── Update revenue metrics
            │
            └──► Customer Service (order-created)
                      └── Award loyalty points
```

---

## Events Published

### `order-created`

**Topic:** `lomash.orders.created`

**Producer:** order-payment-service

**Consumers:** product-service, analytics-service, customer-service, notification-service

```json
{
  "eventId": "uuid",
  "eventType": "order-created",
  "timestamp": "ISO8601",
  "version": "1.0",
  "payload": {
    "orderId": "uuid",
    "customerId": "uuid",
    "items": [
      {
        "productId": "uuid",
        "quantity": 1,
        "unitPrice": 1499.99,
        "category": "KITCHEN"
      }
    ],
    "totalAmount": 1499.99,
    "currency": "GBP",
    "status": "CONFIRMED"
  }
}
```

### `payment-succeeded`

**Topic:** `lomash.payments.succeeded`

**Producer:** order-payment-service

**Consumers:** notification-service, analytics-service, customer-service

```json
{
  "eventId": "uuid",
  "eventType": "payment-succeeded",
  "timestamp": "ISO8601",
  "version": "1.0",
  "payload": {
    "paymentTransactionId": "uuid",
    "orderId": "uuid",
    "customerId": "uuid",
    "stripePaymentIntentId": "pi_xxx",
    "amount": 1499.99,
    "currency": "GBP",
    "method": "card"
  }
}
```

### `order-cancelled`

**Topic:** `lomash.orders.cancelled`

**Producer:** order-payment-service

**Consumers:** product-service, notification-service, analytics-service

```json
{
  "eventId": "uuid",
  "eventType": "order-cancelled",
  "timestamp": "ISO8601",
  "version": "1.0",
  "payload": {
    "orderId": "uuid",
    "customerId": "uuid",
    "reason": "PAYMENT_FAILED | CUSTOMER_REQUEST | EXPIRED",
    "cancelledAt": "ISO8601"
  }
}
```

### `refund-issued`

**Topic:** `lomash.refunds.issued`

**Producer:** order-payment-service

**Consumers:** notification-service, analytics-service, customer-service

```json
{
  "eventId": "uuid",
  "eventType": "refund-issued",
  "timestamp": "ISO8601",
  "version": "1.0",
  "payload": {
    "refundId": "uuid",
    "orderId": "uuid",
    "customerId": "uuid",
    "stripeRefundId": "re_xxx",
    "amount": 1499.99,
    "currency": "GBP"
  }
}
```

---

## Failure Scenarios

### Payment Intent Creation Failure

- Order remains in `PENDING` status
- No events published
- Customer receives error response
- Retry logic: 3 attempts with exponential backoff via `reconcile-payments.job.ts`

### Stripe Webhook Delivery Failure

- Stripe retries webhook delivery for up to 72 hours
- `retry-failed-webhooks.job.ts` processes any webhooks that failed internal processing
- Idempotency key on PaymentTransaction prevents duplicate processing

### Inventory Decrement Failure

- Product Service publishes `inventory-update-failed` event
- Order-Payment Service receives failure, initiates refund automatically
- Customer notified via notification-service

---

## Idempotency

All Stripe PaymentIntent creations use `idempotencyKey: orderId` to prevent double charges. PaymentTransaction records have a unique constraint on `stripePaymentIntentId`.

---

## State Machine

```
PENDING
  │
  ├── payment_intent.succeeded ──► CONFIRMED
  │                                    │
  │                                    ├── admin action ──► PROCESSING
  │                                    │                        │
  │                                    │                        └── fulfilled ──► COMPLETED
  │                                    │
  │                                    └── customer/admin ──► CANCELLED
  │
  └── payment_intent.payment_failed ──► FAILED
                                            │
                                            └── retry ──► PENDING
```

---

## Security

- Stripe webhook signature verified via `stripe.webhooks.constructEvent` before any processing
- Order ownership validated against authenticated `customerId` on all read operations
- Payment amounts validated against server-side price snapshot, not client-submitted values