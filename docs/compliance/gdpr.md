# GDPR Compliance — Lomash Wood Backend

## Overview

This document defines how the Lomash Wood backend achieves and maintains compliance with the General Data Protection Regulation (GDPR) (EU) 2016/679 and the UK GDPR (as retained in UK law by the European Union (Withdrawal) Act 2018). Lomash Wood processes personal data of UK and EU residents in the course of operating its kitchen and bedroom design, sales, and consultation platform.

**Data Controller:** Lomash Wood Ltd
**Data Protection Officer (DPO):** dpo@lomashwood.com
**Supervisory Authority (UK):** Information Commissioner's Office (ICO)
**Primary Data Region:** eu-west-1 (Ireland) / eu-west-2 (London)

---

## Lawful Basis for Processing

All personal data processing activities have a documented lawful basis under GDPR Article 6.

| Processing Activity | Data Involved | Lawful Basis | Retention |
|--------------------|---------------|--------------|-----------|
| User account registration | Name, email, password hash | Contract (Art. 6(1)(b)) | Account lifetime + 2 years |
| Appointment booking | Name, phone, email, address, postcode | Contract (Art. 6(1)(b)) | 3 years |
| Brochure request | Name, phone, email, postcode, address | Legitimate interest (Art. 6(1)(f)) | 2 years |
| Business inquiry | Name, email, phone, business type | Legitimate interest (Art. 6(1)(f)) | 2 years |
| Newsletter subscription | Email | Consent (Art. 6(1)(a)) | Until unsubscribe |
| Payment processing | Payment reference (no raw card data) | Contract (Art. 6(1)(b)) | 7 years (financial obligation) |
| Customer reviews | Name, review content | Consent (Art. 6(1)(a)) | Until withdrawn |
| Session and analytics | IP address, device data, page views | Legitimate interest (Art. 6(1)(f)) + Consent for cookies | 13 months |
| Order and invoice records | Order details, delivery address | Legal obligation (Art. 6(1)(c)) | 7 years |

---

## Personal Data Inventory

### Data Stored Per Service

**auth-service (`lomash_auth`)**

```
users: id, email, password_hash, name, role, email_verified,
       created_at, updated_at, deleted_at, last_login_at,
       failed_login_attempts, locked_until, must_change_password
sessions: id, user_id, token_hash, ip_address, user_agent, expires_at
auth_audit_log: id, user_id, event, ip_address, user_agent, created_at
```

**customer-service (`lomash_customers`)**

```
profiles: id, user_id, phone, address, postcode, city, date_of_birth
wishlists: id, user_id, product_id
reviews: id, user_id, product_id, rating, content, images
support_tickets: id, user_id, subject, description, status
loyalty_points: id, user_id, points, reason, created_at
```

**appointment-service (`lomash_appointments`)**

```
bookings: id, customer_name, customer_email, customer_phone,
          customer_address, customer_postcode, appointment_type,
          is_kitchen, is_bedroom, slot_date, slot_time, status
```

**order-payment-service (`lomash_orders`)**

```
orders: id, user_id, delivery_address, billing_address, status, total
payment_transactions: id, order_id, stripe_payment_intent_id, amount, status
invoices: id, order_id, invoice_number, issued_at
```

**notification-service (`lomash_notifications`)**

```
email_log: id, recipient_email, subject, template, status, sent_at
sms_log: id, recipient_phone, message, status, sent_at
```

**analytics-service (`lomash_analytics`)**

```
page_views: id, session_id, user_id (nullable), page_url, ip_address,
            user_agent, referrer, created_at
events: id, session_id, user_id (nullable), event_name, properties (JSON)
```

---

## Data Subject Rights Implementation

### Right of Access (Art. 15) — Subject Access Request (SAR)

Endpoint: `GET /v1/customers/me/data-export`

The customer-service aggregates personal data across all services and returns a complete JSON export.

```typescript
// customer-service: src/app/profiles/profile.service.ts
async exportUserData(userId: string): Promise<UserDataExport> {
  const [profile, wishlists, reviews, orders, bookings, notifications] =
    await Promise.all([
      this.profileRepository.findByUserId(userId),
      this.wishlistRepository.findAllByUserId(userId),
      this.reviewRepository.findAllByUserId(userId),
      this.orderClient.getOrdersByUserId(userId),
      this.appointmentClient.getBookingsByUserId(userId),
      this.notificationClient.getLogsByUserId(userId),
    ]);

  return {
    exportedAt: new Date().toISOString(),
    profile,
    wishlists,
    reviews,
    orders,
    bookings,
    notificationLog: notifications,
  };
}
```

SARs received outside the platform (by email or post) must be fulfilled within **30 calendar days**.

Log all SAR requests:

```bash
kubectl exec -it postgres-primary-0 -n lomash-wood -- psql -U lomash_admin -d lomash_customers -c \
  "INSERT INTO data_subject_requests (id, user_id, request_type, requested_at, fulfilled_at)
   VALUES (gen_random_uuid(), '<user_id>', 'ACCESS', NOW(), NULL);"
```

### Right to Erasure (Art. 17) — Right to Be Forgotten

Endpoint: `DELETE /v1/customers/me`

Erasure is implemented as a **pseudonymisation + soft delete** to preserve financial and legal records while removing identifying data.

```typescript
// customer-service: src/app/profiles/profile.service.ts
async eraseUserData(userId: string): Promise<void> {
  const anonymisedEmail = `deleted_${userId}@lomashwood.invalid`;

  await this.prisma.$transaction([
    this.prisma.user.update({
      where: { id: userId },
      data: {
        email: anonymisedEmail,
        name: 'Deleted User',
        passwordHash: '',
        deletedAt: new Date(),
      },
    }),
    this.prisma.profile.update({
      where: { userId },
      data: {
        phone: null,
        address: null,
        postcode: null,
        city: null,
        dateOfBirth: null,
        deletedAt: new Date(),
      },
    }),
    this.prisma.session.deleteMany({ where: { userId } }),
  ]);

  // Publish erasure event to all services
  await this.eventProducer.publish('user.erased', { userId });
}
```

**Erasure exclusions (retained for legal obligations):**
- Order and payment records (7-year financial retention)
- Invoice records (7-year legal retention)
- Anonymised analytics events (user_id set to null)

### Right to Rectification (Art. 16)

Endpoint: `PATCH /v1/customers/me/profile`

All profile fields can be updated by the authenticated user directly.

### Right to Restriction (Art. 18)

Endpoint: `POST /v1/customers/me/restrict-processing`

Sets a `processing_restricted` flag on the user record. Services check this flag before processing non-essential data.

### Right to Data Portability (Art. 20)

Same endpoint as SAR: `GET /v1/customers/me/data-export`

Response is machine-readable JSON. A PDF export option is available via the customer dashboard.

### Right to Object (Art. 21)

Endpoint: `POST /v1/customers/me/opt-out`

Removes the user from all marketing communications and disables non-essential analytics tracking.

### Consent Withdrawal

Endpoint: `DELETE /v1/customers/me/consent/:consentType`

Consent types: `newsletter`, `marketing_email`, `analytics_cookies`, `personalisation`.

---

## Data Minimisation

Each service collects only the minimum data required:

- **Appointments:** Postcode is collected for home measurement routing only. Full address is optional.
- **Analytics:** IP addresses are anonymised after 24 hours by the `anonymize-ip.job.ts` background job.
- **Auth:** Only password hashes (bcrypt, cost factor 12) are stored. Plain-text passwords never touch disk.
- **Payments:** No raw card data is stored. Only Stripe `payment_intent_id` and the last 4 digits (from Stripe's response) are retained.

---

## Data Retention and Deletion

Automated retention jobs enforce deletion schedules:

| Job | Schedule | Action |
|-----|----------|--------|
| `anonymize-inactive-users.job.ts` | Weekly | Pseudonymises users inactive for > 3 years |
| `purge-old-events.job.ts` (analytics) | Daily | Deletes raw events older than 13 months |
| `purge-old-logs.job.ts` (notifications) | Weekly | Deletes email/SMS logs older than 2 years |
| `cleanup-sessions.job.ts` | Daily | Deletes expired sessions from auth DB |

**Financial data retention (7 years):**

Order, payment, and invoice records are retained for 7 years to meet HMRC obligations, then permanently deleted:

```bash
kubectl exec -it postgres-primary-0 -n lomash-wood -- psql -U lomash_admin -d lomash_orders -c \
  "DELETE FROM orders WHERE created_at < NOW() - INTERVAL '7 years' AND status IN ('COMPLETED', 'CANCELLED', 'REFUNDED');"
```

---

## Data Security Measures

### Encryption at Rest

- RDS: AES-256 encryption enabled on all database instances.
- S3: Server-side encryption (SSE-S3) on all media buckets.
- Redis: Encryption at rest enabled on ElastiCache.
- Kubernetes secrets: Encrypted at rest in etcd using AWS KMS.

### Encryption in Transit

- All external endpoints: TLS 1.2+ enforced via ALB.
- Internal service-to-service: mTLS within the Kubernetes cluster.
- Database connections: `sslmode=require` enforced in all Prisma connection strings.

### Access Controls

- Production database access: Restricted to service accounts only. No developer has direct production DB access.
- Admin panel: IP allowlist + MFA required for all admin accounts.
- PII fields: Logged only at `debug` level; `debug` logging disabled in production.

---

## Third-Party Data Processors

All third-party processors have signed Data Processing Agreements (DPAs).

| Processor | Purpose | Data Shared | DPA Signed |
|-----------|---------|-------------|------------|
| AWS (Amazon Web Services) | Cloud infrastructure, RDS, S3, EKS | All data at rest | Yes |
| Stripe | Payment processing | Payment reference, email, billing address | Yes |
| Nodemailer / AWS SES | Transactional email | Email address, name | Yes |
| Twilio | SMS notifications | Phone number | Yes |
| Firebase | Push notifications | Device token | Yes |
| Google (GTM/Analytics) | Website analytics | Anonymised IP, page views | Yes |

---

## Breach Notification Procedure

Under GDPR Art. 33, a personal data breach affecting UK/EU residents must be reported to the ICO within **72 hours** of becoming aware.

### Internal Response

1. Contain the breach — revoke compromised credentials, isolate affected services.
2. Assess scope — identify which data categories and how many individuals are affected.
3. Notify DPO (dpo@lomashwood.com) and Engineering Manager immediately.
4. Document the breach in the breach register.

### Regulator Notification (within 72 hours)

Report to ICO: [https://ico.org.uk/for-organisations/report-a-breach/](https://ico.org.uk/for-organisations/report-a-breach/)

Required information:
- Nature of the breach
- Categories and approximate number of individuals affected
- Categories and approximate number of records affected
- Likely consequences of the breach
- Measures taken or proposed to address the breach

### Individual Notification (without undue delay)

If the breach is likely to result in a high risk to individuals' rights and freedoms, notify affected users directly via email through the notification-service:

```bash
curl -X POST https://api.lomashwood.com/v1/notifications/breach-alert \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "affected_user_ids": ["<id1>", "<id2>"],
    "template": "data-breach-notification",
    "breach_date": "2026-02-19",
    "data_categories": ["email", "name", "phone"]
  }'
```

---

## Privacy by Design Checklist

Applied to every new feature and data processing activity:

- [ ] Is this data collection necessary? (Data minimisation)
- [ ] Is a lawful basis documented before collection begins?
- [ ] Is the retention period defined and automated?
- [ ] Can users access, correct, and delete this data via self-service?
- [ ] Is this data encrypted at rest and in transit?
- [ ] Are third-party processors used? Is a DPA in place?
- [ ] Does this feature require a DPIA (Data Protection Impact Assessment)?
- [ ] Are audit logs capturing access to this data?

---

## DPIA Triggers

A Data Protection Impact Assessment is required when introducing:

- New large-scale processing of special category data
- Systematic monitoring of individuals
- Automated decision-making with significant effects
- New third-party data processors

DPIA template: `docs/compliance/dpia-template.md` (to be created per project).

---

## Annual Review

This document must be reviewed annually and after any significant change to data processing activities. Last reviewed: February 2026. Next review: February 2027.