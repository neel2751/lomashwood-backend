# Password Policy — Lomash Wood

**Document ID:** LW-SEC-POL-003  
**Version:** 1.3  
**Classification:** Confidential — Internal Use Only  
**Owner:** Head of Engineering  
**Last Reviewed:** 2026-02-19  
**Next Review Date:** 2026-08-19  
**Status:** Active

---

## 1. Purpose

This policy defines password standards for all human user accounts on the Lomash Wood platform. It specifies minimum complexity requirements, secure storage practices, breach detection controls, and lifecycle management rules. The policy aligns with NIST SP 800-63B (Digital Identity Guidelines) and OWASP Authentication Cheat Sheet recommendations.

---

## 2. Scope

This policy applies to:

- All customer accounts registered on the Lomash Wood platform
- All administrator, content manager, and support staff accounts
- All internal tooling accounts (database clients, monitoring systems, CI/CD tooling)
- Passwords stored in AWS Secrets Manager, environment variables, and configuration files

Service account passwords and API keys are governed separately by the [Authentication Policy (LW-SEC-POL-001)](./auth-policy.md).

---

## 3. Password Requirements

### 3.1 Composition Rules

| Property | Customer Accounts | Admin / Staff Accounts |
|---|---|---|
| **Minimum length** | 12 characters | 16 characters |
| **Maximum length** | 128 characters | 128 characters |
| **Uppercase letters** | At least 1 | At least 1 |
| **Lowercase letters** | At least 1 | At least 1 |
| **Digits (0–9)** | At least 1 | At least 2 |
| **Special characters** | At least 1 (`!@#$%^&*()-_=+[]{}|;:,.<>?`) | At least 2 |
| **Unicode support** | Yes | Yes |
| **Spaces** | Permitted (not leading/trailing) | Permitted |

### 3.2 Composition Anti-Patterns (Rejected)

The following password patterns are **rejected at validation time** regardless of meeting the length and character requirements:

- Passwords consisting of a keyboard walk (e.g., `Qwerty123!`, `Asdf1234!`)
- Passwords containing the user's email address, name, or username
- Passwords matching common password patterns (e.g., `Password123!`, `Welcome2024!`)
- Passwords found in the HaveIBeenPwned (HIBP) database (see Section 4)
- Passwords from the previous 12 used passwords for that account

### 3.3 NIST SP 800-63B Alignment

In alignment with NIST guidance:

- **Mandatory complexity rules are minimised** — length is the primary control (longer passwords are more secure than complex short ones)
- **Periodic mandatory rotation is not required** for customer accounts — passwords are only forced to change after a confirmed breach or compromise
- **Administrator accounts** must rotate passwords every **180 days**
- Users are encouraged (but not required) to use a passphrase approach (e.g., four random words)

---

## 4. Password Breach Detection

### 4.1 HaveIBeenPwned Integration

All new passwords and password changes are checked against the HaveIBeenPwned (HIBP) Passwords API using the **k-anonymity model**:

1. Compute the SHA-1 hash of the candidate password
2. Send only the first **5 characters** of the hash to the HIBP API (`GET https://api.pwnedpasswords.com/range/{first5}`)
3. Search the returned list of suffixes for a match
4. If a match is found, reject the password with the message: `"This password has been found in a known data breach. Please choose a different password."`
5. If the HIBP API is unavailable, the check is **skipped** (fail-open) — a warning is logged but registration is not blocked

This check is performed:
- At account registration
- At password change
- At admin-initiated password reset

### 4.2 Internal Breach Check

In addition to HIBP, passwords are checked against Lomash Wood's own compromised credential list, updated following any security incidents or notified third-party breaches affecting Lomash Wood users.

---

## 5. Password Storage

### 5.1 Hashing Algorithm

All passwords must be hashed using **Argon2id** before storage. Argon2id is the recommended algorithm per OWASP and the winner of the Password Hashing Competition (2015).

**Production parameters:**

```typescript
// auth-service/src/infrastructure/auth/password.ts
const ARGON2_OPTIONS = {
  type: argon2.argon2id,
  memoryCost: 65536,   // 64 MB — resistant to GPU attacks
  timeCost: 3,          // 3 iterations
  parallelism: 4,       // 4 parallel threads
  hashLength: 32,       // 32-byte output
  saltLength: 16,       // 16-byte random salt (auto-generated per hash)
};
```

**Why Argon2id over bcrypt/scrypt:**
- Argon2id provides both memory-hardness (resistance to ASIC/GPU attacks) and side-channel resistance
- bcrypt is limited to 72-character passwords (passwords truncated silently beyond this limit)
- scrypt is acceptable but Argon2id provides better configurable parameters

### 5.2 Hash Versioning

The hash output from Argon2id includes the algorithm identifier, parameters, and salt in the stored string (e.g., `$argon2id$v=19$m=65536,t=3,p=4$...`). This enables transparent algorithm migration in future without requiring all users to reset their passwords — old hashes are re-hashed on next successful login.

### 5.3 Storage Rules

| Rule | Requirement |
|---|---|
| Plaintext passwords | **Never stored** in any system, log, or memory dump |
| Hash storage | `password` column in `users` table (PostgreSQL) — `VARCHAR(255)` |
| Transmission | Passwords transmitted only over TLS 1.2+ — never in URL parameters or GET requests |
| Logging | Passwords **never** written to application logs, audit logs, or error reports |
| Memory | Password strings cleared from memory after hashing where language supports it |

---

## 6. Password Lifecycle

### 6.1 Password Expiry

| Account Type | Expiry Rule |
|---|---|
| Customer accounts | No mandatory expiry — rotation only required after confirmed compromise |
| Admin / Staff accounts | Mandatory rotation every **180 days** |
| Service accounts / API keys | Rotation every **365 days** (governed by `rotate-api-tokens.sh`) |
| Database passwords | Rotation every **90 days** (governed by `rotate-db-passwords.sh`) |

### 6.2 Password History

The last **12 password hashes** are retained in the `password_history` table per user. Reuse of any of the 12 previous passwords is rejected with: `"You cannot reuse a recent password. Please choose a new password."`

Password history records are:
- Stored as Argon2id hashes (same as the current password)
- Retained for the duration of the account
- Deleted upon account deletion/anonymisation

### 6.3 First-Use Password Reset

All new administrator accounts provisioned by the Head of Engineering must change their temporary password on first login. Temporary passwords:
- Are 20-character random alphanumeric strings generated by `auth.seed.ts` or the admin provisioning script
- Expire after **24 hours** if unused
- Cannot be reused after first-use reset

---

## 7. Account Lockout

| Event | Action | Duration |
|---|---|---|
| 5 consecutive failed logins (15-min window) | Account locked; unlock email sent | Until user unlocks via email |
| 10 consecutive failed logins | Account locked; admin notification sent | Until admin manually unlocks |
| Suspicious login (new country, new device) | Require MFA re-verification | Per session |

Lockout state is stored in Redis with a TTL matching the lockout duration. Brute-force attempts against locked accounts return `HTTP 401` (not `423 Locked`) to avoid confirming account existence.

---

## 8. Multi-Factor Authentication & Password Interaction

When MFA is enabled (mandatory for admin accounts, optional for customers):

- Successful password verification is a **necessary but not sufficient** condition for login
- MFA verification failure after correct password must not reveal whether the password was correct
- MFA recovery codes (10 single-use, bcrypt-hashed) are issued at MFA setup and replace the authenticator if access is lost
- MFA bypass is only available to the Head of Engineering via an out-of-band verification process

---

## 9. Password Manager Guidance

Lomash Wood's onboarding documentation recommends all staff and administrators use a password manager (e.g., 1Password, Bitwarden) and:

- Never use the same password across multiple systems
- Enable the password manager's breach monitoring features
- Store the Lomash Wood admin password with a unique, generated strong password

---

## 10. Implementation Reference

The password policy is implemented in:

```
auth-service/src/infrastructure/auth/password.ts   — Argon2id hash/verify functions
auth-service/src/app/auth/auth.schemas.ts           — Zod password validation schema
auth-service/src/app/auth/auth.service.ts           — Registration, change, reset logic
auth-service/src/jobs/expire-password-reset.job.ts  — Token expiry enforcement
```

The Zod password schema must validate:

```typescript
// auth-service/src/app/auth/auth.schemas.ts
const passwordSchema = z
  .string()
  .min(12, "Password must be at least 12 characters")
  .max(128, "Password must not exceed 128 characters")
  .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
  .regex(/[a-z]/, "Password must contain at least one lowercase letter")
  .regex(/[0-9]/, "Password must contain at least one digit")
  .regex(/[^A-Za-z0-9]/, "Password must contain at least one special character");
```

---

## 11. Review & Compliance

| Role | Responsibility |
|---|---|
| Head of Engineering | Policy owner; approves parameter changes |
| Security Lead | Reviews Argon2id parameters annually; validates HIBP integration |
| Backend Architects | Maintain `password.ts` implementation |
| All Staff | Comply with personal account password requirements |

---

*Lomash Wood Ltd — Confidential. Do not distribute outside the engineering organisation.*