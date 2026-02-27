# ADR 003: Event Bus for Asynchronous Inter-Service Communication

## Status

Accepted

## Date

2026-02-01

## Context

The Lomash Wood microservices platform requires a mechanism for services to communicate state changes without tight coupling. Several critical flows span multiple services:

- A confirmed order must trigger inventory decrements, loyalty point awards, and notification delivery.
- A completed booking must trigger acknowledgement emails, internal team alerts, and analytics tracking.
- A published blog post must trigger sitemap regeneration and analytics recording.

Direct HTTP calls between services for these flows would create synchronous coupling: if the notification-service is slow or unavailable during checkout, the customer's order would fail or hang. This is unacceptable for a payment flow.

An event bus allows the order-payment-service to publish `order-created` and return immediately, with downstream services (notification, product, analytics, customer) consuming the event independently and asynchronously.

## Decision

We adopt an event bus pattern for all asynchronous inter-service communication. Events are published and consumed via a shared `packages/event-bus` library that abstracts the underlying message broker.

The event bus implementation is backed by **Redis Streams** in development and staging environments and is designed to be swapped for **Apache Kafka** or **AWS SQS/SNS** in production at scale without changing service-level code.

All events conform to a standard envelope schema defined in `packages/event-bus/src/payload.ts`.

## Event Envelope Schema

```typescript
interface DomainEvent<T = unknown> {
  eventId: string;
  eventType: string;
  timestamp: string;
  version: string;
  payload: T;
}
```

## Topic Naming Convention

```
lomash.{service}.{entity}.{action}

Examples:
  lomash.orders.created
  lomash.payments.succeeded
  lomash.bookings.created
  lomash.inventory.updated
  lomash.content.blog.published
```

## Event Catalogue

| Topic | Producer | Consumers |
|---|---|---|
| `lomash.orders.created` | order-payment-service | product-service, notification-service, analytics-service, customer-service |
| `lomash.payments.succeeded` | order-payment-service | notification-service, analytics-service, customer-service |
| `lomash.orders.cancelled` | order-payment-service | product-service, notification-service, analytics-service |
| `lomash.refunds.issued` | order-payment-service | notification-service, analytics-service, customer-service |
| `lomash.bookings.created` | appointment-service | notification-service, analytics-service, customer-service |
| `lomash.bookings.cancelled` | appointment-service | notification-service, analytics-service |
| `lomash.reminders.sent` | notification-service | analytics-service |
| `lomash.inventory.updated` | product-service | analytics-service, notification-service |
| `lomash.products.updated` | product-service | analytics-service |
| `lomash.content.blog.published` | content-service | analytics-service |
| `lomash.content.page.published` | content-service | analytics-service |
| `lomash.content.media.uploaded` | content-service | analytics-service |
| `lomash.content.seo.updated` | content-service | analytics-service |
| `lomash.customers.profile.updated` | customer-service | analytics-service |
| `lomash.customers.review.created` | customer-service | analytics-service, notification-service |
| `lomash.analytics.event.tracked` | analytics-service | (internal) |
| `lomash.analytics.report.generated` | analytics-service | notification-service |

## Reliability Guarantees

- **At-least-once delivery:** Events may be delivered more than once; all consumers implement idempotent processing using `eventId` deduplication.
- **Dead-letter queue (DLQ):** Events that fail processing after 3 attempts are routed to a DLQ for manual inspection and replay.
- **Consumer acknowledgement:** Events are only acknowledged after successful processing and DB commit.
- **Ordering:** Per-topic ordering is preserved within a partition key (e.g., `orderId`). Cross-topic ordering is not guaranteed.

## Idempotency Pattern

Every consumer checks for prior processing before acting:

```typescript
const alreadyProcessed = await db.processedEvent.findUnique({
  where: { eventId: event.eventId }
});
if (alreadyProcessed) return;

await db.$transaction([
  db.processedEvent.create({ data: { eventId: event.eventId } }),
  ...businessLogicOperations
]);
```

## Consequences

### Positive

- Services are decoupled: producers do not know about or depend on consumers.
- Downstream service failures do not degrade the primary user-facing flow.
- New consumers can be added without modifying the producer.
- Event history provides an audit trail of all domain state changes.
- Enables event sourcing patterns for analytics ingestion.

### Negative

- Eventual consistency: downstream state (e.g., loyalty points, inventory) lags behind the primary write by milliseconds to seconds.
- Debugging distributed flows requires distributed tracing (addressed by ADR 008).
- Dead-letter queues require operational monitoring and replay tooling.
- Schema evolution of event payloads requires versioning discipline.

## Event Schema Versioning

Event payloads include a `version` field. Consumers must handle multiple versions gracefully. Breaking changes to event schemas require a new version (`"2.0"`) and a migration period where both versions are published simultaneously.

## Alternatives Considered

### Synchronous HTTP (Request/Reply)

Rejected for async flows. Creates coupling, latency chains, and cascading failure risk. Retained only for synchronous internal queries where consistency is required (e.g., product-service price validation during checkout).

### Database Polling (Outbox Pattern)

Considered as a simpler alternative. The transactional outbox pattern would eliminate the dual-write problem but requires additional infrastructure. Retained as a future option if the event bus introduces consistency issues.

### Apache Kafka

Evaluated. Kafka provides stronger ordering guarantees, log compaction, and replay capabilities. Retained as the production-scale target. Redis Streams is used initially to reduce operational complexity. The `packages/event-bus` abstraction layer enables migration without service-level changes.

## Related ADRs

- ADR 001: Microservices (why async communication is required)
- ADR 004: Redis (Redis Streams implementation)
- ADR 008: Observability (tracing events across services)