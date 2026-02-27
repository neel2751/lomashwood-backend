# Order API

Base path: `/v1/orders`

---

## Overview

The order-payment-service manages the full order lifecycle from checkout initiation through payment confirmation to fulfilment. Orders are created with a `PENDING` status and transition to `CONFIRMED` once the Stripe payment succeeds. All amounts are in GBP pence internally but returned as decimal GBP in API responses.

---

## Endpoints

### POST /v1/orders

Initiate checkout by creating an order and a Stripe PaymentIntent simultaneously. Returns the `clientSecret` needed by the frontend to complete payment via Stripe.js.

**Auth required:** Yes

**Request Body**

```json
{
  "items": [
    {
      "productId": "uuid",
      "quantity": 1
    }
  ]
}
```

| Field | Type | Rules |
|---|---|---|
| `items` | array | required, min 1 item |
| `items[].productId` | uuid | required, must be an active product |
| `items[].quantity` | integer | required, min 1 |

**Price validation:** Unit prices are fetched from the product-service at time of order creation. Client-submitted prices are ignored. The server-side price snapshot is stored on the `OrderItem` record and used for all subsequent calculations.

**Response `201`**

```json
{
  "orderId": "uuid",
  "clientSecret": "pi_xxx_secret_xxx",
  "totalAmount": 4999.99,
  "currency": "GBP"
}
```

The frontend uses `clientSecret` with Stripe.js to complete payment. The backend confirms the order only upon receiving the `payment_intent.succeeded` Stripe webhook.

**Errors**

| Status | Code | Reason |
|---|---|---|
| 400 | `PRODUCT_UNAVAILABLE` | One or more products are out of stock or inactive |
| 401 | `UNAUTHORIZED` | Missing token |
| 422 | `VALIDATION_ERROR` | Invalid request body |

---

### GET /v1/orders

List orders for the authenticated customer, paginated and sorted by most recent.

**Auth required:** Yes

**Query Parameters**

| Parameter | Type | Description |
|---|---|---|
| `page` | integer | Page number (default: 1) |
| `limit` | integer | Items per page (default: 20) |
| `status` | string | Filter by status |

**Response `200`**

```json
{
  "data": [
    {
      "id": "uuid",
      "status": "CONFIRMED",
      "items": [
        {
          "id": "uuid",
          "productId": "uuid",
          "productTitle": "Luna Kitchen",
          "quantity": 1,
          "unitPrice": 4999.99,
          "totalPrice": 4999.99
        }
      ],
      "totalAmount": 4999.99,
      "currency": "GBP",
      "createdAt": "2026-02-01T11:00:00Z",
      "updatedAt": "2026-02-01T11:05:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 3,
    "totalPages": 1,
    "hasNextPage": false,
    "hasPrevPage": false
  }
}
```

---

### GET /v1/orders/:id

Get a single order by ID. Customers can only retrieve their own orders. Admins can retrieve any order.

**Auth required:** Yes

**Response `200`** — returns the full `Order` object with line items.

**Errors**

| Status | Code | Reason |
|---|---|---|
| 403 | `FORBIDDEN` | Order belongs to a different customer |
| 404 | `ORDER_NOT_FOUND` | No order with this ID |

---

### PATCH /v1/orders/:id/cancel

Cancel an order. Only orders in `PENDING` or `CONFIRMED` status can be cancelled. If payment has already succeeded, a refund is initiated automatically.

**Auth required:** Yes (CUSTOMER or ADMIN)

**Request Body**

```json
{
  "reason": "Changed my mind"
}
```

**Response `200`**

```json
{
  "id": "uuid",
  "status": "CANCELLED",
  "refundInitiated": true,
  "cancelledAt": "2026-02-02T09:00:00Z"
}
```

**Errors**

| Status | Code | Reason |
|---|---|---|
| 400 | `ORDER_NOT_CANCELLABLE` | Order is in `COMPLETED` or already `CANCELLED` status |
| 404 | `ORDER_NOT_FOUND` | No order with this ID |

---

### GET /v1/orders (Admin)

List all orders across all customers. Admin only.

**Auth required:** Yes (ADMIN)

**Query Parameters**

| Parameter | Type | Description |
|---|---|---|
| `page` | integer | Page number |
| `limit` | integer | Items per page |
| `status` | string | Filter by order status |
| `from` | date | Created from date |
| `to` | date | Created to date |
| `customerId` | uuid | Filter by customer |

---

## Order Status State Machine

```
PENDING
  ├── payment_intent.succeeded ──► CONFIRMED
  │                                    ├── admin action ──► PROCESSING
  │                                    │                        └── fulfilled ──► COMPLETED
  │                                    └── cancel request ──► CANCELLED (+ refund)
  └── payment_intent.payment_failed ──► FAILED
                                            └── customer retry ──► PENDING
```

| Status | Description |
|---|---|
| `PENDING` | Order created, payment not yet confirmed |
| `CONFIRMED` | Payment succeeded, awaiting processing |
| `PROCESSING` | Order being prepared |
| `COMPLETED` | Order fulfilled |
| `CANCELLED` | Order cancelled by customer or admin |
| `FAILED` | Payment failed |

---

## Data Models

### Order

| Field | Type | Description |
|---|---|---|
| `id` | uuid | Unique identifier |
| `customerId` | uuid | Owning customer |
| `status` | enum | Current order status |
| `items` | OrderItem[] | Line items |
| `totalAmount` | float | Total in GBP |
| `currency` | string | Always `GBP` |
| `createdAt` | datetime | Order creation time |
| `updatedAt` | datetime | Last status update time |

### OrderItem

| Field | Type | Description |
|---|---|---|
| `id` | uuid | Unique identifier |
| `productId` | uuid | Referenced product |
| `productTitle` | string | Snapshot of product title at order time |
| `quantity` | integer | Ordered quantity |
| `unitPrice` | float | Price per unit at order time (snapshot) |
| `totalPrice` | float | `unitPrice × quantity` |

---

## Idempotency

Order creation is idempotent with respect to the Stripe PaymentIntent. If the same `orderId` is submitted to `/v1/payments/create-intent` more than once, Stripe returns the same PaymentIntent rather than creating a new one. The `idempotencyKey` on the Stripe API call is set to the `orderId`.

---

## Events Published

On order state transitions, the order-payment-service publishes the following events to the event bus:

| Event | Topic | Trigger |
|---|---|---|
| `order-created` | `lomash.orders.created` | Payment confirmed via webhook |
| `order-cancelled` | `lomash.orders.cancelled` | Order cancelled by customer or admin |
| `payment-succeeded` | `lomash.payments.succeeded` | Stripe `payment_intent.succeeded` |
| `refund-issued` | `lomash.refunds.issued` | Refund initiated after cancellation |