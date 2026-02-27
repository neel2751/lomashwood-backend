# Docker Infrastructure — Lomash Wood Backend

> Local development containers, Dockerfiles, and compose configuration for all Lomash Wood microservices.

---

## Directory Structure

```
infra/docker/
├── base-node.Dockerfile              # Shared Node 20 Alpine base image
├── api-gateway.Dockerfile            # API Gateway (port 3000)
├── auth-service.Dockerfile           # Auth Service (port 3001)
├── product-service.Dockerfile        # Product Service (port 3002)
├── order-payment-service.Dockerfile  # Order & Payment Service (port 3003)
├── appointment-service.Dockerfile    # Appointment Service (port 3004)
├── content-service.Dockerfile        # Content Service (port 3005)
├── customer-service.Dockerfile       # Customer Service (port 3006)
├── notification-service.Dockerfile   # Notification Service (port 3007)
├── analytics-service.Dockerfile      # Analytics Service (port 3008)
├── docker-compose.yml                # Full stack orchestration
├── docker-compose.override.yml       # Dev overrides (hot reload, debug ports, tooling)
├── postgres/
│   ├── Dockerfile                    # Custom PostgreSQL 16 dev image
│   ├── init.sql                      # DB + role creation for all 8 services
│   ├── postgresql.dev.conf           # Dev-tuned postgres settings
│   └── docker-entrypoint-override.sh # Injects dev config at runtime
└── redis/
    ├── Dockerfile                    # Custom Redis 7.2 dev image
    ├── redis.conf                    # Redis config (all 8 DB indexes mapped)
    └── docker-entrypoint-redis.sh    # Injects REDIS_PASSWORD at runtime
```

---

## Prerequisites

| Tool | Minimum Version | Install |
|------|----------------|---------|
| Docker | 25.0 | [docs.docker.com](https://docs.docker.com/get-docker/) |
| Docker Compose | 2.24 | Bundled with Docker Desktop |
| pnpm | 9.1.0 | `corepack enable && corepack prepare pnpm@9.1.0 --activate` |
| Node.js | 20 LTS | [nodejs.org](https://nodejs.org/) |

---

## Quick Start (Local Development)

### 1. Copy environment files

```bash
# From the repo root
cp .env.example .env

# Each service also has its own .env
for svc in api-gateway services/auth-service services/product-service \
            services/order-payment-service services/appointment-service \
            services/content-service services/customer-service \
            services/notification-service services/analytics-service; do
  cp ${svc}/.env.example ${svc}/.env
done
```

### 2. Install dependencies

```bash
pnpm install
```

### 3. Start the full stack

```bash
# From infra/docker/
docker compose up --build
```

`docker-compose.override.yml` is merged automatically — all services start in hot-reload mode with source mounts.

### 4. Run database migrations

```bash
# In a separate terminal — run after postgres is healthy
pnpm --filter auth-service          exec prisma migrate dev
pnpm --filter product-service       exec prisma migrate dev
pnpm --filter order-payment-service exec prisma migrate dev
pnpm --filter appointment-service   exec prisma migrate dev
pnpm --filter content-service       exec prisma migrate dev
pnpm --filter customer-service      exec prisma migrate dev
pnpm --filter notification-service  exec prisma migrate dev
pnpm --filter analytics-service     exec prisma migrate dev
```

Or use the root convenience script:

```bash
# From repo root
bash scripts/migrate.sh
```

### 5. Seed development data

```bash
bash scripts/seed.sh
```

---

## Service Port Map

| Service | Port | Debug Port | Description |
|---------|------|-----------|-------------|
| api-gateway | 3000 | 9229 | Public-facing API gateway |
| auth-service | 3001 | 9230 | Auth, sessions, roles (Better Auth) |
| product-service | 3002 | 9231 | Products, categories, colours, inventory |
| order-payment-service | 3003 | 9232 | Orders, payments (Stripe), invoices, refunds |
| appointment-service | 3004 | 9233 | Bookings, availability, consultants |
| content-service | 3005 | 9234 | CMS, blogs, media wall, SEO, landing pages |
| customer-service | 3006 | 9235 | Profiles, wishlist, reviews, loyalty |
| notification-service | 3007 | 9236 | Email (SES), SMS (Twilio), push (FCM) |
| analytics-service | 3008 | 9237 | Event tracking, funnels, dashboards |

### Infrastructure & Tooling Ports

| Service | Port | URL | Credentials |
|---------|------|-----|-------------|
| PostgreSQL | 5432 | — | See `.env` |
| Redis | 6379 | — | See `.env` |
| pgAdmin | 5050 | http://localhost:5050 | `dev@lomashwood.local` / `changeme_local` |
| Redis Commander | 8081 | http://localhost:8081 | — |
| MailHog (SMTP) | 1025 | — | — |
| MailHog (Web UI) | 8025 | http://localhost:8025 | — |
| LocalStack (AWS) | 4566 | http://localhost:4566 | — |
| Prometheus | 9090 | http://localhost:9090 | — |
| Grafana | 3100 | http://localhost:3100 | `admin` / `changeme_local` |
| Loki | 3200 | http://localhost:3200 | — |

---

## Redis Database Index Map

Each microservice is isolated to its own Redis logical database:

| DB Index | Service | Key Namespaces |
|----------|---------|---------------|
| 0 | auth-service | `session:*`, `blacklist:*`, `otp:*`, `rate:*` |
| 1 | product-service | `product:*`, `category:*`, `search:*`, `inventory:*` |
| 2 | order-payment-service | `idempotency:*`, `checkout:*`, `cart:*` |
| 3 | appointment-service | `slot:*`, `availability:*`, `lock:*` |
| 4 | content-service | `page:*`, `blog:*`, `sitemap:*`, `cdn:*` |
| 5 | customer-service | `profile:*`, `loyalty:*`, `wishlist:*` |
| 6 | notification-service | `queue:*`, `retry:*`, `delivery:*` |
| 7 | analytics-service | `event:*`, `buffer:*`, `agg:*` |

---

## PostgreSQL Database Map

Each microservice owns a dedicated logical database and a least-privilege role:

| Database | Owner Role | Service |
|----------|-----------|---------|
| `lomash_auth` | `lomash_auth` | auth-service |
| `lomash_products` | `lomash_product` | product-service |
| `lomash_orders` | `lomash_order` | order-payment-service |
| `lomash_appointments` | `lomash_appointment` | appointment-service |
| `lomash_content` | `lomash_content` | content-service |
| `lomash_customers` | `lomash_customer` | customer-service |
| `lomash_notifications` | `lomash_notification` | notification-service |
| `lomash_analytics` | `lomash_analytics` | analytics-service |

Extensions installed per-database are documented in `postgres/init.sql`.

---

## Dockerfile Architecture

Every service Dockerfile follows the same 4-stage multi-stage build:

```
┌─────────────────────────────────────────────────────────┐
│  Stage 1: deps                                          │
│  pnpm install --frozen-lockfile --filter <service>...   │
│  (workspace-filtered — only installs what's needed)     │
└────────────────────┬────────────────────────────────────┘
                     │
┌────────────────────▼────────────────────────────────────┐
│  Stage 2: prisma-gen                                    │
│  prisma generate                                        │
│  (Prisma client baked in — avoids generate at runtime)  │
└────────────────────┬────────────────────────────────────┘
                     │
┌────────────────────▼────────────────────────────────────┐
│  Stage 3: builder                                       │
│  tsc --build  →  dist/                                  │
└────────────────────┬────────────────────────────────────┘
                     │
┌────────────────────▼────────────────────────────────────┐
│  Stage 4: runner  (FROM base-node.Dockerfile)           │
│  • Only dist/ + prod node_modules + prisma schema       │
│  • Runs as non-root nodeuser (uid 1001)                 │
│  • dumb-init as PID 1 → graceful SIGTERM handling       │
│  • HEALTHCHECK via curl /health                         │
└─────────────────────────────────────────────────────────┘
```

The `base-node.Dockerfile` provides the shared foundation: Node 20 LTS Alpine, pnpm, `dumb-init`, non-root user, `TZ=Europe/London`.

---

## Development Workflow

### Starting a single service

```bash
# Only start the service + its dependencies (postgres, redis)
docker compose up postgres redis auth-service
```

### Rebuilding after dependency changes

```bash
docker compose up --build auth-service
```

### Viewing logs

```bash
# All services
docker compose logs -f

# Single service
docker compose logs -f appointment-service
```

### Attaching a Node.js debugger

Each service exposes a debug port in dev. In VS Code, add to `.vscode/launch.json`:

```json
{
  "type": "node",
  "request": "attach",
  "name": "Docker: auth-service",
  "port": 9230,
  "restart": true,
  "localRoot": "${workspaceFolder}/services/auth-service",
  "remoteRoot": "/app/services/auth-service"
}
```

Debug port assignments: auth=9230, product=9231, order=9232, appointment=9233, content=9234, customer=9235, notification=9236, analytics=9237.

### Running a Prisma migration

```bash
docker compose exec auth-service pnpm prisma migrate dev --name <migration_name>
```

### Opening a psql shell

```bash
docker compose exec postgres psql -U lomash_master -d lomash_auth
```

### Flushing a Redis database

```bash
# Flush only auth-service DB (index 0) — leaves other services untouched
docker compose exec redis redis-cli -a changeme_local -n 0 FLUSHDB
```

---

## Email in Development

All outbound email (booking confirmations, brochure delivery, payment receipts, admin alerts) is intercepted by **MailHog** — nothing reaches real inboxes.

- **SMTP:** `localhost:1025` — configured automatically via `SMTP_HOST=mailhog` in the override
- **Web UI:** http://localhost:8025 — view all captured emails

---

## AWS Services in Development (LocalStack)

The following AWS services are emulated locally by **LocalStack** at `http://localhost:4566`:

| Service | Used by | Purpose |
|---------|---------|---------|
| S3 | content-service | Product image uploads, brochure PDFs, media wall assets |
| SES | notification-service | Email delivery (falls back to MailHog in dev) |
| SQS | notification-service, analytics-service | Background job queues |
| Secrets Manager | All services | Secret retrieval (mirrors production pattern) |

Configure the AWS CLI to point at LocalStack:

```bash
aws configure set aws_access_key_id test
aws configure set aws_secret_access_key test
aws configure set region eu-west-2

# Create the media bucket
aws --endpoint-url=http://localhost:4566 s3 mb s3://lomash-dev-media
```

---

## Stripe Webhooks in Development

Use the Stripe CLI to forward webhook events to the local order-payment-service:

```bash
stripe listen --forward-to localhost:3003/v1/webhooks/stripe
```

Copy the printed webhook signing secret into `services/order-payment-service/.env`:

```
STRIPE_WEBHOOK_SECRET=whsec_...
```

---

## Production Differences

| Concern | Local Docker | Production (AWS) |
|---------|-------------|-----------------|
| PostgreSQL | Custom dev image + `init.sql` | RDS PostgreSQL 16, Multi-AZ |
| Redis | Custom dev image + `redis.conf` | ElastiCache Redis 7.2, TLS, failover |
| TLS | Disabled | Enforced at ALB + ElastiCache |
| Secrets | `.env` files | AWS Secrets Manager (CMK-encrypted) |
| Email | MailHog (local trap) | AWS SES |
| Storage | LocalStack S3 | AWS S3 + CloudFront CDN |
| Orchestration | Docker Compose | ECS Fargate + ALB |
| Auth | `fsync=off` | Full WAL durability |
| Images | Built locally | ECR + multi-arch builds via GitHub Actions |

---

## Stopping & Cleaning Up

```bash
# Stop all containers (preserves volumes)
docker compose down

# Stop and remove all volumes (wipes all DB data)
docker compose down -v

# Remove all Lomash build cache
docker builder prune --filter label=project=lomash-wood
```

---

## Troubleshooting

**Port already in use**

```bash
lsof -i :<port>   # find the occupying process
kill -9 <pid>
```

**Prisma migration fails with "shadow database" error**

Ensure the service role has `CREATEDB` permission. This is granted in `init.sql` via `GRANT CREATE ON DATABASE`. If you reset the volume and re-ran init, confirm the role exists:

```bash
docker compose exec postgres psql -U lomash_master -c "\du"
```

**Redis AUTH error from a service**

Verify the service `.env` has `REDIS_URL` in the format:

```
REDIS_URL=redis://:changeme_local@redis:6379/<DB_INDEX>
```

Note the `:` before the password — this is required by the `ioredis` URL parser.

**MailHog not capturing emails**

Confirm the service env has:

```
SMTP_HOST=mailhog
SMTP_PORT=1025
SMTP_SECURE=false
```

These are set automatically in `docker-compose.override.yml` for all relevant services.

**LocalStack S3 bucket does not exist**

```bash
aws --endpoint-url=http://localhost:4566 s3 mb s3://lomash-dev-media
aws --endpoint-url=http://localhost:4566 s3 mb s3://lomash-dev-assets
```

---

## Related Documentation

- [`docs/architecture/deployment-architecture.md`](../../docs/architecture/deployment-architecture.md) — production AWS architecture
- [`docs/onboarding/local-setup.md`](../../docs/onboarding/local-setup.md) — full developer onboarding guide
- [`infra/terraform/README.md`](../terraform/README.md) — AWS infrastructure provisioning
- [`infra/kubernetes/README.md`](../kubernetes/README.md) — Kubernetes deployment manifests
- [`scripts/README.md`](../../scripts/README.md) — all helper scripts