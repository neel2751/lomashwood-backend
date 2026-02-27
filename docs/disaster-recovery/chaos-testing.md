# Chaos Testing — Lomash Wood Backend

## Overview

This document defines the chaos engineering strategy, test scenarios, tooling, and result log for the Lomash Wood backend. Chaos testing is used to proactively expose weaknesses in resilience, failover mechanisms, and recovery procedures before they manifest as real incidents.

**Guiding principle:** Chaos tests are only run against environments where the expected failure mode is understood and the recovery procedure is documented. All tests start in staging before being approved for production.

---

## Tooling

| Tool | Purpose |
|------|---------|
| `tools/chaos-testing/` (custom TypeScript) | Pod killer, latency injector, CPU hog, memory leak, network partition |
| [Chaos Mesh](https://chaos-mesh.org) | Kubernetes-native fault injection |
| [k6](https://k6.io) | Load testing concurrent with fault injection |
| AWS Fault Injection Simulator (FIS) | EC2, RDS, and network-level fault injection |
| `tools/load-testing/k6/` | Sustained load during chaos experiments |

---

## Chaos Experiment Framework

Every chaos experiment follows this structure:

1. **Hypothesis** — State what is expected to happen.
2. **Blast radius** — Define the exact scope (one pod, one AZ, one service).
3. **Steady state baseline** — Measure normal metrics before injection.
4. **Fault injection** — Introduce the failure.
5. **Observation** — Measure the system response.
6. **Recovery validation** — Confirm the system returns to steady state.
7. **Result** — Pass / Fail with observations.

---

## Experiment Catalogue

### EXP-001 — Pod Failure (Single Replica)

**Hypothesis:** Deleting one pod from a multi-replica deployment does not cause any user-visible errors because Kubernetes reschedules the pod and the load balancer routes traffic to healthy pods.

**Target:** `product-service` (2 replicas running in staging).

**Steady state metrics (before):**
- P95 latency for `GET /v1/products` < 300ms
- Error rate < 0.1%

**Execution:**

```bash
# Start sustained load
k6 run tools/load-testing/k6/product.test.js &

# Kill one pod
kubectl delete pod -n lomash-wood -l app=product-service --field-selector=status.phase=Running | head -1
```

**Using the custom pod killer:**

```bash
cd tools/chaos-testing
npx ts-node src/pod-killer.ts --namespace=lomash-wood --deployment=product-service --delay=0
```

**Observation metrics:**
- Number of `503` errors during pod deletion
- Time for Kubernetes to reschedule the pod
- Recovery time to full capacity

**Pass criteria:**
- < 5 errors during the pod deletion window
- Pod rescheduled within 30 seconds
- P95 latency returns to baseline within 60 seconds

---

### EXP-002 — Database Connection Pool Exhaustion

**Hypothesis:** When all Prisma connection pool slots are consumed, new requests return a `503` with a clear error, do not crash the service, and recover when connections are released.

**Target:** `order-payment-service` in staging.

**Execution:**

```bash
# Artificially reduce connection pool to 2 and send 50 concurrent requests
kubectl set env deployment/order-payment-service -n lomash-wood \
  DATABASE_CONNECTION_LIMIT=2

# Concurrent load to exhaust connections
k6 run --vus=50 --duration=30s tools/load-testing/k6/order.test.js
```

**Pass criteria:**
- Service returns `503` (not crash/timeout) when pool is exhausted
- Logs contain `PrismaClientKnownRequestError` with clear message
- Service recovers automatically when load drops
- No OOMKilled or CrashLoopBackOff events

**Cleanup:**

```bash
kubectl set env deployment/order-payment-service -n lomash-wood \
  DATABASE_CONNECTION_LIMIT=20
```

---

### EXP-003 — Redis Failure (Cache Layer Removed)

**Hypothesis:** When Redis becomes unavailable, all services that depend on it for caching gracefully fall back to the database and continue serving requests (with increased latency), without throwing unhandled errors.

**Target:** All services in staging.

**Execution:**

```bash
# Scale Redis to 0
kubectl scale statefulset/redis --replicas=0 -n lomash-wood

# Run load against product and auth endpoints
k6 run --vus=20 --duration=60s tools/load-testing/k6/product.test.js &
k6 run --vus=10 --duration=60s tools/load-testing/k6/auth.test.js
```

**Using latency injector:**

```bash
npx ts-node src/latency-injector.ts --target=redis --latency-ms=5000 --duration=60
```

**Pass criteria:**
- All service health endpoints return `200` (possibly with `redis: degraded`)
- `GET /v1/products` continues returning data (from DB fallback)
- `POST /v1/auth/login` continues working
- No unhandled errors — fallback is silent or logged as warning only
- P95 latency increases but stays < 3× baseline

**Recovery:**

```bash
kubectl scale statefulset/redis --replicas=1 -n lomash-wood
kubectl rollout status statefulset/redis -n lomash-wood
```

---

### EXP-004 — Network Partition Between Services

**Hypothesis:** When the `order-payment-service` cannot reach the `auth-service` (for token verification), requests fail with `401` and a clear error, and the issue self-resolves when connectivity is restored.

**Target:** `order-payment-service` → `auth-service` in staging.

**Execution using NetworkChaos (Chaos Mesh):**

```yaml
apiVersion: chaos-mesh.org/v1alpha1
kind: NetworkChaos
metadata:
  name: auth-network-partition
  namespace: lomash-wood
spec:
  action: partition
  mode: all
  selector:
    namespaces:
      - lomash-wood
    labelSelectors:
      app: order-payment-service
  direction: to
  target:
    mode: all
    selector:
      namespaces:
        - lomash-wood
      labelSelectors:
        app: auth-service
  duration: "2m"
```

```bash
kubectl apply -f chaos/network-partition-auth.yaml
```

**Pass criteria:**
- `POST /v1/payments/create-intent` returns `401` or `503` with a clear error message
- Error is logged with the correct upstream failure context
- No data is written to the database in a partially processed state
- Connectivity restored after 2 minutes; requests succeed again

**Cleanup:**

```bash
kubectl delete networkchaos auth-network-partition -n lomash-wood
```

---

### EXP-005 — CPU Saturation

**Hypothesis:** When a pod's CPU is saturated, the HPA triggers additional replicas, and latency returns to acceptable levels within 3 minutes.

**Target:** `product-service` in staging.

**Execution:**

```bash
# Inject CPU load into one product-service pod
kubectl exec -it <product-service-pod> -n lomash-wood -- sh -c \
  "dd if=/dev/zero of=/dev/null bs=1M count=999999 &"
```

Using the custom CPU hog:

```bash
npx ts-node src/cpu-hog.ts \
  --namespace=lomash-wood \
  --pod=$(kubectl get pod -n lomash-wood -l app=product-service -o name | head -1) \
  --duration=180
```

**Pass criteria:**
- HPA triggers within 60 seconds of CPU > 70%
- New pod is Ready within 90 seconds
- P95 latency returns to baseline within 3 minutes
- No 5xx errors increase during scaling

---

### EXP-006 — Memory Leak Simulation

**Hypothesis:** When a pod consumes memory approaching its limit, Kubernetes OOMKills it, and the deployment controller immediately reschedules a new healthy pod. The brief downtime is absorbed by other replicas.

**Execution:**

```bash
npx ts-node src/memory-leak.ts \
  --namespace=lomash-wood \
  --pod=$(kubectl get pod -n lomash-wood -l app=notification-service -o name | head -1) \
  --rate-mb-per-second=50 \
  --limit-mb=512
```

**Pass criteria:**
- OOMKill event recorded in pod events
- Pod replaced within 30 seconds
- No error rate increase visible to end users
- Memory metrics in Grafana show the event and recovery

---

### EXP-007 — Stripe Webhook Processing Delay

**Hypothesis:** When the order-payment-service is slow to respond to Stripe webhooks, Stripe retries successfully, and no orders are left in a permanently broken state.

**Execution:**

```bash
# Inject 10-second latency on the webhook endpoint
npx ts-node src/latency-injector.ts \
  --service=order-payment-service \
  --endpoint=/v1/webhooks/stripe \
  --latency-ms=10000 \
  --duration=120

# Trigger test payment events from Stripe CLI
stripe trigger payment_intent.succeeded
stripe trigger payment_intent.payment_failed
```

**Pass criteria:**
- Stripe retries are visible in the Stripe dashboard
- All events are eventually processed successfully
- No orders stuck in `PENDING_PAYMENT` after 5 minutes
- No duplicate order records created

---

### EXP-008 — AZ Failure Simulation (AWS FIS)

**Hypothesis:** If one Availability Zone becomes unavailable, RDS Multi-AZ failover completes within 120 seconds, and EKS workloads are rescheduled across remaining AZs with no more than 30 seconds of elevated error rates.

**Execution (AWS FIS):**

```bash
aws fis create-experiment-template \
  --cli-input-json file://chaos/fis-az-failure.json

aws fis start-experiment \
  --experiment-template-id <template-id>
```

`chaos/fis-az-failure.json` simulates AZ-level network disruption using AWS Fault Injection Simulator.

**Pass criteria:**
- RDS failover completes within 120 seconds (CloudWatch: `FailoverCompleted` event)
- All Kubernetes pods rescheduled to healthy AZs within 3 minutes
- Error rate spike < 5% and < 90 seconds in duration
- Stripe webhook endpoint remains operational throughout

---

### EXP-009 — Regional Failover Test (Annual)

**Hypothesis:** The full regional failover procedure from `docs/disaster-recovery/multi-region.md` can be executed within the defined RTO of 30 minutes, and the system serves traffic correctly from `eu-west-2` after failover.

**Execution:** Follow all steps in `multi-region.md` Regional Failover Procedure section.

**Pass criteria:**
- All Tier 1 services healthy in eu-west-2 within 30 minutes
- DNS fully propagated within 5 minutes of Route 53 update
- All smoke tests passing in eu-west-2
- Stripe webhooks being received and processed in eu-west-2

---

## Chaos Test Schedule

| Experiment | Environment | Frequency | Owner |
|-----------|-------------|-----------|-------|
| EXP-001 Pod Failure | Staging | Weekly (automated) | DevOps |
| EXP-002 DB Connection Exhaustion | Staging | Monthly | Backend Lead |
| EXP-003 Redis Failure | Staging | Monthly | Backend Lead |
| EXP-004 Network Partition | Staging | Quarterly | Backend Lead |
| EXP-005 CPU Saturation | Staging | Monthly | DevOps |
| EXP-006 Memory Leak | Staging | Monthly | DevOps |
| EXP-007 Stripe Webhook Delay | Staging | Quarterly | Backend Lead |
| EXP-008 AZ Failure | Production | Semi-annually | Engineering Manager |
| EXP-009 Regional Failover | Staging then Production | Annually | CTO + Eng Manager |

---

## Chaos Test Result Log

| Date | Experiment | Environment | Result | Notes |
|------|-----------|-------------|--------|-------|
| — | EXP-001 | Staging | — | Pending first run |
| — | EXP-002 | Staging | — | Pending first run |
| — | EXP-003 | Staging | — | Pending first run |
| — | EXP-004 | Staging | — | Pending first run |
| — | EXP-005 | Staging | — | Pending first run |
| — | EXP-006 | Staging | — | Pending first run |
| — | EXP-007 | Staging | — | Pending first run |
| — | EXP-008 | Production | — | Scheduled post-launch |
| — | EXP-009 | Staging | — | Scheduled post-launch |

Update this table with `PASS`, `FAIL`, or `PARTIAL` and detailed notes after each run.

---

## Game Day Procedure

A Game Day is a structured chaos event involving multiple engineers simultaneously. Run quarterly.

**Format:**
1. Pre-briefing (15 min) — review current system state and runbooks.
2. Inject 2–3 simultaneous faults (45 min) — simulate realistic multi-failure scenarios.
3. Team responds using only documented runbooks — no ad-hoc fixes.
4. Debrief (30 min) — identify gaps in runbooks, monitoring, and automation.

**Example Game Day scenario:**

> Redis goes down. Simultaneously, one product-service pod is OOMKilled. A surge in appointment bookings hits the system. The team must restore normal operation using only documented runbooks within 20 minutes.

---

## Safety Rules

The following rules are non-negotiable for all chaos experiments:

- Always have a documented rollback/cleanup step before starting.
- Never run destructive experiments (EXP-008, EXP-009) without prior Engineering Manager approval.
- Always run load tests in parallel to measure user impact.
- Always have a second engineer observing Grafana during production experiments.
- Stop the experiment immediately if data loss is detected or if the error rate exceeds 10%.
- Never run experiments during peak hours (08:00–20:00 GMT) in production.
- Document all results, regardless of pass or fail.