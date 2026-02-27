# Audit Logs

## Overview

The Lomash Wood platform emits a structured audit log entry for every security-relevant, compliance-relevant, or high-value operation that occurs across the backend. Every entry is immutable once written, cryptographically timestamped, and retained in accordance with the policy defined in [`retention-policy.md`](./retention-policy.md).

Audit logs are distinct from application logs. Application logs record operational state for debugging. Audit logs record *who did what, to which resource, with what outcome, and when* — and they exist primarily to satisfy legal obligations, detect threats, and support forensic investigation.

---

## Files in This Directory

| File | Purpose |
|---|---|
| `audit-schema.json` | JSON Schema (Draft-07) defining every field, type, and constraint for a valid audit entry |
| `sample-log.json` | Twelve representative entries covering every major action category |
| `retention-policy.md` | Tiered retention periods, storage locations, archival procedures, and deletion rules |
| `README.md` | This document |

---

## Schema Version

Current schema version: **1.0.0**

The schema is versioned using semantic versioning. Every audit entry carries a `version` field. Breaking changes (new required fields, removed fields, changed enum values) increment the major version. Consumers must check the `version` field before processing.

---

## Anatomy of an Audit Entry

Every entry is a JSON object conforming to `audit-schema.json`. The top-level fields are:

| Field | Required | Description |
|---|---|---|
| `id` | ✅ | Globally unique CUID v2 identifier |
| `version` | ✅ | Schema version — currently `"1.0.0"` |
| `timestamp` | ✅ | ISO 8601 UTC timestamp of the event |
| `service` | ✅ | Originating microservice |
| `environment` | ✅ | `development`, `staging`, or `production` |
| `actor` | ✅ | Who performed the action |
| `action` | ✅ | What action was performed |
| `outcome` | ✅ | Whether the action succeeded or failed |
| `request` | ✅ | HTTP request details |
| `resource` | ❌ | The entity that was acted upon |
| `changes` | ❌ | Before/after state for modification events |
| `traceId` | ❌ | W3C Trace Context trace identifier |
| `spanId` | ❌ | W3C Trace Context span identifier |
| `correlationId` | ❌ | End-to-end request correlation UUID |
| `geo` | ❌ | Geolocation derived from actor IP |
| `metadata` | ❌ | Arbitrary service-specific key/value data |
| `tags` | ❌ | Free-form classification labels |

### Actor Types

| Type | When Used |
|---|---|
| `user` | Authenticated end-user acting via the web or mobile client |
| `admin` | Authenticated staff or administrator acting via the admin panel |
| `service` | Internal service-to-service call with no human actor |
| `system` | Automated background job (cron, queue worker, scheduled task) |
| `anonymous` | Unauthenticated request — no verified identity |

### Action Categories

| Category | Covers |
|---|---|
| `AUTH` | Login, logout, token issuance and revocation, MFA, password operations |
| `USER_MANAGEMENT` | Account creation, suspension, deletion, role assignment |
| `DATA_ACCESS` | Record views, exports, PII access, bulk exports |
| `DATA_MODIFICATION` | Record create, update, delete, restore, bulk operations |
| `PAYMENT` | Payment initiation, completion, failure, refund, dispute |
| `ORDER` | Order placement, update, cancellation, fulfilment |
| `APPOINTMENT` | Booking, rescheduling, cancellation, completion |
| `NOTIFICATION` | Notification send, cancellation, campaign launch |
| `CONFIGURATION` | System config changes, feature flags, secret rotation |
| `SECURITY` | Brute-force detection, suspicious activity, IP blocking |
| `FILE` | File upload, download, deletion |
| `ADMIN` | Administrative actions not covered by the above categories |
| `COMPLIANCE` | Consent, GDPR requests, data deletion, SAR |

### Outcome Statuses

| Status | Meaning |
|---|---|
| `SUCCESS` | Action completed as intended |
| `FAILURE` | Action attempted but failed due to an error or validation |
| `PARTIAL` | Action partially completed — some operations succeeded, others failed |
| `BLOCKED` | Action was prevented before execution (rate limiting, WAF, security rule) |

---

## PII and Sensitive Data Policy

Audit logs must **never** contain raw PII or secrets. The following rules apply without exception:

- **Email addresses** are masked to the pattern `j***@example.com` (first character + `***` + domain).
- **Full names** are masked to `J*** D***` (initial + `***` per word).
- **Phone numbers** are replaced with `[REDACTED]`.
- **Payment card data** (PAN, CVV, expiry) must never appear — reference the provider's payment intent ID only.
- **Passwords, tokens, API keys, and secrets** must never appear in any field.
- **Request bodies** are stored as a SHA-256 hash via `request.bodyHash` — never the raw body.
- **Query parameters** containing sensitive values (tokens, keys) are replaced with `[REDACTED]`.
- **`changes.before` and `changes.after`** must mask any PII field values following the rules above.
- **`metadata`** must not contain PII — use only non-identifying references (order IDs, appointment IDs, etc.).

Services that incorrectly log raw PII must be treated as a data breach incident and reported to the Data Protection Officer within 72 hours.

---

## Emitting Audit Events

### From a Node.js Service

```typescript
import { auditLogger } from '@lomashwood/audit';

await auditLogger.emit({
  service:     'order-service',
  actor: {
    type:      'user',
    id:        user.id,
    email:     maskEmail(user.email),
    role:      user.role,
    ip:        req.ip,
    userAgent: req.headers['user-agent'],
    sessionId: req.session.id,
  },
  action: {
    category:    'ORDER',
    type:        'ORDER_PLACED',
    description: `User placed order ${order.reference} for £${order.total.toFixed(2)}.`,
  },
  resource: {
    type:        'order',
    id:          order.id,
    displayName: `Order ${order.reference}`,
    ownerId:     user.id,
  },
  outcome: {
    status:     'SUCCESS',
    statusCode: 201,
    durationMs: Date.now() - startTime,
  },
  request: {
    method:      req.method,
    path:        '/api/v1/orders',
    bodyHash:    hashBody(req.body),
    contentType: req.headers['content-type'],
    size:        req.headers['content-length'],
  },
  metadata: {
    orderReference: order.reference,
    currency:       order.currency,
    itemCount:      order.items.length,
  },
  tags: ['high-value', 'payment'],
});
```

### Required Fields Checklist

Before merging any new audit-emitting code, verify:

- [ ] `actor.email` is masked, not raw
- [ ] `request.bodyHash` is a SHA-256 hex string, not the body itself
- [ ] `changes.before` and `changes.after` contain no raw PII
- [ ] `metadata` contains no passwords, tokens, or card data
- [ ] `action.description` does not include raw PII beyond masked references
- [ ] `tags` follow the pattern `^[a-z0-9_:-]{1,64}$`

---

## Storage Architecture

```
Production Audit Logs
│
├── Hot Tier (0–90 days)
│   └── PostgreSQL – audit_log table (write-once, indexed)
│       Indexes: timestamp, service, actor.id, action.type, resource.id
│
├── Warm Tier (91 days – 2 years)
│   └── AWS S3 – s3://lomashwood-audit-logs/production/YYYY/MM/DD/
│       Format: NDJSON, Gzip compressed, AES-256 server-side encryption
│       Access: Read-only, requires MFA + role assumption
│
└── Cold Tier (2 years – 7 years)
    └── AWS S3 Glacier – s3://lomashwood-audit-logs-archive/
        Format: NDJSON, Gzip compressed, AES-256 SSE
        Retrieval SLA: 3–5 hours (standard), 12 hours (bulk)
```

Audit entries are written to the hot tier synchronously before any HTTP response is returned for critical security events (`AUTH`, `SECURITY`, `PAYMENT`, `COMPLIANCE`). All other categories are written asynchronously via an internal audit queue with at-least-once delivery guarantees.

---

## Querying Audit Logs

### PostgreSQL (Hot Tier — Last 90 Days)

```sql
SELECT *
FROM audit_log
WHERE
  "timestamp" BETWEEN '2025-01-01T00:00:00Z' AND '2025-01-31T23:59:59Z'
  AND service = 'auth-service'
  AND action->>'type' = 'LOGIN_FAILED'
  AND actor->>'ip' = '185.220.101.50'
ORDER BY "timestamp" DESC;
```

```sql
SELECT *
FROM audit_log
WHERE
  "timestamp" >= NOW() - INTERVAL '24 hours'
  AND action->>'category' = 'SECURITY'
  AND outcome->>'status' = 'BLOCKED'
ORDER BY "timestamp" DESC;
```

### AWS Athena (Warm/Cold Tiers)

```sql
SELECT id, timestamp, actor, action, outcome
FROM audit_logs_warm
WHERE
  year  = '2024'
  AND month = '11'
  AND action.type = 'PAYMENT_COMPLETED'
  AND outcome.status = 'SUCCESS'
  AND cast(json_extract_scalar(metadata, '$.currency') AS varchar) = 'GBP'
ORDER BY timestamp DESC
LIMIT 500;
```

---

## Integrity and Tamper Detection

Each entry written to PostgreSQL receives a `checksum` column computed as:

```
HMAC-SHA256(AUDIT_SIGNING_KEY, canonical_json(entry))
```

where `canonical_json` is the entry serialised with keys sorted lexicographically and no whitespace. The `AUDIT_SIGNING_KEY` is rotated quarterly and stored in AWS Secrets Manager.

A daily background job re-computes checksums for all entries written in the previous 24 hours and alerts via PagerDuty if any mismatch is detected. Mismatches are treated as a Severity-1 security incident.

---

## Access Control

Access to audit logs is restricted by role:

| Role | Hot Tier | Warm Tier | Cold Tier |
|---|---|---|---|
| `DEVELOPER` | Read own service only | ❌ | ❌ |
| `SECURITY_ANALYST` | Read all | Read all (MFA required) | Request only |
| `ADMIN` | Read all | ❌ | ❌ |
| `SUPER_ADMIN` | Read all | Read all (MFA required) | Request only |
| `DPO` | Read COMPLIANCE + PII tags | Read all (MFA required) | Read all (MFA required) |
| `AUDITOR` | Read all (read-only DB role) | Read all (MFA required) | Read all (MFA required) |

All audit log access is itself audit-logged under the `DATA_ACCESS / RECORD_VIEWED` action type.

---

## Alerting Rules

The following patterns trigger automated security alerts:

| Rule | Threshold | Severity | Channel |
|---|---|---|---|
| Failed logins per IP | ≥ 5 in 60 s | High | PagerDuty + Slack `#security-alerts` |
| Brute-force detected | Any | Critical | PagerDuty |
| `SUSPICIOUS_ACTIVITY` emitted | Any | Critical | PagerDuty |
| Admin bulk export > 1,000 records | Any | High | Slack `#security-alerts` |
| PII access outside business hours | Any | Medium | Slack `#security-alerts` |
| GDPR/RTBF request submitted | Any | Low | Slack `#compliance` |
| Audit log checksum mismatch | Any | Critical | PagerDuty (P1) |
| Audit write queue depth > 10,000 | Any | High | PagerDuty |

---

## Compliance Obligations

| Regulation | Requirement | How Satisfied |
|---|---|---|
| UK GDPR / EU GDPR | Maintain records of processing activities; log PII access | All PII access logged under `DATA_ACCESS / PII_ACCESSED` |
| UK GDPR Art. 17 | Demonstrate RTBF fulfilment | `COMPLIANCE / DATA_DELETION_REQUESTED` and `DATA_DELETION_COMPLETED` entries |
| UK GDPR Art. 15 | Demonstrate SAR fulfilment | `COMPLIANCE / SAR_REQUESTED` and `DATA_ACCESS / RECORD_EXPORTED` entries |
| PCI-DSS v4.0 Req 10 | Audit trail for all access to cardholder data; 12-month retention | `PAYMENT` category entries, 7-year retention in cold tier |
| ISO 27001 A.12.4 | Event logging and monitoring | Centralised log pipeline + alerting rules above |
| UK Bribery Act 2010 | Records of high-value transactions | `ORDER / ORDER_PLACED` + `PAYMENT / PAYMENT_COMPLETED` entries |

---

## Related Documentation

- [`retention-policy.md`](./retention-policy.md) — full tiered retention schedule and deletion procedures
- [`audit-schema.json`](./audit-schema.json) — machine-readable JSON Schema (Draft-07)
- [`sample-log.json`](./sample-log.json) — twelve annotated example entries
- Internal: `@lomashwood/audit` SDK — `packages/audit/README.md`
- Internal: Runbook — `docs/runbooks/audit-log-incident-response.md`