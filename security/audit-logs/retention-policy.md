# Audit Log Retention Policy

Effective date: 2025-01-15
Owner: Data Protection Officer (DPO) + Head of Security
Review cycle: Annual (next review: 2026-01-15)
Version: 1.0.0

---

## Purpose

This document defines how long audit log entries are retained, where they are stored at each stage of their lifecycle, how they are archived, who may delete them, and under what conditions deletion is permitted. It exists to satisfy legal, regulatory, and contractual obligations while balancing operational storage costs.

This policy applies to all audit log entries emitted across the Lomash Wood backend platform and conforming to `audit-schema.json` v1.0.0 or later.

---

## Governing Regulations

| Regulation | Minimum Retention | Notes |
|---|---|---|
| UK GDPR / EU GDPR | No fixed minimum; must be adequate for accountability | Entries containing PII access records must be retained long enough to demonstrate compliance and respond to SARs |
| PCI-DSS v4.0 Requirement 10.7 | 12 months online + 12 months accessible | Applies to all entries in the `PAYMENT` action category |
| ISO 27001:2022 A.8.15 | Organisation-defined; must be demonstrably adequate | Minimum 2 years recommended by ISO guidance |
| UK Bribery Act 2010 | 6 years | Applies to high-value transaction records (`ORDER_PLACED`, `PAYMENT_COMPLETED`) |
| Companies Act 2006 | 6 years | Financial records referenced by audit entries |
| Limitation Act 1980 | 6 years (contract), 12 years (deed) | Governs the window within which civil claims may be brought |

The governing retention period for any given entry is the **longest** period required by any applicable regulation. Where no specific regulation applies, the default is **3 years**.

---

## Retention Tiers

### Tier 1 — Hot (Active)

| Attribute | Value |
|---|---|
| Duration | 0 – 90 days from entry `timestamp` |
| Storage | PostgreSQL `audit_log` table (primary database cluster) |
| Format | JSONB column per field, indexed |
| Encryption | AES-256, at-rest encryption via AWS RDS |
| Access | Direct DB query; role-gated (see README.md Access Control) |
| Write mode | Write-once (no UPDATE or DELETE statements permitted on `audit_log`) |
| Replication | Multi-AZ synchronous replication |

Entries in this tier are fully queryable in real time. They are the primary source for live security monitoring and alerting.

### Tier 2 — Warm (Near-line Archive)

| Attribute | Value |
|---|---|
| Duration | 91 days – 2 years from entry `timestamp` |
| Storage | AWS S3 Standard-IA — `s3://lomashwood-audit-logs/production/YYYY/MM/DD/` |
| Format | NDJSON, Gzip-compressed, one file per service per hour |
| Encryption | AES-256 server-side encryption (SSE-S3) |
| Access | AWS Athena; requires MFA + `audit-warm-reader` IAM role assumption |
| Write mode | Object Lock COMPLIANCE mode — objects cannot be deleted or overwritten for the retention duration |
| Transfer | Automated nightly export job: runs at 02:00 UTC, exports prior-day entries, verifies HMAC checksums before marking exported |

Entries must be queryable within 5 minutes of a retrieval request. Athena tables are partitioned by `year`, `month`, `day`, and `service`.

### Tier 3 — Cold (Long-term Archive)

| Attribute | Value |
|---|---|
| Duration | 2 years – 7 years from entry `timestamp` |
| Storage | AWS S3 Glacier Instant Retrieval — `s3://lomashwood-audit-logs-archive/production/YYYY/MM/` |
| Format | NDJSON, Gzip-compressed, one file per service per day |
| Encryption | AES-256 SSE-S3 |
| Access | Requires Director-level approval + `audit-cold-reader` IAM role; all access is itself audited |
| Write mode | S3 Object Lock COMPLIANCE mode — 7-year lock from object creation date |
| Retrieval SLA | Standard: 3–5 hours; Bulk: 12 hours |
| Transfer | Monthly consolidation job: runs on the 1st of each month, consolidates warm-tier files older than 2 years into daily cold-tier files |

---

## Retention Periods by Action Category

| Action Category | Hot Tier | Warm Tier | Cold Tier | Total Retention | Basis |
|---|---|---|---|---|---|
| `AUTH` | 90 days | 90 days – 2 years | 2 – 3 years | **3 years** | ISO 27001 minimum |
| `SECURITY` | 90 days | 90 days – 2 years | 2 – 7 years | **7 years** | Potential litigation window |
| `USER_MANAGEMENT` | 90 days | 90 days – 2 years | 2 – 6 years | **6 years** | UK GDPR accountability; Limitation Act |
| `DATA_ACCESS` | 90 days | 90 days – 2 years | 2 – 3 years | **3 years** | UK GDPR Art. 5(2) accountability |
| `DATA_MODIFICATION` | 90 days | 90 days – 2 years | 2 – 6 years | **6 years** | Limitation Act 1980 (contract) |
| `PAYMENT` | 90 days | 90 days – 2 years | 2 – 7 years | **7 years** | PCI-DSS v4.0 Req 10; Bribery Act |
| `ORDER` | 90 days | 90 days – 2 years | 2 – 7 years | **7 years** | Companies Act; Bribery Act; Limitation Act |
| `APPOINTMENT` | 90 days | 90 days – 2 years | 2 – 3 years | **3 years** | Operational accountability |
| `NOTIFICATION` | 90 days | 90 days – 1 year | ❌ | **1 year** | Operational accountability only |
| `CONFIGURATION` | 90 days | 90 days – 2 years | 2 – 6 years | **6 years** | Limitation Act; change management evidence |
| `FILE` | 90 days | 90 days – 2 years | 2 – 3 years | **3 years** | Standard operational |
| `ADMIN` | 90 days | 90 days – 2 years | 2 – 6 years | **6 years** | Limitation Act; administrative accountability |
| `COMPLIANCE` | 90 days | 90 days – 2 years | 2 – 6 years | **6 years** | UK GDPR Art. 5(2); SAR and RTBF evidence |

Entries tagged with `pci` or `high-value` inherit the PAYMENT category retention period (7 years) regardless of their `action.category` field.

Entries tagged with `gdpr` or `compliance` are never deleted without explicit written approval from the DPO.

---

## Deletion Procedure

### Automated Deletion (End of Retention Period)

Deletion is automated and occurs in two steps:

1. **Expiry flag**: A scheduled job runs at 03:00 UTC daily. It queries all tiers for entries whose `timestamp` has exceeded the retention period for their action category. Eligible entries are flagged with `expires_at` in PostgreSQL and in S3 object tags.

2. **Deletion window**: Flagged entries are hard-deleted 30 days after flagging. This 30-day grace period allows the DPO or Head of Security to place a legal hold before deletion occurs.

Deletion from PostgreSQL uses `DELETE FROM audit_log WHERE id = ANY($1)` in batches of 1,000 rows. Deletion from S3 uses the AWS S3 Batch Operations API against the flagged object list.

All deletions are themselves recorded in a `audit_deletion_log` table that is retained permanently and is not subject to this policy.

### Manual Deletion (Exception)

Manual deletion of audit entries before the end of the retention period is prohibited except in the following circumstances:

- A court order or regulatory direction requires deletion.
- The entry was created in error and contains raw PII that could not be masked (data breach remediation).
- Explicit written approval from the DPO, Head of Security, and a Director.

All manual deletions must be documented in the `audit_deletion_log` with the approving parties, the legal basis, and the IDs of all deleted entries.

### Legal Hold

Any entry or range of entries may be placed on legal hold by the DPO or Head of Legal. Entries under legal hold:

- Are excluded from automated deletion runs.
- Cannot be manually deleted without a court order.
- Are annotated in S3 object tags with `legal-hold: true` and an S3 Object Lock Legal Hold.
- Must be reviewed quarterly; if the basis for the hold no longer applies, the hold must be lifted within 30 days.

---

## Storage Volume Estimates

Based on average entry size of 1.2 KB (uncompressed) and an average of 50,000 entries per day across all services in production:

| Tier | Volume per Month | Compressed (est. 6:1 ratio) | Annual Cost (est.) |
|---|---|---|---|
| Hot (PostgreSQL) | 1.8 GB | N/A | Included in DB cost |
| Warm (S3 Standard-IA) | 1.8 GB | ~300 MB | ~£0.42 / month |
| Cold (S3 Glacier IR) | 1.8 GB | ~300 MB | ~£0.06 / month |

These figures are reviewed annually against actual CloudWatch Storage Lens metrics.

---

## Archival Job Specifications

### Nightly Hot-to-Warm Export

- Schedule: `0 2 * * *` (02:00 UTC daily)
- Source: PostgreSQL `audit_log` WHERE `timestamp` < NOW() - INTERVAL '90 days' AND `exported_at IS NULL`
- Output: NDJSON, Gzip, uploaded to `s3://lomashwood-audit-logs/production/{YYYY}/{MM}/{DD}/{service}/{HH00}.ndjson.gz`
- Verification: Re-compute HMAC checksum for each entry against stored `checksum` column; abort and alert if any mismatch
- Post-export: Set `exported_at = NOW()` on exported rows; rows remain in PostgreSQL until day 90 then are deleted
- Alert on failure: PagerDuty `audit-archive-failure`

### Monthly Warm-to-Cold Consolidation

- Schedule: `0 4 1 * *` (04:00 UTC on the 1st of each month)
- Source: `s3://lomashwood-audit-logs/production/{YYYY}/{MM}/` where month is > 24 months prior
- Output: Consolidated per-service daily files uploaded to `s3://lomashwood-audit-logs-archive/production/{YYYY}/{MM}/{DD}/{service}.ndjson.gz`
- Post-consolidation: Delete warm-tier source objects (permitted because Object Lock duration on warm tier is 2 years)
- Alert on failure: PagerDuty `audit-consolidation-failure`

### Daily Expiry Flagging Job

- Schedule: `0 3 * * *` (03:00 UTC daily)
- Action: Computes expected deletion date per entry based on action category retention table above; sets `expires_at` in PostgreSQL and S3 object tag `expires-at`
- Exclusions: Skips entries with `legal-hold: true` tag; skips entries tagged `gdpr` or `compliance` without DPO approval
- Output: Summary report published to `s3://lomashwood-audit-ops/expiry-reports/{YYYY-MM-DD}.json`

### Daily Hard Delete Job

- Schedule: `0 4 * * *` (04:00 UTC daily, 1 hour after flagging)
- Action: Deletes all entries where `expires_at` is set AND `expires_at < NOW() - INTERVAL '30 days'` AND no legal hold
- Batch size: 1,000 rows per transaction (PostgreSQL); 1,000 objects per S3 Batch Operations task
- Audit: Every deleted entry ID written to `audit_deletion_log` before deletion
- Alert on failure: PagerDuty `audit-deletion-failure`

---

## Backup and Disaster Recovery

| Scenario | Recovery Objective | Procedure |
|---|---|---|
| PostgreSQL hot tier data loss | RPO: 5 min; RTO: 30 min | Restore from RDS automated snapshot; re-apply WAL logs |
| S3 warm tier object deletion | RPO: 0 (Object Lock prevents deletion); RTO: 5 min | Object Lock COMPLIANCE mode prevents accidental deletion; restore from S3 Versioning if needed |
| S3 cold tier object deletion | RPO: 0 (Object Lock); RTO: 3–5 hours | Object Lock COMPLIANCE mode; Glacier retrieval |
| Accidental export job overwrite | RPO: 0 | S3 Versioning enabled on both buckets; restore prior version |
| Region-level AWS outage | RPO: 24 hours; RTO: 4 hours | S3 Cross-Region Replication to `eu-west-2` (London) → `eu-west-1` (Ireland); PostgreSQL read replica in secondary AZ |

---

## Policy Review and Sign-off

This policy must be reviewed annually or whenever:

- A new regulation applies to Lomash Wood's audit obligations.
- A material change is made to the audit schema.
- A data breach or near-miss reveals a gap in retention or access controls.
- A regulatory audit identifies a deficiency.

| Role | Responsibility |
|---|---|
| Data Protection Officer | Final approval; GDPR compliance sign-off |
| Head of Security | Technical implementation review; access control verification |
| Head of Legal | Regulatory and contractual obligations review |
| CTO | Architectural and infrastructure sign-off |
| External Auditor | Annual independent review (ISO 27001 surveillance audit) |

Current approvals on file: see `docs/compliance/approvals/retention-policy-v1.0.0-sign-off.pdf`