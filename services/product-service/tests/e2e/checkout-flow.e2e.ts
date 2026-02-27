import request from 'supertest';
import { Express } from 'express';
import { PrismaClient } from '@prisma/client';
import { app } from '../../src/app';
import { prisma } from '../../src/infrastructure/db/prisma.client';
import { redis } from '../../src/infrastructure/cache/redis.client';
import Stripe from 'stripe';

describe('Checkout Flow E2E Tests', () => {
  let testApp: Express;
  let authToken: string;
  let testUserId: string;
  let testProductId: string;
  let testCategoryId: string;
  let testColourId: string;
  let testCartId: string;
  let testOrderId: string;
  let testAddressId: string;
  let stripePaymentIntentId: string;

  beforeAll(async () => {
    testApp = app;
    await prisma.$connect();
    await redis.connect();

    const registerResponse = await request(testApp)
      .post('/api/v1/auth/register')
      .send({
        email: 'checkout.test@example.com',
        password: 'SecurePass123!',
        firstName: 'Alice',
        lastName: 'Johnson',
        phone: '+447700900100',
      });

    testUserId = registerResponse.body.data.user.id;

    const loginResponse = await request(testApp)
      .post('/api/v1/auth/login')
      .send({
        email: 'checkout.test@example.com',
        password: 'SecurePass123!',
      });

    authToken = loginResponse.body.data.accessToken;

    
    const category = await prisma.category.create({
      data: {
        name: 'Modern Kitchens',
        slug: 'modern-kitchens',
        description: 'Contemporary kitchen designs',
        type: 'KITCHEN',
        isActive: true,
        sortOrder: 1,
      },
    });

    testCategoryId = category.id;

    
    const colour = await prisma.colour.create({
      data: {
        name: 'Glossy White',
        slug: 'glossy-white',
        hexCode: '#FFFFFF',
        isActive: true,
      },
    });

    testColourId = colour.id;

    
    const product = await prisma.product.create({
      data: {
        title: 'Luna White Kitchen',
        slug: 'luna-white-kitchen',
        description: 'Modern white kitchen with handleless design',
        categoryId: testCategoryId,
        rangeName: 'Luna Collection',
        basePrice: 8500.00,
        images: JSON.stringify([
          'https://example.com/luna-kitchen-1.jpg',
          'https://example.com/luna-kitchen-2.jpg',
        ]),
        isActive: true,
        isFeatured: true,
        stockStatus: 'IN_STOCK',
        sku: 'LUN-WHT-001',
        colours: {
          connect: [{ id: testColourId }],
        },
      },
    });

    testProductId = product.id;

    
    const address = await prisma.address.create({
      data: {
        userId: testUserId,
        type: 'SHIPPING',
        firstName: 'Alice',
        lastName: 'Johnson',
        addressLine1: '15 Baker Street',
        addressLine2: 'Flat 2B',
        city: 'London',
        county: 'Greater London',
        postcode: 'NW1 6XE',
        country: 'United Kingdom',
        phone: '+447700900100',
        isDefault: true,
      },
    });

    testAddressId = address.id;
  });

  afterAll(async () => {
    // Cleanup test data
    await prisma.orderItem.deleteMany({
      where: { order: { userId: testUserId } },
    });

    await prisma.order.deleteMany({
      where: { userId: testUserId },
    });

    await prisma.cartItem.deleteMany({
      where: { cart: { userId: testUserId } },
    });

    await prisma.cart.deleteMany({
      where: { userId: testUserId },
    });

    await prisma.address.deleteMany({
      where: { userId: testUserId },
    });

    await prisma.product.delete({
      where: { id: testProductId },
    });

    await prisma.colour.delete({
      where: { id: testColourId },
    });

    await prisma.category.delete({
      where: { id: testCategoryId },
    });

    await prisma.user.delete({
      where: { id: testUserId },
    });

    await prisma.$disconnect();
    await redis.disconnect();
  });

  describe('Step 1: Cart Management', () => {
    it('should create a cart and add product to cart', async () => {
      const response = await request(testApp)
        .post('/api/v1/cart/items')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          productId: testProductId,
          quantity: 1,
          colourId: testColourId,
          customizations: {
            finish: 'High Gloss',
            handles: 'Handleless',
          },
        })
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.cartItem).toMatchObject({
        productId: testProductId,
        quantity: 1,
        colourId: testColourId,
      });

      testCartId = response.body.data.cartItem.cartId;
    });

    it('should retrieve current cart with items', async () => {
      const response = await request(testApp)
        .get('/api/v1/cart')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.cart).toMatchObject({
        id: testCartId,
        userId: testUserId,
        items: expect.arrayContaining([
          expect.objectContaining({
            productId: testProductId,
            quantity: 1,
            product: expect.objectContaining({
              title: 'Luna White Kitchen',
              basePrice: 8500.00,
            }),
          }),
        ]),
      });

      expect(response.body.data.cart.totalAmount).toBeGreaterThan(0);
    });

    it('should update cart item quantity', async () => {
      const response = await request(testApp)
        .patch(`/api/v1/cart/items/${testProductId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          quantity: 2,
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.cartItem.quantity).toBe(2);
    });

    it('should calculate cart totals correctly', async () => {
      const response = await request(testApp)
        .get('/api/v1/cart')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      
      const expectedSubtotal = 8500.00 * 2; 
      expect(response.body.data.cart.subtotal).toBe(expectedSubtotal);
      expect(response.body.data.cart.totalAmount).toBeGreaterThanOrEqual(expectedSubtotal);
    });

    it('should remove item from cart', async () => {
    
      await request(testApp)
        .patch(`/api/v1/cart/items/${testProductId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ quantity: 1 })
        .expect(200);

      const response = await request(testApp)
        .get('/api/v1/cart')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.data.cart.items).toHaveLength(1);
    });

    it('should not allow adding out of stock products', async () => {
    
      const outOfStockProduct = await prisma.product.create({
        data: {
          title: 'Out of Stock Kitchen',
          slug: 'out-of-stock-kitchen',
          description: 'Test product',
          categoryId: testCategoryId,
          basePrice: 5000.00,
          stockStatus: 'OUT_OF_STOCK',
          isActive: true,
        },
      });

      const response = await request(testApp)
        .post('/api/v1/cart/items')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          productId: outOfStockProduct.id,
          quantity: 1,
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('PRODUCT_OUT_OF_STOCK');

    
      await prisma.product.delete({
        where: { id: outOfStockProduct.id },
      });
    });
  });

  describe('Step 2: Address Validation and Selection', () => {
    it('should retrieve user addresses', async () => {
      const response = await request(testApp)
        .get('/api/v1/addresses')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.addresses).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            id: testAddressId,
            addressLine1: '15 Baker Street',
            city: 'London',
            postcode: 'NW1 6XE',
            isDefault: true,
          }),
        ])
      );
    });

    it('should add new shipping address', async () => {
      const response = await request(testApp)
        .post('/api/v1/addresses')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          type: 'SHIPPING',
          firstName: 'Alice',
          lastName: 'Johnson',
          addressLine1: '10 Downing Street',
          city: 'London',
          county: 'Westminster',
          postcode: 'SW1A 2AA',
          country: 'United Kingdom',
          phone: '+447700900100',
          isDefault: false,
        })
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.address).toMatchObject({
        addressLine1: '10 Downing Street',
        postcode: 'SW1A 2AA',
        type: 'SHIPPING',
      });

    
      await prisma.address.delete({
        where: { id: response.body.data.address.id },
      });
    });

    it('should validate UK postcode format', async () => {
      const response = await request(testApp)
        .post('/api/v1/addresses/validate')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          postcode: 'INVALID',
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('INVALID_POSTCODE');
    });

    it('should validate complete address', async () => {
      const response = await request(testApp)
        .post('/api/v1/addresses/validate')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          addressLine1: '15 Baker Street',
          city: 'London',
          postcode: 'NW1 6XE',
          country: 'United Kingdom',
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.valid).toBe(true);
    });

    it('should update default address', async () => {
      const newAddress = await prisma.address.create({
        data: {
          userId: testUserId,
          type: 'SHIPPING',
          firstName: 'Alice',
          lastName: 'Johnson',
          addressLine1: '221B Baker Street',
          city: 'London',
          postcode: 'NW1 6XE',
          country: 'United Kingdom',
          phone: '+447700900100',
          isDefault: false,
        },
      });

      const response = await request(testApp)
        .patch(`/api/v1/addresses/${newAddress.id}/set-default`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.address.isDefault).toBe(true);

    
      const oldDefault = await prisma.address.findUnique({
        where: { id: testAddressId },
      });

      expect(oldDefault?.isDefault).toBe(false);

    
      await prisma.address.delete({
        where: { id: newAddress.id },
      });

    
      await prisma.address.update({
        where: { id: testAddressId },
        data: { isDefault: true },
      });
    });
  });

  describe('Step 3: Apply Coupon/Discount', () => {
    let testCouponId: string;

    beforeAll(async () => {
    
      const coupon = await prisma.coupon.create({
        data: {
          code: 'SUMMER2026',
          description: 'Summer Sale 2026',
          discountType: 'PERCENTAGE',
          discountValue: 10.00,
          minimumOrderAmount: 5000.00,
          maximumDiscountAmount: 1000.00,
          validFrom: new Date(),
          validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          usageLimit: 100,
          usageCount: 0,
          isActive: true,
        },
      });

      testCouponId = coupon.id;
    });

    afterAll(async () => {
      await prisma.coupon.delete({
        where: { id: testCouponId },
      });
    });

    it('should validate and apply valid coupon code', async () => {
      const response = await request(testApp)
        .post('/api/v1/cart/apply-coupon')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          couponCode: 'SUMMER2026',
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.cart.appliedCoupon).toMatchObject({
        code: 'SUMMER2026',
        discountType: 'PERCENTAGE',
        discountValue: 10.00,
      });
      expect(response.body.data.cart.discountAmount).toBeGreaterThan(0);
    });

    it('should reject invalid coupon code', async () => {
      const response = await request(testApp)
        .post('/api/v1/cart/apply-coupon')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          couponCode: 'INVALID123',
        })
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('COUPON_NOT_FOUND');
    });

    it('should reject expired coupon', async () => {
    
      const expiredCoupon = await prisma.coupon.create({
        data: {
          code: 'EXPIRED2025',
          description: 'Expired Coupon',
          discountType: 'PERCENTAGE',
          discountValue: 15.00,
          validFrom: new Date('2025-01-01'),
          validUntil: new Date('2025-12-31'),
          isActive: true,
        },
      });

      const response = await request(testApp)
        .post('/api/v1/cart/apply-coupon')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          couponCode: 'EXPIRED2025',
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('COUPON_EXPIRED');

    
      await prisma.coupon.delete({
        where: { id: expiredCoupon.id },
      });
    });

    it('should enforce minimum order amount for coupon', async () => {
      // Create coupon with high minimum
      const highMinCoupon = await prisma.coupon.create({
        data: {
          code: 'LUXURY50K',
          description: 'Luxury Kitchen Discount',
          discountType: 'PERCENTAGE',
          discountValue: 5.00,
          minimumOrderAmount: 50000.00,
          validFrom: new Date(),
          validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          isActive: true,
        },
      });

      const response = await request(testApp)
        .post('/api/v1/cart/apply-coupon')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          couponCode: 'LUXURY50K',
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('MINIMUM_ORDER_NOT_MET');

    
      await prisma.coupon.delete({
        where: { id: highMinCoupon.id },
      });
    });

    it('should remove applied coupon', async () => {
      const response = await request(testApp)
        .delete('/api/v1/cart/remove-coupon')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.cart.appliedCoupon).toBeNull();
      expect(response.body.data.cart.discountAmount).toBe(0);
    });
  });

  describe('Step 4: Order Summary and Validation', () => {
    it('should generate order summary', async () => {
      const response = await request(testApp)
        .post('/api/v1/checkout/summary')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          shippingAddressId: testAddressId,
          billingAddressId: testAddressId,
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.summary).toMatchObject({
        subtotal: expect.any(Number),
        shippingCost: expect.any(Number),
        taxAmount: expect.any(Number),
        discountAmount: expect.any(Number),
        totalAmount: expect.any(Number),
        items: expect.arrayContaining([
          expect.objectContaining({
            productId: testProductId,
            quantity: 1,
            unitPrice: 8500.00,
          }),
        ]),
      });
    });

    it('should calculate VAT correctly (20% for UK)', async () => {
      const response = await request(testApp)
        .post('/api/v1/checkout/summary')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          shippingAddressId: testAddressId,
          billingAddressId: testAddressId,
        })
        .expect(200);

      const subtotal = response.body.data.summary.subtotal;
      const taxAmount = response.body.data.summary.taxAmount;

   
      const expectedTax = Math.round(subtotal * 0.20 * 100) / 100;
      expect(taxAmount).toBeCloseTo(expectedTax, 2);
    });

    it('should validate cart is not empty before checkout', async () => {
    
      const emptyCartUser = await prisma.user.create({
        data: {
          email: 'empty.cart@example.com',
          password: 'SecurePass123!',
          firstName: 'Empty',
          lastName: 'Cart',
        },
      });

      const loginResp = await request(testApp)
        .post('/api/v1/auth/login')
        .send({
          email: 'empty.cart@example.com',
          password: 'SecurePass123!',
        });

      const emptyCartToken = loginResp.body.data.accessToken;

      const response = await request(testApp)
        .post('/api/v1/checkout/summary')
        .set('Authorization', `Bearer ${emptyCartToken}`)
        .send({
          shippingAddressId: testAddressId,
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('CART_EMPTY');

    
      await prisma.user.delete({
        where: { id: emptyCartUser.id },
      });
    });
  });

  describe('Step 5: Payment Processing (Stripe)', () => {
    it('should create Stripe payment intent', async () => {
      const response = await request(testApp)
        .post('/api/v1/payments/create-intent')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          shippingAddressId: testAddressId,
          billingAddressId: testAddressId,
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.paymentIntent).toMatchObject({
        clientSecret: expect.stringContaining('pi_'),
        amount: expect.any(Number),
        currency: 'gbp',
      });

      stripePaymentIntentId = response.body.data.paymentIntent.id;
    });

    it('should validate payment amount matches order total', async () => {
     
      const summaryResp = await request(testApp)
        .post('/api/v1/checkout/summary')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          shippingAddressId: testAddressId,
          billingAddressId: testAddressId,
        })
        .expect(200);

      const expectedAmount = summaryResp.body.data.summary.totalAmount;

      const paymentResp = await request(testApp)
        .post('/api/v1/payments/create-intent')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          shippingAddressId: testAddressId,
          billingAddressId: testAddressId,
        })
        .expect(200);

      const paymentAmount = paymentResp.body.data.paymentIntent.amount / 100; // Stripe uses cents

      expect(paymentAmount).toBeCloseTo(expectedAmount, 2);
    });

    it('should handle payment intent idempotency', async () => {
      const idempotencyKey = `test-${Date.now()}`;

      const response1 = await request(testApp)
        .post('/api/v1/payments/create-intent')
        .set('Authorization', `Bearer ${authToken}`)
        .set('Idempotency-Key', idempotencyKey)
        .send({
          shippingAddressId: testAddressId,
          billingAddressId: testAddressId,
        })
        .expect(200);

      const response2 = await request(testApp)
        .post('/api/v1/payments/create-intent')
        .set('Authorization', `Bearer ${authToken}`)
        .set('Idempotency-Key', idempotencyKey)
        .send({
          shippingAddressId: testAddressId,
          billingAddressId: testAddressId,
        })
        .expect(200);

      expect(response1.body.data.paymentIntent.id).toBe(
        response2.body.data.paymentIntent.id
      );
    });
  });

  describe('Step 6: Order Creation and Confirmation', () => {
    it('should create order after successful payment', async () => {
      const response = await request(testApp)
        .post('/api/v1/orders')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          shippingAddressId: testAddressId,
          billingAddressId: testAddressId,
          paymentIntentId: stripePaymentIntentId,
          paymentMethod: 'card',
          notes: 'Please deliver during business hours',
        })
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.order).toMatchObject({
        id: expect.any(String),
        orderNumber: expect.stringMatching(/^LW-\d{10}$/),
        userId: testUserId,
        status: 'PENDING',
        paymentStatus: 'PENDING',
        shippingAddressId: testAddressId,
        billingAddressId: testAddressId,
        items: expect.arrayContaining([
          expect.objectContaining({
            productId: testProductId,
            quantity: 1,
            unitPrice: 8500.00,
          }),
        ]),
      });

      testOrderId = response.body.data.order.id;
    });

    it('should clear cart after order creation', async () => {
      const response = await request(testApp)
        .get('/api/v1/cart')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.cart.items).toHaveLength(0);
    });

    it('should send order confirmation email', async () => {
      const order = await prisma.order.findUnique({
        where: { id: testOrderId },
        include: { user: true },
      });

      expect(order).toBeTruthy();

      const notification = await prisma.notification.findFirst({
        where: {
          userId: testUserId,
          type: 'ORDER_CONFIRMATION',
          referenceId: testOrderId,
        },
      });

      expect(notification).toBeTruthy();
      expect(notification?.status).toBe('SENT');
    });

    it('should generate unique order number', async () => {
      const order = await prisma.order.findUnique({
        where: { id: testOrderId },
      });

      expect(order?.orderNumber).toMatch(/^LW-\d{10}$/);
    });

    it('should not create order with invalid payment intent', async () => {
   
      await request(testApp)
        .post('/api/v1/cart/items')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          productId: testProductId,
          quantity: 1,
          colourId: testColourId,
        })
        .expect(201);

      const response = await request(testApp)
        .post('/api/v1/orders')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          shippingAddressId: testAddressId,
          billingAddressId: testAddressId,
          paymentIntentId: 'pi_invalid_intent',
          paymentMethod: 'card',
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('INVALID_PAYMENT_INTENT');
    });
  });

  describe('Step 7: Order Retrieval and Tracking', () => {
    it('should retrieve user orders', async () => {
      const response = await request(testApp)
        .get('/api/v1/orders/my-orders')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.orders).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            id: testOrderId,
            orderNumber: expect.any(String),
            status: expect.any(String),
            totalAmount: expect.any(Number),
          }),
        ])
      );
    });

    it('should retrieve specific order details', async () => {
      const response = await request(testApp)
        .get(`/api/v1/orders/${testOrderId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.order).toMatchObject({
        id: testOrderId,
        items: expect.arrayContaining([
          expect.objectContaining({
            product: expect.objectContaining({
              title: 'Luna White Kitchen',
            }),
          }),
        ]),
        shippingAddress: expect.objectContaining({
          addressLine1: '15 Baker Street',
          postcode: 'NW1 6XE',
        }),
      });
    });

    it('should not allow accessing other users orders', async () => {
    
      const otherUser = await prisma.user.create({
        data: {
          email: 'other.user@example.com',
          password: 'SecurePass123!',
          firstName: 'Other',
          lastName: 'User',
        },
      });

      const loginResp = await request(testApp)
        .post('/api/v1/auth/login')
        .send({
          email: 'other.user@example.com',
          password: 'SecurePass123!',
        });

      const otherUserToken = loginResp.body.data.accessToken;

      const response = await request(testApp)
        .get(`/api/v1/orders/${testOrderId}`)
        .set('Authorization', `Bearer ${otherUserToken}`)
        .expect(403);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('FORBIDDEN');

      await prisma.user.delete({
        where: { id: otherUser.id },
      });
    });

    it('should filter orders by status', async () => {
      const response = await request(testApp)
        .get('/api/v1/orders/my-orders')
        .set('Authorization', `Bearer ${authToken}`)
        .query({ status: 'PENDING' })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(
        response.body.data.orders.every((o: any) => o.status === 'PENDING')
      ).toBe(true);
    });

    it('should filter orders by date range', async () => {
      const today = new Date().toISOString().split('T')[0];
      const nextWeek = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
        .toISOString()
        .split('T')[0];

      const response = await request(testApp)
        .get('/api/v1/orders/my-orders')
        .set('Authorization', `Bearer ${authToken}`)
        .query({
          startDate: today,
          endDate: nextWeek,
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data.orders)).toBe(true);
    });
  });

  describe('Stripe Webhook Handling', () => {
    it('should handle successful payment webhook', async () => {
      const webhookPayload = {
        id: 'evt_test_webhook',
        type: 'payment_intent.succeeded',
        data: {
          object: {
            id: stripePaymentIntentId,
            amount: 850000,
            currency: 'gbp',
            status: 'succeeded',
          },
        },
      };

      const response = await request(testApp)
        .post('/api/v1/webhooks/stripe')
        .set('stripe-signature', 'test_signature')
        .send(webhookPayload)
        .expect(200);

      expect(response.body.success).toBe(true);

      const order = await prisma.order.findUnique({
        where: { id: testOrderId },
      });

      expect(order?.paymentStatus).toBe('PAID');
    });

    it('should handle failed payment webhook', async () => {
      const webhookPayload = {
        id: 'evt_test_webhook_fail',
        type: 'payment_intent.payment_failed',
        data: {
          object: {
            id: stripePaymentIntentId,
            amount: 850000,
            currency: 'gbp',
            status: 'failed',
          },
        },
      };

      const response = await request(testApp)
        .post('/api/v1/webhooks/stripe')
        .set('stripe-signature', 'test_signature')
        .send(webhookPayload)
        .expect(200);

      expect(response.body.success).toBe(true);

      // Verify order payment status updated
      const order = await prisma.order.findUnique({
        where: { id: testOrderId },
      });

      expect(order?.paymentStatus).toBe('FAILED');
    });

    it('should reject webhook with invalid signature', async () => {
      const webhookPayload = {
        id: 'evt_test_webhook',
        type: 'payment_intent.succeeded',
        data: {
          object: {
            id: stripePaymentIntentId,
          },
        },
      };

      const response = await request(testApp)
        .post('/api/v1/webhooks/stripe')
        .set('stripe-signature', 'invalid_signature')
        .send(webhookPayload)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('INVALID_WEBHOOK_SIGNATURE');
    });
  });

  describe('Order Cancellation', () => {
    it('should allow user to cancel pending order', async () => {
      const response = await request(testApp)
        .patch(`/api/v1/orders/${testOrderId}/cancel`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          cancellationReason: 'Changed my mind',
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.order.status).toBe('CANCELLED');
    });

    it('should not allow cancelling already shipped order', async () => {
      // Update order status to shipped
      await prisma.order.update({
        where: { id: testOrderId },
        data: { status: 'SHIPPED' },
      });

      const response = await request(testApp)
        .patch(`/api/v1/orders/${testOrderId}/cancel`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          cancellationReason: 'Test cancellation',
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('ORDER_CANNOT_BE_CANCELLED');
    });
  });

  describe('Invoice Generation', () => {
    it('should generate invoice for completed order', async () => {
      const response = await request(testApp)
        .get(`/api/v1/orders/${testOrderId}/invoice`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.invoice).toMatchObject({
        orderId: testOrderId,
        invoiceNumber: expect.stringMatching(/^INV-\d{10}$/),
        issueDate: expect.any(String),
        totalAmount: expect.any(Number),
      });
    });

    it('should allow downloading invoice as PDF', async () => {
      const response = await request(testApp)
        .get(`/api/v1/orders/${testOrderId}/invoice/download`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.headers['content-type']).toBe('application/pdf');
      expect(response.headers['content-disposition']).toContain('attachment');
    });
  });
});