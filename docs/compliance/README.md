# Compliance Documentation — Lomash Wood Backend

## Overview

This directory contains the compliance documentation for the Lomash Wood backend platform. Each document covers a specific regulatory framework, standard, or compliance obligation relevant to the operation of the kitchen and bedroom design, sales, and consultation platform.

---

## Documents in This Directory

| File | Framework | Status | Owner | Review Cycle |
|------|-----------|--------|-------|-------------|
| `gdpr.md` | UK GDPR / EU GDPR | Active — Required | DPO | Annual |
| `pci-dss.md` | PCI-DSS v4.0 (SAQ A) | Active — Required | Engineering Manager | Annual |
| `iso27001.md` | ISO/IEC 27001:2022 | Target — In Preparation | Engineering Manager | Annual |
| `soc2.md` | SOC 2 Type I → Type II | Target — In Preparation | Engineering Manager | Quarterly until certified |
| `hipaa.md` | HIPAA (US) | Not Applicable — Documented | DPO | Annual or on trigger |

---

## Compliance Status Summary

### Currently Required

#### UK GDPR / EU GDPR (`gdpr.md`)

Lomash Wood processes personal data of UK and EU residents. Compliance with UK GDPR (retained EU law) and EU GDPR is mandatory from day one of operation.

**Key obligations implemented:**
- Lawful basis documented for all processing activities
- Data subject rights endpoints (`/v1/customers/me/data-export`, `/v1/customers/me`)
- Automated retention and deletion jobs
- Data breach notification procedure (72-hour ICO reporting window)
- Privacy by design applied to all new features
- Third-party DPAs in place (AWS, Stripe, Twilio, Firebase)

**DPO contact:** dpo@lomashwood.com
**Supervisory authority:** Information Commissioner's Office (ICO), uk — [ico.org.uk](https://ico.org.uk)

---

#### PCI-DSS v4.0 — SAQ A (`pci-dss.md`)

Payment card processing is handled exclusively through Stripe (PCI-DSS Level 1 certified). Lomash Wood operates as an SAQ A merchant — no cardholder data (PAN, CVV, expiry) is stored, processed, or transmitted by Lomash Wood systems.

**Key obligations implemented:**
- Stripe Elements iframe used for all card data entry
- Only Stripe payment intent IDs and last-four digits stored
- Webhook signature verification on all Stripe events
- Idempotency keys on all payment intent creation
- Network isolation of `order-payment-service`
- Annual penetration test (results in `security/pentest-reports/`)
- SAQ A completed annually and submitted to acquiring bank

---

### Target Certifications

#### ISO/IEC 27001:2022 (`iso27001.md`)

ISO 27001 certification provides internationally recognised assurance of information security management practices. Lomash Wood is building toward certification as the business scales.

**Current state:** Controls documented and implemented. Gap analysis in progress.

**Key Annex A controls implemented:**
- Documented ISMS scope and risk register
- Access control (RBAC, MFA, least privilege)
- Cryptography policy (AES-256 at rest, TLS 1.2+ in transit, bcrypt for passwords)
- Secure development lifecycle (CI security gates, peer review, SAST)
- Vulnerability management with SLA (CRITICAL: 24h, HIGH: 7d)
- Logging and monitoring (Prometheus, Grafana, Loki, CloudTrail, GuardDuty)
- Incident management and post-mortem process
- Business continuity and DR (aligned with `docs/disaster-recovery/`)

**Next step:** Engage an accredited ISO 27001 certification body for a Stage 1 audit.

---

#### SOC 2 Type I → Type II (`soc2.md`)

SOC 2 provides assurance to enterprise customers and partners that Lomash Wood's security controls are designed and operating effectively. This is increasingly required by B2B customers.

**Target:** SOC 2 Type I (design effectiveness) in Year 1; Type II (operational effectiveness over 12 months) in Year 2.

**Trust Services Categories in scope:**
- Security (CC) — mandatory
- Availability (A)
- Confidentiality (C)
- Privacy (P)

**Key controls mapped:**
- Logical access controls (CC6)
- Change management (CC8)
- Risk assessment and treatment (CC3, CC9)
- Monitoring and alerting (CC4, CC7)
- Vendor management (CC9.2)

**Next step:** Engage an evidence collection platform (Drata, Vanta, or Secureframe) and conduct a readiness assessment.

---

### Not Applicable

#### HIPAA (`hipaa.md`)

Lomash Wood does not operate as a healthcare provider, health plan, or business associate of a covered entity. HIPAA does not apply to the current business model.

The HIPAA document records this formal assessment and defines the trigger conditions under which re-assessment would be required (US market expansion, healthcare facility clients, health-related data collection).

---

## Compliance Calendar

| Month | Activity | Owner |
|-------|---------|-------|
| February | Annual GDPR review; DPA renewals | DPO |
| February | SAQ A completion; PCI-DSS review | Engineering Manager |
| March | Q1 access rights review | Engineering Manager |
| April | Vulnerability scan review | Lead Backend Engineer |
| June | Q2 access rights review | Engineering Manager |
| July | Annual penetration test | External — Pentest firm |
| September | Q3 access rights review | Engineering Manager |
| October | ISO 27001 internal audit | Engineering Manager |
| November | SOC 2 readiness assessment update | Engineering Manager |
| December | Q4 access rights review; annual policy review | Engineering Manager + DPO |

---

## Shared Controls Cross-Reference

Many controls satisfy multiple frameworks simultaneously:

| Control | GDPR | PCI-DSS | ISO 27001 | SOC 2 |
|---------|------|---------|-----------|-------|
| Data encryption at rest (AES-256) | Art. 32 | Req. 3 | A.8.24 | CC6.7 |
| TLS 1.2+ in transit | Art. 32 | Req. 4 | A.8.24 | CC6.7 |
| Access logging (CloudTrail) | Art. 32 | Req. 10 | A.8.15 | CC7.1 |
| RBAC + least privilege | Art. 25 | Req. 7 | A.5.15 | CC6.1 |
| Vulnerability scanning (Trivy) | Art. 25 | Req. 6 | A.8.8 | CC7.1 |
| Incident response procedure | Art. 33/34 | Req. 12 | A.5.26 | CC7.3 |
| Data retention and deletion | Art. 5(1)(e) | — | A.8.10 | C1.2 |
| Penetration testing | — | Req. 11 | A.8.29 | CC4.1 |
| Backup and recovery | Art. 32 | — | A.8.13 | A1.2 |
| MFA enforcement | — | Req. 8 | A.8.2 | CC6.1 |
| Breach notification | Art. 33/34 | Req. 12 | A.5.28 | P8.1 |

---

## Key Contacts

| Role | Name | Contact |
|------|------|---------|
| DPO (Data Protection Officer) | TBC | dpo@lomashwood.com |
| Engineering Manager (ISMS Owner) | TBC | engineering@lomashwood.com |
| Security incidents | On-call engineer | Via PagerDuty |
| Regulatory (ICO) | — | [ico.org.uk/report-a-breach](https://ico.org.uk/for-organisations/report-a-breach/) |
| Payment compliance (Stripe) | — | Stripe dashboard → Support |

---

## Document Control

All compliance documents are version-controlled in Git alongside the codebase. Changes to compliance documents require:
- A pull request with a description of what changed and why
- Review by the DPO or Engineering Manager
- Merge to `main` only after approval

Compliance documents must not be deleted without a formal compliance review confirming the obligation no longer applies.