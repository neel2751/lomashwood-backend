# ADR 006: Prisma ORM for Database Access

## Status

Accepted

## Date

2026-02-01

## Context

Each microservice in the Lomash Wood platform requires a typed, maintainable interface to its PostgreSQL database. The engineering team works in TypeScript throughout. The key requirements for the ORM layer are:

- Full TypeScript type safety: query results must be typed at compile time, not cast at runtime.
- Schema-first migrations: database schema changes must be version-controlled, reviewable, and safely applied in CI/CD pipelines.
- Readable query API: complex relational queries (product with colours and sizes, order with items and payment) must be expressible without raw SQL in common cases.
- Raw SQL escape hatch: performance-critical analytics queries and complex window functions must be expressible as raw parameterised SQL.
- Active development and community support.

Candidates evaluated: Prisma, TypeORM, Drizzle, Sequelize, Knex.

## Decision

We adopt **Prisma** as the ORM for all microservices. Each service defines its own `prisma/schema.prisma` and runs migrations independently via `prisma migrate deploy` in the CI/CD pipeline.

## Schema Conventions

### Required Fields on All Models

```prisma
model Entity {
  id        String    @id @default(uuid())
  createdAt DateTime  @default(now())
  updatedAt DateTime  @updatedAt
  deletedAt DateTime?
}
```

### Soft Deletes

Hard deletes are not performed on production records. Soft delete is implemented via `deletedAt DateTime?`. All repository `findMany` queries include `where: { deletedAt: null }` by default. A Prisma middleware in `prisma.extensions.ts` enforces this globally.

### Naming Conventions

| Element | Convention | Example |
|---|---|---|
| Model name | PascalCase singular | `Product`, `OrderItem` |
| Field name | camelCase | `categoryId`, `createdAt` |
| Table name | snake_case plural (via `@@map`) | `products`, `order_items` |
| Enum name | PascalCase | `AppointmentType` |
| Enum value | SCREAMING_SNAKE_CASE | `HOME_MEASUREMENT` |

### Relations

All relations are explicitly defined with `@relation` and foreign key fields. Cascading deletes are defined at the Prisma level and enforced in the DB schema:

```prisma
model OrderItem {
  id      String @id @default(uuid())
  order   Order  @relation(fields: [orderId], references: [id], onDelete: Cascade)
  orderId String
}
```

### Indexing

Indexes are defined in `schema.prisma` and applied via migrations:

```prisma
@@index([categoryId, isActive])
@@index([status, createdAt])
@@unique([slug])
```

## Migration Workflow

```bash
npx prisma migrate dev --name {description}    # development
npx prisma migrate deploy                       # CI/CD production
npx prisma generate                             # regenerate client after schema change
npx prisma studio                               # local DB browser
```

Migrations are stored in `prisma/migrations/` and committed to source control. The migration lock file (`migration_lock.toml`) prevents concurrent migration runs.

## Prisma Client Usage Pattern

Each service instantiates a single Prisma Client as a singleton in `infrastructure/db/prisma.client.ts`:

```typescript
import { PrismaClient } from '@prisma/client';

const globalForPrisma = global as unknown as { prisma: PrismaClient };

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    log: process.env.NODE_ENV === 'development'
      ? ['query', 'info', 'warn', 'error']
      : ['warn', 'error'],
  });

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}
```

Repositories receive the client via dependency injection. Raw SQL is used for complex analytics queries via `prisma.$queryRaw`.

## Transaction Pattern

Multi-step operations (e.g., create order + decrement inventory + create payment record) use Prisma interactive transactions:

```typescript
await prisma.$transaction(async (tx) => {
  const order = await tx.order.create({ data: orderData });
  await tx.inventory.update({
    where: { productId },
    data: { quantity: { decrement: quantity } },
  });
  return order;
});
```

Helper utilities in `infrastructure/db/transaction.helper.ts` provide retry logic for serialisation failure errors.

## Consequences

### Positive

- Full TypeScript inference on all query results: no casting, no `any`.
- Schema migrations are reviewable PRs, not ad-hoc SQL scripts.
- Prisma Studio provides a UI for inspecting DB state during development.
- `prisma.$queryRaw` provides a safe parameterised raw SQL escape hatch.
- Prisma Client generates optimised SQL; N+1 queries are avoided via `include` and `select`.
- Consistent migration workflow across all nine services.

### Negative

- Prisma does not support all advanced PostgreSQL features natively (e.g., partial indexes require raw migration SQL).
- `$queryRaw` results are not typed without manual type assertions.
- Prisma Client generation step must run after every schema change in CI.
- Prisma's query engine binary adds ~20MB to Docker image size.

## Alternatives Considered

### TypeORM

Evaluated. TypeORM has active-record and data-mapper patterns and is mature. Rejected due to inconsistent TypeScript type inference (many return types are `any` without explicit typing), decorator-heavy syntax, and historically less reliable migration tooling compared to Prisma.

### Drizzle ORM

Evaluated. Drizzle provides excellent TypeScript inference and a SQL-like query API. Rejected because the team has existing Prisma expertise and Drizzle's migration tooling (`drizzle-kit`) is less mature than Prisma Migrate at time of decision. Drizzle is noted as a strong alternative for future evaluation.

### Knex

Rejected. Knex is a query builder, not an ORM. It provides no type inference on query results and requires manual type definitions for all models. Acceptable as a raw SQL layer; rejected as the primary DB access pattern.

### Sequelize

Rejected. Sequelize's TypeScript support requires `sequelize-typescript` decorators and is noticeably inferior to Prisma's native TypeScript generation. Migration tooling is less ergonomic.

## Related ADRs

- ADR 002: PostgreSQL (the database Prisma connects to)
- ADR 001: Microservices (each service has its own Prisma schema)