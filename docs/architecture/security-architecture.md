# Security Architecture — Lomash Wood Backend

## Overview

Security is implemented in depth across every layer — network, application, data, and operational. This document covers all controls in place to satisfy GDPR (NFR2.2), PCI-DSS (payment data), and OWASP Top 10 mitigations.

---

## Security Layers

```
┌─────────────────────────────────────────────────────────────┐
│  Layer 1: Network                                           │
│  VPC isolation · Security groups · WAF · TLS everywhere     │
├─────────────────────────────────────────────────────────────┤
│  Layer 2: Edge                                              │
│  CloudFront geo-restrictions · DDoS (Shield Standard)       │
│  Rate limiting at ALB + API Gateway                         │
├─────────────────────────────────────────────────────────────┤
│  Layer 3: Authentication & Authorisation                    │
│  Better Auth · JWT RS256 · RBAC · Session revocation        │
├─────────────────────────────────────────────────────────────┤
│  Layer 4: Application                                       │
│  Zod validation · Helmet · CSRF · Input sanitisation        │
│  SQL injection prevention (Prisma parameterised queries)    │
│  OWASP middleware · Secure headers                          │
├─────────────────────────────────────────────────────────────┤
│  Layer 5: Data                                              │
│  Encryption at rest (KMS) · Encryption in transit (TLS)    │
│  bcrypt password hashing · Tokenised Stripe card data       │
│  Soft deletes · GDPR erasure pipeline                       │
├─────────────────────────────────────────────────────────────┤
│  Layer 6: Secrets                                           │
│  AWS Secrets Manager · KMS CMK · No secrets in code/images  │
├─────────────────────────────────────────────────────────────┤
│  Layer 7: Observability & Response                          │
│  Structured audit logs · Anomaly alerts · Incident runbooks │
└─────────────────────────────────────────────────────────────┘
```

---

## Authentication

### Token Strategy

| Token | Storage | TTL | Rotation |
|-------|---------|-----|----------|
| Access token (JWT RS256) | Memory (client) | 15 minutes | On every refresh |
| Refresh token | HTTP-only Secure cookie | 7 days | On use (sliding) |
| Session record | Redis db:0 + PostgreSQL | 7 days | Revocable instantly |

**Why RS256 over HS256:** The API gateway can verify tokens using only the public key. The private key never leaves the auth-service, so a compromised downstream service cannot forge tokens.

### JWT Claims

```typescript
{
  sub:       "uuid",          // userId
  email:     "user@...",
  role:      "CUSTOMER",
  sessionId: "uuid",          // enables per-session revocation
  iat:       1700000000,
  exp:       1700000900       // 15 min
}
```

### Session Revocation

Redis stores `session:{sessionId}` with the same TTL as the refresh token. On logout or forced revocation (password change, suspicious activity), the key is deleted. The API gateway checks session validity on every request — there is no waiting for token expiry.

### Token Blacklist

Revoked access tokens (still within their 15-min window) are stored in a Redis blacklist:

```
blacklist:token:{jti}  →  "1"  TTL = remaining token lifetime
```

The API gateway checks this set before accepting any token.

---

## Authorisation (RBAC)

### Roles

| Role | Scope |
|------|-------|
| `SUPER_ADMIN` | Full access — user management, all CMS, all data |
| `ADMIN` | CMS management, booking/order oversight, reports |
| `CONSULTANT` | Own bookings, own availability, customer-facing tools |
| `CUSTOMER` | Own profile, own orders, own bookings, wishlists, reviews |

### Enforcement Points

1. **API Gateway** — verifies JWT and attaches `X-User-Id`, `X-User-Role` headers
2. **Service Controllers** — `@RequireRole(UserRole.ADMIN)` decorator checks the header
3. **Service Layer** — ownership checks (e.g. a CUSTOMER can only read their own orders)
4. **Repository Layer** — all queries scoped by `userId` where ownership applies

---

## Transport Security

- **TLS 1.2 minimum**, TLS 1.3 preferred — enforced at ALB and CloudFront
- **HSTS** header: `Strict-Transport-Security: max-age=31536000; includeSubDomains; preload`
- **HTTP → HTTPS redirect** at ALB listener (301)
- **ElastiCache** — TLS in transit enforced (`transit_encryption = true`)
- **RDS** — SSL required for all connections (`rds.force_ssl = 1` in parameter group)
- **Internal service-to-service** calls within VPC use HTTP (no external exposure), protected by security group rules allowing only VPC CIDR

---

## Password Security

```typescript
// auth-service/src/infrastructure/auth/password.ts
import bcrypt from 'bcryptjs'

const SALT_ROUNDS = 12

export const hashPassword   = (plain: string) => bcrypt.hash(plain, SALT_ROUNDS)
export const verifyPassword = (plain: string, hash: string) => bcrypt.compare(plain, hash)
```

**Password policy** (Zod schema):
- Minimum 8 characters
- At least 1 uppercase, 1 lowercase, 1 digit, 1 special character
- Maximum 128 characters (bcrypt input truncation prevention)
- Common password blocklist checked at registration

---

## Input Validation & Sanitisation

Every API endpoint validates its input through three layers:

```
1. API Gateway validators (Zod) — rejects malformed requests before proxying
2. Service-level schemas (Zod)  — re-validates after proxy (defence-in-depth)
3. Prisma parameterised queries — no raw SQL interpolation; prevents SQL injection
```

### XSS Prevention

- All user-supplied strings stored as-is (no HTML stored in DB for display fields)
- CMS rich text fields stored as sanitised HTML via `sanitize-html` with a strict allowlist
- `Content-Security-Policy` header enforced via Helmet

### HTTP Security Headers (Helmet)

```typescript
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc:  ["'self'", "https://js.stripe.com", "https://www.googletagmanager.com"],
      frameSrc:   ["https://js.stripe.com"],
      imgSrc:     ["'self'", "data:", "https://cdn.lomashwood.co.uk"],
      connectSrc: ["'self'", "https://api.stripe.com"],
    }
  },
  hsts:                  { maxAge: 31536000, includeSubDomains: true, preload: true },
  noSniff:               true,
  referrerPolicy:        { policy: 'strict-origin-when-cross-origin' },
  permittedCrossDomainPolicies: false,
  crossOriginEmbedderPolicy: false,   // required for Stripe.js
}))
```

---

## CSRF Protection

The API is stateless JWT-based for browser clients. For cookie-based sessions (SSR flows):

- `SameSite=Strict` on refresh token cookie prevents cross-site submission
- `__Host-` cookie prefix enforces Secure + no Domain attribute
- Double-submit cookie pattern for any form-post endpoints

---

## Rate Limiting

Implemented at two layers using Redis sliding window algorithm:

### API Gateway (global)

| Endpoint category | Limit | Window |
|------------------|-------|--------|
| All `/v1/*` | 300 req | 1 min per IP |
| POST `/v1/auth/login` | 10 req | 15 min per IP |
| POST `/v1/auth/register` | 5 req | 1 hour per IP |
| POST `/v1/brochures` | 3 req | 1 hour per email |
| POST `/v1/payments/*` | 20 req | 1 min per user |
| POST `/v1/analytics/track` | 100 req | 1 min per IP |

### Service-level (additional defence)

Auth-service enforces its own rate limits independent of the gateway — so a gateway bypass does not expose brute-force attack surface.

---

## Payment Security (PCI-DSS)

Lomash Wood operates as a **SAQ A** merchant — card data never touches the backend servers.

- Stripe.js collects card data directly in the browser → Stripe's servers
- The backend only ever stores and processes `PaymentIntent` IDs and status
- Stripe webhook payloads are verified with `stripe.webhooks.constructEvent()` using the signing secret — rejects unsigned or tampered webhook payloads
- Idempotency keys prevent duplicate charges on network retry

---

## Data Protection (GDPR — NFR2.2)

### Personal Data Inventory

| Data field | Entity | Stored in | Retention |
|-----------|--------|-----------|-----------|
| Email, name, phone | User | lomash_auth | Until erasure request |
| Password hash | User | lomash_auth | Until erasure |
| Session tokens | Session | Redis + lomash_auth | 7 days (auto-expire) |
| Booking details | Booking | lomash_appointments | 7 years (legal) |
| Payment records | Payment | lomash_orders | 7 years (legal) |
| IP address | Session | lomash_auth | 90 days then nulled |
| Analytics events | TrackingEvent | lomash_analytics | 24 months |
| Newsletter email | NewsletterSub | lomash_customers | Until unsubscribe |

### GDPR Erasure (Right to be Forgotten)

1. Customer submits erasure request via support ticket
2. Admin triggers `DELETE /v1/admin/customers/:id/erase`
3. customer-service calls a cascading anonymisation pipeline:
   - `users.email = "deleted-{uuid}@erased.lomashwood.co.uk"`
   - `users.firstName = "Deleted"`, `users.lastName = "User"`
   - `users.phone = NULL`, `users.passwordHash = "[erased]"`
   - `users.deletedAt = NOW()`
   - Sessions revoked in Redis
   - Analytics events: `userId` → NULL (event data retained for aggregate stats)
   - Orders: retained with anonymised name for 7-year legal obligation
4. Erasure event published → all services scrub their local copies

### Data Minimisation

- Analytics tracking uses `sessionId` (not `userId`) for anonymous users
- IP addresses are stored for 90 days then automatically nulled by the `anonymize-inactive-users` cron job
- Brochure requests store only the fields required by the form (FR8.1) — no marketing inference

---

## Secrets Management

```
Code repos     → Zero secrets (enforced by git-secrets pre-commit hook)
Docker images  → Zero secrets (injected at ECS runtime from Secrets Manager)
CI/CD logs     → Secrets masked by GitHub Actions secret store
Environment    → .env files excluded via .gitignore (enforced by CI check)
```

All secrets rotated on a schedule:

| Secret | Rotation frequency | Method |
|--------|--------------------|--------|
| JWT private key | 90 days | `scripts/secrets-rotation/rotate-keys.sh` |
| DB passwords | 180 days | RDS password rotation via Secrets Manager |
| Stripe keys | On compromise | Manual + Stripe dashboard |
| Redis password | 180 days | `rotate-db-passwords.sh` + ECS rolling restart |

---

## Audit Logging

Every state-changing operation is logged in structured JSON:

```json
{
  "timestamp": "2026-02-19T10:30:00.000Z",
  "level": "info",
  "service": "auth-service",
  "event": "user.login",
  "userId": "uuid",
  "sessionId": "uuid",
  "ip": "1.2.3.4",
  "userAgent": "Mozilla/5.0...",
  "requestId": "req-abc123",
  "outcome": "success"
}
```

Audit logs are:
- Written to CloudWatch Logs (retention: 90 days prod, 14 days dev)
- Shipped to Loki for search and alerting
- Immutable — no service can delete its own logs (CloudWatch resource policy)

High-risk events that trigger immediate SNS alerts:
- 5+ consecutive failed logins from same IP
- Admin role granted to a user
- Payment webhook signature failure
- `prisma.$executeRaw` called (should never happen — canary alert)
- Any `500` error rate spike

---

## Dependency Security

- `pnpm audit` runs on every CI build — blocks deployment on HIGH/CRITICAL CVEs
- Trivy image scan runs on every built Docker image — blocks push to ECR on CRITICAL
- Dependabot configured for weekly dependency updates with auto-merge for patch versions
- `npm-check-updates` run monthly for major version reviews

---

## OWASP Top 10 Mitigation Summary

| Risk | Mitigation |
|------|-----------|
| A01 Broken Access Control | RBAC at gateway + service + repository layer; ownership checks |
| A02 Cryptographic Failures | TLS everywhere; bcrypt(12); RS256 JWT; KMS encryption at rest |
| A03 Injection | Prisma parameterised queries; Zod validation; no raw SQL in application code |
| A04 Insecure Design | Threat model reviewed; DDD bounded contexts prevent data leakage |
| A05 Security Misconfiguration | Helm enforces immutable configs; Secrets Manager; CIS benchmark scan |
| A06 Vulnerable Components | pnpm audit + Trivy in CI; Dependabot |
| A07 Auth Failures | Rate limiting; account lockout; session revocation; token blacklist |
| A08 Data Integrity Failures | Stripe webhook signature; event bus idempotency; migration checksums |
| A09 Logging Failures | Structured audit logs; CloudWatch immutable retention; Loki alerting |
| A10 SSRF | HTTP client allowlist — services only call known internal URLs + AWS endpoints |