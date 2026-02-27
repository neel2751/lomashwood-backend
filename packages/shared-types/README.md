# @lomash-wood/shared-types

Canonical TypeScript type definitions shared across all Lomash Wood microservices. Every interface, union, and event payload type that crosses a service boundary lives here — enforcing a single source of truth for the entire platform.

---

## Table of Contents

- [Overview](#overview)
- [Installation](#installation)
- [Module Reference](#module-reference)
- [Usage](#usage)
- [Type Conventions](#type-conventions)
- [Event Payload Types](#event-payload-types)
- [Adding New Types](#adding-new-types)
- [Build](#build)

---

## Overview

| Module | File | Owns |
|---|---|---|
| Auth | `auth.types.ts` | JWT payloads, sessions, roles, OTP, token blacklist |
| User | `user.types.ts` | Users, profiles, addresses, wishlists, reviews, loyalty, support |
| Product | `product.types.ts` | Products, categories, colours, sizes, pricing, inventory, sales, packages |
| Order | `order.types.ts` | Orders, payments, refunds, invoices, Stripe webhooks |
| Booking | `booking.types.ts` | Appointments, consultants, showrooms, time slots, reminders |
| Content | `content.types.ts` | Blogs, pages, media wall, SEO, banners, menus, FAQs, testimonials |
| Notification | `notification.types.ts` | Email/SMS/push payloads, templates, delivery records |
| Analytics | `analytics.types.ts` | Tracking events, sessions, funnels, dashboards, metrics, exports |

All types are re-exported from a single barrel at `src/index.ts`.

---

## Installation

This package is an internal workspace dependency. Add it to any service `package.json`:

```json
{
  "dependencies": {
    "@lomash-wood/shared-types": "workspace:*"
  }
}
```

Then from the monorepo root:

```bash
pnpm install
```

---

## Module Reference

### Auth (`@lomash-wood/shared-types/auth`)

```ts
import type {
  UserRole,
  AccountStatus,
  SessionStatus,
  TokenType,
  AuthProvider,
  JwtPayload,
  AuthUser,
  Session,
  Role,
  AuthTokenPair,
  RegisterPayload,
  LoginPayload,
  RefreshTokenPayload,
  PasswordResetRequestPayload,
  PasswordResetConfirmPayload,
  ChangePasswordPayload,
  OtpPayload,
  TokenBlacklistEntry,
  AuthEventPayload,
  PasswordResetEventPayload,
  RoleUpdatedEventPayload,
} from '@lomash-wood/shared-types/auth';
```

**Key types:**

`UserRole` — `'ADMIN' | 'EDITOR' | 'STAFF' | 'USER' | 'GUEST'`

`AccountStatus` — `'ACTIVE' | 'INACTIVE' | 'SUSPENDED' | 'PENDING_VERIFICATION' | 'DELETED'`

`AuthUser` — the decoded token representation attached to `req.user` in all services via auth middleware

`JwtPayload` — the exact shape of every signed JWT issued by the auth service, including `sub`, `role`, `sessionId`, `iss`, and `aud`

---

### User (`@lomash-wood/shared-types/user`)

```ts
import type {
  User,
  UserProfile,
  Address,
  AddressType,
  Wishlist,
  WishlistItem,
  Review,
  SupportTicket,
  LoyaltyAccount,
  LoyaltyTransaction,
  NotificationPreference,
  ProfileUpdatedEventPayload,
  ReviewCreatedEventPayload,
  LoyaltyPointsEarnedEventPayload,
} from '@lomash-wood/shared-types/user';
```

**Key types:**

`User` — full user entity as owned by the auth-service database, referenced by ID in all other services

`Address` — postal address with `AddressType` (`HOME | WORK | BILLING | DELIVERY | OTHER`) used across order and booking services

`NotificationPreference` — per-channel marketing and transactional opt-in flags consumed by the notification service

---

### Product (`@lomash-wood/shared-types/product`)

```ts
import type {
  ProductCategory,
  ProductStatus,
  ProductStyle,
  ProductFinish,
  InventoryStatus,
  SaleType,
  Product,
  ProductSummary,
  Colour,
  Category,
  Sale,
  Package,
  ProductFilterOptions,
  ProductSortField,
  ProductSortOptions,
  ProductCreatedEventPayload,
  InventoryUpdatedEventPayload,
  PriceChangedEventPayload,
} from '@lomash-wood/shared-types/product';
```

**Key types:**

`ProductCategory` — `'KITCHEN' | 'BEDROOM'` — the core domain split referenced in every service

`ProductSummary` — the lightweight list-view shape used by the filter page API (FR2.4), containing only the fields required for a product card

`Product` — the full detail-page shape (FR3.1) with nested `images`, `colours`, `sizes`, `pricing`, and `inventory`

`ProductFilterOptions` — typed query filter used by the product-service filter endpoint (FR2.2), consumed by the API gateway validator

`Sale` — sale entity used for the offers page (FR4.1), including `appliesTo: ProductCategory[]` and `productIds`

`Package` — package deal entity per the kitchen/bedroom package feature (FR1.6)

---

### Order (`@lomash-wood/shared-types/order`)

```ts
import type {
  OrderStatus,
  PaymentStatus,
  PaymentMethod,
  PaymentGateway,
  RefundStatus,
  RefundReason,
  InvoiceStatus,
  Order,
  OrderSummary,
  OrderItem,
  PaymentTransaction,
  CreatePaymentIntentPayload,
  PaymentIntentResult,
  Refund,
  Invoice,
  StripeWebhookEvent,
  OrderCreatedEventPayload,
  PaymentSucceededEventPayload,
  RefundIssuedEventPayload,
} from '@lomash-wood/shared-types/order';
```

**Key types:**

`CreatePaymentIntentPayload` — the typed body for `POST /v1/payments/create-intent`, including mandatory `idempotencyKey`

`StripeWebhookEvent` — the normalised webhook shape consumed by `POST /v1/webhooks/stripe`

`PaymentGateway` — `'STRIPE' | 'RAZORPAY'` — both gateways supported by the payment infrastructure

---

### Booking (`@lomash-wood/shared-types/booking`)

```ts
import type {
  AppointmentType,
  AppointmentStatus,
  AppointmentCategory,
  Booking,
  BookingSummary,
  TimeSlot,
  Showroom,
  OpeningHours,
  DayHours,
  Consultant,
  Reminder,
  AvailabilityQuery,
  AvailabilityResult,
  CreateBookingPayload,
  RescheduleBookingPayload,
  CancelBookingPayload,
  BookingCreatedEventPayload,
  BookingCancelledEventPayload,
  ReminderSentEventPayload,
} from '@lomash-wood/shared-types/booking';
```

**Key types:**

`AppointmentType` — `'HOME_MEASUREMENT' | 'ONLINE' | 'SHOWROOM'` — the three booking modes from FR5.1

`AppointmentCategory` — `'KITCHEN' | 'BEDROOM' | 'BOTH'` — the step-2 selection from FR5.2

`Showroom` — full showroom entity for FR6.2, including typed `OpeningHours` with per-day `DayHours`

`CreateBookingPayload` — typed body for `POST /v1/appointments`, with `isKitchen` and `isBedroom` boolean flags that trigger dual-team notification per FR5.6

---

### Content (`@lomash-wood/shared-types/content`)

```ts
import type {
  ContentStatus,
  Blog,
  BlogSummary,
  Page,
  MediaWall,
  Media,
  SeoMeta,
  SeoDefaults,
  Banner,
  BannerType,
  Menu,
  MenuItem,
  MenuLocation,
  FaqCategory,
  Faq,
  Testimonial,
  HomeSlide,
  Accreditation,
  Logo,
  ContentSearchResult,
  ContentSearchResponse,
  PaginationMeta,
} from '@lomash-wood/shared-types/content';
```

**Key types:**

`ContentStatus` — `'DRAFT' | 'SCHEDULED' | 'PUBLISHED' | 'ARCHIVED'` — applies to blogs, pages, and landing pages

`MenuLocation` — `'HEADER_NAV' | 'HAMBURGER' | 'FOOTER' | 'SIDEBAR'` — maps directly to the SRS navigation specification (FR1.1–FR1.2)

`BannerType` — `'HERO_SLIDER' | 'OFFER_SLIDER' | 'ANNOUNCEMENT' | 'PROMOTIONAL'` — used to serve the correct banners to each page section

`PaginationMeta` — standard pagination shape returned by every list endpoint across all services

---

### Notification (`@lomash-wood/shared-types/notification`)

```ts
import type {
  NotificationChannel,
  NotificationCategory,
  NotificationStatus,
  EmailPayload,
  SmsPayload,
  PushPayload,
  NotificationTemplate,
  NotificationRecord,
  SendEmailPayload,
  SendSmsPayload,
  SendPushPayload,
  BookingConfirmationData,
  PaymentReceiptData,
  BrochureDeliveryData,
} from '@lomash-wood/shared-types/notification';
```

**Key types:**

`NotificationCategory` — 19 distinct categories mapping to every system-triggered email/SMS defined in the SRS (booking confirmations, payment receipts, brochure delivery, admin alerts, etc.)

`SendEmailPayload` — the typed request body consumed by the notification-service `POST /v1/email/send` endpoint; includes `templateSlug` and typed `variables` record

`BookingConfirmationData` / `PaymentReceiptData` / `BrochureDeliveryData` — strongly-typed template variable shapes for the three core transactional emails

---

### Analytics (`@lomash-wood/shared-types/analytics`)

```ts
import type {
  TrackingEventType,
  TrackingEvent,
  AnalyticsSession,
  Funnel,
  FunnelResult,
  Dashboard,
  DashboardWidget,
  Metric,
  MetricPeriod,
  ExportJob,
  ExportFormat,
  BusinessMetrics,
} from '@lomash-wood/shared-types/analytics';
```

**Key types:**

`TrackingEventType` — 21 typed event names covering the complete customer journey from page view through payment and post-purchase

`BusinessMetrics` — the admin dashboard summary shape (FR9.5) containing booking counts, conversion rates, brochure requests, and top products/showrooms

---

## Usage

### Import from the barrel (all types)

```ts
import type { AuthUser, Product, Booking, Order } from '@lomash-wood/shared-types';
```

### Import from a specific sub-module

```ts
import type { CreateBookingPayload, AppointmentType } from '@lomash-wood/shared-types/booking';
import type { ProductFilterOptions, ProductSortOptions } from '@lomash-wood/shared-types/product';
```

### Typing an Express request

```ts
import type { Request } from 'express';
import type { AuthUser } from '@lomash-wood/shared-types/auth';

interface AuthenticatedRequest extends Request {
  user: AuthUser;
}
```

### Typing a service method

```ts
import type { CreateBookingPayload, Booking } from '@lomash-wood/shared-types/booking';

async function createBooking(payload: CreateBookingPayload): Promise<Booking> {
  // ...
}
```

### Typing an event handler

```ts
import type { BookingCreatedEventPayload } from '@lomash-wood/shared-types/booking';

function handleBookingCreated(payload: BookingCreatedEventPayload): void {
  if (payload.isKitchen && payload.isBedroom) {
    // send dual-team notification per FR5.6
  }
}
```

---

## Type Conventions

### All types are `readonly`

Every property in every interface uses the `readonly` modifier. This prevents accidental mutation of data objects that cross service boundaries:

```ts
interface Product {
  readonly id: string;
  readonly title: string;
  readonly colours: readonly Colour[];  // readonly arrays too
}
```

### Arrays use `readonly T[]`

All array properties are typed as `readonly T[]` rather than `T[]` to prevent mutation at the boundary:

```ts
readonly images: readonly ProductImage[];
readonly productIds: readonly string[];
```

### Optional properties use `T | undefined`, not `T?`

Where the value may be absent due to business logic rather than optional input, properties are typed as explicit unions with `undefined`:

```ts
readonly cancelledAt: Date | null;  // null = not cancelled
readonly scheduledAt: Date | null;  // null = not scheduled
```

Input payload types use `?: T | undefined` syntax for genuinely optional fields:

```ts
interface CreateBookingPayload {
  readonly notes?: string | undefined;
  readonly userId?: string | undefined;
}
```

### Enums are string union types

All enumerated values are expressed as TypeScript string union types rather than `enum` declarations. This avoids enum-related pitfalls with `isolatedModules` and produces cleaner JavaScript output:

```ts
export type OrderStatus =
  | 'PENDING'
  | 'CONFIRMED'
  | 'PROCESSING'
  | 'DISPATCHED'
  | 'DELIVERED'
  | 'CANCELLED'
  | 'REFUNDED'
  | 'FAILED';
```

### Event payload types are suffixed `EventPayload`

All cross-service event payloads follow the `<Subject><Verb>EventPayload` naming convention:

```ts
BookingCreatedEventPayload
PaymentSucceededEventPayload
BlogPublishedEventPayload
InventoryUpdatedEventPayload
```

---

## Event Payload Types

Event payloads are the types published to and consumed from the internal event bus. They are intentionally minimal — containing only the data a consuming service needs to react, never full entity objects.

| Event | Publisher | Consumers |
|---|---|---|
| `BookingCreatedEventPayload` | appointment-service | notification-service, analytics-service |
| `BookingCancelledEventPayload` | appointment-service | notification-service, analytics-service |
| `OrderCreatedEventPayload` | order-payment-service | notification-service, analytics-service |
| `PaymentSucceededEventPayload` | order-payment-service | notification-service, analytics-service |
| `RefundIssuedEventPayload` | order-payment-service | notification-service |
| `ProductCreatedEventPayload` | product-service | content-service (sitemap), analytics-service |
| `InventoryUpdatedEventPayload` | product-service | notification-service (low stock alerts) |
| `BlogPublishedEventPayload` | content-service | analytics-service |
| `ProfileUpdatedEventPayload` | customer-service | auth-service (cache invalidation) |
| `EmailSentEventPayload` | notification-service | analytics-service |

---

## Adding New Types

1. Identify which module file owns the new type based on which service generates the data
2. Add the type definition to the appropriate `src/*.types.ts` file
3. Export it from `src/index.ts` in the correct export block
4. Add sub-module export entry to `package.json` `exports` field if adding a new file
5. Run `pnpm build` to verify compilation
6. Bump the package version in `package.json` following semver

Types must never reference Prisma-generated types directly. The shared types layer must remain ORM-agnostic so any service can consume it regardless of its data layer.

---

## Build

```bash
pnpm build
```

Compiles all `.ts` source files to `dist/` with `.d.ts` declaration files and source maps. The `dist/` directory is what consuming services import at runtime.

```bash
pnpm typecheck
```

Runs `tsc --noEmit` to validate types without emitting output. Used in CI type-check stage.

```bash
pnpm clean
```

Removes `dist/` and `.tsbuildinfo` for a clean rebuild.