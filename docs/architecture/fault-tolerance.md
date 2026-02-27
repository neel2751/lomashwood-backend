# Fault Tolerance — Lomash Wood Backend

## Overview

The Lomash Wood backend is designed to degrade gracefully under failure conditions. No single component failure should cause complete service unavailability. This document describes the failure modes for each layer and the mechanisms that contain them.

---

## Failure Domains

```
┌─────────────────────────────────────────────────────┐
│  External failures                                  │
│  Stripe outage · SES outage · Twilio outage         │
│  → Isolated to payment/notification paths only      │
├─────────────────────────────────────────────────────┤
│  Infrastructure failures                            │
│  AZ outage · NAT Gateway · ALB node                 │
│  → Multi-AZ redundancy absorbs single-AZ loss       │
├─────────────────────────────────────────────────────┤
│  Service failures                                   │
│  ECS task crash · OOM kill · deployment error       │
│  → Minimum 2 tasks per service; health-check drain  │
├─────────────────────────────────────────────────────┤
│  Database failures                                  │
│  RDS primary failure · Redis node failure           │
│  → Multi-AZ automatic failover                      │
├─────────────────────────────────────────────────────┤
│  Application errors                                 │
│  Unhandled exception · timeout · invalid state      │
│  → Circuit breakers · graceful shutdown · retry     │
└─────────────────────────────────────────────────────┘
```

---

## Multi-AZ Redundancy

Every stateful component runs across 3 Availability Zones in production:

| Component | Redundancy mechanism | Failover time |
|-----------|---------------------|---------------|
| ALB | AWS-managed multi-AZ | Transparent |
| ECS tasks | Min 2 tasks spread across AZs | Seconds (health check) |
| RDS PostgreSQL | Multi-AZ standby with sync replication | ~60s automatic failover |
| ElastiCache Redis | Primary + replica, Multi-AZ | ~30s automatic failover |
| NAT Gateway | One per AZ (production) | None — per-AZ routing |

---

## Service Health Checks

Every ECS task exposes a `/health` endpoint evaluated every 15 seconds:

```typescript
// Checks: DB connectivity, Redis ping, disk (if applicable)
GET /health

Response 200:
{
  "status": "healthy",
  "timestamp": "2026-02-19T10:30:00.000Z",
  "service": "appointment-service",
  "version": "1.4.2",
  "checks": {
    "database": "ok",
    "redis":    "ok"
  }
}

Response 503:
{
  "status": "unhealthy",
  "checks": {
    "database": "error: connection timeout",
    "redis":    "ok"
  }
}
```

The ALB deregisters unhealthy targets after 2 consecutive failures (30s). ECS replaces crashed tasks automatically. A task that fails its health check 5 times is stopped and replaced.

---

## Graceful Shutdown

Every service handles `SIGTERM` from ECS (sent 30 seconds before task stop):

```typescript
// infrastructure/http/graceful-shutdown.ts

process.on('SIGTERM', async () => {
  logger.info('SIGTERM received — starting graceful shutdown')

  // 1. Stop accepting new connections
  server.close()

  // 2. Wait for in-flight requests to complete (max 25s)
  await waitForRequestsDrain(25_000)

  // 3. Flush any pending BullMQ jobs (do not abandon mid-processing)
  await jobQueues.close()

  // 4. Close Prisma connections cleanly
  await prisma.$disconnect()

  // 5. Close Redis connections
  await redis.quit()

  logger.info('Graceful shutdown complete')
  process.exit(0)
})
```

The ALB connection draining period is set to 30 seconds — matching the ECS stop timeout — so existing connections are served before the task dies.

---

## Circuit Breakers

Inter-service HTTP calls use a circuit breaker to prevent cascading failures:

```typescript
// packages/shared-utils/src/retry.ts
// Pattern: Closed → Open (after 5 failures in 60s) → Half-Open (after 30s)

import CircuitBreaker from 'opossum'

const breaker = new CircuitBreaker(httpClient.get, {
  timeout:              5000,    // ms — request times out after 5s
  errorThresholdPercentage: 50,  // open circuit when >50% of calls fail
  resetTimeout:         30_000,  // try again after 30s
  volumeThreshold:      5,       // minimum calls before statistics apply
})

breaker.fallback((url) => {
  logger.warn({ url }, 'Circuit open — returning fallback')
  throw new ServiceUnavailableError(`Downstream service temporarily unavailable`)
})
```

When the circuit is open, the service returns a `503 Service Unavailable` immediately rather than queuing requests that will time out.

---

## Retry Strategy

### Idempotent operations (GET, HEAD)
```
Max retries: 3
Backoff:     Exponential — 100ms, 200ms, 400ms
Jitter:      ±20ms random to avoid thundering herd
Retry on:    429, 502, 503, 504, ECONNRESET, ETIMEDOUT
```

### Non-idempotent operations (POST payments, bookings)
```
Max retries: 0  — caller must use Idempotency-Key header and retry explicitly
```

### Background job retries (BullMQ)
```typescript
{
  attempts: 5,
  backoff: { type: 'exponential', delay: 1000 },
  removeOnComplete: { age: 86400 },   // keep for 24h
  removeOnFail:     { age: 604800 },  // keep failed jobs for 7d
}
```

Failed jobs after max attempts are moved to a dead-letter queue — visible in the Bull dashboard and alerting SNS.

---

## Database Failure Scenarios

### RDS Primary Instance Failure

```
Normal:
  ECS Tasks → Primary RDS (eu-west-2a)
               Standby RDS (eu-west-2b)  [synchronous replication]

Failure (eu-west-2a AZ goes down):
  t=0    Primary unhealthy detected by RDS
  t=60s  Automatic failover — standby promoted to primary
         DNS CNAME updated: lomash-postgres.xxx.rds.amazonaws.com → eu-west-2b
  t=75s  Prisma reconnects (exponential backoff, max 30s retry window)
  Impact: ~60–90s of DB write unavailability

Mitigation:
  - Read replica in eu-west-2c remains available for reads during failover
  - Services with Redis caching (product, content) continue serving cached data
  - auth-service sessions in Redis remain valid — login continues working
  - Write operations (bookings, payments) queue in BullMQ and replay after reconnect
```

### Redis Primary Failure (ElastiCache)

```
Failover time: ~30s (replica promoted automatically)
Impact during failover:
  - Rate limiting temporarily disabled (fail-open policy — allow requests through)
  - Session verification falls back to JWT expiry-only check (access tokens ≤15min)
  - Caches miss — all reads fall through to PostgreSQL (higher DB load, still functional)
  - Slot booking locks unavailable — slot conflict prevention falls back to DB EXCLUDE constraint
```

---

## External Service Failures

### Stripe Outage

```
Payment intent creation fails:
  → Return 503 with Retry-After: 60 header
  → Customer sees "Payment temporarily unavailable, please try again"
  → No charge attempted — safe to retry

Webhook delivery delayed:
  → Stripe retries webhooks for up to 72 hours
  → Orders remain in PENDING state — no false confirmations
  → reconcile-payments.job.ts runs nightly to re-check payment status
     via stripe.paymentIntents.retrieve() for orders stuck in PENDING > 1 hour
```

### AWS SES Outage (Email)

```
notification-service detects SES send failure (HTTP 503)
  → Retry with exponential backoff (3 attempts)
  → Fall back to secondary SMTP provider (Nodemailer via SendGrid)
  → If all providers fail: persist to dead-letter queue
  → retry-failed-messages.job.ts retries every 15 minutes for up to 24 hours
  → Alert ops team via SNS if email undelivered after 24 hours
```

### Twilio Outage (SMS)

```
SMS send fails:
  → Retry once immediately
  → Fall back to MSG91 (secondary SMS provider)
  → If both fail: log to notification_logs with status=FAILED
  → Customer still receives email confirmation (redundant channel)
```

---

## Deployment Failure Recovery

### Failed ECS Deployment

Blue/Green deployment via CodeDeploy:

```
New version deployed to 10% of traffic (canary)
  ├── Automated smoke tests run (5 min bake period)
  │     Pass → increase to 100%
  │     Fail → automatic rollback:
  │               CodeDeploy re-routes 100% to old task definition
  │               New tasks drained and stopped
  │               Alert sent to ops team
  └── Full rollback completes in ~2 minutes
```

Manual rollback:

```bash
# GitHub Actions: rollback.yml
# Re-points ECS service to previous task definition revision
aws ecs update-service \
  --cluster lomash-production \
  --service auth-service \
  --task-definition auth-service:PREVIOUS_REVISION
```

### Failed Database Migration

```
Migration applied before ECS update-service
  ├── Migration fails:
  │     → New ECS tasks never start (old tasks still running)
  │     → Service is uninterrupted on old code + old schema
  │     → Ops manually rolls back migration (Prisma supports down migrations)
  │
  └── Migration succeeds but new code fails:
        → Blue/Green rollback routes back to old tasks (old code + new schema)
        → New schema must be backward-compatible with old code (additive-only policy)
        → Non-backward-compatible changes require a two-phase deploy:
            Phase 1: deploy schema change (old code handles both)
            Phase 2: deploy code change (removes old compatibility shim)
```

---

## Chaos Engineering Tests

Scheduled quarterly via `tools/chaos-testing/`:

| Test | Component | Expected outcome |
|------|-----------|----------------|
| `pod-killer.ts` | Kill random ECS task | ECS replaces within 30s; no user impact |
| `latency-injector.ts` | Add 2s latency to product-service | Circuit breaker opens; API gateway returns 503 |
| `network-partition.ts` | Block Redis from ECS tasks | Services serve degraded (no cache); DB handles load |
| `cpu-hog.ts` | Saturate ECS task CPU | Auto-scaling adds tasks within 3 minutes |
| `memory-leak.ts` | Exhaust task memory | ECS OOM kill; task replaced; no data loss |