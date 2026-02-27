# Outage Runbook — Lomash Wood Backend

## Severity Levels

| Level | Description | Response Time |
|-------|-------------|---------------|
| P0 | Full system outage — all services down | Immediate (< 5 min) |
| P1 | Critical service degraded — payments, auth, appointments affected | < 15 min |
| P2 | Non-critical service degraded — analytics, content, notifications | < 30 min |
| P3 | Minor degradation — slow responses, partial feature failure | < 2 hours |

---

## Initial Response Protocol

### Step 1 — Acknowledge the Incident

1. Join the `#incidents` Slack channel.
2. Claim ownership: post `I am taking ownership of this incident`.
3. Create an incident thread and tag the on-call engineer.
4. Open the [PagerDuty incident board](https://app.pagerduty.com) and acknowledge the alert.

### Step 2 — Assess Impact

Run the following health checks across all services:

```bash
curl -sf https://api.lomashwood.com/health | jq .
curl -sf https://api.lomashwood.com/v1/auth/health | jq .
curl -sf https://api.lomashwood.com/v1/products/health | jq .
curl -sf https://api.lomashwood.com/v1/orders/health | jq .
curl -sf https://api.lomashwood.com/v1/appointments/health | jq .
curl -sf https://api.lomashwood.com/v1/notifications/health | jq .
curl -sf https://api.lomashwood.com/v1/analytics/health | jq .
```

Check Kubernetes pod status:

```bash
kubectl get pods -n lomash-wood --all-namespaces
kubectl get events -n lomash-wood --sort-by='.lastTimestamp' | tail -30
```

Check service logs:

```bash
kubectl logs -n lomash-wood deployment/api-gateway --tail=200
kubectl logs -n lomash-wood deployment/auth-service --tail=200
kubectl logs -n lomash-wood deployment/order-payment-service --tail=200
```

### Step 3 — Identify Failing Component

| Check | Command |
|-------|---------|
| API Gateway | `kubectl rollout status deployment/api-gateway -n lomash-wood` |
| Auth Service | `kubectl rollout status deployment/auth-service -n lomash-wood` |
| Product Service | `kubectl rollout status deployment/product-service -n lomash-wood` |
| Order/Payment | `kubectl rollout status deployment/order-payment-service -n lomash-wood` |
| Appointment | `kubectl rollout status deployment/appointment-service -n lomash-wood` |
| PostgreSQL | `kubectl exec -it postgres-primary-0 -n lomash-wood -- pg_isready` |
| Redis | `kubectl exec -it redis-master-0 -n lomash-wood -- redis-cli ping` |

---

## Common Outage Scenarios

### Scenario A — API Gateway Down

```bash
kubectl describe deployment api-gateway -n lomash-wood
kubectl rollout restart deployment/api-gateway -n lomash-wood
kubectl rollout status deployment/api-gateway -n lomash-wood
```

If restart fails:

```bash
kubectl scale deployment api-gateway --replicas=0 -n lomash-wood
sleep 5
kubectl scale deployment api-gateway --replicas=3 -n lomash-wood
```

### Scenario B — Database Connection Exhaustion

Check active connections:

```bash
kubectl exec -it postgres-primary-0 -n lomash-wood -- psql -U lomash_admin -c \
  "SELECT count(*), state FROM pg_stat_activity GROUP BY state;"
```

Kill idle connections:

```bash
kubectl exec -it postgres-primary-0 -n lomash-wood -- psql -U lomash_admin -c \
  "SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE state = 'idle' AND query_start < NOW() - INTERVAL '5 minutes';"
```

Restart PgBouncer if connection pooler is in use:

```bash
kubectl rollout restart deployment/pgbouncer -n lomash-wood
```

### Scenario C — Redis Unavailable

Check Redis:

```bash
kubectl exec -it redis-master-0 -n lomash-wood -- redis-cli info server
kubectl exec -it redis-master-0 -n lomash-wood -- redis-cli info replication
```

Force failover to replica:

```bash
kubectl exec -it redis-master-0 -n lomash-wood -- redis-cli -a $REDIS_PASSWORD FAILOVER
```

Restart Redis:

```bash
kubectl rollout restart statefulset/redis -n lomash-wood
```

### Scenario D — All Pods CrashLoopBackOff

Identify the failing pod:

```bash
kubectl get pods -n lomash-wood | grep CrashLoop
kubectl describe pod <pod-name> -n lomash-wood
kubectl logs <pod-name> -n lomash-wood --previous
```

Check for environment/config issues:

```bash
kubectl get secret lomash-wood-secrets -n lomash-wood -o yaml
kubectl get configmap lomash-wood-config -n lomash-wood -o yaml
```

Roll back to previous deployment:

```bash
kubectl rollout undo deployment/<service-name> -n lomash-wood
kubectl rollout status deployment/<service-name> -n lomash-wood
```

### Scenario E — Stripe Webhook Failures

Check webhook processor logs:

```bash
kubectl logs -n lomash-wood deployment/order-payment-service --tail=300 | grep webhook
```

Verify Stripe webhook secret is correctly set:

```bash
kubectl get secret lomash-wood-secrets -n lomash-wood -o jsonpath='{.data.STRIPE_WEBHOOK_SECRET}' | base64 -d
```

Replay failed webhooks from the Stripe dashboard:
- Navigate to: `Dashboard → Developers → Webhooks → [endpoint] → Failed attempts`
- Click **Resend** on each failed event.

---

## Escalation Matrix

| Escalation Level | Who | When |
|-----------------|-----|------|
| L1 | On-call engineer | First response |
| L2 | Lead backend engineer | After 15 min without resolution |
| L3 | CTO / Engineering Manager | P0 unresolved after 30 min |
| External | AWS Support / Stripe Support | Infrastructure or payment processor issues |

Slack channels:
- `#incidents` — active incident thread
- `#on-call` — escalation
- `#alerts` — automated monitoring alerts

---

## Post-Incident Actions

1. Resolve the incident in PagerDuty.
2. Post a brief summary in `#incidents`:
   - What happened
   - Root cause
   - How it was resolved
   - Time to detection, time to resolution
3. Create a post-mortem document within 48 hours (see `docs/architecture/fault-tolerance.md`).
4. File Jira tickets for all action items identified.
5. Update monitoring/alerting rules if the incident was not detected promptly.

---

## Useful Grafana Dashboards

| Dashboard | URL |
|-----------|-----|
| API Gateway | `/dashboards/api-gateway-dashboard.json` |
| Infrastructure | `/dashboards/infra-dashboard.json` |
| Error Rate | `/dashboards/error-rate-dashboard.json` |
| Latency | `/dashboards/latency-dashboard.json` |
| SLA/SLO | `/dashboards/sla-slo-dashboard.json` |