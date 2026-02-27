import request from 'supertest';
import { Express } from 'express';
import { PrismaClient } from '@prisma/client';
import { app } from '../../src/app';
import { prisma } from '../../src/infrastructure/db/prisma.client';
import { redis } from '../../src/infrastructure/cache/redis.client';
import Stripe from 'stripe';

describe('Payment Flow E2E Tests', () => {
  let testApp: Express;
  let authToken: string;
  let testUserId: string;
  let testOrderId: string;
  let testPaymentIntentId: string;
  let testPaymentId: string;
  let testRefundId: string;
  let stripeClient: Stripe;

  beforeAll(async () => {
    testApp = app;
    await prisma.$connect();
    await redis.connect();

    stripeClient = new Stripe(process.env.STRIPE_SECRET_KEY!, {
      apiVersion: '2023-10-16',
    });

    const registerResponse = await request(testApp)
      .post('/api/v1/auth/register')
      .send({
        email: 'payment.test@example.com',
        password: 'SecurePass123!',
        firstName: 'Robert',
        lastName: 'Smith',
        phone: '+447700900200',
      });

    testUserId = registerResponse.body.data.user.id;

    const loginResponse = await request(testApp)
      .post('/api/v1/auth/login')
      .send({
        email: 'payment.test@example.com',
        password: 'SecurePass123!',
      });

    authToken = loginResponse.body.data.accessToken;

    const category = await prisma.category.create({
      data: {
        name: 'Premium Kitchens',
        slug: 'premium-kitchens',
        description: 'High-end kitchen designs',
        type: 'KITCHEN',
        isActive: true,
        sortOrder: 1,
      },
    });

    const product = await prisma.product.create({
      data: {
        title: 'Luxury Oak Kitchen',
        slug: 'luxury-oak-kitchen',
        description: 'Premium oak kitchen with island',
        categoryId: category.id,
        rangeName: 'Prestige Collection',
        basePrice: 15000.00,
        images: JSON.stringify(['https://example.com/luxury-oak-1.jpg']),
        isActive: true,
        stockStatus: 'IN_STOCK',
        sku: 'LUX-OAK-001',
      },
    });

    const address = await prisma.address.create({
      data: {
        userId: testUserId,
        type: 'SHIPPING',
        firstName: 'Robert',
        lastName: 'Smith',
        addressLine1: '25 Oxford Street',
        city: 'London',
        postcode: 'W1D 2DW',
        country: 'United Kingdom',
        phone: '+447700900200',
        isDefault: true,
      },
    });

    await request(testApp)
      .post('/api/v1/cart/items')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        productId: product.id,
        quantity: 1,
      });

    const orderResponse = await request(testApp)
      .post('/api/v1/orders')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        shippingAddressId: address.id,
        billingAddressId: address.id,
        paymentMethod: 'card',
      });

    testOrderId = orderResponse.body.data.order.id;
  });

  afterAll(async () => {
    await prisma.payment.deleteMany({
      where: { order: { userId: testUserId } },
    });

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

    await prisma.product.deleteMany({
      where: { rangeName: 'Prestige Collection' },
    });

    await prisma.category.deleteMany({
      where: { slug: 'premium-kitchens' },
    });

    await prisma.user.delete({
      where: { id: testUserId },
    });

    await prisma.$disconnect();
    await redis.disconnect();
  });

  describe('Payment Intent Creation', () => {
    it('should create Stripe payment intent for order', async () => {
      const response = await request(testApp)
        .post('/api/v1/payments/create-intent')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          orderId: testOrderId,
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.paymentIntent).toMatchObject({
        id: expect.stringContaining('pi_'),
        clientSecret: expect.stringContaining('pi_'),
        amount: expect.any(Number),
        currency: 'gbp',
        status: 'requires_payment_method',
      });

      testPaymentIntentId = response.body.data.paymentIntent.id;
    });

    it('should store payment intent in database', async () => {
      const payment = await prisma.payment.findFirst({
        where: {
          orderId: testOrderId,
          stripePaymentIntentId: testPaymentIntentId,
        },
      });

      expect(payment).toBeTruthy();
      expect(payment?.status).toBe('PENDING');
      expect(payment?.amount).toBeGreaterThan(0);

      testPaymentId = payment!.id;
    });

    it('should validate order exists before creating payment intent', async () => {
      const response = await request(testApp)
        .post('/api/v1/payments/create-intent')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          orderId: '00000000-0000-0000-0000-000000000000',
        })
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('ORDER_NOT_FOUND');
    });

    it('should not create payment intent for already paid order', async () => {
      await prisma.order.update({
        where: { id: testOrderId },
        data: { paymentStatus: 'PAID' },
      });

      const response = await request(testApp)
        .post('/api/v1/payments/create-intent')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          orderId: testOrderId,
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('ORDER_ALREADY_PAID');

      await prisma.order.update({
        where: { id: testOrderId },
        data: { paymentStatus: 'PENDING' },
      });
    });

    it('should calculate correct payment amount including tax', async () => {
      const order = await prisma.order.findUnique({
        where: { id: testOrderId },
        include: { items: true },
      });

      const response = await request(testApp)
        .post('/api/v1/payments/create-intent')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          orderId: testOrderId,
        })
        .expect(200);

      const paymentAmount = response.body.data.paymentIntent.amount / 100;
      const orderTotal = order!.totalAmount;

      expect(paymentAmount).toBeCloseTo(orderTotal, 2);
    });

    it('should handle idempotent payment intent creation', async () => {
      const idempotencyKey = `test-payment-${Date.now()}`;

      const response1 = await request(testApp)
        .post('/api/v1/payments/create-intent')
        .set('Authorization', `Bearer ${authToken}`)
        .set('Idempotency-Key', idempotencyKey)
        .send({
          orderId: testOrderId,
        })
        .expect(200);

      const response2 = await request(testApp)
        .post('/api/v1/payments/create-intent')
        .set('Authorization', `Bearer ${authToken}`)
        .set('Idempotency-Key', idempotencyKey)
        .send({
          orderId: testOrderId,
        })
        .expect(200);

      expect(response1.body.data.paymentIntent.id).toBe(
        response2.body.data.paymentIntent.id
      );
    });

    it('should support multiple payment methods', async () => {
      const response = await request(testApp)
        .post('/api/v1/payments/create-intent')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          orderId: testOrderId,
          paymentMethod: 'card',
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.paymentIntent.payment_method_types).toContain('card');
    });
  });

  describe('Payment Confirmation', () => {
    it('should confirm payment with valid payment intent', async () => {
      const response = await request(testApp)
        .post('/api/v1/payments/confirm')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          paymentIntentId: testPaymentIntentId,
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.payment).toMatchObject({
        id: testPaymentId,
        status: 'PROCESSING',
        stripePaymentIntentId: testPaymentIntentId,
      });
    });

    it('should reject invalid payment intent', async () => {
      const response = await request(testApp)
        .post('/api/v1/payments/confirm')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          paymentIntentId: 'pi_invalid_intent',
        })
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('PAYMENT_INTENT_NOT_FOUND');
    });

    it('should not allow confirming already succeeded payment', async () => {
      await prisma.payment.update({
        where: { id: testPaymentId },
        data: { status: 'SUCCEEDED' },
      });

      const response = await request(testApp)
        .post('/api/v1/payments/confirm')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          paymentIntentId: testPaymentIntentId,
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('PAYMENT_ALREADY_SUCCEEDED');

      await prisma.payment.update({
        where: { id: testPaymentId },
        data: { status: 'PENDING' },
      });
    });
  });

  describe('Payment Retrieval', () => {
    it('should retrieve payment by ID', async () => {
      const response = await request(testApp)
        .get(`/api/v1/payments/${testPaymentId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.payment).toMatchObject({
        id: testPaymentId,
        orderId: testOrderId,
        stripePaymentIntentId: testPaymentIntentId,
        amount: expect.any(Number),
        currency: 'GBP',
      });
    });

    it('should retrieve payments for order', async () => {
      const response = await request(testApp)
        .get(`/api/v1/orders/${testOrderId}/payments`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.payments).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            id: testPaymentId,
            orderId: testOrderId,
          }),
        ])
      );
    });

    it('should retrieve user payment history', async () => {
      const response = await request(testApp)
        .get('/api/v1/payments/my-payments')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.payments).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            id: testPaymentId,
          }),
        ])
      );
    });

    it('should filter payments by status', async () => {
      const response = await request(testApp)
        .get('/api/v1/payments/my-payments')
        .set('Authorization', `Bearer ${authToken}`)
        .query({ status: 'PENDING' })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(
        response.body.data.payments.every((p: any) => p.status === 'PENDING')
      ).toBe(true);
    });

    it('should not allow accessing other users payments', async () => {
      const otherUser = await prisma.user.create({
        data: {
          email: 'other.payment.user@example.com',
          password: 'SecurePass123!',
          firstName: 'Other',
          lastName: 'User',
        },
      });

      const loginResp = await request(testApp)
        .post('/api/v1/auth/login')
        .send({
          email: 'other.payment.user@example.com',
          password: 'SecurePass123!',
        });

      const otherUserToken = loginResp.body.data.accessToken;

      const response = await request(testApp)
        .get(`/api/v1/payments/${testPaymentId}`)
        .set('Authorization', `Bearer ${otherUserToken}`)
        .expect(403);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('FORBIDDEN');

      await prisma.user.delete({
        where: { id: otherUser.id },
      });
    });
  });

  describe('Stripe Webhook Events', () => {
    it('should handle payment_intent.succeeded webhook', async () => {
      const webhookPayload = {
        id: 'evt_test_succeeded',
        type: 'payment_intent.succeeded',
        data: {
          object: {
            id: testPaymentIntentId,
            amount: 1500000,
            currency: 'gbp',
            status: 'succeeded',
            metadata: {
              orderId: testOrderId,
              userId: testUserId,
            },
          },
        },
      };

      const response = await request(testApp)
        .post('/api/v1/webhooks/stripe')
        .set('stripe-signature', process.env.STRIPE_WEBHOOK_SECRET || 'test_signature')
        .send(webhookPayload)
        .expect(200);

      expect(response.body.success).toBe(true);

      const payment = await prisma.payment.findUnique({
        where: { id: testPaymentId },
      });

      expect(payment?.status).toBe('SUCCEEDED');

      const order = await prisma.order.findUnique({
        where: { id: testOrderId },
      });

      expect(order?.paymentStatus).toBe('PAID');
    });

    it('should handle payment_intent.payment_failed webhook', async () => {
      await prisma.payment.update({
        where: { id: testPaymentId },
        data: { status: 'PENDING' },
      });

      const webhookPayload = {
        id: 'evt_test_failed',
        type: 'payment_intent.payment_failed',
        data: {
          object: {
            id: testPaymentIntentId,
            amount: 1500000,
            currency: 'gbp',
            status: 'failed',
            last_payment_error: {
              code: 'card_declined',
              message: 'Your card was declined',
            },
            metadata: {
              orderId: testOrderId,
              userId: testUserId,
            },
          },
        },
      };

      const response = await request(testApp)
        .post('/api/v1/webhooks/stripe')
        .set('stripe-signature', process.env.STRIPE_WEBHOOK_SECRET || 'test_signature')
        .send(webhookPayload)
        .expect(200);

      expect(response.body.success).toBe(true);

      const payment = await prisma.payment.findUnique({
        where: { id: testPaymentId },
      });

      expect(payment?.status).toBe('FAILED');
      expect(payment?.failureReason).toContain('card_declined');
    });

    it('should handle payment_intent.requires_action webhook', async () => {
      const webhookPayload = {
        id: 'evt_test_requires_action',
        type: 'payment_intent.requires_action',
        data: {
          object: {
            id: testPaymentIntentId,
            amount: 1500000,
            currency: 'gbp',
            status: 'requires_action',
            next_action: {
              type: 'use_stripe_sdk',
            },
            metadata: {
              orderId: testOrderId,
              userId: testUserId,
            },
          },
        },
      };

      const response = await request(testApp)
        .post('/api/v1/webhooks/stripe')
        .set('stripe-signature', process.env.STRIPE_WEBHOOK_SECRET || 'test_signature')
        .send(webhookPayload)
        .expect(200);

      expect(response.body.success).toBe(true);

      const payment = await prisma.payment.findUnique({
        where: { id: testPaymentId },
      });

      expect(payment?.status).toBe('REQUIRES_ACTION');
    });

    it('should handle charge.refunded webhook', async () => {
      await prisma.payment.update({
        where: { id: testPaymentId },
        data: { status: 'SUCCEEDED' },
      });

      const webhookPayload = {
        id: 'evt_test_refunded',
        type: 'charge.refunded',
        data: {
          object: {
            id: 'ch_test_charge',
            payment_intent: testPaymentIntentId,
            amount_refunded: 1500000,
            amount: 1500000,
            refunded: true,
            metadata: {
              orderId: testOrderId,
            },
          },
        },
      };

      const response = await request(testApp)
        .post('/api/v1/webhooks/stripe')
        .set('stripe-signature', process.env.STRIPE_WEBHOOK_SECRET || 'test_signature')
        .send(webhookPayload)
        .expect(200);

      expect(response.body.success).toBe(true);

      const payment = await prisma.payment.findUnique({
        where: { id: testPaymentId },
      });

      expect(payment?.status).toBe('REFUNDED');
    });

    it('should reject webhook with invalid signature', async () => {
      const webhookPayload = {
        id: 'evt_test_invalid',
        type: 'payment_intent.succeeded',
        data: {
          object: {
            id: testPaymentIntentId,
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

    it('should handle duplicate webhook events idempotently', async () => {
      const webhookPayload = {
        id: 'evt_test_duplicate',
        type: 'payment_intent.succeeded',
        data: {
          object: {
            id: testPaymentIntentId,
            amount: 1500000,
            currency: 'gbp',
            status: 'succeeded',
            metadata: {
              orderId: testOrderId,
              userId: testUserId,
            },
          },
        },
      };

      const response1 = await request(testApp)
        .post('/api/v1/webhooks/stripe')
        .set('stripe-signature', process.env.STRIPE_WEBHOOK_SECRET || 'test_signature')
        .send(webhookPayload)
        .expect(200);

      const response2 = await request(testApp)
        .post('/api/v1/webhooks/stripe')
        .set('stripe-signature', process.env.STRIPE_WEBHOOK_SECRET || 'test_signature')
        .send(webhookPayload)
        .expect(200);

      expect(response1.body.success).toBe(true);
      expect(response2.body.success).toBe(true);

      const webhookEvents = await prisma.webhookEvent.findMany({
        where: { eventId: 'evt_test_duplicate' },
      });

      expect(webhookEvents).toHaveLength(1);
    });
  });

  describe('Payment Refunds', () => {
    beforeAll(async () => {
      await prisma.payment.update({
        where: { id: testPaymentId },
        data: { status: 'SUCCEEDED' },
      });

      await prisma.order.update({
        where: { id: testOrderId },
        data: { paymentStatus: 'PAID' },
      });
    });

    it('should create full refund for succeeded payment', async () => {
      const response = await request(testApp)
        .post('/api/v1/payments/refunds')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          paymentId: testPaymentId,
          reason: 'Customer requested refund',
        })
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.refund).toMatchObject({
        id: expect.any(String),
        paymentId: testPaymentId,
        amount: expect.any(Number),
        status: 'PENDING',
        reason: 'Customer requested refund',
      });

      testRefundId = response.body.data.refund.id;
    });

    it('should create partial refund', async () => {
      const payment = await prisma.payment.findUnique({
        where: { id: testPaymentId },
      });

      const partialAmount = payment!.amount / 2;

      const response = await request(testApp)
        .post('/api/v1/payments/refunds')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          paymentId: testPaymentId,
          amount: partialAmount,
          reason: 'Partial refund for damaged item',
        })
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.refund.amount).toBe(partialAmount);
    });

    it('should not allow refund exceeding payment amount', async () => {
      const payment = await prisma.payment.findUnique({
        where: { id: testPaymentId },
      });

      const excessiveAmount = payment!.amount * 2;

      const response = await request(testApp)
        .post('/api/v1/payments/refunds')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          paymentId: testPaymentId,
          amount: excessiveAmount,
          reason: 'Test excessive refund',
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('REFUND_AMOUNT_EXCEEDS_PAYMENT');
    });

    it('should not allow refund for failed payment', async () => {
      await prisma.payment.update({
        where: { id: testPaymentId },
        data: { status: 'FAILED' },
      });

      const response = await request(testApp)
        .post('/api/v1/payments/refunds')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          paymentId: testPaymentId,
          reason: 'Test refund for failed payment',
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('PAYMENT_NOT_REFUNDABLE');

      await prisma.payment.update({
        where: { id: testPaymentId },
        data: { status: 'SUCCEEDED' },
      });
    });

    it('should retrieve refund details', async () => {
      const response = await request(testApp)
        .get(`/api/v1/payments/refunds/${testRefundId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.refund).toMatchObject({
        id: testRefundId,
        paymentId: testPaymentId,
        status: expect.any(String),
        amount: expect.any(Number),
      });
    });

    it('should retrieve all refunds for payment', async () => {
      const response = await request(testApp)
        .get(`/api/v1/payments/${testPaymentId}/refunds`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data.refunds)).toBe(true);
      expect(response.body.data.refunds.length).toBeGreaterThan(0);
    });

    it('should cancel pending refund', async () => {
      const response = await request(testApp)
        .patch(`/api/v1/payments/refunds/${testRefundId}/cancel`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          cancellationReason: 'Customer changed mind',
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.refund.status).toBe('CANCELLED');
    });
  });

  describe('Payment Methods Management', () => {
    it('should retrieve saved payment methods', async () => {
      const response = await request(testApp)
        .get('/api/v1/payments/payment-methods')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data.paymentMethods)).toBe(true);
    });

    it('should add new payment method', async () => {
      const response = await request(testApp)
        .post('/api/v1/payments/payment-methods')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          type: 'card',
          cardToken: 'tok_visa',
          isDefault: false,
        })
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.paymentMethod).toMatchObject({
        id: expect.any(String),
        type: 'card',
        last4: expect.any(String),
        brand: expect.any(String),
      });
    });

    it('should set default payment method', async () => {
      const paymentMethods = await request(testApp)
        .get('/api/v1/payments/payment-methods')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      const methodId = paymentMethods.body.data.paymentMethods[0].id;

      const response = await request(testApp)
        .patch(`/api/v1/payments/payment-methods/${methodId}/set-default`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.paymentMethod.isDefault).toBe(true);
    });

    it('should delete payment method', async () => {
      const addResponse = await request(testApp)
        .post('/api/v1/payments/payment-methods')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          type: 'card',
          cardToken: 'tok_mastercard',
          isDefault: false,
        })
        .expect(201);

      const methodId = addResponse.body.data.paymentMethod.id;

      const response = await request(testApp)
        .delete(`/api/v1/payments/payment-methods/${methodId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
    });
  });

  describe('Payment Analytics', () => {
    it('should retrieve payment statistics', async () => {
      const response = await request(testApp)
        .get('/api/v1/payments/statistics')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.statistics).toMatchObject({
        totalPayments: expect.any(Number),
        successfulPayments: expect.any(Number),
        failedPayments: expect.any(Number),
        totalAmount: expect.any(Number),
        averagePaymentAmount: expect.any(Number),
      });
    });

    it('should retrieve payment trends', async () => {
      const response = await request(testApp)
        .get('/api/v1/payments/trends')
        .set('Authorization', `Bearer ${authToken}`)
        .query({
          period: 'month',
          startDate: '2026-01-01',
          endDate: '2026-12-31',
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data.trends)).toBe(true);
    });
  });

  describe('Payment Security', () => {
    it('should enforce 3D Secure for eligible transactions', async () => {
      const response = await request(testApp)
        .post('/api/v1/payments/create-intent')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          orderId: testOrderId,
          enforce3DSecure: true,
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.paymentIntent.confirmation_method).toBe('automatic');
    });

    it('should log suspicious payment attempts', async () => {
      const suspiciousAttempts = 5;

      for (let i = 0; i < suspiciousAttempts; i++) {
        await request(testApp)
          .post('/api/v1/payments/create-intent')
          .set('Authorization', `Bearer ${authToken}`)
          .send({
            orderId: testOrderId,
          })
          .expect(200);
      }

      const logs = await prisma.paymentLog.findMany({
        where: {
          userId: testUserId,
          action: 'CREATE_INTENT',
        },
      });

      expect(logs.length).toBeGreaterThanOrEqual(suspiciousAttempts);
    });

    it('should rate limit payment intent creation', async () => {
      const requests = 15;
      const responses = [];

      for (let i = 0; i < requests; i++) {
        const response = await request(testApp)
          .post('/api/v1/payments/create-intent')
          .set('Authorization', `Bearer ${authToken}`)
          .send({
            orderId: testOrderId,
          });

        responses.push(response);
      }

      const rateLimitedResponses = responses.filter(r => r.status === 429);
      expect(rateLimitedResponses.length).toBeGreaterThan(0);
    });
  });

  describe('Payment Notifications', () => {
    it('should send notification on successful payment', async () => {
      const notification = await prisma.notification.findFirst({
        where: {
          userId: testUserId,
          type: 'PAYMENT_SUCCEEDED',
          referenceId: testPaymentId,
        },
      });

      expect(notification).toBeTruthy();
      expect(notification?.status).toBe('SENT');
    });

    it('should send notification on failed payment', async () => {
      await prisma.payment.update({
        where: { id: testPaymentId },
        data: { status: 'FAILED' },
      });

      await request(testApp)
        .post('/api/v1/webhooks/stripe')
        .set('stripe-signature', process.env.STRIPE_WEBHOOK_SECRET || 'test_signature')
        .send({
          id: 'evt_test_notification',
          type: 'payment_intent.payment_failed',
          data: {
            object: {
              id: testPaymentIntentId,
              status: 'failed',
              metadata: { orderId: testOrderId, userId: testUserId },
            },
          },
        });

      const notification = await prisma.notification.findFirst({
        where: {
          userId: testUserId,
          type: 'PAYMENT_FAILED',
        },
      });

      expect(notification).toBeTruthy();
    });

    it('should send notification on refund', async () => {
      const notification = await prisma.notification.findFirst({
        where: {
          userId: testUserId,
          type: 'REFUND_PROCESSED',
          referenceId: testRefundId,
        },
      });

      expect(notification).toBeTruthy();
    });
  });

  describe('Payment Reconciliation', () => {
    it('should reconcile Stripe payments with database', async () => {
      const response = await request(testApp)
        .post('/api/v1/admin/payments/reconcile')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          startDate: '2026-01-01',
          endDate: '2026-12-31',
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.reconciliation).toMatchObject({
        total: expect.any(Number),
        matched: expect.any(Number),
        discrepancies: expect.any(Number),
      });
    });

    it('should identify payment discrepancies', async () => {
      const response = await request(testApp)
        .get('/api/v1/admin/payments/discrepancies')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data.discrepancies)).toBe(true);
    });
  });
});