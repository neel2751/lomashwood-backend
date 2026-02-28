# Lomash Wood Admin

> Administration console for **Lomash Wood** — kitchen & bedroom design, sales, and consultation services.

Built with **Next.js 14 (App Router)**, **TypeScript**, **Tailwind CSS**, **shadcn/ui**, **TanStack Query v5**, and **Zustand**.

---

## Table of Contents

- [Overview](#overview)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Architecture](#architecture)
- [Feature Modules](#feature-modules)
- [Authentication & Authorisation](#authentication--authorisation)
- [Design System](#design-system)
- [Environment Variables](#environment-variables)
- [Scripts](#scripts)
- [Contributing](#contributing)
- [Deployment](#deployment)

---

## Overview

The Lomash Wood Admin is the internal operations platform for managing every aspect of the Lomash Wood customer-facing website. It connects to a microservice backend via the `lomash-wood-api-client` git submodule and exposes a role-based dashboard for:

- Product catalogue management (kitchens, bedrooms, colours, sizes, inventory, pricing)
- Order, payment, invoice, and refund processing
- Consultation appointment booking and availability management
- Customer accounts, reviews, support tickets, and loyalty programmes
- CMS content — blogs, media wall, dynamic pages, SEO, landing pages
- Notification logs and template management
- Analytics dashboards, funnel tracking, and data exports
- Admin user management, role configuration, and audit logging

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 14 — App Router, Server Components, Route Handlers |
| Language | TypeScript 5 — strict mode |
| Styling | Tailwind CSS 3, shadcn/ui, custom design system |
| State | TanStack Query v5 (server state), Zustand (client state) |
| Forms | React Hook Form + Zod |
| HTTP | Axios with JWT interceptor and silent token refresh |
| Auth | HttpOnly cookie JWT — access + refresh token pair |
| Testing | Jest (unit/integration), Playwright (E2E) |
| Package manager | pnpm |
| CI/CD | GitHub Actions |

---

## Project Structure

```
lomash-wood-admin/
├── packages/api-client/          # Git submodule — lomash-wood-api-client
├── src/
│   ├── app/                      # Next.js App Router
│   │   ├── (auth)/               # Public routes — login, forgot/reset password
│   │   ├── (dashboard)/          # Protected routes — all admin sections
│   │   └── api/                  # BFF API route handlers
│   ├── components/               # React components by domain + shared UI
│   ├── lib/                      # Core infra — axios, react-query, api-client, constants
│   ├── services/                 # Thin domain service wrappers over api-client
│   ├── hooks/                    # React Query data hooks per domain
│   ├── stores/                   # Zustand global stores (auth, UI, search)
│   ├── providers/                # Root provider composition
│   ├── schemas/                  # Zod form validation schemas
│   ├── types/                    # TypeScript type definitions
│   ├── utils/                    # Utility functions — formatters, helpers, permissions
│   ├── config/                   # App config — navigation, permissions, site, API
│   ├── styles/                   # Global CSS + design system tokens
│   └── middleware.ts             # Next.js route protection + security headers
├── tests/
│   ├── unit/
│   ├── integration/
│   └── e2e/
└── docs/
```

---

## Architecture

### Request flow

```
Browser → Next.js Middleware (JWT check + RBAC)
       → App Router Page (React Server Component)
       → BFF API Route (/api/*)   ← optional
       → Axios Instance           ← attaches Bearer token
       → API Gateway              ← routes to microservice
       → Microservice Response    → TanStack Query cache → UI
```

### Data fetching strategy

- **Server Components** — initial page data via direct service calls (no client-side waterfall)
- **TanStack Query** — client-side cache, background refetch, optimistic updates
- **`staleTime: 60s`** — satisfies the SRS NFR1.1 sub-3-second load requirement for repeat visits
- **Suspense + `loading.tsx`** — streaming skeletons during data fetch

### Token lifecycle

```
Login → access_token (15 min, HttpOnly cookie) + refresh_token (7 day, HttpOnly cookie)
     → Middleware checks expiry with 60s buffer
     → If expired: silent POST /auth/refresh → new access_token written to cookie
     → If refresh fails: redirect to /login?returnUrl=<path>
```

---

## Feature Modules

Each section of the admin maps to one backend microservice:

| Admin section | Service | Key entities |
|---|---|---|
| `/analytics` | analytics-service | Overview, tracking events, funnels, dashboards, exports |
| `/products` | product-service | Products, categories, colours, sizes, inventory, pricing |
| `/orders` | order-payment-service | Orders, payments, invoices, refunds |
| `/appointments` | appointment-service | Bookings, availability, consultants, reminders |
| `/customers` | customer-service | Customers, reviews, support tickets, loyalty |
| `/content` | content-service | Blogs, media wall, CMS pages, SEO, landing pages |
| `/notifications` | notification-service | Email/SMS/push logs, templates |
| `/auth` | auth-service | Admin users, roles, sessions |

---

## Authentication & Authorisation

### Roles

| Role | Access level |
|---|---|
| `super_admin` | Full unrestricted access |
| `admin` | All operations + user management |
| `manager` | Products, orders, appointments, content, analytics |
| `consultant` | Appointments and assigned customers only |
| `viewer` | Read-only across all sections |

### Route guarding

- **Middleware** — `src/middleware.ts` runs on every non-static request, validates the JWT, attempts silent refresh, and enforces role-based path restrictions before the request reaches the App Router.
- **Permission helpers** — `src/utils/permission-helpers.ts` provides `hasPermission()`, `canViewProducts()`, etc. for component-level gating.
- **Navigation** — `src/config/navigation.ts` attaches a `permission` key to each nav item; the Sidebar filters the tree based on the current user's role.

---

## Design System

Fonts: **Cormorant Garamond** (display serif, headings) + **DM Sans** (UI sans-serif).

Palette is warm and natural — anchored by deep charcoal (`--brand-wood: #1C1917`) and wood-grain gold (`--brand-grain: #B5935A`) to reflect the kitchen and bedroom design context.

All colour tokens are HSL CSS custom properties consumed by both Tailwind and shadcn/ui. Full dark mode is supported via the `.dark` class.

Component classes are defined in `src/styles/design-system.css` (`@layer components`) so Tailwind utilities always win.

Key classes: `.card-stat`, `.badge-success/warning/destructive`, `.btn-primary/accent/outline`, `.slot-chip`, `.upload-zone`, `.timeline`, `.data-table-wrapper`.

---

## Environment Variables

Copy `.env.example` to `.env.local` and fill in the values.

| Variable | Required | Description |
|---|---|---|
| `NEXT_PUBLIC_API_BASE_URL` | Yes | API Gateway base URL |
| `NEXT_PUBLIC_SITE_URL` | Yes | Admin app public URL |
| `NEXT_PUBLIC_APP_VERSION` | No | Displayed in the sidebar footer |
| `NEXT_PUBLIC_GTM_ID` | No | Google Tag Manager container ID |
| `NEXT_PUBLIC_GA_MEASUREMENT_ID` | No | Google Analytics 4 measurement ID |
| `NEXT_PUBLIC_GSC_VERIFICATION` | No | Google Search Console verification token |
| `NEXT_PUBLIC_KITCHEN_EMAIL` | No | Internal kitchen team notification address |
| `NEXT_PUBLIC_BEDROOM_EMAIL` | No | Internal bedroom team notification address |
| `NEXT_PUBLIC_BUSINESS_EMAIL` | No | Business enquiry notification address |
| `WEBHOOK_SECRET` | No | Secret for verifying incoming webhook payloads |

Per-service URL overrides (for microservice deployments):

```
NEXT_PUBLIC_AUTH_SERVICE_URL
NEXT_PUBLIC_PRODUCT_SERVICE_URL
NEXT_PUBLIC_ORDER_SERVICE_URL
NEXT_PUBLIC_APPOINTMENT_SERVICE_URL
NEXT_PUBLIC_CUSTOMER_SERVICE_URL
NEXT_PUBLIC_CONTENT_SERVICE_URL
NEXT_PUBLIC_NOTIFICATION_SERVICE_URL
NEXT_PUBLIC_ANALYTICS_SERVICE_URL
```

---

## Scripts

```bash
pnpm dev          # Start development server on http://localhost:3000
pnpm build        # Production build
pnpm start        # Start production server
pnpm lint         # ESLint
pnpm type-check   # tsc --noEmit
pnpm test         # Jest unit + integration tests
pnpm test:e2e     # Playwright E2E tests
pnpm test:e2e:ui  # Playwright UI mode
```

---

## Contributing

See [CONTRIBUTING.md](./CONTRIBUTING.md) for branch naming, commit conventions, PR process, and code style guidelines.

---

## Deployment

See [DEPLOYMENT.md](./DEPLOYMENT.md) for staging and production deployment instructions, environment configuration, and CI/CD pipeline overview.