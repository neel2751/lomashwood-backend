# Production Overlay Patches — Lomash Wood Backend

## Overview

This directory contains **strategic merge patches** applied on top of the base Kubernetes manifests for the **production** environment. Each patch file overrides or extends the base configuration to meet production-grade requirements without duplicating the full manifest.

These patches are consumed by [Kustomize](https://kustomize.io/) via `kustomization.yaml` at `infra/kubernetes/overlays/production/kustomization.yaml`.

---

## Directory Structure

```
patches/
├── api-gateway.yaml               # API Gateway production overrides
├── auth-service.yaml              # Auth Service production overrides
├── product-service.yaml           # Product Service production overrides
├── order-payment-service.yaml     # Order & Payment Service production overrides
├── appointment-service.yaml       # Appointment Service production overrides
├── content-service.yaml           # Content Service production overrides
├── customer-service.yaml          # Customer Service production overrides
├── notification-service.yaml      # Notification Service production overrides
├── analytics-service.yaml         # Analytics Service production overrides
└── README.md                      # This file
```

---

## What Each Patch Controls

Each service patch may override one or more of the following base settings:

| Concern | Base Value | Production Value |
|---|---|---|
| `spec.replicas` | 1 | 3 (minimum, with HPA) |
| `resources.requests.cpu` | 100m | 250m – 500m (service-dependent) |
| `resources.limits.cpu` | 500m | 1000m – 2000m |
| `resources.requests.memory` | 128Mi | 256Mi – 512Mi |
| `resources.limits.memory` | 512Mi | 1Gi – 2Gi |
| `image.tag` | `latest` | Pinned semver (e.g. `1.0.0`) |
| `imagePullPolicy` | `IfNotPresent` | `Always` |
| `NODE_ENV` | `development` | `production` |
| `LOG_LEVEL` | `debug` | `info` |
| `CORS_ORIGIN` | `*` | `https://lomashwood.co.uk` |
| HPA `minReplicas` | — | 3 |
| HPA `maxReplicas` | — | 10 – 20 (service-dependent) |
| PodDisruptionBudget | — | `minAvailable: 2` |
| `topologySpreadConstraints` | None | Zone-aware spread |
| `podAntiAffinity` | None | Required (no co-location) |
| `securityContext` | Partial | Fully hardened |
| Init containers | None | Postgres/Redis wait + migration |

---

## `analytics-service.yaml` — Specifics

The analytics service patch includes:

### Deployment Overrides
- **Replicas:** 3 (scaled by HPA up to 10)
- **Image:** `lomashwood/analytics-service:1.0.0` (pinned, `Always` pull)
- **Node affinity:** Scheduled only on `node-role=backend` + `environment=production` nodes
- **Anti-affinity:** Hard rule — no two analytics pods on the same node
- **Topology spread:** One pod per availability zone (max skew 1)
- **Security context:** Non-root (`runAsUser: 1001`), read-only root filesystem, all capabilities dropped

### Init Containers
| Name | Purpose |
|---|---|
| `wait-for-postgres` | Polls `DB_HOST:DB_PORT` until PostgreSQL accepts connections |
| `wait-for-redis` | Polls `REDIS_HOST:REDIS_PORT` until Redis accepts connections |
| `run-migrations` | Executes `prisma migrate deploy` before the main container starts |

### Probes
| Probe | Endpoint | Notes |
|---|---|---|
| Liveness | `GET /health/live` | Fails → pod restarted |
| Readiness | `GET /health/ready` | Fails → pod removed from Service endpoints |
| Startup | `GET /health/startup` | Allows up to 2 min for cold start |

### HorizontalPodAutoscaler
- Min: **3**, Max: **10**
- Scale up on CPU > 65% or memory > 75%
- Scale-down stabilisation window: **5 minutes** (prevents flapping)

### PodDisruptionBudget
- `minAvailable: 2` — at least 2 pods must remain available during voluntary disruptions (node drain, rolling update, etc.)

### ConfigMap
Non-secret runtime configuration injected as environment variables:

| Key | Value | Purpose |
|---|---|---|
| `INGESTION_BATCH_SIZE` | `500` | Events flushed per batch |
| `INGESTION_FLUSH_INTERVAL_MS` | `5000` | Flush frequency |
| `EVENT_RETENTION_DAYS` | `365` | Raw event TTL |
| `CACHE_TTL_DASHBOARD` | `900` | Dashboard cache in seconds |
| `OTEL_TRACES_SAMPLER_ARG` | `0.1` | 10% trace sampling in production |

---

## How Kustomize Applies These Patches

`kustomization.yaml` references each patch as a strategic merge patch:

```yaml
# infra/kubernetes/overlays/production/kustomization.yaml
apiVersion: kustomize.config.k8s.io/v1beta1
kind: Kustomization

namespace: lomash-wood-production

bases:
  - ../../base

patches:
  - path: patches/analytics-service.yaml
  - path: patches/api-gateway.yaml
  - path: patches/auth-service.yaml
  - path: patches/product-service.yaml
  - path: patches/order-payment-service.yaml
  - path: patches/appointment-service.yaml
  - path: patches/content-service.yaml
  - path: patches/customer-service.yaml
  - path: patches/notification-service.yaml

images:
  - name: lomashwood/analytics-service
    newTag: "1.0.0"
```

---

## Applying to Production

```bash
# Preview the fully merged manifests
kubectl kustomize infra/kubernetes/overlays/production

# Apply to the production cluster
kubectl apply -k infra/kubernetes/overlays/production

# Verify rollout
kubectl rollout status deployment/analytics-service -n lomash-wood-production

# Check pod distribution
kubectl get pods -l app=analytics-service -n lomash-wood-production -o wide
```

---

## Secrets Management

Secrets referenced in each patch (e.g. `analytics-service-secret`) are **not stored in this repository**. They are provisioned via one of:

- **AWS Secrets Manager** → synced by [External Secrets Operator](https://external-secrets.io/)
- **Sealed Secrets** (Bitnami) for GitOps workflows
- **Vault** (HashiCorp) with the Vault Agent Injector

Refer to `infra/terraform/modules/secrets/` for the Terraform definitions and `security/policies/encryption-policy.md` for the encryption policy.

---

## CI/CD Integration

Production patches are applied automatically by the GitHub Actions workflow defined at `.github/workflows/deploy-production.yml`. The pipeline:

1. Builds and tags the Docker image
2. Pushes to ECR (`lomashwood/analytics-service:<git-sha>`)
3. Updates the `newTag` in `kustomization.yaml`
4. Runs `kubectl apply -k` against the production cluster
5. Monitors the rollout and triggers `.github/workflows/rollback.yml` on failure

---

## Contacts & Ownership

See `/.github/CODEOWNERS` for ownership assignments.  
Refer to `docs/runbooks/` for incident response procedures.

---

*Lomash Wood Backend — Production Infrastructure*  
*Kitchen & Bedroom Design & Consultation Platform*