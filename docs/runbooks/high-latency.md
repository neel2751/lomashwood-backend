# High Latency Runbook — Lomash Wood Backend

## Overview

This runbook covers high latency scenarios across all Lomash Wood microservices. Latency SLOs are defined as:

| Endpoint Type | P50 Target | P95 Target | P99 Target |
|---------------|------------|------------|------------|
| Auth (login/me) | < 100ms | < 300ms | < 500ms |
| Product list/filter | < 200ms | < 500ms | < 800ms |
| Product detail | < 150ms | < 400ms | < 600ms |
| Appointment booking | < 300ms | < 700ms | < 1000ms |
| Payment intent | < 400ms | < 900ms | < 1500ms |
| Webhook processing | < 500ms | < 1000ms | < 2000ms |

Alerts fire when P95 latency exceeds 2× the P95 target for > 5 minutes.

---

## Detection

### Grafana Dashboards

Monitor the following dashboards first:

- `dashboards/latency-dashboard.json` — per-service latency breakdown
- `dashboards/api-gateway-dashboard.json` — incoming request latency at the gateway
- `dashboards/database-dashboard.json` — query execution time per database

### Identify Affected Service

```bash
kubectl top pods -n lomash-wood --sort-by=cpu
kubectl top pods -n lomash-wood --sort-by=memory
```

Check request latency per service using Prometheus:

```promql
histogram_quantile(0.95,
  sum(rate(http_request_duration_seconds_bucket{namespace="lomash-wood"}[5m])) by (service, le)
)
```

---

## Step-by-Step Diagnosis

### Step 1 — Identify the Bottleneck Layer

Work through each layer in order:

```
Client → API Gateway → Microservice → Database / Redis / External API
```

**API Gateway latency:**

```bash
kubectl logs -n lomash-wood deployment/api-gateway --tail=200 | grep "response_time"
```

**Service-level latency:**

```bash
kubectl logs -n lomash-wood deployment/product-service --tail=200 | grep "duration"
kubectl logs -n lomash-wood deployment/order-payment-service --tail=200 | grep "duration"
```

**Database query latency:**

```bash
kubectl exec -it postgres-primary-0 -n lomash-wood -- psql -U lomash_admin -c \
  "SELECT query, calls, mean_exec_time, max_exec_time, total_exec_time
   FROM pg_stat_statements
   ORDER BY mean_exec_time DESC
   LIMIT 20;"
```

**Redis latency:**

```bash
kubectl exec -it redis-master-0 -n lomash-wood -- redis-cli --latency -i 1
kubectl exec -it redis-master-0 -n lomash-wood -- redis-cli slowlog get 25
```

**External API (Stripe) latency:**

Check the Stripe dashboard for API response time metrics.

---

## Scenario 1 — Database Query Latency

**Symptoms:** High latency on product, order, or appointment endpoints. Database query time elevated in Grafana.

**Step 1 — Identify slow queries:**

```bash
kubectl exec -it postgres-primary-0 -n lomash-wood -- psql -U lomash_admin -c \
  "SELECT pid, now() - query_start AS duration, left(query, 120) AS query
   FROM pg_stat_activity
   WHERE state = 'active' AND query_start < NOW() - INTERVAL '3 seconds'
   ORDER BY duration DESC;"
```

**Step 2 — Run EXPLAIN ANALYZE on the slow query:**

```bash
kubectl exec -it postgres-primary-0 -n lomash-wood -- psql -U lomash_admin -d <database> -c \
  "EXPLAIN (ANALYZE, BUFFERS, FORMAT TEXT) <slow query here>;"
```

Look for: `Seq Scan` on large tables (missing index), high `rows` estimates, nested loops.

**Step 3 — Add missing index if identified:**

Example for products filter page:

```bash
kubectl exec -it postgres-primary-0 -n lomash-wood -- psql -U lomash_admin -d lomash_products -c \
  "CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_products_category_status ON products(category, status) WHERE deleted_at IS NULL;"
```

**Step 4 — Update Prisma schema with the new index:**

Add to `prisma/schema.prisma` in `product-service`:

```prisma
@@index([category, status])
```

Then create and apply migration:

```bash
npx prisma migrate dev --name add_products_category_status_index
```

**Step 5 — Run VACUUM ANALYZE:**

```bash
kubectl exec -it postgres-primary-0 -n lomash-wood -- psql -U lomash_admin -d lomash_products -c \
  "VACUUM ANALYZE products;"
```

---

## Scenario 2 — Redis Cache Miss / Cache Inefficiency

**Symptoms:** Database receiving far more queries than expected. Redis hit rate low.

**Step 1 — Check Redis hit rate:**

```bash
kubectl exec -it redis-master-0 -n lomash-wood -- redis-cli info stats | grep -E "keyspace_hits|keyspace_misses"
```

Calculate hit rate: `hits / (hits + misses)`. If below 80%, cache is underperforming.

**Step 2 — Check which keys are being accessed most:**

```bash
kubectl exec -it redis-master-0 -n lomash-wood -- redis-cli --hotkeys
```

**Step 3 — Check TTL settings on cache keys:**

```bash
kubectl exec -it redis-master-0 -n lomash-wood -- redis-cli TTL "product:list:kitchen"
kubectl exec -it redis-master-0 -n lomash-wood -- redis-cli TTL "product:detail:abc123"
```

Review `src/infrastructure/cache/redis.keys.ts` in the affected service for TTL configuration.

**Step 4 — Pre-warm cache for high-traffic keys:**

```bash
kubectl exec -it <product-service-pod> -n lomash-wood -- node -e "
  const { cacheWarmup } = require('./dist/jobs/rebuild-search-index.job');
  cacheWarmup();
"
```

Or trigger the rebuild job manually:

```bash
kubectl create job --from=cronjob/rebuild-search-index rebuild-search-index-manual -n lomash-wood
```

---

## Scenario 3 — CPU Saturation

**Symptoms:** High CPU usage on one or more service pods. Requests queuing.

**Step 1 — Identify high-CPU pods:**

```bash
kubectl top pods -n lomash-wood --sort-by=cpu
```

**Step 2 — Check if autoscaling has triggered:**

```bash
kubectl get hpa -n lomash-wood
kubectl describe hpa <service>-hpa -n lomash-wood
```

**Step 3 — Manually scale if HPA is slow to react:**

```bash
kubectl scale deployment/product-service --replicas=6 -n lomash-wood
kubectl scale deployment/api-gateway --replicas=5 -n lomash-wood
```

**Step 4 — Profile what is consuming CPU:**

```bash
kubectl exec -it <pod-name> -n lomash-wood -- top -b -n 1
```

If a background job is consuming CPU unexpectedly:

```bash
kubectl logs <pod-name> -n lomash-wood --tail=500 | grep -E "job|cron|scheduler"
```

Temporarily disable the offending cron job:

```bash
kubectl patch cronjob <job-name> -n lomash-wood -p '{"spec":{"suspend": true}}'
```

---

## Scenario 4 — Memory Pressure / OOMKilled

**Symptoms:** Pods restarting. `kubectl describe pod` shows `OOMKilled` as reason.

**Step 1 — Verify OOM kill:**

```bash
kubectl describe pod <pod-name> -n lomash-wood | grep -A5 "Last State"
```

**Step 2 — Check current memory usage:**

```bash
kubectl top pods -n lomash-wood --sort-by=memory
```

**Step 3 — Temporarily increase memory limit:**

```bash
kubectl set resources deployment/<service-name> -n lomash-wood \
  --limits=memory=1Gi --requests=memory=512Mi
```

**Step 4 — Identify memory leak:**

```bash
kubectl exec -it <pod-name> -n lomash-wood -- node --expose-gc -e "
  setInterval(() => {
    gc();
    const mem = process.memoryUsage();
    console.log('heapUsed:', (mem.heapUsed / 1024 / 1024).toFixed(2), 'MB');
  }, 5000);
"
```

Review: unclosed database connections, event listener accumulation, large in-memory data processing.

---

## Scenario 5 — External API Latency (Stripe / Email Provider)

**Symptoms:** Only payment or notification endpoints are slow. Internal latency is normal.

**Step 1 — Confirm it is an external dependency:**

```bash
kubectl logs -n lomash-wood deployment/order-payment-service --tail=300 | grep "stripe.*ms"
kubectl logs -n lomash-wood deployment/notification-service --tail=300 | grep "smtp\|ses.*ms"
```

**Step 2 — Check provider status pages:**

- Stripe: [https://status.stripe.com](https://status.stripe.com)
- AWS SES: [https://health.aws.amazon.com](https://health.aws.amazon.com)
- Twilio: [https://status.twilio.com](https://status.twilio.com)

**Step 3 — If Stripe is slow — enable async payment processing:**

Update feature flag `STRIPE_ASYNC_MODE=true` in the environment config and restart the service. This queues payment intents for processing rather than blocking the request.

**Step 4 — If email provider is slow — switch to fallback provider:**

In `notification-service`, update `EMAIL_PROVIDER` from `ses` to `nodemailer` (or vice versa):

```bash
kubectl set env deployment/notification-service -n lomash-wood EMAIL_PROVIDER=nodemailer
```

---

## Sustained High Latency — Escalation

If latency remains elevated after 30 minutes of investigation:

1. Page the lead backend engineer.
2. Consider enabling maintenance mode to prevent new traffic while resolving.
3. Scale up all services to maximum replica count:

```bash
for svc in api-gateway auth-service product-service order-payment-service appointment-service content-service customer-service notification-service analytics-service; do
  kubectl scale deployment/$svc --replicas=8 -n lomash-wood
done
```

4. Open AWS Support ticket if EC2/EKS resource limits are suspected.

---

## Post-Incident

- [ ] Identify root cause (query, cache, CPU, memory, external)
- [ ] Apply permanent fix (index, TTL, resource limits, HPA thresholds)
- [ ] Verify SLOs are back within targets in Grafana
- [ ] Update alerting thresholds if they fired too late
- [ ] Document findings in post-mortem