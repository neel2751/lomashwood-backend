# Database Failure Runbook — Lomash Wood Backend

## Overview

This runbook covers PostgreSQL failure scenarios for all Lomash Wood services. Each microservice has its own dedicated Prisma-managed PostgreSQL database. Redis is used as a shared cache layer.

**Databases:**
- `lomash_auth` — auth-service
- `lomash_products` — product-service
- `lomash_orders` — order-payment-service
- `lomash_appointments` — appointment-service
- `lomash_content` — content-service
- `lomash_customers` — customer-service
- `lomash_notifications` — notification-service
- `lomash_analytics` — analytics-service

---

## Failure Detection

### Symptoms

- Services returning `500 Internal Server Error` or `503 Service Unavailable`
- Prisma client errors in logs: `PrismaClientKnownRequestError`, `Can't reach database server`
- Health endpoint returning `{ "database": "unhealthy" }`
- Grafana alerts firing on `database-dashboard`

### Verify Database Health

```bash
kubectl exec -it postgres-primary-0 -n lomash-wood -- pg_isready -U lomash_admin
```

Check replication lag:

```bash
kubectl exec -it postgres-primary-0 -n lomash-wood -- psql -U lomash_admin -c \
  "SELECT client_addr, state, sent_lsn, write_lsn, replay_lsn, sync_state FROM pg_stat_replication;"
```

Check if replica is behind:

```bash
kubectl exec -it postgres-replica-0 -n lomash-wood -- psql -U lomash_admin -c \
  "SELECT now() - pg_last_xact_replay_timestamp() AS replication_delay;"
```

---

## Scenario 1 — Primary Database Unreachable

**Symptoms:** All service health checks returning `database: unhealthy`. Primary pod not responding.

**Step 1 — Confirm primary failure:**

```bash
kubectl get pods -n lomash-wood -l role=primary
kubectl describe pod postgres-primary-0 -n lomash-wood
kubectl logs postgres-primary-0 -n lomash-wood --previous --tail=100
```

**Step 2 — Check if replica is healthy:**

```bash
kubectl get pods -n lomash-wood -l role=replica
kubectl exec -it postgres-replica-0 -n lomash-wood -- pg_isready
```

**Step 3 — Promote replica to primary:**

```bash
kubectl exec -it postgres-replica-0 -n lomash-wood -- psql -U lomash_admin -c "SELECT pg_promote();"
```

Verify promotion:

```bash
kubectl exec -it postgres-replica-0 -n lomash-wood -- psql -U lomash_admin -c "SELECT pg_is_in_recovery();"
```

Expected output: `f` (false = now acting as primary).

**Step 4 — Update service connection strings:**

Update Kubernetes secrets to point to the new primary:

```bash
kubectl patch secret lomash-wood-secrets -n lomash-wood \
  --type='json' \
  -p='[{"op": "replace", "path": "/data/DATABASE_URL", "value": "<base64-encoded-new-url>"}]'
```

Restart all affected services:

```bash
kubectl rollout restart deployment/auth-service -n lomash-wood
kubectl rollout restart deployment/product-service -n lomash-wood
kubectl rollout restart deployment/order-payment-service -n lomash-wood
kubectl rollout restart deployment/appointment-service -n lomash-wood
kubectl rollout restart deployment/content-service -n lomash-wood
kubectl rollout restart deployment/customer-service -n lomash-wood
kubectl rollout restart deployment/notification-service -n lomash-wood
kubectl rollout restart deployment/analytics-service -n lomash-wood
```

**Step 5 — Restore the failed primary:**

Once the original primary pod is recoverable, bring it back as a replica:

```bash
kubectl label pod postgres-primary-0 role=replica -n lomash-wood --overwrite
```

Then follow the AWS RDS restore procedure (if using managed RDS) or recreate the StatefulSet pod.

---

## Scenario 2 — Slow Queries / High Latency

**Symptoms:** Services responding slowly. Grafana `database-dashboard` showing high query duration.

**Step 1 — Identify long-running queries:**

```bash
kubectl exec -it postgres-primary-0 -n lomash-wood -- psql -U lomash_admin -c \
  "SELECT pid, now() - query_start AS duration, query, state
   FROM pg_stat_activity
   WHERE state != 'idle' AND query_start < NOW() - INTERVAL '30 seconds'
   ORDER BY duration DESC;"
```

**Step 2 — Kill specific long-running queries:**

```bash
kubectl exec -it postgres-primary-0 -n lomash-wood -- psql -U lomash_admin -c \
  "SELECT pg_cancel_backend(<pid>);"
```

Force terminate if cancel does not work:

```bash
kubectl exec -it postgres-primary-0 -n lomash-wood -- psql -U lomash_admin -c \
  "SELECT pg_terminate_backend(<pid>);"
```

**Step 3 — Check for missing indexes:**

```bash
kubectl exec -it postgres-primary-0 -n lomash-wood -- psql -U lomash_admin -d lomash_orders -c \
  "SELECT schemaname, tablename, attname, n_distinct, correlation
   FROM pg_stats
   WHERE tablename IN ('orders', 'payments', 'invoices')
   ORDER BY n_distinct;"
```

**Step 4 — Run VACUUM ANALYZE on affected tables:**

```bash
kubectl exec -it postgres-primary-0 -n lomash-wood -- psql -U lomash_admin -d lomash_orders -c \
  "VACUUM ANALYZE orders; VACUUM ANALYZE payments;"
```

---

## Scenario 3 — Disk Space Full

**Symptoms:** PostgreSQL throwing `could not extend file` or `no space left on device`.

**Step 1 — Check disk usage:**

```bash
kubectl exec -it postgres-primary-0 -n lomash-wood -- df -h /var/lib/postgresql/data
```

**Step 2 — Check database sizes:**

```bash
kubectl exec -it postgres-primary-0 -n lomash-wood -- psql -U lomash_admin -c \
  "SELECT datname, pg_size_pretty(pg_database_size(datname)) FROM pg_database ORDER BY pg_database_size(datname) DESC;"
```

**Step 3 — Check largest tables:**

```bash
kubectl exec -it postgres-primary-0 -n lomash-wood -- psql -U lomash_admin -d lomash_analytics -c \
  "SELECT table_name, pg_size_pretty(pg_total_relation_size(table_name::text))
   FROM information_schema.tables
   WHERE table_schema = 'public'
   ORDER BY pg_total_relation_size(table_name::text) DESC
   LIMIT 10;"
```

**Step 4 — Free space by removing dead rows:**

```bash
kubectl exec -it postgres-primary-0 -n lomash-wood -- psql -U lomash_admin -c "VACUUM FULL;"
```

**Step 5 — Expand PVC if on Kubernetes:**

```bash
kubectl patch pvc postgres-data-postgres-primary-0 -n lomash-wood \
  -p '{"spec":{"resources":{"requests":{"storage":"100Gi"}}}}'
```

---

## Scenario 4 — Prisma Migration Failure

**Symptoms:** Deployment fails with `P3009 migrate found failed migrations` or schema mismatch errors.

**Step 1 — Check migration status:**

```bash
kubectl exec -it <service-pod> -n lomash-wood -- npx prisma migrate status
```

**Step 2 — Resolve failed migration:**

```bash
kubectl exec -it <service-pod> -n lomash-wood -- npx prisma migrate resolve \
  --rolled-back <migration-name>
```

**Step 3 — Re-apply migration:**

```bash
kubectl exec -it <service-pod> -n lomash-wood -- npx prisma migrate deploy
```

**Step 4 — If schema is out of sync — reset (non-production only):**

```bash
kubectl exec -it <service-pod> -n lomash-wood -- npx prisma migrate reset --force
```

---

## Scenario 5 — Redis Cache Failure

**Symptoms:** Services logging `Redis connection refused`. Increased database load as cache is bypassed.

**Step 1 — Verify Redis status:**

```bash
kubectl exec -it redis-master-0 -n lomash-wood -- redis-cli ping
kubectl exec -it redis-master-0 -n lomash-wood -- redis-cli info stats | grep rejected_connections
```

**Step 2 — Check Redis memory:**

```bash
kubectl exec -it redis-master-0 -n lomash-wood -- redis-cli info memory | grep used_memory_human
```

**Step 3 — Flush all cache if corrupted:**

```bash
kubectl exec -it redis-master-0 -n lomash-wood -- redis-cli FLUSHALL
```

**Step 4 — Restart Redis:**

```bash
kubectl rollout restart statefulset/redis -n lomash-wood
```

Services are designed to degrade gracefully when Redis is unavailable. Confirm that fallback-to-database mode is working and no critical errors are thrown.

---

## Backup and Restore

### Trigger a Manual Backup (AWS RDS)

```bash
aws rds create-db-snapshot \
  --db-instance-identifier lomash-wood-prod \
  --db-snapshot-identifier lomash-wood-manual-$(date +%Y%m%d%H%M)
```

### Restore from Snapshot (AWS RDS)

```bash
aws rds restore-db-instance-from-db-snapshot \
  --db-instance-identifier lomash-wood-prod-restored \
  --db-snapshot-identifier <snapshot-id>
```

### Point-in-Time Recovery

```bash
aws rds restore-db-instance-to-point-in-time \
  --source-db-instance-identifier lomash-wood-prod \
  --target-db-instance-identifier lomash-wood-pitr \
  --restore-time 2026-02-18T14:30:00Z
```

---

## Escalation

| Issue | Escalate To |
|-------|------------|
| Primary failure unresolvable | Lead DBA / AWS Support |
| Data corruption suspected | Engineering Manager + DBA immediately |
| Replication lag > 5 min | On-call backend engineer |
| Disk > 90% full | DevOps engineer |

Reference: `docs/disaster-recovery/restore.md` for full restore procedures.