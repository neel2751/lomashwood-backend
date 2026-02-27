# Attack Tree Analysis — Lomash Wood Backend

## 1. Overview

**Project:** Lomash Wood – Kitchen & Bedroom Design & Consultation Platform  
**Version:** 1.0  
**Date:** 2026-02-19  
**Classification:** Internal / Confidential  

This document presents attack trees for the highest-severity goals an adversary might pursue against the Lomash Wood backend platform. Each tree decomposes the attacker's root goal into sub-goals using AND/OR logic, mapping to STRIDE findings where applicable.

**Notation:**
- `[OR]` — attacker succeeds if **any** child node is achieved
- `[AND]` — attacker succeeds only if **all** child nodes are achieved
- `(L/M/H/C)` — Likelihood: Low / Medium / High / Critical
- `(STRIDE-REF)` — Reference to STRIDE document threat ID

---

## 2. Attack Tree 1 — Compromise Customer Account

**Root Goal:** Gain full control of a legitimate customer account

```
GOAL: Compromise Customer Account [OR]
│
├── 1.1 Credential Theft [OR]
│   ├── 1.1.1 Brute-Force Login Endpoint (M) [STRIDE: S-02]
│   │         → POST /v1/auth/login with credential list
│   │         → No lockout = unlimited attempts
│   │
│   ├── 1.1.2 Credential Stuffing with Leaked DB (H) [STRIDE: S-02]
│   │         → Use breached credentials from other services
│   │         → High success if users reuse passwords
│   │
│   ├── 1.1.3 Phishing Email Campaign (M)
│   │         → Clone Lomash Wood login page
│   │         → Harvest credentials via fake "booking confirmation" link
│   │
│   └── 1.1.4 Social Engineering Support Staff (L)
│             → Convince support to reset password without identity verification
│
├── 1.2 Session / Token Hijacking [OR]
│   ├── 1.2.1 Steal JWT from Insecure Storage (H) [STRIDE: S-01]
│   │         → XSS payload exfiltrates token from localStorage
│   │         → Requires: token stored in JS-accessible storage
│   │
│   ├── 1.2.2 JWT Token Replay Attack (M) [STRIDE: S-01]
│   │         → Capture valid token from unencrypted connection
│   │         → Re-use before expiry / without blacklisting
│   │
│   └── 1.2.3 Session Cookie Theft (M) [STRIDE: S-03]
│             → Network-level MITM on HTTP connection
│             → Requires: non-HTTPS endpoint or cookie misconfiguration
│
└── 1.3 Password Reset Abuse [OR]
    ├── 1.3.1 Predictable Reset Token (L)
    │         → Token not cryptographically random
    │         → Enumerate tokens within validity window
    │
    └── 1.3.2 Email Account Compromise (M)
              → Attacker gains access to victim's email
              → Triggers password reset to hijack account
```

**Key Mitigations:**
- Account lockout + rate limiting on login endpoint (blocks 1.1.1)
- Argon2/bcrypt password hashing (raises cost of 1.1.2)
- Tokens stored in `httpOnly` cookies only, never `localStorage` (blocks 1.2.1)
- HTTPS enforced everywhere; HSTS preload (blocks 1.2.3)
- Cryptographically random reset tokens with 15-minute TTL (blocks 1.3.1)

---

## 3. Attack Tree 2 — Unauthorised Admin Access

**Root Goal:** Gain administrative privileges to the CMS and backend

```
GOAL: Gain Admin Access [OR]
│
├── 2.1 Exploit Authentication Weakness [OR]
│   ├── 2.1.1 Forge JWT with ADMIN Role (C) [STRIDE: E-02]
│   │   ├── 2.1.1.1 Obtain JWT signing secret [AND]
│   │   │   ├── Extract from exposed .env file or logs
│   │   │   └── Exploit key confusion (HS256 vs RS256 algorithm)
│   │   └── 2.1.1.2 Craft token with { "role": "ADMIN" }
│   │
│   ├── 2.1.2 Mass Assignment to Elevate Own Role (H) [STRIDE: E-03]
│   │         → PATCH /v1/auth/me with body { "role": "ADMIN" }
│   │         → Requires: role field not excluded from update schema
│   │
│   └── 2.1.3 Compromise an Existing Admin Account (H)
│             → Apply Attack Tree 1 targeting a known admin email
│
├── 2.2 Bypass Route-Level Authorization [OR]
│   ├── 2.2.1 Direct Access to Internal Service Ports (H) [STRIDE: E-01]
│   │         → Services expose HTTP directly without gateway enforcement
│   │         → Requires: no network segmentation between services and internet
│   │
│   ├── 2.2.2 Missing Auth Middleware on Admin Route (M) [STRIDE: E-01]
│   │         → Route registered without `requireRole('ADMIN')` middleware
│   │         → POST /v1/products or DELETE /v1/products/:id accessible unauthenticated
│   │
│   └── 2.2.3 HTTP Verb Confusion (L)
│             → Admin route defined for POST but OPTIONS/PUT not restricted
│             → Bypasses middleware applied only to specific HTTP methods
│
└── 2.3 Exploit Infrastructure (M)
    ├── 2.3.1 Compromise CI/CD Pipeline [AND]
    │   ├── Access GitHub Actions secrets
    │   └── Inject backdoor into deployment artifact
    │
    └── 2.3.2 Lateral Movement from Compromised Service
              → Exploit shared network to reach auth-service DB
              → Extract admin credentials or session tokens from Redis
```

**Key Mitigations:**
- RS256 asymmetric JWT signing; private key in AWS Secrets Manager only (blocks 2.1.1)
- Zod update schemas explicitly exclude `role` field (blocks 2.1.2)
- Internal services bound to private VPC subnets; no public IPs (blocks 2.2.1)
- Integration tests assert that admin routes return 401/403 without valid admin JWT (blocks 2.2.2)
- CODEOWNERS and required reviews on all CI/CD configuration changes (blocks 2.3.1)
- mTLS between services; per-service DB credentials (blocks 2.3.2)

---

## 4. Attack Tree 3 — Payment Fraud

**Root Goal:** Perform unauthorised financial transactions or steal payment data

```
GOAL: Payment Fraud [OR]
│
├── 3.1 Manipulate Payment Intent [OR]
│   ├── 3.1.1 Submit Client-Controlled Amount to Create Intent (C) [STRIDE: T-02]
│   │         → POST /v1/payments/create-intent with { "amount": 1 }
│   │         → Requires: server calculates amount from client input, not DB
│   │
│   ├── 3.1.2 Race Condition on Payment Confirmation (H)
│   │         → Submit payment confirmation before Stripe webhook arrives
│   │         → Double-spend: order fulfilled before payment verified
│   │
│   └── 3.1.3 Webhook Replay Attack (H) [STRIDE: S-06]
│             → Capture and re-send a previously processed Stripe webhook
│             → Requires: no idempotency key tracking on processed events
│
├── 3.2 Exploit Refund Flow [OR]
│   ├── 3.2.1 Request Refund for Completed / Consumed Order (M) [STRIDE: T-05]
│   │         → POST /v1/refunds for an order in DELIVERED state
│   │         → Requires: missing state machine validation on refund eligibility
│   │
│   └── 3.2.2 IDOR on Refund Request (H) [STRIDE: I-02]
│             → POST /v1/refunds with another customer's orderId
│             → Requires: ownership check missing on refund controller
│
└── 3.3 Data Exfiltration of Payment Records [OR]
    ├── 3.3.1 SQL Injection into Order Query (H) [STRIDE: T-03]
    │         → Inject into order listing filter parameters
    │         → Extract full payment_transactions table
    │
    └── 3.3.2 Compromise Stripe Secret Key (C)
              ├── Extract from exposed environment variable
              └── Issue arbitrary charges or retrieve cardholder data via Stripe API
```

**Key Mitigations:**
- Payment amount always computed server-side from `order.total` in DB (blocks 3.1.1)
- Orders only fulfiled after `payment_intent.succeeded` webhook received and verified (blocks 3.1.2)
- Stripe event IDs stored in DB with unique constraint; duplicate events rejected (blocks 3.1.3)
- Refund state machine validates order status is `DELIVERED` or `FULFILLED` (blocks 3.2.1)
- Refund endpoint verifies `order.customerId === req.user.id` (blocks 3.2.2)
- Prisma parameterised queries prevent SQL injection (blocks 3.3.1)
- Stripe secret key stored in AWS Secrets Manager; never in application logs (blocks 3.3.2)

---

## 5. Attack Tree 4 — Data Exfiltration (Customer PII)

**Root Goal:** Extract customer personally identifiable information (PII) at scale

```
GOAL: Exfiltrate Customer PII [OR]
│
├── 4.1 Direct Database Access [OR]
│   ├── 4.1.1 SQL Injection via Unvalidated Input (H) [STRIDE: T-03]
│   │         → Filter/search parameters in product, appointment, or customer endpoints
│   │
│   ├── 4.1.2 Exposed Database Port (M) [STRIDE: I-06]
│   │         → PostgreSQL port 5432 accessible from internet
│   │         → Requires: misconfigured security group / VPC rule
│   │
│   └── 4.1.3 Compromised Database Credentials (H) [STRIDE: I-06]
│             → Credentials leaked via .env in source control
│             → Credentials in unencrypted application logs
│
├── 4.2 API-Level Enumeration [OR]
│   ├── 4.2.1 IDOR on Customer Profile Endpoint (C) [STRIDE: I-02]
│   │         → GET /v1/customers/:id with sequential IDs
│   │         → Enumerate all customer profiles
│   │
│   ├── 4.2.2 Broken Access Control on Appointment Table (H) [STRIDE: I-05]
│   │         → GET /v1/appointments without admin guard
│   │         → Returns all customer bookings with PII
│   │
│   └── 4.2.3 Verbose Error Messages Leaking Data (H) [STRIDE: I-01]
│             → Database constraint violation exposes email uniqueness
│             → Allows email enumeration
│
└── 4.3 Indirect Access [OR]
    ├── 4.3.1 Compromise Logging Pipeline (M) [STRIDE: I-09]
    │         → Loki/CloudWatch logs contain unredacted request bodies with PII
    │         → Attacker with log access extracts data at scale
    │
    └── 4.3.2 Exploit Backup Restore Flow (L)
              → Database backup accessible from S3 without proper access controls
              → Restore backup to attacker-controlled DB instance
```

**Key Mitigations:**
- Prisma ORM with parameterised queries everywhere; no raw query construction (blocks 4.1.1)
- PostgreSQL bound to private subnet; security group allows only service IPs (blocks 4.1.2)
- Secrets in AWS Secrets Manager; `.env` in `.gitignore`; CI/CD secret scanning (blocks 4.1.3)
- UUIDs as primary keys (not sequential integers) for all customer records (blocks 4.2.1)
- Admin guard middleware on all table-level listing endpoints (blocks 4.2.2)
- Generic error messages in production; error codes only (blocks 4.2.3)
- Request logger redaction of PII fields before writing (blocks 4.3.1)
- S3 backup bucket — private ACL, encrypted, versioned, access via IAM role only (blocks 4.3.2)

---

## 6. Attack Tree 5 — Denial of Service / Platform Disruption

**Root Goal:** Make the Lomash Wood platform unavailable to legitimate customers

```
GOAL: Platform Disruption [OR]
│
├── 5.1 Application-Layer DoS [OR]
│   ├── 5.1.1 Flood Authentication Endpoints (C) [STRIDE: D-01]
│   │         → Exhaust API gateway connection pool
│   │         → Prevent legitimate logins
│   │
│   ├── 5.1.2 Expensive Query Amplification (H) [STRIDE: D-03]
│   │         → Product filter with maximum page size and complex sorts
│   │         → Trigger full-table scans on product DB
│   │
│   └── 5.1.3 Large File Upload Bomb (H) [STRIDE: D-02]
│             → Upload 1GB file to /v1/uploads
│             → Exhaust storage, bandwidth, or processing resources
│
├── 5.2 Appointment / Slot Disruption [OR]
│   ├── 5.2.1 Booking Slot Exhaustion (M) [STRIDE: D-06]
│   │         → Script creates fake bookings filling all available slots
│   │         → Legitimate customers cannot book
│   │
│   └── 5.2.2 Race Condition Overbooking (H) [STRIDE: D-06]
│             → Concurrent POST /v1/appointments for same slot
│             → Corrupt availability data
│
└── 5.3 Infrastructure Disruption [OR]
    ├── 5.3.1 Redis Cache Poisoning (M) [STRIDE: D-05]
    │         → Inject large or malformed cache entries
    │         → Trigger memory exhaustion or cache stampede on expiry
    │
    └── 5.3.2 Webhook Queue Flooding (M) [STRIDE: D-04]
              → Send thousands of invalid Stripe webhook events
              → Exhaust database connection pool via failed writes
```

**Key Mitigations:**
- Per-IP and per-user rate limits via `express-rate-limit`; stricter on auth endpoints (blocks 5.1.1)
- Enforced `limit` and `offset` caps on all paginated endpoints; DB query timeouts (blocks 5.1.2)
- File upload size cap (e.g., 10MB); MIME type allowlist validation (blocks 5.1.3)
- Booking creation requires authenticated session; CAPTCHA for high-volume bot detection (blocks 5.2.1)
- Pessimistic DB lock on slot booking; unique constraint `(consultantId, slotStart)` (blocks 5.2.2)
- Redis `maxmemory-policy allkeys-lru`; connection auth required (blocks 5.3.1)
- Stripe signature check before queue insertion; invalid signatures short-circuit immediately (blocks 5.3.2)

---

## 7. Risk Register

| Tree | Root Goal | Highest Risk Node | Inherent Risk | Residual Risk (with mitigations) |
|---|---|---|---|---|
| AT-1 | Compromise Customer Account | Credential Stuffing | High | Medium |
| AT-2 | Gain Admin Access | Forge JWT with ADMIN Role | Critical | Low |
| AT-3 | Payment Fraud | Client-Controlled Payment Amount | Critical | Low |
| AT-4 | Exfiltrate Customer PII | IDOR on Customer Profile | Critical | Low |
| AT-5 | Platform Disruption | Flood Auth Endpoints | High | Low |

---

## 8. Assumptions

1. Attackers are assumed to have read-only knowledge of the public API (documented in `docs/api/openapi.yaml`).
2. Insider threats with direct database access are considered out-of-scope for application-layer controls but are addressed by infrastructure-level mitigations.
3. Physical security of AWS infrastructure is delegated to AWS shared responsibility model.
4. Stripe's own fraud detection (Radar) provides a secondary layer of payment fraud mitigation.

---

## 9. Review & Approval

| Role | Name | Date |
|---|---|---|
| Security Lead | TBD | — |
| Backend Architect | TBD | — |

**Next Review Date:** 2026-08-19