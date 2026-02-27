# Dev Overlay

Kustomize overlay for the **development** environment (`lomash-wood-dev` namespace).

## What this overlay does

- Targets the `lomash-wood-dev` namespace with `dev-` name prefix on all resources
- Sets `replicas: 1` on every deployment to conserve cluster resources
- Reduces CPU/memory requests and limits to dev-appropriate sizes
- Sets `LOG_LEVEL=debug` and `LOG_FORMAT=pretty` on all services
- Disables `SESSION_COOKIE_SECURE` on auth-service for HTTP localhost development
- Reduces `BCRYPT_SALT_ROUNDS` to `10` for faster test runs
- Sets short cache TTLs on product-service (60s) to reflect data changes immediately
- Points CDN_BASE_URL to local MinIO (`http://localhost:9000`) on content-service
- Switches notification-service providers to `nodemailer` (email) and `mock` (SMS/push)
- Disables review moderation and user anonymization on customer-service
- Relaxes background job intervals across appointment, content, and analytics services
- Reduces event/data retention windows on analytics-service for faster dev DB cycles
- All images tagged `:dev`
- HPAs and alerting rules are excluded (not appropriate for dev)

## Apply

```bash
kubectl apply -k infra/kubernetes/overlays/dev
```

## Validate (dry-run)

```bash
kubectl kustomize infra/kubernetes/overlays/dev
```

## Prerequisites

- Kubernetes cluster accessible via `kubectl`
- Kustomize v5+
- Secrets pre-populated in the `lomash-wood-dev` namespace
- Local Docker registry or image pull access to `lomashwood/*:dev` tags