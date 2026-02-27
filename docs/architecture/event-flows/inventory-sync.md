# Inventory Sync Event Flow

## Overview

This document describes the event-driven flow for inventory synchronisation across the Lomash Wood platform. Inventory state is mastered in the product-service and propagated to dependent services via domain events whenever stock levels change.

---

## Actors

| Actor | Role |
|---|---|
| Admin / CMS | Updates stock via product-service API |
| Order-Payment Service | Triggers stock decrements on confirmed orders |
| Product Service | Masters inventory state, publishes inventory events |
| Analytics Service | Tracks stock metrics and low-inventory alerts |
| Notification Service | Sends low-stock alerts to admin team |

---

## Trigger Sources

Inventory updates are triggered by three distinct sources:

1. **Manual Admin Update** — administrator updates stock quantity via CMS
2. **Order Confirmation** — order-payment-service consumes `order-created` and decrements stock
3. **Scheduled Sync Job** — `sync-inventory.job.ts` runs periodically to reconcile counts

---

## Event Flow Diagram

### Flow 1: Order-Driven Stock Decrement

```
Order-Payment Service
  │
  └──► Publish: order-created (lomash.orders.created)
            │
            ▼
       Product Service (event handler: handlers.ts)
            │
            ├──► [1] Consume order-created event
            │
            ├──► [2] Begin database transaction
            │         ├── SELECT inventory WHERE productId = ? FOR UPDATE
            │         └── Validate sufficient stock
            │
            ├──► [3a] Stock sufficient
            │         ├── UPDATE inventory SET quantity = quantity - ordered_qty
            │         └── Commit transaction
            │
            ├──► [3b] Stock insufficient
            │         ├── Rollback transaction
            │         └── Publish: inventory-update-failed
            │
            └──► [4] Publish: inventory-updated
                        │
                        ├──► Analytics Service
                        │         └── Update stock-level metrics
                        │
                        └──► Notification Service (if quantity < threshold)
                                  └── Send low-stock alert email to admin
```

### Flow 2: Admin Manual Update

```
Admin (CMS)
  │
  └──► [PATCH /v1/products/:id/inventory]
            │
            ▼
       API Gateway ──► auth.middleware (role: ADMIN required)
            │
            ▼
       Product Service
            │
            ├──► [1] Validate request body (Zod schema)
            │
            ├──► [2] Update inventory record in PostgreSQL
            │
            ├──► [3] Invalidate Redis cache for product
            │         └── redis.client.ts: DEL product:{productId}
            │
            └──► [4] Publish: inventory-updated
                        │
                        ├──► Analytics Service
                        │
                        └──► Notification Service (conditional)
```

### Flow 3: Scheduled Reconciliation

```
Cron: sync-inventory.job.ts (runs every 6 hours)
  │
  ├──► [1] Fetch all active products from product-service DB
  │
  ├──► [2] Compare DB stock counts against source-of-truth snapshot
  │         (e.g., warehouse API or admin-confirmed figures)
  │
  ├──► [3] For each discrepancy:
  │         ├── Update inventory record
  │         └── Publish: inventory-updated
  │
  └──► [4] Log reconciliation report via structured logger
```

---

## Events Published

### `inventory-updated`

**Topic:** `lomash.inventory.updated`

**Producer:** product-service

**Consumers:** analytics-service, notification-service

```json
{
  "eventId": "uuid",
  "eventType": "inventory-updated",
  "timestamp": "ISO8601",
  "version": "1.0",
  "payload": {
    "productId": "uuid",
    "sku": "KIT-LUNA-WHT-001",
    "previousQuantity": 10,
    "newQuantity": 9,
    "trigger": "ORDER_CONFIRMED | ADMIN_UPDATE | SCHEDULED_SYNC",
    "orderId": "uuid | null",
    "updatedBy": "uuid | system"
  }
}
```

### `product-updated`

**Topic:** `lomash.products.updated`

**Producer:** product-service

**Consumers:** analytics-service

```json
{
  "eventId": "uuid",
  "eventType": "product-updated",
  "timestamp": "ISO8601",
  "version": "1.0",
  "payload": {
    "productId": "uuid",
    "changedFields": ["stockQuantity", "isAvailable"],
    "updatedAt": "ISO8601"
  }
}
```

---

## Cache Invalidation Strategy

When inventory is updated, the product-service invalidates the following Redis keys:

| Key Pattern | TTL | Reason |
|---|---|---|
| `product:{productId}` | — (deleted) | Stale product detail cache |
| `products:list:*` | — (deleted by pattern) | Product listing pages |
| `products:filter:*` | — (deleted by pattern) | Filter page results |

Invalidation is performed in `redis.keys.ts` using the `SCAN` + `DEL` pattern to avoid blocking the event loop.

---

## Low-Stock Threshold Logic

Defined in `product.constants.ts`:

```
LOW_STOCK_THRESHOLD = 3
OUT_OF_STOCK_THRESHOLD = 0
```

When `inventory-updated` is processed:
- If `newQuantity <= LOW_STOCK_THRESHOLD` and `trigger !== SCHEDULED_SYNC`: publish low-stock notification
- If `newQuantity === 0`: set product `isAvailable = false`, publish `product-updated`

---

## Failure Scenarios

### Concurrent Order Race Condition

- Handled via `SELECT ... FOR UPDATE` pessimistic lock in `transaction.helper.ts`
- Only one order succeeds; the other receives a stock-unavailable error response

### Event Consumer Failure

- Dead-letter queue (DLQ) captures failed consumption attempts
- `sync-inventory.job.ts` acts as a reconciliation safety net for missed events
- All event handlers are idempotent: re-processing `inventory-updated` with the same `eventId` is a no-op

### Redis Unavailable

- Product service falls back to direct DB reads
- Cache invalidation failures are logged but do not block the primary write path
- `redis.health.ts` monitors Redis availability and toggles fallback mode

---

## Monitoring

| Metric | Alert Threshold |
|---|---|
| `inventory_update_lag_ms` | > 2000ms |
| `inventory_update_failures_total` | > 5 in 5 minutes |
| `out_of_stock_products_total` | > 10 (business alert) |
| `dlq_message_count` | > 0 |