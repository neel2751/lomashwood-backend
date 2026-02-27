# Branching Strategy

---

## Overview

The Lomash Wood backend uses a simplified trunk-based development model with two long-lived branches (`main` and `develop`) and short-lived feature, fix, and release branches. All changes enter the codebase through pull requests — no direct pushes to protected branches.

---

## Branch Structure

```
main                    ← Production. Tagged releases only.
  └── develop           ← Integration branch. Staging auto-deploys from here.
        ├── feat/*      ← New features
        ├── fix/*       ← Bug fixes
        ├── refactor/*  ← Code improvements (no behaviour change)
        ├── test/*      ← Test additions or improvements
        ├── docs/*      ← Documentation only
        ├── chore/*     ← Dependency updates, build tooling
        └── hotfix/*    ← Critical production fixes (branch from main)
```

---

## Long-Lived Branches

### `main`

- Represents production-deployed code at all times.
- Protected: no direct pushes. Merges via PR only.
- Requires 2 approvals and all CI checks to pass.
- Every commit on `main` is tagged with a semver version before deployment.

### `develop`

- Integration branch where completed features accumulate before release.
- Protected: no direct pushes. Merges via PR only.
- Requires 1 approval and all CI checks to pass.
- Auto-deploys to staging on every merge.

---

## Short-Lived Branches

Short-lived branches must be merged and deleted within 2 working days of opening. Long-running branches cause merge conflicts and make code review harder.

### Naming Convention

```
<type>/<service-or-scope>/<short-description>

Examples:
  feat/product-service/colour-filter-api
  fix/appointment-service/slot-race-condition
  refactor/auth-service/jwt-middleware-cleanup
  test/order-payment-service/webhook-integration-tests
  docs/api/update-appointment-endpoint-docs
  chore/deps/upgrade-prisma-v6
  hotfix/order-payment-service/stripe-signature-validation
```

Rules:
- Use kebab-case only. No spaces, underscores (except after type prefix), or special characters.
- Maximum 60 characters total.
- The scope should be the service name or shared package (`shared-types`, `event-bus`, `api-gateway`).
- Description should be short but meaningful — a colleague should understand the purpose without opening the PR.

---

## Branch Lifecycle

### Feature Branch

```bash
# 1. Create from develop
git checkout develop && git pull origin develop
git checkout -b feat/product-service/range-filter-api

# 2. Work, commit regularly
git add .
git commit -m "feat(product-service): add range filter parameter to product listing"

# 3. Keep in sync with develop (rebase, not merge)
git fetch origin
git rebase origin/develop

# 4. Push and open PR against develop
git push origin feat/product-service/range-filter-api

# 5. After merge: delete branch
git branch -d feat/product-service/range-filter-api
git push origin --delete feat/product-service/range-filter-api
```

### Hotfix Branch

Hotfixes branch from `main` directly to ship a critical fix without including unreleased changes from `develop`:

```bash
# 1. Branch from main
git checkout main && git pull origin main
git checkout -b hotfix/order-payment-service/stripe-signature-validation

# 2. Fix, test, commit
git commit -m "fix(order-payment-service): correctly parse raw body for Stripe signature"

# 3. PR against main
git push origin hotfix/order-payment-service/stripe-signature-validation

# 4. After merge to main and tag: back-merge into develop
git checkout develop
git merge main
git push origin develop

# 5. Delete hotfix branch
git push origin --delete hotfix/order-payment-service/stripe-signature-validation
```

---

## Pull Request Rules

### Targeting

| Branch Type | Target Branch |
|---|---|
| `feat/*` | `develop` |
| `fix/*` | `develop` |
| `refactor/*` | `develop` |
| `test/*` | `develop` |
| `docs/*` | `develop` |
| `chore/*` | `develop` |
| `hotfix/*` | `main` |
| Release PR | `main` (from `develop`) |

### Required Checks (all PRs)

All of the following must pass before a PR can be merged:

- TypeScript type check (`pnpm type-check`)
- ESLint (`pnpm lint`)
- Prettier check (`pnpm format:check`)
- Unit tests (`pnpm test:unit`)
- Integration tests (`pnpm test:integration`)
- Build (`pnpm build`)
- Security scan (Snyk)

### Review Requirements

| Target | Approvals Required | CODEOWNERS |
|---|---|---|
| `develop` | 1 | Yes — auto-assigned |
| `main` | 2 | Yes — both must approve |

CODEOWNERS are defined in `.github/CODEOWNERS`. The relevant service owner is automatically requested as a reviewer based on the files changed.

### PR Size Guidelines

- Maximum 400 lines changed per PR (excluding generated files, migrations, fixtures).
- If a feature requires more changes, split into multiple sequential PRs.
- Generated Prisma client files, `pnpm-lock.yaml`, and migration SQL files do not count toward the line limit.

---

## Rebasing vs Merging

- **Feature branches onto `develop`:** Use `git rebase` to keep a clean linear history before opening the PR.
- **PRs into `develop` or `main`:** Use squash merge on GitHub. One clean commit per PR on the target branch.
- **Never rebase shared branches** (`develop`, `main`). Only rebase your own private branches.
- After the merge, the squash commit on `develop` represents the entire PR as a single conventional commit.

---

## Stale Branch Policy

- Branches open for more than 5 days without a PR are flagged by the stale-branch bot.
- Branches open for more than 10 days without activity are automatically deleted.
- Delete branches immediately after PR merge — do not reuse branches.

---

## Tags

All production releases are tagged on `main` using semver:

```bash
git tag v1.2.3
git push origin v1.2.3
```

Tags are immutable — never delete or move a production tag. If a release must be yanked, create a new patch version that reverts the changes.

Pre-release tags use the `-rc` suffix:

```bash
git tag v2.0.0-rc.1
```

RC tags deploy to staging only, never to production.