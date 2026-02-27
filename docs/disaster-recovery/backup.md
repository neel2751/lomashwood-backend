# Backup Strategy — Lomash Wood Backend

## Overview

This document defines the backup strategy for all Lomash Wood production data assets. Backups cover PostgreSQL databases, Redis, S3 media assets, Kubernetes configuration, and application secrets.

---

## Backup Scope

| Asset | Type | Tool | Frequency | Retention |
|-------|------|------|-----------|-----------|
| PostgreSQL (all DBs) | Automated snapshot | AWS RDS Automated Backups | Daily | 35 days |
| PostgreSQL (all DBs) | Manual snapshot | AWS RDS Manual Snapshot | Before every deployment | 90 days |
| PostgreSQL (all DBs) | Point-in-time | AWS RDS PITR | Continuous | 35 days |
| Redis | AOF + RDB | Redis persistence | Continuous + hourly | 7 days |
| S3 media assets | Versioning + replication | AWS S3 CRR | Continuous | 90 days |
| Kubernetes manifests | Git | GitHub | On every commit | Indefinite |
| Application secrets | Versioned secrets | AWS Secrets Manager | On every rotation | 90 days |
| Prisma migrations | Git | GitHub | On every commit | Indefinite |

---

## PostgreSQL Backup

### Automated RDS Backups

All Lomash Wood databases run on AWS RDS PostgreSQL with automated backups enabled.

**Databases:**
- `lomash_auth` — auth-service
- `lomash_products` — product-service
- `lomash_orders` — order-payment-service
- `lomash_appointments` — appointment-service
- `lomash_content` — content-service
- `lomash_customers` — customer-service
- `lomash_notifications` — notification-service
- `lomash_analytics` — analytics-service

**Verify automated backup configuration:**

```bash
aws rds describe-db-instances \
  --query 'DBInstances[*].{ID:DBInstanceIdentifier,BackupRetention:BackupRetentionPeriod,BackupWindow:PreferredBackupWindow}' \
  --output table
```

Expected: `BackupRetentionPeriod` = `35` for all instances.

**Backup window:** 02:00–03:00 UTC (low-traffic period).

### Manual Snapshot Before Deployment

Run before every production deployment:

```bash
#!/bin/bash
set -e

TIMESTAMP=$(date +%Y%m%d%H%M)
DATABASES=(
  lomash-auth-prod
  lomash-products-prod
  lomash-orders-prod
  lomash-appointments-prod
  lomash-content-prod
  lomash-customers-prod
  lomash-notifications-prod
  lomash-analytics-prod
)

for db in "${DATABASES[@]}"; do
  echo "Snapshotting $db..."
  aws rds create-db-snapshot \
    --db-instance-identifier $db \
    --db-snapshot-identifier "${db}-pre-deploy-${TIMESTAMP}"
  echo "Snapshot created: ${db}-pre-deploy-${TIMESTAMP}"
done
```

This script is also embedded in the GitHub Actions `deploy-production.yml` workflow as a pre-deployment step.

### Verify Latest Snapshot Exists

```bash
aws rds describe-db-snapshots \
  --db-instance-identifier lomash-orders-prod \
  --query 'DBSnapshots[*].{ID:DBSnapshotIdentifier,Status:Status,Created:SnapshotCreateTime}' \
  --output table | head -20
```

### pg_dump Logical Backup (Weekly)

A weekly logical backup is taken using `pg_dump` for portability and cross-region restore capability. This runs as a Kubernetes CronJob every Sunday at 01:00 UTC:

```yaml
apiVersion: batch/v1
kind: CronJob
metadata:
  name: pg-logical-backup
  namespace: lomash-wood
spec:
  schedule: "0 1 * * 0"
  jobTemplate:
    spec:
      template:
        spec:
          containers:
          - name: pg-backup
            image: postgres:16
            command:
            - /bin/bash
            - -c
            - |
              TIMESTAMP=$(date +%Y%m%d)
              for DB in lomash_auth lomash_products lomash_orders lomash_appointments lomash_content lomash_customers lomash_notifications lomash_analytics; do
                pg_dump -Fc -h $DB_HOST -U $DB_USER $DB > /backup/${DB}_${TIMESTAMP}.dump
                aws s3 cp /backup/${DB}_${TIMESTAMP}.dump s3://lomash-wood-backups/pg-logical/${DB}/${DB}_${TIMESTAMP}.dump
                echo "Uploaded ${DB}_${TIMESTAMP}.dump to S3"
              done
```

**Verify backup files in S3:**

```bash
aws s3 ls s3://lomash-wood-backups/pg-logical/ --recursive | sort | tail -20
```

---

## Redis Backup

Redis is configured with both RDB snapshots and AOF (Append-Only File) for full durability.

### Verify Redis Persistence Configuration

```bash
kubectl exec -it redis-master-0 -n lomash-wood -- redis-cli CONFIG GET save
kubectl exec -it redis-master-0 -n lomash-wood -- redis-cli CONFIG GET appendonly
kubectl exec -it redis-master-0 -n lomash-wood -- redis-cli CONFIG GET appendfsync
```

Expected configuration:

```
save: 3600 1 300 100 60 10000
appendonly: yes
appendfsync: everysec
```

### Manual Redis Backup

```bash
kubectl exec -it redis-master-0 -n lomash-wood -- redis-cli BGSAVE
kubectl exec -it redis-master-0 -n lomash-wood -- redis-cli LASTSAVE
```

Copy the RDB file to S3:

```bash
kubectl cp redis-master-0:/data/dump.rdb /tmp/redis-dump-$(date +%Y%m%d).rdb -n lomash-wood
aws s3 cp /tmp/redis-dump-$(date +%Y%m%d).rdb s3://lomash-wood-backups/redis/
```

---

## S3 Media Asset Backup

All product images, blog media, and CMS assets are stored in `s3://lomash-wood-media-prod`.

### Versioning

S3 versioning is enabled on the media bucket. Every overwrite or delete creates a new version, preserving all previous states.

**Verify versioning is enabled:**

```bash
aws s3api get-bucket-versioning --bucket lomash-wood-media-prod
```

Expected output: `{"Status": "Enabled"}`.

### Cross-Region Replication

Media assets are replicated to `eu-west-2` (London) from the primary `eu-west-1` (Ireland) region.

**Verify replication configuration:**

```bash
aws s3api get-bucket-replication --bucket lomash-wood-media-prod
```

**Verify replication lag (objects in source vs destination):**

```bash
aws s3 ls s3://lomash-wood-media-prod --recursive | wc -l
aws s3 ls s3://lomash-wood-media-prod-replica --recursive | wc -l
```

The counts should be equal or within a few objects of each other.

### Lifecycle Policy

Objects deleted from the primary bucket are retained in the versioned history for 90 days before permanent deletion.

```bash
aws s3api get-bucket-lifecycle-configuration --bucket lomash-wood-media-prod
```

---

## Kubernetes Configuration Backup

All Kubernetes manifests, Helm charts, and Kustomize overlays are stored in the GitHub repository under `infra/kubernetes/`. Git history serves as the configuration backup.

**Export current live cluster state to file (for audit purposes):**

```bash
kubectl get all -n lomash-wood -o yaml > /tmp/cluster-state-$(date +%Y%m%d).yaml
aws s3 cp /tmp/cluster-state-$(date +%Y%m%d).yaml s3://lomash-wood-backups/k8s/
```

**Export all secrets (encrypted):**

```bash
kubectl get secrets -n lomash-wood -o yaml > /tmp/secrets-$(date +%Y%m%d).yaml
gpg --encrypt --recipient devops@lomashwood.com /tmp/secrets-$(date +%Y%m%d).yaml
aws s3 cp /tmp/secrets-$(date +%Y%m%d).yaml.gpg s3://lomash-wood-backups/k8s/secrets/
```

---

## Application Secrets Backup

All secrets are stored and versioned in AWS Secrets Manager.

**List all Lomash Wood secrets:**

```bash
aws secretsmanager list-secrets \
  --filter Key=name,Values=lomash-wood \
  --query 'SecretList[*].{Name:Name,LastChanged:LastChangedDate}' \
  --output table
```

**Verify a secret has previous versions:**

```bash
aws secretsmanager list-secret-version-ids \
  --secret-id lomash-wood/production/jwt-secret
```

**Retrieve previous version of a secret:**

```bash
aws secretsmanager get-secret-value \
  --secret-id lomash-wood/production/jwt-secret \
  --version-stage AWSPREVIOUS
```

---

## Backup Verification Schedule

Backups must be verified on the following schedule:

| Backup Type | Verification Frequency | Method |
|-------------|----------------------|--------|
| RDS automated backup | Monthly | Restore to test instance and run schema validation |
| pg_dump logical backup | Monthly | Restore to test instance and run query checks |
| Redis RDB | Weekly | Restore to test Redis and check key counts |
| S3 media | Monthly | List object counts and spot-check file accessibility |
| Secrets | Quarterly | Restore a secret to a test environment and verify application starts |

### Monthly RDS Restore Verification

```bash
aws rds restore-db-instance-from-db-snapshot \
  --db-instance-identifier lomash-orders-test-restore \
  --db-snapshot-identifier <latest-snapshot-id> \
  --db-instance-class db.t3.medium

aws rds wait db-instance-available --db-instance-identifier lomash-orders-test-restore

kubectl exec -it <test-pod> -n lomash-wood-test -- npx prisma migrate status
kubectl exec -it <test-pod> -n lomash-wood-test -- npx prisma db execute \
  --stdin <<< "SELECT COUNT(*) FROM orders;"

aws rds delete-db-instance \
  --db-instance-identifier lomash-orders-test-restore \
  --skip-final-snapshot
```

---

## Backup Monitoring and Alerting

### CloudWatch Alarms

The following alarms are configured for backup failures:

```bash
aws cloudwatch describe-alarms \
  --alarm-name-prefix "lomash-wood-backup" \
  --query 'MetricAlarms[*].{Name:AlarmName,State:StateValue}' \
  --output table
```

Alarms:
- `lomash-wood-backup-rds-failed` — fires if RDS backup fails
- `lomash-wood-backup-s3-replication-lag` — fires if replication lag > 1 hour
- `lomash-wood-backup-redis-rdb-age` — fires if RDB file is older than 2 hours

### Check Backup Age

Run this check as part of the daily operations checklist:

```bash
aws rds describe-db-snapshots \
  --db-instance-identifier lomash-orders-prod \
  --query 'sort_by(DBSnapshots, &SnapshotCreateTime)[-1].SnapshotCreateTime'
```

If the latest snapshot is older than 25 hours, investigate immediately.

---

## Offsite Backup Copy

Weekly, a copy of all pg_dump files and Redis RDB files is copied to an S3 bucket in a separate AWS account for additional isolation:

```bash
aws s3 sync s3://lomash-wood-backups/ s3://lomash-wood-backups-offsite/ \
  --source-region eu-west-1 \
  --region us-east-1
```

This job runs as a CronJob every Sunday at 04:00 UTC.