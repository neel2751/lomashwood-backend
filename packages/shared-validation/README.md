# @lomash-wood/shared-validation

Shared Zod validation schemas used across all Lomash Wood backend services.

## Installation

This package is consumed internally via pnpm workspace:

```json
{
  "dependencies": {
    "@lomash-wood/shared-validation": "workspace:*"
  }
}
```

## Usage

```typescript
import {
  RegisterSchema,
  LoginSchema,
  ProductSchema,
  CreateBookingSchema,
  CreateOrderSchema,
} from "@lomash-wood/shared-validation";

const result = RegisterSchema.safeParse(req.body);
if (!result.success) {
  throw new ValidationError(result.error.flatten());
}
```

## Schemas

| Module | Schemas |
|---|---|
| `auth.schemas` | Register, Login, RefreshToken, ForgotPassword, ResetPassword, ChangePassword, VerifyEmail, Role, AssignRole, UpdateProfile |
| `product.schemas` | Colour, Product, ProductFilter, Sale, Package, InventoryUpdate, SizeUnit |
| `booking.schemas` | CreateBooking, UpdateBooking, BookingFilter, Consultant, Availability, AvailabilityQuery, Reminder |
| `order.schemas` | CreateOrder, UpdateOrderStatus, OrderFilter, CreatePaymentIntent, Refund, Coupon, ApplyCoupon, InvoiceFilter |
| `content.schemas` | Blog, BlogFilter, Media, MediaWall, CmsPage, Seo, HomeSlider, FinanceContent, Showroom, ShowroomFilter, LandingPage |
| `customer.schemas` | BrochureRequest, BusinessInquiry, ContactForm, NewsletterSubscription, CustomerReview, CustomerReviewFilter, WishlistItem, CustomerProfile, CustomerAddress, SupportTicket |
| `notification.schemas` | SendEmail, SendSms, SendPush, Template, NotificationFilter, NotificationPreference, BulkNotification |
| `analytics.schemas` | TrackEvent, TrackPageView, Funnel, Dashboard, AnalyticsQuery, Export, AnalyticsFilter |

## Build

```bash
pnpm build
```

## Type Check

```bash
pnpm typecheck
```