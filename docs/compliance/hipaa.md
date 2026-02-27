# HIPAA Compliance — Lomash Wood Backend

## Overview

This document addresses the applicability of the Health Insurance Portability and Accountability Act (HIPAA) to the Lomash Wood platform and defines the position of the organisation with respect to HIPAA obligations.

**Conclusion: HIPAA does not apply to Lomash Wood in its current operational scope.**

This document exists to:
1. Formally record the applicability assessment
2. Provide guidance should HIPAA-adjacent obligations arise in the future
3. Serve as a reference if Lomash Wood expands into markets or services where health data may be collected

---

## Applicability Assessment

### What HIPAA Covers

HIPAA (Public Law 104-191, 1996), as amended by the HITECH Act (2009), applies to:

- **Covered Entities (CEs):** Health plans, healthcare clearinghouses, and healthcare providers that transmit health information electronically.
- **Business Associates (BAs):** Service providers that create, receive, maintain, or transmit Protected Health Information (PHI) on behalf of a Covered Entity.

**Protected Health Information (PHI)** is individually identifiable health information that relates to:
- The past, present, or future physical or mental health or condition of an individual
- The provision of healthcare to an individual
- The past, present, or future payment for healthcare

### Lomash Wood Business Activity

Lomash Wood operates a **kitchen and bedroom design, sales, and consultation platform**. The platform:

- Collects customer contact details (name, email, phone, postcode, address) for appointment booking and order fulfilment
- Processes payments for kitchen and bedroom products
- Manages consultation bookings (home measurement, online, showroom)
- Publishes content (blog, finance information, media wall)

### Assessment Outcome

| HIPAA Criterion | Lomash Wood Position |
|----------------|---------------------|
| Is Lomash Wood a healthcare provider? | No |
| Is Lomash Wood a health plan? | No |
| Is Lomash Wood a healthcare clearinghouse? | No |
| Does Lomash Wood process PHI on behalf of a CE? | No |
| Does Lomash Wood collect health-related data? | No |
| Does Lomash Wood transmit health information? | No |

**HIPAA does not apply to Lomash Wood in its current form.**

The data collected (names, contact details, home addresses, payment information) constitutes personal data under UK GDPR and EU GDPR, not Protected Health Information under HIPAA. Compliance with UK GDPR is addressed in `docs/compliance/gdpr.md`.

---

## Future Scenarios That Would Trigger HIPAA Review

If Lomash Wood were to expand its services in any of the following directions, a full HIPAA applicability re-assessment would be required:

### Scenario 1 — Healthcare Sector Clientele

If Lomash Wood were to design and supply kitchens or bedrooms for healthcare facilities (hospitals, care homes, GP surgeries) and in doing so gained access to systems or records that contain patient information, a Business Associate Agreement (BAA) assessment would be required.

**Trigger action:** Any contract with a healthcare provider must be reviewed by legal counsel for HIPAA/BAA implications before signing.

### Scenario 2 — Accessibility or Adaptive Design Data

If Lomash Wood were to collect information about customers' medical conditions or disabilities to tailor designs (e.g., wheelchair-accessible kitchens), this data could constitute health information. If linked to an identifiable individual, it could qualify as PHI under a broad interpretation.

**Trigger action:** If collecting disability, health condition, or accessibility requirement data, engage legal counsel to assess whether BAA arrangements or special category data protections under GDPR Art. 9 apply.

### Scenario 3 — US Market Expansion

If Lomash Wood expands operations to the United States and collects health-related information from US residents, full HIPAA compliance would need to be assessed.

**Trigger action:** Before launching in the US, conduct a HIPAA applicability review with a qualified US healthcare compliance attorney.

### Scenario 4 — Integration with Health Platforms

If Lomash Wood were to integrate with any health-focused platform (e.g., a home care assessment tool, NHS Digital APIs, or care management platforms), HIPAA (for US) or special category data rules under GDPR (for UK/EU) would apply.

**Trigger action:** Any third-party API integration involving health or care platforms must be assessed for HIPAA and/or GDPR Art. 9 implications before integration commences.

---

## UK Analogue — NHS Data Security and Protection Toolkit

While HIPAA itself does not apply, UK organisations that handle NHS patient data or work with NHS systems must comply with the **NHS Data Security and Protection (DSP) Toolkit**.

**Current status:** Lomash Wood does not handle NHS patient data and is not required to complete the DSP Toolkit.

If Lomash Wood were to supply to NHS facilities and gain access to NHS systems, DSP Toolkit compliance would be mandatory.

---

## Special Category Data Under UK GDPR

Although HIPAA does not apply, health data collected incidentally (for example, a customer noting a physical disability in a consultation form) would constitute **special category data** under UK GDPR Article 9. This requires:

- An explicit lawful basis (explicit consent, or another Art. 9(2) condition)
- A Data Protection Impact Assessment (DPIA)
- Heightened security controls
- Explicit staff training on handling special category data

**Current status:** Lomash Wood does not intentionally collect health or disability data. If such data is submitted by a customer in a free-text field, staff are instructed not to process it beyond the immediate service delivery context, and it must be reported to the DPO.

---

## General Health Data Handling Principles

Even where HIPAA does not apply, the following principles are adopted as best practice:

| Principle | Implementation |
|-----------|---------------|
| Do not collect what is not needed | No health data fields exist in any Lomash Wood form |
| Protect incidental health disclosures | Free-text fields are not indexed or used for profiling |
| Staff awareness | All staff are trained not to record or act on incidental health disclosures beyond immediate service need |
| Report to DPO | Any incidental health data received must be reported to dpo@lomashwood.com |
| Secure disposal | Any records containing incidental health data are flagged for early deletion under GDPR Art. 17 |

---

## Review Triggers

This HIPAA applicability assessment must be re-evaluated when:

- Lomash Wood expands into the US market
- A new product or service line is proposed that involves health, care, or accessibility data
- A partnership or integration with a healthcare entity is contemplated
- Legal or regulatory changes extend HIPAA to new categories of organisations

**Next scheduled review:** February 2027, or earlier if any of the above triggers occur.

**Review owner:** DPO (dpo@lomashwood.com) with input from legal counsel.

---

## Contact

For questions regarding this document or to report an unexpected HIPAA-related obligation:

- **DPO:** dpo@lomashwood.com
- **Legal Counsel:** To be appointed
- **Engineering Manager:** For technical implementation questions