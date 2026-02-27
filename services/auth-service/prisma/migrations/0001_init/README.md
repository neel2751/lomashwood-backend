# Migration: 0001_init

## Overview
This is the initial database migration for the `auth-service`. It sets up the complete authentication and authorization schema including users, sessions, roles, permissions, and audit logs.

---

## 📦 Service
**Service:** `auth-service`  
**Database:** PostgreSQL  
**ORM:** Prisma  
**Migration ID:** `0001_init`  
**Created:** 2026-02-20

---

## 🗄️ Tables Created

### `users`
Stores registered user accounts.

| Column | Type | Description |
|--------|------|-------------|
| `id` | `String (UUID)` | Primary key |
| `email` | `String` | Unique email address |
| `password` | `String` | Hashed password (bcrypt) |
| `role` | `Enum` | `USER`, `ADMIN`, `SUPER_ADMIN` |
| `emailVerified` | `Boolean` | Whether email is verified |
| `emailVerifiedAt` | `DateTime?` | When email was verified |
| `isActive` | `Boolean` | Whether account is active |
| `createdAt` | `DateTime` | Record creation timestamp |
| `updatedAt` | `DateTime` | Record update timestamp |

---

### `sessions`
Stores active user sessions for token management.

| Column | Type | Description |
|--------|------|-------------|
| `id` | `String (UUID)` | Primary key / Session ID |
| `userId` | `String` | Foreign key → `users.id` |
| `token` | `String` | JWT token (hashed) |
| `isActive` | `Boolean` | Whether session is active |
| `expiresAt` | `DateTime` | Session expiry time |
| `createdAt` | `DateTime` | Record creation timestamp |
| `updatedAt` | `DateTime` | Record update timestamp |

---

### `refresh_tokens`
Stores refresh tokens for JWT renewal.

| Column | Type | Description |
|--------|------|-------------|
| `id` | `String (UUID)` | Primary key |
| `userId` | `String` | Foreign key → `users.id` |
| `token` | `String` | Hashed refresh token |
| `expiresAt` | `DateTime` | Token expiry time |
| `createdAt` | `DateTime` | Record creation timestamp |

---

### `email_verifications`
Stores email verification tokens.

| Column | Type | Description |
|--------|------|-------------|
| `id` | `String (UUID)` | Primary key |
| `userId` | `String` | Foreign key → `users.id` |
| `token` | `String` | Verification token |
| `expiresAt` | `DateTime` | Token expiry time |
| `createdAt` | `DateTime` | Record creation timestamp |

---

### `password_resets`
Stores password reset tokens.

| Column | Type | Description |
|--------|------|-------------|
| `id` | `String (UUID)` | Primary key |
| `userId` | `String` | Foreign key → `users.id` |
| `token` | `String` | Reset token (hashed) |
| `expiresAt` | `DateTime` | Token expiry time |
| `usedAt` | `DateTime?` | When token was used |
| `createdAt` | `DateTime` | Record creation timestamp |

---

### `audit_logs`
Stores authentication-related audit events.

| Column | Type | Description |
|--------|------|-------------|
| `id` | `String (UUID)` | Primary key |
| `userId` | `String?` | Foreign key → `users.id` (nullable) |
| `action` | `String` | Event type (e.g. `LOGIN`, `LOGOUT`, `PASSWORD_RESET`) |
| `ipAddress` | `String?` | Client IP address |
| `userAgent` | `String?` | Client user agent |
| `metadata` | `Json?` | Additional event metadata |
| `createdAt` | `DateTime` | Record creation timestamp |

---

## 🔑 Enums Created

### `Role`
```
USER
ADMIN
SUPER_ADMIN
```

---

## 🔗 Relations

```
users ──< sessions
users ──< refresh_tokens
users ──< email_verifications
users ──< password_resets
users ──< audit_logs
```

---

## ▶️ How to Apply

```bash
cd services/auth-service

npx prisma migrate dev

npx prisma migrate deploy

npx prisma generate
```

---

## ⏪ How to Roll Back

Prisma does not support automatic rollbacks. To undo this migration manually:

```bash

npx prisma migrate reset 
```

Or manually run the inverse SQL in your database client.

---

## ⚠️ Notes

- This migration must be run before starting the `auth-service` for the first time.
- All tokens are stored hashed — never in plain text.
- The `audit_logs` table is append-only; records should never be deleted.
- Ensure `DATABASE_URL` is set in your `.env` before running migrations.