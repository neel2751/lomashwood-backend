# Development Workflow

---

## Overview

The Lomash Wood backend follows a trunk-based development workflow with short-lived feature branches. All code changes go through pull requests with required reviews, automated CI checks, and passing tests before merging. No direct pushes to `main` or `develop` are permitted.

---

## Day-to-Day Workflow

### 1. Sync with upstream

Always start from an up-to-date base branch:

```bash
git checkout develop
git pull origin develop
```

### 2. Create a feature branch

```bash
git checkout -b feat/product-colour-filter
```

Branch names must follow the convention defined in the branching strategy. See `branching-strategy.md` for the full naming spec.

### 3. Make changes with small, atomic commits

Each commit should represent a single logical change. Write commit messages using the Conventional Commits format:

```bash
git add .
git commit -m "feat(product-service): add colour filter to product listing query"
```

Run the pre-commit hooks automatically via Husky (installed on `pnpm install`):

- ESLint with auto-fix
- Prettier formatting
- TypeScript type check
- Commit message lint (commitlint)

### 4. Push and open a Pull Request

```bash
git push origin feat/product-colour-filter
```

Open a PR against `develop` on GitHub. Fill in the PR template (`.github/PULL_REQUEST_TEMPLATE.md`). Assign at least one reviewer from the CODEOWNERS file.

### 5. Address review feedback

Resolve all review comments. Push additional commits to the same branch — do not force-push during active review.

### 6. Merge

Once all CI checks pass and at least one approval is received, squash-merge the PR into `develop`. Delete the feature branch after merge.

---

## Commit Message Format

All commits must follow [Conventional Commits](https://www.conventionalcommits.org/):

```
<type>(<scope>): <description>

[optional body]

[optional footer]
```

### Types

| Type | When to Use |
|---|---|
| `feat` | New feature |
| `fix` | Bug fix |
| `refactor` | Code change that neither adds a feature nor fixes a bug |
| `test` | Adding or updating tests |
| `docs` | Documentation only changes |
| `chore` | Build system, dependency updates, tooling |
| `perf` | Performance improvement |
| `ci` | CI/CD pipeline changes |
| `revert` | Revert a previous commit |

### Scopes

Use the service or package name as the scope:

```
feat(auth-service): add OTP verification flow
fix(product-service): correct colour filter SQL query
test(order-payment-service): add payment webhook integration tests
docs(api): update appointment endpoint documentation
chore(deps): upgrade prisma to 6.x
```

### Breaking Changes

Breaking changes are indicated with a `!` after the type/scope and a `BREAKING CHANGE:` footer:

```
feat(auth-service)!: change JWT payload structure

BREAKING CHANGE: The `userId` field has been renamed to `sub` in the JWT payload.
All services reading JWT claims must be updated.
```

---

## Local Development Loop

### Running a single service

```bash
cd services/product-service
pnpm dev
```

Nodemon watches `src/**/*.ts` and restarts on changes. TypeScript is compiled on the fly via `ts-node`.

### Watching tests alongside development

```bash
# Terminal 1: service
cd services/product-service && pnpm dev

# Terminal 2: tests in watch mode
cd services/product-service && pnpm test:watch
```

### Making a schema change

```bash
# 1. Edit prisma/schema.prisma
# 2. Create and apply migration
cd services/product-service
npx prisma migrate dev --name add_range_field_to_product

# 3. Regenerate Prisma client
npx prisma generate

# 4. Update affected repositories, services, and types
```

Always commit migration files alongside the code that uses them.

### Adding a new dependency

```bash
# Add to a specific service
pnpm --filter auth-service add bcrypt
pnpm --filter auth-service add -D @types/bcrypt

# Add to a shared package
pnpm --filter shared-utils add date-fns

# Add to root (dev tools only)
pnpm add -Dw some-dev-tool
```

---

## Code Quality Gates

Every push triggers the CI pipeline (`ci.yml`). The following checks must pass before merging:

| Check | Tool | Command |
|---|---|---|
| Type checking | TypeScript | `pnpm type-check` |
| Linting | ESLint | `pnpm lint` |
| Formatting | Prettier | `pnpm format:check` |
| Unit tests | Jest | `pnpm test:unit` |
| Integration tests | Jest + Supertest | `pnpm test:integration` |
| Build | tsc | `pnpm build` |
| Security scan | npm audit + Snyk | Automated in CI |

Run all checks locally before pushing:

```bash
pnpm lint
pnpm type-check
pnpm test
pnpm build
```

Or use the convenience script:

```bash
./scripts/lint.sh && ./scripts/test.sh && ./scripts/build.sh
```

---

## Debugging

### VS Code Launch Configurations

The repository includes `.vscode/launch.json` with debug configurations for each service. Select `Debug: auth-service` from the Run panel to attach the debugger.

### Inspecting logs

All services output structured JSON logs. Use `jq` for readable output locally:

```bash
cd services/auth-service
pnpm dev 2>&1 | jq '.'
```

Filter by log level:

```bash
pnpm dev 2>&1 | jq 'select(.level == "error")'
```

### Inspecting Redis

```bash
redis-cli
> KEYS product:*
> GET product:detail:uuid-xxx
> TTL auth:session:uuid-xxx
```

### Inspecting the database

```bash
# Via psql
psql postgresql://lomash:lomash@localhost:5432/lomash_auth

# Via Prisma Studio
cd services/auth-service && npx prisma studio
```

---

## Environment Parity

Local development mirrors production as closely as possible:

- Same Node.js version (enforced by `.nvmrc` and `engines` in `package.json`)
- Same PostgreSQL version (Docker image: `postgres:16-alpine`)
- Same Redis version (Docker image: `redis:7-alpine`)
- Same Prisma migration state
- Same environment variable names (values differ, not names)

Avoid using `process.env.NODE_ENV === 'development'` for business logic branching. Use feature flags or configuration values instead.

---

## Dependency Management

- All dependency updates must be done via PRs, not directly on `develop`.
- Major version upgrades require a dedicated PR with the label `dep-upgrade`.
- Run `pnpm audit` before raising dependency PRs to check for vulnerabilities.
- Lock file (`pnpm-lock.yaml`) must always be committed alongside `package.json` changes.
- Never use `--no-lock` or delete the lock file manually.