
CREATE TYPE "OrderStatus" AS ENUM (
  'PENDING',
  'CONFIRMED',
  'PROCESSING',
  'SHIPPED',
  'DELIVERED',
  'CANCELLED',
  'REFUNDED',
  'ON_HOLD'
);


CREATE TYPE "PaymentStatus" AS ENUM (
  'PENDING',
  'AUTHORIZED',
  'CAPTURED',
  'FAILED',
  'REFUNDED',
  'PARTIALLY_REFUNDED',
  'CANCELLED'
);


CREATE TYPE "PaymentMethod" AS ENUM (
  'CARD',
  'BANK_TRANSFER',
  'PAYPAL',
  'STRIPE',
  'RAZORPAY',
  'CASH_ON_DELIVERY'
);


CREATE TYPE "PaymentProvider" AS ENUM (
  'STRIPE',
  'RAZORPAY',
  'PAYPAL',
  'MANUAL'
);


CREATE TYPE "InvoiceStatus" AS ENUM (
  'DRAFT',
  'ISSUED',
  'PAID',
  'OVERDUE',
  'CANCELLED',
  'VOID'
);


CREATE TYPE "RefundStatus" AS ENUM (
  'PENDING',
  'PROCESSING',
  'COMPLETED',
  'FAILED',
  'CANCELLED'
);


CREATE TYPE "RefundReason" AS ENUM (
  'CUSTOMER_REQUEST',
  'DEFECTIVE_PRODUCT',
  'WRONG_ITEM_SHIPPED',
  'DAMAGED_IN_TRANSIT',
  'ORDER_CANCELLATION',
  'DUPLICATE_ORDER',
  'NOT_AS_DESCRIBED',
  'OTHER'
);


CREATE TYPE "TransactionType" AS ENUM (
  'AUTHORIZATION',
  'CAPTURE',
  'VOID',
  'REFUND',
  'CHARGEBACK'
);


CREATE TYPE "TransactionStatus" AS ENUM (
  'SUCCESS',
  'FAILED',
  'PENDING',
  'CANCELLED'
);


CREATE TYPE "DiscountType" AS ENUM (
  'PERCENTAGE',
  'FIXED_AMOUNT',
  'FREE_SHIPPING',
  'BUY_X_GET_Y'
);


CREATE TABLE "orders" (
  "id" TEXT NOT NULL,
  "orderNumber" TEXT NOT NULL,
  "customerId" TEXT NOT NULL,
  "status" "OrderStatus" NOT NULL DEFAULT 'PENDING',
  
 
  "subtotal" INTEGER NOT NULL,
  "taxAmount" INTEGER NOT NULL DEFAULT 0,
  "shippingCost" INTEGER NOT NULL DEFAULT 0,
  "discountAmount" INTEGER NOT NULL DEFAULT 0,
  "total" INTEGER NOT NULL,
  "currency" TEXT NOT NULL DEFAULT 'GBP',
  
 
  "couponCode" TEXT,
  
 
  "shippingAddress" JSONB NOT NULL,
  "billingAddress" JSONB NOT NULL,
  
 
  "notes" TEXT,
  "internalNotes" TEXT,
  "customerEmail" TEXT,
  "customerPhone" TEXT,
  
  
  "shippedAt" TIMESTAMP(3),
  "deliveredAt" TIMESTAMP(3),
  "cancelledAt" TIMESTAMP(3),
  "cancellationReason" TEXT,
  
 
  "trackingNumber" TEXT,
  "trackingUrl" TEXT,
  "estimatedDeliveryDate" TIMESTAMP(3),
  

  "metadata" JSONB,
  

  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  "deletedAt" TIMESTAMP(3),
  
  CONSTRAINT "orders_pkey" PRIMARY KEY ("id")
);


CREATE TABLE "order_items" (
  "id" TEXT NOT NULL,
  "orderId" TEXT NOT NULL,
  
 
  "productId" TEXT NOT NULL,
  "productName" TEXT NOT NULL,
  "productSku" TEXT,
  "variantId" TEXT,
  "variantName" TEXT,
  

  "quantity" INTEGER NOT NULL,
  "unitPrice" INTEGER NOT NULL,
  "totalPrice" INTEGER NOT NULL,
  "taxRate" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "taxAmount" INTEGER NOT NULL DEFAULT 0,
  "discountAmount" INTEGER NOT NULL DEFAULT 0,
  
 
  "productImage" TEXT,
  "productDetails" JSONB,
  

  "metadata" JSONB,
  
 
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  
  CONSTRAINT "order_items_pkey" PRIMARY KEY ("id")
);


CREATE TABLE "payments" (
  "id" TEXT NOT NULL,
  "orderId" TEXT NOT NULL,
  

  "amount" INTEGER NOT NULL,
  "currency" TEXT NOT NULL DEFAULT 'GBP',
  
 
  "status" "PaymentStatus" NOT NULL DEFAULT 'PENDING',
  
  
  "method" "PaymentMethod" NOT NULL,
  "provider" "PaymentProvider" NOT NULL,
  
 
  "providerTransactionId" TEXT,
  "providerPaymentIntentId" TEXT,
  "providerCustomerId" TEXT,
  
 
  "cardLast4" TEXT,
  "cardBrand" TEXT,
  "cardExpiryMonth" INTEGER,
  "cardExpiryYear" INTEGER,
  

  "authorizedAt" TIMESTAMP(3),
  "capturedAt" TIMESTAMP(3),
  "failedAt" TIMESTAMP(3),
  "refundedAt" TIMESTAMP(3),
  

  "failureReason" TEXT,
  "failureCode" TEXT,
  
 
  "refundedAmount" INTEGER DEFAULT 0,
  
 
  "riskScore" DOUBLE PRECISION,
  "riskLevel" TEXT,
  "fraudDetected" BOOLEAN DEFAULT false,
  

  "metadata" JSONB,
  
  
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  "deletedAt" TIMESTAMP(3),
  
  CONSTRAINT "payments_pkey" PRIMARY KEY ("id")
);


CREATE TABLE "payment_transactions" (
  "id" TEXT NOT NULL,
  "paymentId" TEXT NOT NULL,
  

  "type" "TransactionType" NOT NULL,
  "amount" INTEGER NOT NULL,
  "currency" TEXT NOT NULL DEFAULT 'GBP',
  "status" "TransactionStatus" NOT NULL,
  
  
  "providerTransactionId" TEXT,
  "providerResponse" JSONB,
  
  
  "errorCode" TEXT,
  "errorMessage" TEXT,
  
  
  "metadata" JSONB,
  
 
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  
  CONSTRAINT "payment_transactions_pkey" PRIMARY KEY ("id")
);


CREATE TABLE "invoices" (
  "id" TEXT NOT NULL,
  "invoiceNumber" TEXT NOT NULL,
  "orderId" TEXT NOT NULL,
  "customerId" TEXT NOT NULL,
  
 
  "status" "InvoiceStatus" NOT NULL DEFAULT 'DRAFT',
  

  "subtotal" INTEGER NOT NULL,
  "taxAmount" INTEGER NOT NULL DEFAULT 0,
  "total" INTEGER NOT NULL,
  "paidAmount" INTEGER NOT NULL DEFAULT 0,
  "currency" TEXT NOT NULL DEFAULT 'GBP',
  
 
  "issuedAt" TIMESTAMP(3),
  "dueDate" TIMESTAMP(3),
  "paidAt" TIMESTAMP(3),
  

  "pdfUrl" TEXT,
  "pdfGeneratedAt" TIMESTAMP(3),
  
 
  "notes" TEXT,
  "termsAndConditions" TEXT,
  
  
  "metadata" JSONB,
  
 
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  "deletedAt" TIMESTAMP(3),
  
  CONSTRAINT "invoices_pkey" PRIMARY KEY ("id")
);


CREATE TABLE "refunds" (
  "id" TEXT NOT NULL,
  "orderId" TEXT NOT NULL,
  "paymentId" TEXT NOT NULL,
  

  "amount" INTEGER NOT NULL,
  "currency" TEXT NOT NULL DEFAULT 'GBP',
  
  
  "reason" "RefundReason" NOT NULL,
  "reasonDescription" TEXT,
  
 
  "status" "RefundStatus" NOT NULL DEFAULT 'PENDING',
  

  "providerRefundId" TEXT,
  
 
  "requestedBy" TEXT,
  "approvedBy" TEXT,
  "approvedAt" TIMESTAMP(3),
  "processedAt" TIMESTAMP(3),
  "completedAt" TIMESTAMP(3),
  "failedAt" TIMESTAMP(3),
  

  "failureReason" TEXT,
  
  
  "metadata" JSONB,
  
 
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  
  CONSTRAINT "refunds_pkey" PRIMARY KEY ("id")
);


CREATE TABLE "coupons" (
  "id" TEXT NOT NULL,
  "code" TEXT NOT NULL,
  
  
  "discountType" "DiscountType" NOT NULL,
  "discountValue" DOUBLE PRECISION NOT NULL,
  

  "minOrderValue" INTEGER,
  "maxDiscountAmount" INTEGER,
  

  "maxUsageCount" INTEGER,
  "usageCount" INTEGER NOT NULL DEFAULT 0,
  "maxUsagePerCustomer" INTEGER DEFAULT 1,
  
 
  "validFrom" TIMESTAMP(3) NOT NULL,
  "validUntil" TIMESTAMP(3),
  
  
  "applicableCategories" TEXT[],
  "applicableProducts" TEXT[],
  "excludedCategories" TEXT[],
  "excludedProducts" TEXT[],
  
 
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  

  "description" TEXT,
  

  "metadata" JSONB,
  
  
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  "deletedAt" TIMESTAMP(3),
  
  CONSTRAINT "coupons_pkey" PRIMARY KEY ("id")
);


CREATE TABLE "coupon_usage" (
  "id" TEXT NOT NULL,
  "couponId" TEXT NOT NULL,
  "couponCode" TEXT NOT NULL,
  "orderId" TEXT NOT NULL,
  "customerId" TEXT NOT NULL,
  

  "discountAmount" INTEGER NOT NULL,
  

  "metadata" JSONB,
  
 
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  
  CONSTRAINT "coupon_usage_pkey" PRIMARY KEY ("id")
);


CREATE TABLE "shipping_methods" (
  "id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "description" TEXT,
  
  
  "baseCost" INTEGER NOT NULL,
  "currency" TEXT NOT NULL DEFAULT 'GBP',
  
 
  "estimatedMinDays" INTEGER NOT NULL,
  "estimatedMaxDays" INTEGER NOT NULL,
  
  
  "carrier" TEXT,
  "carrierServiceCode" TEXT,
  
  
  "minOrderValue" INTEGER,
  "maxOrderValue" INTEGER,
  "weightLimit" INTEGER,
  

  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "availableCountries" TEXT[],
  

  "metadata" JSONB,
  
 
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  "deletedAt" TIMESTAMP(3),
  
  CONSTRAINT "shipping_methods_pkey" PRIMARY KEY ("id")
);


CREATE TABLE "tax_rates" (
  "id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "rate" DOUBLE PRECISION NOT NULL,
  "region" TEXT NOT NULL,
  "country" TEXT NOT NULL,
  
  
  "isDefault" BOOLEAN NOT NULL DEFAULT false,
  "isCompound" BOOLEAN NOT NULL DEFAULT false,
  
 
  "applicableCategories" TEXT[],
  
 
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  
 
  "metadata" JSONB,
  

  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  "deletedAt" TIMESTAMP(3),
  
  CONSTRAINT "tax_rates_pkey" PRIMARY KEY ("id")
);


CREATE TABLE "order_status_history" (
  "id" TEXT NOT NULL,
  "orderId" TEXT NOT NULL,
  "fromStatus" "OrderStatus",
  "toStatus" "OrderStatus" NOT NULL,
  "changedBy" TEXT,
  "notes" TEXT,
  "metadata" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  
  CONSTRAINT "order_status_history_pkey" PRIMARY KEY ("id")
);


CREATE UNIQUE INDEX "orders_orderNumber_key" ON "orders"("orderNumber");
CREATE INDEX "orders_customerId_idx" ON "orders"("customerId");
CREATE INDEX "orders_status_idx" ON "orders"("status");
CREATE INDEX "orders_couponCode_idx" ON "orders"("couponCode");
CREATE INDEX "orders_createdAt_idx" ON "orders"("createdAt" DESC);
CREATE INDEX "orders_customerEmail_idx" ON "orders"("customerEmail");
CREATE INDEX "orders_deletedAt_idx" ON "orders"("deletedAt");


CREATE INDEX "order_items_orderId_idx" ON "order_items"("orderId");
CREATE INDEX "order_items_productId_idx" ON "order_items"("productId");
CREATE INDEX "order_items_productSku_idx" ON "order_items"("productSku");


CREATE INDEX "payments_orderId_idx" ON "payments"("orderId");
CREATE INDEX "payments_status_idx" ON "payments"("status");
CREATE INDEX "payments_method_idx" ON "payments"("method");
CREATE INDEX "payments_provider_idx" ON "payments"("provider");
CREATE INDEX "payments_providerTransactionId_idx" ON "payments"("providerTransactionId");
CREATE INDEX "payments_createdAt_idx" ON "payments"("createdAt" DESC);
CREATE INDEX "payments_deletedAt_idx" ON "payments"("deletedAt");


CREATE INDEX "payment_transactions_paymentId_idx" ON "payment_transactions"("paymentId");
CREATE INDEX "payment_transactions_type_idx" ON "payment_transactions"("type");
CREATE INDEX "payment_transactions_status_idx" ON "payment_transactions"("status");
CREATE INDEX "payment_transactions_createdAt_idx" ON "payment_transactions"("createdAt" DESC);


CREATE UNIQUE INDEX "invoices_invoiceNumber_key" ON "invoices"("invoiceNumber");
CREATE INDEX "invoices_orderId_idx" ON "invoices"("orderId");
CREATE INDEX "invoices_customerId_idx" ON "invoices"("customerId");
CREATE INDEX "invoices_status_idx" ON "invoices"("status");
CREATE INDEX "invoices_dueDate_idx" ON "invoices"("dueDate");
CREATE INDEX "invoices_createdAt_idx" ON "invoices"("createdAt" DESC);
CREATE INDEX "invoices_deletedAt_idx" ON "invoices"("deletedAt");


CREATE INDEX "refunds_orderId_idx" ON "refunds"("orderId");
CREATE INDEX "refunds_paymentId_idx" ON "refunds"("paymentId");
CREATE INDEX "refunds_status_idx" ON "refunds"("status");
CREATE INDEX "refunds_reason_idx" ON "refunds"("reason");
CREATE INDEX "refunds_createdAt_idx" ON "refunds"("createdAt" DESC);


CREATE UNIQUE INDEX "coupons_code_key" ON "coupons"("code");
CREATE INDEX "coupons_isActive_idx" ON "coupons"("isActive");
CREATE INDEX "coupons_validFrom_validUntil_idx" ON "coupons"("validFrom", "validUntil");
CREATE INDEX "coupons_deletedAt_idx" ON "coupons"("deletedAt");


CREATE INDEX "coupon_usage_couponId_idx" ON "coupon_usage"("couponId");
CREATE INDEX "coupon_usage_orderId_idx" ON "coupon_usage"("orderId");
CREATE INDEX "coupon_usage_customerId_idx" ON "coupon_usage"("customerId");
CREATE INDEX "coupon_usage_createdAt_idx" ON "coupon_usage"("createdAt" DESC);


CREATE INDEX "shipping_methods_isActive_idx" ON "shipping_methods"("isActive");
CREATE INDEX "shipping_methods_deletedAt_idx" ON "shipping_methods"("deletedAt");


CREATE INDEX "tax_rates_region_country_idx" ON "tax_rates"("region", "country");
CREATE INDEX "tax_rates_isDefault_idx" ON "tax_rates"("isDefault");
CREATE INDEX "tax_rates_isActive_idx" ON "tax_rates"("isActive");
CREATE INDEX "tax_rates_deletedAt_idx" ON "tax_rates"("deletedAt");


CREATE INDEX "order_status_history_orderId_idx" ON "order_status_history"("orderId");
CREATE INDEX "order_status_history_createdAt_idx" ON "order_status_history"("createdAt" DESC);


ALTER TABLE "order_items" ADD CONSTRAINT "order_items_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "payments" ADD CONSTRAINT "payments_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "payment_transactions" ADD CONSTRAINT "payment_transactions_paymentId_fkey" FOREIGN KEY ("paymentId") REFERENCES "payments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "invoices" ADD CONSTRAINT "invoices_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "refunds" ADD CONSTRAINT "refunds_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "refunds" ADD CONSTRAINT "refunds_paymentId_fkey" FOREIGN KEY ("paymentId") REFERENCES "payments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "coupon_usage" ADD CONSTRAINT "coupon_usage_couponId_fkey" FOREIGN KEY ("couponId") REFERENCES "coupons"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "coupon_usage" ADD CONSTRAINT "coupon_usage_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "order_status_history" ADD CONSTRAINT "order_status_history_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;


ALTER TABLE "orders" ADD CONSTRAINT "orders_subtotal_positive" CHECK ("subtotal" >= 0);
ALTER TABLE "orders" ADD CONSTRAINT "orders_total_positive" CHECK ("total" >= 0);

ALTER TABLE "order_items" ADD CONSTRAINT "order_items_quantity_positive" CHECK ("quantity" > 0);
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_unitPrice_positive" CHECK ("unitPrice" >= 0);

ALTER TABLE "payments" ADD CONSTRAINT "payments_amount_positive" CHECK ("amount" >= 0);

ALTER TABLE "invoices" ADD CONSTRAINT "invoices_total_positive" CHECK ("total" >= 0);

ALTER TABLE "refunds" ADD CONSTRAINT "refunds_amount_positive" CHECK ("amount" > 0);

ALTER TABLE "coupons" ADD CONSTRAINT "coupons_discountValue_positive" CHECK ("discountValue" >= 0);
ALTER TABLE "coupons" ADD CONSTRAINT "coupons_usageCount_nonnegative" CHECK ("usageCount" >= 0);

ALTER TABLE "tax_rates" ADD CONSTRAINT "tax_rates_rate_valid" CHECK ("rate" >= 0 AND "rate" <= 100);


COMMENT ON TABLE "orders" IS 'Main orders table storing kitchen and bedroom orders';
COMMENT ON TABLE "order_items" IS 'Line items for each order with product details';
COMMENT ON TABLE "payments" IS 'Payment records with Stripe/Razorpay integration';
COMMENT ON TABLE "payment_transactions" IS 'Detailed transaction log for all payment operations';
COMMENT ON TABLE "invoices" IS 'Generated invoices for orders';
COMMENT ON TABLE "refunds" IS 'Refund requests and processing';
COMMENT ON TABLE "coupons" IS 'Discount coupons (WELCOME10, KITCHEN50, etc.)';
COMMENT ON TABLE "coupon_usage" IS 'Tracking of coupon usage per order';
COMMENT ON TABLE "shipping_methods" IS 'Available shipping methods and rates';
COMMENT ON TABLE "tax_rates" IS 'Tax rates by region (UK VAT, etc.)';
COMMENT ON TABLE "order_status_history" IS 'Audit trail of order status changes';