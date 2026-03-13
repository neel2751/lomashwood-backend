Internal administration panel for Lomash Wood, a kitchen and bedroom design company. Built with Next.js 14 App Router, TypeScript, Tailwind CSS, and Shadcn UI.

- **Framework**: Next.js 14 (App Router, RSC, Server Actions)
- **Language**: TypeScript (strict)
- **Styling**: Tailwind CSS + Shadcn UI
- **State**: Zustand (global UI), TanStack Query (server state)
- **Forms**: React Hook Form + Zod
- **API**: Axios via `@lomash/api-client` git submodule
- **Testing**: Jest + Testing Library (unit), Playwright (e2e)
- **Package manager**: pnpm

- Node.js ≥ 20
- pnpm ≥ 9
- Access to the `lomash-wood-api-client` submodule repository

```bash

git clone --recurse-submodules https://github.com/your-org/lomash-wood-admin.git
cd lomash-wood-admin


pnpm install

cp .env.example .env.local

pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

| Variable                      | Description                                                        |
| ----------------------------- | ------------------------------------------------------------------ |
| `NEXT_PUBLIC_APP_URL`         | Full URL of this admin app (e.g. `https://admin.lomashwood.co.uk`) |
| `NEXT_PUBLIC_API_GATEWAY_URL` | Base URL of the API Gateway                                        |
| `NEXTAUTH_SECRET`             | Secret for session signing                                         |
| `NEXTAUTH_URL`                | Canonical URL used by NextAuth                                     |

See `.env.example` for the complete list.

| Command              | Description                       |
| -------------------- | --------------------------------- |
| `pnpm dev`           | Start development server          |
| `pnpm build`         | Production build                  |
| `pnpm start`         | Start production server           |
| `pnpm lint`          | Run ESLint                        |
| `pnpm type-check`    | Run TypeScript compiler check     |
| `pnpm test`          | Run unit + integration tests      |
| `pnpm test:coverage` | Run tests with coverage report    |
| `pnpm e2e`           | Run Playwright e2e tests          |
| `pnpm e2e:ui`        | Open Playwright UI mode           |
| `pnpm format`        | Format source files with Prettier |

The API client lives in `packages/api-client` as a git submodule.

```bash
git submodule update --remote --merge

git submodule update --init --recursive
```

```bash
pnpm dlx shadcn-ui@latest add <component-name>
```

Components are installed to `src/components/ui/`.

**Unit & integration tests** (Jest + Testing Library):

```bash
pnpm test
pnpm test:watch
pnpm test:coverage
```

**E2E tests** (Playwright):

```bash
pnpm e2e
pnpm e2e:ui
pnpm e2e:debug
```

E2E tests require a running server. In CI, `pnpm start` is used against a pre-built app. Locally, `pnpm dev` is spun up automatically.

The app outputs a standalone Next.js build (`output: "standalone"` in `next.config.js`) and is deployed as a Docker container on DigitalOcean.

- **Staging**: pushed automatically on merge to `develop` via `.github/workflows/deploy-staging.yml`
- **Production**: pushed on `main` or triggered manually via `.github/workflows/deploy-production.yml`

### Local database with Docker

Use the included Postgres compose file:

```bash
docker compose -f docker-compose.db.yml up -d
```

Then keep `DATABASE_URL` set to:

```bash
postgresql://postgres:postgres@localhost:5432/postgres
```

See [docs/CONTRIBUTING.md](docs/CONTRIBUTING.md) for branching strategy, commit conventions, and PR guidelines.
