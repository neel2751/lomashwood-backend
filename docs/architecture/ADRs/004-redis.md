# ADR 004: Redis for Caching and Session Storage

## Status

Accepted

## Date

2026-02-01

## Context

The Lomash Wood platform has several performance-sensitive requirements that PostgreSQL alone cannot satisfy at the target response times:

- Product filter pages must load in under 3 seconds under normal load (NFR1.1). Filter queries with multiple join conditions (colour, style, finish, range) against large product tables are expensive to recompute on every request.
- The auth-service must validate JWT tokens and check token blacklists on every authenticated request without hitting the database.
- The appointment-service must check slot availability in real time across concurrent booking requests.
- The analytics-service aggregates metric counters (total bookings, revenue) that are read frequently by the admin dashboard.

A caching layer is required to reduce database load, reduce response latency, and support high-frequency read patterns.

## Decision

We adopt **Redis** as the shared caching and in-memory data layer across all microservices. Each service manages its own Redis key namespace to avoid key collisions. In production, Redis is deployed as an ElastiCache cluster via `infra/terraform/modules/redis/`.

Redis is used for the following purposes across services:

| Use Case | Service | Pattern |
|---|---|---|
| Product listing cache | product-service | Read-through, TTL: 5 min |
| Product detail cache | product-service | Read-through, TTL: 10 min |
| Session storage | auth-service | Write-on-login, TTL: session expiry |
| Token blacklist | auth-service | Write-on-logout, TTL: token expiry |
| OTP storage | auth-service | Write-on-issue, TTL: 10 min |
| Slot availability cache | appointment-service | Read-through, TTL: 30 sec |
| Dashboard metric counters | analytics-service | INCR/DECR, no TTL |
| Dashboard snapshot cache | analytics-service | Write-on-compute, TTL: 5 min |
| Rate limit counters | api-gateway | INCR with sliding window, TTL: 1 min |

## Key Naming Convention

All Redis keys follow the pattern:

```
{service}:{entity}:{identifier}:{qualifier?}

Examples:
  product:list:kitchen:page:1:limit:20
  product:detail:uuid-xxx
  auth:session:uuid-xxx
  auth:blacklist:jwt-jti-xxx
  auth:otp:email@example.com
  appointment:slots:consultantId:date
  analytics:metric:bookings:total
  analytics:dashboard:snapshot:2026-02-01
  gateway:ratelimit:ip:192.168.1.1
```

Defined in each service's `infrastructure/cache/redis.keys.ts`.

## Cache Invalidation Strategy

| Trigger | Invalidation Method |
|---|---|
| Product updated (admin) | Delete `product:detail:{id}`, SCAN+DEL `product:list:*` |
| Inventory updated | Delete `product:detail:{id}`, SCAN+DEL `product:list:*` |
| Slot booked | Delete `appointment:slots:{consultantId}:{date}` |
| Session logout | Write token JTI to blacklist with TTL |
| Dashboard recomputed | Write new snapshot, old key expires via TTL |

SCAN+DEL is used for pattern-based invalidation rather than `KEYS` to avoid blocking the Redis event loop.

## Redis Health Monitoring

Each service implements `infrastructure/cache/redis.health.ts` which:

- Pings Redis on startup and exposes health status via `/health`
- Toggles a `REDIS_AVAILABLE` flag accessible to the service
- On Redis unavailability: service falls back to direct DB reads (degraded mode)
- Logs reconnection events via structured logger

## Event Bus (Redis Streams)

In addition to caching, Redis Streams (`XADD` / `XREADGROUP`) is used as the event bus transport in development and staging environments (see ADR 003). This dual use of Redis is intentional in early phases to reduce infrastructure count. The event bus abstraction in `packages/event-bus` allows migration to Kafka without changing service code.

## Consequences

### Positive

- Product filter pages achieve sub-300ms response times for cached queries.
- Token blacklisting enables stateless JWT auth with revocation capability.
- Dashboard metric counters are updated in O(1) time via Redis INCR.
- Rate limiting is enforced at the gateway without DB overhead.
- Redis Streams serves as the event bus transport, reducing infrastructure components.

### Negative

- Cache invalidation bugs can serve stale product or availability data. Mitigated by conservative TTLs and explicit invalidation on write.
- Redis is an additional operational dependency. Mitigated by ElastiCache managed service and graceful degradation to DB reads.
- Redis is in-memory; data is not durable by default. Session and OTP data is acceptable to lose on Redis restart (users re-login or re-request OTP). Metric counters are recomputed from DB on restart via `rebuild-dashboards.job.ts`.

## Alternatives Considered

### Memcached

Rejected. Memcached does not support Redis Streams (event bus use case), does not support sorted sets (leaderboard/ranking patterns), and lacks the rich data structure support needed for rate limiting (sliding window counters).

### In-Process Memory Cache (e.g., node-cache)

Rejected. In-process caches are not shared across horizontally scaled service instances. With Kubernetes HPA spinning up multiple pods, in-process caches would cause cache miss storms and inconsistent behaviour between pods.

### No Cache (DB Only)

Rejected. Product filter queries with multiple joins against large datasets exceed the 3-second performance target under moderate load. Token blacklisting without Redis requires a DB lookup on every authenticated request, introducing unacceptable latency at scale.

## Related ADRs

- ADR 002: PostgreSQL (primary data store that Redis complements)
- ADR 003: Event Bus (Redis Streams as event transport)
- ADR 008: Observability (Redis monitoring via Grafana dashboards)