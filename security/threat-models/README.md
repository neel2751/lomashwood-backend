# Threat Models — Lomash Wood Security

This directory contains the formal security threat modelling documentation for the Lomash Wood backend platform.

## Contents

| File | Description |
|---|---|
| `STRIDE.md` | Full STRIDE (Spoofing, Tampering, Repudiation, Information Disclosure, Denial of Service, Elevation of Privilege) analysis mapped to all microservices and API endpoints |
| `attack-tree.md` | Attack tree decomposition for the five highest-severity adversary goals, with AND/OR logic, likelihood ratings, and STRIDE cross-references |

## Purpose

Threat modelling is performed to:

1. Systematically identify security threats before they are exploited
2. Prioritise security controls based on risk severity
3. Provide a living reference for security reviews, penetration tests, and architecture decisions
4. Satisfy compliance requirements (GDPR, ISO 27001, SOC 2)

## Methodology

### STRIDE

The STRIDE model categorises threats into six types:

| Letter | Category | Example |
|---|---|---|
| **S** | Spoofing | Impersonating a user or service |
| **T** | Tampering | Modifying data in transit or at rest |
| **R** | Repudiation | Denying an action was taken |
| **I** | Information Disclosure | Exposing sensitive data |
| **D** | Denial of Service | Making the system unavailable |
| **E** | Elevation of Privilege | Gaining unauthorised capabilities |

### Attack Trees

Attack trees model adversary goals as root nodes and decompose them into sub-goals using AND/OR logic. Nodes are annotated with likelihood (Low / Medium / High / Critical) and reference STRIDE threat IDs.

**AND node:** All children must succeed for the parent to succeed  
**OR node:** Any one child succeeding causes the parent to succeed

## Severity Ratings

| Rating | Description |
|---|---|
| **Critical** | Direct, high-confidence path to severe business impact (data breach, financial loss, full system compromise) |
| **High** | Significant impact achievable with moderate attacker skill |
| **Medium** | Requires specific conditions or elevated attacker capability |
| **Low** | Unlikely, requires insider knowledge or physical access |

## How to Use These Documents

- **Development teams:** Reference specific threat IDs (e.g., `S-02`, `T-03`) when reviewing pull requests that touch authentication, payment, or data access logic
- **Security reviewers:** Use as a checklist during code review and penetration test scoping
- **DevOps/Infrastructure:** Map infrastructure mitigations to threat IDs to confirm defence-in-depth coverage
- **Compliance:** Reference as evidence of threat modelling in ISO 27001 Annex A.14 (System Acquisition, Development, Maintenance) and SOC 2 CC6 (Logical and Physical Access)

## Review Schedule

Threat models must be reviewed and updated:

- **Semi-annually** (every 6 months)
- **After any major architectural change** (new service, new external integration, change in data storage)
- **After any security incident** that reveals a gap in the model
- **Before any penetration test** to provide scoping guidance

## Related Documents

| Document | Location |
|---|---|
| Security Policies | `security/policies/` |
| Penetration Test Reports | `security/pentest-reports/` |
| Secrets Rotation Procedures | `security/secrets-rotation/` |
| Audit Log Schema | `security/audit-logs/` |
| Architecture Decision Records | `docs/architecture/ADRs/` |
| API Security Policy | `security/policies/api-security.md` |

## Contacts

| Role | Responsibility |
|---|---|
| Security Lead | Owns and approves all threat model updates |
| Backend Architect | Contributes architectural context and reviews proposed mitigations |
| DevOps Lead | Implements and confirms infrastructure-level mitigations |

---

*Classification: Internal / Confidential — Do not share outside the engineering organisation without prior approval from the Security Lead.*