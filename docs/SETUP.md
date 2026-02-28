# Setup Guide — Lomash Wood Admin

This guide walks through getting the admin panel running locally from scratch, including the git submodule, environment configuration, and first login.

---

## Table of Contents

- [Prerequisites](#prerequisites)
- [1. Clone the Repository](#1-clone-the-repository)
- [2. Install Dependencies](#2-install-dependencies)
- [3. Initialise the API Client Submodule](#3-initialise-the-api-client-submodule)
- [4. Configure Environment Variables](#4-configure-environment-variables)
- [5. Run the Development Server](#5-run-the-development-server)
- [6. First Login](#6-first-login)
- [7. Running Tests](#7-running-tests)
- [IDE Setup](#ide-setup)
- [Common Issues](#common-issues)
- [Useful Commands](#useful-commands)

---

## Prerequisites

Ensure the following are installed before proceeding:

| Tool | Minimum version | Install |
|---|---|---|
| Node.js | 20.x LTS | [nodejs.org](https://nodejs.org) |
| pnpm | 9.x | `npm install -g pnpm` |
| Git | 2.40+ | [git-scm.com](https://git-scm.com) |

Verify your setup:

```bash
node -v    # v20.x.x
pnpm -v    # 9.x.x
git --version
```

---

## 1. Clone the Repository

```bash
git clone https://github.com/lomashwood/lomash-wood-admin.git
cd lomash-wood-admin
```

---

## 2. Install Dependencies

```bash
pnpm install
```

This installs all workspace dependencies declared in `package.json` and generates the `pnpm-lock.yaml` lockfile. Do not use `npm install` or `yarn` — the project uses pnpm workspaces.

---

## 3. Initialise the API Client Submodule

The `packages/api-client` directory is a git submodule pointing to the `lomash-wood-api-client` repository. It must be initialised before the dev server will start.

```bash
git submodule update --init --recursive
```

If you cloned with `--recurse-submodules` the above step is already done:

```bash
git clone --recurse-submodules https://github.com/lomashwood/lomash-wood-admin.git
```

**Updating the submodule** to pull the latest API client changes:

```bash
git submodule update --remote packages/api-client
git add packages/api-client
git commit -m "chore: update api-client submodule"
```

---

## 4. Configure Environment Variables

Copy the example environment file:

```bash
cp .env.example .env.local
```

Open `.env.local` and fill in the required values:

```env
# ── Required ────────────────────────────────────────────────────────────────

# Base URL of the Lomash Wood API Gateway (no trailing slash)
NEXT_PUBLIC_API_BASE_URL=https://api-staging.lomashwood.com/v1

# Public URL of this admin app
NEXT_PUBLIC_SITE_URL=http://localhost:3000


# ── Optional — Analytics & Tracking ─────────────────────────────────────────

NEXT_PUBLIC_GTM_ID=GTM-XXXXXXX
NEXT_PUBLIC_GA_MEASUREMENT_ID=G-XXXXXXXXXX
NEXT_PUBLIC_GSC_VERIFICATION=


# ── Optional — Internal notification emails ───────────────────────────────────
# Used when an appointment is booked for both kitchen and bedroom (SRS FR5.6)

NEXT_PUBLIC_KITCHEN_EMAIL=kitchen@lomashwood.com
NEXT_PUBLIC_BEDROOM_EMAIL=bedroom@lomashwood.com
NEXT_PUBLIC_BUSINESS_EMAIL=business@lomashwood.com


# ── Optional — Webhook verification ─────────────────────────────────────────

WEBHOOK_SECRET=


# ── Optional — Per-service URL overrides ─────────────────────────────────────
# Leave blank to use NEXT_PUBLIC_API_BASE_URL for all services.
# Set individually if microservices are deployed to different origins.

NEXT_PUBLIC_AUTH_SERVICE_URL=
NEXT_PUBLIC_PRODUCT_SERVICE_URL=
NEXT_PUBLIC_ORDER_SERVICE_URL=
NEXT_PUBLIC_APPOINTMENT_SERVICE_URL=
NEXT_PUBLIC_CUSTOMER_SERVICE_URL=
NEXT_PUBLIC_CONTENT_SERVICE_URL=
NEXT_PUBLIC_NOTIFICATION_SERVICE_URL=
NEXT_PUBLIC_ANALYTICS_SERVICE_URL=
```

> **Note:** Variables prefixed with `NEXT_PUBLIC_` are embedded into the client bundle at build time. Never put secrets in `NEXT_PUBLIC_` variables.

---

## 5. Run the Development Server

```bash
pnpm dev
```

The admin panel will be available at [http://localhost:3000](http://localhost:3000).

Next.js will watch for file changes and hot-reload automatically. TypeScript errors appear in the terminal and in your IDE.

To run with the production build locally:

```bash
pnpm build
pnpm start
```

---

## 6. First Login

Navigate to [http://localhost:3000/login](http://localhost:3000/login).

Use the credentials provided by the backend team for the staging environment. The backend must be running (or pointed to via `NEXT_PUBLIC_API_BASE_URL`) for login to work.

On successful login the API returns an `lw_access_token` (15-minute HttpOnly cookie) and an `lw_refresh_token` (7-day HttpOnly cookie). The middleware silently refreshes the access token 60 seconds before it expires.

If you are redirected back to `/login` immediately, check:

1. `NEXT_PUBLIC_API_BASE_URL` is reachable from your machine.
2. The backend is returning the `Set-Cookie` headers with `SameSite=Lax` (required for the cookie to be stored on `localhost`).
3. Your browser is not blocking third-party cookies if the API is on a different port.

---

## 7. Running Tests

### Unit and integration tests (Jest)

```bash
pnpm test              # Run all tests once
pnpm test --watch      # Watch mode
pnpm test --coverage   # With coverage report
```

Test files live alongside their source files in `tests/unit/` and `tests/integration/`.

### End-to-end tests (Playwright)

```bash
# Install Playwright browsers on first run
pnpm exec playwright install --with-deps

# Run all E2E tests (headless)
pnpm test:e2e

# Run with Playwright UI (visual, step-by-step)
pnpm test:e2e:ui

# Run a specific spec
pnpm test:e2e tests/e2e/appointments.spec.ts
```

E2E tests require the dev server and backend to be running. The `playwright.config.ts` is configured to start the Next.js dev server automatically if `webServer` is set.

---

## IDE Setup

### VS Code (recommended)

Install the following extensions:

| Extension | Purpose |
|---|---|
| ESLint | Inline lint errors |
| Prettier | Auto-format on save |
| Tailwind CSS IntelliSense | Class autocomplete + docs |
| TypeScript Vue Plugin | Better TSX support |
| Prisma | Schema syntax (if used) |

Recommended workspace settings (`.vscode/settings.json`):

```json
{
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": "explicit"
  },
  "typescript.tsdk": "node_modules/typescript/lib",
  "tailwindCSS.experimental.classRegex": [
    ["cn\\(([^)]*)\\)", "[\"'`]([^\"'`]*).*?[\"'`]"]
  ]
}
```

### Path aliases

The project uses `@/` as the root alias, mapped to `src/` in both `tsconfig.json` and `next.config.js`. All imports should use `@/` rather than relative paths.

```ts
import { formatDate } from "@/utils/formatters";
import { productService } from "@/services/productService";
```

---

## Common Issues

### `Module not found: @/lib/api-client`

The submodule was not initialised. Run:

```bash
git submodule update --init --recursive
pnpm install
```

### Port 3000 already in use

```bash
pnpm dev --port 3001
```

Or kill the process using port 3000:

```bash
lsof -ti tcp:3000 | xargs kill
```

### `cookies()` error in middleware

This occurs when the Next.js version in `node_modules` is mismatched. Run:

```bash
pnpm store prune
pnpm install
```

### Stale TanStack Query cache during development

Open browser DevTools → Application → Local Storage and clear `REACT_QUERY_OFFLINE_CACHE`, or add `?clear_cache=1` to the URL (handled by the query provider in development mode).

### TypeScript errors after pulling submodule changes

```bash
pnpm type-check
```

If the errors are in `packages/api-client`, the submodule may have breaking changes. Check the `CHANGELOG.md` in `packages/api-client` and update type imports in the affected service files.

### Tailwind classes not applying

Ensure the file is included in the `content` array in `tailwind.config.ts`. New component directories must be listed explicitly. After editing the config, restart the dev server.

---

## Useful Commands

```bash
# Dev
pnpm dev                          # Start dev server
pnpm build                        # Production build
pnpm start                        # Start production server
pnpm lint                         # ESLint
pnpm type-check                   # TypeScript check (no emit)
pnpm format                       # Prettier write

# Submodule
git submodule update --init       # Initialise submodule
git submodule update --remote     # Pull latest submodule changes

# pnpm
pnpm why <package>                # Explain why a package is installed
pnpm outdated                     # List outdated dependencies
pnpm up --interactive             # Interactive dependency update

# Next.js
pnpm build && pnpm start          # Test production build locally
ANALYZE=true pnpm build           # Bundle analyser (requires @next/bundle-analyzer)

# Git
git log --oneline packages/api-client   # Submodule commit history
```