# RPO & RTO Targets — Lomash Wood Backend

## Overview

This document defines the Recovery Point Objective (RPO) and Recovery Time Objective (RTO) for all Lomash Wood production services and data assets.

- **RPO** — Maximum acceptable amount of data loss measured in time. How old can the restored data be?
- **RTO** — Maximum acceptable time to restore service after an outage. How long can the system be down?

---

## Service Tier Classification

Services are classified into tiers based on business impact:

| Tier | Definition | Services |
|------|------------|----------|
| **Tier 1 — Critical** | Revenue-generating or customer-facing core flows. Outage causes immediate financial or reputational damage. | api-gateway, auth-service, order-payment-service, product-service, appointment-service |
| **Tier 2 — Important** | Significant UX impact. Degradation is visible but does not block purchases or bookings. | customer-service, content-service, notification-service |
| **Tier 3 — Supporting** | Internal or background functions. No immediate customer impact. | analytics-service, background jobs, CMS admin panel |

---

## RPO & RTO Targets by Service

### Tier 1 — Critical Services

| Service | RPO | RTO | Notes |
|---------|-----|-----|-------|
| api-gateway | 0 (stateless) | 5 minutes | Stateless — restore is a Kubernetes rollout |
| auth-service | 1 hour | 15 minutes | Sessions in Redis (hourly RDB snapshot); user accounts in RDS PITR |
| order-payment-service | 0 | 20 minutes | Zero data loss required; Stripe is source of truth for payment events |
| product-service | 4 hours | 15 minutes | Product catalogue changes infrequently; cache rebuild acceptable |
| appointment-service | 1 hour | 20 minutes | Bookings must be recoverable to within 1 hour before incident |

### Tier 2 — Important Services

| Service | RPO | RTO | Notes |
|---------|-----|-----|-------|
| customer-service | 4 hours | 30 minutes | Profile/wishlist data; 4-hour loss acceptable |
| content-service | 24 hours | 30 minutes | Blog/CMS content; daily backup acceptable |
| notification-service | 24 hours | 45 minutes | Notification logs; in-flight messages replayed on restart |

### Tier 3 — Supporting Services

| Service | RPO | RTO | Notes |
|---------|-----|-----|-------|
| analytics-service | 24 hours | 2 hours | Analytics events during outage are non-recoverable and accepted as lost |
| Background jobs | N/A | 1 hour | Jobs reschedule on service restart |
| Admin CMS panel | 24 hours | 1 hour | Internal tool; business continuity not blocked |

---

## RPO & RTO Targets by Data Asset

| Data Asset | RPO | RTO | Backup Method |
|------------|-----|-----|---------------|
| `lomash_orders` database | 0 | 20 minutes | RDS PITR (continuous) + pre-deploy snapshots |
| `lomash_auth` database | 1 hour | 15 minutes | RDS PITR (continuous) |
| `lomash_products` database | 4 hours | 15 minutes | RDS automated backup (daily) |
| `lomash_appointments` database | 1 hour | 20 minutes | RDS PITR (continuous) |
| `lomash_customers` database | 4 hours | 30 minutes | RDS automated backup (daily) |
| `lomash_content` database | 24 hours | 30 minutes | RDS automated backup (daily) |
| `lomash_notifications` database | 24 hours | 45 minutes | RDS automated backup (daily) |
| `lomash_analytics` database | 24 hours | 2 hours | RDS automated backup (daily) |
| Redis sessions | 1 hour | 5 minutes | RDB snapshot (hourly) + AOF |
| Redis product cache | 0 (rebuildable) | 5 minutes | Cache rebuilt from DB on service start |
| S3 media assets | 0 | 10 minutes | S3 versioning + cross-region replication |
| Kubernetes config | 0 | 5 minutes | Git (source of truth) |
| Application secrets | 0 | 5 minutes | AWS Secrets Manager (versioned) |

---

## Business Impact by Downtime Duration

| Duration | Impact | Acceptable? |
|----------|--------|-------------|
| 0–5 min | Minimal — retries absorb most failures | Yes — within normal operational SLA |
| 5–15 min | Customers notice; some bookings/orders abandoned | Acceptable for P1 incidents only |
| 15–30 min | Measurable revenue loss; social media complaints likely | P0 — requires immediate exec notification |
| 30–60 min | Significant revenue loss; customer trust damage | P0 — CTO must be involved |
| > 60 min | Severe revenue and reputational damage; potential SLA breach | P0 — all hands; consider failover to DR region |
| > 4 hours | Contractual and regulatory obligations at risk | Declare major incident; engage AWS and legal |

---

## RTO Achievement Plan

### Tier 1 — 15–20 Minute RTO

Meeting Tier 1 RTO requires:

**1. Pre-baked AMIs and container images**

All service images are pre-built and stored in ECR. No build time during recovery.

```bash
aws ecr describe-images \
  --repository-name lomash-wood/order-payment-service \
  --query 'imageDetails[*].{Tag:imageTags[0],Pushed:imagePushedAt}' \
  --output table | tail -5
```

**2. Kubernetes autoscaling headroom**

HPA is configured with minimum replicas of 2 per Tier 1 service. One pod failure does not cause an outage.

```bash
kubectl get hpa -n lomash-wood
```

**3. RDS Multi-AZ enabled**

Failover to standby replica happens automatically within 60–120 seconds.

```bash
aws rds describe-db-instances \
  --query 'DBInstances[*].{ID:DBInstanceIdentifier,MultiAZ:MultiAZ}' \
  --output table
```

Expected: `MultiAZ: True` for all Tier 1 databases.

**4. Health checks and readiness probes**

All Kubernetes deployments have readiness probes configured. Traffic is not routed to a pod until it is healthy.

**5. Runbooks rehearsed quarterly**

Each runbook in `docs/runbooks/` must be rehearsed as part of the quarterly disaster recovery drill.

---

## RPO Achievement Plan

### Zero RPO for Order/Payment Data

The `lomash_orders` and payment transaction tables have zero RPO because:

- RDS Multi-AZ synchronously replicates every write to the standby before acknowledging the transaction.
- Stripe is an independent source of truth. Even if the local database is lost, all payment events can be replayed from the Stripe webhook log.
- Idempotency keys on all payment intent creation requests prevent duplicate charges during replay.

**Stripe event replay command (up to 30 days back):**

```bash
stripe events list --limit 100 --type payment_intent.succeeded | \
  jq -r '.data[].id' | \
  xargs -I{} curl -X POST https://api.lomashwood.com/v1/webhooks/stripe/replay \
    -H "Authorization: Bearer $INTERNAL_TOKEN" \
    -d "{\"event_id\": \"{}\"}"
```

### One-Hour RPO for Auth and Appointments

Redis session data is snapshotted every hour via RDB. Any sessions created between the last snapshot and the failure point are lost. Affected users are logged out and must re-authenticate — no data is permanently lost.

For appointments, PITR ensures sub-one-hour recovery. Any bookings made in the window between the PITR target time and the incident are identified by cross-referencing the appointment confirmation emails (stored in the notification-service log and sent via Nodemailer/SES).

---

## DR Drill Schedule

| Drill Type | Frequency | Owner | Last Performed |
|-----------|-----------|-------|----------------|
| Database PITR restore to test environment | Quarterly | Lead Backend Engineer | See DR log |
| Redis restore test | Monthly | DevOps Engineer | See DR log |
| Full Tier 1 service failover simulation | Semi-annually | Engineering Manager | See DR log |
| Multi-region failover test | Annually | CTO + Engineering Manager | See DR log |
| Runbook walkthrough (tabletop) | Quarterly | All engineers | See DR log |

DR drill results are recorded in `docs/disaster-recovery/chaos-testing.md`.

---

## SLA Summary

| SLA Metric | Target |
|-----------|--------|
| Monthly Uptime (Tier 1) | 99.9% (≤ 43.8 min downtime/month) |
| Monthly Uptime (Tier 2) | 99.5% (≤ 3.6 hours downtime/month) |
| Monthly Uptime (Tier 3) | 99.0% (≤ 7.3 hours downtime/month) |
| Payment processing uptime | 99.95% |
| Maximum data loss (orders) | 0 |
| Maximum data loss (auth/bookings) | 1 hour |

SLA breaches must be reported to the CTO within 24 hours of resolution, with a post-mortem completed within 48 hours.