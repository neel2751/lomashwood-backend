# Sequence Diagram — Product Browse Flow

## Overview

Covers the complete product browsing journey: homepage catalogue sections, filter page with infinite scroll (FR2.5), product detail page (FR3.0), and the admin CMS product creation flow (FR9.1).

---

## 1. Homepage — Explore Kitchen / Bedroom Sections (FR1.4)

```
Client                API Gateway           product-service      PostgreSQL          Redis (db:1)
  │                       │                      │                   │                 │
  │ GET /v1/products      │                      │                   │                 │
  │  ?category=KITCHEN    │                      │                   │                 │
  │  &featured=true       │                      │                   │                 │
  │  &limit=8             │                      │                   │                 │
  │──────────────────────▶│                      │                   │                 │
  │                       │ Zod validate query   │                   │                 │
  │                       │ No auth required     │                   │                 │
  │                       │ (public route)       │                   │                 │
  │                       │─────────────────────▶│                   │                 │
  │                       │                      │ Build cache key:  │                 │
  │                       │                      │ product:list:     │                 │
  │                       │                      │ {murmur32(query)} │                 │
  │                       │                      │                   │                 │
  │                       │                      │ GET product:list: │                 │
  │                       │                      │ {hash}            │                 │
  │                       │                      │────────────────────────────────────▶│
  │                       │                      │                   │   CACHE HIT ▼   │
  │                       │                      │ ◀── cached JSON   │                 │
  │ ◀─────────────────────│◀─────────────────────│                   │                 │
  │ 200 { data: [8 items] │                      │                   │                 │
  │   from cache <10ms }  │                      │                   │                 │
  │                       │                      │                   │                 │
  │                       │                      │                   │   CACHE MISS ▼  │
  │                       │                      │ ◀── null          │                 │
  │                       │                      │                   │                 │
  │                       │                      │ prisma.product    │                 │
  │                       │                      │ .findMany({       │                 │
  │                       │                      │  where: {         │                 │
  │                       │                      │   category:KITCHEN│                 │
  │                       │                      │   isFeatured:true │                 │
  │                       │                      │   isActive:true   │                 │
  │                       │                      │   deletedAt:null  │                 │
  │                       │                      │  },               │                 │
  │                       │                      │  include: {       │                 │
  │                       │                      │   images:{take:1} │                 │
  │                       │                      │   colours:true    │                 │
  │                       │                      │  },               │                 │
  │                       │                      │  take: 8          │                 │
  │                       │                      │ })                │                 │
  │                       │                      │──────────────────▶│                 │
  │                       │                      │ ◀── Product[]     │                 │
  │                       │                      │                   │                 │
  │                       │                      │ Map → ProductList │                 │
  │                       │                      │ DTO (thumbnail,   │                 │
  │                       │                      │ title, price,     │                 │
  │                       │                      │ colourCount only) │                 │
  │                       │                      │                   │                 │
  │                       │                      │ SET product:list: │                 │
  │                       │                      │ {hash} <json>     │                 │
  │                       │                      │ EX 60             │                 │
  │                       │                      │────────────────────────────────────▶│
  │ ◀─────────────────────│◀─────────────────────│                   │                 │
  │ 200 { data: [8 items] │ Cache-Control:       │                   │                 │
  │   ~40ms DB response } │ public, max-age=60   │                   │                 │
```

---

## 2. Product Filter Page — Initial Load (FR2.1, FR2.2, FR2.3)

```
Client                API Gateway           product-service      PostgreSQL          Redis (db:1)
  │                       │                      │                   │                 │
  │  ── Two parallel requests on page load ──    │                   │                 │
  │                       │                      │                   │                 │
  │ GET /v1/products      │                      │                   │                 │
  │  ?category=KITCHEN    │                      │                   │                 │
  │  &limit=21            │                      │                   │                 │
  │  &sort=-createdAt     │                      │                   │                 │
  │──────────────────────▶│─────────────────────▶│                   │                 │
  │                       │                      │ Cache MISS        │                 │
  │                       │                      │                   │                 │
  │                       │                      │ prisma.product    │                 │
  │                       │                      │ .findMany({       │                 │
  │                       │                      │  where: { category│                 │
  │                       │                      │   KITCHEN,        │                 │
  │                       │                      │   isActive: true, │                 │
  │                       │                      │   deletedAt: null }                 │
  │                       │                      │  orderBy: {       │                 │
  │                       │                      │   createdAt:'desc'}                 │
  │                       │                      │  take: 22,        │                 │
  │                       │                      │  include: { images│                 │
  │                       │                      │   colours, sizes }│                 │
  │                       │                      │ })                │                 │
  │                       │                      │──────────────────▶│                 │
  │                       │                      │ ◀── Product[22]   │                 │
  │                       │                      │ hasNextPage =     │                 │
  │                       │                      │  (len == 22)      │                 │
  │                       │                      │ nextCursor =      │                 │
  │                       │                      │  products[21].id  │                 │
  │                       │                      │ return first 21   │                 │
  │ ◀─────────────────────│◀─────────────────────│                   │                 │
  │ 200 {                 │                      │                   │                 │
  │  data: [21 products], │                      │                   │                 │
  │  nextCursor: "uuid",  │                      │                   │                 │
  │  hasNextPage: true    │                      │                   │                 │
  │ }                     │                      │                   │                 │
  │                       │                      │                   │                 │
  │ GET /v1/products/     │                      │                   │                 │
  │   filter-options      │                      │                   │                 │
  │  ?category=KITCHEN    │                      │                   │                 │
  │──────────────────────▶│─────────────────────▶│                   │                 │
  │                       │                      │ Cache key:        │                 │
  │                       │                      │ category:filters: │                 │
  │                       │                      │ KITCHEN           │                 │
  │                       │                      │────────────────────────────────────▶│
  │                       │                      │ ◀── cached options│                 │
  │ ◀─────────────────────│◀─────────────────────│                   │                 │
  │ 200 {                 │                      │                   │                 │
  │  colours: [...],      │                      │                   │                 │
  │  styles:  [...],      │                      │                   │                 │
  │  finishes: [...],     │                      │                   │                 │
  │  ranges:  [...]       │                      │                   │                 │
  │ }                     │                      │                   │                 │
```

---

## 3. Product Filter — Apply Filters (FR2.2)

```
Client                API Gateway           product-service      PostgreSQL
  │                       │                      │                   │
  │ GET /v1/products      │                      │                   │
  │  ?category=KITCHEN    │                      │                   │
  │  &filter[colour]=     │                      │                   │
  │    white,cream        │                      │                   │
  │  &filter[style]=      │                      │                   │
  │    shaker             │                      │                   │
  │  &filter[finish]=matte│                      │                   │
  │  &sort=price_asc      │                      │                   │
  │  &limit=21            │                      │                   │
  │──────────────────────▶│─────────────────────▶│                   │
  │                       │                      │ Parse filter[]    │
  │                       │                      │ params → typed    │
  │                       │                      │ FilterDTO         │
  │                       │                      │                   │
  │                       │                      │ Build Prisma where│
  │                       │                      │ clause dynamically│
  │                       │                      │                   │
  │                       │                      │ prisma.product    │
  │                       │                      │ .findMany({       │
  │                       │                      │  where: {         │
  │                       │                      │   category:KITCHEN│
  │                       │                      │   isActive: true, │
  │                       │                      │   colours: {      │
  │                       │                      │    some:{colour:{ │
  │                       │                      │     name:{in:[    │
  │                       │                      │      'white',     │
  │                       │                      │      'cream']}}}},│
  │                       │                      │   style:{in:      │
  │                       │                      │    ['shaker']},   │
  │                       │                      │   finish:{in:     │
  │                       │                      │    ['matte']}     │
  │                       │                      │  },               │
  │                       │                      │  orderBy:{        │
  │                       │                      │   basePrice:'asc'}│
  │                       │                      │  take: 22         │
  │                       │                      │ })                │
  │                       │                      │──────────────────▶│
  │                       │                      │ ◀── Product[]     │
  │ ◀─────────────────────│◀─────────────────────│                   │
  │ 200 { data, cursor,   │                      │                   │
  │       hasNextPage }   │                      │                   │
```

---

## 4. Infinite Scroll — Next Page (FR2.5)

```
Client                API Gateway           product-service      PostgreSQL
  │                       │                      │                   │
  │  User scrolls to      │                      │                   │
  │  bottom of page       │                      │                   │
  │                       │                      │                   │
  │ GET /v1/products      │                      │                   │
  │  ?category=KITCHEN    │                      │                   │
  │  &cursor=<last_uuid>  │                      │                   │
  │  &limit=21            │                      │                   │
  │  &sort=-createdAt     │                      │                   │
  │──────────────────────▶│─────────────────────▶│                   │
  │                       │                      │ Cursor-based      │
  │                       │                      │ pagination:       │
  │                       │                      │ prisma.product    │
  │                       │                      │ .findMany({       │
  │                       │                      │  take: 22,        │
  │                       │                      │  cursor: {        │
  │                       │                      │   id: lastUuid }, │
  │                       │                      │  skip: 1,         │
  │                       │                      │  orderBy: {       │
  │                       │                      │   createdAt:'desc'}│
  │                       │                      │ })                │
  │                       │                      │ ← O(log n) always │
  │                       │                      │   regardless of   │
  │                       │                      │   page depth      │
  │                       │                      │──────────────────▶│
  │                       │                      │ ◀── Product[]     │
  │ ◀─────────────────────│◀─────────────────────│                   │
  │ 200 {                 │                      │                   │
  │  data: [21 products], │                      │                   │
  │  nextCursor: "uuid2", │                      │                   │
  │  hasNextPage: false   │                      │                   │
  │ }                     │                      │                   │
  │                       │                      │                   │
  │  Client appends cards │                      │                   │
  │  to DOM (no reload)   │                      │                   │
```

---

## 5. Product Detail Page (FR3.0)

```
Client                API Gateway           product-service      PostgreSQL          Redis (db:1)
  │                       │                      │                   │                 │
  │ GET /v1/products/     │                      │                   │                 │
  │   luna-white          │                      │                   │                 │
  │  (slug-based lookup)  │                      │                   │                 │
  │──────────────────────▶│─────────────────────▶│                   │                 │
  │                       │                      │ GET product:      │                 │
  │                       │                      │ detail:luna-white │                 │
  │                       │                      │────────────────────────────────────▶│
  │                       │                      │                   │   CACHE HIT ▼   │
  │ ◀─────────────────────│◀─────────────────────│◀── cached detail  │                 │
  │ 200 { full product }  │                      │                   │                 │
  │                       │                      │                   │   CACHE MISS ▼  │
  │                       │                      │ ◀── null          │                 │
  │                       │                      │                   │                 │
  │                       │                      │ prisma.product    │                 │
  │                       │                      │ .findUnique({     │                 │
  │                       │                      │  where:{slug:     │                 │
  │                       │                      │   'luna-white'},  │                 │
  │                       │                      │  include:{        │                 │
  │                       │                      │   images:true,    │                 │
  │                       │                      │   colours:{       │                 │
  │                       │                      │    include:{      │                 │
  │                       │                      │     colour:true}},│                 │
  │                       │                      │   sizes:true,     │                 │
  │                       │                      │   seoMeta:true    │                 │
  │                       │                      │  }                │                 │
  │                       │                      │ })                │                 │
  │                       │                      │──────────────────▶│                 │
  │                       │                      │ ◀── Full product  │                 │
  │                       │                      │ Map → ProductDetail                 │
  │                       │                      │ DTO               │                 │
  │                       │                      │                   │                 │
  │                       │                      │ SET product:      │                 │
  │                       │                      │ detail:luna-white │                 │
  │                       │                      │ <json> EX 300     │                 │
  │                       │                      │────────────────────────────────────▶│
  │ ◀─────────────────────│◀─────────────────────│                   │                 │
  │ 200 {                 │                      │                   │                 │
  │  id, title, slug,     │                      │                   │                 │
  │  description,         │                      │                   │                 │
  │  images: [original,   │                      │                   │                 │
  │   1920px, 800px,      │                      │                   │                 │
  │   thumb],             │                      │                   │                 │
  │  colours: [...],      │                      │                   │                 │
  │  sizes: [...],        │                      │                   │                 │
  │  basePrice,           │                      │                   │                 │
  │  seoMeta: { title,    │                      │                   │                 │
  │   description }       │                      │                   │                 │
  │ }                     │                      │                   │                 │
```

---

## 6. Admin — Create Product (FR9.1)

```
Admin Client           API Gateway           product-service      PostgreSQL          Redis (db:1)
  │                       │                      │                   │                 │
  │ POST /v1/products     │                      │                   │                 │
  │ Authorization:        │                      │                   │                 │
  │  Bearer <admin-token> │                      │                   │                 │
  │ {                     │                      │                   │                 │
  │  category: "KITCHEN", │                      │                   │                 │
  │  title: "Luna",       │                      │                   │                 │
  │  description: "...",  │                      │                   │                 │
  │  colourIds: [uuid1,   │                      │                   │                 │
  │   uuid2],             │                      │                   │                 │
  │  imageKeys: [         │                      │                   │                 │
  │   "media/uuid.webp"], │                      │                   │                 │
  │  sizes: [...]         │                      │                   │                 │
  │ }                     │                      │                   │                 │
  │──────────────────────▶│                      │                   │                 │
  │                       │ Verify JWT           │                   │                 │
  │                       │ Check X-User-Role    │                   │                 │
  │                       │ = ADMIN ✓            │                   │                 │
  │                       │─────────────────────▶│                   │                 │
  │                       │                      │ @RequireRole(     │                 │
  │                       │                      │  ADMIN) guard ✓   │                 │
  │                       │                      │ Zod validate body │                 │
  │                       │                      │                   │                 │
  │                       │                      │ Generate slug:    │                 │
  │                       │                      │ "luna-white"      │                 │
  │                       │                      │ (title + colour)  │                 │
  │                       │                      │                   │                 │
  │                       │                      │ BEGIN TRANSACTION │                 │
  │                       │                      │──────────────────▶│                 │
  │                       │                      │ INSERT products   │                 │
  │                       │                      │──────────────────▶│                 │
  │                       │                      │ INSERT product_   │                 │
  │                       │                      │ images (bulk)     │                 │
  │                       │                      │──────────────────▶│                 │
  │                       │                      │ INSERT product_   │                 │
  │                       │                      │ colours (join tbl)│                 │
  │                       │                      │──────────────────▶│                 │
  │                       │                      │ INSERT product_   │                 │
  │                       │                      │ sizes (bulk)      │                 │
  │                       │                      │──────────────────▶│                 │
  │                       │                      │ COMMIT            │                 │
  │                       │                      │◀──────────────────│                 │
  │                       │                      │                   │                 │
  │                       │                      │ Invalidate cache: │                 │
  │                       │                      │ DEL product:list:*│                 │
  │                       │                      │ (scan + delete    │                 │
  │                       │                      │  matching keys)   │                 │
  │                       │                      │────────────────────────────────────▶│
  │                       │                      │                   │                 │
  │                       │                      │ Publish event:    │                 │
  │                       │                      │ "product.created" │                 │
  │                       │                      │ → event bus       │                 │
  │ ◀─────────────────────│◀─────────────────────│                   │                 │
  │ 201 {                 │                      │                   │                 │
  │  productId: "uuid",   │                      │                   │                 │
  │  slug: "luna-white"   │                      │                   │                 │
  │ }                     │                      │                   │                 │
```

---

## Cache Invalidation on Product Update

```
Admin Client           product-service           Redis (db:1)         CloudFront
  │                       │                           │                    │
  │ PATCH /v1/products/:id│                           │                    │
  │──────────────────────▶│                           │                    │
  │                       │ UPDATE products SET ...   │                    │
  │                       │                           │                    │
  │                       │ Targeted invalidation:    │                    │
  │                       │ DEL product:detail:{slug} │                    │
  │                       │──────────────────────────▶│                    │
  │                       │                           │                    │
  │                       │ DEL product:list:*        │                    │
  │                       │ (pattern scan — O(n) keys)│                    │
  │                       │──────────────────────────▶│                    │
  │                       │                           │                    │
  │                       │ CloudFront invalidation:  │                    │
  │                       │ /v1/products/* paths      │                    │
  │                       │───────────────────────────────────────────────▶│
  │ ◀─────────────────────│                           │                    │
  │ 200 { updated product}│                           │                    │
```

---

## Error States Summary

| Scenario | HTTP Status | Error Code |
|----------|------------|------------|
| Invalid filter value | 400 | `VALIDATION_ERROR` |
| Product slug not found | 404 | `PRODUCT_NOT_FOUND` |
| Invalid cursor format | 400 | `INVALID_CURSOR` |
| Colour UUID not found (admin) | 422 | `COLOUR_NOT_FOUND` |
| Duplicate slug on create | 409 | `SLUG_ALREADY_EXISTS` |
| Insufficient role (non-admin write) | 403 | `FORBIDDEN` |