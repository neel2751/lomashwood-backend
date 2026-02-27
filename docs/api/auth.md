# Auth API

Base path: `/v1/auth`

---

## Overview

The auth-service handles user registration, login, session management, and role-based access control. Authentication uses short-lived JWT access tokens validated by the api-gateway on every protected request.

All tokens are signed with `HS256`. The token payload contains `{ sub, role, sessionId, jti }`. On logout, the `jti` is written to a Redis blacklist with TTL equal to the token's remaining lifetime.

---

## Endpoints

### POST /v1/auth/register

Register a new customer account.

**Auth required:** No

**Request Body**

```json
{
  "name": "Jane Smith",
  "email": "jane@example.com",
  "password": "SecurePass123!"
}
```

| Field | Type | Rules |
|---|---|---|
| `name` | string | min 2 chars |
| `email` | string | valid email format, unique |
| `password` | string | min 8 chars, must contain upper, lower, number |

**Response `201`**

```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "expiresIn": 3600,
  "user": {
    "id": "uuid",
    "name": "Jane Smith",
    "email": "jane@example.com",
    "role": "CUSTOMER",
    "createdAt": "2026-02-01T10:00:00Z"
  }
}
```

**Errors**

| Status | Code | Reason |
|---|---|---|
| 409 | `EMAIL_TAKEN` | Email already registered |
| 422 | `VALIDATION_ERROR` | Invalid field values |

---

### POST /v1/auth/login

Authenticate with email and password.

**Auth required:** No

**Request Body**

```json
{
  "email": "jane@example.com",
  "password": "SecurePass123!"
}
```

**Response `200`**

```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "expiresIn": 3600,
  "user": {
    "id": "uuid",
    "name": "Jane Smith",
    "email": "jane@example.com",
    "role": "CUSTOMER",
    "createdAt": "2026-02-01T10:00:00Z"
  }
}
```

**Errors**

| Status | Code | Reason |
|---|---|---|
| 401 | `INVALID_CREDENTIALS` | Email not found or password incorrect |
| 401 | `ACCOUNT_DEACTIVATED` | Account has been deactivated |
| 422 | `VALIDATION_ERROR` | Missing required fields |

---

### POST /v1/auth/logout

Invalidate the current session. The JWT `jti` is written to the Redis token blacklist.

**Auth required:** Yes

**Request Body:** None

**Response `204`:** No content

**Errors**

| Status | Code | Reason |
|---|---|---|
| 401 | `UNAUTHORIZED` | Missing or expired token |

---

### GET /v1/auth/me

Return the profile of the currently authenticated user.

**Auth required:** Yes

**Response `200`**

```json
{
  "id": "uuid",
  "name": "Jane Smith",
  "email": "jane@example.com",
  "role": "CUSTOMER",
  "createdAt": "2026-02-01T10:00:00Z"
}
```

**Errors**

| Status | Code | Reason |
|---|---|---|
| 401 | `UNAUTHORIZED` | Missing or expired token |

---

## Token Usage

Include the access token in the `Authorization` header on all protected requests:

```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

Tokens expire after 1 hour (`expiresIn: 3600`). After expiry, re-authenticate via `POST /v1/auth/login`.

---

## Roles

| Role | Description |
|---|---|
| `CUSTOMER` | Standard registered user. Access to own profile, bookings, orders. |
| `ADMIN` | Full access to CMS, products, appointments table, analytics. |
| `EDITOR` | Access to content management (blog, pages, media) only. |

---

## Password Policy

- Minimum 8 characters
- At least one uppercase letter
- At least one lowercase letter
- At least one digit
- Stored as bcrypt hash (cost factor 12)
- Never returned in any API response

---

## Security Notes

- Rate limit on `/v1/auth/login`: 20 requests per 15 minutes per IP
- Rate limit on `/v1/auth/register`: 10 requests per 15 minutes per IP
- Failed login attempts are logged with structured logger but not exposed to clients
- CSRF protection is enforced via `SameSite=Strict` cookie policy on web sessions