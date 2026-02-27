import { PrismaClient } from '@prisma/client';
import { randomUUID } from 'crypto';

const prisma = new PrismaClient();

interface SeedStats {
  orders: number;
  orderItems: number;
  payments: number;
  invoices: number;
  refunds: number;
  coupons: number;
}

const CUSTOMER_IDS = [
  'cust_01HQMK3ZX8Y2N5P4Q6R7S8T9U0',
  'cust_01HQMK3ZX8Y2N5P4Q6R7S8T9U1',
  'cust_01HQMK3ZX8Y2N5P4Q6R7S8T9U2',
  'cust_01HQMK3ZX8Y2N5P4Q6R7S8T9U3',
  'cust_01HQMK3ZX8Y2N5P4Q6R7S8T9U4',
];

const PRODUCT_IDS = [
  'prod_kitchen_luna_white_01',
  'prod_kitchen_jpull_grey_01',
  'prod_bedroom_classic_oak_01',
  'prod_bedroom_modern_white_01',
  'prod_kitchen_shaker_cream_01',
  'prod_bedroom_contemporary_walnut_01',
  'prod_kitchen_handleless_graphite_01',
  'prod_bedroom_traditional_cherry_01',
];

const ORDER_STATUSES = [
  'PENDING',
  'CONFIRMED',
  'PROCESSING',
  'SHIPPED',
  'DELIVERED',
  'CANCELLED',
  'REFUNDED',
] as const;

const PAYMENT_STATUSES = [
  'PENDING',
  'AUTHORIZED',
  'CAPTURED',
  'FAILED',
  'REFUNDED',
  'PARTIALLY_REFUNDED',
] as const;

const PAYMENT_METHODS = [
  'CARD',
  'BANK_TRANSFER',
  'PAYPAL',
  'STRIPE',
  'RAZORPAY',
] as const;

const INVOICE_STATUSES = ['DRAFT', 'ISSUED', 'PAID', 'CANCELLED'] as const;

const REFUND_REASONS = [
  'CUSTOMER_REQUEST',
  'DEFECTIVE_PRODUCT',
  'WRONG_ITEM_SHIPPED',
  'DAMAGED_IN_TRANSIT',
  'ORDER_CANCELLATION',
  'DUPLICATE_ORDER',
] as const;

const TAX_RATES = [
  { name: 'VAT Standard', rate: 20.0, region: 'UK' },
  { name: 'VAT Reduced', rate: 5.0, region: 'UK' },
  { name: 'VAT Zero', rate: 0.0, region: 'UK' },
];

const SHIPPING_METHODS = [
  {
    name: 'Standard Delivery',
    cost: 4999, 
    estimatedDays: 7,
  },
  {
    name: 'Express Delivery',
    cost: 9999,
    estimatedDays: 3,
  },
  {
    name: 'Next Day Delivery',
    cost: 14999, 
    estimatedDays: 1,
  },
  {
    name: 'Free Standard Delivery',
    cost: 0,
    estimatedDays: 10,
  },
];

const COUPON_CODES = [
  {
    code: 'WELCOME10',
    discountType: 'PERCENTAGE',
    discountValue: 10.0,
    minOrderValue: 50000, // £500
    maxUsageCount: 1000,
    validFrom: new Date('2024-01-01'),
    validUntil: new Date('2026-12-31'),
  },
  {
    code: 'KITCHEN50',
    discountType: 'FIXED_AMOUNT',
    discountValue: 5000, // £50
    minOrderValue: 100000, // £1000
    maxUsageCount: 500,
    validFrom: new Date('2024-01-01'),
    validUntil: new Date('2026-06-30'),
  },
  {
    code: 'BEDROOM20',
    discountType: 'PERCENTAGE',
    discountValue: 20.0,
    minOrderValue: 75000, // £750
    maxUsageCount: 300,
    validFrom: new Date('2024-06-01'),
    validUntil: new Date('2026-12-31'),
  },
  {
    code: 'FREESHIP',
    discountType: 'FREE_SHIPPING',
    discountValue: 0,
    minOrderValue: 25000, // £250
    maxUsageCount: 2000,
    validFrom: new Date('2024-01-01'),
    validUntil: new Date('2026-12-31'),
  },
];

function getRandomElement<T>(array: T[]): T {
  return array[Math.floor(Math.random() * array.length)];
}

function getRandomDate(start: Date, end: Date): Date {
  return new Date(
    start.getTime() + Math.random() * (end.getTime() - start.getTime())
  );
}

function generateOrderNumber(): string {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `ORD-${timestamp}-${random}`;
}

function generateInvoiceNumber(): string {
  const year = new Date().getFullYear();
  const random = Math.floor(Math.random() * 100000)
    .toString()
    .padStart(5, '0');
  return `INV-${year}-${random}`;
}

function calculateOrderTotals(items: Array<{ quantity: number; unitPrice: number }>) {
  const subtotal = items.reduce(
    (sum, item) => sum + item.quantity * item.unitPrice,
    0
  );
  const taxRate = getRandomElement(TAX_RATES);
  const taxAmount = Math.round((subtotal * taxRate.rate) / 100);
  const shippingCost = getRandomElement(SHIPPING_METHODS).cost;
  const total = subtotal + taxAmount + shippingCost;

  return {
    subtotal,
    taxAmount,
    shippingCost,
    total,
    taxRate: taxRate.rate,
  };
}

async function createCoupons(): Promise<void> {
  console.log('🎫 Creating coupons...');

  for (const coupon of COUPON_CODES) {
    await prisma.coupon.upsert({
      where: { code: coupon.code },
      update: {},
      create: {
        ...coupon,
        isActive: true,
        usageCount: Math.floor(Math.random() * 50),
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date(),
      },
    });
  }

  console.log(`✅ Created ${COUPON_CODES.length} coupons`);
}

async function createOrders(count: number): Promise<SeedStats> {
  console.log(`📦 Creating ${count} orders with items, payments, and invoices...`);

  const stats: SeedStats = {
    orders: 0,
    orderItems: 0,
    payments: 0,
    invoices: 0,
    refunds: 0,
    coupons: COUPON_CODES.length,
  };

  const startDate = new Date('2024-01-01');
  const endDate = new Date();

  for (let i = 0; i < count; i++) {
    const customerId = getRandomElement(CUSTOMER_IDS);
    const orderDate = getRandomDate(startDate, endDate);
    const orderStatus = getRandomElement(ORDER_STATUSES);
    const orderNumber = generateOrderNumber();

    const itemCount = Math.floor(Math.random() * 4) + 1;
    const orderItems = [];

    for (let j = 0; j < itemCount; j++) {
      const productId = getRandomElement(PRODUCT_IDS);
      const quantity = Math.floor(Math.random() * 3) + 1;
      const unitPrice = Math.floor(Math.random() * 200000) + 50000; // £500 - £2500

      orderItems.push({
        productId,
        productName: `Product ${productId}`,
        quantity,
        unitPrice,
        totalPrice: quantity * unitPrice,
        taxRate: getRandomElement(TAX_RATES).rate,
        metadata: {
          category: productId.includes('kitchen') ? 'Kitchen' : 'Bedroom',
          variant: 'Standard',
        },
      });
    }

    const totals = calculateOrderTotals(orderItems);

    
    const applyCoupon = Math.random() < 0.3;
    let couponId: string | null = null;
    let discountAmount = 0;

    if (applyCoupon) {
      const coupon = getRandomElement(COUPON_CODES);
      if (totals.subtotal >= coupon.minOrderValue) {
        couponId = coupon.code;
        if (coupon.discountType === 'PERCENTAGE') {
          discountAmount = Math.round((totals.subtotal * coupon.discountValue) / 100);
        } else if (coupon.discountType === 'FIXED_AMOUNT') {
          discountAmount = coupon.discountValue;
        } else if (coupon.discountType === 'FREE_SHIPPING') {
          discountAmount = totals.shippingCost;
        }
      }
    }

    const finalTotal = totals.total - discountAmount;


    const order = await prisma.order.create({
      data: {
        orderNumber,
        customerId,
        status: orderStatus,
        subtotal: totals.subtotal,
        taxAmount: totals.taxAmount,
        shippingCost: totals.shippingCost,
        discountAmount,
        total: finalTotal,
        currency: 'GBP',
        couponCode: couponId,
        shippingAddress: {
          fullName: `Customer ${customerId.slice(-4)}`,
          addressLine1: `${Math.floor(Math.random() * 999) + 1} High Street`,
          addressLine2: null,
          city: getRandomElement(['London', 'Manchester', 'Birmingham', 'Leeds', 'Glasgow']),
          county: getRandomElement(['Greater London', 'Lancashire', 'West Midlands', 'Yorkshire', 'Lanarkshire']),
          postcode: `SW${Math.floor(Math.random() * 20) + 1} ${Math.floor(Math.random() * 9)}${String.fromCharCode(65 + Math.floor(Math.random() * 26))}${String.fromCharCode(65 + Math.floor(Math.random() * 26))}`,
          country: 'United Kingdom',
          phone: `+44${Math.floor(Math.random() * 9000000000) + 1000000000}`,
        },
        billingAddress: {
          fullName: `Customer ${customerId.slice(-4)}`,
          addressLine1: `${Math.floor(Math.random() * 999) + 1} High Street`,
          addressLine2: null,
          city: getRandomElement(['London', 'Manchester', 'Birmingham', 'Leeds', 'Glasgow']),
          county: getRandomElement(['Greater London', 'Lancashire', 'West Midlands', 'Yorkshire', 'Lanarkshire']),
          postcode: `SW${Math.floor(Math.random() * 20) + 1} ${Math.floor(Math.random() * 9)}${String.fromCharCode(65 + Math.floor(Math.random() * 26))}${String.fromCharCode(65 + Math.floor(Math.random() * 26))}`,
          country: 'United Kingdom',
          phone: `+44${Math.floor(Math.random() * 9000000000) + 1000000000}`,
        },
        notes: Math.random() < 0.3 ? 'Please handle with care' : null,
        metadata: {
          source: 'web',
          referrer: 'organic',
          userAgent: 'Mozilla/5.0',
        },
        createdAt: orderDate,
        updatedAt: orderDate,
      },
    });

    stats.orders++;


    for (const item of orderItems) {
      await prisma.orderItem.create({
        data: {
          orderId: order.id,
          ...item,
        },
      });
      stats.orderItems++;
    }

    if (orderStatus !== 'CANCELLED') {
      const paymentMethod = getRandomElement(PAYMENT_METHODS);
      const paymentStatus =
        orderStatus === 'REFUNDED'
          ? 'REFUNDED'
          : orderStatus === 'DELIVERED'
          ? 'CAPTURED'
          : getRandomElement(['CAPTURED', 'AUTHORIZED', 'PENDING']);

      const payment = await prisma.payment.create({
        data: {
          orderId: order.id,
          amount: finalTotal,
          currency: 'GBP',
          status: paymentStatus,
          method: paymentMethod,
          provider: paymentMethod === 'STRIPE' ? 'STRIPE' : 'RAZORPAY',
          providerTransactionId: `${paymentMethod.toLowerCase()}_${randomUUID().replace(/-/g, '')}`,
          metadata: {
            cardLast4: paymentMethod === 'CARD' ? Math.floor(Math.random() * 10000).toString().padStart(4, '0') : null,
            cardBrand: paymentMethod === 'CARD' ? getRandomElement(['VISA', 'MASTERCARD', 'AMEX']) : null,
          },
          createdAt: orderDate,
          updatedAt: orderDate,
        },
      });

      stats.payments++;

      if (paymentStatus === 'CAPTURED' || paymentStatus === 'AUTHORIZED') {
        const invoiceDate = new Date(orderDate.getTime() + 86400000); 

        await prisma.invoice.create({
          data: {
            invoiceNumber: generateInvoiceNumber(),
            orderId: order.id,
            customerId,
            status: paymentStatus === 'CAPTURED' ? 'PAID' : 'ISSUED',
            subtotal: totals.subtotal,
            taxAmount: totals.taxAmount,
            total: finalTotal,
            currency: 'GBP',
            dueDate: new Date(invoiceDate.getTime() + 30 * 86400000), 
            paidAt: paymentStatus === 'CAPTURED' ? invoiceDate : null,
            metadata: {
              taxRate: totals.taxRate,
              itemCount: orderItems.length,
            },
            createdAt: invoiceDate,
            updatedAt: invoiceDate,
          },
        });

        stats.invoices++;
      }

      if (orderStatus === 'REFUNDED') {
        const isPartialRefund = Math.random() < 0.2;
        const refundAmount = isPartialRefund
          ? Math.floor(finalTotal * (0.3 + Math.random() * 0.4))
          : finalTotal;

        const refundDate = new Date(
          orderDate.getTime() + Math.floor(Math.random() * 30) * 86400000
        );

        await prisma.refund.create({
          data: {
            orderId: order.id,
            paymentId: payment.id,
            amount: refundAmount,
            currency: 'GBP',
            reason: getRandomElement(REFUND_REASONS),
            status: 'COMPLETED',
            providerRefundId: `refund_${randomUUID().replace(/-/g, '')}`,
            processedAt: refundDate,
            metadata: {
              isPartial: isPartialRefund,
              originalAmount: finalTotal,
            },
            createdAt: refundDate,
            updatedAt: refundDate,
          },
        });

        stats.refunds++;
      }
    }

    // Progress indicator
    if ((i + 1) % 10 === 0) {
      console.log(`  ⏳ Created ${i + 1}/${count} orders...`);
    }
  }

  return stats;
}

async function createTransactionLogs(): Promise<void> {
  console.log('📋 Creating payment transaction logs...');

  const payments = await prisma.payment.findMany({
    include: { order: true },
  });

  let logCount = 0;

  for (const payment of payments) {
   
    await prisma.paymentTransaction.create({
      data: {
        paymentId: payment.id,
        type: 'AUTHORIZATION',
        amount: payment.amount,
        currency: payment.currency,
        status: 'SUCCESS',
        providerResponse: {
          authCode: `AUTH${Math.floor(Math.random() * 1000000)}`,
          avsCheck: 'PASS',
          cvvCheck: 'PASS',
        },
        createdAt: payment.createdAt,
      },
    });
    logCount++;

   
    if (payment.status === 'CAPTURED' || payment.status === 'REFUNDED') {
      await prisma.paymentTransaction.create({
        data: {
          paymentId: payment.id,
          type: 'CAPTURE',
          amount: payment.amount,
          currency: payment.currency,
          status: 'SUCCESS',
          providerResponse: {
            captureId: `CAP${Math.floor(Math.random() * 1000000)}`,
            settledAt: new Date(payment.createdAt.getTime() + 86400000),
          },
          createdAt: new Date(payment.createdAt.getTime() + 3600000), // +1 hour
        },
      });
      logCount++;
    }
  }

  console.log(`✅ Created ${logCount} payment transaction logs`);
}

async function main(): Promise<void> {
  console.log('🌱 Starting seed process for Order-Payment Service...\n');

  try {
   
    console.log('🧹 Cleaning existing data...');
    await prisma.paymentTransaction.deleteMany({});
    await prisma.refund.deleteMany({});
    await prisma.invoice.deleteMany({});
    await prisma.payment.deleteMany({});
    await prisma.orderItem.deleteMany({});
    await prisma.order.deleteMany({});
    await prisma.coupon.deleteMany({});
    console.log('✅ Cleaned existing data\n');

    await createCoupons();
    console.log('');

    const stats = await createOrders(50);
    console.log('');

    
    await createTransactionLogs();
    console.log('');

 
    console.log('📊 Seed Summary:');
    console.log('  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`  Orders:              ${stats.orders}`);
    console.log(`  Order Items:         ${stats.orderItems}`);
    console.log(`  Payments:            ${stats.payments}`);
    console.log(`  Invoices:            ${stats.invoices}`);
    console.log(`  Refunds:             ${stats.refunds}`);
    console.log(`  Coupons:             ${stats.coupons}`);
    console.log('  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    console.log('\n✅ Seed completed successfully!');
  } catch (error) {
    console.error('\n❌ Error during seed:', error);
    throw error;
  }
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });