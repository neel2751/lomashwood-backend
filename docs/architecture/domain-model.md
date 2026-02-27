# Domain Model — Lomash Wood Backend

## Overview

This document describes the core business entities, their relationships, and the bounded contexts that map to each microservice. The domain model is derived directly from the SRS functional requirements.

---

## Bounded Contexts

Each bounded context owns its entities exclusively. No service reaches into another's database.

```
┌─────────────────────┐  ┌─────────────────────┐  ┌─────────────────────┐
│   Identity Context  │  │   Catalogue Context  │  │  Commerce Context   │
│   (auth-service)    │  │  (product-service)   │  │ (order-payment-svc) │
│                     │  │                     │  │                     │
│  User               │  │  Product            │  │  Order              │
│  Session            │  │  Category           │  │  OrderItem          │
│  Role               │  │  Colour             │  │  Payment            │
│  Permission         │  │  Size / Unit        │  │  PaymentTransaction │
│  OTPCode            │  │  Sale               │  │  Invoice            │
│  PasswordReset      │  │  Package            │  │  Refund             │
│  TokenBlacklist     │  │  Inventory          │  │  Coupon             │
└─────────────────────┘  │  Pricing            │  └─────────────────────┘
                         └─────────────────────┘

┌─────────────────────┐  ┌─────────────────────┐  ┌─────────────────────┐
│ Appointment Context │  │   Content Context   │  │  Customer Context   │
│ (appointment-svc)   │  │  (content-service)  │  │  (customer-service) │
│                     │  │                     │  │                     │
│  Booking            │  │  Page               │  │  Profile            │
│  AppointmentType    │  │  Blog               │  │  Address            │
│  TimeSlot           │  │  MediaWall          │  │  Wishlist           │
│  Consultant         │  │  SeoMeta            │  │  WishlistItem       │
│  Availability       │  │  LandingPage        │  │  Review             │
│  Showroom           │  │  Slider             │  │  SupportTicket      │
│  Reminder           │  │  FinanceContent     │  │  LoyaltyAccount     │
│  BrochureRequest    │  │  FAQ                │  │  LoyaltyTransaction │
│  BusinessInquiry    │  │  Testimonial        │  │  NewsletterSub      │
│  ContactSubmission  │  │  Logo               │  │  Referral           │
└─────────────────────┘  │  Accreditation      │  └─────────────────────┘
                         └─────────────────────┘

┌─────────────────────┐  ┌─────────────────────┐
│Notification Context │  │ Analytics Context   │
│(notification-svc)   │  │ (analytics-service) │
│                     │  │                     │
│  NotificationLog    │  │  TrackingEvent      │
│  EmailTemplate      │  │  PageView           │
│  SmsTemplate        │  │  Session            │
│  PushTemplate       │  │  Conversion         │
│  DeliveryReport     │  │  Funnel             │
│  Campaign           │  │  FunnelStep         │
│  Subscription       │  │  Cohort             │
│  NotifPreference    │  │  Dashboard          │
└─────────────────────┘  │  Export             │
                         └─────────────────────┘
```

---

## Core Entity Definitions

### Identity Context

#### User
The central identity. Customers register and log in; admins and consultants are seeded or invited.

```
User
├── id              UUID PK
├── email           CITEXT UNIQUE NOT NULL
├── passwordHash    TEXT NOT NULL
├── firstName       TEXT NOT NULL
├── lastName        TEXT NOT NULL
├── phone           TEXT
├── role            Enum(SUPER_ADMIN, ADMIN, CONSULTANT, CUSTOMER)
├── isVerified      BOOLEAN DEFAULT false
├── isActive        BOOLEAN DEFAULT true
├── lastLoginAt     TIMESTAMPTZ
├── createdAt       TIMESTAMPTZ
├── updatedAt       TIMESTAMPTZ
└── deletedAt       TIMESTAMPTZ  ← soft delete
```

#### Session
Tracks active authenticated sessions. Stored in both PostgreSQL (audit) and Redis (fast lookup).

```
Session
├── id          UUID PK
├── userId      UUID FK → User
├── token       TEXT UNIQUE  ← hashed refresh token
├── userAgent   TEXT
├── ipAddress   INET
├── expiresAt   TIMESTAMPTZ
├── revokedAt   TIMESTAMPTZ
├── createdAt   TIMESTAMPTZ
└── updatedAt   TIMESTAMPTZ
```

#### Role / Permission
Fine-grained RBAC beyond the top-level role enum.

```
Role
├── id          UUID PK
├── name        TEXT UNIQUE
├── description TEXT
└── permissions Permission[] M:M

Permission
├── id          UUID PK
├── resource    TEXT   ← e.g. "product", "booking"
└── action      TEXT   ← e.g. "create", "read", "update", "delete"
```

---

### Catalogue Context

#### Product
The central sellable entity. Products are either Kitchen or Bedroom type (FR9.1).

```
Product
├── id              UUID PK
├── title           TEXT NOT NULL
├── slug            TEXT UNIQUE NOT NULL
├── description     TEXT
├── category        Enum(KITCHEN, BEDROOM)
├── rangeName       TEXT
├── basePrice       DECIMAL(10,2)
├── isActive        BOOLEAN DEFAULT true
├── isFeatured      BOOLEAN DEFAULT false
├── sortOrder       INT DEFAULT 0
├── images          ProductImage[] 1:M
├── colours         ProductColour[] M:M via join table
├── sizes           ProductSize[] 1:M
├── seoMeta         SeoMeta? 1:1
├── inventoryItems  InventoryItem[] 1:M
├── createdAt       TIMESTAMPTZ
├── updatedAt       TIMESTAMPTZ
└── deletedAt       TIMESTAMPTZ
```

#### Colour
Reusable colour swatches selectable on products (FR9.2).

```
Colour
├── id          UUID PK
├── name        TEXT NOT NULL
├── hexCode     TEXT NOT NULL  ← e.g. "#FFFFFF"
├── isActive    BOOLEAN DEFAULT true
├── createdAt   TIMESTAMPTZ
└── updatedAt   TIMESTAMPTZ
```

#### Sale
Offer / promotion entity. Can link to specific products or entire categories (FR9.3, FR4.0).

```
Sale
├── id              UUID PK
├── title           TEXT NOT NULL
├── description     TEXT
├── imageUrl        TEXT
├── termsConditions TEXT
├── discountType    Enum(PERCENTAGE, FIXED_AMOUNT)
├── discountValue   DECIMAL(10,2)
├── startsAt        TIMESTAMPTZ
├── endsAt          TIMESTAMPTZ
├── isActive        BOOLEAN DEFAULT true
├── products        Product[] M:M via SaleProduct
├── categories      Enum(KITCHEN, BEDROOM)[]
├── createdAt       TIMESTAMPTZ
└── updatedAt       TIMESTAMPTZ
```

#### Package
Bundled product deals shown on the home page and package page (FR1.6).

```
Package
├── id          UUID PK
├── title       TEXT NOT NULL
├── description TEXT
├── imageUrl    TEXT
├── price       DECIMAL(10,2)
├── category    Enum(KITCHEN, BEDROOM, BOTH)
├── isActive    BOOLEAN DEFAULT true
├── createdAt   TIMESTAMPTZ
└── updatedAt   TIMESTAMPTZ
```

#### ProductSize (Unit)
Configurable size/unit variants per product — each with its own image and description (FR9.1).

```
ProductSize
├── id          UUID PK
├── productId   UUID FK → Product
├── title       TEXT NOT NULL
├── description TEXT
├── imageUrl    TEXT
├── dimensions  JSONB   ← { width, height, depth, unit }
├── sortOrder   INT DEFAULT 0
├── createdAt   TIMESTAMPTZ
└── updatedAt   TIMESTAMPTZ
```

---

### Commerce Context

#### Order

```
Order
├── id              UUID PK
├── orderNumber     TEXT UNIQUE  ← human-readable e.g. LW-20260001
├── userId          UUID         ← reference to auth-service User (denormalised)
├── status          Enum(PENDING, CONFIRMED, PROCESSING, SHIPPED, DELIVERED, CANCELLED, REFUNDED)
├── subtotal        DECIMAL(10,2)
├── discountAmount  DECIMAL(10,2) DEFAULT 0
├── taxAmount       DECIMAL(10,2) DEFAULT 0
├── shippingAmount  DECIMAL(10,2) DEFAULT 0
├── total           DECIMAL(10,2)
├── currency        TEXT DEFAULT 'GBP'
├── notes           TEXT
├── items           OrderItem[] 1:M
├── payment         Payment? 1:1
├── invoice         Invoice? 1:1
├── createdAt       TIMESTAMPTZ
├── updatedAt       TIMESTAMPTZ
└── deletedAt       TIMESTAMPTZ
```

#### Payment
Stripe payment record with idempotency support (FR payments).

```
Payment
├── id                  UUID PK
├── orderId             UUID FK → Order UNIQUE
├── stripePaymentIntentId TEXT UNIQUE
├── stripeCustomerId    TEXT
├── amount              DECIMAL(10,2)
├── currency            TEXT DEFAULT 'GBP'
├── status              Enum(PENDING, PROCESSING, SUCCEEDED, FAILED, CANCELLED, REFUNDED)
├── method              Enum(CARD, BANK_TRANSFER)
├── idempotencyKey      TEXT UNIQUE
├── metadata            JSONB
├── failureCode         TEXT
├── failureMessage      TEXT
├── transactions        PaymentTransaction[] 1:M
├── createdAt           TIMESTAMPTZ
└── updatedAt           TIMESTAMPTZ
```

---

### Appointment Context

#### Booking
The primary appointment entity — captures the full 4-step booking flow (FR5.0).

```
Booking
├── id              UUID PK
├── referenceCode   TEXT UNIQUE  ← e.g. BK-20260001
├── userId          UUID         ← auth-service User reference
├── type            Enum(HOME_MEASUREMENT, ONLINE, SHOWROOM)
├── forKitchen      BOOLEAN DEFAULT false
├── forBedroom      BOOLEAN DEFAULT false
├── firstName       TEXT NOT NULL
├── lastName        TEXT NOT NULL
├── email           TEXT NOT NULL
├── phone           TEXT NOT NULL
├── postcode        TEXT NOT NULL
├── address         TEXT
├── slotId          UUID FK → TimeSlot
├── consultantId    UUID FK → Consultant
├── showroomId      UUID FK → Showroom (nullable)
├── status          Enum(PENDING, CONFIRMED, COMPLETED, CANCELLED, NO_SHOW)
├── notes           TEXT
├── reminderSent    BOOLEAN DEFAULT false
├── cancelledAt     TIMESTAMPTZ
├── cancelReason    TEXT
├── createdAt       TIMESTAMPTZ
├── updatedAt       TIMESTAMPTZ
└── deletedAt       TIMESTAMPTZ
```

#### TimeSlot
Available booking slots — exclusion constraint prevents double-booking (btree_gist).

```
TimeSlot
├── id              UUID PK
├── consultantId    UUID FK → Consultant
├── showroomId      UUID FK → Showroom (nullable — online/home slots)
├── startsAt        TIMESTAMPTZ NOT NULL
├── endsAt          TIMESTAMPTZ NOT NULL
├── isBooked        BOOLEAN DEFAULT false
├── isBlocked       BOOLEAN DEFAULT false  ← consultant holiday/unavailability
├── createdAt       TIMESTAMPTZ
└── updatedAt       TIMESTAMPTZ
-- EXCLUDE USING gist (consultantId WITH =, tstzrange(startsAt, endsAt) WITH &&)
```

#### Showroom
Physical showroom locations (FR6.0).

```
Showroom
├── id              UUID PK
├── name            TEXT NOT NULL
├── slug            TEXT UNIQUE NOT NULL
├── address         TEXT NOT NULL
├── imageUrl        TEXT
├── email           TEXT
├── phone           TEXT
├── openingHours    JSONB  ← { monday: "9:00-18:00", ... }
├── mapLink         TEXT
├── isActive        BOOLEAN DEFAULT true
├── createdAt       TIMESTAMPTZ
└── updatedAt       TIMESTAMPTZ
```

#### BrochureRequest
Submitted via the Request Brochure form (FR8.1, FR8.2).

```
BrochureRequest
├── id          UUID PK
├── firstName   TEXT NOT NULL
├── lastName    TEXT NOT NULL
├── email       TEXT NOT NULL
├── phone       TEXT NOT NULL
├── postcode    TEXT NOT NULL
├── address     TEXT
├── sentAt      TIMESTAMPTZ  ← null until brochure email is dispatched
├── createdAt   TIMESTAMPTZ
└── updatedAt   TIMESTAMPTZ
```

#### BusinessInquiry
Submitted via Business With Us form (FR8.3, FR8.4).

```
BusinessInquiry
├── id              UUID PK
├── name            TEXT NOT NULL
├── email           TEXT NOT NULL
├── phone           TEXT NOT NULL
├── businessType    TEXT NOT NULL
├── message         TEXT
├── notifiedAt      TIMESTAMPTZ  ← when internal mail was sent
├── createdAt       TIMESTAMPTZ
└── updatedAt       TIMESTAMPTZ
```

---

### Content Context

#### Blog
Inspiration / guide posts (FR7.2).

```
Blog
├── id              UUID PK
├── title           TEXT NOT NULL
├── slug            TEXT UNIQUE NOT NULL
├── excerpt         TEXT
├── content         TEXT  ← rich text / markdown
├── coverImageUrl   TEXT
├── authorId        UUID  ← auth-service User reference
├── category        TEXT
├── tags            TEXT[]
├── status          Enum(DRAFT, PUBLISHED, ARCHIVED)
├── publishedAt     TIMESTAMPTZ
├── seoMeta         SeoMeta? 1:1
├── createdAt       TIMESTAMPTZ
├── updatedAt       TIMESTAMPTZ
└── deletedAt       TIMESTAMPTZ
```

#### MediaWall
Image/video gallery section with CTA (FR1.7, FR7.3).

```
MediaWall
├── id              UUID PK
├── title           TEXT NOT NULL
├── description     TEXT
├── backgroundImageUrl TEXT
├── images          MediaWallItem[] 1:M
├── ctaText         TEXT
├── ctaUrl          TEXT
├── isActive        BOOLEAN DEFAULT true
├── createdAt       TIMESTAMPTZ
└── updatedAt       TIMESTAMPTZ
```

#### HomePageSlider
Hero section slider (FR1.3).

```
HomePageSlider
├── id          UUID PK
├── imageUrl    TEXT NOT NULL
├── title       TEXT
├── description TEXT
├── buttonText  TEXT
├── buttonUrl   TEXT
├── sortOrder   INT DEFAULT 0
├── isActive    BOOLEAN DEFAULT true
├── createdAt   TIMESTAMPTZ
└── updatedAt   TIMESTAMPTZ
```

#### FinanceContent
Dynamic finance page content (FR7.1).

```
FinanceContent
├── id          UUID PK
├── title       TEXT NOT NULL
├── description TEXT
├── content     TEXT  ← rich text
├── isActive    BOOLEAN DEFAULT true
├── createdAt   TIMESTAMPTZ
└── updatedAt   TIMESTAMPTZ
```

---

### Customer Context

#### Profile
Extended customer data beyond the auth User record.

```
Profile
├── id              UUID PK
├── userId          UUID UNIQUE  ← auth-service User
├── avatarUrl       TEXT
├── dateOfBirth     DATE
├── preferredCategory Enum(KITCHEN, BEDROOM, BOTH)
├── marketingOptIn  BOOLEAN DEFAULT false
├── addresses       Address[] 1:M
├── createdAt       TIMESTAMPTZ
└── updatedAt       TIMESTAMPTZ
```

#### Review
Customer product or service review with optional media (FR9.0 Customer Review).

```
Review
├── id          UUID PK
├── userId      UUID   ← auth-service User
├── productId   UUID   ← product-service Product (cross-context reference)
├── rating      SMALLINT CHECK (rating BETWEEN 1 AND 5)
├── title       TEXT
├── body        TEXT
├── mediaUrls   TEXT[]
├── status      Enum(PENDING, APPROVED, REJECTED)
├── approvedAt  TIMESTAMPTZ
├── createdAt   TIMESTAMPTZ
├── updatedAt   TIMESTAMPTZ
└── deletedAt   TIMESTAMPTZ
```

#### LoyaltyAccount

```
LoyaltyAccount
├── id          UUID PK
├── userId      UUID UNIQUE
├── balance     INT DEFAULT 0  ← points
├── tier        Enum(BRONZE, SILVER, GOLD, PLATINUM)
├── transactions LoyaltyTransaction[] 1:M
├── createdAt   TIMESTAMPTZ
└── updatedAt   TIMESTAMPTZ
```

#### NewsletterSubscription
(FR9.6 Newsletter Table)

```
NewsletterSubscription
├── id              UUID PK
├── email           CITEXT UNIQUE NOT NULL
├── firstName       TEXT
├── isActive        BOOLEAN DEFAULT true
├── subscribedAt    TIMESTAMPTZ DEFAULT NOW()
├── unsubscribedAt  TIMESTAMPTZ
└── source          TEXT  ← e.g. "footer", "brochure-page"
```

---

## Entity Relationship Overview

```
User (auth) ──────────────────────── Session (auth) 1:M
User (auth) ──────────────────────── Booking (appointment) 1:M
User (auth) ──────────────────────── Order (order) 1:M
User (auth) ──────────────────────── Profile (customer) 1:1
User (auth) ──────────────────────── Review (customer) 1:M
User (auth) ──────────────────────── LoyaltyAccount (customer) 1:1

Product (catalogue) ───────────────── Colour (catalogue) M:M
Product (catalogue) ───────────────── ProductSize (catalogue) 1:M
Product (catalogue) ───────────────── Sale (catalogue) M:M
Product (catalogue) ───────────────── InventoryItem (catalogue) 1:M

Order (commerce) ──────────────────── OrderItem (commerce) 1:M
Order (commerce) ──────────────────── Payment (commerce) 1:1
Order (commerce) ──────────────────── Invoice (commerce) 1:1
Payment (commerce) ────────────────── Refund (commerce) 1:M

Booking (appointment) ─────────────── TimeSlot (appointment) M:1
Booking (appointment) ─────────────── Consultant (appointment) M:1
Booking (appointment) ─────────────── Showroom (appointment) M:1 (nullable)
Consultant (appointment) ──────────── Availability (appointment) 1:M
Consultant (appointment) ──────────── TimeSlot (appointment) 1:M

Blog (content) ────────────────────── SeoMeta (content) 1:1
Product (catalogue) ───────────────── SeoMeta (catalogue) 1:1 (cross-context copy)
```

Cross-context references (e.g. `userId` in Booking pointing at auth-service User) are stored as plain UUIDs — no foreign key constraint at the database level. Referential integrity across service boundaries is enforced at the application layer.

---

## Enumerations

```typescript
// Shared via packages/shared-types

enum UserRole        { SUPER_ADMIN, ADMIN, CONSULTANT, CUSTOMER }
enum ProductCategory { KITCHEN, BEDROOM }
enum BookingType     { HOME_MEASUREMENT, ONLINE, SHOWROOM }
enum BookingStatus   { PENDING, CONFIRMED, COMPLETED, CANCELLED, NO_SHOW }
enum OrderStatus     { PENDING, CONFIRMED, PROCESSING, SHIPPED, DELIVERED, CANCELLED, REFUNDED }
enum PaymentStatus   { PENDING, PROCESSING, SUCCEEDED, FAILED, CANCELLED, REFUNDED }
enum ContentStatus   { DRAFT, PUBLISHED, ARCHIVED }
enum ReviewStatus    { PENDING, APPROVED, REJECTED }
enum LoyaltyTier     { BRONZE, SILVER, GOLD, PLATINUM }
enum DiscountType    { PERCENTAGE, FIXED_AMOUNT }
enum NotifChannel    { EMAIL, SMS, PUSH }
enum NotifStatus     { QUEUED, SENT, FAILED, BOUNCED }
```