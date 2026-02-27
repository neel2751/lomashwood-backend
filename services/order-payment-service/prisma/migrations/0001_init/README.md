# Migration 0001_init - Order Payment Service Initial Schema

## Overview
Initial database schema for the Lomash Wood Order & Payment Service. This migration creates the complete foundation for managing kitchen and bedroom orders, payments, invoices, refunds, and related financial operations.

## Migration Details
- **Migration ID**: 0001_init
- **Created**: 2024-01-01
- **Service**: order-payment-service
- **Database**: PostgreSQL 14+
- **ORM**: Prisma

## Database Objects Created

### Enums (9)
| Enum Name | Values | Purpose |
|-----------|--------|---------|
| OrderStatus | PENDING, CONFIRMED, PROCESSING, SHIPPED, DELIVERED, CANCELLED, REFUNDED, ON_HOLD | Order lifecycle states |
| PaymentStatus | PENDING, AUTHORIZED, CAPTURED, FAILED, REFUNDED, PARTIALLY_REFUNDED, CANCELLED | Payment processing states |
| PaymentMethod | CARD, BANK_TRANSFER, PAYPAL, STRIPE, RAZORPAY, CASH_ON_DELIVERY | Payment methods accepted |
| PaymentProvider | STRIPE, RAZORPAY, PAYPAL, MANUAL | Payment gateway providers |
| InvoiceStatus | DRAFT, ISSUED, PAID, OVERDUE, CANCELLED, VOID | Invoice lifecycle states |
| RefundStatus | PENDING, PROCESSING, COMPLETED, FAILED, CANCELLED | Refund processing states |
| RefundReason | CUSTOMER_REQUEST, DEFECTIVE_PRODUCT, WRONG_ITEM_SHIPPED, DAMAGED_IN_TRANSIT, ORDER_CANCELLATION, DUPLICATE_ORDER, NOT_AS_DESCRIBED, OTHER | Standard refund reasons |
| TransactionType | AUTHORIZATION, CAPTURE, VOID, REFUND, CHARGEBACK | Payment transaction types |
| TransactionStatus | SUCCESS, FAILED, PENDING, CANCELLED | Transaction outcome states |
| DiscountType | PERCENTAGE, FIXED_AMOUNT, FREE_SHIPPING, BUY_X_GET_Y | Coupon discount types |

### Tables (11)

#### 1. orders
Main order records with complete customer and pricing information.

**Key Fields:**
- `orderNumber` - Unique order identifier (e.g., ORD-2024-12345)
- `customerId` - Reference to customer (from customer-service)
- `status` - Current order status
- `subtotal`, `taxAmount`, `shippingCost`, `discountAmount`, `total` - All in pence (GBP)
- `shippingAddress`, `billingAddress` - JSONB format for flexibility
- `couponCode` - Applied discount code
- `trackingNumber`, `trackingUrl` - Shipping tracking info
- `shippedAt`, `deliveredAt`, `cancelledAt` - Fulfillment timestamps

**Relationships:**
- 1:M with order_items
- 1:M with payments
- 1:M with invoices
- 1:M with refunds
- 1:M with order_status_history

#### 2. order_items
Line items for each order, capturing product details at time of purchase.

**Key Fields:**
- `productId` - Reference to product (from product-service)
- `productName`, `productSku` - Snapshot of product info
- `quantity`, `unitPrice`, `totalPrice` - Item pricing
- `taxRate`, `taxAmount` - Tax calculation
- `productImage`, `productDetails` - JSONB snapshot

**Relationships:**
- M:1 with orders (CASCADE delete)

#### 3. payments
Payment records with provider integration details.

**Key Fields:**
- `amount`, `currency` - Payment amount (default GBP)
- `status` - Payment processing state
- `method`, `provider` - How payment was made
- `providerTransactionId`, `providerPaymentIntentId` - External references
- `cardLast4`, `cardBrand` - PCI-compliant card info
- `authorizedAt`, `capturedAt`, `refundedAt` - Processing timestamps
- `riskScore`, `riskLevel`, `fraudDetected` - Fraud prevention

**Relationships:**
- M:1 with orders (CASCADE delete)
- 1:M with payment_transactions
- 1:M with refunds

#### 4. payment_transactions
Detailed audit log of all payment operations.

**Key Fields:**
- `type` - AUTHORIZATION, CAPTURE, VOID, REFUND, CHARGEBACK
- `amount`, `currency` - Transaction amount
- `status` - SUCCESS, FAILED, PENDING
- `providerResponse` - JSONB of gateway response
- `errorCode`, `errorMessage` - Failure details

**Relationships:**
- M:1 with payments (CASCADE delete)

#### 5. invoices
Generated invoices for orders with PDF support.

**Key Fields:**
- `invoiceNumber` - Unique invoice ID (e.g., INV-2024-00001)
- `orderId`, `customerId` - References
- `status` - Invoice state
- `subtotal`, `taxAmount`, `total`, `paidAmount` - Financial details
- `issuedAt`, `dueDate`, `paidAt` - Important dates
- `pdfUrl`, `pdfGeneratedAt` - PDF storage
- `notes`, `termsAndConditions` - Additional info

**Relationships:**
- M:1 with orders (CASCADE delete)

#### 6. refunds
Refund requests and processing records.

**Key Fields:**
- `orderId`, `paymentId` - References
- `amount`, `currency` - Refund amount
- `reason`, `reasonDescription` - Why refund was requested
- `status` - Processing state
- `providerRefundId` - External reference
- `requestedBy`, `approvedBy` - Audit trail
- `approvedAt`, `processedAt`, `completedAt` - Timeline

**Relationships:**
- M:1 with orders (CASCADE delete)
- M:1 with payments (CASCADE delete)

#### 7. coupons
Discount codes and promotions (WELCOME10, KITCHEN50, BEDROOM20, FREESHIP).

**Key Fields:**
- `code` - Unique coupon code
- `discountType`, `discountValue` - Discount configuration
- `minOrderValue`, `maxDiscountAmount` - Restrictions
- `maxUsageCount`, `usageCount` - Usage limits
- `maxUsagePerCustomer` - Per-customer limit
- `validFrom`, `validUntil` - Date validity
- `applicableCategories`, `applicableProducts` - Scope (arrays)
- `excludedCategories`, `excludedProducts` - Exclusions (arrays)
- `isActive` - Current status

**Relationships:**
- 1:M with coupon_usage

#### 8. coupon_usage
Tracks each coupon redemption.

**Key Fields:**
- `couponId`, `couponCode` - Coupon reference
- `orderId`, `customerId` - Who used it and where
- `discountAmount` - Actual discount applied

**Relationships:**
- M:1 with coupons (CASCADE delete)
- M:1 with orders (CASCADE delete)

#### 9. shipping_methods
Available shipping options and rates.

**Key Fields:**
- `name`, `description` - Method details
- `baseCost`, `currency` - Shipping cost
- `estimatedMinDays`, `estimatedMaxDays` - Delivery window
- `carrier`, `carrierServiceCode` - Carrier info
- `minOrderValue`, `maxOrderValue`, `weightLimit` - Restrictions
- `isActive` - Availability
- `availableCountries` - Geographic scope (array)

#### 10. tax_rates
Tax rates by region (UK VAT, etc.).

**Key Fields:**
- `name`, `rate` - Tax identifier and percentage
- `region`, `country` - Geographic scope
- `isDefault`, `isCompound` - Tax calculation rules
- `applicableCategories` - Product scope (array)
- `isActive` - Current status

#### 11. order_status_history
Complete audit trail of order status changes.

**Key Fields:**
- `orderId` - Order reference
- `fromStatus`, `toStatus` - Status transition
- `changedBy` - Who made the change
- `notes` - Reason for change
- `createdAt` - When change occurred

**Relationships:**
- M:1 with orders (CASCADE delete)

## Indexes

### Performance Indexes
- **orders**: orderNumber (unique), customerId, status, couponCode, createdAt, customerEmail, deletedAt
- **order_items**: orderId, productId, productSku
- **payments**: orderId, status, method, provider, providerTransactionId, createdAt, deletedAt
- **payment_transactions**: paymentId, type, status, createdAt
- **invoices**: invoiceNumber (unique), orderId, customerId, status, dueDate, createdAt, deletedAt
- **refunds**: orderId, paymentId, status, reason, createdAt
- **coupons**: code (unique), isActive, validFrom+validUntil, deletedAt
- **coupon_usage**: couponId, orderId, customerId, createdAt
- **shipping_methods**: isActive, deletedAt
- **tax_rates**: region+country, isDefault, isActive, deletedAt
- **order_status_history**: orderId, createdAt

## Constraints

### Foreign Keys
All relationships use CASCADE delete to maintain referential integrity:
- order_items → orders
- payments → orders
- payment_transactions → payments
- invoices → orders
- refunds → orders, payments
- coupon_usage → coupons, orders
- order_status_history → orders

### Check Constraints
- Orders: subtotal ≥ 0, total ≥ 0
- Order Items: quantity > 0, unitPrice ≥ 0
- Payments: amount ≥ 0
- Invoices: total ≥ 0
- Refunds: amount > 0
- Coupons: discountValue ≥ 0, usageCount ≥ 0
- Tax Rates: rate ≥ 0 AND rate ≤ 100

## Data Storage Standards

### Monetary Values
All monetary amounts stored as **INTEGER in pence** for precision:
- £49.99 → 4999
- £1,250.00 → 125000
- £0.50 → 50

This prevents floating-point arithmetic errors in financial calculations.

### Currency
Default currency is **GBP** (British Pounds). Multi-currency support available via currency field.

### Addresses
Stored as **JSONB** with structure:
```json
{
  "fullName": "John Doe",
  "addressLine1": "123 High Street",
  "addressLine2": null,
  "city": "London",
  "county": "Greater London",
  "postcode": "SW1A 1AA",
  "country": "United Kingdom",
  "phone": "+447123456789"
}
```

### Product Details
Stored as **JSONB snapshot** at time of order to preserve historical data:
```json
{
  "category": "Kitchen",
  "range": "Luna White",
  "style": "Modern",
  "finish": "Gloss",
  "dimensions": {...}
}
```

### Metadata
Flexible **JSONB** fields for extensibility without schema changes.

## Soft Deletes
Tables with `deletedAt` field support soft deletion:
- orders
- payments
- invoices
- coupons
- shipping_methods
- tax_rates

Soft-deleted records remain in database but are filtered from queries.

## Security & Compliance

### PCI DSS Compliance
- **NEVER** store full card numbers
- Only store last 4 digits: `cardLast4`
- Store card brand: `cardBrand`
- Store expiry: `cardExpiryMonth`, `cardExpiryYear`
- All sensitive data in payment provider systems

### GDPR Compliance
- Soft deletes preserve data for legal retention
- Customer data can be anonymized via updates
- Audit trail maintains data lineage

### Fraud Prevention
- `riskScore`, `riskLevel`, `fraudDetected` fields
- Transaction logging for forensics
- Provider response capture

## Integration Points

### External Services
This schema integrates with:
- **auth-service**: customerId references
- **product-service**: productId in order items
- **customer-service**: customerId, customer profiles
- **notification-service**: order confirmations, payment receipts
- **analytics-service**: order tracking, revenue analytics

### Payment Providers
- **Stripe**: Full integration with payment intents, refunds
- **Razorpay**: Alternative provider for India market
- **PayPal**: Direct payment support

## Business Rules Implemented

### Order Lifecycle
1. PENDING → Order created
2. CONFIRMED → Payment authorized
3. PROCESSING → Order being prepared
4. SHIPPED → Order dispatched
5. DELIVERED → Order completed
6. CANCELLED → Order cancelled (before shipping)
7. REFUNDED → Order refunded
8. ON_HOLD → Temporary hold (fraud review, stock issues)

### Payment Lifecycle
1. PENDING → Payment initiated
2. AUTHORIZED → Funds reserved
3. CAPTURED → Funds transferred
4. FAILED → Payment declined
5. REFUNDED → Full refund processed
6. PARTIALLY_REFUNDED → Partial refund processed
7. CANCELLED → Payment cancelled

### Coupon Logic
- Validate `validFrom` ≤ now ≤ `validUntil`
- Check `usageCount` < `maxUsageCount`
- Verify order meets `minOrderValue`
- Apply category/product restrictions
- Track per-customer usage limits

### Tax Calculation
- Apply default tax rate if no specific rate found
- Support compound tax (tax on tax)
- Category-specific rates (e.g., reduced VAT on certain items)

## Running the Migration

```bash
# Navigate to service directory
cd services/order-payment-service

# Run migration
npx prisma migrate deploy

# Generate Prisma Client
npx prisma generate

# Verify migration
npx prisma migrate status
```

## Rollback Plan
To rollback this migration:

```bash
# Reset database (WARNING: destroys all data)
npx prisma migrate reset

# Or manually drop all tables
psql -d lomash_order_payment -c "DROP SCHEMA public CASCADE; CREATE SCHEMA public;"
```

## Post-Migration Steps

1. **Seed Database**
   ```bash
   npm run seed
   ```

2. **Create Indexes** (if not auto-created)
   - Already included in migration

3. **Set Up Monitoring**
   - Enable query logging
   - Monitor slow queries on indexed fields

4. **Configure Backups**
   - Daily full backups
   - Point-in-time recovery enabled

5. **Test Queries**
   - Verify foreign key constraints
   - Test cascade deletes
   - Validate check constraints

## Expected Seed Data

After running seed:
- 50 orders (various statuses)
- 100+ order items
- 45+ payments
- 40+ invoices
- 8-12 refunds
- 4 active coupons (WELCOME10, KITCHEN50, BEDROOM20, FREESHIP)
- Transaction logs for all payments

## Performance Expectations

### Query Performance
- Order lookup by orderNumber: < 10ms
- Customer order history: < 50ms
- Payment status check: < 5ms
- Coupon validation: < 20ms

### Write Performance
- Order creation: < 100ms
- Payment processing: < 150ms
- Invoice generation: < 80ms

### Index Maintenance
- Auto-vacuum enabled
- Regular ANALYZE on large tables
- Monitor index bloat monthly

## Troubleshooting

### Common Issues

**Migration fails with "relation already exists"**
- Tables already created from previous run
- Solution: Reset database or drop conflicting tables

**Foreign key constraint violation**
- Trying to insert order_items without valid orderId
- Solution: Ensure parent records exist first

**Check constraint violation**
- Attempting to insert negative amounts
- Solution: Validate data before insert

**Enum type conflict**
- Enum already exists with different values
- Solution: Drop existing enum or use different name

## Maintenance

### Regular Tasks
- **Daily**: Monitor slow queries
- **Weekly**: Check index usage stats
- **Monthly**: Analyze table bloat, vacuum if needed
- **Quarterly**: Review and optimize indexes

### Growth Projections
Based on expected 1000 orders/month:
- orders: ~12K rows/year
- order_items: ~36K rows/year (avg 3 items/order)
- payments: ~11K rows/year
- payment_transactions: ~22K rows/year

### Archive Strategy
After 2 years, archive:
- Completed orders to archive tables
- Paid invoices to cold storage
- Old transaction logs (keep summary)

## Version History
- **v0001**: Initial schema creation (2024-01-01)

## References
- Prisma Schema: `prisma/schema.prisma`
- Seed File: `prisma/seed.ts`
- SRS Document: `docs/SRS_Lomash_Wood.pdf`
- Master Prompt: `docs/MASTER_BACKEND_PROMPT.md`