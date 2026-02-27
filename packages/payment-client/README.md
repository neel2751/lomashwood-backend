# @lomash-wood/payment-client

Type-safe HTTP client for the Lomash Wood Order Payment Service. Handles Stripe payment intents, confirmations, refunds, webhooks, and reconciliation.

## Installation

```json
{
  "dependencies": {
    "@lomash-wood/payment-client": "workspace:*"
  }
}
```

## Usage

```typescript
import { PaymentClient } from "@lomash-wood/payment-client";

const paymentClient = new PaymentClient({
  baseUrl: process.env.ORDER_PAYMENT_SERVICE_URL,
  timeout: 15000,
  getAccessToken: () => tokenStore.getAccessToken(),
  onUnauthorized: () => redirect("/login"),
});

const { paymentIntent, publishableKey } = await paymentClient.createPaymentIntent(
  {
    orderId: "order-uuid",
    paymentMethod: "STRIPE",
    currency: "GBP",
    savePaymentMethod: false,
  },
  "idempotency-key-uuid"
);
```

## API

| Method | Description |
|---|---|
| `createPaymentIntent(payload, idempotencyKey?)` | Create a Stripe / Razorpay payment intent |
| `confirmPayment(payload, idempotencyKey?)` | Confirm and capture payment |
| `getPaymentIntent(intentId)` | Get intent by ID |
| `getTransaction(transactionId)` | Get transaction by ID |
| `getTransactionByGatewayId(gateway, id)` | Get transaction by gateway ID |
| `listTransactions(filter)` | Paginated transaction list |
| `getOrderPaymentStatus(orderId)` | Full payment status for an order |
| `createRefund(payload, idempotencyKey?)` | Issue a full or partial refund |
| `getRefund(refundId)` | Get refund by ID |
| `listRefundsByOrder(orderId)` | All refunds for an order |
| `cancelPaymentIntent(intentId)` | Cancel a pending intent |
| `verifyStripeWebhook(signature, rawBody)` | Verify Stripe webhook signature |
| `processStripeWebhook(signature, rawBody)` | Forward raw webhook to service |
| `getReconciliationReport(gateway, from, to)` | Payment reconciliation report |
| `retryFailedPayment(transactionId, idempotencyKey?)` | Retry a failed payment |
| `getPaymentMethods(userId)` | Saved payment methods for a user |
| `deletePaymentMethod(userId, methodId)` | Remove a saved payment method |
| `setDefaultPaymentMethod(userId, methodId)` | Set a payment method as default |

## Error Handling

```typescript
import {
  PaymentClient,
  PaymentDeclinedError,
  InsufficientFundsError,
  RefundExceedsAmountError,
  IdempotencyError,
  isPaymentClientError,
} from "@lomash-wood/payment-client";

try {
  await paymentClient.createRefund({ orderId, reason: "CUSTOMER_REQUEST" });
} catch (error) {
  if (error instanceof PaymentDeclinedError) {

  } else if (error instanceof InsufficientFundsError) {

  } else if (error instanceof RefundExceedsAmountError) {

  } else if (error instanceof IdempotencyError) {

  } else if (isPaymentClientError(error)) {
    console.error(error.statusCode, error.code, error.message);
  }
}
```

## Build

```bash
pnpm build
```