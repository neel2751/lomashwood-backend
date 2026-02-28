# API Reference

This document covers the Next.js BFF (Backend for Frontend) API routes, the microservice contract each one proxies to, data models, and environment variable reference.

## Overview

The admin panel never calls microservices directly from the browser. All requests flow through BFF route handlers in `src/app/api/`, which:

1. Validate the incoming session cookie via NextAuth
2. Attach the service-to-service auth header
3. Forward the request to the appropriate microservice via the API Gateway
4. Return the response (or a normalised error shape)

```
Browser → /api/products → API Gateway → product-service
```

## BFF Route Reference

### Auth — `/api/auth`

| Method | Path | Description |
|---|---|---|
| `POST` | `/api/auth/login` | Exchange credentials for a session cookie |
| `POST` | `/api/auth/logout` | Destroy the current session |

Proxies to: `auth-service`

### Products — `/api/products`

| Method | Path | Description |
|---|---|---|
| `GET` | `/api/products` | List products (paginated, filterable) |
| `POST` | `/api/products` | Create a new product |
| `GET` | `/api/products/[id]` | Get a single product |
| `PATCH` | `/api/products/[id]` | Update a product |
| `DELETE` | `/api/products/[id]` | Delete a product |

Proxies to: `product-service`

### Orders — `/api/orders`

| Method | Path | Description |
|---|---|---|
| `GET` | `/api/orders` | List orders (paginated, filterable by status/date) |
| `GET` | `/api/orders/[id]` | Get a single order with line items |
| `PATCH` | `/api/orders/[id]` | Update order status |

Proxies to: `order-payment-service`

### Appointments — `/api/appointments`

| Method | Path | Description |
|---|---|---|
| `GET` | `/api/appointments` | List all appointments |
| `POST` | `/api/appointments` | Create an appointment (admin-side) |
| `GET` | `/api/appointments/[id]` | Get a single appointment |
| `PATCH` | `/api/appointments/[id]` | Update appointment (status, reschedule) |
| `DELETE` | `/api/appointments/[id]` | Cancel an appointment |

Proxies to: `appointment-service`

### Customers — `/api/customers`

| Method | Path | Description |
|---|---|---|
| `GET` | `/api/customers` | List customers (paginated) |
| `GET` | `/api/customers/[id]` | Get a single customer profile |
| `PATCH` | `/api/customers/[id]` | Update customer details |

Proxies to: `customer-service`

### Content — `/api/content`

| Method | Path | Description |
|---|---|---|
| `GET` | `/api/content` | List all CMS content entries |
| `POST` | `/api/content` | Create a content entry |
| `GET` | `/api/content/[id]` | Get a single content entry |
| `PATCH` | `/api/content/[id]` | Update a content entry |
| `DELETE` | `/api/content/[id]` | Delete a content entry |

Covers: blogs, CMS pages, landing pages, media wall, SEO, home page slider.
Proxies to: `content-service`

### Notifications — `/api/notifications`

| Method | Path | Description |
|---|---|---|
| `GET` | `/api/notifications` | List notification logs |
| `GET` | `/api/notifications/[id]` | Get a single notification log entry |

Proxies to: `notification-service`

### Analytics — `/api/analytics`

| Method | Path | Description |
|---|---|---|
| `GET` | `/api/analytics` | Fetch aggregated analytics data |

Proxies to: `analytics-service`

## Standard Response Shapes

### Success

```typescript
{
  data: T;
  meta?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}
```

### Error

```typescript
{
  error: {
    code: string;      
    message: string;    
    details?: unknown;  
  };
}
```

## Core Data Models

### Product

```typescript
interface Product {
  id: string;
  title: string;
  description: string;
  category: "kitchen" | "bedroom";
  rangeName: string;
  images: ProductImage[];
  colours: Colour[];
  sizes: ProductSize[];
  price: number | null;
  status: "draft" | "published" | "archived";
  createdAt: string;
  updatedAt: string;
}
```

### Order

```typescript
interface Order {
  id: string;
  customerId: string;
  status: "pending" | "confirmed" | "processing" | "completed" | "cancelled" | "refunded";
  lineItems: OrderLineItem[];
  totalAmount: number;
  paymentStatus: "unpaid" | "paid" | "partial" | "refunded";
  invoiceId: string | null;
  createdAt: string;
  updatedAt: string;
}
```

### Appointment

```typescript
interface Appointment {
  id: string;
  type: "home_measurement" | "online" | "showroom";
  forKitchen: boolean;
  forBedroom: boolean;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  postcode: string;
  address: string;
  slotDate: string;
  slotTime: string;
  consultantId: string | null;
  status: "pending" | "confirmed" | "cancelled" | "completed";
  createdAt: string;
}
```

### Customer

```typescript
interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string;
  postcode: string;
  loyaltyPoints: number;
  totalOrders: number;
  totalSpend: number;
  createdAt: string;
}
```

### Colour

```typescript
interface Colour {
  id: string;
  name: string;
  hexCode: string;
}
```

### Showroom

```typescript
interface Showroom {
  id: string;
  name: string;
  address: string;
  image: string;
  email: string;
  phone: string;
  openingHours: OpeningHours[];
  mapLink: string;
}
```

## Environment Variables

| Variable | Required | Description |
|---|---|---|
| `NEXT_PUBLIC_APP_URL` | Yes | Full public URL of the admin panel |
| `NEXT_PUBLIC_API_GATEWAY_URL` | Yes | Base URL of the API Gateway |
| `NEXTAUTH_URL` | Yes | Canonical URL used by NextAuth for callbacks |
| `NEXTAUTH_SECRET` | Yes | Min 32-char secret for session signing |
| `AUTH_SERVICE_URL` | Yes | Internal URL of the auth microservice |
| `PRODUCT_SERVICE_URL` | Yes | Internal URL of the product microservice |
| `ORDER_SERVICE_URL` | Yes | Internal URL of the order/payment microservice |
| `APPOINTMENT_SERVICE_URL` | Yes | Internal URL of the appointment microservice |
| `CUSTOMER_SERVICE_URL` | Yes | Internal URL of the customer microservice |
| `CONTENT_SERVICE_URL` | Yes | Internal URL of the content microservice |
| `NOTIFICATION_SERVICE_URL` | Yes | Internal URL of the notification microservice |
| `ANALYTICS_SERVICE_URL` | Yes | Internal URL of the analytics microservice |
| `NEXT_PUBLIC_CDN_URL` | Yes | Base URL for serving uploaded media assets |
| `STORAGE_BUCKET` | Yes | S3-compatible storage bucket name |
| `STORAGE_REGION` | Yes | Storage region (e.g. `eu-west-2`) |
| `STORAGE_ACCESS_KEY_ID` | Yes | S3 access key |
| `STORAGE_SECRET_ACCESS_KEY` | Yes | S3 secret key |
| `SMTP_HOST` | Yes | SMTP server hostname |
| `SMTP_PORT` | Yes | SMTP server port |
| `SMTP_USER` | Yes | SMTP username |
| `SMTP_PASS` | Yes | SMTP password |
| `SMTP_FROM` | Yes | From address for system emails |
| `NEXT_PUBLIC_GTM_ID` | No | Google Tag Manager container ID |
| `NEXT_PUBLIC_GA_MEASUREMENT_ID` | No | Google Analytics measurement ID |
| `NEXT_PUBLIC_SENTRY_DSN` | No | Sentry DSN for error tracking |
| `SENTRY_AUTH_TOKEN` | No | Sentry token for source map uploads |
| `SENTRY_ORG` | No | Sentry organisation slug |
| `SENTRY_PROJECT` | No | Sentry project slug |