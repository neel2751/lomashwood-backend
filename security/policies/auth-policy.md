# Authentication Policy — Lomash Wood

**Document ID:** LW-SEC-POL-001  
**Version:** 2.1  
**Classification:** Confidential — Internal Use Only  
**Owner:** Head of Engineering  
**Last Reviewed:** 2026-02-19  
**Next Review Date:** 2026-08-19  
**Status:** Active

---

## 1. Purpose

This policy defines the standards, controls, and requirements for all authentication mechanisms within the Lomash Wood backend platform. It governs how users (customers, administrators, service accounts) prove their identity to the system, and how the platform issues, validates, and revokes authentication credentials.

This policy applies to all components of the Lomash Wood microservices architecture and must be implemented consistently across the `auth-service`, `api-gateway`, and any other service that handles identity verification.

---

## 2. Scope

This policy applies to:

- All human user accounts (customers, administrators, content managers, support staff)
- All service-to-service authentication within the internal microservices mesh
- All API clients consuming the public API Gateway
- All third-party integrations accessing Lomash Wood systems (Stripe, AWS, Twilio, Firebase)
- All environments: development, staging, and production

---

## 3. Definitions

| Term | Definition |
|---|---|
| **Authentication** | The process of verifying that an entity is who it claims to be |
| **JWT** | JSON Web Token — a signed token carrying identity claims |
| **Access Token** | A short-lived JWT used to authorise API requests |
| **Refresh Token** | A long-lived token used to obtain new access tokens without re-authentication |
| **Session** | A server-side record linking a refresh token to a user and device fingerprint |
| **MFA** | Multi-Factor Authentication — requiring a second proof of identity beyond password |
| **Better Auth** | The authentication framework used by the Lomash Wood platform |
| **Token Blacklist** | A Redis-backed store of invalidated token identifiers |

---

## 4. Authentication Standards

### 4.1 Identity Verification

#### 4.1.1 Customer Accounts

All customer account authentication must use the following flow:

1. Customer submits email address and password via `POST /v1/auth/login`
2. The `auth-service` retrieves the user record by email (case-insensitive, trimmed)
3. The supplied password is verified against the stored Argon2id hash
4. Upon successful verification, an access token and refresh token pair are issued
5. The session record is created in the database with `userId`, `deviceFingerprint`, `ipAddress`, `userAgent`, and `createdAt`

**Failed authentication handling:**
- Increment `failedLoginAttempts` counter on the user record
- After **5 consecutive failures** within a 15-minute window: lock the account and send an unlock email
- Return identical error responses for invalid email and invalid password (`"Invalid credentials"`) to prevent user enumeration
- Log all failed attempts with timestamp, IP address, and User-Agent to the structured audit log

#### 4.1.2 Administrator Accounts

Administrator accounts are subject to all customer account requirements **plus**:

- **MFA is mandatory** for all accounts with `ADMIN`, `CONTENT_MANAGER`, or `SUPPORT` roles
- MFA must use Time-based One-Time Password (TOTP) via an authenticator application (e.g., Google Authenticator, Authy)
- SMS OTP is permitted as a fallback only — not as a primary MFA method
- Admin login must be performed via a separate admin portal endpoint (`POST /v1/auth/admin/login`) with additional rate limiting
- Backup recovery codes (10 single-use codes) must be generated at MFA setup and stored hashed using bcrypt

#### 4.1.3 Service-to-Service Authentication

Internal microservice communication must use:

- **Mutual TLS (mTLS)** for all service-to-service HTTP calls within the Kubernetes cluster
- Service identity certificates issued by the internal Certificate Authority (managed via cert-manager)
- Certificates rotated automatically every 90 days
- No service may call another service using a human user's JWT

### 4.2 Token Standards

#### 4.2.1 Access Tokens (JWT)

| Property | Requirement |
|---|---|
| **Algorithm** | RS256 (asymmetric) — private key held exclusively by `auth-service` |
| **Expiry (`exp`)** | 15 minutes |
| **Issuer (`iss`)** | `https://auth.lomashwood.com` |
| **Audience (`aud`)** | `lomashwood-api` |
| **Subject (`sub`)** | User UUID (non-sequential, UUIDv4) |
| **Claims** | `sub`, `role`, `sessionId`, `iat`, `exp`, `iss`, `aud` — no PII in token payload |
| **Key ID (`kid`)** | Included to support key rotation without service downtime |

The following are **strictly prohibited** in JWT payloads:
- Email addresses
- Full names
- Phone numbers
- Payment card data
- Any other personally identifiable information

#### 4.2.2 Refresh Tokens

| Property | Requirement |
|---|---|
| **Format** | Cryptographically random 256-bit value (generated via `crypto.randomBytes(32)`) |
| **Storage (server)** | SHA-256 hash stored in `sessions` table |
| **Storage (client)** | `httpOnly`, `Secure`, `SameSite=Strict` cookie — never in `localStorage` |
| **Expiry** | 30 days for standard users; 8 hours for administrator accounts |
| **Rotation** | Refresh token is rotated on every use (refresh token reuse invalidates the session) |
| **Binding** | Bound to `userId`, `deviceFingerprint`, and original `ipAddress` at creation |

#### 4.2.3 Token Validation

The `api-gateway` must validate all inbound JWTs by:

1. Verifying the RS256 signature against the current public key from the JWKS endpoint
2. Confirming `exp` has not elapsed
3. Confirming `iss` matches `https://auth.lomashwood.com`
4. Confirming `aud` matches `lomashwood-api`
5. Confirming the token's `jti` (JWT ID) is **not present** in the Redis token blacklist
6. Confirming the `sessionId` claim corresponds to an active, non-revoked session record

Tokens failing **any** of the above checks must be rejected with `HTTP 401 Unauthorized`.

**Algorithm enforcement:** The JWT verification library must be configured with `algorithms: ['RS256']` exclusively. Accepting HS256 or any other algorithm is strictly forbidden (see LW-PENTEST-2025 finding LW-002).

### 4.3 Session Management

#### 4.3.1 Session Lifecycle

```
Login ──► Create Session (DB + Redis) ──► Issue Access Token + Refresh Token
                │
                ▼
         Access Token Expires (15 min)
                │
                ▼
         Client sends Refresh Token ──► Validate ──► Rotate Refresh Token ──► Issue new Access Token
                │
                ▼
         Logout / Expiry ──► Invalidate Session ──► Blacklist Access Token JTI
```

#### 4.3.2 Session Invalidation Triggers

A session must be immediately invalidated (refresh token revoked, access token JTI blacklisted) when:

- User explicitly logs out (`POST /v1/auth/logout`)
- User changes their password
- User changes their email address
- Administrator revokes the user's session via admin panel
- The session's `deviceFingerprint` changes significantly between requests
- A refresh token reuse attack is detected (concurrent use of the same refresh token)
- Account is locked due to failed login attempts
- Account is deactivated or deleted

#### 4.3.3 Concurrent Sessions

- Standard customer accounts: maximum **5 concurrent sessions** (across different devices)
- Administrator accounts: maximum **2 concurrent sessions**
- Exceeding the limit invalidates the oldest session automatically
- Users can view and revoke their active sessions via `GET /v1/auth/sessions`

### 4.4 Password Requirements

Passwords are governed in detail by the [Password Policy (LW-SEC-POL-003)](./password-policy.md). Summary requirements:

| Property | Requirement |
|---|---|
| **Minimum length** | 12 characters |
| **Maximum length** | 128 characters |
| **Complexity** | At least 1 uppercase, 1 lowercase, 1 digit, 1 special character |
| **Hashing algorithm** | Argon2id |
| **Argon2id parameters** | `memoryCost: 65536` (64MB), `timeCost: 3`, `parallelism: 4` |
| **Breach check** | Checked against HaveIBeenPwned API (k-anonymity model) at registration and password change |
| **History** | Last 12 passwords may not be reused |

### 4.5 Password Reset

1. User submits email to `POST /v1/auth/password-reset/request`
2. System generates a cryptographically random 256-bit reset token
3. Token is stored as a SHA-256 hash in the `password_reset_tokens` table with a **15-minute TTL**
4. A single-use reset link is emailed to the verified address
5. Response is always `HTTP 200` regardless of whether the email exists (prevents enumeration)
6. On reset link submission (`POST /v1/auth/password-reset/confirm`):
   - Verify token hash exists and has not expired
   - Delete the token immediately (single-use)
   - Update the password hash
   - Invalidate all active sessions for the user
   - Send a password-change confirmation email

---

## 5. Rate Limiting Requirements

The following rate limits apply to all authentication endpoints and are enforced at the API Gateway level:

| Endpoint | Limit | Window | Response |
|---|---|---|---|
| `POST /v1/auth/login` | 10 requests | 15 minutes per IP | `429 Too Many Requests` + `Retry-After` header |
| `POST /v1/auth/register` | 5 requests | 1 hour per IP | `429 Too Many Requests` |
| `POST /v1/auth/password-reset/request` | 3 requests | 1 hour per email | `429 Too Many Requests` |
| `POST /v1/auth/refresh` | 30 requests | 15 minutes per user | `429 Too Many Requests` |
| `POST /v1/auth/admin/login` | 5 requests | 15 minutes per IP | `429 Too Many Requests` + alert to Security Lead |

All rate limit events must be logged to the structured audit log with the source IP, endpoint, and timestamp.

---

## 6. OAuth 2.0 / Social Login

If social login (Google, Apple) is introduced in future:

- Use the Authorization Code Flow with PKCE exclusively
- Never use the Implicit Flow
- Validate the `id_token` signature against the provider's JWKS endpoint
- Map the external identity to an internal Lomash Wood user account on first login
- Social login accounts are subject to all session management rules in this policy

---

## 7. API Key Authentication

For server-to-server integrations (e.g., analytics clients, webhook consumers):

- API keys are 256-bit cryptographically random values prefixed with `lw_` (e.g., `lw_sk_...`)
- API keys are stored as SHA-256 hashes in the database — the plaintext key is shown only once at creation
- API keys must be transmitted via the `Authorization: Bearer` header — never in URL query parameters
- API keys carry a fixed set of permissions defined at creation time and cannot be escalated
- API keys expire after 365 days and must be rotated via the admin panel or `rotate-api-tokens.sh`
- Unused API keys (no activity for 90 days) are automatically revoked

---

## 8. Audit Logging Requirements

All authentication events must be written to the structured audit log with the following fields:

| Field | Description |
|---|---|
| `eventType` | e.g., `AUTH_LOGIN_SUCCESS`, `AUTH_LOGIN_FAILURE`, `AUTH_LOGOUT`, `AUTH_TOKEN_REFRESH`, `AUTH_SESSION_REVOKED`, `AUTH_PASSWORD_RESET` |
| `userId` | UUID of the authenticated user (null for pre-auth failures) |
| `sessionId` | UUID of the affected session |
| `ipAddress` | Source IP address (X-Forwarded-For trusted header) |
| `userAgent` | Browser/client User-Agent string |
| `timestamp` | ISO 8601 UTC timestamp |
| `success` | Boolean |
| `failureReason` | Reason code for failures (never expose to client) |

Audit logs are retained for a minimum of **2 years** per the [Data Retention Policy (LW-SEC-POL-002)](./data-retention.md).

---

## 9. Prohibited Practices

The following are explicitly prohibited and constitute a policy violation:

- Storing plaintext passwords in any form (database, logs, configuration files, memory dumps)
- Storing JWTs or refresh tokens in `localStorage` or `sessionStorage`
- Using symmetric algorithms (HS256, HS384, HS512) for JWT signing
- Transmitting credentials in URL query parameters or GET request bodies
- Logging passwords, tokens, or session identifiers in application logs
- Hard-coding credentials, secrets, or API keys in source code
- Sharing authentication credentials between users or environments
- Disabling or bypassing authentication middleware for convenience in any environment

---

## 10. Exceptions

Any deviation from this policy requires written approval from the Head of Engineering and must be:

- Documented in the project's ADR (Architecture Decision Record) directory
- Time-limited with a defined remediation plan
- Reviewed at the next security review cycle

---

## 11. Review & Compliance

This policy is reviewed semi-annually or following any security incident affecting authentication systems. Compliance is validated during annual penetration testing (see `security/pentest-reports/`).

| Role | Responsibility |
|---|---|
| Head of Engineering | Policy owner; approves exceptions |
| Security Lead | Reviews and updates policy; validates implementation |
| Backend Architects | Implement controls in `auth-service` and `api-gateway` |
| DevOps Lead | Enforces infrastructure-level controls (mTLS, secret management) |

---

*Lomash Wood Ltd — Confidential. Do not distribute outside the engineering organisation.*