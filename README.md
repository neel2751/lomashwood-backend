# Lomash Wood — Admin Panel

Internal administration panel for Lomash Wood, a kitchen and bedroom design company. Built with Next.js 14 App Router, TypeScript, Tailwind CSS, and Shadcn UI.

## Tech Stack

- **Framework**: Next.js 14 (App Router, RSC, Server Actions)
- **Language**: TypeScript (strict)
- **Styling**: Tailwind CSS + Shadcn UI
- **State**: Zustand (global UI), TanStack Query (server state)
- **Forms**: React Hook Form + Zod
- **API**: Axios via `@lomash/api-client` git submodule
- **Testing**: Jest + Testing Library (unit), Playwright (e2e)
- **Package manager**: pnpm

## Prerequisites

- Node.js ≥ 20
- pnpm ≥ 9
- Access to the `lomash-wood-api-client` submodule repository

## Getting Started

```bash
# 1. Clone with submodules
git clone --recurse-submodules https://github.com/your-org/lomash-wood-admin.git
cd lomash-wood-admin

# 2. Install dependencies
pnpm install

# 3. Copy env file and fill in values
cp .env.example .env.local

# 4. Run the development server
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Environment Variables

| Variable | Description |
|---|---|
| `NEXT_PUBLIC_APP_URL` | Full URL of this admin app (e.g. `https://admin.lomashwood.co.uk`) |
| `NEXT_PUBLIC_API_GATEWAY_URL` | Base URL of the API Gateway |
| `NEXTAUTH_SECRET` | Secret for session signing |
| `NEXTAUTH_URL` | Canonical URL used by NextAuth |

See `.env.example` for the complete list.

## Project Structure

```
src/
├── app/                  # Next.js App Router (pages & API routes)
│   ├── (auth)/           # Public auth routes (login, forgot-password)
│   └── (dashboard)/      # Protected admin routes
├── components/           # UI components grouped by domain
├── hooks/                # React Query data-fetching hooks
├── services/             # Thin API client wrappers
├── schemas/              # Zod validation schemas
├── stores/               # Zustand global stores
├── types/                # TypeScript type definitions
├── utils/                # Formatting, helpers, table utilities
└── config/               # Site config, navigation tree, permissions map
packages/
└── api-client/           # Git submodule — generated API client
```

## Available Scripts

| Command | Description |
|---|---|
| `pnpm dev` | Start development server |
| `pnpm build` | Production build |
| `pnpm start` | Start production server |
| `pnpm lint` | Run ESLint |
| `pnpm type-check` | Run TypeScript compiler check |
| `pnpm test` | Run unit + integration tests |
| `pnpm test:coverage` | Run tests with coverage report |
| `pnpm e2e` | Run Playwright e2e tests |
| `pnpm e2e:ui` | Open Playwright UI mode |
| `pnpm format` | Format source files with Prettier |

## Git Submodule

The API client lives in `packages/api-client` as a git submodule.

```bash
# Pull latest submodule changes
git submodule update --remote --merge

# After cloning if submodule is empty
git submodule update --init --recursive
```

## Adding Shadcn Components

```bash
pnpm dlx shadcn-ui@latest add <component-name>
```

Components are installed to `src/components/ui/`.

## Testing

**Unit & integration tests** (Jest + Testing Library):

```bash
pnpm test               # run once
pnpm test:watch         # watch mode
pnpm test:coverage      # with coverage
```

**E2E tests** (Playwright):

```bash
pnpm e2e                # headless
pnpm e2e:ui             # interactive UI mode
pnpm e2e:debug          # step-through debugger
```

E2E tests require a running server. In CI, `pnpm start` is used against a pre-built app. Locally, `pnpm dev` is spun up automatically.

## Deployment

The app outputs a standalone Next.js build (`output: "standalone"` in `next.config.js`), suitable for Docker or any Node.js host.

- **Staging**: pushed automatically on merge to `develop` via `.github/workflows/deploy-staging.yml`
- **Production**: triggered manually or on release tag via `.github/workflows/deploy-production.yml`

## Contributing

See [docs/CONTRIBUTING.md](docs/CONTRIBUTING.md) for branching strategy, commit conventions, and PR guidelines.