# Incident Response Policy — Lomash Wood

**Document ID:** LW-SEC-POL-006  
**Version:** 1.5  
**Classification:** Confidential — Internal Use Only  
**Owner:** Head of Engineering  
**Last Reviewed:** 2026-02-19  
**Next Review Date:** 2026-08-19  
**Status:** Active

---

## 1. Purpose

This policy defines the procedures for identifying, classifying, containing, eradicating, and recovering from security incidents affecting the Lomash Wood platform. It establishes roles, communication protocols, escalation paths, and documentation requirements to ensure a consistent, effective, and legally compliant response to any security event.

---

## 2. Scope

This policy applies to all security events and incidents affecting:

- The Lomash Wood backend platform (all microservices, databases, infrastructure)
- Customer personal data and payment records
- Internal administrative systems and credentials
- Third-party integrations (Stripe, AWS, Twilio, Firebase)
- CI/CD pipelines and source code repositories

---

## 3. Definitions

| Term | Definition |
|---|---|
| **Security Event** | Any observable occurrence relevant to security — not necessarily malicious or harmful |
| **Security Incident** | A confirmed or probable violation of security policy or unplanned disruption with a security dimension |
| **Data Breach** | A security incident leading to accidental or unlawful destruction, loss, alteration, or unauthorised disclosure of personal data |
| **MTTI** | Mean Time to Identify — time from incident start to detection |
| **MTTC** | Mean Time to Contain — time from detection to containment |
| **MTTR** | Mean Time to Recover — time from detection to full recovery |
| **RTO** | Recovery Time Objective — maximum acceptable downtime |
| **RPO** | Recovery Point Objective — maximum acceptable data loss window |
| **SIRT** | Security Incident Response Team |

---

## 4. Severity Classification

| Severity | Definition | Examples | RTO Target |
|---|---|---|---|
| **P1 — Critical** | Active exploit with confirmed data breach, financial fraud, or full system compromise | Confirmed customer PII exfiltration; unauthorised admin access; payment fraud in progress; ransomware | 4 hours |
| **P2 — High** | Significant security event with potential for serious impact if not contained | Exploitable vulnerability in production; suspected credential compromise; Stripe webhook anomaly | 24 hours |
| **P3 — Medium** | Security event with limited immediate impact requiring investigation | Failed brute-force campaign; suspicious account activity; dependency vulnerability (CVSS ≥ 7.0) | 72 hours |
| **P4 — Low** | Minor security event; informational; no immediate risk | Automated scanner probe; minor policy violation; low-CVSS dependency | Next sprint |

---

## 5. Security Incident Response Team (SIRT)

| Role | Primary | Backup | Responsibility |
|---|---|---|---|
| **Incident Commander (IC)** | Head of Engineering | Security Lead | Declares incident; coordinates response; owns communications |
| **Security Lead** | Security Lead | Senior Backend Architect | Technical investigation; forensics; containment actions |
| **DevOps Lead** | DevOps Lead | Senior DevOps Engineer | Infrastructure isolation; firewall rules; deployment rollback |
| **Backend Architect** | Lead Backend Architect | Senior Backend Engineer | Code-level analysis; hotfix development |
| **Legal / DPO** | Data Protection Officer | External legal counsel | GDPR breach notification; regulatory communication |
| **Communications Lead** | Head of Product | CEO | External and customer communications |

SIRT contact details are maintained in the private `security/contacts.private.md` file (not version-controlled). All SIRT members must have their personal mobile numbers available 24/7 for P1 incidents.

---

## 6. Incident Response Phases

### Phase 1 — Detection & Identification

**Goal:** Detect the incident as quickly as possible; determine its nature and scope.

**Detection sources:**
- Grafana / Prometheus alerts (error rate spike, latency spike, unusual traffic patterns)
- Loki log alerts (authentication anomalies, repeated 401/403 patterns, stack trace bursts)
- Sentry error monitoring (new error types; error volume spikes)
- AWS GuardDuty findings
- Stripe Dashboard anomalies (unusual payment volumes, chargeback spikes)
- Customer / staff report via support ticket or direct contact
- External security researcher disclosure

**Identification checklist:**
- [ ] What systems are affected?
- [ ] When did the event start? (Check logs for earliest indicator)
- [ ] Is the attack ongoing or historical?
- [ ] What data categories may be involved?
- [ ] Is there a known CVE or matching STRIDE/attack tree scenario?
- [ ] What is the business impact so far?

**Output:** Incident ticket created in the incident tracking system with timestamp, initial description, affected systems, and assigned severity.

---

### Phase 2 — Containment

**Goal:** Stop the bleeding — prevent further damage without destroying forensic evidence.

**Short-term containment actions (execute immediately for P1/P2):**

| Scenario | Containment Action | Command / Location |
|---|---|---|
| Compromised user account | Revoke all sessions, force password reset | `POST /v1/auth/admin/sessions/revoke-all` |
| Compromised admin account | Disable account, notify all admins, rotate JWT key | Admin panel + `rotate-keys.sh` |
| Malicious API traffic (IP) | Block IP at WAF / ALB security group | AWS Console → WAF IP Set |
| Malicious API traffic (user) | Rate-limit / block user account | Admin panel |
| Database breach suspected | Rotate all DB passwords immediately | `rotate-db-passwords.sh` |
| S3 data exposure | Revoke public access; audit bucket policy | AWS Console → S3 → Block Public Access |
| Stripe anomaly | Pause Stripe webhook processing; notify Stripe | Stripe Dashboard → Webhooks |
| Kubernetes cluster compromise | Isolate affected namespace via NetworkPolicy | `kubectl apply -f infra/kubernetes/base/` |
| CI/CD pipeline compromise | Revoke all GitHub Actions secrets; invalidate runner tokens | GitHub Settings → Secrets |
| Ransomware / destructive attack | Isolate affected nodes; do NOT pay ransom; contact legal | DevOps escalation |

**Preserve forensic evidence before containment where possible:**
- Take RDS snapshot before any schema changes
- Export relevant Loki/CloudWatch logs to S3 immediately
- Record memory state of affected pods if possible
- Document all containment actions with timestamps

---

### Phase 3 — Eradication

**Goal:** Remove the root cause from the environment.

**Eradication checklist:**
- [ ] Identify and patch the exploited vulnerability
- [ ] Remove any malicious code, backdoors, or persistence mechanisms
- [ ] Rotate all potentially compromised credentials (see `secrets-rotation/`)
- [ ] Revoke and reissue affected API keys and tokens
- [ ] Remove attacker-created accounts or elevated permissions
- [ ] Verify dependency vulnerability is patched and deployed
- [ ] Confirm no lateral movement occurred to other services

---

### Phase 4 — Recovery

**Goal:** Restore services to normal operation with confidence that the threat is eliminated.

**Recovery checklist:**
- [ ] Deploy patched code to staging; validate fix against the reproduction steps
- [ ] Deploy to production via standard CI/CD pipeline (or emergency deploy if required)
- [ ] Restore from clean backup if data integrity was compromised
- [ ] Re-enable any services or features that were disabled during containment
- [ ] Monitor closely for 24–72 hours post-recovery (increased alert sensitivity)
- [ ] Confirm RTO and RPO targets were met; document if not

**RTO / RPO Targets:**

| Tier | RTO | RPO |
|---|---|---|
| P1 Critical | 4 hours | 1 hour |
| P2 High | 24 hours | 4 hours |
| P3 Medium | 72 hours | 24 hours |

---

### Phase 5 — Post-Incident Review

**Goal:** Learn from the incident; prevent recurrence.

**Post-Incident Report (PIR) must be completed within:**
- P1: 48 hours of recovery
- P2: 5 business days
- P3/P4: 10 business days

**PIR template contents:**
1. Incident timeline (detection, containment, eradication, recovery — with exact timestamps)
2. Root cause analysis (5-Why or fishbone diagram for P1/P2)
3. Impact assessment (data affected, users affected, financial impact, reputational impact)
4. Containment effectiveness (what worked; what was slow)
5. Recovery effectiveness (RTO/RPO met?)
6. Corrective actions (specific, assigned, time-bound)
7. Threat model update (does this incident require updating `security/threat-models/STRIDE.md` or `attack-tree.md`?)

PIRs are stored in `security/incident-reviews/` (not version-controlled; access-restricted).

---

## 7. Regulatory Notification Requirements

### 7.1 UK GDPR — Personal Data Breach

If a security incident constitutes a personal data breach under UK GDPR Article 4(12):

| Threshold | Notification Required | Deadline |
|---|---|---|
| Breach likely to result in risk to individuals | Notify ICO (Information Commissioner's Office) | **72 hours** from becoming aware |
| Breach likely to result in high risk to individuals | Notify affected data subjects directly | Without undue delay |

**ICO Notification Process:**
1. Legal/DPO drafts notification using ICO online portal (https://ico.org.uk/report-a-breach/)
2. Incident Commander and DPO approve before submission
3. Notification must include: nature of breach, categories/approximate number of individuals affected, likely consequences, measures taken or proposed
4. All breach notifications logged in the breach register (`security/audit-logs/`)

### 7.2 PCI DSS — Cardholder Data

If payment card data is involved (even though Lomash Wood does not store raw CHD):

1. Notify Stripe immediately (Stripe handles PCI incident management for Stripe-processed data)
2. Notify acquiring bank within **24 hours**
3. Engage a PCI Forensic Investigator (PFI) if required by acquiring bank

### 7.3 Stripe

Notify Stripe's Risk team immediately at `risk@stripe.com` if:
- Lomash Wood's Stripe secret key is suspected compromised
- Unusual payment patterns suggest API key misuse
- A Stripe webhook compromise is suspected

---

## 8. Communication Templates

### 8.1 Internal P1 Incident Alert (Slack #security-incidents)

```
🚨 SECURITY INCIDENT — P1 CRITICAL
Time Detected: [ISO 8601 UTC]
Affected Systems: [list]
Nature: [brief description]
Incident Commander: [name]
Bridge: [video call link]
All SIRT members: please join the bridge immediately.
```

### 8.2 Customer Notification (Data Breach — High Risk)

```
Subject: Important Security Notice from Lomash Wood

Dear [Customer Name],

We are writing to inform you of a security incident that may have affected your 
account with Lomash Wood. On [DATE], we discovered [BRIEF NON-TECHNICAL DESCRIPTION].

What information was involved: [DATA CATEGORIES]

What we are doing: [ACTIONS TAKEN]

What you should do: [RECOMMENDED ACTIONS e.g., change password, monitor account]

We take the security of your information extremely seriously and sincerely apologise 
for this incident. If you have any questions, please contact us at security@lomashwood.com.

[Signature]
```

---

## 9. Evidence Preservation

All forensic evidence must be preserved in a read-only, integrity-protected form:

- Loki log exports (time-bounded around the incident window) → S3 bucket `lw-security-evidence` (write-once, versioned)
- RDS snapshot taken immediately upon incident declaration → retained for 90 days minimum
- AWS CloudTrail logs → preserved for the incident window
- Network flow logs (VPC Flow Logs) → preserved for the incident window
- All evidence stored with SHA-256 checksums to demonstrate integrity

Evidence must not be modified, overwritten, or deleted during or after the investigation.

---

## 10. Testing & Drills

The incident response procedure is tested as follows:

| Exercise Type | Frequency | Participants |
|---|---|---|
| Tabletop exercise (P1 scenario walkthrough) | Semi-annually | Full SIRT |
| Runbook validation (test each containment action) | Quarterly | DevOps + Security Lead |
| Chaos engineering (controlled failure injection) | Quarterly | DevOps |
| Full incident simulation (red team exercise) | Annually | SIRT + External tester |

Drill results and any process gaps identified are documented in `docs/disaster-recovery/chaos-testing.md`.

---

## 11. Review & Compliance

This policy is reviewed semi-annually, after every P1 incident, and after every annual penetration test. Changes must be approved by the Head of Engineering.

| Role | Responsibility |
|---|---|
| Head of Engineering | Policy owner; Incident Commander for P1 |
| Security Lead | Maintains response runbooks; conducts drills |
| DevOps Lead | Maintains containment scripts; manages infrastructure isolation |
| Legal / DPO | Regulatory notifications; breach register |
| All Engineering Staff | Immediate reporting of suspected incidents |

**Reporting a suspected incident:** Any team member who identifies a potential security incident must report it immediately to the Security Lead or Head of Engineering via the `#security-incidents` Slack channel or by direct message. Do not attempt to investigate independently.

---

*Lomash Wood Ltd — Confidential. Do not distribute outside the engineering organisation.*