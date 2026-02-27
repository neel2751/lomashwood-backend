# ADR 002: PostgreSQL as the Primary Database

## Status

Accepted

## Date

2026-02-01

## Context

Each microservice in the Lomash Wood platform requires a persistent data store. The platform manages structured relational data including products with associated colours and sizes, appointments with time slots and consultant availability, orders with line items and payment transactions, and customer profiles with loyalty and review histories.

The data model has well-defined relationships, requires ACID transactions (particularly for payment and inventory operations), and must support complex queries such as filtered product listings with multiple join conditions.

Candidate databases evaluated: PostgreSQL, MySQL, MongoDB, DynamoDB.

## Decision

We adopt PostgreSQL as the primary relational database for all microservices. Each service runs against its own isolated PostgreSQL schema or database instance. In production, services connect to dedicated RDS PostgreSQL instances provisioned via Terraform (see `infra/terraform/modules/rds/`).

## Rationale

- **ACID compliance:** Payment processing, inventory decrements, and appointment slot booking require strict transactional guarantees. PostgreSQL's transaction model with `SELECT ... FOR UPDATE` pessimistic locking handles concurrent booking race conditions correctly.
- **Relational model fit:** The domain model has clear relational structure (products ↔ colours M:M, orders ↔ order_items 1:M, appointments ↔ slots 1:M). Relational joins are the natural query pattern.
- **JSON support:** PostgreSQL's `jsonb` type allows flexible storage for product metadata, SEO fields, and event properties without sacrificing queryability.
- **Full-text search:** Native `tsvector` / `tsquery` supports product and blog search without an additional search service.
- **Prisma ORM compatibility:** Prisma has first-class PostgreSQL support including migrations, relation queries, and raw SQL escape hatches.
- **AWS RDS availability:** RDS for PostgreSQL provides managed backups, point-in-time recovery, read replicas, and Multi-AZ failover without operational overhead.
- **GDPR compliance:** Structured schema makes it straightforward to implement right-to-erasure via targeted `UPDATE` / `DELETE` with soft-delete patterns.

## Schema Conventions

All Prisma models follow these conventions:

```prisma
model ExampleEntity {
  id          String    @id @default(uuid())
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt
  deletedAt   DateTime?
  isActive    Boolean   @default(true)
}
```

- `id`: UUID v4 via `@default(uuid())`
- `createdAt` / `updatedAt`: automatic auditing timestamps
- `deletedAt`: soft delete pattern; hard deletes are not performed on production data
- `isActive`: logical active flag for filtering

## Indexing Strategy

- Primary keys: B-tree index (automatic)
- Foreign keys: explicit index on all FK columns
- Query filters: composite indexes on `(status, createdAt)`, `(categoryId, isActive)`, etc.
- Full-text: `@@index([title], type: BrinIndex)` for product and blog search columns
- Unique constraints: enforced at DB level, not application level only

## Consequences

### Positive

- Strong consistency and ACID guarantees across all critical business operations.
- Mature ecosystem with excellent tooling, monitoring, and operational knowledge.
- Prisma schema-first migrations provide version-controlled, reviewable schema changes.
- RDS handles backups, failover, and read replica management.

### Negative

- Horizontal write scaling requires application-level sharding (not required at current scale; read replicas handle read scaling).
- Schema migrations must be coordinated with deployments; zero-downtime migrations require careful multi-phase patterns.
- Each service requires its own RDS instance in production, increasing infrastructure cost versus a shared database.

## Alternatives Considered

### MongoDB

Rejected. The domain model is fundamentally relational. MongoDB's lack of multi-document ACID transactions (prior to replica sets) creates risk in payment and inventory flows. The flexible document model provides no advantage here.

### DynamoDB

Rejected. DynamoDB's single-table design requires significant upfront data access pattern analysis. The query flexibility needed for product filtering, appointment availability queries, and analytics aggregations does not map well to DynamoDB's key-value paradigm.

### MySQL

Evaluated as a viable alternative. Rejected in favour of PostgreSQL due to superior `jsonb` support, more advanced full-text search, better `WINDOW` function support for analytics queries, and stronger Prisma ecosystem support.

## Related ADRs

- ADR 006: Prisma ORM (schema and migration tooling)
- ADR 004: Redis (caching layer complementing PostgreSQL)