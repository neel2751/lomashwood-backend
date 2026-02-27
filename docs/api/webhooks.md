# Webhooks API

Base path: `/v1/webhooks`

---

## Overview

The webhooks endpoint receives inbound events from third-party providers. Currently, Stripe is the only registered webhook provider. All webhook endpoints bypass JWT authentication and rate limiting — they are secured via provider-specific signature verification instead.

The Stripe webhook endpoint receives a raw request body and must not be parsed by the standard JSON body-parser middleware on this route. The api-gateway forwards the raw buffer to the order-payment-service which performs signature verification before any processing.

---

## Endpoints

### POST /v1/webhooks/stripe

Receive Stripe webhook events. Stripe sends this request when payment-related events occur (payment success, failure, refund, etc.).

**Auth required:** No (secured by Stripe signature verification)

**Headers**

| Header | Required | Description |
|---|---|---|
| `stripe-signature` | Yes | Stripe-generated HMAC signature for the payload |
| `content-type` | Yes | Must be `application/json` |

**Request Body:** Raw Stripe event payload (JSON). The body is forwarded unmodified to the order-payment-service.

**Important:** The `stripe-signature` header is verified using `stripe.webhooks.constructEvent(rawBody, signature, STRIPE_WEBHOOK_SECRET)` inside the order-payment-service before any business logic executes. Requests with invalid signatures return `400` immediately.

**Response `200`**

Returned after the event is received and queued for processing. A `200` response does not guarantee the event has been fully processed — it only confirms receipt and signature validity.

```json
{
  "received": true
}
```

**Errors**

| Status | Reason |
|---|---|
| 400 | Invalid Stripe signature — request rejected |
| 422 | Event type received but not handled (logged and ignored) |
| 500 | Internal processing error — Stripe will retry |

---

## Handled Stripe Event Types

| Stripe Event | Internal Action |
|---|---|
| `payment_intent.succeeded` | Order status → `CONFIRMED`, PaymentTransaction created, `payment-succeeded` event published |
| `payment_intent.payment_failed` | Order status → `FAILED`, `order-cancelled` event published |
| `charge.refunded` | Refund record created, `refund-issued` event published |
| `customer.subscription.created` | (Reserved for future subscription features) |
| `customer.subscription.deleted` | (Reserved for future subscription features) |

Unhandled event types are logged at `warn` level and return `422`. They do not cause Stripe to retry.

---

## Stripe Webhook Configuration

In production, the Stripe webhook is registered at:

```
https://api.lomashwood.co.uk/v1/webhooks/stripe
```

**Stripe Dashboard Configuration:**
- Events to send: `payment_intent.succeeded`, `payment_intent.payment_failed`, `charge.refunded`
- API version: configured in `infrastructure/payments/stripe.client.ts`
- Signing secret: stored in AWS Secrets Manager, injected as `STRIPE_WEBHOOK_SECRET`

---

## Idempotency

Each Stripe event has a unique `id` field (e.g., `evt_xxx`). Before processing, the order-payment-service checks whether this event ID has already been processed:

```
SELECT * FROM processed_webhook_events WHERE stripeEventId = 'evt_xxx'
```

If already processed, the handler returns `200` immediately without reprocessing. This handles Stripe's at-least-once delivery guarantee and retry behaviour.

---

## Retry Behaviour

Stripe retries failed webhooks (non-2xx responses) using exponential backoff for up to 72 hours. The `retry-failed-webhooks.job.ts` cron job additionally processes any webhooks that were received but failed internal processing (e.g., database unavailability).

---

## Local Development Testing

Stripe webhooks can be forwarded to the local development environment using the Stripe CLI:

```bash
stripe listen --forward-to http://localhost:4000/v1/webhooks/stripe
```

The Stripe CLI provides a local `STRIPE_WEBHOOK_SECRET` for development signature verification.

---

## Security

- The `/v1/webhooks/stripe` route is excluded from JWT auth middleware in the api-gateway.
- The raw request body is preserved (not parsed) on this route for signature verification.
- Stripe's IP addresses can be whitelisted at the infrastructure level (AWS ALB security group) as an additional layer of defence.
- The `STRIPE_WEBHOOK_SECRET` is never logged or included in error responses.

---

## Future Webhook Providers

The following webhook integrations are planned for future phases:

| Provider | Endpoint | Purpose |
|---|---|---|
| Twilio | `/v1/webhooks/twilio` | SMS delivery status callbacks |
| Firebase | `/v1/webhooks/firebase` | Push notification delivery reports |
| SendGrid / SES | `/v1/webhooks/email` | Email bounce and delivery events |