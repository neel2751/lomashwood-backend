# Customer Service

Microservice responsible for managing customer profiles, addresses, wishlists, reviews, support tickets, loyalty points, referrals, and notification preferences for the Lomash Wood platform.

---

## Table of Contents

- [Overview](#overview)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Domain Modules](#domain-modules)
- [API Endpoints](#api-endpoints)
- [Environment Variables](#environment-variables)
- [Database](#database)
- [Running Locally](#running-locally)
- [Testing](#testing)
- [Events](#events)
- [Background Jobs](#background-jobs)
- [Docker](#docker)

---

## Overview

The customer-service owns all customer-facing data beyond authentication. It exposes a REST API consumed by the API Gateway and listens to domain events from other services (orders, appointments, payments) to keep customer data consistent.

**Port:** `4006`  
**Base path:** `/v1/customers`  
**Health check:** `GET /health`

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Runtime | Node.js 20 LTS |
| Language | TypeScript 5 |
| Framework | Express.js |
| ORM | Prisma |
| Database | PostgreSQL 15 |
| Cache | Redis 7 |
| Validation | Zod |
| Messaging | Kafka (via shared event-bus package) |
| Testing | Jest + Supertest |
| Containerisation | Docker |

---

## Project Structure

```
customer-service/
├── prisma/
│   ├── schema.prisma
│   ├── seed.ts
│   └── migrations/
├── src/
│   ├── main.ts
│   ├── app.ts
│   ├── bootstrap.ts
│   ├── app/
│   │   ├── profiles/
│   │   ├── wishlist/
│   │   ├── reviews/
│   │   ├── support/
│   │   └── loyalty/
│   ├── infrastructure/
│   │   ├── db/
│   │   ├── cache/
│   │   ├── messaging/
│   │   └── http/
│   ├── interfaces/
│   │   ├── http/
│   │   └── events/
│   ├── config/
│   ├── jobs/
│   ├── events/
│   └── shared/
└── tests/
    ├── unit/
    ├── integration/
    ├── e2e/
    └── fixtures/
```

---

## Domain Modules

### Profiles

Manages customer personal information, marketing consent, and verification status. Each profile is tied 1:1 to a user account created by the auth-service.

**Entities:** `CustomerProfile`, `CustomerAddress`, `NotificationPreference`

### Wishlist

Allows customers to save kitchen and bedroom products for later. Enforces per-user uniqueness per product. Supports category filtering and pagination.

**Entities:** `Wishlist`, `WishlistItem`

### Reviews

Handles product review submission, moderation workflow (PENDING → APPROVED / REJECTED), and public display. Customers may submit one review per product.

**Entities:** `ProductReview`

### Support

Full customer support ticketing system. Customers raise tickets, agents respond, internal notes are hidden from customers, and resolved tickets can be rated.

**Entities:** `SupportTicket`, `SupportTicketMessage`

### Loyalty

Points-based loyalty programme with tier progression (BRONZE → SILVER → GOLD → PLATINUM). Points are earned on purchases and redeemed against discounts. All transactions are immutable ledger entries.

**Entities:** `LoyaltyAccount`, `LoyaltyTransaction`

**Tiers:**

| Tier | Lifetime Points Required |
|------|--------------------------|
| BRONZE | 0 |
| SILVER | 1,000 |
| GOLD | 5,000 |
| PLATINUM | 15,000 |

### Referrals

Customers generate a unique referral code. When a referee uses the code and completes a qualifying purchase, both parties receive loyalty points. Self-referral is blocked.

**Entities:** `Referral`

---

## API Endpoints

### Profile

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/v1/customers/profile` | Customer | Create profile |
| GET | `/v1/customers/profile` | Customer | Get own profile |
| PATCH | `/v1/customers/profile` | Customer | Update profile fields |
| GET | `/v1/customers/dashboard` | Customer | Dashboard summary |
| GET | `/v1/customers/onboarding-status` | Customer | Onboarding checklist |

### Addresses

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/v1/customers/addresses` | Customer | List addresses |
| POST | `/v1/customers/addresses` | Customer | Add address |
| PATCH | `/v1/customers/addresses/:id` | Customer | Update address |
| DELETE | `/v1/customers/addresses/:id` | Customer | Delete address |

### Notification Preferences

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/v1/customers/notification-preferences` | Customer | Get preferences |
| PUT | `/v1/customers/notification-preferences` | Customer | Replace all preferences |
| PATCH | `/v1/customers/notification-preferences` | Customer | Update partial preferences |
| POST | `/v1/customers/notification-preferences/opt-out` | Customer | Global opt-out |

### Wishlist

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/v1/customers/wishlist` | Customer | Get wishlist with items |
| POST | `/v1/customers/wishlist/items` | Customer | Add item |
| GET | `/v1/customers/wishlist/check/:productId` | Customer | Check if product is saved |
| DELETE | `/v1/customers/wishlist/items/:id` | Customer | Remove single item |
| DELETE | `/v1/customers/wishlist/items` | Customer | Clear all items |

### Reviews

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/v1/customers/reviews` | Customer | Submit review |
| GET | `/v1/customers/reviews` | Customer | List own reviews |
| GET | `/v1/customers/reviews/:id` | Customer | Get single review |
| GET | `/v1/customers/reviews/product/:productId` | Public | Get approved reviews for product |
| PATCH | `/v1/customers/reviews/:id/status` | Admin | Approve or reject review |

### Support Tickets

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/v1/customers/support/tickets` | Customer | Create ticket |
| GET | `/v1/customers/support/tickets` | Customer / Admin | List tickets |
| GET | `/v1/customers/support/tickets/:id` | Customer / Admin | Get ticket with thread |
| PATCH | `/v1/customers/support/tickets/:id` | Admin | Update status / assignee |
| POST | `/v1/customers/support/tickets/:id/messages` | Customer / Admin | Add message |
| POST | `/v1/customers/support/tickets/:id/rating` | Customer | Rate resolved ticket |

### Loyalty

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/v1/customers/loyalty` | Customer | Get balance and tier |
| GET | `/v1/customers/loyalty/transactions` | Customer | Transaction history |
| POST | `/v1/customers/loyalty/transactions` | Admin | Credit / debit / adjust points |

### Referrals

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/v1/customers/referrals/generate` | Customer | Generate referral code |
| GET | `/v1/customers/referrals` | Customer | List own referrals |
| GET | `/v1/customers/referrals/stats` | Customer | Referral statistics |
| GET | `/v1/customers/referrals/validate/:code` | Public | Validate a referral code |
| POST | `/v1/customers/referrals/apply` | Customer | Apply a referral code |
| PATCH | `/v1/customers/referrals/:id/complete` | Admin | Mark referral complete and award points |

### Portal

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/v1/customers/portal/orders` | Customer | Order history summary |
| GET | `/v1/customers/portal/appointments` | Customer | Appointment history |
| GET | `/v1/customers/portal/support` | Customer | Support ticket summary |
| GET | `/v1/customers/portal/brochure-requests` | Customer | Brochure request history |

---

## Environment Variables

```env
# Application
NODE_ENV=development
PORT=4006
SERVICE_NAME=customer-service

# Database
DATABASE_URL=postgresql://postgres:password@localhost:5432/lomash_wood_customer

# Redis
REDIS_URL=redis://localhost:6379/0
REDIS_TTL_SECONDS=3600

# JWT (shared secret with auth-service)
JWT_SECRET=your-jwt-secret
JWT_EXPIRY=15m

# Kafka
KAFKA_BROKERS=localhost:9092
KAFKA_GROUP_ID=customer-service-group
KAFKA_CLIENT_ID=customer-service

# CORS
ALLOWED_ORIGINS=http://localhost:3000,https://lomashwood.co.uk

# Loyalty Tier Thresholds
LOYALTY_SILVER_THRESHOLD=1000
LOYALTY_GOLD_THRESHOLD=5000
LOYALTY_PLATINUM_THRESHOLD=15000

# Rate Limiting
RATE_LIMIT_WINDOW_MS=60000
RATE_LIMIT_MAX_REQUESTS=100
```

Copy `.env.example` and fill in values:

```bash
cp .env.example .env
```

---

## Database

This service owns its own PostgreSQL schema. Migrations are managed by Prisma.

**Key models:** `CustomerProfile`, `CustomerAddress`, `NotificationPreference`, `Wishlist`, `WishlistItem`, `ProductReview`, `SupportTicket`, `SupportTicketMessage`, `LoyaltyAccount`, `LoyaltyTransaction`, `Referral`

### Run migrations

```bash
npx prisma migrate deploy
```

### Reset and seed for development

```bash
npx prisma migrate reset
npx prisma db seed
```

### Open Prisma Studio

```bash
npx prisma studio
```

---

## Running Locally

### Prerequisites

- Node.js 20+
- pnpm
- PostgreSQL 15
- Redis 7
- Kafka (optional for local event testing)

### Install dependencies

```bash
pnpm install
```

### Start in development mode

```bash
pnpm dev
```

### Build for production

```bash
pnpm build
pnpm start
```

---

## Testing

```bash
# Unit tests
pnpm test:unit

# Integration tests
pnpm test:integration

# E2E tests
pnpm test:e2e

# All tests with coverage
pnpm test:coverage
```

Tests use a dedicated test database. Set `TEST_DATABASE_URL` in your environment before running integration or e2e tests.

### Test structure

```
tests/
├── unit/               # Service and repository logic in isolation
├── integration/        # Route-level HTTP tests against real DB
├── e2e/                # Full user journey flows
└── fixtures/           # Shared test data factories
```

---

## Events

### Published

| Topic | Trigger |
|-------|---------|
| `customer.profile.updated` | Profile fields changed |
| `customer.review.created` | New review submitted |
| `customer.support_ticket.created` | New support ticket raised |
| `customer.loyalty_points.earned` | Points credited to account |

### Consumed

| Topic | Action |
|-------|--------|
| `order.payment.succeeded` | Credit loyalty points for purchase |
| `appointment.booking.created` | Log appointment in customer portal |
| `auth.user.created` | Initialise empty customer profile |

---

## Background Jobs

| Job | Schedule | Description |
|-----|----------|-------------|
| `expire-loyalty-points` | Daily 02:00 | Expire points older than configured TTL |
| `sync-customer-data` | Every 6 hours | Reconcile customer data with auth-service |
| `anonymize-inactive-users` | Weekly Sunday 03:00 | GDPR anonymisation for inactive accounts |
| `rebuild-customer-index` | Daily 04:00 | Rebuild search index for admin customer list |

---

## Docker

### Build image

```bash
docker build -f Dockerfile -t lomash-wood/customer-service:latest .
```

### Run with Docker Compose

From the repository root:

```bash
docker compose up customer-service
```

---

## Contributing

Follow the coding standards defined in `docs/onboarding/coding-standards.md`. All PRs require passing CI and at least one reviewer approval per `CODEOWNERS`.