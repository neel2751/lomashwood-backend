# Lomash Wood Chaos Testing

Chaos engineering tools that target the Lomash Wood Kubernetes cluster to verify resilience, auto-recovery, and fault-tolerance behaviour across all services.

## Prerequisites

- `kubectl` configured and pointing at the correct cluster context
- Sufficient RBAC permissions to exec into pods and delete pods
- Pods must have `tc`, `iptables`, or `Node.js`/`Python3` available for network and memory experiments (standard in most Node.js base images)

## Setup

```bash
pnpm install
```

## Tools

### pod-killer

Randomly terminates pods in the namespace to test Kubernetes self-healing and service redundancy.

```bash
# Kill 3 random pods across all services, 30s apart
ts-node src/pod-killer.ts --count 3 --interval 30

# Target a specific service
ts-node src/pod-killer.ts --service auth-service --count 2

# Immediate termination (grace period 0)
ts-node src/pod-killer.ts --service product-service --grace-period 0

# Dry run first
ts-node src/pod-killer.ts --service api-gateway --dry-run
```

**Options:**

| Flag | Default | Description |
|------|---------|-------------|
| `-n, --namespace` | `lomash-wood` | Kubernetes namespace |
| `-s, --service` | random | Target service name |
| `-i, --interval` | `30` | Seconds between kills |
| `-c, --count` | `3` | Number of pods to kill |
| `-g, --grace-period` | `0` | Deletion grace period in seconds |
| `--dry-run` | `false` | Print commands only |

---

### latency-injector

Injects artificial network latency into pods using Linux `tc netem`. Falls back to `iptables` if `tc` is unavailable.

```bash
# Inject 200ms latency into all auth-service pods for 60s
ts-node src/latency-injector.ts --service auth-service --latency 200 --duration 60

# High jitter to simulate unstable network
ts-node src/latency-injector.ts --service product-service --latency 500 --jitter 200 --duration 90

# Target only database traffic on port 5432
ts-node src/latency-injector.ts --service order-payment-service --latency 100 --target-port 5432 --duration 60

# Dry run
ts-node src/latency-injector.ts --service api-gateway --latency 300 --dry-run
```

**Options:**

| Flag | Default | Description |
|------|---------|-------------|
| `-s, --service` | required | Target service name |
| `-n, --namespace` | `lomash-wood` | Kubernetes namespace |
| `-l, --latency` | `200` | Latency in milliseconds |
| `-j, --jitter` | `50` | Jitter in milliseconds |
| `-d, --duration` | `60` | Duration in seconds |
| `-p, --target-port` | all | Only delay this port |
| `--dry-run` | `false` | Print commands only |

---

### cpu-hog

Applies CPU stress inside pods using `stress-ng`, `yes`, or a pure shell spinner. Tests HPA scale-out and performance under CPU pressure.

```bash
# 80% CPU load on analytics-service for 60s
ts-node src/cpu-hog.ts --service analytics-service --cpu-percent 80 --duration 60

# Full CPU saturation across 2 cores
ts-node src/cpu-hog.ts --service product-service --cpu-percent 100 --cores 2 --duration 45

# Dry run
ts-node src/cpu-hog.ts --service auth-service --cpu-percent 90 --dry-run
```

**Options:**

| Flag | Default | Description |
|------|---------|-------------|
| `-s, --service` | required | Target service name |
| `-n, --namespace` | `lomash-wood` | Kubernetes namespace |
| `-c, --cpu-percent` | `80` | CPU utilisation target (0–100) |
| `-k, --cores` | `1` | Number of CPU worker threads |
| `-d, --duration` | `60` | Duration in seconds |
| `--dry-run` | `false` | Print commands only |

---

### memory-leak

Gradually allocates memory inside pods to simulate leaks, test OOM killer behaviour, and measure pod recovery time.

```bash
# Allocate 256MB over 30s, hold for 60s
ts-node src/memory-leak.ts --service customer-service --target-mb 256 --ramp-seconds 30 --hold-seconds 60

# Push past container memory limit and watch OOM recovery
ts-node src/memory-leak.ts --service notification-service --target-mb 512 --watch-oom

# Dry run
ts-node src/memory-leak.ts --service content-service --target-mb 128 --dry-run
```

**Options:**

| Flag | Default | Description |
|------|---------|-------------|
| `-s, --service` | required | Target service name |
| `-n, --namespace` | `lomash-wood` | Kubernetes namespace |
| `-m, --target-mb` | `256` | Memory to allocate in MB |
| `-r, --ramp-seconds` | `30` | Seconds to ramp up |
| `-h, --hold-seconds` | `60` | Seconds to hold |
| `--watch-oom` | `false` | Monitor OOM kills and recovery |
| `--dry-run` | `false` | Print commands only |

---

### network-partition

Partitions network traffic between services using `iptables` DROP rules. Tests circuit breaker activation, fallback behaviour, and service mesh resilience.

```bash
# Cut off auth-service from postgres (full partition)
ts-node src/network-partition.ts --source-service auth-service --target-service postgres --duration 60

# 50% packet loss between api-gateway and product-service
ts-node src/network-partition.ts --source-service api-gateway --target-service product-service --drop-percent 50 --duration 90

# Block Redis access from notification-service
ts-node src/network-partition.ts --source-service notification-service --target-service redis --duration 45

# Bidirectional partition with port filter
ts-node src/network-partition.ts --source-service order-payment-service --target-service postgres --target-port 5432 --bidirectional --duration 60

# Dry run
ts-node src/network-partition.ts --source-service api-gateway --target-service auth-service --dry-run
```

**Options:**

| Flag | Default | Description |
|------|---------|-------------|
| `-s, --source-service` | required | Service to partition FROM |
| `-t, --target-service` | none | Block traffic to this service |
| `-H, --target-host` | none | Block traffic to this host/IP |
| `-p, --target-port` | all | Only block this port |
| `-n, --namespace` | `lomash-wood` | Kubernetes namespace |
| `-d, --duration` | `60` | Partition duration in seconds |
| `--drop-percent` | `100` | Packet drop rate (100 = full partition) |
| `--bidirectional` | `false` | Block ingress and egress |
| `--dry-run` | `false` | Print commands only |

## Service Names

Valid service names for all tools:

```
api-gateway
auth-service
product-service
order-payment-service
appointment-service
content-service
customer-service
notification-service
analytics-service
postgres
redis
```

## Safety Rules

1. Always run with `--dry-run` first and review commands before live execution
2. Run chaos tests in **staging** only unless approved for production
3. Ensure at minimum 2 replicas per service before running pod-killer
4. Notify the team in Slack before running experiments in shared environments
5. Never target `postgres` or `redis` with full network partition during peak hours
6. All tools print cleanup commands if terminated unexpectedly — run them if pods remain affected

## Emergency Cleanup

If a tool crashes without cleaning up:

```bash
# Remove all iptables chaos rules from a pod
kubectl exec -n lomash-wood <pod-name> -- sh -c "iptables -F INPUT; iptables -F OUTPUT"

# Remove tc latency rules
kubectl exec -n lomash-wood <pod-name> -- sh -c "tc qdisc del dev eth0 root 2>/dev/null || true"

# Kill stress processes
kubectl exec -n lomash-wood <pod-name> -- sh -c "pkill -f stress-ng; pkill -f 'yes > /dev/null'"

# Force-restart a deployment
kubectl rollout restart deployment/<service-name> -n lomash-wood
```

## Recommended Experiment Schedule

| Experiment | Frequency | Environment |
|-----------|-----------|-------------|
| Pod killer (random) | Weekly | Staging |
| Latency injection (200ms) | Weekly | Staging |
| DB network partition (60s) | Bi-weekly | Staging |
| Memory pressure (below limit) | Monthly | Staging |
| CPU saturation | Monthly | Staging |
| Full chaos runbook | Quarterly | Staging |