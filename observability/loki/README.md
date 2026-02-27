# Loki — Lomash Wood Log Aggregation

Centralized log aggregation for all Lomash Wood microservices using Grafana Loki + Promtail.

## Files

| File | Purpose |
|---|---|
| `loki-config.yml` | Core Loki server configuration |
| `promtail-config.yml` | Promtail agent — scrapes and ships logs from all services |
| `retention.yml` | Per-service log retention policies |
| `alert-rules.yml` | LogQL-based alerting rules |

## Services Monitored

- api-gateway
- auth-service
- product-service
- order-payment-service
- appointment-service
- content-service
- customer-service
- notification-service
- analytics-service

## Retention Policy

| Service | Retention |
|---|---|
| order-payment-service | 90 days |
| customer-service | 90 days |
| analytics-service | 90 days |
| auth-service | 31 days |
| api-gateway | 31 days |
| appointment-service | 60 days |
| notification-service | 30 days |
| content-service | 15 days |
| `level="error"` (all) | 90 days |
| `level="warn"` (all) | 60 days |

## Alert Groups

- **Error Alerts** — high error rates per service
- **Security Alerts** — brute force, unauthorized access, rate limiting
- **Database Alerts** — Prisma errors, slow queries
- **Business Alerts** — booking drop-off, brochure/newsletter failures
- **Infrastructure Alerts** — service down, Redis failures, S3 upload errors

## Starting Loki

```bash
docker compose up -d loki promtail
```

## Querying Logs

Access Grafana at `http://localhost:3000` and use the Explore panel with the Loki datasource.

Example queries:

```logql
# All errors from order-payment-service
{service="order-payment-service", level="error"}

# Stripe webhook failures
{service="order-payment-service"} |= "stripe webhook" |= "error"

# Failed login attempts
{service="auth-service"} |= "invalid credentials"

# Appointment bookings created
{service="appointment-service"} |= "booking created"
```