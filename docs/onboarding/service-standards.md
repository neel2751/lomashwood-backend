# Service Standards

---

## Overview

Every microservice in the Lomash Wood platform follows the same structural conventions. New services must conform to this standard. Existing services must not deviate without an approved ADR. Consistency across services reduces cognitive overhead when switching contexts and makes cross-service debugging predictable.

---

## Required Directory Structure

Every service must have this exact layout:

```
{service-name}/
├── package.json
├── tsconfig.json
├── Dockerfile
├── .env.example
├── .eslintrc.json
├── .prettierrc
├── nodemon.json
├── prisma/
│   ├── schema.prisma
│   ├── seed.ts
│   └── migrations/
├── src/
│   ├── main.ts
│   ├── app.ts
│   ├── bootstrap.ts
│   ├── app/
│   │   └── {domain}/
│   │       ├── {domain}.controller.ts
│   │       ├── {domain}.service.ts
│   │       ├── {domain}.repository.ts
│   │       ├── {domain}.routes.ts
│   │       ├── {domain}.schemas.ts
│   │       ├── {domain}.types.ts
│   │       ├── {domain}.mapper.ts
│   │       ├── {domain}.constants.ts
│   │       └── index.ts
│   ├── infrastructure/
│   │   ├── db/
│   │   │   ├── prisma.client.ts
│   │   │   ├── prisma.extensions.ts
│   │   │   ├── migrations.ts
│   │   │   └── transaction.helper.ts
│   │   ├── cache/
│   │   │   ├── redis.client.ts
│   │   │   ├── redis.health.ts
│   │   │   └── redis.keys.ts
│   │   ├── messaging/
│   │   │   ├── event-producer.ts
│   │   │   ├── event-topics.ts
│   │   │   └── event-metadata.ts
│   │   └── http/
│   │       ├── server.ts
│   │       ├── graceful-shutdown.ts
│   │       └── health.routes.ts
│   ├── interfaces/
│   │   ├── http/
│   │   │   ├── express.ts
│   │   │   ├── router.factory.ts
│   │   │   └── middleware.factory.ts
│   │   └── events/
│   │       ├── handlers.ts
│   │       ├── subscriptions.ts
│   │       └── payload.types.ts
│   ├── config/
│   │   ├── env.ts
│   │   ├── logger.ts
│   │   ├── cors.ts
│   │   ├── rate-limit.ts
│   │   ├── database.ts
│   │   ├── redis.ts
│   │   └── index.ts
│   ├── jobs/
│   │   └── {job-name}.job.ts
│   ├── events/
│   │   └── {event-name}.event.ts
│   ├── shared/
│   │   ├── errors.ts
│   │   ├── constants.ts
│   │   ├── types.ts
│   │   ├── utils.ts
│   │   └── pagination.ts
│   └── tests-helpers/
│       ├── factories.ts
│       ├── mocks.ts
│       └── setup.ts
└── tests/
    ├── unit/
    ├── integration/
    ├── e2e/
    └── fixtures/
```

---

## Entry Point Files

### `main.ts`

The process entry point. Only starts the server. No business logic.

```typescript
import { createServer } from './infrastructure/http/server';
import { bootstrap } from './bootstrap';
import { config } from './config';
import { logger } from './config/logger';

async function main(): Promise<void> {
  const app = await bootstrap();
  const server = createServer(app);

  server.listen(config.port, () => {
    logger.info({ port: config.port, service: config.serviceName }, 'Service started');
  });

  process.on('SIGTERM', () => gracefulShutdown(server));
  process.on('SIGINT', () => gracefulShutdown(server));
}

main().catch((error) => {
  logger.error({ error }, 'Failed to start service');
  process.exit(1);
});
```

### `app.ts`

Creates and configures the Express application with all middleware. Returns the configured app without starting the server (enables testing).

```typescript
import express from 'express';
import helmet from 'helmet';
import { corsMiddleware } from './config/cors';
import { requestLoggerMiddleware } from './infrastructure/http/middleware';
import { errorMiddleware } from './shared/errors';
import { healthRouter } from './infrastructure/http/health.routes';
import { createRouter } from './interfaces/http/router.factory';

export function createApp(dependencies: AppDependencies): express.Application {
  const app = express();

  app.use(helmet());
  app.use(corsMiddleware);
  app.use(express.json({ limit: '10mb' }));
  app.use(requestLoggerMiddleware);

  app.use('/health', healthRouter);
  app.use('/v1', createRouter(dependencies));

  app.use(errorMiddleware);

  return app;
}
```

### `bootstrap.ts`

Instantiates all dependencies (Prisma, Redis, repositories, services, controllers) and wires them together. Returns a configured Express app.

```typescript
import { createApp } from './app';
import { createPrismaClient } from './infrastructure/db/prisma.client';
import { createRedisClient } from './infrastructure/cache/redis.client';
import { ProductRepository } from './app/products/product.repository';
import { ProductService } from './app/products/product.service';
import { ProductController } from './app/products/product.controller';
import { EventProducer } from './infrastructure/messaging/event-producer';
import { logger } from './config/logger';

export async function bootstrap(): Promise<express.Application> {
  const prisma = createPrismaClient();
  const redis = await createRedisClient();
  const eventProducer = new EventProducer(redis, logger);

  const productRepository = new ProductRepository(prisma);
  const productService = new ProductService(productRepository, eventProducer, logger);
  const productController = new ProductController(productService);

  return createApp({ productController });
}
```

---

## Configuration Standard (`config/env.ts`)

All environment variables are validated at startup using Zod. Services fail fast if required variables are missing:

```typescript
import { z } from 'zod';

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().positive().default(3002),
  DATABASE_URL: z.string().url(),
  REDIS_URL: z.string().url(),
  LOG_LEVEL: z.enum(['debug', 'info', 'warn', 'error']).default('info'),
  SERVICE_NAME: z.string().default('product-service'),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('Invalid environment configuration:', parsed.error.format());
  process.exit(1);
}

export const config = parsed.data;
```

Never access `process.env` directly outside of `config/env.ts`.

---

## Health Check Standard

Every service must expose `GET /health` returning:

```json
{
  "status": "ok",
  "service": "product-service",
  "version": "1.2.3",
  "timestamp": "2026-02-01T10:00:00Z",
  "checks": {
    "database": "ok",
    "redis": "ok"
  }
}
```

If any check fails, return `503` with `"status": "degraded"`:

```json
{
  "status": "degraded",
  "service": "product-service",
  "checks": {
    "database": "ok",
    "redis": "error"
  }
}
```

Implementation is in `infrastructure/http/health.routes.ts`. Kubernetes liveness and readiness probes point to this endpoint.

---

## Graceful Shutdown Standard

Every service implements graceful shutdown in `infrastructure/http/graceful-shutdown.ts`:

1. Stop accepting new HTTP connections (`server.close()`)
2. Wait for in-flight requests to complete (max 30 seconds)
3. Disconnect from Redis
4. Disconnect from PostgreSQL (`prisma.$disconnect()`)
5. Exit with code 0

```typescript
export function gracefulShutdown(server: Server): void {
  logger.info('Shutdown signal received, draining connections...');

  server.close(async () => {
    await redis.quit();
    await prisma.$disconnect();
    logger.info('Shutdown complete');
    process.exit(0);
  });

  setTimeout(() => {
    logger.error('Forced shutdown after timeout');
    process.exit(1);
  }, 30_000);
}
```

---

## Error Middleware Standard

The global error handler must be the last middleware registered in `app.ts`:

```typescript
export function errorMiddleware(
  error: Error,
  req: Request,
  res: Response,
  _next: NextFunction,
): void {
  const requestId = req.headers['x-request-id'] as string ?? 'unknown';

  if (error instanceof AppError) {
    logger.warn({ error, requestId }, error.message);
    res.status(error.statusCode).json({
      statusCode: error.statusCode,
      error: getHttpStatusText(error.statusCode),
      message: error.message,
      code: error.code,
      requestId,
    });
    return;
  }

  // Unexpected errors
  Sentry.captureException(error);
  logger.error({ error, requestId }, 'Unhandled error');
  res.status(500).json({
    statusCode: 500,
    error: 'Internal Server Error',
    message: 'An unexpected error occurred',
    code: 'INTERNAL_ERROR',
    requestId,
  });
}
```

---

## Prisma Client Standard

Each service maintains a singleton Prisma client in `infrastructure/db/prisma.client.ts`. The client uses a global reference in development to survive hot reloads:

```typescript
import { PrismaClient } from '@prisma/client';
import { config } from '../../config';

const globalForPrisma = global as unknown as { prisma: PrismaClient };

export function createPrismaClient(): PrismaClient {
  if (globalForPrisma.prisma) return globalForPrisma.prisma;

  const prisma = new PrismaClient({
    log: config.nodeEnv === 'development'
      ? ['query', 'info', 'warn', 'error']
      : ['warn', 'error'],
  });

  if (config.nodeEnv !== 'production') {
    globalForPrisma.prisma = prisma;
  }

  return prisma;
}
```

---

## Event Publishing Standard

All services publish events via the shared `EventProducer` from `packages/event-bus`. Events must conform to the standard envelope:

```typescript
await this.eventProducer.publish({
  eventId: crypto.randomUUID(),
  eventType: 'product-created',
  timestamp: new Date().toISOString(),
  version: '1.0',
  payload: {
    productId: product.id,
    category: product.category,
    createdAt: product.createdAt.toISOString(),
  },
});
```

Event topics are defined in `infrastructure/messaging/event-topics.ts` as constants. Never hardcode topic strings inline.

---

## Pagination Standard

All list endpoints must support cursor or offset pagination via the shared `PaginationDto`:

```typescript
// shared/pagination.ts
export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

export interface PaginatedResult<T> {
  data: T[];
  pagination: PaginationMeta;
}

export function buildPaginationMeta(page: number, limit: number, total: number): PaginationMeta {
  const totalPages = Math.ceil(total / limit);
  return {
    page,
    limit,
    total,
    totalPages,
    hasNextPage: page < totalPages,
    hasPrevPage: page > 1,
  };
}
```

Default values: `page = 1`, `limit = 20`, `maxLimit = 100`. These defaults are defined in `shared/constants.ts`.

---

## Soft Delete Standard

All domain entities use soft delete. Never perform hard deletes on production records. The `deletedAt` field is always included in the Prisma schema:

```prisma
model Product {
  id        String    @id @default(uuid())
  deletedAt DateTime?
  isActive  Boolean   @default(true)
}
```

All repository `findMany` and `findUnique` queries must filter `deletedAt: null` unless explicitly retrieving deleted records for admin purposes.

A Prisma middleware in `prisma.extensions.ts` enforces this globally as a safety net.

---

## Logging Standard

All services use Pino with the shared logger configuration from `config/logger.ts`:

```typescript
import pino from 'pino';
import { config } from './env';

export const logger = pino({
  level: config.logLevel,
  base: { service: config.serviceName },
  timestamp: pino.stdTimeFunctions.isoTime,
  formatters: {
    level: (label) => ({ level: label }),
  },
});
```

The `service` field is automatically included in every log entry. The `requestId` from `X-Request-Id` is manually included in request-scoped log calls.

---

## Dockerfile Standard

All services use a multi-stage Dockerfile based on `infra/docker/base-node.Dockerfile`:

```dockerfile
FROM node:20-alpine AS builder
WORKDIR /app
COPY package.json pnpm-lock.yaml ./
RUN npm install -g pnpm && pnpm install --frozen-lockfile
COPY . .
RUN npx prisma generate
RUN pnpm build

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/prisma ./prisma
EXPOSE 3000
CMD ["node", "dist/main.js"]
```

Images must be non-root (`USER node`). No development dependencies in the final image. Final image size target: under 200MB.

---

## Required `package.json` Scripts

Every service `package.json` must define these scripts:

```json
{
  "scripts": {
    "dev": "nodemon",
    "build": "tsc --project tsconfig.json",
    "start": "node dist/main.js",
    "test": "jest",
    "test:unit": "jest --testPathPattern=tests/unit",
    "test:integration": "jest --testPathPattern=tests/integration",
    "test:e2e": "jest --testPathPattern=tests/e2e",
    "test:watch": "jest --watch --testPathPattern=tests/unit",
    "test:coverage": "jest --coverage",
    "lint": "eslint src tests --ext .ts",
    "lint:fix": "eslint src tests --ext .ts --fix",
    "format": "prettier --write src tests",
    "format:check": "prettier --check src tests",
    "type-check": "tsc --noEmit",
    "db:migrate": "prisma migrate dev",
    "db:deploy": "prisma migrate deploy",
    "db:seed": "ts-node prisma/seed.ts",
    "db:studio": "prisma studio",
    "db:generate": "prisma generate"
  }
}
```

---

## Adding a New Service

When creating a new microservice:

1. Copy the directory structure from an existing service (e.g., `product-service`).
2. Update `package.json` with the new service name and port.
3. Create and populate `.env.example`.
4. Define the Prisma schema and run `prisma migrate dev --name init`.
5. Implement the domain modules following the controller → service → repository pattern.
6. Add the service to `infra/docker/docker-compose.yml`.
7. Add Kubernetes manifests in `infra/kubernetes/base/deployments/` and `services/`.
8. Add Helm chart in `infra/kubernetes/helm-charts/`.
9. Register the service URL in the api-gateway `config/services.ts`.
10. Add route proxy in api-gateway `routes/`.
11. Add CI/CD steps in `.github/workflows/`.
12. Add Grafana dashboard JSON in `observability/dashboards/`.
13. Update the service registry in `docs/architecture/system-design.md`.