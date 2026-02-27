# Lomash Wood Load Testing

k6-based load tests covering all critical API surfaces of the Lomash Wood platform.

## Prerequisites

```bash
brew install k6          # macOS
choco install k6         # Windows
apt-get install k6       # Ubuntu/Debian
```

## Test Suites

| File | Endpoints Covered | Max VUs |
|------|------------------|---------|
| `auth.test.js` | login, register, me, logout | 100 |
| `product.test.js` | list, detail, filter, search | 200 |
| `booking.test.js` | availability, create, brochure, business | 80 |
| `order.test.js` | create-intent, create order, webhooks | 60 |
| `notification.test.js` | email, sms, templates, bulk | 50 |
| `analytics.test.js` | track, batch, dashboard, funnel, export | 200 |

## Running Tests

### Single suite

```bash
k6 run k6/auth.test.js
k6 run k6/product.test.js
k6 run k6/booking.test.js
k6 run k6/order.test.js
k6 run k6/notification.test.js
k6 run k6/analytics.test.js
```

### With environment variables

```bash
k6 run \
  -e BASE_URL=https://api.staging.lomashwood.co.uk \
  -e AUTH_TOKEN=your_jwt_token_here \
  k6/product.test.js
```

### Specific scenario only

```bash
k6 run --scenario baseline k6/auth.test.js
k6 run --scenario ramp_up k6/auth.test.js
```

### Output to file

```bash
k6 run --out json=reports/run-$(date +%Y%m%d-%H%M%S).json k6/product.test.js
```

### Output to Grafana / InfluxDB

```bash
k6 run --out influxdb=http://localhost:8086/k6 k6/product.test.js
```

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `BASE_URL` | `http://localhost:3000` | API base URL |
| `AUTH_TOKEN` | `` | Bearer token for authenticated requests |
| `STRIPE_WEBHOOK_SECRET` | `whsec_test_secret` | Stripe signing secret for webhook tests |

## Test Types

### Baseline
Steady low VU load representing expected daily traffic. Run first to establish a performance reference.

```bash
k6 run --scenario baseline k6/product.test.js
```

### Stress
Ramps VUs progressively to locate the breaking point. Monitors for errors and degradation.

```bash
k6 run --scenario ramp_up k6/product.test.js
```

### Soak
Sustained moderate load for 4+ hours. Detects memory leaks, connection pool exhaustion, and performance drift.

```bash
k6 run \
  --vus 50 \
  --duration 4h \
  -e BASE_URL=https://api.staging.lomashwood.co.uk \
  k6/product.test.js
```

## Thresholds Summary

| Metric | Baseline | Stress | Soak |
|--------|---------|--------|------|
| P95 response time | <500ms | <1500ms | <600ms |
| P99 response time | <1000ms | <3000ms | <1200ms |
| Error rate | <1% | <5% | <1% |
| Auth login P95 | <300ms | — | — |
| Product list P95 | <600ms | — | — |
| Analytics track P95 | <300ms | — | — |

## Reports

Reports are written to the `reports/` directory after each run:

- `baseline.json` — baseline run schema and results
- `stress.json` — stress run schema and results
- `soak.json` — soak run schema and results (memory, CPU, connection tracking over time)

Per-test summaries are auto-generated:

- `reports/auth-summary.json`
- `reports/product-summary.json`
- `reports/booking-summary.json`
- `reports/order-summary.json`
- `reports/notification-summary.json`
- `reports/analytics-summary.json`

## CI Integration

```yaml
- name: Run baseline load tests
  run: |
    k6 run \
      -e BASE_URL=${{ secrets.STAGING_API_URL }} \
      -e AUTH_TOKEN=${{ secrets.LOAD_TEST_TOKEN }} \
      --out json=reports/ci-baseline.json \
      tools/load-testing/k6/product.test.js
```