# Product API

Base path: `/v1/products`, `/v1/categories`, `/v1/colours`

---

## Overview

The product-service manages the Lomash Wood product catalogue including kitchens, bedrooms, categories, colours, sizes, inventory, and pricing. Product listing supports multi-dimensional filtering and infinite scroll pagination as required by the SRS (FR2.0).

---

## Endpoints

### GET /v1/products

List products with optional filtering, sorting, and cursor-based pagination for infinite scroll.

**Auth required:** No

**Query Parameters**

| Parameter | Type | Description |
|---|---|---|
| `page` | integer | Page number (default: 1) |
| `limit` | integer | Items per page (default: 20, max: 100) |
| `sortBy` | string | Field to sort by: `price`, `createdAt`, `title` |
| `order` | string | `asc` or `desc` |
| `category` | string | `KITCHEN` or `BEDROOM` |
| `colourIds` | uuid[] | Comma-separated colour UUIDs |
| `style` | string | Style filter (e.g., `shaker`, `handleless`) |
| `finish` | string | Finish filter (e.g., `gloss`, `matt`) |
| `rangeId` | uuid | Filter by range |

**Response `200`**

```json
{
  "data": [
    {
      "id": "uuid",
      "title": "Luna Kitchen",
      "description": "A sleek, handle-free kitchen...",
      "category": "KITCHEN",
      "price": 4999.99,
      "rangeName": "Luna",
      "images": [
        {
          "id": "uuid",
          "url": "https://cdn.lomashwood.co.uk/...",
          "cdnUrl": "https://cdn.lomashwood.co.uk/...",
          "mimeType": "image/webp",
          "size": 204800
        }
      ],
      "colours": [
        { "id": "uuid", "name": "Arctic White", "hexCode": "#F5F5F5" }
      ],
      "sizes": [],
      "isActive": true,
      "createdAt": "2026-01-15T09:00:00Z",
      "updatedAt": "2026-01-20T14:30:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 84,
    "totalPages": 5,
    "hasNextPage": true,
    "hasPrevPage": false
  }
}
```

---

### POST /v1/products

Create a new product.

**Auth required:** Yes (ADMIN)

**Request Body**

```json
{
  "title": "Luna Kitchen",
  "description": "A sleek, handle-free kitchen with premium finishes.",
  "category": "KITCHEN",
  "price": 4999.99,
  "rangeName": "Luna",
  "colourIds": ["uuid-1", "uuid-2"],
  "imageIds": ["uuid-3", "uuid-4"]
}
```

| Field | Type | Rules |
|---|---|---|
| `title` | string | required, min 2 chars |
| `description` | string | required |
| `category` | string | required, `KITCHEN` or `BEDROOM` |
| `price` | number | required, > 0 |
| `rangeName` | string | optional |
| `colourIds` | uuid[] | optional, must reference existing colours |
| `imageIds` | uuid[] | optional, must reference uploaded media assets |

**Response `201`** — returns the created `Product` object.

**Errors**

| Status | Code | Reason |
|---|---|---|
| 401 | `UNAUTHORIZED` | Missing token |
| 403 | `FORBIDDEN` | Not an ADMIN |
| 422 | `VALIDATION_ERROR` | Invalid field values |

---

### GET /v1/products/:id

Get a single product by UUID with full detail including colours, sizes, and images.

**Auth required:** No

**Response `200`** — returns the full `Product` object.

**Errors**

| Status | Code | Reason |
|---|---|---|
| 404 | `PRODUCT_NOT_FOUND` | No product with this ID |

---

### PATCH /v1/products/:id

Partially update a product.

**Auth required:** Yes (ADMIN)

**Request Body** — all fields optional:

```json
{
  "title": "Luna Kitchen Updated",
  "price": 5499.99,
  "isActive": true,
  "colourIds": ["uuid-1"]
}
```

**Response `200`** — returns the updated `Product` object.

---

### DELETE /v1/products/:id

Soft-delete a product. Sets `deletedAt` and `isActive: false`. Does not remove from database.

**Auth required:** Yes (ADMIN)

**Response `204`** — no content.

---

### GET /v1/categories

List all product categories (KITCHEN, BEDROOM).

**Auth required:** No

**Response `200`**

```json
{
  "data": [
    { "id": "uuid", "name": "Kitchen", "slug": "kitchen" },
    { "id": "uuid", "name": "Bedroom", "slug": "bedroom" }
  ]
}
```

---

### GET /v1/colours

List all colours available for product assignment.

**Auth required:** No

**Response `200`**

```json
{
  "data": [
    { "id": "uuid", "name": "Arctic White", "hexCode": "#F5F5F5" },
    { "id": "uuid", "name": "Midnight Grey", "hexCode": "#3D3D3D" }
  ]
}
```

---

## Data Models

### Product

| Field | Type | Description |
|---|---|---|
| `id` | uuid | Unique identifier |
| `title` | string | Product name |
| `description` | string | Full product description |
| `category` | enum | `KITCHEN` or `BEDROOM` |
| `price` | float | Base price in GBP |
| `rangeName` | string | Range/collection name |
| `images` | MediaAsset[] | Ordered product images |
| `colours` | Colour[] | Available colour options |
| `sizes` | Size[] | Available size/unit options |
| `isActive` | boolean | Visibility flag |
| `createdAt` | datetime | Creation timestamp |
| `updatedAt` | datetime | Last update timestamp |

### Colour

| Field | Type | Description |
|---|---|---|
| `id` | uuid | Unique identifier |
| `name` | string | Display name |
| `hexCode` | string | 6-digit hex colour code |

### Size

| Field | Type | Description |
|---|---|---|
| `id` | uuid | Unique identifier |
| `title` | string | Size label |
| `description` | string | Size details |
| `imageUrl` | uri | Representative image |

---

## Infinite Scroll Implementation

For product filter pages (FR2.5), the frontend implements infinite scroll by incrementing `page` on scroll-to-bottom events. The `hasNextPage` field in the pagination response signals whether additional pages exist. Caching headers (`Cache-Control: public, max-age=300`) are set on product listing responses to support CDN caching.

---

## Filtering Behaviour

- Multiple `colourIds` are treated as OR (products matching any of the provided colours).
- `style`, `finish`, and `rangeId` are AND conditions.
- `category` is required when rendering the Kitchen or Bedroom filter pages.
- All filter combinations are cached in Redis with a 5-minute TTL keyed on the full query string.