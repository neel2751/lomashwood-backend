# Payment Incident Runbook — Lomash Wood Backend

## Overview

This runbook covers payment-related incidents for the Lomash Wood platform. Payment processing is handled by the `order-payment-service` using Stripe as the primary gateway. All payment events are received via Stripe webhooks.

**Critical:** Payment incidents must be treated as P1 or P0. Customer funds and trust are at stake.

---

## Failure Detection

### Symptoms

- Customers reporting failed checkouts or charges without order confirmation
- Stripe dashboard showing elevated error rates
- `order-payment-service` logs containing `StripeCardError`, `StripeInvalidRequestError`, or `StripeAPIError`
- Grafana `order-payment-service-dashboard` showing increased 5xx rates
- Webhook processing queue growing without being consumed

---

## Scenario 1 — Payment Intent Creation Failing

**Symptoms:** `POST /v1/payments/create-intent` returning 500. Customers unable to reach checkout.

**Step 1 — Check service logs:**

```bash
kubectl logs -n lomash-wood deployment/order-payment-service --tail=300 | grep -E "stripe|payment|intent"
```

**Step 2 — Verify Stripe API key is valid:**

```bash
curl https://api.stripe.com/v1/balance \
  -u $STRIPE_SECRET_KEY:
```

Expected: `200 OK` with balance object. If `401` is returned, the key is invalid or revoked.

**Step 3 — Rotate Stripe API key if compromised:**

1. Go to Stripe Dashboard → Developers → API Keys.
2. Click **Roll key** on the affected secret key.
3. Update Kubernetes secret:

```bash
kubectl patch secret lomash-wood-secrets -n lomash-wood \
  --type='json' \
  -p='[{"op": "replace", "path": "/data/STRIPE_SECRET_KEY", "value": "<base64-new-key>"}]'
```

4. Restart order-payment-service:

```bash
kubectl rollout restart deployment/order-payment-service -n lomash-wood
```

**Step 4 — Verify Stripe service status:**

Check [https://status.stripe.com](https://status.stripe.com) for active incidents.

If Stripe itself is degraded, communicate this to customers and pause checkout flows.

---

## Scenario 2 — Stripe Webhook Processing Failure

**Symptoms:** Orders stuck in `PENDING_PAYMENT` state. Webhook endpoint returning non-200 responses. Stripe retrying events repeatedly.

**Step 1 — Check webhook handler logs:**

```bash
kubectl logs -n lomash-wood deployment/order-payment-service --tail=500 | grep "webhook"
```

**Step 2 — Check webhook signature validation:**

Verify the `STRIPE_WEBHOOK_SECRET` is the correct endpoint secret (not the API key):

```bash
kubectl get secret lomash-wood-secrets -n lomash-wood \
  -o jsonpath='{.data.STRIPE_WEBHOOK_SECRET}' | base64 -d
```

Compare with the value in Stripe Dashboard → Developers → Webhooks → [endpoint] → Signing secret.

**Step 3 — Test webhook endpoint manually:**

```bash
stripe listen --forward-to https://api.lomashwood.com/v1/webhooks/stripe
stripe trigger payment_intent.succeeded
```

**Step 4 — Replay failed webhook events from Stripe:**

1. Navigate to Stripe Dashboard → Developers → Webhooks → [endpoint].
2. Filter by `Failed` events.
3. Click **Resend** on each failed event in chronological order.

**Step 5 — Manually reconcile orders stuck in PENDING:**

```bash
kubectl exec -it postgres-primary-0 -n lomash-wood -- psql -U lomash_admin -d lomash_orders -c \
  "SELECT id, stripe_payment_intent_id, status, created_at
   FROM orders
   WHERE status = 'PENDING_PAYMENT' AND created_at < NOW() - INTERVAL '1 hour';"
```

For each order, verify the actual charge status in Stripe:

```bash
curl https://api.stripe.com/v1/payment_intents/<payment_intent_id> \
  -u $STRIPE_SECRET_KEY:
```

If `status` is `succeeded` in Stripe but not in the database, manually update:

```bash
kubectl exec -it postgres-primary-0 -n lomash-wood -- psql -U lomash_admin -d lomash_orders -c \
  "UPDATE orders SET status = 'CONFIRMED' WHERE stripe_payment_intent_id = '<id>';"
```

Document each manual update in the incident report.

---

## Scenario 3 — Duplicate Charges

**Symptoms:** Customer reporting charged twice. Two payment records for the same order in the database.

**Step 1 — Identify duplicate payment records:**

```bash
kubectl exec -it postgres-primary-0 -n lomash-wood -- psql -U lomash_admin -d lomash_orders -c \
  "SELECT order_id, COUNT(*), array_agg(stripe_payment_intent_id) AS intents
   FROM payment_transactions
   WHERE status = 'SUCCEEDED'
   GROUP BY order_id
   HAVING COUNT(*) > 1;"
```

**Step 2 — Verify in Stripe Dashboard:**

Check both payment intents to confirm which is legitimate.

**Step 3 — Issue refund for the duplicate charge:**

```bash
curl https://api.stripe.com/v1/refunds \
  -u $STRIPE_SECRET_KEY: \
  -d payment_intent=<duplicate_payment_intent_id> \
  -d reason=duplicate
```

**Step 4 — Update database to mark the duplicate as refunded:**

```bash
kubectl exec -it postgres-primary-0 -n lomash-wood -- psql -U lomash_admin -d lomash_orders -c \
  "UPDATE payment_transactions SET status = 'REFUNDED', notes = 'Duplicate charge — refunded' WHERE stripe_payment_intent_id = '<id>';"
```

**Step 5 — Notify the customer:**

Send a personalised email via the notification-service confirming the refund.

**Step 6 — Investigate idempotency key handling:**

Check that `stripe.paymentIntents.create` calls include the correct `idempotencyKey`:

```bash
kubectl logs -n lomash-wood deployment/order-payment-service --tail=1000 | grep "idempotency"
```

Review `src/infrastructure/payments/stripe.client.ts` for correct idempotency implementation.

---

## Scenario 4 — Refund Processing Failure

**Symptoms:** `POST /v1/orders/:id/refunds` returning errors. Customers not receiving refunds.

**Step 1 — Check refund service logs:**

```bash
kubectl logs -n lomash-wood deployment/order-payment-service --tail=300 | grep -E "refund|REFUND"
```

**Step 2 — Verify refund eligibility:**

```bash
kubectl exec -it postgres-primary-0 -n lomash-wood -- psql -U lomash_admin -d lomash_orders -c \
  "SELECT o.id, o.status, pt.stripe_payment_intent_id, pt.amount, r.id AS refund_id, r.status AS refund_status
   FROM orders o
   JOIN payment_transactions pt ON pt.order_id = o.id
   LEFT JOIN refunds r ON r.payment_transaction_id = pt.id
   WHERE o.id = '<order_id>';"
```

**Step 3 — Manually trigger refund via Stripe API:**

```bash
curl https://api.stripe.com/v1/refunds \
  -u $STRIPE_SECRET_KEY: \
  -d payment_intent=<payment_intent_id>
```

**Step 4 — Record refund in database:**

```bash
kubectl exec -it postgres-primary-0 -n lomash-wood -- psql -U lomash_admin -d lomash_orders -c \
  "INSERT INTO refunds (id, payment_transaction_id, stripe_refund_id, amount, status, created_at)
   VALUES (gen_random_uuid(), '<pt_id>', '<stripe_refund_id>', <amount>, 'SUCCEEDED', NOW());"
```

---

## Scenario 5 — High Payment Failure Rate

**Symptoms:** Stripe dashboard showing elevated `payment_intent.payment_failed` events.

**Step 1 — Classify failure reasons:**

```bash
kubectl exec -it postgres-primary-0 -n lomash-wood -- psql -U lomash_admin -d lomash_orders -c \
  "SELECT failure_code, COUNT(*) FROM payment_transactions
   WHERE status = 'FAILED' AND created_at > NOW() - INTERVAL '1 hour'
   GROUP BY failure_code ORDER BY COUNT(*) DESC;"
```

| Common Failure Codes | Meaning |
|---------------------|---------|
| `card_declined` | Card rejected by issuer |
| `insufficient_funds` | Not enough balance |
| `expired_card` | Card expired |
| `incorrect_cvc` | Wrong CVC entered |
| `do_not_honor` | General bank decline |
| `stripe_api_error` | Stripe-side issue |

**Step 2 — If `stripe_api_error` is dominant, check Stripe status:**

Visit [https://status.stripe.com](https://status.stripe.com).

**Step 3 — If card decline rate is abnormally high, check for fraud patterns:**

```bash
kubectl exec -it postgres-primary-0 -n lomash-wood -- psql -U lomash_admin -d lomash_orders -c \
  "SELECT customer_email, COUNT(*) AS attempts FROM orders
   WHERE created_at > NOW() - INTERVAL '1 hour' AND status = 'PAYMENT_FAILED'
   GROUP BY customer_email HAVING COUNT(*) > 3 ORDER BY attempts DESC;"
```

Enable Stripe Radar rules if fraud is suspected.

---

## Communication Templates

### Customer-Facing (via notification-service)

**Payment failed:**
> Your payment for order #[ORDER_ID] was unsuccessful. No charge has been made. Please check your card details and try again, or contact us at support@lomashwood.com.

**Duplicate charge refund:**
> We identified a duplicate charge on your account for order #[ORDER_ID] and have issued a full refund of £[AMOUNT]. This will appear in your account within 5–10 business days.

### Internal (Slack #incidents)

> **PAYMENT INCIDENT** — [P1/P0]
> Service: order-payment-service
> Impact: [describe customer impact]
> Root cause: [identified cause]
> Action taken: [steps taken]
> Status: [Investigating / Mitigated / Resolved]

---

## Post-Incident Checklist

- [ ] All affected orders identified and reconciled
- [ ] All duplicate charges refunded
- [ ] Customers notified via email
- [ ] Stripe webhook events fully replayed
- [ ] Root cause documented
- [ ] Idempotency handling reviewed if applicable
- [ ] Jira tickets created for fixes
- [ ] Post-mortem scheduled within 48 hours

Reference: `docs/compliance/pci-dss.md` for PCI compliance obligations during payment incidents.