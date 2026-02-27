# Security Policies — Lomash Wood

This directory contains all formal security policies governing the Lomash Wood backend platform. These policies apply to all engineers, architects, DevOps, and staff working on the platform.

---

## Policies Index

| File | Document ID | Version | Description |
|---|---|---|---|
| `auth-policy.md` | LW-SEC-POL-001 | 2.1 | Authentication standards: JWT, sessions, MFA, rate limiting, token lifecycle |
| `data-retention.md` | LW-SEC-POL-002 | 1.4 | Data retention schedules, GDPR right-to-erasure, anonymisation, backup retention |
| `password-policy.md` | LW-SEC-POL-003 | 1.3 | Password composition, Argon2id hashing, breach detection (HIBP), lifecycle |
| `api-security.md` | LW-SEC-POL-004 | 2.0 | API transport security, validation (Zod), rate limiting, CORS, error handling, webhooks |
| `encryption-policy.md` | LW-SEC-POL-005 | 1.2 | Approved algorithms, TLS standards, key management, field-level encryption, key rotation |
| `incident-response.md` | LW-SEC-POL-006 | 1.5 | Incident classification, SIRT roles, response phases, GDPR breach notification, drills |

---

## Quick Reference — Key Standards

### Authentication
- JWT algorithm: **RS256 only** (HS256 strictly prohibited — LW-PENTEST-2025 LW-002)
- Access token TTL: **15 minutes**
- Refresh token TTL: **30 days** (customer), **8 hours** (admin)
- MFA: **mandatory for all admin accounts**

### Passwords
- Hashing: **Argon2id** (`m=65536, t=3, p=4`)
- Minimum length: **12 characters** (customer), **16 characters** (admin)
- Breach detection: **HaveIBeenPwned** k-anonymity API on registration + change
- History: **last 12 passwords** may not be reused

### Encryption
- TLS: **1.2 minimum**, 1.3 preferred — everywhere, including internal service traffic
- Data at rest: **AES-256-GCM** via AWS KMS
- Prohibited: MD5, SHA-1, DES, RC4, HS256 for JWT, ECB mode

### API Security
- Validation: **Zod `.strict()` schemas** on all endpoints
- IDOR prevention: **ownership check in repository layer** for all user-owned resources
- Payment amounts: **always server-side from DB** — never client-supplied
- File uploads: **10MB max**, MIME type allowlist, UUID server-generated filenames

### Data Retention Highlights
- Financial records: **7 years** (HMRC)
- Customer accounts (inactive): **3 years** then anonymised
- Auth audit logs: **2 years**
- Raw analytics events: **90 days** then anonymised

---

## Policy Ownership

| Policy | Owner | Review Frequency |
|---|---|---|
| All policies | Head of Engineering | Semi-annual |
| Auth & Password | Backend Architects + Security Lead | Semi-annual |
| Data Retention | DPO + Head of Engineering | Annual |
| API Security | Backend Architects | Semi-annual |
| Encryption | DevOps Lead + Security Lead | Semi-annual |
| Incident Response | Security Lead | Semi-annual + after every P1 incident |

---

## Compliance Alignment

These policies collectively support compliance with:

| Standard | Relevant Policies |
|---|---|
| **UK GDPR / DPA 2018** | `data-retention.md`, `encryption-policy.md`, `incident-response.md` |
| **PCI DSS v4.0** | `encryption-policy.md`, `auth-policy.md`, `api-security.md` |
| **ISO/IEC 27001:2022** | All policies (Annex A controls A.5–A.8) |
| **SOC 2 Type II** | All policies (CC6, CC7, CC8 criteria) |
| **NIST SP 800-63B** | `auth-policy.md`, `password-policy.md` |
| **OWASP ASVS** | `api-security.md`, `auth-policy.md` |

---

## Related Documents

| Document | Location |
|---|---|
| STRIDE Threat Model | `security/threat-models/STRIDE.md` |
| Attack Tree Analysis | `security/threat-models/attack-tree.md` |
| Penetration Test Reports | `security/pentest-reports/` |
| Secrets Rotation Scripts | `security/secrets-rotation/` |
| Audit Log Schema | `security/audit-logs/` |
| Deployment Runbooks | `docs/runbooks/` |
| Architecture Decisions (ADRs) | `docs/architecture/ADRs/` |

---

*Lomash Wood Ltd — Confidential. Do not distribute outside the engineering organisation. Last updated: 2026-02-19.*