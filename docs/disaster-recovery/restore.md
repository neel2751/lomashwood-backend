# Restore Procedures — Lomash Wood Backend

## Overview

This document defines step-by-step restore procedures for all Lomash Wood production data assets. Restore procedures must be followed in the event of data loss, corruption, accidental deletion, or a declared disaster.

**Before starting any restore:**
1. Declare the incident in `#incidents` Slack channel.
2. Notify the Engineering Manager and CTO.
3. Document every action taken with timestamps.
4. Do not restore over live production data without explicit approval.

---

## PostgreSQL Restore Procedures

### Restore 1A — RDS Point-in-Time Recovery (PITR)

Use when: Data was corrupted or accidentally deleted at a known point in time.

**Step 1 — Identify the restore target time:**

Determine the last known good state (use application logs, Stripe events, or user reports to pinpoint the time before the incident).

**Step 2 — Initiate PITR restore:**

```bash
aws rds restore-db-instance-to-point-in-time \
  --source-db-instance-identifier lomash-orders-prod \
  --target-db-instance-identifier lomash-orders-prod-restored \
  --restore-time 2026-02-18T14:30:00Z \
  --db-instance-class db.r6g.large \
  --publicly-accessible false \
  --vpc-security-group-ids sg-xxxxxxxxx \
  --db-subnet-group-name lomash-wood-db-subnet

aws rds wait db-instance-available \
  --db-instance-identifier lomash-orders-prod-restored
```

**Step 3 — Verify restored data:**

```bash
RESTORED_HOST=$(aws rds describe-db-instances \
  --db-instance-identifier lomash-orders-prod-restored \
  --query 'DBInstances[0].Endpoint.Address' --output text)

psql -h $RESTORED_HOST -U lomash_admin -d lomash_orders -c \
  "SELECT COUNT(*), MAX(created_at) FROM orders;"
```

Confirm row counts and timestamps match expectations.

**Step 4 — Apply any missing Prisma migrations if needed:**

```bash
kubectl exec -it <service-pod> -n lomash-wood -- \
  DATABASE_URL="postgresql://lomash_admin:<password>@$RESTORED_HOST:5432/lomash_orders" \
  npx prisma migrate deploy
```

**Step 5 — Promote restored instance:**

Rename the restored instance to replace the original:

```bash
aws rds modify-db-instance \
  --db-instance-identifier lomash-orders-prod \
  --new-db-instance-identifier lomash-orders-prod-old \
  --apply-immediately

aws rds modify-db-instance \
  --db-instance-identifier lomash-orders-prod-restored \
  --new-db-instance-identifier lomash-orders-prod \
  --apply-immediately

aws rds wait db-instance-available --db-instance-identifier lomash-orders-prod
```

**Step 6 — Update connection string if endpoint changed:**

```bash
NEW_ENDPOINT=$(aws rds describe-db-instances \
  --db-instance-identifier lomash-orders-prod \
  --query 'DBInstances[0].Endpoint.Address' --output text)

kubectl patch secret lomash-wood-secrets -n lomash-wood \
  --type='json' \
  -p="[{\"op\": \"replace\", \"path\": \"/data/ORDER_DATABASE_URL\", \"value\": \"$(echo -n postgresql://lomash_admin:<password>@${NEW_ENDPOINT}:5432/lomash_orders | base64 -w0)\"}]"

kubectl rollout restart deployment/order-payment-service -n lomash-wood
kubectl rollout status deployment/order-payment-service -n lomash-wood
```

**Step 7 — Delete the old instance after verification:**

```bash
aws rds delete-db-instance \
  --db-instance-identifier lomash-orders-prod-old \
  --final-db-snapshot-identifier lomash-orders-prod-old-final-snapshot
```

---

### Restore 1B — RDS Snapshot Restore

Use when: Restoring from a specific pre-deployment or manual snapshot.

**Step 1 — List available snapshots:**

```bash
aws rds describe-db-snapshots \
  --db-instance-identifier lomash-orders-prod \
  --query 'DBSnapshots[*].{ID:DBSnapshotIdentifier,Created:SnapshotCreateTime,Status:Status}' \
  --output table | sort
```

**Step 2 — Restore from snapshot:**

```bash
aws rds restore-db-instance-from-db-snapshot \
  --db-instance-identifier lomash-orders-prod-snap-restore \
  --db-snapshot-identifier lomash-orders-prod-pre-deploy-202602181200 \
  --db-instance-class db.r6g.large \
  --vpc-security-group-ids sg-xxxxxxxxx \
  --db-subnet-group-name lomash-wood-db-subnet

aws rds wait db-instance-available \
  --db-instance-identifier lomash-orders-prod-snap-restore
```

Continue with steps 3–7 from Restore 1A.

---

### Restore 1C — pg_dump Logical Restore

Use when: Restoring a specific table or subset of data, or restoring to a different server.

**Step 1 — Download the dump from S3:**

```bash
aws s3 cp \
  s3://lomash-wood-backups/pg-logical/lomash_orders/lomash_orders_20260218.dump \
  /tmp/lomash_orders_20260218.dump
```

**Step 2 — Restore to a target database:**

Full database restore:

```bash
pg_restore \
  --host $DB_HOST \
  --username lomash_admin \
  --dbname lomash_orders \
  --no-owner \
  --no-acl \
  --verbose \
  /tmp/lomash_orders_20260218.dump
```

Restore a specific table only:

```bash
pg_restore \
  --host $DB_HOST \
  --username lomash_admin \
  --dbname lomash_orders \
  --table=orders \
  --no-owner \
  --verbose \
  /tmp/lomash_orders_20260218.dump
```

**Step 3 — Verify restored data:**

```bash
psql -h $DB_HOST -U lomash_admin -d lomash_orders -c \
  "SELECT COUNT(*), MIN(created_at), MAX(created_at) FROM orders;"
```

---

## Redis Restore Procedures

### Restore 2A — Restore Redis from RDB File

Use when: Redis data has been lost due to a cluster failure or accidental flush.

**Step 1 — Download the RDB file from S3:**

```bash
BACKUP_DATE=$(date -d "yesterday" +%Y%m%d)
aws s3 cp \
  s3://lomash-wood-backups/redis/redis-dump-${BACKUP_DATE}.rdb \
  /tmp/redis-dump.rdb
```

**Step 2 — Copy RDB file into the Redis pod:**

```bash
kubectl cp /tmp/redis-dump.rdb redis-master-0:/data/dump.rdb -n lomash-wood
```

**Step 3 — Restart Redis to load the RDB:**

```bash
kubectl rollout restart statefulset/redis -n lomash-wood
kubectl rollout status statefulset/redis -n lomash-wood
```

**Step 4 — Verify key restoration:**

```bash
kubectl exec -it redis-master-0 -n lomash-wood -- redis-cli DBSIZE
kubectl exec -it redis-master-0 -n lomash-wood -- redis-cli KEYS "session:*" | wc -l
```

**Note:** After a Redis restore, user sessions will be restored. However, any sessions created between the backup time and the incident time will be lost (users will need to log in again).

---

## S3 Media Asset Restore

### Restore 3A — Restore a Deleted Object (Versioning)

Use when: A specific file was accidentally deleted.

**Step 1 — List versions of the deleted object:**

```bash
aws s3api list-object-versions \
  --bucket lomash-wood-media-prod \
  --prefix "products/kitchen/abc123/hero.jpg"
```

**Step 2 — Restore by deleting the delete marker:**

```bash
aws s3api delete-object \
  --bucket lomash-wood-media-prod \
  --key "products/kitchen/abc123/hero.jpg" \
  --version-id <delete-marker-version-id>
```

**Step 3 — Verify the object is accessible:**

```bash
aws s3 head-object \
  --bucket lomash-wood-media-prod \
  --key "products/kitchen/abc123/hero.jpg"
```

---

### Restore 3B — Bulk Restore from Replica Bucket

Use when: Multiple objects have been deleted or the primary bucket is compromised.

**Step 1 — Sync from the replica bucket:**

```bash
aws s3 sync \
  s3://lomash-wood-media-prod-replica \
  s3://lomash-wood-media-prod \
  --source-region eu-west-2 \
  --region eu-west-1
```

**Step 2 — Verify object counts match:**

```bash
SOURCE=$(aws s3 ls s3://lomash-wood-media-prod --recursive | wc -l)
REPLICA=$(aws s3 ls s3://lomash-wood-media-prod-replica --recursive | wc -l)
echo "Source: $SOURCE | Replica: $REPLICA"
```

---

## Application Secrets Restore

### Restore 4A — Restore a Secret from Previous Version

Use when: A secret was accidentally overwritten or rotated incorrectly.

**Step 1 — List available versions:**

```bash
aws secretsmanager list-secret-version-ids \
  --secret-id lomash-wood/production/jwt-secret \
  --query 'Versions[*].{ID:VersionId,Stages:VersionStages,Created:CreatedDate}' \
  --output table
```

**Step 2 — Retrieve the previous version:**

```bash
PREV_SECRET=$(aws secretsmanager get-secret-value \
  --secret-id lomash-wood/production/jwt-secret \
  --version-stage AWSPREVIOUS \
  --query SecretString --output text)

echo $PREV_SECRET
```

**Step 3 — Restore the previous value:**

```bash
aws secretsmanager put-secret-value \
  --secret-id lomash-wood/production/jwt-secret \
  --secret-string "$PREV_SECRET"
```

**Step 4 — Update Kubernetes secret and restart services:**

```bash
kubectl patch secret lomash-wood-secrets -n lomash-wood \
  --type='json' \
  -p="[{\"op\": \"replace\", \"path\": \"/data/JWT_SECRET\", \"value\": \"$(echo -n $PREV_SECRET | base64 -w0)\"}]"

kubectl rollout restart deployment/auth-service -n lomash-wood
```

---

## Kubernetes Configuration Restore

### Restore 5A — Restore from Git

Use when: A Kubernetes manifest was incorrectly modified and applied.

**Step 1 — Find the last good commit:**

```bash
git log --oneline infra/kubernetes/overlays/production/ | head -10
```

**Step 2 — Restore files from a previous commit:**

```bash
git checkout <good-commit-hash> -- infra/kubernetes/overlays/production/
git checkout <good-commit-hash> -- infra/kubernetes/base/
```

**Step 3 — Re-apply to the cluster:**

```bash
kubectl apply -k infra/kubernetes/overlays/production/
kubectl rollout status deployment -n lomash-wood
```

---

## Full Environment Restore Order

If performing a complete environment rebuild, restore in this exact order to respect service dependencies:

```
1. Infrastructure (VPC, EKS, RDS, Redis, S3) via Terraform
2. Kubernetes cluster configuration (namespaces, RBAC, configmaps)
3. Application secrets (AWS Secrets Manager → Kubernetes secrets)
4. PostgreSQL databases (RDS restore or pg_dump restore)
5. Prisma migrations (apply any missed migrations)
6. Redis (restore from RDB if required)
7. S3 media assets (sync from replica if required)
8. Deploy services in order:
   a. auth-service
   b. product-service
   c. customer-service
   d. content-service
   e. notification-service
   f. order-payment-service
   g. appointment-service
   h. analytics-service
   i. api-gateway (last — gates all traffic)
9. Run smoke tests
10. Re-enable health check monitoring
11. Remove traffic hold / re-enable load balancer
```

---

## Post-Restore Verification Checklist

Run after every restore operation:

- [ ] All service health endpoints returning `200 OK`
- [ ] Database row counts verified against last known good state
- [ ] `POST /v1/auth/login` working for test account
- [ ] `GET /v1/products` returning expected products
- [ ] `GET /v1/appointments/availability` returning slots
- [ ] Stripe test payment intent creation succeeds
- [ ] S3 media URLs resolving correctly in product images
- [ ] Notification service sending test email successfully
- [ ] Grafana dashboards showing healthy metrics
- [ ] No new Sentry errors

---

## Restore Time Estimates

| Restore Type | Estimated Duration |
|-------------|-------------------|
| RDS PITR (single DB) | 20–40 minutes |
| RDS snapshot restore (single DB) | 15–30 minutes |
| pg_dump restore (single DB, ~10GB) | 10–20 minutes |
| Redis RDB restore | 2–5 minutes |
| S3 bulk sync (< 100GB) | 15–30 minutes |
| Full environment rebuild | 2–4 hours |

Reference: `docs/disaster-recovery/rpo-rto.md` for SLA commitments around these timelines.