# Grafana — Lomash Wood Backend

## Overview

This directory contains the complete Grafana provisioning configuration for the Lomash Wood observability stack. Grafana is the primary visualisation and alerting UI, consuming metrics from Prometheus, logs from Loki, traces from Tempo, and direct database queries from PostgreSQL read-only connections.

**URL:** `https://grafana.lomashwood.com`
**Version:** Grafana 10.x
**Default home dashboard:** API Gateway Overview

---

## Files

| File | Purpose |
|------|---------|
| `grafana.ini` | Complete Grafana server configuration — HTTPS, PostgreSQL backend database, Redis session cache, SMTP via AWS SES, unified alerting, OpenTelemetry tracing to Tempo, S3 external image storage, Google OAuth, and all security headers |
| `datasources.yml` | All data source definitions — Prometheus (prod + staging), Loki (prod + staging), Tempo, Alertmanager, PostgreSQL read-only connections for orders/auth/appointments/analytics, and TestData |
| `dashboards.yml` | Dashboard provisioning configuration — 6 folder structure (Core Services, Infrastructure, Business Metrics, SLO & SLA, Security, Staging), all 16 dashboard registrations with descriptions, tags, and refresh intervals |
| `users.yml` | User provisioning, team definitions, folder-level RBAC assignments, alert notification channels (PagerDuty, Slack `#incidents`, Slack `#alerts`, Email), API keys, and org preferences |
| `plugins.yml` | Plugin catalogue — installed panel plugins, datasource plugins, and app plugins (OnCall, Incident, SLO, K8s, GitHub, Synthetic Monitoring, ML, LLM) with configuration |

---

## Dashboard Catalogue

### Core Services (folder: `core-services`)

| Dashboard | UID | Refresh | Key Panels |
|-----------|-----|---------|-----------|
| API Gateway | `api-gateway-dashboard` | 30s | Request rate, error rate, P95 latency per route, rate limit hits |
| Auth Service | `auth-service-dashboard` | 30s | Login attempts, failures heatmap, active sessions, lockouts |
| Product Service | `product-service-dashboard` | 30s | Catalogue size, page views, search volume, cache hit rate |
| Order & Payment | `order-payment-service-dashboard` | 10s | Payment success/fail rate, order state funnel, webhook queue, revenue/hr |
| Appointment Service | `appointment-service-dashboard` | 30s | Booking rate by type, available slots, cancellation rate, conversion funnel |
| Content Service | `content-service-dashboard` | 60s | Blog publish rate, media uploads, S3 throughput, sitemap job status |
| Customer Service | `customer-service-dashboard` | 60s | Profile updates, wishlist activity, review submissions, support tickets |
| Notification Service | `notification-service-dashboard` | 60s | Email/SMS/push delivery rate, provider comparison, retry queue |
| Analytics Service | `analytics-service-dashboard` | 60s | Event ingestion rate, funnel completions, export job status |

### Infrastructure (folder: `infrastructure`)

| Dashboard | UID | Refresh | Key Panels |
|-----------|-----|---------|-----------|
| Infrastructure Overview | `infra-dashboard` | 30s | Node CPU/memory/disk, pod restarts, HPA events, PVC usage |
| Database Overview | `database-dashboard` | 30s | Connection utilisation ×8 DBs, cache hit rate, replication lag, slow queries |
| Redis Cache | `redis-dashboard` | 15s | Memory usage, hit/miss rate, ops/sec, keyspace breakdown |
| Event Bus | `kafka-dashboard` | 30s | Producer throughput, consumer lag per service, dead-letter queue depth |

### Business Metrics (folder: `business-metrics`)

| Dashboard | UID | Refresh | Key Panels |
|-----------|-----|---------|-----------|
| Business Metrics | `business-metrics-dashboard` | 5m | Revenue (daily/weekly/monthly), orders, AOV, bookings by type, brochure requests |

### SLO & SLA (folder: `slo-sla`)

| Dashboard | UID | Refresh | Key Panels |
|-----------|-----|---------|-----------|
| SLO / SLA Tracker | `sla-slo-dashboard` | 5m | Per-service availability 7d/30d, error budget burn rate, SLO breach history |
| Error Rate | `error-rate-dashboard` | 30s | 5xx rate per service, 4xx breakdown, error spike timeline, top error routes |
| Latency | `latency-dashboard` | 30s | P50/P95/P99 heatmaps, slow request log, Stripe API latency, DB query time |

### Security (folder: `security`)

| Dashboard | UID | Refresh | Key Panels |
|-----------|-----|---------|-----------|
| Security Overview | `security-overview-dashboard` | 1m | Login failure heatmap, WAF blocks, token revocations, rate limit breaches |

---

## Data Sources

### Primary Sources

| Name | Type | UID | Used For |
|------|------|-----|---------|
| Prometheus | Prometheus | `prometheus-lomash-wood` | All metrics, recording rules, alerting |
| Loki | Loki | `loki-lomash-wood` | Structured JSON logs from all services |
| Tempo | Tempo | `tempo-lomash-wood` | Distributed traces (OpenTelemetry) |
| Alertmanager | Alertmanager | `alertmanager-lomash-wood` | Alert state management |

### PostgreSQL Read-Only Sources

| Name | Database | UID | Used For |
|------|---------|-----|---------|
| PostgreSQL-Orders | `lomash_orders` | `postgres-orders` | Order analytics, payment reconciliation panels |
| PostgreSQL-Auth | `lomash_auth` | `postgres-auth` | User registration trends, session counts |
| PostgreSQL-Appointments | `lomash_appointments` | `postgres-appointments` | Booking patterns, showroom utilisation |
| PostgreSQL-Analytics | `lomash_analytics` | `postgres-analytics` | Business analytics, funnel data |

All PostgreSQL data sources use a dedicated `grafana_readonly` user with `SELECT` permissions only. Credentials are injected via environment variables at runtime.

### Trace ↔ Log ↔ Metric Correlation

Grafana is configured for end-to-end correlation:

```
Trace in Tempo → Click TraceID → Jump to Loki logs for that trace
Log in Loki    → Click TraceID → Jump to Tempo trace
Tempo span     → Click service → Jump to Prometheus metrics for that service + time
```

Derived fields configured in Loki:
- `traceId` field → links to Tempo trace
- `requestId` field → links to Tempo trace

Exemplars configured in Prometheus → visible in timeseries panels → link to Tempo trace.

---

## User Roles and Access

| Role | Users | Dashboard Access |
|------|-------|-----------------|
| Admin | devops@lomashwood.com, engineering-manager@lomashwood.com | Full access — all folders, edit/delete |
| Editor | backend-lead@lomashwood.com | Core Services (Edit), Infrastructure (View), Staging (Edit) |
| Viewer | CTO, Finance | Business Metrics, SLO (View only) |

Team-level folder permissions are applied via `users.yml`. Finance team sees only Business Metrics. Management sees Business Metrics, SLO, Core Services, and Infrastructure (all view-only).

---

## Alert Notification Channels

| Channel | Type | Triggered By | Destination |
|---------|------|-------------|------------|
| PagerDuty-Critical | PagerDuty | P0/P1 critical alerts | On-call engineer via PagerDuty |
| Slack-Incidents | Slack | All critical alerts | `#incidents` with `@here` mention |
| Slack-Alerts | Slack | All warning alerts | `#alerts` (default) |
| Email-OnCall | Email | Fallback critical alerts | oncall@lomashwood.com |

---

## Installed Plugins

### Panel Plugins

| Plugin | Use Case |
|--------|---------|
| `grafana-piechart-panel` | Payment failure breakdown by error code |
| `grafana-polystat-panel` | Multi-service health summary panel |
| `grafana-treemap-panel` | Product category revenue breakdown |
| `marcusolsson-dynamictext-panel` | Rich HTML status panels |
| `volkovlabs-echarts-panel` | Custom business metric charts |
| `grafana-clock-panel` | Timezone display on dashboards |

### App Plugins

| Plugin | Purpose |
|--------|---------|
| `grafana-oncall-app` | On-call scheduling integrated with Grafana alerts |
| `grafana-incident-app` | Incident management within Grafana |
| `grafana-slo-app` | Native SLO tracking with error budget visualisation |
| `grafana-k8s-app` | Kubernetes cluster navigation |
| `grafana-github-datasource` | Deployment markers from GitHub commits |
| `grafana-synthetic-monitoring-app` | External uptime checks |
| `grafana-ml-app` | Anomaly detection on key metrics |

---

## Deployment

### Kubernetes ConfigMaps

```bash
kubectl create configmap grafana-config \
  --from-file=grafana.ini \
  -n monitoring

kubectl create configmap grafana-datasources \
  --from-file=datasources.yml \
  -n monitoring

kubectl create configmap grafana-dashboards-provisioning \
  --from-file=dashboards.yml \
  -n monitoring

kubectl create configmap grafana-plugins \
  --from-file=plugins.yml \
  -n monitoring
```

### Helm Deployment

```bash
helm upgrade --install grafana grafana/grafana \
  --namespace monitoring \
  --values infra/kubernetes/helm-charts/monitoring/grafana-values.yaml \
  --set persistence.enabled=true \
  --set persistence.storageClassName=gp3 \
  --set persistence.size=10Gi \
  --set env.GF_DATABASE_PASSWORD="${GF_DATABASE_PASSWORD}" \
  --set env.GF_SECURITY_ADMIN_PASSWORD="${GF_SECURITY_ADMIN_PASSWORD}" \
  --set env.GF_SECURITY_SECRET_KEY="${GF_SECURITY_SECRET_KEY}"
```

### Environment Variables Required

```bash
GF_DATABASE_PASSWORD                        # Grafana PostgreSQL backend password
GF_SECURITY_ADMIN_PASSWORD                  # Initial admin password
GF_SECURITY_SECRET_KEY                      # 32+ char secret key for cookie signing
GF_SMTP_USER                                # AWS SES SMTP username
GF_SMTP_PASSWORD                            # AWS SES SMTP password
GF_AUTH_GOOGLE_CLIENT_ID                    # Google OAuth client ID
GF_AUTH_GOOGLE_CLIENT_SECRET                # Google OAuth client secret
GF_AUTH_GITHUB_CLIENT_ID                    # GitHub OAuth client ID
GF_AUTH_GITHUB_CLIENT_SECRET                # GitHub OAuth client secret
GF_PAGERDUTY_INTEGRATION_KEY               # PagerDuty Events API v2 key
GF_SLACK_INCIDENTS_WEBHOOK_URL             # Slack incoming webhook — #incidents
GF_SLACK_ALERTS_WEBHOOK_URL                # Slack incoming webhook — #alerts
GF_EXTERNAL_IMAGE_S3_ACCESS_KEY            # AWS key for screenshot S3 upload
GF_EXTERNAL_IMAGE_S3_SECRET_KEY            # AWS secret for screenshot S3 upload
GF_METRICS_BASIC_AUTH_PASSWORD             # Password for /metrics scrape endpoint
GF_DATASOURCE_POSTGRES_ORDERS_PASSWORD     # Read-only DB password — lomash_orders
GF_DATASOURCE_POSTGRES_AUTH_PASSWORD       # Read-only DB password — lomash_auth
GF_DATASOURCE_POSTGRES_APPOINTMENTS_PASSWORD  # Read-only DB password — lomash_appointments
GF_DATASOURCE_POSTGRES_ANALYTICS_PASSWORD  # Read-only DB password — lomash_analytics
GF_ONCALL_API_TOKEN                        # Grafana OnCall API token
GF_GITHUB_ACCESS_TOKEN                     # GitHub personal access token
GF_LLM_OPENAI_API_KEY                      # OpenAI key for Grafana LLM plugin
```

All secrets are managed in AWS Secrets Manager and injected into the Grafana pod at runtime via the External Secrets Operator.

### Verify Provisioning

```bash
kubectl logs deployment/grafana -n monitoring | grep -E "provisioning|datasource|dashboard|plugin"

kubectl exec -it grafana-0 -n monitoring -- \
  grafana-cli admin reset-admin-password --homepath /usr/share/grafana $NEW_PASSWORD
```

### Port-Forward for Local Access

```bash
kubectl port-forward svc/grafana 3000:3000 -n monitoring
open https://localhost:3000
```

---

## Backup and Restore

Grafana state (dashboards edited via UI, annotations, user settings) is stored in the `grafana` PostgreSQL database. This database is backed up as part of the standard RDS backup process.

Dashboard JSON files are version-controlled in `observability/dashboards/`. Changes made through the UI must be exported and committed to Git to be permanent.

```bash
curl -s https://grafana.lomashwood.com/api/dashboards/uid/api-gateway-dashboard \
  -H "Authorization: Bearer $GRAFANA_API_KEY" \
  | jq .dashboard > observability/dashboards/api-gateway-dashboard.json
```