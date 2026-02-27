# Deployment Rollback Runbook — Lomash Wood Backend

## Overview

This runbook covers rollback procedures for all Lomash Wood microservices deployed on Kubernetes. Rollbacks are triggered when a deployment introduces regressions, elevated error rates, latency spikes, or critical failures.

**Rollback decision threshold:** If any of the following persist for > 5 minutes after a deployment:
- Error rate increases > 1% above baseline
- P95 latency increases > 50% above baseline
- Any service health check failing
- Any P0 or P1 alert firing

---

## Pre-Rollback — Capture Deployment State

Before rolling back, capture diagnostic information:

```bash
kubectl rollout history deployment/<service-name> -n lomash-wood
kubectl describe deployment/<service-name> -n lomash-wood | grep Image
kubectl get events -n lomash-wood --sort-by='.lastTimestamp' | tail -30
kubectl logs -n lomash-wood deployment/<service-name> --tail=200
```

Save the current (broken) image tag for the post-mortem report.

---

## Kubernetes Rollback — All Services

### Rollback a Single Service

```bash
kubectl rollout undo deployment/<service-name> -n lomash-wood
kubectl rollout status deployment/<service-name> -n lomash-wood
```

Available service names:
- `api-gateway`
- `auth-service`
- `product-service`
- `order-payment-service`
- `appointment-service`
- `content-service`
- `customer-service`
- `notification-service`
- `analytics-service`

Verify rollback succeeded:

```bash
kubectl rollout history deployment/<service-name> -n lomash-wood
kubectl get pods -n lomash-wood -l app=<service-name>
curl -sf https://api.lomashwood.com/<service-health-path> | jq .
```

### Rollback to a Specific Revision

List available revisions:

```bash
kubectl rollout history deployment/<service-name> -n lomash-wood
```

Roll back to a specific revision:

```bash
kubectl rollout undo deployment/<service-name> --to-revision=<revision-number> -n lomash-wood
```

### Rollback All Services Simultaneously

Use the following script for a full system rollback:

```bash
#!/bin/bash
set -e

SERVICES=(
  api-gateway
  auth-service
  product-service
  order-payment-service
  appointment-service
  content-service
  customer-service
  notification-service
  analytics-service
)

for svc in "${SERVICES[@]}"; do
  echo "Rolling back $svc..."
  kubectl rollout undo deployment/$svc -n lomash-wood
done

echo "Waiting for rollbacks to complete..."

for svc in "${SERVICES[@]}"; do
  kubectl rollout status deployment/$svc -n lomash-wood
  echo "$svc rolled back successfully."
done

echo "All services rolled back."
```

Save this as `scripts/rollback.sh` and execute:

```bash
chmod +x scripts/rollback.sh
./scripts/rollback.sh
```

---

## Database Migration Rollback

### Check Current Migration State

```bash
kubectl exec -it <service-pod> -n lomash-wood -- npx prisma migrate status
```

### Roll Back the Last Migration

Prisma does not support automatic migration rollback. Each migration must be manually reversed.

**Step 1 — Identify the migration to roll back:**

```bash
kubectl exec -it <service-pod> -n lomash-wood -- npx prisma migrate status | grep "applied"
```

**Step 2 — Execute the rollback SQL:**

Every migration should have a corresponding rollback in `prisma/migrations/<migration-name>/README.md`. Run the rollback SQL directly:

```bash
kubectl exec -it postgres-primary-0 -n lomash-wood -- psql -U lomash_admin -d <database> -f /tmp/rollback.sql
```

**Step 3 — Mark the migration as rolled back in Prisma:**

```bash
kubectl exec -it <service-pod> -n lomash-wood -- npx prisma migrate resolve \
  --rolled-back <migration-name>
```

**Step 4 — Verify schema state:**

```bash
kubectl exec -it <service-pod> -n lomash-wood -- npx prisma migrate status
```

---

## Rollback via GitHub Actions

Trigger a rollback from the GitHub Actions workflow:

1. Navigate to the repository on GitHub.
2. Click **Actions** → **Rollback** workflow (`.github/workflows/rollback.yml`).
3. Click **Run workflow**.
4. Select the environment (`production` or `staging`).
5. Enter the target image tag or leave blank for the previous revision.
6. Click **Run workflow**.

Monitor the workflow run for completion.

---

## Helm Chart Rollback

If services are deployed via Helm:

**List Helm releases:**

```bash
helm list -n lomash-wood
```

**View release history:**

```bash
helm history <release-name> -n lomash-wood
```

**Roll back to the previous release:**

```bash
helm rollback <release-name> -n lomash-wood
```

**Roll back to a specific revision:**

```bash
helm rollback <release-name> <revision-number> -n lomash-wood
```

Example for api-gateway:

```bash
helm rollback api-gateway 5 -n lomash-wood
kubectl rollout status deployment/api-gateway -n lomash-wood
```

---

## Kustomize Overlay Rollback (Staging / Dev)

For staging and dev environments using Kustomize:

```bash
kubectl apply -k infra/kubernetes/overlays/staging/
kubectl rollout status deployment/api-gateway -n lomash-wood
```

If the overlay itself is the problem, restore the previous overlays from git:

```bash
git log --oneline infra/kubernetes/overlays/production/ | head -10
git checkout <previous-commit-hash> -- infra/kubernetes/overlays/production/
kubectl apply -k infra/kubernetes/overlays/production/
```

---

## Configuration / Secret Rollback

If a configuration or secret change caused the incident:

**Restore a Kubernetes ConfigMap to a previous version:**

```bash
kubectl get configmap lomash-wood-config -n lomash-wood -o yaml > /tmp/current-config-backup.yaml
kubectl apply -f /tmp/previous-config.yaml
```

**Restore a secret from AWS Secrets Manager:**

```bash
aws secretsmanager get-secret-value \
  --secret-id lomash-wood/production/<secret-name> \
  --version-stage AWSPREVIOUS \
  --query SecretString --output text | \
  kubectl create secret generic lomash-wood-secrets \
  --from-literal=<key>=<value> \
  -n lomash-wood \
  --dry-run=client -o yaml | kubectl apply -f -
```

Restart all services after a secret change:

```bash
kubectl rollout restart deployment -n lomash-wood
```

---

## Service-Specific Rollback Notes

### auth-service

Rollback of auth-service does not require a JWT secret change unless the secret was rotated in the deployment. If the secret was changed, all active sessions will be invalidated. Follow `auth-failure.md`.

### order-payment-service

Check for in-flight Stripe webhooks after rollback. Replay any webhooks received during the failed deployment period from the Stripe dashboard.

### product-service

Verify Redis product cache is consistent after rollback:

```bash
kubectl exec -it redis-master-0 -n lomash-wood -- redis-cli FLUSHDB
```

The cache will rebuild on next request.

### analytics-service

Analytics events during the failed deployment may be lost. This is acceptable. Do not attempt to replay analytics events.

---

## Post-Rollback Verification Checklist

Run through all critical user flows after rollback:

```bash
bash scripts/smoke-test.sh production
```

Manual checks:

- [ ] `GET /health` returns 200 for all services
- [ ] `POST /v1/auth/login` succeeds with valid credentials
- [ ] `GET /v1/products` returns a product list
- [ ] `POST /v1/appointments` can create a test booking (delete afterwards)
- [ ] `GET /v1/auth/me` returns user data for a valid session
- [ ] Stripe webhook endpoint responds correctly to a test event
- [ ] Grafana error rate dashboard returns to pre-deployment baseline
- [ ] Grafana latency dashboard returns to pre-deployment baseline
- [ ] Sentry shows no new error spikes

---

## Communication During Rollback

**Slack #incidents — start of rollback:**

> **ROLLBACK INITIATED** — [environment]
> Service(s): [list]
> Reason: [brief description of failure]
> Started by: [your name]
> ETA: ~10 minutes

**Slack #incidents — rollback complete:**

> **ROLLBACK COMPLETE** — [environment]
> All services returned to previous version.
> Verification: [pass/fail details]
> Status: Monitoring for 15 minutes before marking resolved.

---

## Post-Incident Actions

- [ ] Rollback verified stable for at least 15 minutes
- [ ] Broken deployment image tagged `DO-NOT-USE` in ECR
- [ ] GitHub Actions deployment pipeline paused for the affected service
- [ ] Root cause analysis started
- [ ] Jira ticket created to fix the issue before re-deployment
- [ ] Post-mortem document created within 48 hours
- [ ] Deployment checklist reviewed and updated if a step was missed
- [ ] Automated test coverage reviewed if regression was not caught in CI

Reference: `docs/onboarding/release-process.md` for the standard deployment and rollback process.