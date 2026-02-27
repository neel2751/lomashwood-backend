# Prometheus — Lomash Wood Backend

## Overview

This directory contains the complete Prometheus configuration for the Lomash Wood observability stack. Prometheus is the central metrics collection and alerting engine, scraping all microservices, infrastructure components, and external endpoints.

---

## Files

| File | Purpose |
|------|---------|
| `prometheus.yml` | Main Prometheus configuration — global settings, alertmanager targets, rule file references, and all scrape job definitions using Kubernetes service discovery |
| `rules.yml` | Alerting rules for all services — HTTP errors, latency, payments, database, infrastructure, auth anomalies, appointments, notifications, and SLO burn rate |
| `alerts.yml` | Alertmanager routing configuration — PagerDuty, Slack `#incidents`, `#alerts`, `#security-alerts`, and `#devops-alerts` with inhibition rules |
| `recording-rules.yml` | Pre-computed recording rules for dashboard performance — HTTP rates, latency percentiles, error rates, database metrics, Redis metrics, SLO calculations, and business metrics |
| `scrape-targets.yml` | Complete static and Kubernetes SD scrape target catalogue — all services, all databases, Redis, blackbox health probes, node exporter, and kube-state-metrics |

---

## Architecture

```
                    ┌─────────────────────────────────┐
                    │           Prometheus              │
                    │         (port 9090)              │
                    └────────┬────────────┬────────────┘
                             │            │
              ┌──────────────┘            └──────────────┐
              ▼                                           ▼
   ┌─────────────────────┐                  ┌────────────────────┐
   │  Service Endpoints  │                  │   Alertmanager     │
   │  /metrics (9100)    │                  │   (port 9093)      │
   │                     │                  └────────┬───────────┘
   │  - api-gateway      │                           │
   │  - auth-service     │               ┌───────────┼───────────┐
   │  - product-service  │               ▼           ▼           ▼
   │  - order-payment    │         PagerDuty      Slack       Slack
   │  - appointment      │         (critical)   #incidents  #alerts
   │  - content          │
   │  - customer         │
   │  - notification     │
   │  - analytics        │
   └─────────────────────┘

   ┌─────────────────────┐
   │  Infrastructure     │
   │                     │
   │  - postgres-exporter│  (×8 databases)
   │  - redis-exporter   │
   │  - node-exporter    │
   │  - cadvisor         │
   │  - kube-state-metrics│
   │  - blackbox-exporter │  (health probes)
   └─────────────────────┘
```

---

## Metrics Exposed Per Service

Each microservice exposes a `/metrics` endpoint on port `9100` using the `prom-client` Node.js library.

### Standard HTTP Metrics (All Services)

```
http_requests_total{method, route, status, service}
http_request_duration_seconds{method, route, service, le}
http_requests_in_flight{service}
```

### auth-service Custom Metrics

```
auth_login_attempts_total{result}
auth_login_failures_total{reason}
auth_registrations_total
auth_active_sessions_total
auth_token_refreshes_total
```

### order-payment-service Custom Metrics

```
payment_intent_created_total
payment_transactions_total{status, failure_code}
payment_amount_gbp_total{status}
refund_issued_total
webhook_processing_duration_seconds{event_type, le}
webhook_queue_depth
order_age_seconds{status}
```

### appointment-service Custom Metrics

```
appointment_bookings_total{type}
appointment_cancellations_total{reason}
appointment_slots_available_total
appointment_page_views_total
```

### product-service Custom Metrics

```
products_total{category, status}
product_page_views_total{category}
product_search_requests_total
product_cache_hits_total
product_cache_misses_total
```

### notification-service Custom Metrics

```
notification_sent_total{channel, status}
email_sent_total{status, template}
sms_sent_total{status}
```

### Business Metrics (Aggregated)

```
orders_created_total
brochure_requests_total
newsletter_subscriptions_total
```

---

## Alert Severity Levels and Routing

| Severity | Channel | Tool | Examples |
|----------|---------|------|---------|
| `critical` | `#incidents` + PagerDuty | Wake on-call engineer | ServiceDown, PaymentServiceDown, PostgresDown, HighErrorRate > 1% |
| `warning` | `#alerts` | Slack notification only | ElevatedErrorRate > 0.5%, HighP95Latency, RedisHighMemoryUsage |
| `security` | `#security-alerts` | Slack + email | HighLoginFailureRate, suspicious auth activity |
| `devops` | `#devops-alerts` | Slack notification | NodeHighCPU, DiskPressure, HPAMaxReplicasReached |

### Alert Inhibition

The following inhibition rules prevent alert storms:

- `critical` alerts suppress `warning` alerts for the same service
- `ServiceDown` suppresses all other alerts for that service
- `PostgresDown` suppresses database-level warnings for the same instance
- `RedisDown` suppresses `RedisHighMemoryUsage`

---

## Recording Rules Reference

Recording rules pre-compute expensive queries for dashboard performance.

### Naming Convention

```
<namespace>:<metric>:<aggregation>
```

Examples:
- `job:http_requests_total:rate5m` — HTTP request rate per service, 5-minute window
- `job:http_request_duration_seconds:p95_5m` — P95 latency per service, 5-minute window
- `slo:api_gateway:availability_rate:rate30d` — 30-day availability for SLO tracking
- `business:daily_revenue_gbp:rate24h` — Daily revenue in GBP (24-hour rolling)

### SLO Recording Rules

| Rule | Description | SLO Target |
|------|------------|-----------|
| `slo:api_gateway:availability_rate:rate30d` | API Gateway 30-day availability | 99.9% |
| `slo:payments:success_rate:rate30d` | Payment success rate (30-day) | 99.95% |
| `slo:error_budget_remaining:rate30d` | Remaining error budget fraction | > 0 |
| `slo:auth_service:availability_rate:rate7d` | Auth service 7-day availability | 99.9% |

---

## Kubernetes Service Discovery Configuration

Prometheus uses Kubernetes SD to automatically discover pods in the `lomash-wood` namespace. Pods must have the following labels for auto-discovery:

```yaml
metadata:
  labels:
    app: <service-name>
  annotations:
    prometheus.io/scrape: "true"
    prometheus.io/port: "9100"
    prometheus.io/path: "/metrics"
```

---

## Blackbox Probes

External HTTP probes are configured for all public-facing endpoints:

| Probe Target | Module | Expected Response |
|-------------|--------|-----------------|
| `https://api.lomashwood.com/health` | `http_2xx` | 200 OK |
| `https://api.lomashwood.com/v1/auth/health` | `http_2xx` | 200 OK |
| `https://api.lomashwood.com/v1/products/health` | `http_2xx` | 200 OK |
| `https://api.lomashwood.com/v1/orders/health` | `http_2xx` | 200 OK |
| `https://api.lomashwood.com/v1/appointments/health` | `http_2xx` | 200 OK |
| `https://www.lomashwood.com` | `http_2xx` | 200 OK |
| `api.lomashwood.com:443` | `tcp_connect` | SSL handshake |
| `www.lomashwood.com:443` | `tcp_connect` | SSL handshake |

SSL certificate expiry alerts fire when less than 14 days remain.

---

## Deployment

### Kubernetes ConfigMap

```bash
kubectl create configmap prometheus-config \
  --from-file=prometheus.yml \
  --from-file=rules.yml \
  --from-file=alerts.yml \
  --from-file=recording-rules.yml \
  -n monitoring

kubectl rollout restart deployment/prometheus -n monitoring
```

### Helm (kube-prometheus-stack)

```bash
helm upgrade --install kube-prometheus-stack prometheus-community/kube-prometheus-stack \
  --namespace monitoring \
  --values infra/kubernetes/helm-charts/monitoring/values.yaml \
  --set prometheus.prometheusSpec.configMaps[0]=prometheus-config
```

### Verify Configuration

```bash
kubectl exec -it prometheus-0 -n monitoring -- \
  promtool check config /etc/prometheus/prometheus.yml

kubectl exec -it prometheus-0 -n monitoring -- \
  promtool check rules /etc/prometheus/rules.yml

kubectl exec -it prometheus-0 -n monitoring -- \
  promtool check rules /etc/prometheus/recording-rules.yml
```

### Test Alert Routing

```bash
kubectl exec -it alertmanager-0 -n monitoring -- \
  amtool check-config /etc/alertmanager/alerts.yml

kubectl exec -it alertmanager-0 -n monitoring -- \
  amtool alert add alertname="TestAlert" severity="warning" service="api-gateway" \
  --alertmanager.url=http://localhost:9093
```

---

## Accessing the UI

| Tool | URL | Notes |
|------|-----|-------|
| Prometheus | `http://prometheus.monitoring.svc:9090` | Internal only |
| Alertmanager | `http://alertmanager.monitoring.svc:9093` | Internal only |
| Grafana | `https://grafana.lomashwood.com` | External, SSO required |

Port-forward for local access:

```bash
kubectl port-forward svc/prometheus 9090:9090 -n monitoring
kubectl port-forward svc/alertmanager 9093:9093 -n monitoring
```

---

## Retention and Storage

```yaml
# prometheus.yml (applied via Helm values)
retention: 15d
retentionSize: 50GB
storageSpec:
  volumeClaimTemplate:
    spec:
      storageClassName: gp3
      resources:
        requests:
          storage: 100Gi
```

Long-term metrics are stored in Grafana Mimir or Thanos (to be configured at scale). Reference: `observability/grafana/` for dashboard configuration.