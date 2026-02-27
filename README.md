# Lomash Wood — Backend

Production backend for the Lomash Wood kitchen and bedroom design platform. Node.js microservices monorepo built with TypeScript, Express, Prisma, and deployed to Kubernetes on AWS.

---

## Architecture

```
lomash-wood-backend/
├── apps/
│   ├── api-gateway/              # Public entry point — routing, rate limiting, JWT validation
│   ├── auth-service/             # Auth, sessions, JWT, MFA, RBAC (Better Auth)
│   ├── product-service/          # Product catalogue, categories, colours, inventory
│   ├── order-payment-service/    # Orders, Stripe payments, invoices, refunds
│   ├── appointment-service/      # Booking flow, availability, consultant scheduling
│   ├── content-service/          # Blog, CMS pages, media, SEO, brochures
│   ├── customer-service/         # Profiles, wishlists, reviews, loyalty, support
│   ├── notification-service/     # Email (SES), SMS (Twilio), push (Firebase)
│   └── analytics-service/        # Event tracking, funnels, dashboards, exports
│
├── packages/
│   ├── shared-db/                # Prisma schema, migrations, seeds
│   ├── shared-types/             # Shared TypeScript types and Zod schemas
│   ├── shared-utils/             # Crypto, formatting, validation helpers
│   ├── shared-errors/            # Canonical error classes and codes
│   └── shared-logger/            # Pino logger with audit trail support
│
├── infra/
│   ├── kubernetes/               # K8s manifests and Helm charts
│   └── terraform/                # AWS infrastructure (RDS, ElastiCache, S3, ECR)
│
├── security/
│   ├── policies/                 # Auth, data retention, password, API, encryption, incident response
│   ├── pentest-reports/          # Annual penetration test reports (2025, 2026)
│   ├── secrets-rotation/         # Key, DB password, and API token rotation scripts
│   └── threat-models/            # STRIDE analysis and attack trees
│
└── scripts/                      # bootstrap, migrate, deploy, rollback, seed, lint, test, build, clean
```

---

## Stack

| Layer | Technology |
|---|---|
| Runtime | Node.js 20 LTS |
| Language | TypeScript 5.4 |
| Framework | Express 4 |
| ORM | Prisma 5 |
| Database | PostgreSQL 16 (AWS RDS) |
| Cache | Redis 7 (AWS ElastiCache) |
| Auth | Better Auth + RS256 JWT |
| Payments | Stripe |
| Email | AWS SES |
| SMS | Twilio |
| Push | Firebase Admin SDK |
| Storage | AWS S3 + CloudFront |
| Build | Turbo, esbuild |
| Package Manager | pnpm 9 (workspaces) |
| Container | Docker |
| Orchestration | Kubernetes (EKS) |
| IaC | Terraform |
| CI/CD | GitHub Actions |
| Monitoring | Grafana, Prometheus, Loki, Sentry |

---

## Prerequisites

| Tool | Version | Install |
|---|---|---|
| Node.js | ≥ 20.0.0 | [nvm](https://github.com/nvm-sh/nvm) |
| pnpm | ≥ 9.0.0 | `npm install -g pnpm` |
| Docker | ≥ 24 | [Docker Desktop](https://www.docker.com/products/docker-desktop/) |
| AWS CLI | v2 | [aws.amazon.com/cli](https://aws.amazon.com/cli/) |
| kubectl | ≥ 1.29 | [kubernetes.io](https://kubernetes.io/docs/tasks/tools/) |

---

## Getting Started

```bash
git clone git@github.com:lomash-wood/lomash-wood-backend.git
cd lomash-wood-backend

./scripts/bootstrap.sh
```

`bootstrap.sh` performs the following in order:

1. Validates Node.js and pnpm versions
2. Creates `.env.development` from `.env.example`
3. Runs `pnpm install`
4. Builds all shared packages
5. Generates the Prisma client
6. Starts local Docker services (PostgreSQL, Redis)
7. Runs database migrations
8. Installs git hooks (husky)

After bootstrapping, populate `.env.development` with real values and then:

```bash
pnpm dev
```

---

## Environment Variables

Copy `.env.example` to the appropriate `.env.<environment>` file:

```bash
cp .env.example .env.development
cp .env.example .env.test
```

All required variables are documented in `.env.example`. Variables marked with an empty value require a real secret — never commit `.env.*` files (they are `.gitignore`d).

Key variable groups:

| Group | Prefix | Description |
|---|---|---|
| Database | `DATABASE_URL`, `*_DATABASE_URL` | Per-service PostgreSQL connection strings |
| Redis | `REDIS_*` | Cache and session store |
| JWT | `JWT_*` | RS256 key paths, TTLs, issuer |
| Stripe | `STRIPE_*` | Secret key, webhook secret, publishable key |
| AWS | `AWS_*`, `S3_*`, `SES_*` | Region, credentials, bucket, SES |
| Twilio | `TWILIO_*` | SMS sending |
| Firebase | `FIREBASE_*` | Push notifications |
| Feature flags | `FEATURE_*` | Toggle platform features at runtime |

---

## Scripts

All scripts live in `scripts/` and follow `./scripts/<name>.sh [env] [options]`.

| Script | Usage | Description |
|---|---|---|
| `bootstrap.sh` | `./scripts/bootstrap.sh [env]` | First-time environment setup |
| `migrate.sh` | `./scripts/migrate.sh [env] [action]` | Run Prisma migrations (`deploy`, `reset`, `status`, `diff`) |
| `seed.sh` | `./scripts/seed.sh [env] [mode]` | Seed the database (`standard`, `minimal`, `demo`, `test`, `reset`) |
| `build.sh` | `./scripts/build.sh [target]` | Build TypeScript and Docker images |
| `deploy.sh` | `./scripts/deploy.sh [env]` | Build, push to ECR, and deploy to Kubernetes |
| `rollback.sh` | `./scripts/rollback.sh [env] [service?]` | Roll back one or all service deployments |
| `lint.sh` | `./scripts/lint.sh [check\|fix]` | ESLint, TypeScript, Prettier, ShellCheck, Secretlint |
| `test.sh` | `./scripts/test.sh [mode]` | Run tests (`unit`, `integration`, `e2e`, `ci`) |
| `clean.sh` | `./scripts/clean.sh [mode]` | Remove build artefacts (`standard`, `deep`, `deps`, `docker`, `all`) |

The same operations are available as pnpm scripts:

```bash
pnpm dev                   # Start all services in watch mode
pnpm build                 # Build all packages and services
pnpm test                  # Run full test suite
pnpm test:unit             # Unit tests only
pnpm test:integration      # Integration tests only
pnpm lint                  # Lint all packages
pnpm lint:fix              # Lint and auto-fix
pnpm typecheck             # TypeScript type check across monorepo
pnpm format                # Format with Prettier
pnpm db:migrate            # Apply pending migrations (development)
pnpm db:seed               # Seed development database
pnpm db:studio             # Open Prisma Studio
pnpm clean                 # Standard clean (dist, coverage, logs)
pnpm clean:all             # Full clean including node_modules
```

---

## Database

The platform uses a single PostgreSQL instance with isolated schemas per service. Prisma manages all schema changes and migrations.

```bash
pnpm db:migrate            # Apply migrations to development
pnpm db:migrate:prod       # Apply migrations to production (requires confirmation)
pnpm db:migrate:status     # Check migration status
pnpm db:reset              # Reset development database (destructive)
pnpm db:seed               # Standard seed
pnpm db:seed:demo          # Demo seed with orders, appointments, loyalty data
pnpm db:studio             # Visual database browser
```

Schema location: `packages/shared-db/prisma/schema.prisma`
Migrations: `packages/shared-db/prisma/migrations/`
Seeds: `packages/shared-db/prisma/seeds/`

---

## Testing

Tests use [Vitest](https://vitest.dev/) across all packages.

```bash
pnpm test:unit             # Unit tests — no external dependencies
pnpm test:integration      # Integration tests — requires PostgreSQL and Redis
pnpm test:e2e              # E2E tests — spins up docker-compose.test.yml
pnpm test:ci               # Full CI suite (unit + integration + coverage)
pnpm test:watch            # Watch mode
pnpm test:coverage         # Unit tests with V8 coverage report
```

Test configuration files:

| File | Purpose |
|---|---|
| `vitest.config.unit.ts` | In-memory unit tests |
| `vitest.config.integration.ts` | DB + Redis integration tests |
| `vitest.config.e2e.ts` | Full stack E2E via docker-compose |

Coverage reports output to `coverage/`. JUnit XML reports output to `test-reports/`.

---

## Deployment

Deployment targets AWS EKS via ECR. All services are containerised and deployed as Kubernetes `Deployment` resources.

```bash
./scripts/deploy.sh staging      # Deploy to staging
./scripts/deploy.sh production   # Deploy to production (requires 'deploy-production' confirmation)

./scripts/rollback.sh staging         # Roll back all staging services
./scripts/rollback.sh production      # Roll back all production services
./scripts/rollback.sh production auth-service   # Roll back a single service
```

Deploy pipeline steps:

1. Pre-deploy tests (`test:ci`)
2. ECR login
3. `docker build` + `docker push` for all services
4. `prisma migrate deploy` against the target environment
5. `kubectl set image` for each deployment
6. Rollout status watch
7. Post-deploy health checks

Environment variables controlling the deploy:

```bash
IMAGE_TAG=<git-sha>          # Docker image tag (defaults to HEAD short SHA)
SKIP_BUILD=true              # Skip Docker build (use existing image)
SKIP_MIGRATE=true            # Skip migration step
SKIP_TESTS=true              # Skip pre-deploy tests
TARGET_SERVICE=auth-service  # Deploy only one service
PUSH=true                    # Push images to ECR (set in build.sh)
PARALLEL=true                # Build all services in parallel
```

---

## Code Style

- **TypeScript** — strict mode, no `any`, explicit return types on exported functions
- **ESLint** — `@typescript-eslint/recommended` + `import`, `security`, `promise`, `unicorn` plugins
- **Prettier** — single quotes, trailing commas, 100-char print width
- **Import order** — builtins → external → `@lomash-wood/*` → local (enforced by `import/order`)
- **Commits** — [Conventional Commits](https://www.conventionalcommits.org/) enforced by commitlint

Lint and format run automatically on staged files via `lint-staged` + `husky`.

Commit format:

```
<type>(<scope>): <short description>

[optional body]

[optional footer]
```

Valid types: `feat`, `fix`, `perf`, `refactor`, `revert`, `test`, `build`, `ci`, `docs`, `chore`, `style`, `security`, `deps`, `release`, `wip`

Valid scopes: all service names, package names, `infra`, `k8s`, `terraform`, `docker`, `ci`, `scripts`, `security`, `deps`, `monorepo`, `release`

---

## Monorepo

This repository uses [Turborepo](https://turbo.build/) to manage the build pipeline across apps and packages.

Turbo understands the dependency graph between packages — `shared-db` must build before any service that imports it. Outputs are cached locally (remote cache disabled by default).

```bash
turbo run build               # Build all, respecting dependency order
turbo run build --filter=auth-service   # Build only auth-service and its dependencies
turbo run test --filter=./apps/*        # Test all apps
turbo run lint --affected               # Lint only files changed since last commit
```

Package naming convention: all shared packages are scoped as `@lomash-wood/<name>` and declared as workspace dependencies using `workspace:*`.

---

## Security

Security documentation lives in `security/`:

| Path | Contents |
|---|---|
| `security/policies/` | Auth, password, API security, encryption, data retention, incident response |
| `security/pentest-reports/` | Annual penetration test reports (CyberSec Partners Ltd) |
| `security/threat-models/` | STRIDE threat model, attack tree analysis |
| `security/secrets-rotation/` | Key rotation, DB password rotation, API token rotation scripts |

Key security standards enforced in this codebase:

- JWT signed with RS256 (4096-bit) — HS256 is blocked at the parser level
- Passwords hashed with Argon2id (`m=65536, t=3, p=4`)
- All inbound data validated with Zod `.strict()` schemas
- IDOR prevention enforced at the repository layer (ownership filter on every user-scoped query)
- Payment amounts always calculated server-side — never accepted from the client
- Rate limiting at API Gateway with per-route overrides
- All secrets managed in AWS Secrets Manager — never committed to source control

Secrets rotation schedule:

| Secret | Frequency | Script |
|---|---|---|
| JWT RS256 key pair | 180 days | `security/secrets-rotation/rotate-keys.sh` |
| DB passwords | 90 days | `security/secrets-rotation/rotate-db-passwords.sh` |
| API tokens | 365 days | `security/secrets-rotation/rotate-api-tokens.sh` |

---

## Service Ports (Local Development)

| Service | Port |
|---|---|
| API Gateway | 4000 |
| Auth Service | 4001 |
| Product Service | 4002 |
| Order & Payment Service | 4003 |
| Appointment Service | 4004 |
| Content Service | 4005 |
| Customer Service | 4006 |
| Notification Service | 4007 |
| Analytics Service | 4008 |
| PostgreSQL | 5432 |
| Redis | 6379 |
| Prometheus | 9090 |
| Grafana | 3100 |
| Loki | 3200 |

---

## Project Structure Conventions

```
apps/<service>/
├── src/
│   ├── app/
│   │   └── <domain>/
│   │       ├── <domain>.controller.ts
│   │       ├── <domain>.service.ts
│   │       ├── <domain>.repository.ts
│   │       ├── <domain>.schemas.ts
│   │       ├── <domain>.mapper.ts
│   │       └── <domain>.types.ts
│   ├── infrastructure/
│   │   ├── db/
│   │   ├── cache/
│   │   ├── queue/
│   │   └── http/
│   ├── jobs/
│   ├── events/
│   ├── middleware/
│   ├── config/
│   └── index.ts
├── tests/
│   ├── unit/
│   └── integration/
├── Dockerfile
├── tsconfig.json
└── package.json
```

Layer responsibilities:

| Layer | File | Responsibility |
|---|---|---|
| Controller | `*.controller.ts` | Parse request, call service, return response |
| Service | `*.service.ts` | Business logic, orchestration |
| Repository | `*.repository.ts` | All database queries via Prisma |
| Schema | `*.schemas.ts` | Zod validation schemas |
| Mapper | `*.mapper.ts` | Transform DB models to response DTOs |
| Types | `*.types.ts` | Domain-specific TypeScript types |

---

## Infrastructure

Terraform manages all AWS resources in `infra/terraform/`. Kubernetes manifests and Helm charts are in `infra/kubernetes/`.

AWS services used:

| Service | Purpose |
|---|---|
| EKS | Kubernetes cluster |
| RDS (PostgreSQL 16) | Primary database |
| ElastiCache (Redis 7) | Cache and session store |
| ECR | Docker image registry |
| S3 | Media and document storage |
| CloudFront | CDN for S3 content |
| SES | Transactional email |
| Secrets Manager | All credentials and API keys |
| KMS | Encryption key management |
| ALB | Load balancer and TLS termination |
| ACM | TLS certificate management |
| CloudWatch / Loki | Logging |
| GuardDuty | Threat detection |

---

## Contributing

1. Branch from `main` using the convention `<type>/<scope>/<short-description>` (e.g. `feat/auth-service/refresh-token-rotation`)
2. Keep changes focused — one logical change per PR
3. Ensure `pnpm lint`, `pnpm typecheck`, and `pnpm test:unit` pass before opening a PR
4. Follow the commit message format enforced by commitlint
5. All PRs require at least one approval from a senior engineer
6. Security-sensitive changes (auth, payments, encryption) require approval from the Security Lead

---

## Licence

UNLICENSED — All rights reserved. Proprietary software of Lomash Wood Ltd.