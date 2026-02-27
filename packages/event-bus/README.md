# @lomash-wood/event-bus

Shared Redis Pub/Sub event bus for all Lomash Wood backend microservices. Provides typed publishers, subscribers, middleware pipeline, and strongly-typed event payloads for every domain topic.

## Installation

```json
{
  "dependencies": {
    "@lomash-wood/event-bus": "workspace:*"
  }
}
```

## Usage

### Publishing Events

```typescript
import Redis from "ioredis";
import { EventPublisher, ORDER_TOPICS, loggingMiddleware } from "@lomash-wood/event-bus";

const redis = new Redis(process.env.REDIS_URL);

const publisher = new EventPublisher({
  redis,
  defaultSource: "order-payment-service",
  middlewares: [loggingMiddleware(logger)],
});

const eventId = await publisher.publish(
  ORDER_TOPICS.ORDER_CREATED,
  {
    orderId: "order-uuid",
    userId: "user-uuid",
    totalAmount: 4999,
    currency: "GBP",
    itemCount: 3,
  },
  { correlationId: "req-uuid" }
);
```

### Subscribing to Events

```typescript
import Redis from "ioredis";
import {
  EventSubscriber,
  ORDER_TOPICS,
  OrderCreatedPayload,
  loggingMiddleware,
  validationMiddleware,
} from "@lomash-wood/event-bus";

const redis = new Redis(process.env.REDIS_URL);

const subscriber = new EventSubscriber({
  redis,
  groupName: "notification-service",
  middlewares: [validationMiddleware(), loggingMiddleware(logger)],
  onError: (error, event, topic) => {
    logger.error("Event handler failed", { error, topic, eventId: event?.eventId });
  },
});

await subscriber.subscribe<OrderCreatedPayload>(
  ORDER_TOPICS.ORDER_CREATED,
  async (event) => {
    await sendOrderConfirmationEmail(event.data.userId, event.data.orderId);
  }
);
```

### Batch Publishing

```typescript
await publisher.publishBatch([
  { topic: ORDER_TOPICS.ORDER_CREATED, data: { orderId: "..." } },
  { topic: CUSTOMER_TOPICS.LOYALTY_POINTS_EARNED, data: { customerId: "...", points: 50 } },
]);
```

### Middleware

```typescript
import {
  loggingMiddleware,
  validationMiddleware,
  retryMiddleware,
  deadLetterMiddleware,
  composeMiddleware,
} from "@lomash-wood/event-bus";

const middleware = composeMiddleware([
  validationMiddleware(),
  loggingMiddleware(logger),
  retryMiddleware(3, 500),
  deadLetterMiddleware(async (event, error) => {
    await deadLetterQueue.push({ event, error: error.message });
  }),
]);
```

## Topics

| Namespace | Topics |
|---|---|
| `AUTH_TOPICS` | user.created, user.logged_in, password.reset_requested, email.verified, role.assigned, session.revoked |
| `PRODUCT_TOPICS` | product.created/updated/deleted, inventory.updated/low, price.changed, sale.created |
| `ORDER_TOPICS` | order.created/confirmed/cancelled/shipped/delivered, payment.succeeded/failed, refund.issued, invoice.generated |
| `APPOINTMENT_TOPICS` | booking.created/confirmed/cancelled/rescheduled/completed, reminder.sent, availability.changed |
| `CONTENT_TOPICS` | blog.published/updated, page.published, media.uploaded, seo.updated, sitemap.regenerate |
| `CUSTOMER_TOPICS` | profile.created, review.created, brochure.requested, business_inquiry.submitted, newsletter.subscribed, loyalty.points_earned |
| `NOTIFICATION_TOPICS` | email.sent/failed/bounced, sms.sent/failed, push.sent/failed |
| `ANALYTICS_TOPICS` | event.tracked, pageview.tracked, funnel.completed, report.generated |

## Build

```bash
pnpm build
```