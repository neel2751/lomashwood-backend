# Release Process

---

## Overview

Lomash Wood backend releases follow a GitOps model. Merges to the `develop` branch trigger automatic staging deployments. Releases to production are initiated by promoting a staging-validated build via a tagged release on `main`. All deployments are executed by GitHub Actions pipelines defined in `.github/workflows/`.

---

## Environments

| Environment | Branch | URL | Auto-Deploy |
|---|---|---|---|
| Development | Feature branches | Local only | No |
| Staging | `develop` | api-staging.lomashwood.co.uk | Yes — on every merge to `develop` |
| Production | `main` (tagged) | api.lomashwood.co.uk | Yes — on every semver tag push |

---

## Release Flow

```
Feature Branch
      │
      ▼ (PR + review + CI pass)
   develop ──────────────► Staging Deploy (automatic)
      │                         │
      │                    QA validation
      │                         │
      ▼ (PR to main)            │
    main ─────────────────────► Production Deploy (tag-triggered)
      │
      ▼
  Git Tag (v1.2.3)
```

---

## Step 1 — Staging Release

Staging is always in sync with `develop`. Every merged PR to `develop` triggers `deploy-staging.yml`:

1. CI runs all tests and linting.
2. Docker images are built and pushed to ECR with the `develop-{sha}` tag.
3. `prisma migrate deploy` runs against the staging database as a Kubernetes Job.
4. Kubernetes rolling update replaces the current staging pods.
5. Health checks verify all services return `200` from `/health`.
6. Slack notification is sent to `#deployments` channel.

No manual action is required for staging deployments.

---

## Step 2 — QA Validation on Staging

Before promoting to production, validate on staging:

- Run the E2E smoke test suite against staging:

```bash
GATEWAY_URL=https://api-staging.lomashwood.co.uk pnpm test:e2e --testPathPattern=smoke
```

- Manually verify key user flows: product listing, booking creation, brochure form, admin login.
- Check Grafana staging dashboard for error rate and latency regressions.
- Verify Stripe test-mode payment flow end-to-end.

---

## Step 3 — Production Release

### 3a — Create a Release PR

Open a PR from `develop` → `main`. The PR title must follow:

```
release: v1.2.3
```

Include a changelog summary in the PR description covering all changes since the last release. This can be generated from conventional commits:

```bash
npx conventional-changelog-cli -p angular -i CHANGELOG.md -s -r 0
```

Require at least two approvals on the release PR. No force-merges permitted.

### 3b — Merge and Tag

After approval, squash-merge the PR into `main`, then create and push a semver tag:

```bash
git checkout main
git pull origin main
git tag v1.2.3
git push origin v1.2.3
```

### 3c — Production Deploy (Automatic)

The `deploy-production.yml` pipeline triggers on every semver tag (`v*.*.*`):

1. Validates the tag is on `main` (reject tags on other branches).
2. Runs the full test suite against the production build.
3. Builds Docker images tagged with the semver version and `latest`.
4. Pushes images to ECR.
5. Runs `prisma migrate deploy` against the production database as a pre-deploy Kubernetes Job.
6. Executes Kubernetes rolling update with `maxUnavailable: 0, maxSurge: 1`.
7. Waits for all pods to pass readiness probes.
8. Runs smoke tests against production.
9. On success: sends Slack notification to `#deployments`.
10. On failure: triggers automatic rollback (see Rollback section).

---

## Versioning

The project follows [Semantic Versioning](https://semver.org/):

| Change Type | Version Bump | Example |
|---|---|---|
| Backwards-incompatible API change | Major | `1.0.0` → `2.0.0` |
| New backwards-compatible feature | Minor | `1.0.0` → `1.1.0` |
| Bug fix or patch | Patch | `1.0.0` → `1.0.1` |

Breaking changes must be documented in the release PR and communicated to all API consumers before the release tag is pushed.

---

## Database Migration Safety

Migrations are the highest-risk part of any deployment. Follow these rules:

### Zero-Downtime Migration Pattern

Migrations must be backwards-compatible with the previous version of the application code. Follow a three-phase approach for breaking schema changes:

**Phase 1 (Deploy with old code running):** Add new column as nullable with no default.
**Phase 2 (Deploy new code):** Backfill data, make column non-nullable if required.
**Phase 3 (Cleanup):** Remove old column in a subsequent release.

Never add a non-nullable column without a default in a single migration — this causes immediate failure when old pod instances try to insert rows.

### Migration Checklist

Before merging any PR that includes a Prisma migration:

- Migration is named descriptively (`0012_add_range_id_to_products`)
- Migration is backwards-compatible with the currently deployed code
- Migration has been tested against a copy of production data volume (data size check)
- Rollback path is documented (either a reverse migration or manual steps)
- Migration runs in under 30 seconds on production data volume

---

## Rollback

### Automatic Rollback

If the smoke tests fail after deployment, `rollback.yml` is triggered automatically:

```bash
kubectl rollout undo deployment/{service} -n lomash-prod
```

All services are rolled back to the previous deployment simultaneously. The previous Docker image tag is re-deployed without re-running migrations.

### Manual Rollback

If issues are discovered after smoke tests pass:

```bash
# Roll back all services
./scripts/rollback.sh

# Roll back a single service
kubectl rollout undo deployment/product-service -n lomash-prod

# Verify rollback
kubectl rollout status deployment/product-service -n lomash-prod
```

### Database Rollback

Database rollbacks are not automatic. If a migration must be reversed:

1. Write and test a reverse migration script manually.
2. Apply via `prisma migrate resolve` or raw SQL.
3. Document the incident and root cause in `docs/runbooks/`.

---

## Hotfixes

For critical production bugs that cannot wait for the next planned release:

```bash
# Branch from main, not develop
git checkout main
git pull origin main
git checkout -b hotfix/fix-payment-webhook-signature

# Make the fix, commit, and push
git push origin hotfix/fix-payment-webhook-signature
```

Open a PR against `main` (not `develop`). Once merged and tagged, also merge `main` back into `develop` to keep branches in sync:

```bash
git checkout develop
git merge main
git push origin develop
```

---

## Release Checklist

Before pushing the production tag, verify:

- All staging E2E smoke tests pass
- Grafana staging metrics show no elevated error rates
- Release PR has at least 2 approvals
- CHANGELOG.md is updated
- No pending migrations with data destructive operations
- Stripe production API keys are confirmed (not test keys)
- Sentry release is configured for the new version
- On-call engineer is available for 30 minutes post-deploy