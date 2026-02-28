# Deployment Guide

This document covers the CI/CD pipeline, environment promotion strategy, and manual deployment procedures for the Lomash Wood Admin Panel.

## Environments

| Environment | Branch | URL | Auto-deploy |
|---|---|---|---|
| Local | any | `http://localhost:3000` | — |
| Staging | `develop` | `https://admin-dev.lomashwood.co.uk` | Yes, on push |
| Production | `main` | `https://admin.lomashwood.co.uk` | On release tag |

## CI/CD Pipeline

The pipeline is defined in `.github/workflows/`:

```
.github/workflows/
├── ci.yml                # Runs on every push and PR
├── deploy-staging.yml    # Deploys to staging on push to develop
└── deploy-production.yml # Deploys to production on release tag
```

### ci.yml — Continuous Integration

Triggered on every push and pull request to `main` and `develop`.

Steps:
1. Checkout with submodules
2. Setup Node.js 20 and pnpm cache
3. `pnpm install --frozen-lockfile`
4. `pnpm type-check`
5. `pnpm lint`
6. `pnpm test:ci` (Jest with coverage)
7. `pnpm build`
8. Upload test results and coverage as artifacts

All steps must pass before a PR can be merged.

### deploy-staging.yml — Staging Deployment

Triggered on push to the `develop` branch after CI passes.

Steps:
1. Run full CI pipeline
2. `pnpm build` with staging env vars injected from GitHub Secrets
3. Build Docker image tagged with short SHA
4. Push to container registry
5. Deploy to staging server via SSH
6. Run smoke test against `https://admin-dev.lomashwood.co.uk/api/health`

### deploy-production.yml — Production Deployment

Triggered manually via `workflow_dispatch` or automatically on a semver release tag (`v*.*.*`).

Steps:
1. Run full CI pipeline
2. `pnpm build` with production env vars injected from GitHub Secrets
3. Build and tag Docker image (`latest` + version tag)
4. Push to container registry
5. Deploy to production server via SSH with zero-downtime rolling restart
6. Run smoke test against `https://admin.lomashwood.co.uk/api/health`
7. Create Sentry release and upload source maps

## GitHub Secrets Required

Configure these in `Settings → Secrets and variables → Actions`:

| Secret | Used In | Description |
|---|---|---|
| `NEXTAUTH_SECRET` | staging, production | NextAuth signing secret |
| `AUTH_SERVICE_URL` | staging, production | Internal auth service URL |
| `PRODUCT_SERVICE_URL` | staging, production | Internal product service URL |
| `ORDER_SERVICE_URL` | staging, production | Internal order service URL |
| `APPOINTMENT_SERVICE_URL` | staging, production | Internal appointment service URL |
| `CUSTOMER_SERVICE_URL` | staging, production | Internal customer service URL |
| `CONTENT_SERVICE_URL` | staging, production | Internal content service URL |
| `NOTIFICATION_SERVICE_URL` | staging, production | Internal notification service URL |
| `ANALYTICS_SERVICE_URL` | staging, production | Internal analytics service URL |
| `STORAGE_ACCESS_KEY_ID` | staging, production | S3 access key |
| `STORAGE_SECRET_ACCESS_KEY` | staging, production | S3 secret key |
| `SMTP_PASS` | staging, production | SMTP password |
| `SENTRY_AUTH_TOKEN` | production | Sentry source map upload token |
| `SSH_PRIVATE_KEY` | staging, production | SSH key for server deployment |
| `REGISTRY_TOKEN` | staging, production | Container registry auth token |

## Docker

The app uses `output: "standalone"` in `next.config.js`, producing a minimal self-contained bundle.

### Dockerfile (reference)

```dockerfile
FROM node:20-alpine AS base

FROM base AS deps
WORKDIR /app
COPY package.json pnpm-lock.yaml ./
RUN npm install -g pnpm && pnpm install --frozen-lockfile

FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN pnpm build

FROM base AS runner
WORKDIR /app
ENV NODE_ENV=production
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
USER nextjs
EXPOSE 3000
ENV PORT=3000
CMD ["node", "server.js"]
```

### Build and run locally

```bash
docker build -t lomash-wood-admin .
docker run -p 3000:3000 --env-file .env.local lomash-wood-admin
```

## Manual Deployment

If you need to deploy outside the automated pipeline:

```bash

pnpm build


NODE_ENV=production node server.js
```

## Rollback

To roll back to a previous version in production:

```bash
```

Or via SSH on the server:

```bash
docker pull registry.example.com/lomash-wood-admin:v1.2.3
docker stop lomash-wood-admin
docker run -d --name lomash-wood-admin registry.example.com/lomash-wood-admin:v1.2.3
```

## Health Check

The admin panel exposes a health endpoint at `/api/health` which the deployment pipeline uses for smoke testing. It returns `200 OK` when the app is running and can reach the API Gateway.