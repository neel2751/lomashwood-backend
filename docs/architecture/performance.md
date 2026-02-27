# Performance — Lomash Wood Backend

## Overview

Performance targets are derived directly from the SRS non-functional requirements. NFR1.1 mandates that all dynamic content pages load in under 3 seconds under normal load. This document specifies the targets, the architectural mechanisms achieving them, and the measurement approach.

---

## Performance Targets

| Metric | Target | Measured at |
|--------|--------|------------|
| API p50 response time | < 100ms | ALB access logs |
| API p95 response time | < 500ms | CloudWatch / Grafana |
| API p99 response time | < 1000ms | CloudWatch / Grafana |
| Product filter page (FR2.5) | < 3s full page load | Lighthouse / GTM |
| Cache hit response time | < 10ms | Redis latency metrics |
| DB query p95 | < 50ms | `pg_stat_statements` |
| Stripe payment intent | < 2s | Stripe dashboard |
| Image delivery (CloudFront) | < 200ms | CloudFront metrics |
| Health check endpoint | < 50ms | ALB health check logs |

---

## Request Pipeline Optimisations

### API Gateway

```typescript
// Compression — responses > 1KB compressed with gzip/brotli
app.use(compression({ threshold: 1024 }))

// ETag support — clients receive 304 Not Modified for unchanged responses
app.set('etag', 'strong')

// Response time header for profiling
app.use((req, res, next) => {
  const start = process.hrtime.bigint()
  res.on('finish', () => {
    const ms = Number(process.hrtime.bigint() - start) / 1_000_000
    res.setHeader('X-Response-Time', `${ms.toFixed(2)}ms`)
  })
  next()
})
```

### Connection Keep-Alive

All internal HTTP clients (service-to-service) use persistent connections to avoid TCP handshake overhead on every request:

```typescript
// packages/shared-utils/src/http-client.ts
import http from 'http'
import https from 'https'

const agent = new http.Agent({ keepAlive: true, maxSockets: 50 })
const secureAgent = new https.Agent({ keepAlive: true, maxSockets: 50 })
```

---

## Database Performance

### Prisma Query Optimisation

**N+1 prevention via eager loading:**

```typescript
// AVOID — N+1: 1 query for products + N queries for colours
const products = await prisma.product.findMany()
const withColours = await Promise.all(
  products.map(p => prisma.productColour.findMany({ where: { productId: p.id } }))
)

// USE — single JOIN query
const products = await prisma.product.findMany({
  include: {
    colours: { include: { colour: true } },
    images:  { take: 1, orderBy: { sortOrder: 'asc' } },
  }
})
```

**Select only required fields:**

```typescript
// AVOID — SELECT *
const product = await prisma.product.findUnique({ where: { id } })

// USE — explicit field selection (reduces bytes transferred + memory)
const product = await prisma.product.findUnique({
  where:  { id },
  select: { id: true, title: true, slug: true, basePrice: true, category: true }
})
```

### Index Strategy

Critical indexes defined in Prisma schema migrations:

```sql
-- product-service: filter page queries (FR2.2)
CREATE INDEX idx_products_category_active
  ON products (category, "isActive")
  WHERE "isActive" = true AND "deletedAt" IS NULL;

CREATE INDEX idx_products_created_at_cursor
  ON products ("createdAt" DESC, id DESC);

-- Full-text search on title + description (pg_trgm)
CREATE INDEX idx_products_title_trgm
  ON products USING gin (title gin_trgm_ops);

-- appointment-service: slot lookup by consultant + date
CREATE INDEX idx_time_slots_consultant_date
  ON time_slots ("consultantId", "startsAt")
  WHERE "isBooked" = false AND "isBlocked" = false;

-- auth-service: session lookup by token
CREATE UNIQUE INDEX idx_sessions_token
  ON sessions (token)
  WHERE "revokedAt" IS NULL;

-- analytics-service: event queries by type + time
CREATE INDEX idx_tracking_events_type_created
  ON tracking_events ("event", "createdAt" DESC);
```

### Query Monitoring

`pg_stat_statements` is enabled on all databases. The analytics-service runs a nightly job that exports the top-20 slowest queries to a CloudWatch metric, triggering a dashboard alert when any query p95 exceeds 100ms.

---

## Redis Caching Performance

### Key Design for O(1) Lookup

All cache keys use a flat structure with a short prefix — no nested key scans:

```
product:detail:{id}              → single product (300s TTL)
product:list:{murmur32(query)}   → paginated list response (60s TTL)
slot:availability:{cId}:{date}   → available slots for a consultant (30s TTL)
session:{sessionId}              → session record (7d TTL)
rate:{ip}                        → sliding window counter (60s window)
```

### Pipeline Batching

For operations that write multiple keys at once (e.g. cache warming on startup):

```typescript
const pipeline = redis.pipeline()
products.forEach(p => {
  pipeline.set(`product:detail:${p.id}`, JSON.stringify(p), 'EX', 300)
})
await pipeline.exec()  // single round-trip for all writes
```

### Avoiding Cache Stampede

When a popular cache key expires, multiple concurrent requests can hit the database simultaneously. Prevented via probabilistic early expiry:

```typescript
// Re-fetch when remaining TTL < 10% of original TTL (with 5% random chance)
const ttl = await redis.ttl(key)
const shouldRefresh = ttl < 30 && Math.random() < 0.05
if (shouldRefresh) {
  refreshCache(key)  // async — current request still uses stale value
}
```

---

## Image & Media Performance

### S3 + CloudFront

All product images, media wall assets, and blog images are served via CloudFront with:

- **Cache-Control: max-age=31536000, immutable** — S3 objects are content-addressed (UUID keys); they never change, so browsers cache indefinitely
- **Brotli compression** enabled at CloudFront for text assets
- **Responsive images** — content-service generates 4 variants on upload: original, 1920px, 800px, 300px
- **WebP conversion** — all JPEG/PNG uploads are converted to WebP on ingest via sharp

```typescript
// content-service: image processing pipeline
await sharp(inputBuffer)
  .webp({ quality: 85 })
  .resize(800, null, { withoutEnlargement: true })
  .toBuffer()
```

### Lazy Loading

The `imageUrl` fields returned by the API include the 300px thumbnail URL. The frontend requests the full-size variant only when the image enters the viewport — reducing initial payload size on the product filter page (FR2.5) by ~80%.

---

## Payload Optimisation

### DTO Field Selection

Controllers return mapped DTOs — never raw Prisma objects. This ensures only the fields the client needs are serialised:

```typescript
// product.mapper.ts
export const toProductListDTO = (product: Product & { colours: Colour[] }): ProductListDTO => ({
  id:          product.id,
  title:       product.title,
  slug:        product.slug,
  rangeName:   product.rangeName,
  basePrice:   product.basePrice,
  category:    product.category,
  thumbnailUrl: product.images[0]?.url ?? null,
  colourCount: product.colours.length,
  // NOT included in list view: description, sizes, seoMeta, fullImageSet
})
```

### Compression

```
Uncompressed product list (20 items):  ~18KB
After gzip:                             ~3.2KB  (82% reduction)
After brotli:                           ~2.7KB  (85% reduction)
```

All API responses are brotli-compressed at CloudFront and gzip-compressed at the API gateway for clients that don't support brotli.

---

## Node.js Runtime Optimisations

### Worker Threads for CPU-Bound Tasks

Analytics report generation and CSV export are moved off the main event loop:

```typescript
// analytics-service: export.service.ts
import { Worker } from 'worker_threads'

const generateReport = (params: ReportParams): Promise<Buffer> =>
  new Promise((resolve, reject) => {
    const worker = new Worker('./dist/workers/report-generator.js', {
      workerData: params
    })
    worker.on('message', resolve)
    worker.on('error', reject)
  })
```

### Cluster Mode (optional — ECS single-task design)

ECS Fargate tasks run a single Node.js process. Horizontal scaling (more tasks) is preferred over clustering (more processes per task). This simplifies memory management and avoids IPC overhead.

### Memory Limits

```
ECS task memory: 2048MB (production)
Node.js heap:    --max-old-space-size=1536  (75% of task memory, leaving headroom)
Alert threshold: Container memory > 80% → CloudWatch alarm → scale-out
```

---

## Performance Testing

### k6 Load Tests (`tools/load-testing/k6/`)

Three test profiles run in CI against staging before every production deploy:

**Baseline** (`reports/baseline.json`)
```javascript
// 50 concurrent users for 5 minutes — establish normal-load p95
export const options = { vus: 50, duration: '5m' }
```

**Stress** (`reports/stress.json`)
```javascript
// Ramp to 500 users — validate auto-scaling response
export const options = {
  stages: [
    { duration: '2m', target: 100 },
    { duration: '5m', target: 500 },
    { duration: '2m', target: 0 },
  ]
}
```

**Soak** (`reports/soak.json`)
```javascript
// 100 users for 1 hour — detect memory leaks, connection pool exhaustion
export const options = { vus: 100, duration: '1h' }
```

**Pass thresholds** (CI fails if these are not met):

```javascript
export const options = {
  thresholds: {
    'http_req_duration{name:products-list}': ['p(95)<500'],
    'http_req_duration{name:booking-create}': ['p(95)<1000'],
    'http_req_failed': ['rate<0.01'],    // < 1% error rate
  }
}
```

### Lighthouse CI

Integrated into the frontend CI pipeline — backend performance targets feed into:
- **Time to First Byte (TTFB):** < 200ms (CloudFront-cached pages)
- **Largest Contentful Paint (LCP):** < 2.5s (product pages with images)

---

## Profiling in Production

### Continuous Profiling

Each service exposes a `/metrics` endpoint (Prometheus format):

```
# HELP http_request_duration_seconds HTTP request duration
# TYPE http_request_duration_seconds histogram
http_request_duration_seconds_bucket{method="GET",route="/v1/products",le="0.1"} 1832
http_request_duration_seconds_bucket{method="GET",route="/v1/products",le="0.5"} 2001
http_request_duration_seconds_bucket{method="GET",route="/v1/products",le="1.0"} 2010

# HELP db_query_duration_seconds Prisma query duration
# TYPE db_query_duration_seconds histogram
db_query_duration_seconds_bucket{model="Product",operation="findMany",le="0.05"} 988
```

Grafana dashboards visualise p50/p95/p99 for every route and every Prisma model operation — identifying regressions within minutes of a deploy.

### On-Demand CPU Profiling

```bash
# Trigger a 30-second CPU profile on a specific ECS task
aws ecs execute-command \
  --cluster lomash-production \
  --task <task-id> \
  --container product-service \
  --command "node --prof-process /tmp/isolate-*.log" \
  --interactive
```