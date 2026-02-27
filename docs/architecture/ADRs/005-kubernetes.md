# ADR 005: Kubernetes for Container Orchestration

## Status

Accepted

## Date

2026-02-01

## Context

The Lomash Wood platform consists of nine independently deployable services (api-gateway + 8 microservices), each packaged as a Docker container. These services have significantly different scaling profiles:

- product-service and api-gateway handle high request volumes from product filter pages with infinite scroll
- analytics-service ingests continuous event streams
- content-service and auth-service have relatively stable, low traffic
- notification-service has burst traffic correlated with booking and order events

A container orchestration platform is required to manage deployment, scaling, health checking, service discovery, rolling updates, and rollbacks across all services in a consistent and automated manner.

## Decision

We adopt **Kubernetes (K8s)** as the container orchestration platform for all services. In production, this is deployed as **Amazon EKS** (Elastic Kubernetes Service) provisioned via Terraform (`infra/terraform/modules/ecs/` and EKS configuration). Local development uses `docker-compose` for simplicity.

The Kubernetes configuration is managed via **Kustomize** for environment-specific overlays (`infra/kubernetes/overlays/dev|staging|production`) and **Helm** for service packaging (`infra/kubernetes/helm-charts/`).

## Resource Configuration

Each service defines the following Kubernetes resources:

### Deployment

```yaml
resources:
  requests:
    cpu: 100m
    memory: 256Mi
  limits:
    cpu: 500m
    memory: 512Mi
```

### Horizontal Pod Autoscaler (HPA)

| Service | Min Replicas | Max Replicas | Scale Trigger |
|---|---|---|---|
| api-gateway | 2 | 10 | CPU > 60% |
| auth-service | 2 | 6 | CPU > 70% |
| product-service | 2 | 8 | CPU > 60% |
| order-payment-service | 2 | 6 | CPU > 70% |
| appointment-service | 1 | 4 | CPU > 70% |
| content-service | 1 | 4 | CPU > 70% |
| customer-service | 1 | 4 | CPU > 70% |
| notification-service | 2 | 8 | CPU > 60% |
| analytics-service | 2 | 8 | CPU > 60% |

### Health Checks

All services expose `/health` returning `{ status: "ok" }`. Kubernetes liveness and readiness probes are configured against this endpoint:

```yaml
livenessProbe:
  httpGet:
    path: /health
    port: 3000
  initialDelaySeconds: 30
  periodSeconds: 10
  failureThreshold: 3

readinessProbe:
  httpGet:
    path: /health
    port: 3000
  initialDelaySeconds: 10
  periodSeconds: 5
  failureThreshold: 2
```

## Deployment Strategy

**Rolling updates** are used for all services with a `maxUnavailable: 0` and `maxSurge: 1` configuration to ensure zero-downtime deployments. Database migrations run as a Kubernetes Job before the new deployment rolls out.

Rollbacks are performed via the `scripts/rollback.sh` script which executes `kubectl rollout undo deployment/{service}`.

## Namespace Strategy

| Namespace | Purpose |
|---|---|
| `lomash-prod` | Production services |
| `lomash-staging` | Staging services |
| `lomash-dev` | Development services |
| `lomash-monitoring` | Prometheus, Grafana, Loki, Tempo |

## Service Discovery

Internal services communicate via Kubernetes DNS:

```
http://auth-service.lomash-prod.svc.cluster.local:3001
http://product-service.lomash-prod.svc.cluster.local:3002
```

The api-gateway routes external requests to internal services using these DNS names configured in `api-gateway/src/config/services.ts`.

## Secrets Management

All secrets are stored in AWS Secrets Manager and injected into pods via the AWS Secrets and Configuration Provider (ASCP) as Kubernetes Secrets. Secrets are never stored in environment variable files committed to source control. The `.env.example` files in each service document required environment variables without values.

## Consequences

### Positive

- Independent horizontal scaling per service based on actual load.
- Zero-downtime rolling deployments with automatic rollback on failed health checks.
- Kubernetes DNS provides automatic service discovery without a separate service registry.
- HPA ensures cost efficiency: services scale down during off-peak hours.
- Kustomize overlays allow environment-specific configuration without duplicating manifests.
- EKS handles control plane management, reducing operational overhead.

### Negative

- Kubernetes adds significant complexity compared to running services on EC2 directly.
- Local development requires `docker-compose` as a simpler alternative (Kubernetes is not used locally).
- Engineers require Kubernetes knowledge to debug pod failures, inspect logs, and manage resources.
- EKS cluster cost is non-trivial; mitigated by using Fargate for non-critical services.

## Alternatives Considered

### AWS ECS (Elastic Container Service)

Evaluated. ECS is simpler to operate and has native AWS integration. Rejected because Kubernetes has a richer ecosystem (Helm, Kustomize, custom operators, Prometheus integration) and provides stronger portability if the platform migrates away from AWS.

### AWS App Runner

Rejected. App Runner does not provide the granular control over scaling, networking, and resource limits required for this platform. It does not support stateful workloads like the Redis Streams event bus consumers.

### Docker Compose (Production)

Rejected for production. Docker Compose does not provide automated health-based restarts, HPA, or rolling deployments. Retained for local development.

## Related ADRs

- ADR 001: Microservices (nine services to orchestrate)
- ADR 008: Observability (Prometheus ServiceMonitors deployed via Kubernetes)