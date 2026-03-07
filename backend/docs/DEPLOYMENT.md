# Deployment Guide

## Overview

Deployment options for Lomashwood backend services.

## Docker Deployment

### Development

```bash
# Start development environment
docker-compose -f docker-compose.yml up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

### Staging

```bash
# Build and deploy to staging
docker-compose -f docker-compose.staging.yml up -d

# Update specific service
docker-compose -f docker-compose.staging.yml up -d --build auth-service
```

### Production

```bash
# Deploy to production
docker-compose -f docker-compose.production.yml up -d

# Scale services
docker-compose -f docker-compose.production.yml up -d --scale api-gateway=3
```

## Kubernetes Deployment

### Prerequisites

- kubectl configured
- Docker registry access
- AWS CLI (for EKS)

### Deploy to EKS

```bash
# Apply infrastructure
cd infra/terraform
terraform apply

# Configure kubectl
aws eks update-kubeconfig --region us-east-1 --name lomashwood-cluster

# Deploy services
kubectl apply -f ../k8s/

# Check deployment status
kubectl get pods -n default
kubectl get services
```

### Service Management

```bash
# Scale deployment
kubectl scale deployment api-gateway --replicas=5

# Update deployment
kubectl set image deployment/api-gateway api-gateway=lomashwood/api-gateway:v2.0.0

# Rollback deployment
kubectl rollout undo deployment/api-gateway

# View logs
kubectl logs -f deployment/api-gateway
```

## CI/CD Pipeline

### GitHub Actions

```yaml
name: Deploy to Production

on:
  push:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
      - name: Install dependencies
        run: npm ci
      - name: Run tests
        run: npm test

  build:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Build Docker images
        run: |
          docker build -t lomashwood/api-gateway:${{ github.sha }} ./services/api-gateway
          docker build -t lomashwood/auth-service:${{ github.sha }} ./services/auth-service
      - name: Push to registry
        run: |
          docker push lomashwood/api-gateway:${{ github.sha }}
          docker push lomashwood/auth-service:${{ github.sha }}

  deploy:
    needs: build
    runs-on: ubuntu-latest
    steps:
      - name: Deploy to Kubernetes
        run: |
          kubectl set image deployment/api-gateway api-gateway=lomashwood/api-gateway:${{ github.sha }}
          kubectl set image deployment/auth-service auth-service=lomashwood/auth-service:${{ github.sha }}
```

## Environment Configuration

### Production Environment Variables

```env
NODE_ENV=production
DB_HOST=postgres-service
REDIS_URL=redis://redis-service:6379
JWT_SECRET=production-jwt-secret
AWS_ACCESS_KEY_ID=production-aws-key
AWS_SECRET_ACCESS_KEY=production-aws-secret
```

### Secrets Management

```bash
# Create Kubernetes secrets
kubectl create secret generic db-credentials \
  --from-literal=username=postgres \
  --from-literal=password=secure-password

kubectl create secret generic jwt-secret \
  --from-literal=secret=your-jwt-secret

# Apply secrets to deployments
kubectl apply -f k8s/secrets/
```

## Monitoring

### Health Checks

All services expose `/health` endpoint:

```bash
# Check service health
curl http://localhost:3000/health

# Kubernetes health check
kubectl get pods
kubectl describe pod <pod-name>
```

### Logging

```bash
# View all service logs
kubectl logs -f --all-containers=true

# View specific service logs
kubectl logs -f deployment/api-gateway

# Export logs
kubectl logs deployment/api-gateway > api-gateway.log
```

### Metrics

- Application metrics via Prometheus
- Infrastructure metrics via CloudWatch
- Custom dashboards in Grafana

## Database Management

### Migrations

```bash
# Run migrations in production
npm run migration:run -- --config production

# Create backup
pg_dump -h postgres-host -U postgres lomashwood_production > backup.sql

# Restore backup
psql -h postgres-host -U postgres lomashwood_production < backup.sql
```

### Scaling

```bash
# Read replicas
kubectl apply -f k8s/postgres-replica.yaml

# Connection pooling
kubectl apply -f k8s/pgbouncer.yaml
```

## Security

### SSL/TLS

```bash
# Enable SSL on load balancer
kubectl annotate service api-gateway-service \
  service.beta.kubernetes.io/aws-load-balancer-ssl-cert=arn:aws:acm:us-east-1:123456789012:certificate/12345678-1234-1234-1234-123456789012
```

### Network Policies

```yaml
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: api-gateway-network-policy
spec:
  podSelector:
    matchLabels:
      app: api-gateway
  policyTypes:
  - Ingress
  - Egress
  ingress:
  - from:
    - podSelector:
        matchLabels:
          app: nginx-ingress
```

## Rollback Procedures

### Quick Rollback

```bash
# Kubernetes rollback
kubectl rollout undo deployment/api-gateway

# Docker rollback
docker-compose -f docker-compose.production.yml up -d --scale api-gateway=0
docker-compose -f docker-compose.production.yml up -d --scale api-gateway=3
```

### Database Rollback

```bash
# Revert last migration
npm run migration:revert -- --config production

# Restore from backup
psql -h postgres-host -U postgres lomashwood_production < backup-$(date +%Y%m%d).sql
```

## Troubleshooting

### Common Issues

1. **Service not starting**: Check logs and environment variables
2. **Database connection**: Verify credentials and network connectivity
3. **High memory usage**: Check resource limits and scale horizontally
4. **Slow response times**: Check database queries and add indexes

### Debug Commands

```bash
# Check pod status
kubectl get pods -o wide

# Describe pod
kubectl describe pod <pod-name>

# Exec into pod
kubectl exec -it <pod-name> -- bash

# Port forward
kubectl port-forward service/api-gateway-service 3000:3000
```

## Performance Optimization

### Horizontal Scaling

```yaml
# HPA configuration
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: api-gateway-hpa
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: api-gateway
  minReplicas: 2
  maxReplicas: 10
  metrics:
  - type: Resource
    resource:
      name: cpu
      target:
        type: Utilization
        averageUtilization: 70
```

### Resource Limits

```yaml
resources:
  requests:
    memory: "256Mi"
    cpu: "250m"
  limits:
    memory: "512Mi"
    cpu: "500m"
```
