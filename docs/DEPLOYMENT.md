# Deployment Guide

This document covers the CI/CD pipeline, environment promotion strategy, and manual deployment procedures for the Lomash Wood Admin Panel.

## Environments

| Environment | Branch    | URL                                  | Auto-deploy                      |
| ----------- | --------- | ------------------------------------ | -------------------------------- |
| Local       | any       | `http://localhost:3000`              | —                                |
| Staging     | `develop` | `https://admin-dev.lomashwood.co.uk` | Yes, on push                     |
| Production  | `main`    | `https://admin.lomashwood.co.uk`     | Yes, on push (or manual trigger) |

## Prisma With Docker + DigitalOcean

This project no longer deploys on Vercel.

- Staging and production run as Docker containers on DigitalOcean droplets.
- Use versioned migrations from `prisma/migrations`.
- Do not run `prisma db push` at request startup.

Use this flow for each deploy:

1. Upload current source from GitHub Actions to the droplet over SSH/SCP.
2. Build Docker image directly on the droplet.
3. Run `prisma migrate deploy` in a one-off container on the droplet using the same env-file as the app.
4. Restart the app container.
5. Keep `prisma generate` as part of build/install so `generated/prisma` is current.

The env-file used on the droplet must include `DATABASE_URL` that is reachable from the app container (for example, a Docker network hostname for your Postgres container).

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

Triggered on push to the `develop` branch (or manually).

Steps:

1. Install dependencies, run lint + type-check + build
2. Upload source to the staging droplet
3. Build image on the staging droplet
4. Run Prisma migrations via one-off container, then restart `lomash-wood-admin-staging`
5. Run smoke test on droplet via `http://127.0.0.1:3000/api/health`

### deploy-production.yml — Production Deployment

Triggered on push to `main` or manually via `workflow_dispatch` (with confirmation).

Steps:

1. Run pre-deploy tests
2. Upload source to the production droplet
3. Build image on the production droplet
4. Run Prisma migrations via one-off container, then restart `lomash-wood-admin`
5. Run smoke test on droplet via `http://127.0.0.1:3000/api/health`
6. Create a GitHub release tag

## GitHub Secrets Required

Configure these in `Settings → Secrets and variables → Actions`:

| Secret             | Used In             | Description                    |
| ------------------ | ------------------- | ------------------------------ |
| `DROPLET_HOST`     | production          | Production droplet hostname/IP |
| `DROPLET_USER`     | staging, production | SSH user for droplet           |
| `DROPLET_PASSWORD` | staging, production | SSH password for droplet user  |

Workflow-level variables in the YAML (not secrets) must be set to your actual values:

- `STAGING_DROPLET_HOST`
- `STAGING_ENV_FILE_PATH`
- `STAGING_APP_DIR`

Production workflow uses fixed paths in YAML:

- `/opt/lomashwood/.env.production`
- `/opt/lomashwood/production-app`

## Docker

The app uses `output: "standalone"` in `next.config.js`, producing a minimal self-contained bundle.

### Dockerfile

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

### Local Postgres with Docker

```bash
docker compose -f docker-compose.db.yml up -d
```

Use:

```bash
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/postgres
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
