import request from 'supertest';
import { app } from '../../src/app';
import { prisma } from '../../src/infrastructure/db/prisma.client';
import { stripeClient } from '../../src/infrastructure/payments/stripe.client';
import { OrderStatus, PaymentStatus } from '@prisma/client';
import { generateAuthToken } from '../helpers/auth.helper';

jest.mock('../../src/infrastructure/db/prisma.client', () => ({
  prisma: {
    order: { create: jest.fn(), findUnique: jest.fn(), update: jest.fn() },
    payment: { create: jest.fn(), update: jest.fn() },
    shippingRate: { findUnique: jest.fn() },
    coupon: { findFirst: jest.fn() },
    $transaction: jest.fn((cb: any) => cb(prisma)),
  },
}));

jest.mock('../../src/infrastructure/payments/stripe.client', () => ({
  stripeClient: {
    paymentIntents: { create: jest.fn() },
  },
}));

const BASE = '/v1/checkout';

describe('Checkout Routes — Integration', () => {
  let userToken: string;

  const mockShippingRate = {
    id: 'ship-rate-uuid-001',
    method: 'STANDARD',
    price: 995,
    freeThreshold: 50000,
    isActive: true,
    countries: ['GB'],
  };

  const mockPaymentIntent = {
    id: 'pi_test_abc123',
    client_secret: 'pi_test_abc123_secret_xyz',
    amount: 180995,
    currency: 'gbp',
    status: 'requires_payment_method',
  };

  const mockCreatedOrder = {
    id: 'order-uuid-001',
    userId: 'user-uuid-001',
    status: OrderStatus.PENDING,
    paymentStatus: PaymentStatus.UNPAID,
    subtotal: 150000,
    taxAmount: 30000,
    shippingAmount: 995,
    discountAmount: 0,
    totalAmount: 180995,
    currency: 'GBP',
    items: [],
  };

  beforeAll(() => {
    userToken = generateAuthToken({ id: 'user-uuid-001', role: 'CUSTOMER' });
  });

  beforeEach(() => jest.clearAllMocks());

  // ─── POST /v1/checkout/summary ────────────────────────────────────────────

  describe('POST /v1/checkout/summary', () => {
    const summaryPayload = {
      items: [{ productId: 'product-uuid-001', quantity: 2, unitPrice: 75000 }],
      shippingRateId: 'ship-rate-uuid-001',
      country: 'GB',
    };

    it('should return 200 with a full price breakdown', async () => {
      (prisma.shippingRate.findUnique as jest.Mock).mockResolvedValue(mockShippingRate);

      const res = await request(app)
        .post(`${BASE}/summary`)
        .set('Authorization', `Bearer ${userToken}`)
        .send(summaryPayload);

      expect(res.status).toBe(200);
      expect(res.body.data).toMatchObject({
        subtotal: expect.any(Number),
        taxAmount: expect.any(Number),
        shippingAmount: expect.any(Number),
        totalAmount: expect.any(Number),
      });
    });

    it('should apply coupon discount when couponCode is provided', async () => {
      (prisma.shippingRate.findUnique as jest.Mock).mockResolvedValue(mockShippingRate);
      (prisma.coupon.findFirst as jest.Mock).mockResolvedValue({
        id: 'coupon-uuid-001',
        code: 'LOMASH20',
        type: 'PERCENTAGE',
        value: 20,
        minOrderAmount: 50000,
        maxDiscountAmount: 30000,
        usageLimit: 100,
        usageCount: 1,
        expiresAt: new Date(Date.now() + 86400000),
        status: 'ACTIVE',
      });

      const res = await request(app)
        .post(`${BASE}/summary`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({ ...summaryPayload, couponCode: 'LOMASH20' });

      expect(res.status).toBe(200);
      expect(res.body.data.discountAmount).toBeGreaterThan(0);
    });

    it('should return 0 shipping cost when order exceeds freeThreshold', async () => {
      (prisma.shippingRate.findUnique as jest.Mock).mockResolvedValue(mockShippingRate);

      const res = await request(app)
        .post(`${BASE}/summary`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          ...summaryPayload,
          items: [{ productId: 'p-001', quantity: 1, unitPrice: 60000 }],
        });

      expect(res.status).toBe(200);
      expect(res.body.data.shippingAmount).toBe(0);
    });

    it('should return 400 when items array is empty', async () => {
      const res = await request(app)
        .post(`${BASE}/summary`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({ ...summaryPayload, items: [] });

      expect(res.status).toBe(400);
    });

    it('should return 401 when unauthenticated', async () => {
      const res = await request(app).post(`${BASE}/summary`).send(summaryPayload);

      expect(res.status).toBe(401);
    });
  });

  // ─── POST /v1/checkout/initiate ───────────────────────────────────────────

  describe('POST /v1/checkout/initiate', () => {
    const initiatePayload = {
      items: [{ productId: 'product-uuid-001', quantity: 1, unitPrice: 150000 }],
      shippingAddress: {
        line1: '123 High Street',
        city: 'London',
        postcode: 'SW1A 1AA',
        country: 'GB',
      },
      shippingRateId: 'ship-rate-uuid-001',
    };

    it('should return 201 with orderId and Stripe clientSecret', async () => {
      (prisma.$transaction as jest.Mock).mockResolvedValue({
        order: mockCreatedOrder,
        payment: { id: 'pay-uuid-001' },
      });
      (stripeClient.paymentIntents.create as jest.Mock).mockResolvedValue(mockPaymentIntent);

      const res = await request(app)
        .post(`${BASE}/initiate`)
        .set('Authorization', `Bearer ${userToken}`)
        .send(initiatePayload);

      expect(res.status).toBe(201);
      expect(res.body.data).toMatchObject({
        orderId: expect.any(String),
        clientSecret: expect.any(String),
        paymentIntentId: expect.any(String),
      });
    });

    it('should return 400 when shippingAddress is missing required fields', async () => {
      const res = await request(app)
        .post(`${BASE}/initiate`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          ...initiatePayload,
          shippingAddress: { line1: '123 High Street' }, // missing city, postcode, country
        });

      expect(res.status).toBe(400);
    });

    it('should return 422 when Stripe returns an error', async () => {
      (prisma.$transaction as jest.Mock).mockResolvedValue({
        order: mockCreatedOrder,
        payment: { id: 'pay-uuid-001' },
      });
      (stripeClient.paymentIntents.create as jest.Mock).mockRejectedValue(
        new Error('Your card was declined.'),
      );

      const res = await request(app)
        .post(`${BASE}/initiate`)
        .set('Authorization', `Bearer ${userToken}`)
        .send(initiatePayload);

      expect(res.status).toBe(422);
    });

    it('should return 401 when unauthenticated', async () => {
      const res = await request(app).post(`${BASE}/initiate`).send(initiatePayload);

      expect(res.status).toBe(401);
    });
  });

  // ─── POST /v1/checkout/confirm ────────────────────────────────────────────

  describe('POST /v1/checkout/confirm', () => {
    it('should return 200 and mark the order as confirmed on success', async () => {
      (prisma.order.findUnique as jest.Mock).mockResolvedValue(mockCreatedOrder);
      (prisma.order.update as jest.Mock).mockResolvedValue({
        ...mockCreatedOrder,
        status: OrderStatus.CONFIRMED,
        paymentStatus: PaymentStatus.PAID,
      });

      const res = await request(app)
        .post(`${BASE}/confirm`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({ orderId: 'order-uuid-001', paymentIntentId: 'pi_test_abc123' });

      expect(res.status).toBe(200);
      expect(res.body.data.status).toBe(OrderStatus.CONFIRMED);
    });

    it('should return 400 when orderId is missing', async () => {
      const res = await request(app)
        .post(`${BASE}/confirm`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({ paymentIntentId: 'pi_test_abc123' });

      expect(res.status).toBe(400);
    });

    it('should return 404 when orderId does not exist', async () => {
      (prisma.order.findUnique as jest.Mock).mockResolvedValue(null);

      const res = await request(app)
        .post(`${BASE}/confirm`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({ orderId: 'ghost-order', paymentIntentId: 'pi_test_abc123' });

      expect(res.status).toBe(404);
    });
  });

  // ─── POST /v1/checkout/apply-coupon ───────────────────────────────────────

  describe('POST /v1/checkout/apply-coupon', () => {
    it('should return 200 with discount details for a valid coupon', async () => {
      (prisma.coupon.findFirst as jest.Mock).mockResolvedValue({
        id: 'coupon-uuid-001',
        code: 'LOMASH20',
        type: 'PERCENTAGE',
        value: 20,
        minOrderAmount: 50000,
        maxDiscountAmount: 30000,
        usageLimit: 100,
        usageCount: 1,
        expiresAt: new Date(Date.now() + 86400000),
        status: 'ACTIVE',
      });

      const res = await request(app)
        .post(`${BASE}/apply-coupon`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({ code: 'LOMASH20', orderAmount: 100000 });

      expect(res.status).toBe(200);
      expect(res.body.data.discountAmount).toBe(20000);
    });

    it('should return 400 when coupon code is missing', async () => {
      const res = await request(app)
        .post(`${BASE}/apply-coupon`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({ orderAmount: 100000 });

      expect(res.status).toBe(400);
    });

    it('should return 404 when coupon code is not found', async () => {
      (prisma.coupon.findFirst as jest.Mock).mockResolvedValue(null);

      const res = await request(app)
        .post(`${BASE}/apply-coupon`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({ code: 'INVALID', orderAmount: 100000 });

      expect(res.status).toBe(404);
    });

    it('should return 422 when order amount is below coupon minimum', async () => {
      (prisma.coupon.findFirst as jest.Mock).mockResolvedValue({
        id: 'coupon-uuid-001',
        code: 'LOMASH20',
        type: 'PERCENTAGE',
        value: 20,
        minOrderAmount: 50000,
        maxDiscountAmount: 30000,
        usageLimit: 100,
        usageCount: 1,
        expiresAt: new Date(Date.now() + 86400000),
        status: 'ACTIVE',
      });

      const res = await request(app)
        .post(`${BASE}/apply-coupon`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({ code: 'LOMASH20', orderAmount: 20000 });

      expect(res.status).toBe(422);
    });
  });
});