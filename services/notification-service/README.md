# Notification Service

Lomash Wood — multi-channel notification microservice responsible for delivering Email, SMS, and Push notifications across transactional, campaign, and bulk flows.

---

## Table of Contents

- [Overview](#overview)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Environment Variables](#environment-variables)
- [Getting Started](#getting-started)
- [API Reference](#api-reference)
- [Channels](#channels)
- [Templates](#templates)
- [Campaigns](#campaigns)
- [Subscriptions & Preferences](#subscriptions--preferences)
- [Webhooks](#webhooks)
- [Bulk Notifications](#bulk-notifications)
- [Provider Failover](#provider-failover)
- [Background Jobs](#background-jobs)
- [Events](#events)
- [Testing](#testing)
- [Docker](#docker)
- [Health Checks](#health-checks)

---

## Overview

The Notification Service is a standalone microservice in the Lomash Wood backend monorepo. It handles all outbound communications:

- **Transactional** — booking confirmations, OTPs, order updates, password resets
- **Marketing / Campaign** — promotional emails, seasonal offers, bulk SMS blasts
- **System** — internal admin alerts, brochure request notifications, business inquiry alerts

All channels (Email, SMS, Push) are abstracted behind a provider interface, enabling transparent failover between providers without application-layer changes.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Runtime | Node.js 20 LTS |
| Framework | Express.js |
| Language | TypeScript 5 (strict mode) |
| ORM | Prisma |
| Database | PostgreSQL 15 |
| Cache / Queue | Redis 7 |
| Email Providers | AWS SES (primary), Nodemailer (fallback) |
| SMS Providers | Twilio (primary), MSG91 (fallback) |
| Push Providers | Firebase FCM (primary), Web Push (fallback) |
| Validation | Zod |
| Logging | Pino |
| Testing | Jest + Supertest |
| Container | Docker |

---

## Project Structure
```
src/
├── main.ts                        # Entry point
├── app.ts                         # Express app factory
├── bootstrap.ts                   # DI bootstrap
├── app/
│   ├── email/                     # Email channel module
│   ├── sms/                       # SMS channel module
│   ├── push/                      # Push channel module
│   └── templates/                 # Template management module
├── infrastructure/
│   ├── email/                     # SES + Nodemailer clients
│   ├── sms/                       # Twilio + MSG91 clients
│   ├── push/                      # Firebase + WebPush clients
│   ├── messaging/                 # Event consumer (internal bus)
│   └── http/                      # Server + graceful shutdown
├── interfaces/
│   ├── http/                      # Express router factory
│   └── events/                    # Event handlers + subscriptions
├── config/                        # Env, logger, CORS, rate-limit
├── jobs/                          # Background cron jobs
├── events/                        # Outbound domain events
└── shared/                        # Errors, constants, types, utils
```

---

## Environment Variables
```env
# Service
NODE_ENV=development
PORT=3005
SERVICE_NAME=notification-service

# Database
DATABASE_URL=postgresql://postgres:password@localhost:5432/lomash_notification

# Redis
REDIS_URL=redis://localhost:6379
REDIS_TTL_SECONDS=3600

# JWT (for inter-service auth)
JWT_SECRET=your-jwt-secret
JWT_ISSUER=lomash-wood

# Email — AWS SES (primary)
AWS_REGION=eu-west-2
AWS_ACCESS_KEY_ID=your-access-key
AWS_SECRET_ACCESS_KEY=your-secret-key
SES_FROM_ADDRESS=noreply@lomashwood.co.uk
SES_FROM_NAME=Lomash Wood

# Email — Nodemailer (fallback)
SMTP_HOST=smtp.mailtrap.io
SMTP_PORT=587
SMTP_USER=your-smtp-user
SMTP_PASS=your-smtp-password
SMTP_FROM=noreply@lomashwood.co.uk

# SMS — Twilio (primary)
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=your-twilio-auth-token
TWILIO_FROM_NUMBER=+441234567890

# SMS — MSG91 (fallback)
MSG91_API_KEY=your-msg91-api-key
MSG91_SENDER_ID=LOMASH

# Push — Firebase FCM (primary)
FIREBASE_PROJECT_ID=lomash-wood
FIREBASE_CLIENT_EMAIL=firebase-adminsdk@lomash-wood.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"

# Push — Web Push (fallback)
VAPID_PUBLIC_KEY=your-vapid-public-key
VAPID_PRIVATE_KEY=your-vapid-private-key
VAPID_SUBJECT=mailto:noreply@lomashwood.co.uk

# Webhook
WEBHOOK_SIGNING_SECRET=your-webhook-signing-secret

# Rate Limiting
RATE_LIMIT_WINDOW_MS=60000
RATE_LIMIT_MAX_REQUESTS=100

# Bulk Jobs
BULK_EMAIL_MAX_RECIPIENTS=10000
BULK_JOB_CONCURRENCY=5

# Internal Event Bus
EVENT_BUS_URL=redis://localhost:6379
EVENT_BUS_CONSUMER_GROUP=notification-service
```

---

## Getting Started

### Local Development
```bash
# Install dependencies
pnpm install

# Generate Prisma client
pnpm prisma generate

# Run migrations
pnpm prisma migrate dev

# Seed templates
pnpm prisma db seed

# Start with hot reload
pnpm dev
```

### Production Build
```bash
pnpm build
pnpm start
```

---

## API Reference

All routes are prefixed with `/api/v1/notifications`.

### Email

| Method | Path | Auth | Description |
|---|---|---|---|
| `POST` | `/email/send` | Service Token | Send transactional email |
| `POST` | `/email/send/raw` | Service Token | Send raw email (no template) |
| `POST` | `/email/send/bulk` | Admin | Bulk email send |
| `GET` | `/email/logs` | Admin | Paginated send logs |

### SMS

| Method | Path | Auth | Description |
|---|---|---|---|
| `POST` | `/sms/send` | Service Token | Send transactional SMS |
| `POST` | `/sms/send/raw` | Service Token | Send raw SMS |
| `POST` | `/sms/send/bulk` | Admin | Bulk SMS send |
| `GET` | `/sms/logs` | Admin | Paginated SMS logs |

### Push

| Method | Path | Auth | Description |
|---|---|---|---|
| `POST` | `/push/send` | Service Token | Send push by userId |
| `POST` | `/push/send/token` | Service Token | Send push by device token |
| `POST` | `/push/broadcast` | Admin | Broadcast push to segment |
| `POST` | `/push/tokens` | Service Token | Register device token |
| `DELETE` | `/push/tokens/:token` | Service Token | Deregister device token |

### Templates

| Method | Path | Auth | Description |
|---|---|---|---|
| `GET` | `/templates` | Admin | List templates |
| `POST` | `/templates` | Admin | Create template |
| `GET` | `/templates/:id` | Admin | Get template |
| `PATCH` | `/templates/:id` | Admin | Update template |
| `DELETE` | `/templates/:id` | Admin | Soft-delete template |
| `POST` | `/templates/:id/preview` | Admin | Preview rendered template |

### Campaigns

| Method | Path | Auth | Description |
|---|---|---|---|
| `GET` | `/campaigns` | Admin | List campaigns |
| `POST` | `/campaigns` | Admin | Create campaign |
| `GET` | `/campaigns/:id` | Admin | Get campaign |
| `POST` | `/campaigns/:id/trigger` | Admin | Manually trigger campaign |
| `POST` | `/campaigns/:id/cancel` | Admin | Cancel campaign |
| `GET` | `/campaigns/:id/stats` | Admin | Campaign delivery stats |

### Subscriptions

| Method | Path | Auth | Description |
|---|---|---|---|
| `POST` | `/subscriptions` | Service Token | Subscribe user |
| `POST` | `/subscriptions/newsletter` | Public | Newsletter subscribe |
| `GET` | `/subscriptions/:userId` | Service Token | Get user subscriptions |
| `PATCH` | `/subscriptions/:id` | Service Token | Update subscription |
| `DELETE` | `/subscriptions/:id` | Service Token | Unsubscribe |
| `GET` | `/subscriptions/newsletter/unsubscribe` | Public | Honour unsubscribe link |

### Preferences

| Method | Path | Auth | Description |
|---|---|---|---|
| `GET` | `/preferences/:userId` | Service Token | Get preferences |
| `PUT` | `/preferences/:userId` | Service Token | Upsert preferences |
| `PATCH` | `/preferences/:userId/opt-out` | Service Token | Opt out of all |
| `PATCH` | `/preferences/:userId/opt-in` | Service Token | Opt in to all |

### Webhooks

| Method | Path | Auth | Description |
|---|---|---|---|
| `GET` | `/webhooks` | Admin | List webhook endpoints |
| `POST` | `/webhooks` | Admin | Register webhook endpoint |
| `DELETE` | `/webhooks/:id` | Admin | Deactivate webhook |
| `POST` | `/webhooks/receive` | Signature | Receive inbound webhook |

### Bulk Jobs

| Method | Path | Auth | Description |
|---|---|---|---|
| `POST` | `/bulk/email` | Admin | Queue bulk email job |
| `POST` | `/bulk/sms` | Admin | Queue bulk SMS job |
| `GET` | `/bulk/jobs/:jobId` | Admin | Get bulk job status |
| `POST` | `/bulk/jobs/:jobId/cancel` | Admin | Cancel bulk job |
| `GET` | `/bulk/jobs/:jobId/report` | Admin | Bulk delivery report |

### Providers

| Method | Path | Auth | Description |
|---|---|---|---|
| `GET` | `/providers` | Admin | List providers per channel |
| `GET` | `/providers/health` | Admin | Provider health status |

---

## Channels

### Email

Supports template-based and raw sends. Primary provider is **AWS SES**; falls back to **Nodemailer (SMTP)** on failure. All sends are logged to `NotificationLog`.

### SMS

Supports template-based and raw sends. E.164 phone number format is enforced by Zod. Primary provider is **Twilio**; falls back to **MSG91**.

### Push

Supports send-by-userId (resolves to all registered device tokens) and send-by-token. Broadcast sends to all active subscribers. Primary provider is **Firebase FCM**; falls back to **Web Push (VAPID)**.

---

## Templates

Templates are stored in PostgreSQL via Prisma. Each template has:

- `channel` — `EMAIL | SMS | PUSH`
- `subject` — email/push subject (null for SMS)
- `body` — Handlebars-compatible string with `{{variable}}` placeholders
- `variables` — declared variable list (validated at send time)
- `isActive` — soft-enable/disable

Variable substitution is performed server-side before dispatch. Missing variables cause a `400 MISSING_TEMPLATE_VARIABLES` error.

---

## Campaigns

Campaigns target a segment of users and dispatch notifications via a chosen channel and template. Supported segment types:

- `ALL_SUBSCRIBERS` — all active subscriptions
- `USER_IDS` — explicit list of user IDs
- `TAG` — users tagged with a specific label

Campaigns can be scheduled (`scheduledAt`) or triggered manually. Status transitions: `DRAFT → SCHEDULED → RUNNING → COMPLETED | CANCELLED | FAILED`.

---

## Subscriptions & Preferences

**Subscriptions** track which channels and topics a user has opted into. **Preferences** are per-user boolean flags (`emailEnabled`, `smsEnabled`, `pushEnabled`, `marketingEnabled`). All notification sends respect preferences — a send to a user with `emailEnabled: false` is silently skipped and logged with status `SUPPRESSED`.

---

## Webhooks

Outbound webhooks deliver real-time delivery events (`notification.sent`, `notification.failed`) to registered third-party endpoints. Payloads are signed with `HMAC-SHA256` using the endpoint secret. Endpoints must return `2xx` within 10 seconds or the delivery is retried (up to 3 times with exponential backoff).

---

## Bulk Notifications

Bulk jobs are processed asynchronously via Redis queues. Max recipients per request: **10,000**. Each job exposes a `jobId` for status polling. Failed individual sends within a bulk job do not abort the job — they are logged and included in the delivery report.

---

## Provider Failover

Each channel has a primary and fallback provider. Failover is automatic and transparent:
```
Email:  AWS SES  →  Nodemailer (SMTP)
SMS:    Twilio   →  MSG91
Push:   Firebase →  Web Push (VAPID)
```

If all providers for a channel are unavailable, the send returns `503 ALL_PROVIDERS_UNAVAILABLE` and the notification is logged with status `FAILED`. A background job retries failed sends up to `MAX_RETRY_ATTEMPTS` (default: 3).

---

## Background Jobs

| Job | Schedule | Description |
|---|---|---|
| `retry-failed-messages.job.ts` | Every 5 min | Retries notifications in `FAILED` status |
| `purge-old-logs.job.ts` | Daily 02:00 | Deletes logs older than retention period |
| `cleanup-templates.job.ts` | Weekly | Removes soft-deleted templates past grace period |
| `rotate-provider-keys.job.ts` | Monthly | Alerts ops team on provider key expiry |

---

## Events

### Outbound (published to event bus)

| Event | Trigger |
|---|---|
| `notification.email.sent` | Email dispatched successfully |
| `notification.sms.sent` | SMS dispatched successfully |
| `notification.push.sent` | Push dispatched successfully |
| `notification.failed` | Any channel dispatch failed after retries |

### Inbound (subscribed from event bus)

| Event | Action |
|---|---|
| `appointment.created` | Send booking confirmation email + SMS |
| `order.placed` | Send order confirmation email |
| `payment.succeeded` | Send payment receipt email |
| `user.registered` | Send welcome email |
| `password.reset.requested` | Send password reset email |
| `brochure.requested` | Send brochure delivery email |
| `business.inquiry.submitted` | Send internal admin alert email |

---

## Testing
```bash
# Unit tests
pnpm test:unit

# Integration tests
pnpm test:integration

# E2E tests (requires running test DB + Redis)
pnpm test:e2e

# All tests with coverage
pnpm test:coverage
```

E2E tests require separate test DB and Redis instances. See `tests/e2e/README.md` for full setup.

---

## Docker
```bash
# Build image
docker build -t lomash-wood/notification-service .

# Run with Docker Compose (from repo root)
docker compose up notification-service
```

The service Dockerfile uses a multi-stage build: `builder` compiles TypeScript, `runner` copies only `dist/` and `node_modules` for a minimal production image.

---

## Health Checks

| Endpoint | Description |
|---|---|
| `GET /health` | Overall service health |
| `GET /health/live` | Liveness probe (always 200 if process is up) |
| `GET /health/ready` | Readiness probe (checks DB + Redis connectivity) |

Kubernetes liveness and readiness probes should target `/health/live` and `/health/ready` respectively.