# Customer API

Base path: `/v1/customers`, `/v1/brochures`, `/v1/business`, `/v1/contact`, `/v1/newsletter`

---

## Overview

The customer-service manages customer profiles, wishlist, reviews, support tickets, loyalty points, and all inbound forms (brochure requests, business enquiries, contact, newsletter). Form submissions are stored for admin review and trigger internal notification emails where required by the SRS (FR8.0).

---

## Endpoints

### GET /v1/customers/me/profile

Get the authenticated customer's profile.

**Auth required:** Yes

**Response `200`**

```json
{
  "id": "uuid",
  "name": "Jane Smith",
  "email": "jane@example.com",
  "phone": "07700900000",
  "address": "10 Downing Street, London",
  "postcode": "SW1A 1AA",
  "loyaltyPoints": 250,
  "createdAt": "2026-01-01T09:00:00Z"
}
```

---

### PATCH /v1/customers/me/profile

Update the authenticated customer's profile.

**Auth required:** Yes

**Request Body** — all fields optional:

```json
{
  "name": "Jane Smith",
  "phone": "07700900001",
  "address": "20 New Address, London",
  "postcode": "EC1A 1BB"
}
```

**Response `200`** — returns the updated `CustomerProfile` object.

**Errors**

| Status | Code | Reason |
|---|---|---|
| 401 | `UNAUTHORIZED` | Missing token |
| 422 | `VALIDATION_ERROR` | Invalid field values |

---

### GET /v1/customers/me/wishlist

Get the authenticated customer's wishlist.

**Auth required:** Yes

**Response `200`**

```json
{
  "data": [
    {
      "id": "uuid",
      "title": "Luna Kitchen",
      "category": "KITCHEN",
      "price": 4999.99,
      "images": [ ],
      "colours": [ ]
    }
  ]
}
```

---

### POST /v1/customers/me/wishlist

Add a product to the wishlist.

**Auth required:** Yes

**Request Body**

```json
{
  "productId": "uuid"
}
```

**Response `201`**

```json
{
  "message": "Product added to wishlist"
}
```

**Errors**

| Status | Code | Reason |
|---|---|---|
| 404 | `PRODUCT_NOT_FOUND` | Product does not exist |
| 409 | `ALREADY_IN_WISHLIST` | Product already in wishlist |

---

### DELETE /v1/customers/me/wishlist/:productId

Remove a product from the wishlist.

**Auth required:** Yes

**Response `204`** — no content.

---

### GET /v1/customers/me/orders

Get order history for the authenticated customer. Proxied to order-payment-service internally.

**Auth required:** Yes

**Response `200`** — paginated list of orders.

---

### GET /v1/customers/me/appointments

Get booking history for the authenticated customer.

**Auth required:** Yes

**Response `200`** — paginated list of appointments.

---

### POST /v1/customers/me/reviews

Submit a product review.

**Auth required:** Yes

**Request Body**

```json
{
  "productId": "uuid",
  "rating": 5,
  "title": "Excellent quality",
  "content": "The Luna kitchen exceeded all expectations..."
}
```

| Field | Type | Rules |
|---|---|---|
| `productId` | uuid | required, must be an active product |
| `rating` | integer | required, 1–5 |
| `title` | string | required, max 100 chars |
| `content` | string | required, max 2000 chars |

**Response `201`**

```json
{
  "id": "uuid",
  "productId": "uuid",
  "rating": 5,
  "title": "Excellent quality",
  "content": "The Luna kitchen exceeded all expectations...",
  "status": "PENDING",
  "createdAt": "2026-02-01T10:00:00Z"
}
```

Reviews are created with `status: PENDING` and require admin approval before appearing publicly.

---

### GET /v1/customers/me/loyalty

Get loyalty points balance and transaction history.

**Auth required:** Yes

**Response `200`**

```json
{
  "balance": 250,
  "transactions": [
    {
      "id": "uuid",
      "type": "EARNED",
      "points": 50,
      "description": "Order #uuid completed",
      "createdAt": "2026-01-15T12:00:00Z"
    }
  ]
}
```

---

## Form Endpoints

### POST /v1/brochures

Submit a brochure download request. Record stored in the Brochure Table (FR8.2). Brochure delivery email sent to customer.

**Auth required:** No

**Request Body**

```json
{
  "name": "John Davies",
  "phone": "07700900000",
  "email": "john@example.com",
  "postcode": "M1 1AE",
  "address": "5 Manchester Road, Manchester"
}
```

| Field | Type | Rules |
|---|---|---|
| `name` | string | required |
| `phone` | string | required |
| `email` | string | required, valid email |
| `postcode` | string | required |
| `address` | string | required |

**Response `201`**

```json
{
  "message": "Your brochure request has been received. We will send it to your email shortly."
}
```

**Errors**

| Status | Code | Reason |
|---|---|---|
| 422 | `VALIDATION_ERROR` | Invalid field values |

---

### POST /v1/business

Submit a business partnership enquiry. Triggers internal mail notification (FR8.4).

**Auth required:** No

**Request Body**

```json
{
  "name": "Sarah Jones",
  "email": "sarah@business.co.uk",
  "phone": "07700900111",
  "businessType": "CONTRACTOR"
}
```

| Field | Type | Rules |
|---|---|---|
| `name` | string | required |
| `email` | string | required, valid email |
| `phone` | string | required |
| `businessType` | string | required |

**Response `201`**

```json
{
  "message": "Thank you for your enquiry. Our team will be in touch within 2 business days."
}
```

---

### POST /v1/contact

Submit a general contact form enquiry.

**Auth required:** No

**Request Body**

```json
{
  "name": "Mark Taylor",
  "email": "mark@example.com",
  "phone": "07700900222",
  "message": "I have a question about your kitchen ranges..."
}
```

| Field | Type | Rules |
|---|---|---|
| `name` | string | required |
| `email` | string | required, valid email |
| `phone` | string | optional |
| `message` | string | required, max 2000 chars |

**Response `201`**

```json
{
  "message": "Thank you for contacting us. We will respond within 24 hours."
}
```

---

### POST /v1/newsletter

Subscribe to the Lomash Wood newsletter. Stored in the Newsletter Table (FR9.6).

**Auth required:** No

**Request Body**

```json
{
  "email": "subscriber@example.com",
  "name": "Optional Name"
}
```

**Response `201`**

```json
{
  "message": "You have been successfully subscribed to our newsletter."
}
```

**Errors**

| Status | Code | Reason |
|---|---|---|
| 409 | `ALREADY_SUBSCRIBED` | Email already on newsletter list |
| 422 | `VALIDATION_ERROR` | Invalid email |

---

## Admin Endpoints

### GET /v1/admin/brochures

List all brochure requests. Admin only.

**Auth required:** Yes (ADMIN)

**Response `200`** — paginated list with `name`, `phone`, `email`, `postcode`, `address`, `createdAt`.

---

### GET /v1/admin/business-enquiries

List all business enquiries. Admin only.

**Auth required:** Yes (ADMIN)

**Response `200`** — paginated list with full enquiry details.

---

### GET /v1/admin/newsletter-subscribers

List all newsletter subscribers. Admin only.

**Auth required:** Yes (ADMIN)

**Response `200`** — paginated list with email, name, `subscribedAt`.

---

## Data Models

### CustomerProfile

| Field | Type | Description |
|---|---|---|
| `id` | uuid | Unique identifier |
| `name` | string | Display name |
| `email` | string | Contact email |
| `phone` | string | Contact phone |
| `address` | string | Postal address |
| `postcode` | string | Postcode |
| `loyaltyPoints` | integer | Current loyalty point balance |
| `createdAt` | datetime | Account creation date |