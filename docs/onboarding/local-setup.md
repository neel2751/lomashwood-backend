# Local Setup Guide

---

## Prerequisites

Install the following tools before setting up the project:

| Tool | Version | Install |
|---|---|---|
| Node.js | 20.x LTS | https://nodejs.org or `nvm install 20` |
| pnpm | 9.x | `npm install -g pnpm@9` |
| Docker | 24.x+ | https://docs.docker.com/get-docker |
| Docker Compose | 2.x+ | Bundled with Docker Desktop |
| Git | 2.40+ | https://git-scm.com |
| Stripe CLI | Latest | https://stripe.com/docs/stripe-cli |
| PostgreSQL client | 16.x | `brew install postgresql@16` (optional) |
| Redis CLI | 7.x | `brew install redis` (optional) |

Verify installations:

```bash
node --version    # v20.x.x
pnpm --version    # 9.x.x
docker --version  # Docker version 24.x.x
git --version     # git version 2.40.x
```

---

## Clone the Repository

```bash
git clone git@github.com:lomashwood/lomash-wood-backend.git
cd lomash-wood-backend
```

---

## One-Command Bootstrap

The bootstrap script installs all dependencies, copies env files, starts Docker containers, runs migrations, and seeds the database:

```bash
chmod +x scripts/bootstrap.sh
./scripts/bootstrap.sh
```

Once complete, all services are running and accessible. Skip to the [Verify Setup](#verify-setup) section.

---

## Manual Setup (Step by Step)

### Step 1 — Install Dependencies

```bash
pnpm install
```

Turborepo and pnpm workspaces install dependencies for all packages and services simultaneously.

### Step 2 — Configure Environment Variables

Each service has a `.env.example` documenting all required variables. Copy and populate them:

```bash
cp api-gateway/.env.example api-gateway/.env
cp services/auth-service/.env.example services/auth-service/.env
cp services/product-service/.env.example services/product-service/.env
cp services/order-payment-service/.env.example services/order-payment-service/.env
cp services/appointment-service/.env.example services/appointment-service/.env
cp services/content-service/.env.example services/content-service/.env
cp services/customer-service/.env.example services/customer-service/.env
cp services/notification-service/.env.example services/notification-service/.env
cp services/analytics-service/.env.example services/analytics-service/.env
```

For local development, most values in `.env.example` are pre-filled with sensible defaults. You only need to add:

- `STRIPE_SECRET_KEY` — get from https://dashboard.stripe.com/test/apikeys
- `STRIPE_WEBHOOK_SECRET` — obtained from `stripe listen` CLI output (see Step 6)
- AWS credentials (only needed if testing S3 uploads; skip for most local work)

### Step 3 — Start Infrastructure Containers

```bash
docker compose -f infra/docker/docker-compose.yml up -d postgres redis
```

Wait for healthy status:

```bash
docker compose -f infra/docker/docker-compose.yml ps
# Both postgres and redis should show "healthy"
```

### Step 4 — Run Database Migrations

```bash
./scripts/migrate.sh
```

This runs `prisma migrate dev` for every service in sequence. To run a single service migration:

```bash
cd services/auth-service
npx prisma migrate dev
cd ../..
```

### Step 5 — Seed the Database

```bash
./scripts/seed.sh
```

Seeds create:

- Admin user: `admin@lomashwood.co.uk` / `Admin1234!`
- Sample kitchen and bedroom products with colours and sizes
- Showroom records
- CMS pages (Finance, About, Media Wall, etc.)
- Appointment time slots for the next 30 days
- Newsletter, FAQ, and blog fixture data

### Step 6 — Start All Services

```bash
pnpm dev
```

Turborepo starts all services in parallel with hot reload via nodemon. Logs from all services are streamed to the terminal with service name prefixes.

To start a single service in isolation:

```bash
cd api-gateway && pnpm dev
cd services/auth-service && pnpm dev
```

### Step 7 — Set Up Stripe Webhooks (Local)

In a separate terminal:

```bash
stripe login
stripe listen --forward-to http://localhost:4000/v1/webhooks/stripe
```

Copy the printed `whsec_xxx` value into `services/order-payment-service/.env`:

```
STRIPE_WEBHOOK_SECRET=whsec_xxx
```

Restart the order-payment-service if it was already running.

---

## Service Ports

| Service | Port | Health Check URL |
|---|---|---|
| API Gateway | 4000 | http://localhost:4000/health |
| Auth Service | 3001 | http://localhost:3001/health |
| Product Service | 3002 | http://localhost:3002/health |
| Order-Payment Service | 3003 | http://localhost:3003/health |
| Appointment Service | 3004 | http://localhost:3004/health |
| Content Service | 3005 | http://localhost:3005/health |
| Customer Service | 3006 | http://localhost:3006/health |
| Notification Service | 3007 | http://localhost:3007/health |
| Analytics Service | 3008 | http://localhost:3008/health |
| PostgreSQL | 5432 | — |
| Redis | 6379 | — |

All API requests go through the gateway at `http://localhost:4000`. Direct service ports exist for debugging only.

---

## Verify Setup

```bash
# Gateway health
curl http://localhost:4000/health

# Register a test user
curl -X POST http://localhost:4000/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Test User","email":"test@example.com","password":"Test1234!"}'

# List products
curl http://localhost:4000/v1/products
```

---

## Prisma Studio

Inspect and edit database records via browser UI:

```bash
# Open studio for a specific service (each opens on a different port)
cd services/auth-service && npx prisma studio        # http://localhost:5555
cd services/product-service && npx prisma studio     # http://localhost:5556
```

---

## Environment Variables Reference

### Common (all services)

| Variable | Description | Local Default |
|---|---|---|
| `NODE_ENV` | Runtime environment | `development` |
| `PORT` | HTTP port | See ports table above |
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://lomash:lomash@localhost:5432/lomash_{service}` |
| `REDIS_URL` | Redis connection string | `redis://localhost:6379` |
| `LOG_LEVEL` | Pino log level | `debug` |
| `CORS_ORIGIN` | Allowed origin | `http://localhost:3000` |

### Auth Service

| Variable | Description |
|---|---|
| `JWT_SECRET` | HS256 signing secret (min 32 chars) |
| `JWT_EXPIRY` | Token lifetime (e.g., `1h`) |
| `BCRYPT_ROUNDS` | bcrypt cost factor (default: `12`) |
| `OTP_EXPIRY_MINUTES` | OTP validity window (default: `10`) |

### API Gateway

| Variable | Description |
|---|---|
| `AUTH_SERVICE_URL` | `http://localhost:3001` |
| `PRODUCT_SERVICE_URL` | `http://localhost:3002` |
| `ORDER_SERVICE_URL` | `http://localhost:3003` |
| `APPOINTMENT_SERVICE_URL` | `http://localhost:3004` |
| `CONTENT_SERVICE_URL` | `http://localhost:3005` |
| `CUSTOMER_SERVICE_URL` | `http://localhost:3006` |
| `NOTIFICATION_SERVICE_URL` | `http://localhost:3007` |
| `ANALYTICS_SERVICE_URL` | `http://localhost:3008` |
| `JWT_SECRET` | Must match auth-service JWT_SECRET |
| `RATE_LIMIT_WINDOW_MS` | Rate limit window in ms (default: `900000`) |
| `RATE_LIMIT_MAX` | Max requests per window (default: `100`) |

### Order-Payment Service

| Variable | Description |
|---|---|
| `STRIPE_SECRET_KEY` | `sk_test_xxx` for local |
| `STRIPE_WEBHOOK_SECRET` | `whsec_xxx` from Stripe CLI |
| `STRIPE_API_VERSION` | e.g., `2024-12-18.acacia` |

### Content Service

| Variable | Description |
|---|---|
| `AWS_ACCESS_KEY_ID` | AWS access key |
| `AWS_SECRET_ACCESS_KEY` | AWS secret key |
| `AWS_REGION` | e.g., `eu-west-2` |
| `S3_BUCKET_NAME` | e.g., `lomash-media-dev` |
| `CDN_BASE_URL` | e.g., `https://cdn-dev.lomashwood.co.uk` |

### Notification Service

| Variable | Description |
|---|---|
| `SMTP_HOST` | SMTP server host |
| `SMTP_PORT` | SMTP port (usually `587`) |
| `SMTP_USER` | SMTP username |
| `SMTP_PASS` | SMTP password |
| `EMAIL_FROM` | `noreply@lomashwood.co.uk` |
| `TWILIO_ACCOUNT_SID` | Twilio SID |
| `TWILIO_AUTH_TOKEN` | Twilio token |
| `TWILIO_PHONE_NUMBER` | SMS sender number |

---

## Running Tests Locally

```bash
# All tests across all services
pnpm test

# Tests for a specific service
cd services/auth-service && pnpm test

# Unit tests only
pnpm test:unit

# Integration tests only (requires running Docker)
pnpm test:integration

# Watch mode during development
cd services/auth-service && pnpm test:watch
```

---

## Troubleshooting

### Port conflict

```bash
lsof -i :4000 | grep LISTEN
kill -9 <PID>
```

### PostgreSQL container not starting

```bash
docker compose -f infra/docker/docker-compose.yml logs postgres
docker compose -f infra/docker/docker-compose.yml down -v
docker compose -f infra/docker/docker-compose.yml up -d postgres
```

### Prisma migration errors

Reset a single service database (development only — destroys all data):

```bash
cd services/auth-service
npx prisma migrate reset --force
```

### TypeScript errors after pulling new code

Regenerate all Prisma clients:

```bash
pnpm --filter './services/*' exec npx prisma generate
pnpm build
```

### Redis connection refused

```bash
docker compose -f infra/docker/docker-compose.yml restart redis
```

### `pnpm install` fails

```bash
pnpm store prune
rm -rf node_modules
pnpm install
```