# Staging Overlay

Kustomize overlay for the **staging** environment (`lomash-wood-staging` namespace).

## Purpose

Staging is a production-mirror environment used for:
- Pre-production integration testing and QA sign-off
- Load testing and performance profiling
- Smoke testing CI/CD pipeline changes before production promotion
- Stakeholder UAT (User Acceptance Testing)
- Stripe test-mode payment flow validation

## What this overlay does

- Targets the `lomash-wood-staging` namespace with `staging-` name prefix
- Sets `replicas: 2` on all deployments — mirrors production HA posture at reduced scale
- Applies production-equivalent resource requests/limits at ~75% of production values
- Sets `LOG_LEVEL=info` and `LOG_FORMAT=json` (structured, no debug noise)
- Enables full security posture: `SESSION_COOKIE_SECURE=true`, `BCRYPT_SALT_ROUNDS=12`
- Points all service discovery to `lomash-wood-staging` internal DNS
- Enables CORS for `https://staging.lomashwood.co.uk` and `https://staging-admin.lomashwood.co.uk`
- Uses a dedicated staging S3 bucket (`lomash-wood-media-staging`) and CDN origin (`staging-cdn.lomashwood.co.uk`)
- Uses staging notification addresses (`noreply-staging@lomashwood.co.uk`, team emails with `-staging` suffix)
- Enables real notification providers (SES, Twilio, Firebase) against staging credentials
- Enables review moderation on customer-service
- Enables HPAs with base replica counts to validate autoscaling behaviour pre-production
- Includes full Prometheus rules and Alertmanager config for staging observability
- Reduces analytics retention windows relative to production (90 day events, 30 day raw events)
- Disables user anonymization to preserve test data during active QA cycles
- All images tagged `:staging`

## Differences from Production

| Concern | Staging | Production |
|---|---|---|
| Replicas | 2 (base) | 2 (base, scales higher) |
| Resources | ~75% of prod limits | Full prod limits |
| Log level | info | info |
| Stripe | Test mode keys | Live keys |
| S3 bucket | `lomash-wood-media-staging` | `lomash-wood-media` |
| CDN | `staging-cdn.lomashwood.co.uk` | `cdn.lomashwood.co.uk` |
| CORS origins | `staging.lomashwood.co.uk` | `lomashwood.co.uk` |
| User anonymization | Disabled (preserve test data) | Enabled |
| Analytics retention | 90 days events / 30 days raw | 365 days events / 90 days raw |

## Apply

```bash
kubectl apply -k infra/kubernetes/overlays/staging
```

## Validate (dry-run)

```bash
kubectl kustomize infra/kubernetes/overlays/staging
```

## Diff against current cluster state

```bash
kubectl diff -k infra/kubernetes/overlays/staging
```

## Prerequisites

- Kubernetes cluster accessible via `kubectl`
- Kustomize v5+
- Staging secrets pre-populated in the `lomash-wood-staging` namespace
- Image tags `lomashwood/*:staging` available in the registry
- Staging Stripe webhook endpoint registered at `https://staging-api.lomashwood.co.uk/v1/webhooks/stripe`