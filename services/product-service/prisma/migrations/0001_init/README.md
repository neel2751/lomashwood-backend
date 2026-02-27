# Migration 0001_init

## Overview
Initial database schema migration for the Product Service of Lomash Wood application.

**Migration Date:** 2026-02-12  
**Migration Type:** Initial Schema Setup  
**Database:** PostgreSQL  

## Purpose
This migration establishes the complete database schema for managing products, colours, categories, sales, packages, and inventory for kitchen and bedroom design services.

## Schema Components

### Enums

#### ProductCategory
- `KITCHEN` - Kitchen products and designs
- `BEDROOM` - Bedroom products and designs

#### ProductStatus
- `DRAFT` - Product in draft state, not visible to customers
- `PUBLISHED` - Product is live and visible to customers
- `ARCHIVED` - Product is archived, not visible but retained for records

#### StyleType
- `MODERN` - Modern/contemporary design style
- `TRADITIONAL` - Traditional/classic design style
- `CONTEMPORARY` - Contemporary design style
- `CLASSIC` - Classic design style
- `MINIMALIST` - Minimalist design style
- `RUSTIC` - Rustic design style
- `SHAKER` - Shaker-style design
- `HANDLELESS` - Handleless/sleek design
- `INDUSTRIAL` - Industrial design style

#### FinishType
- `GLOSS` - High-gloss finish
- `MATT` - Matte finish
- `SATIN` - Satin finish
- `TEXTURED` - Textured finish
- `WOOD_GRAIN` - Wood grain finish
- `METALLIC` - Metallic finish
- `LAMINATE` - Laminate finish

### Tables

#### products
Core product table storing kitchen and bedroom product information.

**Key Fields:**
- `id` (UUID) - Primary key
- `category` (ProductCategory) - Kitchen or Bedroom
- `title` - Product name
- `description` - Detailed product description
- `price` (DECIMAL) - Product price
- `rangeName` - Product range/collection name
- `status` (ProductStatus) - Publication status
- `style` (StyleType) - Design style
- `finish` (FinishType) - Finish type
- `slug` - URL-friendly identifier (unique)
- `metaTitle` - SEO meta title
- `metaDescription` - SEO meta description
- `featured` (BOOLEAN) - Featured product flag
- `viewCount` (INTEGER) - Number of views
- `sortOrder` (INTEGER) - Display order
- `createdAt`, `updatedAt` - Timestamps
- `deletedAt` - Soft delete timestamp
- `createdBy`, `updatedBy` - Audit fields

**Indexes:**
- category, status, slug (unique), featured, style, finish, rangeName, createdAt, deletedAt, sortOrder

**Relations:**
- Has many: product_images, product_colours, product_units, sale_products, price_history
- Has one: inventory

#### product_images
Stores multiple images per product.

**Key Fields:**
- `id` (UUID) - Primary key
- `productId` - Foreign key to products
- `url` - Image URL
- `altText` - Accessibility text
- `order` - Display order

**Cascade:** DELETE CASCADE on product deletion

#### colours
Master colour palette for products.

**Key Fields:**
- `id` (UUID) - Primary key
- `name` - Colour name (unique)
- `hexCode` - Hex colour code (#FFFFFF)
- `order` - Display order
- `deletedAt` - Soft delete

#### product_colours
Many-to-many relationship between products and colours.

**Key Fields:**
- `id` (UUID) - Primary key
- `productId` - Foreign key to products
- `colourId` - Foreign key to colours

**Constraints:**
- Unique constraint on (productId, colourId)
- CASCADE DELETE on both sides

#### product_units
Product size/unit variations (e.g., base unit, wall unit, tall unit).

**Key Fields:**
- `id` (UUID) - Primary key
- `productId` - Foreign key to products
- `image` - Unit image URL
- `title` - Unit name
- `description` - Unit description
- `order` - Display order

**Cascade:** DELETE CASCADE on product deletion

#### categories
Hierarchical product categories.

**Key Fields:**
- `id` (UUID) - Primary key
- `name` - Category name (unique)
- `slug` - URL slug (unique)
- `description` - Category description
- `type` (ProductCategory) - Kitchen or Bedroom
- `image` - Category image
- `order` - Display order
- `parentId` - Self-referencing foreign key for hierarchy
- `deletedAt` - Soft delete

**Self-Relation:** Supports nested categories

#### sizes
Product size options.

**Key Fields:**
- `id` (UUID) - Primary key
- `name` - Size name (unique)
- `value` - Numeric value
- `unit` - Unit of measurement (mm, cm, etc.)
- `order` - Display order
- `deletedAt` - Soft delete

#### sales
Sales and promotional offers.

**Key Fields:**
- `id` (UUID) - Primary key
- `title` - Sale title
- `description` - Sale description
- `image` - Sale banner image
- `startDate`, `endDate` - Sale period
- `discount` (DECIMAL) - Discount percentage
- `terms` - Terms and conditions
- `category` (ProductCategory) - Optional category filter
- `active` (BOOLEAN) - Active status
- `slug` - URL slug (unique)
- `deletedAt` - Soft delete
- `createdBy`, `updatedBy` - Audit fields

**Indexes:** active, startDate, endDate, category, slug

#### sale_products
Many-to-many relationship between sales and products.

**Key Fields:**
- `id` (UUID) - Primary key
- `saleId` - Foreign key to sales
- `productId` - Foreign key to products

**Constraints:**
- Unique constraint on (saleId, productId)
- CASCADE DELETE on both sides

#### packages
Product packages/bundles.

**Key Fields:**
- `id` (UUID) - Primary key
- `title` - Package title
- `description` - Package description
- `image` - Package image
- `price` (DECIMAL) - Package price
- `category` (ProductCategory) - Kitchen or Bedroom
- `active` (BOOLEAN) - Active status
- `slug` - URL slug (unique)
- `features` (JSONB) - Package features as JSON
- `deletedAt` - Soft delete
- `createdBy`, `updatedBy` - Audit fields

#### inventory
Real-time inventory tracking per product.

**Key Fields:**
- `id` (UUID) - Primary key
- `productId` - Unique foreign key to products
- `quantity` - Total stock quantity
- `reserved` - Reserved/on-hold quantity
- `available` - Available quantity (quantity - reserved)
- `lowStockAlert` - Low stock threshold
- `lastRestocked` - Last restock timestamp

**Constraint:** One-to-one with products (unique productId)

#### price_history
Audit trail for price changes.

**Key Fields:**
- `id` (UUID) - Primary key
- `productId` - Foreign key to products
- `oldPrice` (DECIMAL) - Previous price (nullable for initial price)
- `newPrice` (DECIMAL) - New price
- `reason` - Reason for price change
- `changedAt` - Timestamp of change
- `changedBy` - User who made the change

## Indexing Strategy

### High-Traffic Queries
- Products by category, status, featured flag
- Products by slug (unique lookup)
- Products by style and finish (filtering)
- Products by rangeName (grouping)

### Performance Optimization
- Composite indexes on frequently queried combinations
- Soft delete indexes (deletedAt) for filtering active records
- Order indexes for sorted listings
- Foreign key indexes for join optimization

### Search & Filter
- Multiple indexes on products table support:
  - Category filtering
  - Style/finish filtering
  - Featured products
  - Range-based grouping
  - Soft-deleted exclusion

## Data Integrity

### Foreign Key Constraints
- All relationships use proper foreign keys
- Cascade deletes for dependent data (images, colours, units)
- Cascade deletes prevent orphaned records

### Unique Constraints
- Product slugs (SEO-friendly URLs)
- Colour names
- Category names and slugs
- Size names
- Sale slugs
- Package slugs
- Inventory per product (one-to-one)

### Soft Deletes
Tables supporting soft deletes:
- products
- colours
- categories
- sizes
- sales
- packages

Soft deletes preserve data integrity while hiding records from active queries.

## Running the Migration

### Using Prisma CLI

```bash
# Run all pending migrations
npx prisma migrate deploy

# Run migrations in development
npx prisma migrate dev

# Reset database and run migrations
npx prisma migrate reset
```

### Manual Execution

```bash
# Connect to PostgreSQL
psql -U postgres -d lomash_product_db

# Execute migration
\i migration.sql
```

### Verification

```bash
# Generate Prisma Client
npx prisma generate

# Check migration status
npx prisma migrate status

# Open Prisma Studio to verify data
npx prisma studio
```

## Rollback Plan

### Manual Rollback

```sql
-- Drop all tables in reverse order
DROP TABLE IF EXISTS price_history CASCADE;
DROP TABLE IF EXISTS inventory CASCADE;
DROP TABLE IF EXISTS sale_products CASCADE;
DROP TABLE IF EXISTS sales CASCADE;
DROP TABLE IF EXISTS packages CASCADE;
DROP TABLE IF EXISTS product_units CASCADE;
DROP TABLE IF EXISTS product_colours CASCADE;
DROP TABLE IF EXISTS product_images CASCADE;
DROP TABLE IF EXISTS sizes CASCADE;
DROP TABLE IF EXISTS categories CASCADE;
DROP TABLE IF EXISTS colours CASCADE;
DROP TABLE IF EXISTS products CASCADE;

-- Drop enums
DROP TYPE IF EXISTS "FinishType";
DROP TYPE IF EXISTS "StyleType";
DROP TYPE IF EXISTS "ProductStatus";
DROP TYPE IF EXISTS "ProductCategory";
```

### Using Prisma

```bash
# Prisma does not support automatic rollback
# Manual intervention required for production rollbacks
# Always backup database before migrations
```

## Post-Migration Steps

1. **Generate Prisma Client**
   ```bash
   npx prisma generate
   ```

2. **Run Seed Script**
   ```bash
   npx prisma db seed
   ```

3. **Verify Schema**
   ```bash
   npx prisma studio
   ```

4. **Run Tests**
   ```bash
   npm test
   ```

## Dependencies

- PostgreSQL 14+ (recommended)
- Prisma ORM 5.x+
- Node.js 18+ with TypeScript support

## Notes

- All IDs use UUID v4 for distributed system compatibility
- Decimal fields use (10,2) precision for currency
- Timestamps use TIMESTAMP(3) for millisecond precision
- JSONB used for flexible features storage in packages
- All tables include created/updated timestamps
- Audit fields (createdBy, updatedBy) for traceability

## Related Documentation

- [Prisma Schema Documentation](../../schema.prisma)
- [Seed Script](../../seed.ts)
- [Product Service Architecture](../../../../docs/architecture/product-service.md)
- [Database Design](../../../../docs/database/product-database.md)

## Change Log

| Version | Date | Description |
|---------|------|-------------|
| 0001 | 2026-02-12 | Initial schema creation |

## Support

For issues or questions regarding this migration:
- Check Prisma documentation: https://www.prisma.io/docs
- Review schema.prisma file
- Contact backend team lead