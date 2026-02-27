# Tempo — Lomash Wood Distributed Tracing

Distributed tracing for all Lomash Wood microservices using Grafana Tempo with OpenTelemetry.

## Files

| File | Purpose |
|---|---|
| `tempo.yml` | Core Tempo server configuration |
| `sampling.yml` | Head and tail sampling strategies per service |
| `retention.yml` | Per-service trace retention policies |
| `alert-rules.yml` | Prometheus alert rules derived from trace span metrics |

## Ingestion Protocols

| Protocol | Port |
|---|---|
| OTLP gRPC | 4317 |
| OTLP HTTP | 4318 |
| Jaeger gRPC | 14250 |
| Jaeger Thrift HTTP | 14268 |
| Zipkin | 9411 |

## Sampling Strategy

### Head Sampling (per service)

| Service | Rate |
|---|---|
| order-payment-service | 100% |
| auth-service | 50% |
| appointment-service | 50% |
| customer-service | 20% |
| api-gateway | 20% |
| notification-service | 30% |
| product-service | 10% |
| content-service | 10% |
| analytics-service | 5% |

### Tail Sampling (always sampled)

- All traces with `status_code = ERROR`
- All traces with latency > 3000ms
- All traces touching `/v1/webhooks/stripe`
- All traces touching `/v1/appointments`

## Retention Policy

| Service | Retention |
|---|---|
| order-payment-service | 90 days (PCI-DSS) |
| auth-service | 90 days (security audit) |
| customer-service | 90 days (GDPR) |
| appointment-service | 60 days |
| api-gateway | 30 days |
| product-service | 30 days |
| notification-service | 30 days |
| content-service | 15 days |
| analytics-service | 15 days |

## Alert Groups

- **Latency Alerts** — P99 thresholds per service (api-gateway: 3s, payments: 5s, auth: 2s)
- **Error Rate Alerts** — span error rate thresholds per service
- **Service Graph Alerts** — cross-service error rates and latency via service graph edges
- **Throughput Alerts** — ingestion backpressure, compactor health, low throughput detection

## Metrics Generator

Tempo generates Prometheus metrics automatically from traces:

- `traces_spanmetrics_calls_total` — request counts by service and status
- `traces_spanmetrics_duration_seconds_bucket` — latency histograms
- `traces_service_graph_request_total` — inter-service call counts
- `traces_service_graph_request_failed_total` — inter-service error counts

These are remote-written to Prometheus at `http://prometheus:9090/api/v1/write`.

## Starting Tempo

```bash
docker compose up -d tempo
```

## Querying Traces

Access Grafana at `http://localhost:3000`, use the Explore panel with the Tempo datasource.

Search by:
- **Service name** — filter to a specific microservice
- **Trace ID** — look up an exact trace from logs or error reports
- **Tags** — `http.route`, `db.system`, `error=true`
- **Duration** — traces slower than a threshold

## OpenTelemetry SDK Setup (Node.js)

Each service instruments via `@opentelemetry/sdk-node`:

```typescript
import { NodeSDK } from '@opentelemetry/sdk-node';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-grpc';
import { Resource } from '@opentelemetry/resources';
import { SemanticResourceAttributes } from '@opentelemetry/semantic-conventions';

const sdk = new NodeSDK({
  resource: new Resource({
    [SemanticResourceAttributes.SERVICE_NAME]: 'order-payment-service',
    [SemanticResourceAttributes.DEPLOYMENT_ENVIRONMENT]: process.env.NODE_ENV,
  }),
  traceExporter: new OTLPTraceExporter({
    url: 'http://tempo:4317',
  }),
});

sdk.start();
```