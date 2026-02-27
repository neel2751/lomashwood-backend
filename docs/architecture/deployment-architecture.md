# Deployment Architecture — Lomash Wood Backend

## Overview

Lomash Wood is deployed on **AWS** using a containerised microservices architecture. All services run as Docker containers on **ECS Fargate** — serverless compute requiring no EC2 instance management. Environments are fully isolated via separate AWS accounts (or VPCs with strict network segmentation).

---

## Environment Topology

| Environment | Purpose | AWS Account Strategy |
|-------------|---------|---------------------|
| `dev` | Local Docker Compose — no AWS required | Developer machine |
| `staging` | Pre-production mirror — real AWS, reduced sizing | Shared staging account |
| `production` | Live traffic | Dedicated production account |

---

## AWS Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                            AWS Region: eu-west-2 (London)                   │
│                                                                             │
│  ┌──────────────────────────────────────────────────────────────────────┐   │
│  │                      VPC: 10.0.0.0/16                                │   │
│  │                                                                      │   │
│  │  ┌─────────────────────────────────────────────────────────────┐     │   │
│  │  │                  Public Subnets (3 AZs)                     │     │   │
│  │  │   10.0.1.0/24  ·  10.0.2.0/24  ·  10.0.3.0/24               │     │   │
│  │  │                                                             │     │   │
│  │  │   ┌─────────────────────────────────────────────────┐       │     │   │
│  │  │   │      Application Load Balancer (ALB)            │       │     │   │
│  │  │   │      HTTPS :443  ←  ACM Certificate             │       │     │   │
│  │  │   │      HTTP  :80   →  301 redirect to HTTPS       │       │     │   │
│  │  │   │      Target Groups: one per microservice        │       │     │   │
│  │  │   └──────────────────────┬──────────────────────────┘       │     │   │
│  │  │                          │                                  │     │   │
│  │  │   ┌───────────────────────────────────────────────────┐     │     │   │
│  │  │   │           NAT Gateways (1 per AZ in prod)         │     │     │   │
│  │  │   └───────────────────────────────────────────────────┘     │     │   │
│  │  └─────────────────────────────────────────────────────────────┘     │   │
│  │                          │                                           │   │
│  │  ┌───────────────────────▼─────────────────────────────────────┐     │   │
│  │  │                 Private Subnets (3 AZs)                     │     │   │
│  │  │   10.0.11.0/24  ·  10.0.12.0/24  ·  10.0.13.0/24            │     │   │
│  │  │                                                             │     │   │
│  │  │   ┌──────────────────────────────────────────────────────┐  │     │   │
│  │  │   │              ECS Fargate Cluster                     │  │     │   │
│  │  │   │                                                      │  │     │   │
│  │  │   │  ┌──────────┐ ┌──────────┐ ┌──────────────────────┐  │  │     │   │
│  │  │   │  │api-gateway││auth-svc  │ │  product-service     │  │  │     │   │
│  │  │   │  │ :3000    │ │ :3001    │ │  :3002               │  │  │     │   │
│  │  │   │  └──────────┘ └──────────┘ └──────────────────────┘  │  │     │   │
│  │  │   │  ┌──────────┐ ┌──────────┐ ┌──────────────────────┐  │  │     │   │
│  │  │   │  │order-pay │ │appt-svc  │ │  content-service     │  │  │     │   │
│  │  │   │  │ :3003    │ │ :3004    │ │  :3005               │  │  │     │   │
│  │  │   │  └──────────┘ └──────────┘ └──────────────────────┘  │  │     │   │
│  │  │   │  ┌──────────┐ ┌──────────┐                           │  │     │   │
│  │  │   │  │customer  │ │notif-svc │  ┌──────────────────┐     │  │     │   │
│  │  │   │  │ :3006    │ │ :3007    │  │ analytics :3008  │     │  │     │   │
│  │  │   │  └──────────┘ └──────────┘  └──────────────────┘     │  │     │   │
│  │  │   └──────────────────────────────────────────────────────┘  │     │   │
│  │  └─────────────────────────────────────────────────────────────┘     │   │
│  │                                                                      │   │
│  │  ┌─────────────────────────────────────────────────────────────┐     │   │
│  │  │                   DB Subnets (3 AZs)                        │     │   │
│  │  │   10.0.21.0/24  ·  10.0.22.0/24  ·  10.0.23.0/24            │     │   │
│  │  │                                                             │     │   │
│  │  │  ┌─────────────────────────┐  ┌─────────────────────────┐   │     │   │
│  │  │  │  RDS PostgreSQL 16      │  │  ElastiCache Redis 7.2  │   │     │   │
│  │  │  │  db.r6g.large (prod)    │  │  cache.r6g.large (prod) │   │     │   │
│  │  │  │  Multi-AZ standby       │  │  Primary + Replica      │   │     │   │
│  │  │  │  Encrypted (KMS CMK)    │  │  TLS + auth             │   │     │   │
│  │  │  └─────────────────────────┘  └─────────────────────────┘   │     │   │
│  │  └─────────────────────────────────────────────────────────────┘     │   │
│  └──────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│  ┌──────────────────┐  ┌──────────────────┐  ┌──────────────────────────┐   │
│  │   S3 Buckets     │  │   CloudFront     │  │   Secrets Manager        │   │
│  │  lomash-media    │  │   Distribution   │  │  KMS CMK encrypted       │   │
│  │  lomash-assets   │  │  OAC → S3 origin │  │  12 secrets per env      │   │
│  │  lomash-logs     │  │  ALB API origin  │  └──────────────────────────┘   │
│  └──────────────────┘  └──────────────────┘                                 │
│                                                                             │
│  ┌──────────────────┐  ┌──────────────────┐  ┌──────────────────────────┐   │
│  │  ECR Registries  │  │  CloudWatch      │  │   SNS + SQS              │   │
│  │  (one per svc)   │  │  Logs · Metrics  │  │  Event bus (prod)        │   │
│  │  image scanning  │  │  Alarms · Dash   │  │  Dead-letter queues      │   │
│  └──────────────────┘  └──────────────────┘  └──────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## ECS Fargate Service Configuration

### Task Definition (per service)

```
CPU:    512  vCPU  (dev/staging)  →  1024 vCPU (production)
Memory: 1024 MB    (dev/staging)  →  2048 MB   (production)
```

### Auto Scaling (production)

| Service | Min | Max | Scale-out trigger |
|---------|-----|-----|------------------|
| api-gateway | 2 | 20 | CPU > 60% for 2 min |
| auth-service | 2 | 10 | CPU > 70% for 2 min |
| product-service | 2 | 15 | CPU > 65% or p95 latency > 1s |
| order-payment-service | 2 | 10 | CPU > 70% for 2 min |
| appointment-service | 1 | 8 | CPU > 70% for 2 min |
| content-service | 2 | 10 | CPU > 65% for 2 min |
| customer-service | 1 | 8 | CPU > 70% for 2 min |
| notification-service | 2 | 12 | Queue depth > 500 messages |
| analytics-service | 1 | 6 | CPU > 75% for 3 min |

All services run across **3 Availability Zones** in production, with a minimum of 1 task per AZ.

---

## Network Security

### Security Group Rules

```
ALB Security Group
  Inbound:  TCP 80  from 0.0.0.0/0   (redirect to HTTPS)
  Inbound:  TCP 443 from 0.0.0.0/0
  Outbound: All → ECS Tasks SG

ECS Tasks Security Group
  Inbound:  All TCP from ALB SG
  Inbound:  All TCP from 10.0.0.0/16  (inter-service VPC traffic)
  Outbound: All → 0.0.0.0/0 (via NAT Gateway for ECR pull, SES, Stripe)

RDS Security Group
  Inbound:  TCP 5432 from ECS Tasks SG only
  Outbound: None

Redis Security Group
  Inbound:  TCP 6379 from ECS Tasks SG only
  Outbound: None
```

### VPC Endpoints (production)

Private connectivity to AWS services — no traffic leaves the VPC:

- `com.amazonaws.eu-west-2.ecr.api`
- `com.amazonaws.eu-west-2.ecr.dkr`
- `com.amazonaws.eu-west-2.s3` (Gateway endpoint)
- `com.amazonaws.eu-west-2.secretsmanager`
- `com.amazonaws.eu-west-2.logs`
- `com.amazonaws.eu-west-2.sqs`

---

## CI/CD Pipeline

```
Developer push → GitHub PR
        │
        ▼
GitHub Actions: ci.yml
  ├── pnpm install
  ├── TypeScript typecheck (all services)
  ├── ESLint + Prettier check
  ├── Unit tests (Jest) — all services in parallel
  ├── Integration tests (Supertest + test containers)
  └── Security scan (Trivy, npm audit, SAST)

PR merge to main → GitHub Actions: deploy-staging.yml
  ├── Build Docker images (multi-arch: amd64 + arm64)
  ├── Push to ECR (tagged with git SHA)
  ├── prisma migrate deploy (staging DBs)
  └── ECS update-service (rolling deployment, 1 task at a time)

Manual approval → GitHub Actions: deploy-production.yml
  ├── Pull staging-tested image SHA from ECR
  ├── prisma migrate deploy (production DBs — read-only tx lock)
  ├── ECS Blue/Green deployment via CodeDeploy
  ├── 10-minute bake period (ALB weighted routing: 10% → new, 90% → old)
  ├── Automated smoke tests against production (health + key flows)
  └── Full cutover → old tasks drained and stopped

Rollback → GitHub Actions: rollback.yml
  ├── Re-point ECS service to previous task definition revision
  └── Alert ops team via SNS → Slack
```

---

## Database Deployment Strategy

### Migrations

Prisma migrations run as a **pre-deployment step** — before new ECS tasks start:

```bash
# Executed by CI/CD before ECS update-service
DATABASE_URL=<service-db-url> \
  npx prisma migrate deploy
```

Migrations are:
- Additive only (no DROP COLUMN, no NOT NULL without DEFAULT on existing tables)
- Reviewed in PR via `prisma migrate diff`
- Tagged with the same git SHA as the Docker image

### RDS Parameter Group (production)

```
max_connections             = 500
shared_buffers              = 8GB        (for db.r6g.2xlarge)
effective_cache_size        = 24GB
work_mem                    = 16MB
maintenance_work_mem        = 512MB
wal_level                   = logical
max_wal_size                = 4GB
idle_in_transaction_session_timeout = 30000
statement_timeout           = 60000
log_min_duration_statement  = 1000
pg_stat_statements.track    = all
```

---

## CloudFront Configuration

| Origin | Cache behaviour | TTL |
|--------|----------------|-----|
| S3 media bucket | `/media/*` | 365 days (immutable assets) |
| S3 assets bucket | `/assets/*` | 30 days |
| ALB (API) | `/v1/*` | No cache (pass-through) |
| ALB (API) | `/v1/blog/*` GET | 5 minutes |
| ALB (API) | `/v1/products` GET | 1 minute |

Cache invalidation is triggered by content-service when a blog post or product is published/updated.

---

## Secrets Management

All secrets are stored in AWS Secrets Manager, encrypted with a customer-managed KMS key (CMK) with 30-day deletion window and automatic annual key rotation.

| Secret path | Consumed by |
|-------------|------------|
| `lomash-prod/database-url` | All services (per-service DB URL) |
| `lomash-prod/redis-url` | All services |
| `lomash-prod/jwt-secret` | auth-service |
| `lomash-prod/better-auth-secret` | auth-service |
| `lomash-prod/stripe-secret-key` | order-payment-service |
| `lomash-prod/stripe-webhook-secret` | order-payment-service |
| `lomash-prod/ses-smtp-password` | notification-service |
| `lomash-prod/s3-access-key` | content-service |
| `lomash-prod/s3-secret-key` | content-service |
| `lomash-prod/twilio-auth-token` | notification-service |
| `lomash-prod/firebase-service-account` | notification-service |
| `lomash-prod/nextauth-secret` | api-gateway |

Secrets are injected as environment variables into ECS task definitions at deploy time — they never appear in Docker images or CI logs.

---

## Observability Stack (Production)

| Tool | Role | Access |
|------|------|--------|
| CloudWatch Metrics | ALB, ECS, RDS, Redis native metrics | AWS Console |
| CloudWatch Logs | Structured JSON logs from all services | AWS Console / Loki |
| Prometheus | Custom app metrics (request rate, error rate, DB query time) | Internal VPC |
| Grafana | Unified dashboards | Internal VPN access |
| Loki | Log aggregation and search | Internal VPN access |
| Sentry | Error tracking and alerting | sentry.io |
| SNS Alerts | CloudWatch alarm → SNS → email / Slack | Automatic |

---

## Sizing by Environment

| Resource | Dev (local) | Staging | Production |
|----------|------------|---------|-----------|
| ECS task CPU | — | 512 vCPU | 1024 vCPU |
| ECS task memory | — | 1024 MB | 2048 MB |
| RDS instance | Docker | db.t4g.medium | db.r6g.large (Multi-AZ) |
| RDS storage | Docker volume | 100 GB | 500 GB (auto-scale) |
| Redis node | Docker | cache.t4g.medium | cache.r6g.large (replica) |
| NAT Gateway | 1 | 1 | 3 (one per AZ) |
| ALB | Docker | 1 | 1 (multi-AZ) |