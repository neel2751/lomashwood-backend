# STRIDE Threat Model — Lomash Wood Backend

## 1. Overview

**Project:** Lomash Wood – Kitchen & Bedroom Design & Consultation Platform  
**Version:** 1.0  
**Date:** 2026-02-19  
**Classification:** Internal / Confidential  
**Authors:** Security Architecture Team  

This document applies the STRIDE threat modelling methodology to the Lomash Wood backend microservices platform. Each STRIDE category is mapped to the system's components, trust boundaries, and data flows as defined in the SRS and backend architecture specification.

---

## 2. System Architecture Summary

The backend comprises the following microservices behind an API Gateway, all communicating over internal networks:

| Service | Responsibility |
|---|---|
| `api-gateway` | Public entry point, routing, rate limiting, auth token validation |
| `auth-service` | Registration, login, session management, JWT issuance, RBAC |
| `product-service` | Product catalogue, categories, colours, sizes, inventory, pricing |
| `order-payment-service` | Orders, payments (Stripe), invoices, refunds |
| `appointment-service` | Booking flow, availability, consultants, reminders |
| `content-service` | Blog, CMS pages, SEO, media wall, landing pages |
| `customer-service` | Customer profiles, wishlists, reviews, support, loyalty |
| `notification-service` | Email, SMS, push notifications, templates |
| `analytics-service` | Event tracking, funnels, dashboards, exports |

**Key External Dependencies:**
- PostgreSQL (per-service databases)
- Redis (caching, session blacklist)
- Stripe (payment processing)
- AWS S3 / CDN (media storage)
- Nodemailer / AWS SES (email)
- Twilio / MSG91 (SMS)
- Firebase (push notifications)

---

## 3. Trust Boundaries

```
[Internet / Public Users]
         │
         ▼
[API Gateway] ← Rate limits, CORS, auth token validation
         │
   ┌─────┼──────────────────────────────────┐
   │     │     [Internal Service Mesh]       │
   │   Auth   Product  Order  Appointment   │
   │  Service  Service Service  Service     │
   │     │                                  │
   │  [PostgreSQL DBs]  [Redis]             │
   └───────────────────────────────────────┘
         │
   [External APIs: Stripe, AWS SES, Twilio, Firebase]
```

**Trust Boundary 1:** Internet → API Gateway  
**Trust Boundary 2:** API Gateway → Internal Services  
**Trust Boundary 3:** Internal Services → Databases  
**Trust Boundary 4:** Internal Services → External Third-Party APIs  

---

## 4. STRIDE Analysis

### 4.1 Spoofing

Spoofing threats involve an attacker impersonating a legitimate user, service, or component.

#### 4.1.1 User Identity Spoofing

| ID | Threat | Component | Severity |
|---|---|---|---|
| S-01 | Attacker forges or replays a stolen JWT to authenticate as another user | `api-gateway`, `auth-service` | Critical |
| S-02 | Attacker guesses or brute-forces customer credentials | `auth-service` POST `/v1/auth/login` | High |
| S-03 | Attacker intercepts a session cookie on an unencrypted connection | `api-gateway` (cookie handling) | High |
| S-04 | Attacker submits a booking or brochure request impersonating another customer | `appointment-service`, `customer-service` | Medium |

**Mitigations:**
- Short-lived JWTs (15–30 min) with refresh token rotation
- Token blacklist in Redis upon logout
- Enforce `httpOnly`, `Secure`, `SameSite=Strict` on all cookies
- Account lockout and CAPTCHA after N failed login attempts
- HTTPS enforced at load balancer level (HSTS headers)
- Better Auth session binding to IP/User-Agent fingerprint

#### 4.1.2 Service-to-Service Spoofing

| ID | Threat | Component | Severity |
|---|---|---|---|
| S-05 | Rogue internal service impersonates `auth-service` to issue fake tokens | Internal service mesh | Critical |
| S-06 | Attacker replays Stripe webhook events from a forged source | `order-payment-service` webhook handler | Critical |
| S-07 | Malicious actor impersonates AWS SES/SNS endpoints | `notification-service` | Medium |

**Mitigations:**
- Mutual TLS (mTLS) between internal services
- Stripe webhook signature verification using `stripe-signature` header and secret
- Allowlist external IP ranges for webhook sources where supported
- AWS IAM roles and policies — no long-lived credentials

---

### 4.2 Tampering

Tampering threats involve an attacker modifying data in transit or at rest.

#### 4.2.1 Data in Transit Tampering

| ID | Threat | Component | Severity |
|---|---|---|---|
| T-01 | Attacker performs a MITM attack and modifies product price data in a response | `product-service` → `api-gateway` → Client | High |
| T-02 | Attacker modifies payment intent amount before Stripe confirmation | `order-payment-service` | Critical |
| T-03 | Attacker injects malicious payloads into form fields (SQLi, XSS, command injection) | All form endpoints (`/v1/appointments`, `/v1/brochures`, etc.) | Critical |
| T-04 | Attacker modifies booking slot data in transit to claim an unavailable slot | `appointment-service` | Medium |

**Mitigations:**
- TLS 1.2+ enforced on all external and internal communications
- Zod schema validation on all inbound request bodies — strict type coercion disabled
- Payment amounts calculated server-side from the database; client-supplied amounts are never trusted
- Parameterised queries via Prisma ORM — no raw SQL string interpolation
- `helmet` middleware for security headers (CSP, X-Content-Type-Options, etc.)
- Idempotency keys on all Stripe payment intent creation

#### 4.2.2 Data at Rest Tampering

| ID | Threat | Component | Severity |
|---|---|---|---|
| T-05 | Attacker with database access modifies product pricing or inventory directly | PostgreSQL | High |
| T-06 | Attacker modifies audit logs to cover tracks | All services (audit fields) | High |
| T-07 | Insider threat modifies CMS content (blog, landing pages) without authorisation | `content-service` | Medium |

**Mitigations:**
- Least-privilege database roles per service
- Append-only audit log table with restricted DELETE permissions
- All CMS write operations gated behind `ADMIN` role check
- Database backups encrypted at rest (AWS RDS encryption)
- Prisma soft-delete pattern — no hard deletes on sensitive records

---

### 4.3 Repudiation

Repudiation threats involve users or services denying they performed an action.

| ID | Threat | Component | Severity |
|---|---|---|---|
| R-01 | Customer denies placing an order or booking an appointment | `order-payment-service`, `appointment-service` | High |
| R-02 | Admin denies making a destructive CMS change (deleting a product, modifying pricing) | `product-service`, `content-service` | High |
| R-03 | Payment processor denies receiving a webhook event | `order-payment-service` | Medium |
| R-04 | Internal service denies emitting an event that caused a downstream failure | Event bus (all services) | Medium |

**Mitigations:**
- Structured audit log with `createdBy`, `updatedBy`, `ipAddress`, `userAgent`, `timestamp` on all write operations
- Immutable event log in the event bus (`event-producer.ts`) with event IDs and correlation IDs
- Stripe Dashboard as an independent source of truth for payment events
- Request logging (Winston/Pino) with correlation IDs stored alongside every API call
- Email confirmation sent to customer on booking and order placement — timestamped receipts
- JWT claims include `sub` (user ID) and `iat` (issued-at) for binding actions to identities

---

### 4.4 Information Disclosure

Information disclosure threats involve exposing data to unauthorised parties.

#### 4.4.1 API & Application Layer

| ID | Threat | Component | Severity |
|---|---|---|---|
| I-01 | Verbose error messages expose stack traces, DB schema, or internal service URLs | All services (error middleware) | High |
| I-02 | IDOR: customer accesses another customer's booking/order by guessing IDs | `appointment-service`, `order-payment-service` | Critical |
| I-03 | Unauthenticated access to admin CMS endpoints returns sensitive product/pricing data | `product-service`, `content-service` | High |
| I-04 | JWT payload exposes sensitive user data (PII, roles) without encryption | `auth-service` | Medium |
| I-05 | Brochure table or appointment table is accessible to non-admin users | `customer-service`, `appointment-service` | High |

**Mitigations:**
- Centralised error handler returns generic messages in production; detailed errors only in development
- All resource queries filter by `userId` or `customerId` extracted from the verified JWT — never from query params alone
- All admin routes require `requireRole('ADMIN')` middleware
- JWT payload contains only non-sensitive claims (`sub`, `role`, `sessionId`); PII is fetched from DB per-request
- Response mappers (`*.mapper.ts`) strip internal fields before sending to client

#### 4.4.2 Infrastructure & Data Layer

| ID | Threat | Component | Severity |
|---|---|---|---|
| I-06 | Database credentials exposed in environment variables committed to source control | All services (`.env` files) | Critical |
| I-07 | Redis cache contains sensitive session or PII data accessible without auth | All services (Redis) | High |
| I-08 | AWS S3 bucket containing media/brochures is publicly listable | `content-service` (S3 client) | High |
| I-09 | Log aggregation pipeline (Loki) captures request bodies containing PII | All services | Medium |

**Mitigations:**
- `.env` files in `.gitignore`; secrets managed via AWS Secrets Manager or environment injection in CI/CD
- Redis protected with `requirepass` and bound to internal network only
- S3 bucket policy blocks public `ListBucket`; pre-signed URLs used for file access
- Request logger redacts sensitive fields (`password`, `cardNumber`, `email`) before writing to log
- Secrets rotation scripts (`security/secrets-rotation/`) run on schedule

---

### 4.5 Denial of Service

DoS threats involve making the system unavailable to legitimate users.

| ID | Threat | Component | Severity |
|---|---|---|---|
| D-01 | Attacker floods the `/v1/auth/login` endpoint with requests, exhausting resources | `api-gateway`, `auth-service` | Critical |
| D-02 | Large file upload to `/v1/uploads` saturates bandwidth or storage | `content-service` | High |
| D-03 | Attacker crafts expensive database queries via filter parameters on product listing | `product-service` (infinite scroll) | High |
| D-04 | Stripe webhook endpoint is flooded with fake events causing excessive processing | `order-payment-service` | Medium |
| D-05 | Redis cache stampede on cache invalidation causes database overload | All services using Redis | Medium |
| D-06 | Appointment slot booking race condition allows overbooking, corrupting availability data | `appointment-service` | High |

**Mitigations:**
- Rate limiting via `express-rate-limit` per IP and per user, configurable per route
- File upload size limits (`multer` or equivalent) with MIME type validation
- Database query timeouts set on Prisma client; pagination enforced on all list endpoints
- Stripe webhook signature check happens before any processing — invalid signatures return 400 immediately
- Redis cache-aside pattern with per-key TTL; probabilistic early expiration to prevent stampedes
- Database-level pessimistic locking on appointment slot creation; unique constraint on `(slotId, date)`
- Kubernetes HPA configured for all services; ALB connection limits applied

---

### 4.6 Elevation of Privilege

Elevation of privilege threats involve a user gaining capabilities beyond their authorised role.

| ID | Threat | Component | Severity |
|---|---|---|---|
| E-01 | Regular customer accesses admin CMS endpoints by bypassing role checks | `api-gateway`, all services | Critical |
| E-02 | Attacker exploits a broken JWT validation bug to forge an ADMIN role claim | `auth-service`, `api-gateway` | Critical |
| E-03 | Attacker uses a mass-assignment vulnerability to promote their own account to ADMIN | `auth-service` (register/update) | High |
| E-04 | `notification-service` is exploited to send arbitrary emails using its service credentials | `notification-service` | High |
| E-05 | Background job runner executes with elevated DB permissions beyond its function | All services (`jobs/` directory) | Medium |
| E-06 | Stripe webhook handler performs privileged DB updates without secondary validation | `order-payment-service` | High |

**Mitigations:**
- Role-based access control enforced in dedicated `requireRole()` middleware; roles validated from DB on each request, not solely from JWT
- JWT verified using asymmetric RS256 keys — private key held only by `auth-service`
- Zod schemas for all update endpoints explicitly allowlist mutable fields; `role` field excluded from all user-facing update schemas
- `notification-service` accepts only internal, authenticated events from the event bus — no public email-send endpoints without ADMIN auth
- Background jobs run under a dedicated database role with minimal permissions (SELECT, INSERT on specific tables)
- Stripe webhook payment updates are cross-validated against the Stripe API before committing DB changes

---

## 5. STRIDE Summary Matrix

| Threat Category | Count | Critical | High | Medium |
|---|---|---|---|---|
| Spoofing | 7 | 2 | 3 | 2 |
| Tampering | 7 | 3 | 3 | 1 |
| Repudiation | 4 | 0 | 2 | 2 |
| Information Disclosure | 9 | 2 | 5 | 2 |
| Denial of Service | 6 | 1 | 3 | 2 |
| Elevation of Privilege | 6 | 2 | 3 | 1 |
| **Total** | **39** | **10** | **19** | **10** |

---

## 6. Residual Risks

The following risks are accepted or deferred with documented rationale:

| Risk ID | Description | Rationale | Owner |
|---|---|---|---|
| RR-01 | SMS OTP delivery relies on third-party provider (Twilio/MSG91) with no fallback | Low probability; fallback is email OTP | Backend Team |
| RR-02 | Redis session store is not replicated in development environments | Dev environment only; production uses ElastiCache Multi-AZ | DevOps |
| RR-03 | Client-side analytics events (GTM) can be blocked by ad-blockers | Acceptable data loss; server-side tracking compensates | Analytics Team |

---

## 7. Review & Approval

| Role | Name | Date |
|---|---|---|
| Security Lead | TBD | — |
| Backend Architect | TBD | — |
| DevOps Lead | TBD | — |

**Next Review Date:** 2026-08-19  
**Review Frequency:** Semi-annual or after any major architectural change