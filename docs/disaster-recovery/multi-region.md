# Multi-Region Strategy — Lomash Wood Backend

## Overview

This document defines the multi-region architecture and failover strategy for the Lomash Wood backend. The platform operates primarily in `eu-west-1` (Ireland) with a warm standby in `eu-west-2` (London) for data residency compliance and disaster recovery.

---

## Region Configuration

| Role | AWS Region | Location | Status |
|------|-----------|----------|--------|
| Primary | `eu-west-1` | Ireland | Active — serves all production traffic |
| DR Standby | `eu-west-2` | London | Warm standby — receives data, not serving traffic |

**Why eu-west-2 as standby:**
- UK data residency requirement for customer data under UK GDPR
- Low-latency failover for the Lomash Wood customer base (UK-based)
- Shared AWS support tier coverage

---

## Architecture Overview

```
                    ┌─────────────────┐
                    │   Route 53 DNS  │
                    │  Health Checks  │
                    └────────┬────────┘
                             │
              ┌──────────────┴──────────────┐
              │                             │
    ┌─────────▼──────────┐       ┌──────────▼─────────┐
    │   eu-west-1        │       │   eu-west-2         │
    │   PRIMARY          │       │   WARM STANDBY      │
    │                    │       │                     │
    │ ┌────────────────┐ │  RDS  │ ┌─────────────────┐ │
    │ │ EKS Cluster    │ │ Repli │ │ EKS Cluster     │ │
    │ │ (active)       │ │ cation│ │ (scaled to 0)   │ │
    │ └────────────────┘ │──────▶│ └─────────────────┘ │
    │                    │       │                     │
    │ ┌────────────────┐ │  S3   │ ┌─────────────────┐ │
    │ │ RDS Primary    │ │  CRR  │ │ RDS Read Replica│ │
    │ └────────────────┘ │──────▶│ └─────────────────┘ │
    │                    │       │                     │
    │ ┌────────────────┐ │       │ ┌─────────────────┐ │
    │ │ ElastiCache    │ │       │ │ ElastiCache     │ │
    │ │ Redis          │ │       │ │ (cold)          │ │
    │ └────────────────┘ │       │ └─────────────────┘ │
    │                    │       │                     │
    │ ┌────────────────┐ │  CRR  │ ┌─────────────────┐ │
    │ │ S3 Media       │ │──────▶│ │ S3 Media        │ │
    │ │ (primary)      │ │       │ │ (replica)       │ │
    │ └────────────────┘ │       │ └─────────────────┘ │
    └────────────────────┘       └─────────────────────┘
```

---

## Data Replication

### PostgreSQL — RDS Cross-Region Read Replica

Each Tier 1 database has a cross-region read replica in `eu-west-2`.

**Verify replication lag:**

```bash
aws rds describe-db-instances \
  --region eu-west-2 \
  --db-instance-identifier lomash-orders-prod-replica \
  --query 'DBInstances[0].StatusInfos'
```

Check replication lag via CloudWatch:

```bash
aws cloudwatch get-metric-statistics \
  --namespace AWS/RDS \
  --metric-name ReplicaLag \
  --dimensions Name=DBInstanceIdentifier,Value=lomash-orders-prod-replica \
  --start-time $(date -u -d '1 hour ago' +%Y-%m-%dT%H:%M:%SZ) \
  --end-time $(date -u +%Y-%m-%dT%H:%M:%SZ) \
  --period 300 \
  --statistics Average \
  --region eu-west-2
```

Target: replication lag < 30 seconds under normal load.

### S3 — Cross-Region Replication (CRR)

All objects written to `s3://lomash-wood-media-prod` (eu-west-1) are automatically replicated to `s3://lomash-wood-media-prod-replica` (eu-west-2).

**Check replication metrics:**

```bash
aws s3api get-bucket-replication --bucket lomash-wood-media-prod

aws cloudwatch get-metric-statistics \
  --namespace AWS/S3 \
  --metric-name ReplicationLatency \
  --dimensions Name=SourceBucket,Value=lomash-wood-media-prod \
  --start-time $(date -u -d '1 hour ago' +%Y-%m-%dT%H:%M:%SZ) \
  --end-time $(date -u +%Y-%m-%dT%H:%M:%SZ) \
  --period 300 \
  --statistics Maximum
```

### Redis — No Active Cross-Region Replication

Redis (session cache) is not replicated cross-region. On failover, a fresh Redis cluster is started in `eu-west-2`. Active sessions are lost and users must re-authenticate. This is within the 1-hour RPO for auth.

---

## Route 53 Health Checks and DNS Failover

Route 53 is configured with active health checks on the primary API Gateway load balancer.

**Health check configuration:**

```bash
aws route53 list-health-checks \
  --query 'HealthChecks[*].{ID:Id,Type:HealthCheckConfig.Type,Endpoint:HealthCheckConfig.FullyQualifiedDomainName,Interval:HealthCheckConfig.RequestInterval}' \
  --output table
```

| Check | Target | Interval | Failure Threshold |
|-------|--------|----------|------------------|
| Primary API Gateway | `api.lomashwood.com` | 10 seconds | 3 consecutive failures |
| Auth Service health | `/v1/auth/health` | 30 seconds | 3 consecutive failures |

**DNS failover policy:**

- Primary record: `api.lomashwood.com` → eu-west-1 ALB
- Secondary record (failover): `api.lomashwood.com` → eu-west-2 ALB (activated automatically on health check failure)

TTL is set to 60 seconds to minimise DNS propagation delay during failover.

---

## Regional Failover Procedure

### Trigger Conditions

Initiate regional failover when:
- eu-west-1 is completely unavailable (AWS region outage)
- RTO cannot be met by in-region recovery
- A security incident requires isolating the primary region

### Step 1 — Declare Regional Failover

Post in `#incidents` Slack:

```
REGIONAL FAILOVER INITIATED — eu-west-1 → eu-west-2
Reason: [describe]
Owner: [your name]
ETA: ~30 minutes
```

Notify: Engineering Manager, CTO, AWS Support (open P1 case).

### Step 2 — Promote RDS Read Replicas in eu-west-2

Promote all replicas simultaneously:

```bash
#!/bin/bash
REPLICAS=(
  lomash-auth-prod-replica
  lomash-products-prod-replica
  lomash-orders-prod-replica
  lomash-appointments-prod-replica
  lomash-content-prod-replica
  lomash-customers-prod-replica
  lomash-notifications-prod-replica
  lomash-analytics-prod-replica
)

for replica in "${REPLICAS[@]}"; do
  echo "Promoting $replica..."
  aws rds promote-read-replica \
    --db-instance-identifier $replica \
    --region eu-west-2
done

echo "Waiting for promotions to complete..."
for replica in "${REPLICAS[@]}"; do
  aws rds wait db-instance-available \
    --db-instance-identifier $replica \
    --region eu-west-2
  echo "$replica promoted."
done
```

Promotion typically takes 3–5 minutes per instance.

### Step 3 — Scale Up EKS in eu-west-2

The standby EKS cluster is kept at 0 replicas. Scale up all services:

```bash
kubectl config use-context lomash-wood-eu-west-2

SERVICES=(
  auth-service
  product-service
  customer-service
  content-service
  notification-service
  order-payment-service
  appointment-service
  analytics-service
  api-gateway
)

for svc in "${SERVICES[@]}"; do
  kubectl scale deployment/$svc --replicas=3 -n lomash-wood
done

for svc in "${SERVICES[@]}"; do
  kubectl rollout status deployment/$svc -n lomash-wood
done
```

### Step 4 — Update Database Connection Strings

Update Kubernetes secrets in eu-west-2 to point to the newly promoted instances:

```bash
for DB in auth products orders appointments content customers notifications analytics; do
  NEW_HOST=$(aws rds describe-db-instances \
    --db-instance-identifier lomash-${DB}-prod-replica \
    --region eu-west-2 \
    --query 'DBInstances[0].Endpoint.Address' --output text)

  echo "$DB → $NEW_HOST"
done
```

Apply updated secrets:

```bash
kubectl apply -f infra/kubernetes/overlays/eu-west-2/secrets.yaml -n lomash-wood
kubectl rollout restart deployment -n lomash-wood
```

### Step 5 — Update Stripe Webhook Endpoint

Log in to the Stripe dashboard and update the webhook endpoint URL from:

`https://api.lomashwood.com/v1/webhooks/stripe`

to the eu-west-2 endpoint if using a region-specific domain. If using a global domain that Route 53 handles, no change is needed.

### Step 6 — Trigger DNS Failover

If Route 53 has not automatically failed over:

```bash
aws route53 change-resource-record-sets \
  --hosted-zone-id <zone-id> \
  --change-batch '{
    "Changes": [{
      "Action": "UPSERT",
      "ResourceRecordSet": {
        "Name": "api.lomashwood.com",
        "Type": "A",
        "AliasTarget": {
          "HostedZoneId": "<eu-west-2-alb-hosted-zone-id>",
          "DNSName": "<eu-west-2-alb-dns-name>",
          "EvaluateTargetHealth": true
        }
      }
    }]
  }'
```

Verify DNS propagation:

```bash
dig api.lomashwood.com @8.8.8.8
```

### Step 7 — Verify Failover Complete

```bash
curl -sf https://api.lomashwood.com/health | jq .region
```

Expected: `"eu-west-2"`.

Run smoke tests:

```bash
bash scripts/smoke-test.sh production
```

---

## Failback Procedure (eu-west-1 Recovery)

When eu-west-1 is restored, failback in this order:

1. Restore all RDS instances in eu-west-1 from snapshots taken from eu-west-2 promoted instances.
2. Re-establish read replicas: eu-west-1 primary → eu-west-2 replica.
3. Sync any S3 objects written to eu-west-2 back to eu-west-1.
4. Scale up EKS in eu-west-1 and verify all services healthy.
5. Gradually shift traffic back using Route 53 weighted routing (10% → 50% → 100%).
6. Scale down eu-west-2 EKS to 0 replicas.
7. Re-establish eu-west-1 as primary, eu-west-2 as standby.

---

## Multi-Region Cost Optimisation

| Resource | Cost Strategy |
|----------|--------------|
| EKS (eu-west-2) | 0 replicas at rest; scale on failover |
| RDS replicas (eu-west-2) | `db.t3.medium` — minimal size; scale on failover |
| Redis (eu-west-2) | Stopped; recreate on failover |
| S3 CRR | Pay per object replicated (ongoing) |
| Route 53 health checks | Fixed monthly cost (~$3/check) |

---

## Testing Multi-Region Failover

A full regional failover test is performed annually. A partial failover test (DNS cutover only, without promoting replicas) is performed semi-annually.

Results are recorded in `docs/disaster-recovery/chaos-testing.md`.