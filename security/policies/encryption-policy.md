# Encryption Policy — Lomash Wood

**Document ID:** LW-SEC-POL-005  
**Version:** 1.2  
**Classification:** Confidential — Internal Use Only  
**Owner:** Head of Engineering  
**Last Reviewed:** 2026-02-19  
**Next Review Date:** 2026-08-19  
**Status:** Active

---

## 1. Purpose

This policy defines the cryptographic standards, key management practices, and encryption requirements for all data processed, stored, or transmitted by the Lomash Wood platform. It ensures that sensitive data is protected against unauthorised disclosure using industry-standard algorithms and appropriate key lifecycle controls.

---

## 2. Scope

This policy applies to:

- All data in transit between clients, the API Gateway, and internal services
- All data at rest in PostgreSQL databases, Redis cache, S3 storage, and backups
- All cryptographic key material (JWT signing keys, API secrets, database encryption keys)
- All environments: development, staging, and production (production controls are mandatory; development may relax at-rest controls with documented exceptions)

---

## 3. Approved Cryptographic Algorithms

### 3.1 Symmetric Encryption

| Use Case | Algorithm | Key Size | Mode | Notes |
|---|---|---|---|---|
| Data at rest (AWS RDS) | AES | 256-bit | GCM | AWS-managed via KMS |
| Data at rest (S3) | AES | 256-bit | GCM | SSE-S3 or SSE-KMS |
| Data at rest (backups) | AES | 256-bit | GCM | AWS KMS CMK |
| Field-level encryption (PII) | AES | 256-bit | GCM | Application-layer; key in Secrets Manager |
| Redis cache encryption | TLS 1.3 in transit; Redis AUTH for access control | | | ElastiCache in-transit encryption enabled |

### 3.2 Asymmetric Encryption & Signing

| Use Case | Algorithm | Key Size | Notes |
|---|---|---|---|
| JWT signing (auth tokens) | RS256 (RSA-PKCS1v15-SHA256) | 4096-bit | Private key in Secrets Manager |
| Service certificate (mTLS) | ECDSA P-384 | 384-bit | Managed by cert-manager |
| TLS certificates (external) | RSA or ECDSA | 2048-bit RSA min / P-256 ECDSA | AWS ACM managed |
| Webhook signature (outbound) | HMAC-SHA256 | 256-bit secret | Per-customer secret |
| API key generation | CSPRNG + SHA-256 storage | 256-bit | `crypto.randomBytes(32)` |

### 3.3 Hashing

| Use Case | Algorithm | Parameters | Notes |
|---|---|---|---|
| Password hashing | Argon2id | `m=65536, t=3, p=4` | See [Password Policy](./password-policy.md) |
| Password reset tokens | SHA-256 (of random token) | N/A | Token generated via `crypto.randomBytes(32)` |
| API key storage | SHA-256 | N/A | Hex digest stored in DB |
| Webhook signature | HMAC-SHA256 | N/A | `crypto.createHmac('sha256', secret)` |
| File integrity | SHA-256 | N/A | S3 ETag validation |
| Audit log integrity | SHA-256 chain | N/A | Each log entry hashes previous entry ID |

### 3.4 Prohibited Algorithms

The following algorithms are **explicitly prohibited** and must not be used in any component of the Lomash Wood platform:

| Algorithm | Reason |
|---|---|
| MD5 | Cryptographically broken; collision attacks demonstrated |
| SHA-1 | Deprecated; SHAttered collision attack (2017) |
| DES / 3DES | Insufficient key size; SWEET32 vulnerability |
| RC4 | Prohibited by RFC 7465; multiple vulnerabilities |
| RSA < 2048-bit | Insufficient key size |
| ECDSA P-192 | Insufficient curve size |
| HS256 for JWT signing | Symmetric; enables algorithm confusion attacks (LW-002) |
| ECB mode (any cipher) | Deterministic; reveals patterns in ciphertext |
| PKCS#1 v1.5 padding (RSA encrypt) | Vulnerable to Bleichenbacher oracle attacks |

---

## 4. Encryption in Transit

### 4.1 External Traffic (Client → API Gateway)

- TLS 1.2 minimum; TLS 1.3 preferred
- HSTS enforced (`max-age=31536000; includeSubDomains; preload`)
- Forward secrecy required: only ECDHE and DHE cipher families permitted
- TLS termination at the AWS Application Load Balancer (ALB)
- ALB security policy: `ELBSecurityPolicy-TLS13-1-2-2021-06` or newer

### 4.2 Internal Traffic (Service to Service)

- All inter-service HTTP communication encrypted via mTLS using Kubernetes-managed certificates
- Certificates issued by in-cluster CA via cert-manager
- Plain HTTP between pods is prohibited — Kubernetes NetworkPolicies enforce this
- Redis connections encrypted via TLS (`redis://` prohibited; `rediss://` required in production)
- Database connections encrypted via TLS (`ssl: { rejectUnauthorized: true }` in Prisma connection)

### 4.3 External API Calls (Services → Third Parties)

| Destination | Protocol | Notes |
|---|---|---|
| Stripe API | HTTPS / TLS 1.2+ | Stripe SDK enforces TLS |
| AWS SES | HTTPS | AWS SDK default |
| Twilio | HTTPS | Twilio SDK default |
| Firebase | HTTPS | Firebase Admin SDK |
| HaveIBeenPwned API | HTTPS | k-anonymity model |

All outbound HTTPS connections must have `rejectUnauthorized: true` (certificate validation enabled). Disabling certificate validation is prohibited.

---

## 5. Encryption at Rest

### 5.1 Database (PostgreSQL / AWS RDS)

- AWS RDS encryption enabled at cluster creation using AWS KMS Customer Managed Key (CMK)
- CMK ARN stored in Terraform state; managed in `infra/terraform/modules/rds/`
- Encryption covers: database storage, automated backups, read replicas, snapshots
- Encryption is transparent to the application — no application-layer changes required

### 5.2 Application-Level Field Encryption (PII)

Certain highly sensitive fields are encrypted at the application layer in addition to the database-level encryption (defence-in-depth):

| Field | Table | Encryption | Key Storage |
|---|---|---|---|
| Customer phone number | `customer_profiles` | AES-256-GCM | AWS Secrets Manager |
| Customer address lines | `addresses` | AES-256-GCM | AWS Secrets Manager |
| Business inquiry contact details | `business_inquiries` | AES-256-GCM | AWS Secrets Manager |

**Implementation:** Field encryption/decryption is handled in the repository layer. Encrypted fields are stored as base64-encoded ciphertext with the IV prepended. The decryption key is fetched from Secrets Manager at service startup and cached in memory (not written to disk).

### 5.3 Redis Cache

- AWS ElastiCache for Redis with in-transit encryption enabled (`TransitEncryptionEnabled: true`)
- Redis AUTH password enforced
- Sensitive data stored in Redis (session tokens, OTP codes, rate-limit counters) is stored only by reference or as SHA-256 hashes — plaintext values are not cached in Redis
- Redis `maxmemory-policy: allkeys-lru` with a conservative `maxmemory` limit to prevent OOM-based data exposure

### 5.4 S3 Object Storage

- All S3 buckets use SSE-S3 (AES-256) by default
- Production media bucket uses SSE-KMS with a dedicated CMK for enhanced auditability
- S3 bucket policies enforce `aws:SecureTransport: true` (TLS required; HTTP requests rejected)
- Public access blocked at the S3 account level; objects accessible only via pre-signed URLs or CloudFront signed cookies

### 5.5 Backup Encryption

- RDS automated backups inherit the CMK from the source cluster
- Manual snapshots encrypted with the same CMK
- S3 Glacier archives encrypted with an independently managed CMK
- CMK grants for backup access are limited to the `backup-service` IAM role

---

## 6. Key Management

### 6.1 Key Storage

All cryptographic keys must be stored in **AWS Secrets Manager** or **AWS KMS** — not in:

- Environment files (`.env`) committed to source control
- Application source code or configuration files
- Unencrypted AWS SSM Parameter Store parameters
- Kubernetes ConfigMaps (use Kubernetes Secrets with envelope encryption)

### 6.2 Key Rotation Schedule

| Key Type | Rotation Frequency | Mechanism |
|---|---|---|
| JWT RS256 private key | Every 180 days | `rotate-keys.sh` (zero-downtime via `kid` header) |
| Database passwords | Every 90 days | `rotate-db-passwords.sh` |
| API tokens / secrets | Every 365 days | `rotate-api-tokens.sh` |
| S3 SSE-KMS CMK | Annually (AWS automatic rotation) | AWS KMS automatic |
| RDS CMK | Annually (AWS automatic rotation) | AWS KMS automatic |
| mTLS service certificates | Every 90 days | cert-manager automatic |
| Redis AUTH password | Every 90 days | `rotate-db-passwords.sh` |
| Stripe webhook signing secret | After any suspected compromise | Stripe Dashboard |

Rotation scripts are located in `security/secrets-rotation/`. All rotations are logged to the structured audit log.

### 6.3 JWT Key Rotation (Zero-Downtime)

JWT key rotation must not invalidate existing valid tokens. The procedure is:

1. Generate a new RSA 4096-bit key pair
2. Store the new private key in Secrets Manager with a new `kid` (key ID) value
3. Publish the new public key to the JWKS endpoint alongside the old key
4. Update the `auth-service` to sign new tokens with the new key
5. Wait for all tokens signed with the old key to expire (maximum 15 minutes)
6. Remove the old public key from the JWKS endpoint
7. Delete the old private key from Secrets Manager

### 6.4 Key Access Controls

| Key | Who Has Access | How |
|---|---|---|
| JWT RS256 private key | `auth-service` only | IAM role attached to auth-service pod |
| Database passwords | Per-service | IAM role per service; no cross-service access |
| S3 CMK | `content-service`, `notification-service` | IAM roles |
| RDS CMK | All database-connected services | IAM roles |
| Stripe secret key | `order-payment-service` only | IAM role |

No human operator has routine access to plaintext private keys. Key retrieval for incident response requires approval from two senior engineers and is logged in the audit trail.

---

## 7. Random Number Generation

All cryptographic random values must be generated using a **Cryptographically Secure Pseudo-Random Number Generator (CSPRNG)**:

```typescript
// ✅ CORRECT — Node.js CSPRNG
import crypto from 'crypto';

const resetToken   = crypto.randomBytes(32).toString('hex');   // 256-bit token
const sessionToken = crypto.randomBytes(32).toString('base64url'); // URL-safe
const apiKey       = `lw_sk_${crypto.randomBytes(32).toString('hex')}`;
```

```typescript
// ❌ PROHIBITED — Math.random() is NOT cryptographically secure
const token = Math.random().toString(36);
```

---

## 8. Developer Guidance

### 8.1 Using the Encryption Utility

Field-level encryption is available via `packages/shared-utils/src/crypto.ts`:

```typescript
import { encrypt, decrypt } from '@lomash-wood/shared-utils/crypto';

// Encrypt before storing
const encryptedPhone = await encrypt(customer.phone);
await prisma.customerProfile.update({ where: { id }, data: { phone: encryptedPhone } });

// Decrypt after reading
const profile = await prisma.customerProfile.findUnique({ where: { id } });
const phone = await decrypt(profile.phone);
```

### 8.2 Secrets in Development

In development, Secrets Manager can be replaced with `.env` files **only** if:
- The `.env` file is in `.gitignore` and never committed
- Development secrets are distinct from staging/production secrets
- The `.env.example` file contains placeholder values only — never real secrets

---

## 9. Compliance References

| Standard | Relevant Controls |
|---|---|
| PCI DSS v4.0 | Req 3 (Protect stored account data), Req 4 (Protect data in transit), Req 6 (Secure systems) |
| UK GDPR Art. 32 | Appropriate technical measures including encryption |
| ISO 27001:2022 | A.8.24 (Use of cryptography) |
| NIST SP 800-57 | Key management recommendations |

---

## 10. Review & Compliance

| Role | Responsibility |
|---|---|
| Head of Engineering | Policy owner; approves algorithm changes |
| Security Lead | Validates implementation; reviews key rotation logs |
| DevOps Lead | Manages KMS, ACM, cert-manager; executes rotation scripts |
| Backend Architects | Implements field-level encryption; uses `crypto.ts` utilities |

---

*Lomash Wood Ltd — Confidential. Do not distribute outside the engineering organisation.*