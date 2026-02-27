# Prisma - Order Payment Service

## Overview
This directory contains the Prisma ORM configuration, schema, migrations, and seed data for the Lomash Wood Order & Payment Service. It manages all database operations for orders, payments, invoices, refunds, and related financial transactions.

## Directory Structure

```
prisma/
├── schema.prisma           # Prisma schema definition
├── seed.ts                 # Database seeding script
├── migrations/             # Migration history
│   ├── migration_lock.toml # Provider lock file (PostgreSQL)
│   └── 0001_init/         # Initial migration
│       ├── migration.sql   # SQL DDL statements
│       └── README.md       # Migration documentation
└── README.md              # This file
```

## Database Schema

### Core Entities

#### Orders System
- **orders** - Main order records with customer info, pricing, addresses
- **order_items** - Line items for each order (kitchen/bedroom products)
- **order_status_history** - Complete audit trail of status changes

#### Payment System
- **payments** - Payment records (Stripe, Razorpay integration)
- **payment_transactions** - Detailed transaction logs (auth, capture, refund)

#### Financial Documents
- **invoices** - Generated invoices with PDF support
- **refunds** - Refund processing and tracking

#### Marketing & Pricing
- **coupons** - Discount codes (WELCOME10, KITCHEN50, BEDROOM20, FREESHIP)
- **coupon_usage** - Coupon redemption tracking
- **tax_rates** - Tax rates by region (UK VAT, etc.)
- **shipping_methods** - Available shipping options and costs

### Key Features

**Money Storage**
- All amounts stored as integers in pence (GBP)
- Example: £49.99 = 4999 pence
- Prevents floating-point arithmetic errors

**Address Storage**
- JSONB format for flexibility
- Supports international addresses
- Separate shipping and billing addresses

**Soft Deletes**
- Major tables support soft deletion via `deletedAt`
- Maintains data for compliance and audit

**Audit Trail**
- Complete order status history
- Payment transaction logging
- Refund tracking

## Prisma CLI Commands

### Setup & Installation

```bash
# Install Prisma CLI (if not already installed)
npm install -D prisma

# Install Prisma Client
npm install @prisma/client

# Generate Prisma Client
npx prisma generate
```

### Database Migrations

```bash
# Create a new migration (after schema changes)
npx prisma migrate dev --name <migration-name>

# Apply pending migrations (production)
npx prisma migrate deploy

# Check migration status
npx prisma migrate status

# Reset database (WARNING: destroys all data)
npx prisma migrate reset

# Resolve migration issues
npx prisma migrate resolve --applied <migration-name>
npx prisma migrate resolve --rolled-back <migration-name>
```

### Schema Management

```bash
# Format schema file
npx prisma format

# Validate schema
npx prisma validate

# Generate Prisma Client (after schema changes)
npx prisma generate

# Pull schema from existing database
npx prisma db pull

# Push schema to database (development only)
npx prisma db push
```

### Database Seeding

```bash
# Run seed script
npx prisma db seed

# Or use npm script
npm run seed

# Reset and seed
npx prisma migrate reset --skip-seed
npm run seed
```

### Prisma Studio (GUI)

```bash
# Open Prisma Studio
npx prisma studio

# Accessible at: http://localhost:5555
```

### Introspection & Analysis

```bash
# Generate ERD (requires prisma-erd-generator)
npx prisma generate

# Database introspection
npx prisma db pull

# Show database statistics
npx prisma db execute --stdin < stats.sql
```

## Schema.prisma Configuration

### Database Connection

```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}
```

**Environment Variables Required:**
```env
DATABASE_URL="postgresql://user:password@localhost:5432/lomash_order_payment?schema=public"
```

### Client Generation

```prisma
generator client {
  provider = "prisma-client-js"
  output   = "../node_modules/.prisma/client"
}
```

### Common Patterns

**Enums**
```prisma
enum OrderStatus {
  PENDING
  CONFIRMED
  PROCESSING
  SHIPPED
  DELIVERED
  CANCELLED
  REFUNDED
  ON_HOLD
}
```

**Relations**
```prisma
model Order {
  id         String      @id @default(uuid())
  items      OrderItem[] @relation("OrderItems")
  payments   Payment[]   @relation("OrderPayments")
  invoices   Invoice[]   @relation("OrderInvoices")
}

model OrderItem {
  id       String @id @default(uuid())
  order    Order  @relation("OrderItems", fields: [orderId], references: [id], onDelete: Cascade)
  orderId  String
}
```

**Soft Deletes**
```prisma
model Order {
  deletedAt DateTime?
  
  @@index([deletedAt])
}
```

**JSONB Fields**
```prisma
model Order {
  shippingAddress Json
  billingAddress  Json
  metadata        Json?
}
```

## Migration Workflow

### Creating a New Migration

1. **Modify schema.prisma**
   ```prisma
   model Order {
     // Add new field
     estimatedDeliveryDate DateTime?
   }
   ```

2. **Create migration**
   ```bash
   npx prisma migrate dev --name add_estimated_delivery_date
   ```

3. **Review generated SQL**
   - Check `migrations/<timestamp>_add_estimated_delivery_date/migration.sql`
   - Verify indexes, constraints, and data types

4. **Test migration**
   ```bash
   # In development
   npx prisma migrate dev
   
   # Test rollback capability
   npx prisma migrate reset
   npm run seed
   ```

5. **Commit to version control**
   ```bash
   git add prisma/migrations/
   git add prisma/schema.prisma
   git commit -m "feat: add estimated delivery date to orders"
   ```

### Applying Migrations in Production

```bash
# 1. Backup database first
pg_dump -h localhost -U user -d lomash_order_payment > backup.sql

# 2. Apply migrations
npx prisma migrate deploy

# 3. Verify
npx prisma migrate status

# 4. Generate updated client
npx prisma generate
```

### Handling Migration Conflicts

**Scenario: Migration already applied manually**
```bash
npx prisma migrate resolve --applied <migration-name>
```

**Scenario: Migration failed midway**
```bash
# Mark as rolled back
npx prisma migrate resolve --rolled-back <migration-name>

# Fix schema and recreate
npx prisma migrate dev --name <migration-name>
```

**Scenario: Divergent migration history**
```bash
# Reset to specific migration
npx prisma migrate resolve --applied <last-good-migration>

# Apply remaining migrations
npx prisma migrate deploy
```

## Seeding the Database

### Default Seed Data

The seed script (`seed.ts`) creates:
- **50 orders** with realistic UK data
- **100+ order items** for kitchen/bedroom products
- **45+ payments** with Stripe/Razorpay transactions
- **40+ invoices** with proper numbering
- **8-12 refunds** (full and partial)
- **4 active coupons** (WELCOME10, KITCHEN50, BEDROOM20, FREESHIP)
- **Payment transaction logs** for all payments

### Running the Seed

```bash
# Standard seed
npm run seed

# Or directly
npx prisma db seed

# Reset and seed
npx prisma migrate reset
```

### Customizing Seed Data

Edit `seed.ts` to modify:
```typescript
// Change number of orders
const stats = await createOrders(100); // Instead of 50

// Add custom coupons
const COUPON_CODES = [
  {
    code: 'CUSTOM2024',
    discountType: 'PERCENTAGE',
    discountValue: 15.0,
    // ...
  }
];
```

### Seed Configuration

In `package.json`:
```json
{
  "prisma": {
    "seed": "ts-node --compiler-options {\"module\":\"CommonJS\"} prisma/seed.ts"
  }
}
```

## Prisma Client Usage

### Importing the Client

```typescript
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
```

### Basic CRUD Operations

**Create**
```typescript
const order = await prisma.order.create({
  data: {
    orderNumber: 'ORD-2024-12345',
    customerId: 'cust_123',
    status: 'PENDING',
    subtotal: 100000, // £1000.00
    total: 120000,    // £1200.00
    currency: 'GBP',
    shippingAddress: {
      fullName: 'John Doe',
      addressLine1: '123 High Street',
      city: 'London',
      postcode: 'SW1A 1AA',
      country: 'United Kingdom',
    },
    billingAddress: { /* ... */ },
  },
});
```

**Read**
```typescript
// Find by ID
const order = await prisma.order.findUnique({
  where: { id: 'order_123' },
  include: {
    items: true,
    payments: true,
  },
});

// Find many with filters
const orders = await prisma.order.findMany({
  where: {
    customerId: 'cust_123',
    status: 'DELIVERED',
    deletedAt: null, // Exclude soft-deleted
  },
  orderBy: { createdAt: 'desc' },
  take: 10,
});
```

**Update**
```typescript
const order = await prisma.order.update({
  where: { id: 'order_123' },
  data: {
    status: 'SHIPPED',
    shippedAt: new Date(),
    trackingNumber: 'TRACK123',
  },
});
```

**Delete (Soft)**
```typescript
const order = await prisma.order.update({
  where: { id: 'order_123' },
  data: { deletedAt: new Date() },
});
```

**Delete (Hard)**
```typescript
const order = await prisma.order.delete({
  where: { id: 'order_123' },
});
```

### Advanced Queries

**Transactions**
```typescript
const result = await prisma.$transaction(async (tx) => {
  // Create order
  const order = await tx.order.create({ /* ... */ });
  
  // Create order items
  await tx.orderItem.createMany({
    data: items.map(item => ({
      orderId: order.id,
      ...item,
    })),
  });
  
  // Create payment
  const payment = await tx.payment.create({
    data: {
      orderId: order.id,
      amount: order.total,
      status: 'PENDING',
    },
  });
  
  return { order, payment };
});
```

**Aggregations**
```typescript
// Total revenue
const revenue = await prisma.order.aggregate({
  where: {
    status: 'DELIVERED',
    deletedAt: null,
  },
  _sum: {
    total: true,
  },
});

// Order count by status
const ordersByStatus = await prisma.order.groupBy({
  by: ['status'],
  _count: true,
  where: { deletedAt: null },
});
```

**Raw SQL**
```typescript
const result = await prisma.$queryRaw`
  SELECT 
    DATE_TRUNC('day', created_at) as date,
    COUNT(*) as order_count,
    SUM(total) as revenue
  FROM orders
  WHERE deleted_at IS NULL
  GROUP BY DATE_TRUNC('day', created_at)
  ORDER BY date DESC
  LIMIT 30
`;
```

## Performance Optimization

### Indexing Strategy

**Already Indexed:**
- Primary keys (id)
- Foreign keys (orderId, customerId, etc.)
- Unique constraints (orderNumber, invoiceNumber, coupon code)
- Common query fields (status, createdAt, deletedAt)

**Adding Custom Indexes:**
```prisma
model Order {
  // Compound index for common query
  @@index([customerId, status, createdAt])
  
  // Partial index for active orders
  @@index([status], where: { deletedAt: null })
}
```

### Query Optimization

**Use Select for Specific Fields**
```typescript
const orders = await prisma.order.findMany({
  select: {
    id: true,
    orderNumber: true,
    total: true,
    status: true,
    // Don't fetch unnecessary JSON fields
  },
});
```

**Pagination**
```typescript
const orders = await prisma.order.findMany({
  skip: (page - 1) * 20,
  take: 20,
  cursor: { id: lastOrderId }, // Better than skip for large datasets
});
```

**Connection Pooling**
```typescript
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL,
    },
  },
  log: ['query', 'error', 'warn'],
});
```

### Batch Operations

```typescript
// Batch create
await prisma.orderItem.createMany({
  data: items,
  skipDuplicates: true,
});

// Batch update
await prisma.order.updateMany({
  where: {
    status: 'PENDING',
    createdAt: {
      lt: thirtyDaysAgo,
    },
  },
  data: {
    status: 'CANCELLED',
    cancelledAt: new Date(),
  },
});
```

## Best Practices

### 1. Always Use Transactions for Related Operations
```typescript
// ✅ Good
await prisma.$transaction([
  prisma.order.create({ /* ... */ }),
  prisma.orderItem.createMany({ /* ... */ }),
  prisma.payment.create({ /* ... */ }),
]);

// ❌ Bad (not atomic)
await prisma.order.create({ /* ... */ });
await prisma.orderItem.createMany({ /* ... */ });
await prisma.payment.create({ /* ... */ });
```

### 2. Implement Soft Deletes
```typescript
// ✅ Good
await prisma.order.update({
  where: { id },
  data: { deletedAt: new Date() },
});

// Filter out soft-deleted in queries
where: { deletedAt: null }

// ❌ Avoid hard deletes for audit trail
await prisma.order.delete({ where: { id } });
```

### 3. Use Type-Safe Enums
```typescript
// ✅ Good
import { OrderStatus } from '@prisma/client';

const order = await prisma.order.update({
  data: { status: OrderStatus.SHIPPED },
});

// ❌ Bad (string literals, no type safety)
const order = await prisma.order.update({
  data: { status: 'SHIPPED' as any },
});
```

### 4. Handle Errors Properly
```typescript
import { Prisma } from '@prisma/client';

try {
  await prisma.order.create({ /* ... */ });
} catch (error) {
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code === 'P2002') {
      // Unique constraint violation
      throw new Error('Order number already exists');
    }
  }
  throw error;
}
```

### 5. Close Connections
```typescript
// In main.ts or app shutdown
process.on('SIGTERM', async () => {
  await prisma.$disconnect();
  process.exit(0);
});
```

### 6. Use Repository Pattern
```typescript
// order.repository.ts
export class OrderRepository {
  constructor(private prisma: PrismaClient) {}
  
  async findById(id: string) {
    return this.prisma.order.findUnique({
      where: { id, deletedAt: null },
      include: { items: true, payments: true },
    });
  }
  
  async create(data: CreateOrderDto) {
    return this.prisma.order.create({ data });
  }
}
```

## Troubleshooting

### Common Issues

**Issue: Prisma Client out of sync**
```bash
# Solution
npx prisma generate
```

**Issue: Migration failed**
```bash
# Check status
npx prisma migrate status

# Resolve manually
npx prisma migrate resolve --rolled-back <migration-name>

# Or reset (development only)
npx prisma migrate reset
```

**Issue: Connection timeout**
```env
# Increase timeout in DATABASE_URL
DATABASE_URL="postgresql://...?connect_timeout=30"
```

**Issue: Too many connections**
```typescript
// Use connection pooling
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL + '?connection_limit=5',
    },
  },
});
```

**Issue: Slow queries**
```typescript
// Enable query logging
const prisma = new PrismaClient({
  log: [
    { level: 'query', emit: 'event' },
  ],
});

prisma.$on('query', (e) => {
  if (e.duration > 1000) {
    console.warn('Slow query:', e.query, e.duration);
  }
});
```

## Environment Variables

Required environment variables:

```env
# Database Connection
DATABASE_URL="postgresql://user:password@localhost:5432/lomash_order_payment"

# Optional: Connection Pooling
DATABASE_POOL_MIN=2
DATABASE_POOL_MAX=10

# Optional: Query Logging
DATABASE_LOG_QUERIES=true
DATABASE_LOG_LEVEL=info

# Optional: SSL
DATABASE_SSL_ENABLED=true
DATABASE_SSL_REJECT_UNAUTHORIZED=false
```

## Testing with Prisma

### Unit Tests
```typescript
import { PrismaClient } from '@prisma/client';
import { mockDeep, DeepMockProxy } from 'jest-mock-extended';

const prismaMock: DeepMockProxy<PrismaClient> = mockDeep<PrismaClient>();

describe('OrderService', () => {
  it('should create order', async () => {
    prismaMock.order.create.mockResolvedValue({
      id: 'order_123',
      // ...
    });
    
    const service = new OrderService(prismaMock);
    const result = await service.createOrder({ /* ... */ });
    
    expect(result.id).toBe('order_123');
  });
});
```

### Integration Tests
```typescript
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_TEST_URL,
    },
  },
});

beforeEach(async () => {
  await prisma.order.deleteMany({});
  await prisma.payment.deleteMany({});
});

afterAll(async () => {
  await prisma.$disconnect();
});
```

## Resources

- [Prisma Documentation](https://www.prisma.io/docs)
- [Prisma Schema Reference](https://www.prisma.io/docs/reference/api-reference/prisma-schema-reference)
- [Prisma Client API](https://www.prisma.io/docs/reference/api-reference/prisma-client-reference)
- [Prisma Migrate](https://www.prisma.io/docs/concepts/components/prisma-migrate)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)

## Support

For issues or questions:
1. Check migration logs: `npx prisma migrate status`
2. Review schema: `npx prisma format && npx prisma validate`
3. Check database connection: `npx prisma db pull`
4. Consult team documentation
5. Raise issue in project repository