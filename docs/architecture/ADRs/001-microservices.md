# ADR 001: Microservices Architecture

## Status

Accepted

## Date

2026-02-01

## Context

Lomash Wood requires a backend platform that supports independent scaling of distinct business domains: product catalogue, appointment booking, order processing, content management, customer profiles, notifications, and analytics. The platform must support future growth in traffic (particularly on product filter pages with infinite scroll), allow the engineering team to deploy individual capabilities without coordinating full-system releases, and remain resilient to partial failures (e.g., a notification service outage must not affect checkout).

A monolithic architecture was evaluated as the alternative. While it would reduce initial operational complexity, it would create tight coupling between domains that have very different scaling profiles and change frequencies — for example, the analytics-service ingests high-frequency events while the content-service changes infrequently.

## Decision

We adopt a microservices architecture composed of the following independently deployable services:

| Service | Primary Domain |
|---|---|
| api-gateway | Request routing, auth enforcement, rate limiting |
| auth-service | Authentication, sessions, roles |
| product-service | Products, categories, colours, inventory, pricing |
| order-payment-service | Orders, payments, invoices, refunds |
| appointment-service | Bookings, availability, consultants, reminders |
| content-service | Blog, CMS pages, media, SEO, landing pages |
| customer-service | Profiles, wishlist, reviews, support, loyalty |
| notification-service | Email, SMS, push, templates |
| analytics-service | Event tracking, funnels, dashboards, exports |

Each service owns its own PostgreSQL database schema and Prisma client. Services do not share databases. Inter-service communication uses the event bus for asynchronous flows and HTTP (internal) for synchronous queries where consistency is required.

## Rationale

- **Independent scalability:** The product-service and analytics-service receive orders of magnitude more traffic than the content-service. Microservices allow each to be scaled via Kubernetes HPA independently.
- **Independent deployability:** CMS content updates, new product additions, and payment logic changes can be deployed without coordinating a full system release.
- **Fault isolation:** A failure in the notification-service does not degrade the booking or checkout experience beyond missing confirmations.
- **Team autonomy:** As the engineering team grows, services form natural ownership boundaries.
- **Technology fit:** Each service can adopt the optimal infrastructure configuration (e.g., analytics-service uses append-only event tables; order-payment-service uses strict transactional patterns).

## Consequences

### Positive

- Each service can be deployed, scaled, and monitored independently.
- Failures are isolated to individual services.
- Services evolve at their own pace without cross-team coordination.
- Clear domain boundaries make onboarding easier.

### Negative

- Increased operational complexity: each service requires its own Docker image, Kubernetes deployment, health checks, and CI/CD pipeline.
- Distributed tracing is required to debug cross-service request flows (addressed by ADR 008).
- Data consistency across services requires eventual consistency patterns via the event bus (addressed by ADR 003).
- Local development requires docker-compose to orchestrate all services simultaneously.

## Alternatives Considered

### Monolith

Rejected due to inability to scale domains independently and tight coupling between high-frequency (analytics, products) and low-frequency (CMS, auth) domains.

### Modular Monolith

Considered as a stepping stone. Rejected in favour of immediate microservices to avoid the migration cost later and to establish clean domain boundaries from the outset.

## Related ADRs

- ADR 003: Event Bus (inter-service communication)
- ADR 005: Kubernetes (orchestration)
- ADR 007: API Gateway (single entry point)
- ADR 008: Observability (cross-service tracing)