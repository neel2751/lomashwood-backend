# Kubernetes Deployment for Lomash Wood Backend

This directory contains Kubernetes manifests for deploying the Lomash Wood backend microservices.

## 🚀 Quick Start

### Prerequisites

- Kubernetes cluster (v1.20+)
- kubectl configured
- Helm installed (optional)
- Ingress controller (nginx)
- Cert-manager (for SSL certificates)

### Deployment Steps

1. **Create namespace:**
   ```bash
   kubectl apply -f namespace.yaml
   ```

2. **Create secrets:**
   ```bash
   # Update secrets.yaml with your actual secrets
   kubectl apply -f secrets.yaml
   ```

3. **Create configmap:**
   ```bash
   kubectl apply -f configmap.yaml
   ```

4. **Deploy database and Redis:**
   ```bash
   kubectl apply -f postgres.yaml
   kubectl apply -f redis.yaml
   ```

5. **Deploy services:**
   ```bash
   kubectl apply -f api-gateway.yaml
   kubectl apply -f services.yaml
   ```

6. **Deploy ingress:**
   ```bash
   kubectl apply -f ingress.yaml
   ```

7. **Deploy monitoring (optional):**
   ```bash
   kubectl apply -f monitoring.yaml
   kubectl apply -f hpa.yaml
   ```

## 📋 Files Overview

| File | Description |
|------|-------------|
| `namespace.yaml` | Kubernetes namespace |
| `configmap.yaml` | Configuration variables |
| `secrets.yaml` | Sensitive data (passwords, keys) |
| `postgres.yaml` | PostgreSQL database |
| `redis.yaml` | Redis cache |
| `api-gateway.yaml` | API Gateway deployment |
| `services.yaml` | All microservices |
| `ingress.yaml` | Load balancer and routing |
| `hpa.yaml` | Horizontal Pod Autoscalers |
| `monitoring.yaml` | Prometheus monitoring |

## 🔧 Configuration

### Environment Variables

Update `configmap.yaml` with your environment-specific values:

- `NODE_ENV`: Set to `production`
- `CORS_ORIGIN`: Your frontend domain
- Database and Redis hosts
- Service ports

### Secrets

Update `secrets.yaml` with base64-encoded secrets:

```bash
# Example: encode database URL
echo -n "postgresql://user:pass@host:5432/db" | base64
```

Required secrets:
- Database connection strings
- JWT secrets
- API keys (Stripe, Razorpay, AWS, etc.)
- Email credentials
- Twilio credentials

## 📊 Monitoring

### Health Checks

All services include:
- Liveness probes (`/health`)
- Readiness probes (`/health`)
- Resource limits and requests

### Metrics

Services expose metrics at `/metrics` for Prometheus:
- HTTP request metrics
- Response times
- Error rates
- Resource usage

### Autoscaling

Horizontal Pod Autoscalers automatically scale based on:
- CPU utilization (70% target)
- Memory utilization (80% target)
- Min/max replicas per service

## 🔒 Security

### Network Policies

Consider adding network policies to restrict traffic:

```yaml
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: lomashwood-network-policy
  namespace: lomashwood
spec:
  podSelector: {}
  policyTypes:
  - Ingress
  - Egress
```

### RBAC

Create service accounts and roles:

```yaml
apiVersion: v1
kind: ServiceAccount
metadata:
  name: lomashwood-sa
  namespace: lomashwood
```

## 🚀 Deployment Strategies

### Rolling Update

Services use rolling update strategy:
```yaml
strategy:
  type: RollingUpdate
  rollingUpdate:
    maxSurge: 1
    maxUnavailable: 0
```

### Blue-Green Deployment

For zero-downtime deployments:
1. Deploy new version with different labels
2. Update ingress to point to new version
3. Monitor and rollback if needed

### Canary Deployment

Gradual rollout:
1. Deploy small percentage of new version
2. Monitor metrics
3. Gradually increase traffic

## 📝 Maintenance

### Updates

To update a service:
```bash
kubectl set image deployment/auth-service auth-service=lomashwood/auth-service:v2.0.0 -n lomashwood
```

### Scaling

Manual scaling:
```bash
kubectl scale deployment auth-service --replicas=5 -n lomashwood
```

### Logs

View logs:
```bash
kubectl logs -f deployment/auth-service -n lomashwood
```

### Debugging

Debug a pod:
```bash
kubectl exec -it <pod-name> -n lomashwood -- /bin/sh
```

## 🔍 Troubleshooting

### Common Issues

**Pod not starting:**
```bash
kubectl describe pod <pod-name> -n lomashwood
kubectl logs <pod-name> -n lomashwood
```

**Service not accessible:**
```bash
kubectl get svc -n lomashwood
kubectl describe svc <service-name> -n lomashwood
```

**Ingress issues:**
```bash
kubectl get ingress -n lomashwood
kubectl describe ingress lomashwood-ingress -n lomashwood
```

### Health Checks

Check service health:
```bash
kubectl get pods -n lomashwood
kubectl top pods -n lomashwood
```

## 📚 Additional Resources

- [Kubernetes Documentation](https://kubernetes.io/docs/)
- [NGINX Ingress Controller](https://kubernetes.github.io/ingress-nginx/)
- [Prometheus Monitoring](https://prometheus.io/docs/)
- [Cert-manager](https://cert-manager.io/docs/)

## 🆘 Support

For issues with this deployment:
1. Check pod logs and events
2. Verify configuration and secrets
3. Check resource limits and quotas
4. Review network policies and security groups
