# Sequence Diagram — Auth Login Flow

## Overview

Covers the complete authentication lifecycle: registration, email verification, login (access + refresh token issuance), token refresh, and logout. Includes the Better Auth session model and Redis token blacklist mechanics.

---

## 1. User Registration

```
Client                API Gateway           auth-service         PostgreSQL          Redis              notification-svc
  │                       │                      │                   │                 │                      │
  │ POST /v1/auth/register │                      │                   │                 │                      │
  │ { email, password,    │                      │                   │                 │                      │
  │   firstName, lastName}│                      │                   │                 │                      │
  │──────────────────────▶│                      │                   │                 │                      │
  │                       │ Zod validate body    │                   │                 │                      │
  │                       │ Rate-limit check     │                   │                 │                      │
  │                       │ (5 req/hr per IP)    │                   │                 │                      │
  │                       │─────────────────────▶│                   │                 │                      │
  │                       │                      │ SELECT user       │                 │                      │
  │                       │                      │ WHERE email=?     │                 │                      │
  │                       │                      │──────────────────▶│                 │                      │
  │                       │                      │ ◀── null (unique) │                 │                      │
  │                       │                      │ bcrypt.hash(pw,12)│                 │                      │
  │                       │                      │ INSERT INTO users │                 │                      │
  │                       │                      │──────────────────▶│                 │                      │
  │                       │                      │ ◀── { userId }    │                 │                      │
  │                       │                      │ Generate 6-digit  │                 │                      │
  │                       │                      │ OTP               │                 │                      │
  │                       │                      │ SET otp:{userId}  │                 │                      │
  │                       │                      │ TTL 10 min        │                 │                      │
  │                       │                      │────────────────────────────────────▶│                      │
  │                       │                      │ Publish           │                 │                      │
  │                       │                      │ "user.created"    │                 │                      │
  │                       │                      │ → event bus       │                 │                 ──────┤
  │                       │                      │                   │                 │    consume event      │
  │                       │                      │                   │                 │    send welcome email │
  │                       │                      │                   │                 │    + OTP via SES      │
  │ ◀─────────────────────│◀─────────────────────│                   │                 │                      │
  │ 201 { userId, message:│                      │                   │                 │                      │
  │  "Check your email" } │                      │                   │                 │                      │
```

---

## 2. Email Verification (OTP)

```
Client                API Gateway           auth-service         PostgreSQL          Redis
  │                       │                      │                   │                 │
  │ POST /v1/auth/verify  │                      │                   │                 │
  │ { userId, otp: "123456" }                    │                   │                 │
  │──────────────────────▶│─────────────────────▶│                   │                 │
  │                       │                      │ GET otp:{userId}  │                 │
  │                       │                      │────────────────────────────────────▶│
  │                       │                      │ ◀── "123456"      │                 │
  │                       │                      │ Compare OTP       │                 │
  │                       │                      │ UPDATE users      │                 │
  │                       │                      │ SET isVerified=true                 │
  │                       │                      │──────────────────▶│                 │
  │                       │                      │ DEL otp:{userId}  │                 │
  │                       │                      │────────────────────────────────────▶│
  │ ◀─────────────────────│◀─────────────────────│                   │                 │
  │ 200 { message: "Email │                      │                   │                 │
  │       verified" }     │                      │                   │                 │
```

---

## 3. Login — Happy Path

```
Client                API Gateway           auth-service         PostgreSQL          Redis
  │                       │                      │                   │                 │
  │ POST /v1/auth/login   │                      │                   │                 │
  │ { email, password }   │                      │                   │                 │
  │──────────────────────▶│                      │                   │                 │
  │                       │ Zod validate         │                   │                 │
  │                       │ Rate-limit: 10/15min │                   │                 │
  │                       │ per IP               │                   │                 │
  │                       │─────────────────────▶│                   │                 │
  │                       │                      │ SELECT * FROM     │                 │
  │                       │                      │ users WHERE       │                 │
  │                       │                      │ email = ?         │                 │
  │                       │                      │──────────────────▶│                 │
  │                       │                      │ ◀── User row      │                 │
  │                       │                      │                   │                 │
  │                       │                      │ bcrypt.compare(   │                 │
  │                       │                      │  input, hash)     │                 │
  │                       │                      │ → true            │                 │
  │                       │                      │                   │                 │
  │                       │                      │ ── Sign tokens ── │                 │
  │                       │                      │ accessToken =     │                 │
  │                       │                      │  jwt.sign(RS256,  │                 │
  │                       │                      │  exp: 15min)      │                 │
  │                       │                      │ refreshToken =    │                 │
  │                       │                      │  crypto.random()  │                 │
  │                       │                      │  hashed           │                 │
  │                       │                      │                   │                 │
  │                       │                      │ INSERT INTO       │                 │
  │                       │                      │ sessions { token  │                 │
  │                       │                      │  hash, userId,    │                 │
  │                       │                      │  ip, userAgent,   │                 │
  │                       │                      │  expiresAt: +7d } │                 │
  │                       │                      │──────────────────▶│                 │
  │                       │                      │ ◀── { sessionId } │                 │
  │                       │                      │                   │                 │
  │                       │                      │ SET session:      │                 │
  │                       │                      │ {sessionId}       │                 │
  │                       │                      │ = { userId, role }│                 │
  │                       │                      │ TTL 7d            │                 │
  │                       │                      │────────────────────────────────────▶│
  │                       │                      │ UPDATE users SET  │                 │
  │                       │                      │ lastLoginAt=NOW() │                 │
  │                       │                      │──────────────────▶│                 │
  │ ◀─────────────────────│◀─────────────────────│                   │                 │
  │ 200 {                 │ Set-Cookie:          │                   │                 │
  │  accessToken: "eyJ.." │ __Host-refresh=<tok> │                   │                 │
  │  user: { id, email,  │ HttpOnly; Secure;    │                   │                 │
  │    role, firstName } }│ SameSite=Strict;     │                   │                 │
  │                       │ Max-Age=604800        │                   │                 │
```

---

## 4. Login — Failed Attempts (Brute Force Protection)

```
Client                API Gateway           auth-service         Redis
  │                       │                      │                   │
  │ POST /v1/auth/login   │                      │                   │
  │ { wrong password }    │                      │                   │
  │──────────────────────▶│                      │                   │
  │                       │ Rate-limit check:    │                   │
  │                       │ INCR rate:{ip}:login │                   │
  │                       │ EXPIRE 900 (15 min)  │                   │
  │                       │─────────────────────────────────────────▶│
  │                       │ ◀── count: 3         │                   │
  │                       │ count < 10 → proceed │                   │
  │                       │─────────────────────▶│                   │
  │                       │                      │ bcrypt.compare    │
  │                       │                      │ → false           │
  │ ◀─────────────────────│◀─────────────────────│                   │
  │ 401 { code: "INVALID  │                      │                   │
  │   _CREDENTIALS" }     │                      │                   │
  │                       │                      │                   │
  │  ... 7 more attempts  │                      │                   │
  │                       │                      │                   │
  │ POST /v1/auth/login   │                      │                   │
  │──────────────────────▶│                      │                   │
  │                       │ INCR rate:{ip}:login │                   │
  │                       │─────────────────────────────────────────▶│
  │                       │ ◀── count: 10        │                   │
  │                       │ count ≥ 10 → BLOCK   │                   │
  │ ◀─────────────────────│                      │                   │
  │ 429 { code: "RATE_    │                      │                   │
  │   LIMIT_EXCEEDED",    │                      │                   │
  │   retryAfter: 600 }   │                      │                   │
  │ Retry-After: 600      │                      │                   │
```

---

## 5. Authenticated Request — Token Verification

```
Client                API Gateway           auth-service (internal)   Target Service
  │                       │                         │                      │
  │ GET /v1/appointments  │                         │                      │
  │ Authorization:        │                         │                      │
  │  Bearer eyJ...        │                         │                      │
  │──────────────────────▶│                         │                      │
  │                       │ Extract JWT from header │                      │
  │                       │ Verify RS256 signature  │                      │
  │                       │ (using cached pub key)  │                      │
  │                       │                         │                      │
  │                       │ Check token blacklist:  │                      │
  │                       │ EXISTS blacklist:{jti}  │                      │
  │                       │ → false (not revoked)   │                      │
  │                       │                         │                      │
  │                       │ GET /internal/sessions/ │                      │
  │                       │ {sessionId}/verify      │                      │
  │                       │────────────────────────▶│                      │
  │                       │                         │ GET session:{sid}    │
  │                       │                         │ from Redis           │
  │                       │                         │ → { userId, role }   │
  │                       │ ◀── 200 { valid: true } │                      │
  │                       │                         │                      │
  │                       │ Attach headers to       │                      │
  │                       │ proxied request:        │                      │
  │                       │ X-User-Id: uuid         │                      │
  │                       │ X-User-Role: CUSTOMER   │                      │
  │                       │ X-Session-Id: uuid      │                      │
  │                       │──────────────────────────────────────────────▶│
  │                       │                         │                      │ Controller
  │                       │                         │                      │ reads headers
  │                       │                         │                      │ (no re-verify)
  │ ◀─────────────────────│◀──────────────────────────────────────────────│
  │ 200 { appointments }  │                         │                      │
```

---

## 6. Access Token Refresh

```
Client                API Gateway           auth-service         PostgreSQL          Redis
  │                       │                      │                   │                 │
  │ POST /v1/auth/refresh │                      │                   │                 │
  │ Cookie: __Host-refresh│                      │                   │                 │
  │  =<refresh_token>     │                      │                   │                 │
  │──────────────────────▶│─────────────────────▶│                   │                 │
  │                       │                      │ Hash incoming     │                 │
  │                       │                      │ refresh token     │                 │
  │                       │                      │ SELECT * FROM     │                 │
  │                       │                      │ sessions WHERE    │                 │
  │                       │                      │ token = hash AND  │                 │
  │                       │                      │ revokedAt IS NULL │                 │
  │                       │                      │ AND expiresAt>NOW │                 │
  │                       │                      │──────────────────▶│                 │
  │                       │                      │ ◀── Session row   │                 │
  │                       │                      │                   │                 │
  │                       │                      │ Rotate refresh    │                 │
  │                       │                      │ token (one-time   │                 │
  │                       │                      │ use — sliding):   │                 │
  │                       │                      │ UPDATE sessions   │                 │
  │                       │                      │ SET token=newHash │                 │
  │                       │                      │ expiresAt=+7d     │                 │
  │                       │                      │──────────────────▶│                 │
  │                       │                      │                   │                 │
  │                       │                      │ Sign new          │                 │
  │                       │                      │ accessToken RS256 │                 │
  │                       │                      │ exp: +15min       │                 │
  │                       │                      │                   │                 │
  │                       │                      │ Update Redis TTL: │                 │
  │                       │                      │ EXPIRE session:   │                 │
  │                       │                      │ {sessionId} 7d    │                 │
  │                       │                      │────────────────────────────────────▶│
  │ ◀─────────────────────│◀─────────────────────│                   │                 │
  │ 200 {                 │ Set-Cookie:          │                   │                 │
  │  accessToken: "eyJ.." │ __Host-refresh=<new> │                   │                 │
  │ }                     │ HttpOnly; Secure      │                   │                 │
```

---

## 7. Logout

```
Client                API Gateway           auth-service         PostgreSQL          Redis
  │                       │                      │                   │                 │
  │ POST /v1/auth/logout  │                      │                   │                 │
  │ Authorization:        │                      │                   │                 │
  │  Bearer eyJ...        │                      │                   │                 │
  │ Cookie: __Host-refresh│                      │                   │                 │
  │──────────────────────▶│─────────────────────▶│                   │                 │
  │                       │                      │ Extract jti from  │                 │
  │                       │                      │ access token      │                 │
  │                       │                      │                   │                 │
  │                       │                      │ Blacklist access  │                 │
  │                       │                      │ token (valid for  │                 │
  │                       │                      │ remaining TTL):   │                 │
  │                       │                      │ SET blacklist:    │                 │
  │                       │                      │ token:{jti} "1"   │                 │
  │                       │                      │ EX remainingTTL   │                 │
  │                       │                      │────────────────────────────────────▶│
  │                       │                      │                   │                 │
  │                       │                      │ Revoke session:   │                 │
  │                       │                      │ UPDATE sessions   │                 │
  │                       │                      │ SET revokedAt=NOW │                 │
  │                       │                      │ WHERE sessionId=? │                 │
  │                       │                      │──────────────────▶│                 │
  │                       │                      │                   │                 │
  │                       │                      │ Delete Redis      │                 │
  │                       │                      │ session record:   │                 │
  │                       │                      │ DEL session:{sid} │                 │
  │                       │                      │────────────────────────────────────▶│
  │ ◀─────────────────────│◀─────────────────────│                   │                 │
  │ 200 { message:        │ Set-Cookie:          │                   │                 │
  │  "Logged out" }       │ __Host-refresh=;     │                   │                 │
  │                       │ Max-Age=0; Secure     │                   │                 │
  │                       │ (clears cookie)       │                   │                 │
```

---

## Error States Summary

| Scenario | HTTP Status | Error Code | Recovery |
|----------|------------|------------|---------|
| Email already registered | 409 | `EMAIL_ALREADY_EXISTS` | Use login or reset password |
| Invalid OTP | 400 | `INVALID_OTP` | Request new OTP |
| OTP expired | 400 | `OTP_EXPIRED` | Request new OTP |
| Wrong password | 401 | `INVALID_CREDENTIALS` | Retry (rate-limited) |
| Rate limit exceeded | 429 | `RATE_LIMIT_EXCEEDED` | Wait `Retry-After` seconds |
| Expired access token | 401 | `TOKEN_EXPIRED` | Call `/v1/auth/refresh` |
| Revoked session | 401 | `SESSION_REVOKED` | Re-login |
| Token blacklisted | 401 | `TOKEN_REVOKED` | Re-login |
| Expired refresh token | 401 | `REFRESH_TOKEN_EXPIRED` | Re-login |