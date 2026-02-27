# Scalability — Lomash Wood Backend

## Overview

The Lomash Wood backend is designed to scale horizontally at every layer — from the CDN edge to the database. This document describes how each component scales under load, what the anticipated growth ceiling is, and how bottlenecks are avoided.

---

## Scalability Principles

1. **Stateless services** — no local state in ECS tasks; all state lives in PostgreSQL or Redis
2. **Cache-first reads** — Redis sits in front of every hot read path
3. **Async side effects** — emails, analytics, and notifications never block HTTP responses
4. **Database isolation** — one PostgreSQL logical DB per service; no cross-DB joins
5. **Horizontal scaling** — add task replicas, not bigger machines
6. **Cursor pagination** — infinite scroll uses cursor-based pagination, not OFFSET (which degrades at high row counts)

---

## Horizontal Scaling per Layer

### Layer 1: CloudFront (Edge)

- Globally distributed — no scaling needed; AWS manages capacity
- Product images and media wall assets: cached at edge with 365-day TTL
- Blog and product listing responses: cached at edge for 60s
- Cache invalidation triggered programmatically by content-service on publish

### Layer 2: Application Load Balancer

- Scales automatically — AWS-managed
- Multi-AZ — requests routed to healthy tasks across 3 Availability Zones
- Sticky sessions: disabled — all services are stateless

### Layer 3: ECS Fargate (Application Tier)

Each service scales independently based on its own CPU / queue-depth metrics:

```
Load spike (e.g. product launch sale — FR4.0):

  t=0    Normal: 2 tasks per service
  t=2m   CPU > 60% on api-gateway → CloudWatch alarm fires
  t=3m   Application Auto Scaling adds 2 tasks
  t=4m   New tasks pass health check, ALB routes traffic
  t+1h   CPU drops → scale-in policy removes excess tasks (cooldown: 5 min)
```

Scale-out is faster than scale-in — scale-out cooldown: 60s, scale-in cooldown: 300s.

**Scaling limits:**

| Service | Min | Max | Primary scaling metric |
|---------|-----|-----|----------------------|
| api-gateway | 2 | 20 | CPU utilisation |
| product-service | 2 | 15 | CPU + p95 latency |
| notification-service | 2 | 12 | SQS queue depth |
| analytics-service | 1 | 6 | CPU utilisation |

### Layer 4: Redis (ElastiCache)

- **Read replicas** in production — read-heavy services (product-service, content-service) direct reads to a replica endpoint
- **Cluster Mode disabled** — single shard is sufficient for the expected key count; enable Cluster Mode if key space exceeds 25GB
- **Connection pooling** — each service uses `ioredis` with `maxRetriesPerRequest: 3` and a pool of 10 connections
- **Pipeline batching** — analytics-service buffers events in Redis lists and flushes in batches of 1000 every 10 seconds, reducing per-event write overhead by ~100×

### Layer 5: PostgreSQL (RDS)

**Connection management:**

Fargate tasks do not use persistent database connections across requests. Each service uses a connection pool via Prisma:

```typescript
// Shared across all requests in a task — not per-request
const prisma = new PrismaClient({
  datasources: { db: { url: process.env.DATABASE_URL } },
  log: ['warn', 'error'],
})
// Pool size: 10 connections per task
// Max connections used = (tasks × 10) must be < RDS max_connections (500)
// At max scale (20 api-gateway + 15 product + 10 each × 6 other services)
// = (20+15+10+8+10+8+12+6) × 10 = 890 → use PgBouncer in pooler mode if needed
```

**PgBouncer (scaling path):**

When task count × pool_size approaches `max_connections`, add PgBouncer as a connection pooler in front of RDS:

```
ECS Tasks (many, small pools) → PgBouncer (transaction pooling) → RDS (fewer, larger connections)
```

This allows thousands of application connections to share a small number of actual database connections.

**Read replicas:**

- Analytics queries (dashboards, exports, funnel reports) are routed to the RDS read replica via a separate `DATABASE_URL_READONLY` — they never contend with write traffic
- Product listing queries (high read volume — FR2.5 infinite scroll) also use the read replica

**Partitioning strategy (future):**

When `tracking_events` table (analytics-service) exceeds 100M rows, apply range partitioning by month:

```sql
CREATE TABLE tracking_events (
  id         UUID,
  created_at TIMESTAMPTZ NOT NULL
) PARTITION BY RANGE (created_at);

CREATE TABLE tracking_events_2026_02
  PARTITION OF tracking_events
  FOR VALUES FROM ('2026-02-01') TO ('2026-03-01');
```

---

## Caching Strategy

### Cache-aside Pattern

All services follow cache-aside (lazy population):

```
Request arrives
  │
  ├── Redis GET cache_key
  │     HIT  → return cached value (sub-millisecond)
  │     MISS → query PostgreSQL → SET cache_key (with TTL) → return
  └── Response
```

### TTL Policy

| Cache key pattern | TTL | Invalidation trigger |
|------------------|-----|---------------------|
| `product:list:{hash}` | 60s | Product created/updated/deleted |
| `product:detail:{id}` | 300s | Product updated |
| `category:list` | 600s | Category updated |
| `blog:list:{hash}` | 300s | Blog published |
| `blog:detail:{slug}` | 600s | Blog updated |
| `page:{slug}` | 3600s | Page published |
| `showroom:list` | 3600s | Showroom updated |
| `slot:availability:{consultantId}:{date}` | 30s | Booking created/cancelled |
| `session:{sessionId}` | 7d | Logout / revocation |

### Cache Warming

On service startup (and after deploy), the product-service warms its cache for the top 50 most-viewed products by issuing a background Prisma query and populating Redis — avoiding a cold cache thundering herd on new task launch.

---

## Infinite Scroll Scalability (FR2.5)

Product filter pages use **cursor-based pagination** — not OFFSET — to avoid performance degradation at high page depths.

```typescript
// AVOID: degrades linearly — OFFSET 10000 scans and discards 10000 rows
prisma.product.findMany({ skip: 10000, take: 20 })

// USE: O(log n) index scan — constant cost regardless of depth
prisma.product.findMany({
  take: 21,
  cursor: { id: lastId },
  skip: 1,
  orderBy: { createdAt: 'desc' },
})
```

Combined with the 1-minute Redis cache on list responses, this allows the product catalogue to scale to hundreds of thousands of products without degradation.

---

## Background Jobs & Queue Scaling

BullMQ queues (backed by Redis) handle all async workloads. Workers are co-located within each service's ECS task.

| Queue | Producer | Consumer | Scale trigger |
|-------|---------|---------|--------------|
| `email:send` | All services | notification-service | Queue depth > 500 |
| `sms:send` | notification-service | notification-service | Queue depth > 200 |
| `analytics:flush` | analytics-service | analytics-service | Time-based (10s) |
| `appointment:reminders` | appointment-service | appointment-service | Time-based (cron) |
| `payment:reconcile` | order-payment-service | order-payment-service | Time-based (nightly) |

When `notification-service` queue depth exceeds 500, its ECS service scales out — more worker tasks process the queue in parallel. BullMQ handles concurrent workers safely via Redis atomic operations.

---

## Anticipated Traffic Model

| Event | Estimated RPS | Peak multiplier | Notes |
|-------|--------------|----------------|-------|
| Normal browse | 50 RPS | 1× | Product catalogue browsing |
| Sale launch (FR4.0) | 500 RPS | 10× | Wren/Magnet-scale promotion |
| Showroom open day | 200 RPS | 4× | Booking slot rush |
| Blog post viral | 300 RPS | 6× | Mostly CloudFront cache hits |

At 500 RPS peak, the stack at maximum ECS task count (api-gateway: 20 tasks × 512 vCPU) handles ~25 RPS per task — well within Node.js async capability. RDS connection math: 89 tasks × 10 pool = 890 — within the 500 `max_connections` if PgBouncer is added, or manageable with pool size reduced to 5 per task (445 connections).

---

## Scaling Runbook Summary

| Trigger | Action |
|---------|--------|
| RDS CPU > 80% | Enable read replica + route reads to replica endpoint |
| Connections approaching `max_connections` | Deploy PgBouncer in front of RDS |
| Redis memory > 80% | Increase ElastiCache node type or enable cluster mode |
| ECS task OOM kills | Increase task memory in task definition + redeploy |
| p95 latency > 2s on product routes | Enable product-service read replica reads, increase cache TTL |
| Notification queue > 5000 depth | Increase `notification-service` max ECS tasks, check SES send rate limits |