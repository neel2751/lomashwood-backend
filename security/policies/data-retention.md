# Data Retention Policy — Lomash Wood

**Document ID:** LW-SEC-POL-002  
**Version:** 1.4  
**Classification:** Confidential — Internal Use Only  
**Owner:** Head of Engineering  
**Last Reviewed:** 2026-02-19  
**Next Review Date:** 2026-08-19  
**Status:** Active

---

## 1. Purpose

This policy establishes the rules governing how long Lomash Wood retains personal and operational data, when data must be deleted or anonymised, and how data lifecycle is enforced across all systems. The policy ensures compliance with:

- **UK GDPR / Data Protection Act 2018**
- **PCI DSS v4.0** (for cardholder data)
- **ISO/IEC 27001:2022** (Annex A.8.10 — Information Deletion)
- **SOC 2 Type II** (Availability and Confidentiality criteria)

---

## 2. Scope

This policy applies to all data processed by the Lomash Wood platform including:

- Customer personal data (profiles, addresses, contact details)
- Transactional data (orders, payments, invoices, refunds)
- Appointment and consultation records
- Authentication and session records
- Application and audit logs
- Marketing and communications data (newsletter subscriptions, brochure requests)
- Analytics and behavioural tracking data
- Employee and administrator account data
- Backup and archived data

---

## 3. Data Classification

| Classification | Description | Examples |
|---|---|---|
| **Personal Data** | Any data identifying or capable of identifying a living individual | Name, email, phone, address, IP address |
| **Sensitive Personal Data** | Special category data under UK GDPR Article 9 | Health information (none currently collected) |
| **Financial Data** | Payment and transaction records | Order totals, Stripe payment intent IDs, invoice records |
| **Cardholder Data (CHD)** | Payment card details — governed by PCI DSS | Card numbers, CVV, expiry dates |
| **Operational Data** | System-generated logs and metrics | Application logs, audit logs, analytics events |
| **Content Data** | CMS-managed non-personal data | Blog posts, product descriptions, media assets |

> **Note:** Lomash Wood does not store raw cardholder data. All payment processing is delegated to Stripe. Only Stripe payment intent IDs and last-4 card digits are stored. The PCI DSS rules in Section 5 apply to these stored references.

---

## 4. Retention Schedule

### 4.1 Customer Personal Data

| Data Type | Retention Period | Trigger for Deletion | Lawful Basis |
|---|---|---|---|
| Customer account (active) | For the duration of the account | Account deletion request or 3 years inactivity | Contract |
| Customer account (inactive) | 3 years from last login | Automated `anonymize-inactive-users` job | Legitimate Interest |
| Customer profile (post-deletion) | 30 days (soft-delete buffer) | Hard delete after 30-day window | Legal Obligation |
| Delivery addresses | Same as customer account | Customer request or account deletion | Contract |
| Brochure request records | 2 years | Automated expiry | Legitimate Interest |
| Business inquiry records | 2 years | Automated expiry | Legitimate Interest |
| Newsletter subscriptions | Until unsubscribed + 30 days | Unsubscribe + 30-day grace | Consent |
| Customer reviews | Until deleted by customer or admin | User or admin deletion | Legitimate Interest |

### 4.2 Transactional Data

| Data Type | Retention Period | Legal Basis |
|---|---|---|
| Order records | 7 years | UK tax law (HMRC record-keeping requirement) |
| Payment transaction records | 7 years | Financial regulation / PCI DSS |
| Invoice PDFs | 7 years | UK Companies Act 2006 |
| Refund records | 7 years | Financial regulation |
| Stripe payment intent IDs | 7 years | Financial regulation |

### 4.3 Appointment & Consultation Records

| Data Type | Retention Period | Notes |
|---|---|---|
| Appointment records (completed) | 3 years | For dispute resolution and service continuity |
| Appointment records (cancelled) | 1 year | For analytics and no-show tracking |
| Consultant availability slots | 90 days post-date | Historical slots purged after 90 days |

### 4.4 Authentication & Session Data

| Data Type | Retention Period | Notes |
|---|---|---|
| Active sessions | Until logout, expiry, or revocation | Stored in PostgreSQL + Redis |
| Expired/revoked sessions | 30 days | For audit trail; then hard deleted |
| Password reset tokens | 15 minutes (TTL enforced at creation) | Auto-expired by DB TTL or cron job |
| Failed login attempt records | 90 days | For security investigation |
| Token blacklist entries (Redis) | Until access token TTL expires (15 min) | Auto-expired by Redis TTL |
| Audit log — auth events | 2 years | See Section 4.6 |

### 4.5 Analytics & Tracking Data

| Data Type | Retention Period | Notes |
|---|---|---|
| Raw analytics events (with PII) | 90 days | Anonymised after 90 days; raw data deleted |
| Anonymised analytics events | 3 years | Aggregated metrics retained for business intelligence |
| Session tracking records | 90 days | Then anonymised |
| Funnel analysis data | 1 year (anonymised) | |
| Page view logs (with IP) | 30 days | IP address hashed after 30 days |
| Export files | 7 days after generation | Download links expire; files purged |

### 4.6 Application & Audit Logs

| Log Type | Retention Period | Storage |
|---|---|---|
| Security audit logs | 2 years | Loki / CloudWatch Logs — write-once |
| Application error logs | 1 year | Loki |
| HTTP access logs | 90 days | Loki |
| Database query logs (slow queries) | 30 days | CloudWatch |
| Infrastructure/Kubernetes logs | 90 days | Loki |
| CI/CD pipeline logs | 180 days | GitHub Actions |

### 4.7 Backup Data

| Backup Type | Retention Period | Encryption |
|---|---|---|
| Full database backup (daily) | 35 days | AES-256 at rest |
| Incremental backup (hourly) | 7 days | AES-256 at rest |
| Point-in-time recovery (RDS) | 35 days | AWS-managed encryption |
| Archived backups (monthly) | 7 years | AES-256; stored in S3 Glacier |

---

## 5. PCI DSS Cardholder Data Requirements

Lomash Wood does not store, process, or transmit raw cardholder data. The following rules apply to the limited payment references stored:

| Data Element | Stored? | Retention | Notes |
|---|---|---|---|
| Primary Account Number (PAN) | **No** | N/A | Never stored |
| Card Verification Value (CVV/CVC) | **No** | N/A | Never stored |
| Card expiry date | **No** | N/A | Never stored |
| Cardholder name | **No** | N/A | Never stored |
| Stripe Payment Intent ID | **Yes** | 7 years | Non-sensitive reference |
| Last 4 digits of card | **Yes** | 7 years | Permitted truncated PAN |
| Card brand (Visa, Mastercard) | **Yes** | 7 years | Non-sensitive |

---

## 6. Data Subject Rights & Deletion Requests

Under UK GDPR, customers have the right to erasure ("right to be forgotten"). When a deletion request is received via `DELETE /v1/customers/me` or via a support ticket:

### 6.1 Deletion Process

1. **Day 0:** Customer submits deletion request; account status set to `PENDING_DELETION`
2. **Day 0–30:** 30-day soft-delete window — customer can cancel the request; data remains accessible to the customer
3. **Day 30:** Automated deletion job (`anonymize-inactive-users.job.ts`) executes:
   - Personal identifiers replaced with anonymised values (name → `Deleted User`, email → `deleted_<uuid>@lomashwood.invalid`, phone → `null`)
   - Delivery addresses hard deleted
   - Sessions revoked and deleted
   - Newsletter subscriptions removed
4. **Retained (as legally required):** Order records, payment records, invoices (7 years, financial regulation)
5. **Response to customer:** Deletion confirmation email sent on Day 30

### 6.2 What Cannot Be Deleted

The following data is exempt from erasure requests due to legal obligations:

- Financial transaction records (7-year retention — HMRC / Companies Act)
- Fraud investigation records (retained for the duration of any investigation)
- Data required to defend legal claims (retained until claim resolution)

---

## 7. Anonymisation Standards

Where data is retained but personal identifiers must be removed, the following anonymisation approach is used:

- **Email:** Replaced with `deleted_<uuidv4>@lomashwood.invalid`
- **Name:** Replaced with `Deleted User`
- **Phone:** Set to `null`
- **IP Address:** Replaced with SHA-256 hash (non-reversible without the original)
- **User-Agent:** Retained (non-PII)
- **Postcode:** Retained (non-PII at district level); full postcode set to `null` if full address deleted

---

## 8. Enforcement Mechanisms

### 8.1 Automated Jobs

The following scheduled jobs enforce retention limits automatically:

| Job | Schedule | Service | Action |
|---|---|---|---|
| `anonymize-inactive-users.job.ts` | Daily 02:00 UTC | `customer-service` | Anonymise accounts inactive for 3 years |
| `cleanup-sessions.job.ts` | Hourly | `auth-service` | Hard delete sessions expired > 30 days |
| `expire-password-reset.job.ts` | Every 5 minutes | `auth-service` | Delete expired reset tokens |
| `purge-old-events.job.ts` | Daily 03:00 UTC | `analytics-service` | Delete raw events older than 90 days |
| `purge-old-logs.job.ts` | Daily 04:00 UTC | `notification-service` | Delete notification logs per schedule |
| `cleanup-unused-media.job.ts` | Weekly Sunday 05:00 UTC | `content-service` | Delete orphaned S3 media objects |

### 8.2 Database-Level Enforcement

- Soft-delete columns (`deletedAt TIMESTAMP`) on all customer-facing tables
- TTL constraints enforced at application layer for time-sensitive tokens
- AWS RDS automated backup retention configured in Terraform (`infra/terraform/modules/rds/`)

---

## 9. Data Subject Rights Response Times

| Request Type | Target Response Time | Maximum (UK GDPR) |
|---|---|---|
| Subject Access Request (SAR) | 14 days | 30 days |
| Right to Erasure | 30 days (including soft-delete window) | 30 days |
| Right to Rectification | 7 days | 30 days |
| Data Portability | 14 days | 30 days |

---

## 10. Review & Compliance

| Role | Responsibility |
|---|---|
| Head of Engineering | Policy owner; approves changes |
| Security Lead | Monitors compliance; reviews retention job logs |
| Backend Architects | Implement retention logic in jobs and APIs |
| DevOps Lead | Manages backup configuration and S3 lifecycle rules |
| Legal/DPO | Advises on regulatory requirements; handles DSR requests |

---

*Lomash Wood Ltd — Confidential. Do not distribute outside the engineering organisation.*