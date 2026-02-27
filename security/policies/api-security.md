# API Security Policy — Lomash Wood

**Document ID:** LW-SEC-POL-004  
**Version:** 2.0  
**Classification:** Confidential — Internal Use Only  
**Owner:** Head of Engineering  
**Last Reviewed:** 2026-02-19  
**Next Review Date:** 2026-08-19  
**Status:** Active

---

## 1. Purpose

This policy defines security requirements for all APIs exposed by the Lomash Wood backend platform — including the public API Gateway, internal microservice APIs, and webhook endpoints. It establishes standards for authentication, authorisation, input validation, rate limiting, error handling, and secure communication that all API developers must follow.

---

## 2. Scope

This policy covers:

- The public API Gateway (`api-gateway/`) and all routes it exposes
- All internal microservice HTTP APIs
- Webhook endpoints (Stripe, AWS SNS)
- All API versions (current `v1` and any future versions)
- All environments: development, staging, and production

---

## 3. Transport Security

### 3.1 TLS Requirements

| Requirement | Standard |
|---|---|
| **Protocol** | TLS 1.2 minimum; TLS 1.3 preferred |
| **HTTP redirect** | All HTTP requests must redirect to HTTPS (`301 Moved Permanently`) |
| **HSTS** | `Strict-Transport-Security: max-age=31536000; includeSubDomains; preload` |
| **Certificate** | Valid CA-signed certificate; self-signed certificates prohibited in staging/production |
| **Cipher suites** | Forward-secret cipher suites only (ECDHE, DHE families) |
| **Internal traffic** | All service-to-service communication uses mTLS within the Kubernetes cluster |

### 3.2 Certificate Management

- Certificates managed via AWS Certificate Manager (ACM) for external TLS termination at the ALB
- Internal service certificates managed via cert-manager in Kubernetes
- Certificate expiry monitored via CloudWatch alarms with 30-day and 7-day advance alerts
- Certificate private keys stored only in ACM and Kubernetes secrets — never in application code or environment files

---

## 4. Authentication & Authorisation

### 4.1 API Authentication Requirements

All API endpoints must enforce authentication unless explicitly designated as public. The following authentication scheme applies:

| Endpoint Category | Authentication Method | Notes |
|---|---|---|
| Public endpoints | None required | Product listings, blog, showroom info |
| Customer endpoints | Bearer JWT (RS256 access token) | Issued by `auth-service` |
| Admin endpoints | Bearer JWT (RS256) + ADMIN role claim | MFA required for admin login |
| Webhook endpoints | Provider-specific signature verification | Stripe: `stripe-signature` header |
| Internal service calls | mTLS service certificate | No human JWT |
| Health check (`/health`) | None | Rate-limited; returns no sensitive data |

### 4.2 Authorisation Controls

#### 4.2.1 Role-Based Access Control (RBAC)

Four roles are defined. Each role is a strict superset of the previous:

| Role | Capabilities |
|---|---|
| `GUEST` | Public read-only access (products, blog, showrooms) |
| `CUSTOMER` | All GUEST permissions + own account, bookings, orders, wishlist, reviews |
| `SUPPORT` | All CUSTOMER permissions + read access to all customer records (no write) |
| `ADMIN` | Full system access including CMS, user management, analytics, configuration |

Role is stored in the `users.role` column and included in the JWT `role` claim. Role is **re-validated from the database** on requests to sensitive endpoints — the JWT claim alone is not trusted for privilege-sensitive operations.

#### 4.2.2 Resource Ownership (IDOR Prevention)

For all endpoints that return or modify resources belonging to a specific user:

- The resource's `ownerId` / `customerId` must be compared to `req.user.id` from the validated JWT
- This check must occur in the **repository layer** — never rely solely on a client-supplied ID in the URL path
- Admin role users may access any resource via dedicated admin-prefixed routes

**Implementation pattern:**

```typescript
// appointment.repository.ts
async findByIdForUser(id: string, userId: string): Promise<Appointment | null> {
  return this.prisma.appointment.findFirst({
    where: { id, customerId: userId, deletedAt: null },
  });
}
```

**Violation of this pattern was identified as LW-003 in the 2025 penetration test and LW26-004 in 2026.**

### 4.3 API Key Authentication

For server-to-server integrations, API keys must:

- Be transmitted via `Authorization: Bearer lw_sk_<key>` header only
- Never appear in URL query parameters, path parameters, or request/response logs
- Be stored as SHA-256 hashes in the database (plaintext shown once at creation)
- Carry a fixed, minimal permission set (principle of least privilege)

---

## 5. Input Validation

### 5.1 Validation Requirements

All API endpoints must validate inbound data using **Zod schemas** before the request reaches any business logic. The validation middleware (`validation.middleware.ts`) must:

- Parse and validate `req.body`, `req.params`, `req.query`, and `req.headers` as applicable
- Reject requests failing validation with `HTTP 400 Bad Request` and a structured error body
- **Never** pass unvalidated data to service or repository layers

### 5.2 Zod Schema Standards

```typescript
// Example: Booking creation schema
export const createBookingSchema = z.object({
  body: z.object({
    appointmentType: z.enum(['HOME_MEASUREMENT', 'ONLINE', 'SHOWROOM']),
    forKitchen: z.boolean(),
    forBedroom: z.boolean(),
    slotId: z.string().uuid(),
    customerDetails: z.object({
      name: z.string().min(2).max(100),
      phone: z.string().regex(/^\+?[0-9\s\-()]{7,20}$/),
      email: z.string().email().max(254),
      postcode: z.string().regex(/^[A-Z]{1,2}[0-9][0-9A-Z]?\s?[0-9][A-Z]{2}$/i),
    }),
  }).strict(), // .strict() rejects unknown keys
  params: z.object({ }).strict(),
});
```

**Key rules:**
- Always use `.strict()` to reject extra keys (prevents mass assignment attacks)
- Use `.email()`, `.uuid()`, `.url()` validators for format-sensitive fields
- Apply `.min()` / `.max()` on all string fields
- Use `z.enum()` for fields with a fixed set of permitted values
- Sanitise string inputs: trim whitespace with `.trim()` before business logic

### 5.3 SQL Injection Prevention

- **All database queries must use Prisma ORM parameterised queries** — raw SQL is prohibited
- If raw SQL is absolutely required for a specific query, it must use Prisma's `$queryRaw` with tagged template literals (which are parameterised) — never string concatenation
- Example:

```typescript
// ✅ SAFE — Prisma parameterised
await prisma.product.findMany({ where: { categoryId: req.params.id } });

// ✅ SAFE — Raw parameterised via tagged template
await prisma.$queryRaw`SELECT * FROM products WHERE id = ${id}`;

// ❌ PROHIBITED — String concatenation
await prisma.$queryRawUnsafe(`SELECT * FROM products WHERE id = '${id}'`);
```

### 5.4 File Upload Validation

The `/v1/uploads` endpoint must enforce:

| Check | Requirement |
|---|---|
| **File size limit** | Maximum 10MB per file |
| **MIME type** | Allowlist: `image/jpeg`, `image/png`, `image/webp`, `image/gif`, `application/pdf` |
| **Extension** | Must match MIME type; extension-only checks are insufficient |
| **Filename sanitisation** | Strip path traversal characters; generate a UUID-based filename server-side |
| **Virus scanning** | ClamAV scan via AWS Lambda before S3 storage (async; quarantine until clean) |
| **Magic bytes** | Validate file header magic bytes match the declared MIME type |
| **URL fetch endpoint** | URL allowlist enforced; RFC 1918 and link-local addresses blocked (SSRF prevention — see LW26-002) |

---

## 6. Rate Limiting

### 6.1 Rate Limit Configuration

Rate limiting is applied at two levels:

**Level 1 — API Gateway (global):**

| Category | Limit | Window |
|---|---|---|
| All unauthenticated requests | 100 req | 15 minutes per IP |
| All authenticated requests | 500 req | 15 minutes per user |
| `POST /v1/auth/login` | 10 req | 15 minutes per IP |
| `POST /v1/auth/register` | 5 req | 1 hour per IP |
| `POST /v1/uploads` | 20 req | 1 hour per user |
| `POST /v1/analytics/ingest` | 60 req | 1 minute per IP + session |

**Level 2 — Service-level (defence-in-depth):**

Each service applies its own rate limiting for endpoints that operate heavy database queries.

### 6.2 Rate Limit Response

Rate-limited requests must return:

```
HTTP 429 Too Many Requests
Content-Type: application/json
Retry-After: 900
X-RateLimit-Limit: 10
X-RateLimit-Remaining: 0
X-RateLimit-Reset: 1708394400

{ "error": "Too many requests", "code": "RATE_LIMIT_EXCEEDED", "retryAfter": 900 }
```

---

## 7. Error Handling

### 7.1 Production Error Responses

In production (`NODE_ENV=production`), all unhandled errors must return a **generic error response** that reveals no internal implementation details:

```json
{
  "error": "An unexpected error occurred",
  "code": "INTERNAL_SERVER_ERROR",
  "correlationId": "req_01ARZ3NDEKTSV4RRFFQ69G5FAV"
}
```

**Prohibited in production error responses:**
- Stack traces
- File paths (`/home/claude/...`, `/app/src/...`)
- Database schema details (table names, column names, Prisma model names)
- Framework version information
- Internal service URLs or hostnames

**This was identified as LW-006 in the 2025 penetration test.**

### 7.2 Validation Error Responses

Validation failures (Zod errors) should return structured, field-level errors in development and staging. In production, field-level details may be returned (they contain no sensitive internal data):

```json
{
  "error": "Validation failed",
  "code": "VALIDATION_ERROR",
  "details": [
    { "field": "body.email", "message": "Invalid email address" },
    { "field": "body.phone", "message": "Invalid phone number format" }
  ]
}
```

### 7.3 Error Codes

All error responses must include a `code` field from the canonical error code registry (`shared/errors.ts`):

| Code | HTTP Status | Description |
|---|---|---|
| `VALIDATION_ERROR` | 400 | Request body/params/query failed Zod validation |
| `UNAUTHENTICATED` | 401 | Missing or invalid JWT |
| `FORBIDDEN` | 403 | Authenticated but insufficient permissions |
| `NOT_FOUND` | 404 | Resource does not exist or not owned by requester |
| `CONFLICT` | 409 | Duplicate resource or state conflict |
| `RATE_LIMIT_EXCEEDED` | 429 | Rate limit triggered |
| `INTERNAL_SERVER_ERROR` | 500 | Unhandled server error |

---

## 8. Security Headers

All API responses must include the following HTTP security headers (applied via the `helmet` middleware):

| Header | Value |
|---|---|
| `Strict-Transport-Security` | `max-age=31536000; includeSubDomains; preload` |
| `X-Content-Type-Options` | `nosniff` |
| `X-Frame-Options` | `DENY` |
| `X-XSS-Protection` | `0` (modern browsers use CSP instead) |
| `Referrer-Policy` | `strict-origin-when-cross-origin` |
| `Permissions-Policy` | `geolocation=(), microphone=(), camera=()` |
| `Content-Security-Policy` | Configured per-environment; restrict script-src |
| `Cache-Control` | `no-store` for authenticated / sensitive responses |

---

## 9. CORS Policy

Cross-Origin Resource Sharing is configured in `api-gateway/src/config/cors.ts`:

```typescript
const corsOptions: CorsOptions = {
  origin: (origin, callback) => {
    const allowedOrigins = [
      'https://lomashwood.com',
      'https://www.lomashwood.com',
      'https://admin.lomashwood.com',
      ...(process.env.NODE_ENV !== 'production'
        ? ['http://localhost:3000', 'http://localhost:3001']
        : []),
    ];
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,          // Required for cookie-based auth
  methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Correlation-ID'],
  exposedHeaders: ['X-RateLimit-Limit', 'X-RateLimit-Remaining', 'Retry-After'],
  maxAge: 86400,              // Preflight cache: 24 hours
};
```

Wildcard `origin: '*'` is **strictly prohibited** on any endpoint handling authenticated requests.

---

## 10. API Versioning & Deprecation

- All public API routes are versioned: `/v1/`, `/v2/`, etc.
- Breaking changes require a new API version
- Deprecated API versions must be supported for a minimum of **6 months** after the replacement version is released
- Deprecated endpoints must return the `Deprecation` and `Sunset` response headers
- API version support status is documented in `docs/api/openapi.yaml`

---

## 11. Webhook Security

### 11.1 Stripe Webhooks

All Stripe webhook events received at `POST /v1/webhooks/stripe` must:

1. Verify the `stripe-signature` header using the Stripe SDK (`stripe.webhooks.constructEvent`)
2. Reject events with invalid signatures with `HTTP 400` — no further processing
3. Check the Stripe event ID against the `webhook_events` table (idempotency check)
4. Return `HTTP 200` immediately for duplicate events — no reprocessing
5. Insert the event ID before processing to prevent race conditions

**This was identified as LW-005 in the 2025 penetration test.**

### 11.2 Generic Webhook Security

For any outbound webhooks delivered by Lomash Wood:

- Include an HMAC-SHA256 signature in the `X-LW-Signature` header
- Signature computed over the raw request body using a per-customer secret
- Customers can verify webhook authenticity using their registered secret

---

## 12. Prohibited API Patterns

The following patterns are strictly prohibited:

| Pattern | Reason |
|---|---|
| Client-supplied amounts for payments | Must be calculated server-side from DB records — LW-001 |
| Mass assignment without Zod `.strict()` | Enables privilege escalation — LW26-001 |
| Resource access without ownership check | IDOR vulnerability — LW-003, LW26-004 |
| Verbose errors in production | Information disclosure — LW-006 |
| HTTP-only API endpoints in production | Credentials exposed in transit |
| API keys in URL query parameters | Keys appear in server logs and browser history |
| `algorithms: ['RS256', 'HS256']` in JWT verify | Algorithm confusion attack — LW-002 |

---

## 13. Review & Compliance

This policy is reviewed semi-annually and after any penetration test finding classified as High or above. All new API endpoints must be reviewed against this policy before deployment.

| Role | Responsibility |
|---|---|
| Head of Engineering | Policy owner |
| Security Lead | Reviews new endpoints against policy; validates via penetration testing |
| Backend Architects | Implement controls in all services |
| Code Reviewers | Enforce policy compliance in pull request reviews |

---

*Lomash Wood Ltd — Confidential. Do not distribute outside the engineering organisation.*