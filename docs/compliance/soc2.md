# SOC 2 Compliance — Lomash Wood Backend

## Overview

This document maps the Lomash Wood backend to the AICPA SOC 2 (Service Organisation Control 2) Trust Services Criteria (TSC). SOC 2 Type I (design effectiveness) is the initial target, with SOC 2 Type II (operational effectiveness over a 12-month period) as the subsequent goal.

**Framework:** AICPA Trust Services Criteria (2017 with 2022 points of focus)
**Audit Type Target:** SOC 2 Type I → Type II
**Trust Service Categories in Scope:** Security (CC), Availability (A), Confidentiality (C), Privacy (P)
**Processing Integrity:** Out of scope at this stage
**Auditor:** To be engaged (Big 4 or specialist SOC 2 firm)

---

## CC1 — Control Environment

### CC1.1 — COSO Principle 1: Commitment to Integrity and Ethical Values

Lomash Wood maintains an information security policy (`security/policies/`) that establishes expected behaviour for all personnel. All engineers acknowledge the policy on joining. Violations are subject to disciplinary action up to and including termination.

### CC1.2 — COSO Principle 2: Board Oversight

The CTO provides executive oversight of the information security programme. Security is a standing agenda item in quarterly engineering leadership reviews.

### CC1.3 — COSO Principle 3: Structures, Reporting Lines, and Authorities

| Role | Security Authority |
|------|-------------------|
| CTO | Risk acceptance; ISMS executive sponsor |
| Engineering Manager | Operational security owner; incident authority |
| Lead Backend Engineer | Technical security decisions; code review gate |
| DPO | Privacy compliance; breach notification |
| DevOps Engineer | Infrastructure security; secrets and access management |

### CC1.4 — COSO Principle 4: Commitment to Competence

All engineers handling sensitive systems complete:
- Annual security awareness training
- Secure development training (OWASP Top 10)
- Incident response tabletop exercises (quarterly)

### CC1.5 — COSO Principle 5: Accountability

All production actions are logged. Access to production systems is audited via AWS CloudTrail. Performance reviews include adherence to security policies.

---

## CC2 — Communication and Information

### CC2.1 — COSO Principle 13: Relevant, Quality Information

Security-relevant information is communicated through:
- Grafana dashboards (`observability/dashboards/`)
- PagerDuty for alerting
- Slack `#alerts` and `#incidents` channels
- Weekly security digest (GitHub Dependabot, AWS Security Hub findings)

### CC2.2 — COSO Principle 14: Internal Communication

Security incidents are communicated via the incident response procedure in `security/policies/incident-response.md`. All staff are aware of the reporting path.

### CC2.3 — COSO Principle 15: External Communication

- Customers can report security vulnerabilities via security@lomashwood.com.
- A responsible disclosure policy is published at `lomashwood.com/security`.
- Regulatory notifications (ICO, acquiring bank) follow the procedures in `docs/compliance/gdpr.md` and `docs/compliance/pci-dss.md`.

---

## CC3 — Risk Assessment

### CC3.1 — COSO Principle 6: Specify Suitable Objectives

Business objectives that security must protect:
1. Uninterrupted appointment booking (revenue-critical)
2. Secure payment processing (PCI-DSS obligation)
3. Protection of customer PII (GDPR/UK GDPR obligation)
4. Availability of the product catalogue (customer experience)

### CC3.2 — COSO Principle 7: Identify and Analyse Risk

The risk register is maintained in `docs/compliance/iso27001.md` (Section 6.1). Risks are assessed quarterly and after significant changes.

### CC3.3 — COSO Principle 8: Assess Fraud Risk

Fraud risk areas identified:
- Account takeover (mitigated by rate limiting, MFA option, device fingerprinting)
- Payment fraud (mitigated by Stripe Radar, 3DS enforcement for high-value orders)
- Insider threat (mitigated by audit logging, least privilege, access reviews)

### CC3.4 — COSO Principle 9: Identify and Analyse Change

A change management process is enforced:
- All production changes go through GitHub PRs
- Infrastructure changes require peer review of Terraform plans
- Security-sensitive changes require Lead Backend Engineer approval (CODEOWNERS)
- Post-deployment smoke tests validate system integrity after changes

---

## CC4 — Monitoring Activities

### CC4.1 — COSO Principle 16: Conduct Ongoing Evaluations

Continuous monitoring:

| Monitor | Tool | Alert Threshold |
|---------|------|----------------|
| Error rate | Prometheus + Grafana | > 1% for 5 minutes |
| P95 latency | Prometheus + Grafana | > 2× baseline for 5 minutes |
| Failed logins | auth-service logs | > 50/min for single IP |
| Unpatched CRITICAL CVEs | Trivy + Dependabot | > 0 unresolved after 24 hours |
| Secrets in Git | git-secrets pre-commit | Any detection |
| CloudTrail anomalies | AWS GuardDuty | Any HIGH finding |

### CC4.2 — COSO Principle 17: Evaluate and Communicate Deficiencies

Security deficiencies found during monitoring, audits, or penetration tests are:
1. Logged as Jira tickets with `security` label
2. Prioritised by severity (CRITICAL/HIGH/MEDIUM/LOW)
3. Communicated to the Engineering Manager
4. Tracked to resolution with evidence

---

## CC5 — Control Activities

### CC5.1 — COSO Principle 10: Select and Develop Control Activities

Controls are selected from the risk register and implemented as:
- Preventive: input validation, authentication, rate limiting, encryption
- Detective: logging, monitoring, alerts, audit trails
- Corrective: incident response, rollback, patch management

### CC5.2 — COSO Principle 11: Select and Develop General Technology Controls

**Change control:**

```yaml
# .github/workflows/deploy-production.yml (extract)
jobs:
  deploy:
    environment: production  # Requires manual approval from Engineering Manager
    steps:
      - name: Pre-deployment snapshot
        run: bash scripts/pre-deploy-snapshot.sh
      - name: Deploy
        run: bash scripts/deploy.sh
      - name: Smoke test
        run: bash scripts/smoke-test.sh production
```

**Deployment rollback:** See `docs/runbooks/deployment-rollback.md`.

### CC5.3 — COSO Principle 12: Deploy Through Policies and Procedures

All controls are documented in:
- `security/policies/` — security policies
- `docs/runbooks/` — operational procedures
- `docs/onboarding/` — developer onboarding and coding standards

---

## CC6 — Logical and Physical Access Controls

### CC6.1 — Logical Access Security Software, Infrastructure, and Architectures

**Authentication:**
- Better Auth with bcrypt password hashing (cost factor 12)
- JWT access tokens (15-minute expiry) + refresh tokens (7-day expiry)
- Token blacklist in Redis for immediate revocation
- MFA available for customer accounts; mandatory for admin accounts

**Authorisation:**
- RBAC enforced at the API gateway and service level
- Role hierarchy: `super_admin` > `admin` > `consultant` > `customer`

```typescript
// api-gateway: src/middleware/auth.middleware.ts
export const requireRole = (roles: Role[]) =>
  (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    if (!req.user || !roles.includes(req.user.role)) {
      throw new ForbiddenError('Insufficient permissions');
    }
    next();
  };
```

### CC6.2 — New Internal and External Users

- New employee AWS access provisioned via Terraform IAM modules
- Access follows least-privilege principle from day one
- Provisioning requires Engineering Manager approval in Jira

### CC6.3 — Network Access

- All services run in private VPC subnets
- Only the API Gateway ALB is publicly accessible
- Service-to-service communication is restricted by Kubernetes NetworkPolicies
- VPN required for all developer access to internal tools

### CC6.4 — Access Removal

Offboarding SLA: All access removed within **24 hours** of departure.

Offboarding checklist:
- [ ] AWS IAM user/role removed
- [ ] GitHub organisation membership revoked
- [ ] Stripe dashboard access revoked
- [ ] PagerDuty access revoked
- [ ] Slack deprovisioned
- [ ] VPN certificate revoked
- [ ] Active sessions invalidated in auth-service

### CC6.5 — Logical Access Restrictions

Production database access is granted only via:
1. IAM-authenticated RDS Proxy (no static passwords)
2. Bastion host with MFA
3. Access logging to CloudTrail

No developer has standing write access to production databases.

### CC6.6 — Security Events

AWS GuardDuty monitors for:
- Unusual API call patterns
- Compromised EC2 instances
- Cryptomining activity
- Reconnaissance attempts

GuardDuty findings are routed to Slack `#security-alerts` via an EventBridge rule.

### CC6.7 — Transmission of Data

- All data in transit uses TLS 1.2+
- Internal service-to-service communication uses mTLS within the cluster
- File uploads route directly from the browser to S3 via pre-signed URLs (no data transits Lomash Wood servers)

### CC6.8 — Malicious Software

- Container images are scanned by Trivy in CI (blocks on CRITICAL)
- ECR image scanning is enabled (scans on push)
- AWS GuardDuty EC2 protection is enabled
- No untrusted third-party scripts run on Lomash Wood servers

---

## CC7 — System Operations

### CC7.1 — Detection and Monitoring

Monitoring stack (see `observability/`):
- Prometheus + Grafana — metrics and alerting
- Loki + Promtail — log aggregation
- Tempo — distributed tracing
- Sentry — error tracking

### CC7.2 — Monitoring for Anomalies and Threats

Automated alerts fire for:
- Auth anomalies (login failures, impossible travel)
- API rate limit breaches at scale
- Unusual data export volumes
- CloudTrail events from unexpected IPs or regions

### CC7.3 — Incident Evaluation and Classification

Incidents are classified using the severity matrix in `docs/runbooks/outage.md` (P0–P3). All P0/P1 incidents require post-mortems.

### CC7.4 — Incident Response

Incident response procedures: `security/policies/incident-response.md`

Response objectives:
- P0: Acknowledge < 5 minutes; contain < 30 minutes; resolve < 4 hours
- P1: Acknowledge < 15 minutes; resolve < 2 hours

### CC7.5 — Security Incident Mitigation

Mitigation tools available to on-call engineers:
- `kubectl rollout undo` — deployment rollback
- `kubectl scale deployment --replicas=0` — service isolation
- AWS WAF rule updates — IP blocking
- Redis `DEL` — session invalidation
- Stripe Dashboard — payment pause

---

## CC8 — Change Management

### CC8.1 — Changes to Infrastructure, Data, Software, and Procedures

All changes follow the process:
1. Jira ticket created
2. PR opened with description of change and risk assessment
3. CI pipeline must pass (tests, linting, security scan)
4. Peer review (Lead Engineer for security-sensitive changes)
5. Manual approval gate in GitHub Actions for production
6. Pre-deployment backup taken
7. Deployment executed
8. Smoke tests run
9. Rollback executed if smoke tests fail

---

## CC9 — Risk Mitigation

### CC9.1 — Risk Mitigation Activities

Key risk mitigations:

| Risk | Mitigation | Control Type |
|------|-----------|-------------|
| Data breach via SQL injection | Prisma ORM (parameterised queries) | Preventive |
| Unauthorised access | RBAC + JWT + MFA | Preventive |
| DDoS | AWS Shield + WAF + rate limiting | Preventive |
| Secret exposure | AWS Secrets Manager + pre-commit hooks | Preventive |
| Payment fraud | Stripe Radar + 3DS | Preventive |
| Data loss | RDS Multi-AZ + PITR + S3 CRR | Corrective |
| Insider threat | Audit logging + access reviews | Detective |
| Vulnerability exploitation | Trivy + Dependabot + patch SLA | Preventive |

### CC9.2 — Risk Mitigation with Vendors and Business Partners

All third-party processors (AWS, Stripe, Twilio, Firebase) are assessed for SOC 2 or equivalent compliance before onboarding. Vendor security reviews are conducted annually.

---

## Availability Criteria (A-Series)

### A1.1 — Availability Commitments

SLA targets are defined in `docs/disaster-recovery/rpo-rto.md`:
- Tier 1 services: 99.9% monthly uptime
- Payment processing: 99.95% monthly uptime

### A1.2 — Availability Monitoring and Alerting

Uptime is monitored by AWS Route 53 health checks and Grafana SLA dashboards (`dashboards/sla-slo-dashboard.json`).

### A1.3 — Environmental Protections

Covered by AWS data centre controls. All Lomash Wood infrastructure runs in ISO 27001-certified AWS facilities.

---

## Confidentiality Criteria (C-Series)

### C1.1 — Confidential Information Identification

Data classification:

| Class | Examples | Controls |
|-------|---------|---------|
| Restricted | JWT secrets, Stripe keys, DB passwords | AWS Secrets Manager, never logged |
| Confidential | Customer PII, order data, payment references | Encrypted at rest, RBAC restricted |
| Internal | Application logs, metrics, Jira tickets | Authentication required |
| Public | Product listings, blog content, pricing | No restrictions |

### C1.2 — Confidential Information Disposal

Disposal processes:
- Database records: automated retention jobs (see `gdpr.md`)
- Log files: Loki retention policy (13 months online, then purged)
- Developer workstations: full wipe required before disposal/reassignment

---

## Privacy Criteria (P-Series)

Privacy practices are fully documented in `docs/compliance/gdpr.md`. SOC 2 Privacy criteria align with GDPR obligations already implemented.

Key alignments:
- P1.1 (Privacy notice): Published at `lomashwood.com/privacy`
- P3.1 (Consent): Implemented via consent management in customer-service
- P4.2 (Data quality): Customers can update all personal data via `PATCH /v1/customers/me/profile`
- P6.1 (Access to personal information): Implemented via `GET /v1/customers/me/data-export`
- P6.3 (Deletion): Implemented via `DELETE /v1/customers/me`
- P8.1 (Breach notification): Procedure in `gdpr.md`

---

## SOC 2 Readiness Checklist

- [ ] Formal risk register documented and reviewed
- [ ] All policies reviewed and signed off within last 12 months
- [ ] Access reviews completed in the last quarter
- [ ] Penetration test report available (< 12 months old)
- [ ] Vulnerability scan results reviewed and actioned
- [ ] Incident response procedure tested via tabletop exercise
- [ ] Backup and restore procedure tested successfully
- [ ] Vendor SOC 2 reports obtained (AWS, Stripe)
- [ ] Auditor engaged and readiness assessment completed
- [ ] Evidence collection system in place (Drata / Vanta / manual)

Next review: Quarterly until Type I audit is completed.