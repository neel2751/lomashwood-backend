# PCI-DSS Compliance — Lomash Wood Backend

## Overview

This document defines how the Lomash Wood backend achieves and maintains compliance with the Payment Card Industry Data Security Standard (PCI-DSS) v4.0. Lomash Wood processes card payments via Stripe and operates as a **SAQ A** (Self-Assessment Questionnaire A) merchant, meaning all card processing is fully outsourced to Stripe and no cardholder data (CHD) is ever handled, stored, or transmitted by Lomash Wood systems.

**Merchant Level:** Level 4 (fewer than 20,000 Visa/Mastercard e-commerce transactions per year at launch)
**SAQ Type:** SAQ A
**Payment Processor:** Stripe (PCI-DSS Level 1 certified)
**Acquiring Bank:** To be confirmed at launch

---

## Scope Definition

### In-Scope Systems

Under SAQ A, the cardholder data environment (CDE) scope is intentionally minimal:

| System | Role | In Scope |
|--------|------|----------|
| Stripe hosted payment elements | Collects card data in an iframe served by Stripe | Yes — Stripe's scope |
| `order-payment-service` | Creates payment intents, receives webhook events, stores payment references | Yes — Lomash Wood scope |
| `api-gateway` | Routes `/v1/payments/*` and `/v1/webhooks/stripe` | Yes — Lomash Wood scope |
| AWS infrastructure (EKS, RDS, VPC) | Hosts the order-payment-service | Yes — Lomash Wood scope |
| All other services | No card data contact | No |
| Customer browsers | Render Stripe Elements iframe | Stripe's scope |

### Explicitly Out of Scope

Lomash Wood systems **never** process, store, or transmit:

- Primary Account Numbers (PANs)
- Cardholder names (for card verification purposes)
- Card expiry dates
- CVV / CVC codes
- Magnetic stripe data
- PIN data

All of the above are handled exclusively within Stripe's PCI-DSS Level 1 certified infrastructure.

---

## SAQ A Requirements

### Requirement 1 — Network Security Controls

**VPC Isolation:**

The `order-payment-service` runs in a dedicated private subnet with no direct internet access. All outbound calls to Stripe route through a NAT Gateway with a fixed Elastic IP, which can be allowlisted on Stripe's side.

```bash
aws ec2 describe-subnets \
  --filters "Name=tag:Service,Values=order-payment-service" \
  --query 'Subnets[*].{ID:SubnetId,Type:MapPublicIpOnLaunch,AZ:AvailabilityZone}'
```

**Security Group Rules:**

```bash
aws ec2 describe-security-groups \
  --group-ids sg-order-payment-service \
  --query 'SecurityGroups[*].{Inbound:IpPermissions,Outbound:IpPermissionsEgress}'
```

Expected inbound: Only from the internal ALB security group on port 3003.
Expected outbound: HTTPS (443) to `api.stripe.com` only (via NAT Gateway).

**Kubernetes Network Policy:**

```yaml
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: order-payment-service-netpol
  namespace: lomash-wood
spec:
  podSelector:
    matchLabels:
      app: order-payment-service
  policyTypes:
    - Ingress
    - Egress
  ingress:
    - from:
        - podSelector:
            matchLabels:
              app: api-gateway
      ports:
        - protocol: TCP
          port: 3003
  egress:
    - to:
        - podSelector:
            matchLabels:
              app: postgres
      ports:
        - protocol: TCP
          port: 5432
    - ports:
        - protocol: TCP
          port: 443
```

### Requirement 2 — Secure Configurations

All default credentials are changed before deployment. The `order-payment-service` environment is validated at startup:

```typescript
// order-payment-service: src/config/env.ts
import { z } from 'zod';

const envSchema = z.object({
  STRIPE_SECRET_KEY: z.string().startsWith('sk_').min(20),
  STRIPE_WEBHOOK_SECRET: z.string().startsWith('whsec_').min(20),
  DATABASE_URL: z.string().startsWith('postgresql://'),
  NODE_ENV: z.enum(['production', 'staging', 'development']),
});

export const env = envSchema.parse(process.env);
```

### Requirement 3 — Protect Stored Account Data

**No cardholder data is stored.** The only payment-related data stored in `lomash_orders`:

```sql
payment_transactions (
  id                      UUID PRIMARY KEY,
  order_id                UUID NOT NULL,
  stripe_payment_intent_id VARCHAR(255) NOT NULL,  -- pi_xxx reference only
  stripe_charge_id        VARCHAR(255),            -- ch_xxx reference only
  amount                  INTEGER NOT NULL,         -- in pence
  currency                VARCHAR(3) DEFAULT 'GBP',
  status                  payment_status NOT NULL,
  card_last_four          VARCHAR(4),              -- last 4 digits only (from Stripe response)
  card_brand              VARCHAR(20),             -- 'visa', 'mastercard', etc.
  failure_code            VARCHAR(100),
  failure_message         TEXT,
  created_at              TIMESTAMP DEFAULT NOW()
);
```

`card_last_four` and `card_brand` are display-only values returned by Stripe after charge creation. They are not classified as CHD under PCI-DSS.

### Requirement 4 — Protect Cardholder Data in Transit

All communication with Stripe uses TLS 1.2 or higher:

```typescript
// order-payment-service: src/infrastructure/payments/stripe.client.ts
import Stripe from 'stripe';

export const stripeClient = new Stripe(env.STRIPE_SECRET_KEY, {
  apiVersion: '2024-12-18.acacia',
  typescript: true,
  maxNetworkRetries: 3,
  timeout: 10000,
  telemetry: false,
});
```

Stripe's SDK enforces TLS 1.2+ on all connections. No plain HTTP is used.

Verify TLS enforcement on the API Gateway ALB:

```bash
aws elbv2 describe-listeners \
  --load-balancer-arn <alb-arn> \
  --query 'Listeners[*].{Protocol:Protocol,Port:Port,SSLPolicy:SslPolicy}'
```

Expected: `ELBSecurityPolicy-TLS13-1-2-2021-06` or equivalent.

### Requirement 5 — Protect Against Malware

- Container images are scanned for vulnerabilities before deployment via the `security-scan.yml` GitHub Actions workflow.
- AWS ECR image scanning is enabled on push.
- Trivy is used for dependency vulnerability scanning in CI.

```yaml
# .github/workflows/security-scan.yml (extract)
- name: Scan order-payment-service image
  run: |
    trivy image \
      --severity HIGH,CRITICAL \
      --exit-code 1 \
      $ECR_REGISTRY/lomash-wood/order-payment-service:$IMAGE_TAG
```

### Requirement 6 — Develop and Maintain Secure Systems

**Dependency management:**

```bash
npm audit --audit-level=high
```

This runs in CI on every pull request. PRs with high/critical vulnerabilities are blocked from merging.

**Secure coding practices enforced via ESLint rules:**
- No `eval()` usage
- No `innerHTML` assignment
- Input validation via Zod on all controller entry points
- SQL injection impossible via Prisma ORM (parameterised queries only)

**Change control:** All changes to payment-related code require a second engineer's review. CODEOWNERS file enforces this:

```
# .github/CODEOWNERS
services/order-payment-service/ @backend-lead @security-reviewer
api-gateway/src/routes/payment.routes.ts @backend-lead
```

### Requirement 7 — Restrict Access to System Components

**Principle of least privilege:**

- `order-payment-service` database user has `SELECT`, `INSERT`, `UPDATE` only on its own schema. No `DROP`, `TRUNCATE`, or `CREATE`.
- No developer has direct production database access. All production DB access goes through a bastion host with MFA, logged via AWS CloudTrail.
- Stripe dashboard access is role-based: engineers have `View only`; finance has `Full access`; no shared credentials.

```bash
aws iam simulate-principal-policy \
  --policy-source-arn arn:aws:iam::<account>:role/order-payment-service-role \
  --action-names rds:DeleteDBInstance \
  --query 'EvaluationResults[*].EvalDecision'
```

Expected: `"implicitDeny"`.

### Requirement 8 — Identify Users and Authenticate Access

- All admin users have unique accounts — no shared credentials.
- MFA is enforced for all AWS Console access.
- MFA is enforced for all admin panel logins.
- Stripe API keys are stored exclusively in AWS Secrets Manager; never in code or `.env` files committed to Git.

```bash
aws secretsmanager get-secret-value \
  --secret-id lomash-wood/production/stripe-secret-key \
  --query SecretString --output text
```

### Requirement 10 — Log and Monitor All Access

All payment-related actions are logged with the following fields:

```typescript
// order-payment-service: src/app/payments/payment.service.ts
logger.info({
  event: 'payment_intent_created',
  userId: context.userId,
  orderId: order.id,
  stripePaymentIntentId: intent.id,
  amount: intent.amount,
  currency: intent.currency,
  ip: context.ipAddress,
  userAgent: context.userAgent,
  timestamp: new Date().toISOString(),
});
```

Log retention: Payment logs are retained for **12 months** online and **3 years** archived in S3 (Glacier).

CloudTrail is enabled for all AWS API calls in the production account:

```bash
aws cloudtrail get-trail-status --name lomash-wood-prod-trail \
  --query '{IsLogging:IsLogging,LastDeliveryTime:LatestDeliveryTime}'
```

### Requirement 11 — Test Security of Systems

**Quarterly vulnerability scans:**

Internal scans of the CDE network are performed quarterly using AWS Inspector.

```bash
aws inspector2 list-findings \
  --filter-criteria '{"resourceType":[{"comparison":"EQUALS","value":"AWS_EC2_INSTANCE"}]}' \
  --query 'findings[?severity==`CRITICAL`]'
```

**Annual penetration test:**

A qualified third-party penetration tester tests the CDE scope annually. Results are stored in `security/pentest-reports/`.

**File integrity monitoring:**

Container image digests are pinned in Kubernetes deployments. Any drift triggers a Sentry alert:

```yaml
image: 123456789.dkr.ecr.eu-west-1.amazonaws.com/lomash-wood/order-payment-service@sha256:<digest>
```

### Requirement 12 — Support Information Security Policies

- Payment security policy: `security/policies/api-security.md`
- Data retention policy: `security/policies/data-retention.md`
- Incident response plan: `security/policies/incident-response.md`
- All staff with access to payment systems complete annual security awareness training.

---

## Stripe Webhook Security

All incoming Stripe webhooks are verified using the Stripe webhook signature before any processing occurs:

```typescript
// order-payment-service: src/infrastructure/payments/webhook-handler.ts
import Stripe from 'stripe';
import { env } from '@/config/env';

export function verifyStripeWebhook(
  payload: Buffer,
  signature: string,
): Stripe.Event {
  return stripeClient.webhooks.constructEvent(
    payload,
    signature,
    env.STRIPE_WEBHOOK_SECRET,
  );
}
```

The raw request body (not parsed JSON) is used for signature verification. Express `bodyParser.raw()` is applied only to the webhook route:

```typescript
// api-gateway: src/routes/payment.routes.ts
router.post(
  '/webhooks/stripe',
  express.raw({ type: 'application/json' }),
  webhookController.handleStripe,
);
```

---

## Idempotency

All payment intent creation calls include an idempotency key to prevent duplicate charges:

```typescript
const intent = await stripeClient.paymentIntents.create(
  {
    amount: order.totalInPence,
    currency: 'gbp',
    metadata: { orderId: order.id },
  },
  {
    idempotencyKey: `order_${order.id}_${order.version}`,
  },
);
```

---

## Annual SAQ A Completion

The SAQ A self-assessment is completed annually by the DPO and Engineering Manager. Upon completion:

1. The signed SAQ A is submitted to the acquiring bank.
2. An Attestation of Compliance (AoC) is filed.
3. The completed SAQ is stored in `security/pentest-reports/` (restricted access).

Next assessment due: February 2027.