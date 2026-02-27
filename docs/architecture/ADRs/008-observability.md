# ADR 008: Observability Stack

## Status

Accepted

## Date

2026-02-01

## Context

The Lomash Wood platform consists of nine microservices communicating via HTTP and an event bus. When something goes wrong — a slow product filter query, a failed payment webhook, a booking reminder that was not sent — the engineering team must be able to:

1. Detect the issue before customers report it (alerting)
2. Understand the scope and impact (metrics and dashboards)
3. Find the root cause across multiple services (distributed tracing)
4. Read the detailed sequence of events (structured logs)

Without a unified observability stack, each of these activities requires separate, often manual, investigation across nine services. This is not sustainable in production.

## Decision

We adopt the **Grafana LGTM stack** (Loki + Grafana + Tempo + Mimir/Prometheus) as the unified observability platform:

| Component | Purpose | Config Location |
|---|---|---|
| **Prometheus** | Metrics collection and alerting rules | `observability/prometheus/` |
| **Grafana** | Dashboards and alert routing | `observability/grafana/` |
| **Loki** | Log aggregation and querying | `observability/loki/` |
| **Tempo** | Distributed tracing | `observability/tempo/` |
| **Sentry** | Error tracking and release monitoring | `observability/sentry/` |

All observability infrastructure is deployed in the `lomash-monitoring` Kubernetes namespace.

## Metrics (Prometheus)

Each service exposes a `/metrics` endpoint in Prometheus exposition format via the `prom-client` library. Prometheus scrapes all services via `ServiceMonitor` resources defined in `infra/kubernetes/base/monitoring/servicemonitors.yaml`.

### Standard Metrics Exposed by Each Service

| Metric | Type | Description |
|---|---|---|
| `http_request_duration_seconds` | Histogram | Request latency by route, method, status code |
| `http_requests_total` | Counter | Total requests by route, method, status code |
| `db_query_duration_seconds` | Histogram | Prisma query latency by model and operation |
| `redis_operation_duration_seconds` | Histogram | Redis command latency |
| `event_publish_total` | Counter | Events published by topic |
| `event_consume_total` | Counter | Events consumed by topic and status |
| `background_job_duration_seconds` | Histogram | Cron job execution time by job name |
| `background_job_failures_total` | Counter | Cron job failures by job name |

### Service-Specific Metrics

| Service | Metric | Type |
|---|---|---|
| order-payment-service | `payment_intents_created_total` | Counter |
| order-payment-service | `payments_succeeded_total` | Counter |
| order-payment-service | `stripe_webhook_processing_duration_seconds` | Histogram |
| appointment-service | `bookings_created_total` | Counter |
| appointment-service | `slot_conflicts_total` | Counter |
| analytics-service | `tracking_events_ingested_total` | Counter |
| notification-service | `notifications_sent_total` (by channel) | Counter |
| notification-service | `notification_delivery_failures_total` | Counter |

### Alert Rules

Defined in `observability/prometheus/alerts.yml`. Key alerts:

| Alert | Condition | Severity |
|---|---|---|
| `HighErrorRate` | `http_requests_total{status=~"5.."}` rate > 5% for 5min | critical |
| `SlowResponseTime` | `http_request_duration_seconds p99 > 3s` for 5min | warning |
| `PaymentWebhookFailures` | `stripe_webhook_processing_duration_seconds` failures > 0 for 1min | critical |
| `BookingReminderLag` | `background_job_failures_total{job="send-reminders"}` > 0 | warning |
| `RedisDown` | Redis health check fails for 1min | critical |
| `DatabaseSlowQueries` | `db_query_duration_seconds p95 > 1s` for 5min | warning |
| `DLQMessageAccumulation` | DLQ depth > 0 for 5min | warning |

## Logging (Loki)

All services use **Pino** as the structured logger (configured in each service's `config/logger.ts`). Logs are written to stdout in JSON format and collected by Promtail (deployed as a DaemonSet) into Loki.

### Log Schema

```json
{
  "level": "info | warn | error | debug",
  "time": "ISO8601",
  "service": "product-service",
  "requestId": "uuid",
  "userId": "uuid | null",
  "method": "GET",
  "url": "/v1/products",
  "statusCode": 200,
  "durationMs": 45,
  "msg": "Request completed"
}
```

`requestId` is generated at the api-gateway and propagated to all internal services via the `X-Request-Id` header, enabling log correlation across services for a single user request.

### Log Retention

Defined in `observability/loki/retention.yml`:
- Production: 30 days hot, 90 days cold (S3)
- Staging: 7 days
- Development: 3 days

## Distributed Tracing (Tempo)

All services instrument OpenTelemetry traces via the `@opentelemetry/sdk-node` package. Traces are exported to Tempo via OTLP HTTP.

### Trace Propagation

The api-gateway initiates a trace span on every incoming request and injects `traceparent` / `tracestate` headers (W3C Trace Context) into proxied requests to internal services. Each internal service continues the trace by extracting these headers.

This enables a full end-to-end trace from the browser request through the gateway to every internal service involved in handling it, including database queries and Redis operations.

### Sampling Configuration

Defined in `observability/tempo/sampling.yml`:
- Production: 10% head-based sampling + 100% sampling for error traces
- Staging: 100% sampling
- Development: 100% sampling

## Error Tracking (Sentry)

Sentry is integrated in each service via `@sentry/node`. Uncaught exceptions and unhandled promise rejections are automatically captured. The global error handler middleware in each service calls `Sentry.captureException(error)` before returning the error response.

Sentry is configured with:
- Environment tagging (`production`, `staging`, `development`)
- Release tracking tied to Git SHA (injected at build time)
- Performance monitoring with 10% transaction sampling in production

## Grafana Dashboards

Pre-built dashboards are stored as JSON in `observability/dashboards/`:

| Dashboard | Key Panels |
|---|---|
| `api-gateway-dashboard.json` | Request rate, error rate, p50/p95/p99 latency, rate limit hits |
| `auth-service-dashboard.json` | Login rate, token blacklist size, OTP issue rate |
| `order-payment-service-dashboard.json` | Payment intent rate, success/failure ratio, webhook lag |
| `appointment-service-dashboard.json` | Booking rate, slot conflicts, reminder delivery rate |
| `notification-service-dashboard.json` | Email/SMS/push send rate, delivery failure rate |
| `analytics-service-dashboard.json` | Event ingestion rate, aggregation job duration |
| `business-metrics-dashboard.json` | Total bookings, revenue, conversion rates, top products |
| `sla-slo-dashboard.json` | Uptime, p99 latency vs SLO targets, error budget burn |
| `database-dashboard.json` | Query latency by service, connection pool utilisation |
| `redis-dashboard.json` | Memory usage, hit/miss rate, eviction count |

## SLO Targets

| SLO | Target |
|---|---|
| API availability | 99.9% |
| p99 response latency (product filter) | < 3000ms |
| p99 response latency (checkout) | < 2000ms |
| Payment webhook processing | < 5000ms |
| Booking confirmation email delivery | < 30 seconds |

## Consequences

### Positive

- Full observability across all nine services from a single Grafana instance.
- Distributed traces link logs, metrics, and traces for a single request across services.
- `requestId` propagation enables log correlation without distributed tracing overhead on every request.
- Pre-built dashboards reduce time-to-insight during incidents.
- Sentry provides actionable error alerts with stack traces and release attribution.

### Negative

- The observability stack itself requires operational maintenance (Prometheus retention, Loki retention, Tempo storage).
- OpenTelemetry instrumentation adds minor overhead to every request.
- Grafana, Prometheus, Loki, and Tempo each require resource allocation in the monitoring namespace.

## Alternatives Considered

### Datadog

Evaluated. Datadog provides a fully managed, unified observability platform with minimal operational overhead. Rejected due to per-host pricing that becomes significant at scale, and vendor lock-in. The open-source LGTM stack provides equivalent capability with lower long-term cost.

### ELK Stack (Elasticsearch + Logstash + Kibana)

Evaluated for logging. Rejected in favour of Loki because Loki is significantly cheaper to operate (indexes only log metadata, not full text), integrates natively with Grafana (single UI), and is operationally simpler. Loki's LogQL query language is sufficient for all anticipated log query patterns.

### AWS CloudWatch

Rejected. CloudWatch has high per-GB ingestion costs, limited query capabilities compared to Loki/Prometheus, and provides no distributed tracing without X-Ray (additional service and cost). Portability away from AWS would require replacing the entire observability stack.

## Related ADRs

- ADR 001: Microservices (nine services to observe)
- ADR 004: Redis (Redis metrics in Grafana)
- ADR 005: Kubernetes (ServiceMonitors and DaemonSets for metric/log collection)
- ADR 007: API Gateway (trace and request ID origin point)