# Sentry — Lomash Wood Error Tracking & Performance Monitoring

Centralised error tracking, performance monitoring, and alerting for all Lomash Wood microservices using Sentry.

## Files

| File | Purpose |
|---|---|
| `sentry.properties` | Sentry CLI configuration for release management and source map uploads |
| `sentry.env.example` | All required environment variables — copy to `.env` and populate |
| `alert-rules.yml` | Issue alert rules per service with Slack and PagerDuty routing |
| `integrations.yml` | Full integration and project configuration (Slack, GitHub, PagerDuty, per-project settings) |

## Projects

Each microservice has its own Sentry project with independent DSN, sample rates, and team ownership:

| Project Slug | Service | Team | Trace Sample Rate |
|---|---|---|---|
| lomash-wood-api-gateway | API Gateway | platform | 20% |
| lomash-wood-auth-service | Auth Service | platform | 50% |
| lomash-wood-order-payment-service | Order/Payment | payments | 100% |
| lomash-wood-appointment-service | Appointment | backend | 50% |
| lomash-wood-product-service | Product | backend | 10% |
| lomash-wood-content-service | Content | backend | 10% |
| lomash-wood-customer-service | Customer | backend | 20% |
| lomash-wood-notification-service | Notification | backend | 30% |
| lomash-wood-analytics-service | Analytics | backend | 5% |

## SDK Initialisation (Node.js / TypeScript)

Install the SDK:

```bash
pnpm add @sentry/node @sentry/profiling-node
```

Initialise at the top of each service's `main.ts` before any other imports:

```typescript
import * as Sentry from '@sentry/node';
import { nodeProfilingIntegration } from '@sentry/profiling-node';

Sentry.init({
  dsn: process.env.SENTRY_DSN_ORDER_PAYMENT_SERVICE,
  environment: process.env.NODE_ENV,
  release: process.env.SENTRY_RELEASE,
  integrations: [
    nodeProfilingIntegration(),
    Sentry.prismaIntegration(),
    Sentry.httpIntegration(),
    Sentry.expressIntegration(),
  ],
  tracesSampleRate: Number(process.env.SENTRY_TRACES_SAMPLE_RATE_ORDER_PAYMENT_SERVICE ?? 1.0),
  profilesSampleRate: Number(process.env.SENTRY_PROFILES_SAMPLE_RATE ?? 0.1),
  sendDefaultPii: false,
  maxBreadcrumbs: 50,
  attachStacktrace: true,
  beforeSend(event) {
    if (event.request?.data) {
      delete event.request.data.password;
      delete event.request.data.token;
      delete event.request.data.cardNumber;
    }
    return event;
  },
});
```

Wire the Sentry request and tracing handlers into Express:

```typescript
app.use(Sentry.Handlers.requestHandler());
app.use(Sentry.Handlers.tracingHandler());

app.use(router);

app.use(Sentry.Handlers.errorHandler());
```

## Alert Routing

| Channel | Triggers |
|---|---|
| `#alerts-critical` | Any new issue or regression in api-gateway, auth-service, order-payment-service; DB/Redis errors; unhandled rejections |
| `#alerts-payments` | Any error in order-payment-service; Stripe webhook failures; payment intent creation failures |
| `#alerts-backend` | High error rates in product, appointment, content, customer, notification, analytics services |
| `#alerts-staging` | Any new issue in staging across all services |
| PagerDuty | Critical errors in api-gateway, auth-service, order-payment-service; DB/Redis connection errors |

## PII & Data Scrubbing

The following fields are scrubbed before any event is sent to Sentry:

- `password`, `hashedPassword`, `token`, `secret`, `resetToken`, `otp`
- `authorization`, `cookie`
- `cardNumber`, `cvv`, `clientSecret`, `stripeSecretKey`, `paymentMethodId`
- `phone`, `email`, `address`, `postcode` (customer-facing services)
- `twilioAuthToken`, `sesAccessKey`, `apiKey`

`sendDefaultPii` is set to `false` on all projects.

## Release Management

Upload source maps and track releases on each deployment:

```bash
sentry-cli releases new "$RELEASE_VERSION"
sentry-cli releases set-commits "$RELEASE_VERSION" --auto
sentry-cli releases files "$RELEASE_VERSION" upload-sourcemaps ./dist \
  --url-prefix '~/dist' \
  --rewrite
sentry-cli releases finalize "$RELEASE_VERSION"
sentry-cli releases deploys "$RELEASE_VERSION" new -e production
```

This is automated in `.github/workflows/deploy-production.yml`.

## Integrations

- **GitHub** — commit tracking, suspect commits, stack trace linking, PR comments
- **Slack** — channel-routed alerts with service tags
- **PagerDuty** — on-call escalation for critical and payment errors
- **Jira** — disabled by default, can be enabled via `integrations.yml`

## Environments

| Environment | Alert Behaviour |
|---|---|
| `production` | Full alerting, PagerDuty, Slack critical channels |
| `staging` | New issues only, `#alerts-staging` channel |
| `development` | No external alerts, local Sentry tunnel recommended |