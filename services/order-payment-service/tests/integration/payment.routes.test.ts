import request from 'supertest';
import { app } from '../../src/app';
import { prisma } from '../../src/infrastructure/db/prisma.client';
import { stripeClient } from '../../src/infrastructure/payments/stripe.client';
import { PaymentStatus, PaymentMethod } from '@prisma/client';
import { generateAuthToken } from '../helpers/auth.helper';

jest.mock('../../src/infrastructure/db/prisma.client', () => ({
  prisma: {
    payment: {
      create: jest.fn(),
      findUnique: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
      count: jest.fn(),
    },
    order: { findUnique: jest.fn(), update: jest.fn() },
    $transaction: jest.fn((cb: any) => cb(prisma)),
  },
}));

jest.mock('../../src/infrastructure/payments/stripe.client', () => ({
  stripeClient: {
    paymentIntents: { create: jest.fn(), retrieve: jest.fn() },
  },
}));

const BASE = '/v1/payments';

describe('Payment Routes — Integration', () => {
  let adminToken: string;
  let userToken: string;

  const mockPayment = {
    id: 'pay-uuid-001',
    orderId: 'order-uuid-001',
    stripePaymentIntentId: 'pi_test_abc123',
    amount: 180995,
    currency: 'GBP',
    status: PaymentStatus.SUCCEEDED,
    method: PaymentMethod.CARD,
    createdAt: new Date('2026-01-10T10:00:00Z'),
    updatedAt: new Date('2026-01-10T10:00:00Z'),
    order: { id: 'order-uuid-001', userId: 'user-uuid-001' },
  };

  const mockPaymentIntent = {
    id: 'pi_test_abc123',
    client_secret: 'pi_test_abc123_secret_xyz',
    amount: 180995,
    currency: 'gbp',
    status: 'requires_payment_method',
  };

  beforeAll(() => {
    userToken = generateAuthToken({ id: 'user-uuid-001', role: 'CUSTOMER' });
    adminToken = generateAuthToken({ id: 'admin-uuid-001', role: 'ADMIN' });
  });

  beforeEach(() => jest.clearAllMocks());

  // ─── POST /v1/payments/create-intent ─────────────────────────────────────

  describe('POST /v1/payments/create-intent', () => {
    it('should return 201 with a Stripe clientSecret and paymentId', async () => {
      (prisma.order.findUnique as jest.Mock).mockResolvedValue({
        id: 'order-uuid-001',
        userId: 'user-uuid-001',
        totalAmount: 180995,
        currency: 'GBP',
        paymentStatus: PaymentStatus.UNPAID,
      });
      (stripeClient.paymentIntents.create as jest.Mock).mockResolvedValue(mockPaymentIntent);
      (prisma.payment.create as jest.Mock).mockResolvedValue(mockPayment);

      const res = await request(app)
        .post(`${BASE}/create-intent`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({ orderId: 'order-uuid-001' });

      expect(res.status).toBe(201);
      expect(res.body.data).toMatchObject({
        clientSecret: expect.any(String),
        paymentIntentId: expect.any(String),
        paymentId: expect.any(String),
      });
    });

    it('should return 400 when orderId is not provided', async () => {
      const res = await request(app)
        .post(`${BASE}/create-intent`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({});

      expect(res.status).toBe(400);
    });

    it('should return 404 when the order does not exist', async () => {
      (prisma.order.findUnique as jest.Mock).mockResolvedValue(null);

      const res = await request(app)
        .post(`${BASE}/create-intent`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({ orderId: 'ghost-order' });

      expect(res.status).toBe(404);
    });

    it('should return 409 when the order is already paid', async () => {
      (prisma.order.findUnique as jest.Mock).mockResolvedValue({
        id: 'order-uuid-001',
        userId: 'user-uuid-001',
        paymentStatus: PaymentStatus.PAID,
      });

      const res = await request(app)
        .post(`${BASE}/create-intent`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({ orderId: 'order-uuid-001' });

      expect(res.status).toBe(409);
    });

    it('should return 403 when user does not own the order', async () => {
      (prisma.order.findUnique as jest.Mock).mockResolvedValue({
        id: 'order-uuid-001',
        userId: 'different-user',
        paymentStatus: PaymentStatus.UNPAID,
      });

      const res = await request(app)
        .post(`${BASE}/create-intent`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({ orderId: 'order-uuid-001' });

      expect(res.status).toBe(403);
    });

    it('should return 401 when unauthenticated', async () => {
      const res = await request(app)
        .post(`${BASE}/create-intent`)
        .send({ orderId: 'order-uuid-001' });

      expect(res.status).toBe(401);
    });
  });

  // ─── GET /v1/payments ─────────────────────────────────────────────────────

  describe('GET /v1/payments', () => {
    it('admin should receive a paginated list of all payments', async () => {
      (prisma.payment.findMany as jest.Mock).mockResolvedValue([mockPayment]);
      (prisma.payment.count as jest.Mock).mockResolvedValue(1);

      const res = await request(app)
        .get(BASE)
        .set('Authorization', `Bearer ${adminToken}`)
        .query({ page: 1, limit: 10 });

      expect(res.status).toBe(200);
      expect(res.body.data.payments).toHaveLength(1);
    });

    it('should return 403 for non-admin users', async () => {
      const res = await request(app)
        .get(BASE)
        .set('Authorization', `Bearer ${userToken}`);

      expect(res.status).toBe(403);
    });

    it('should return 401 when unauthenticated', async () => {
      const res = await request(app).get(BASE);

      expect(res.status).toBe(401);
    });

    it('should filter payments by status when query param provided', async () => {
      (prisma.payment.findMany as jest.Mock).mockResolvedValue([mockPayment]);
      (prisma.payment.count as jest.Mock).mockResolvedValue(1);

      const res = await request(app)
        .get(BASE)
        .set('Authorization', `Bearer ${adminToken}`)
        .query({ status: PaymentStatus.SUCCEEDED });

      expect(res.status).toBe(200);
      expect(prisma.payment.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ status: PaymentStatus.SUCCEEDED }),
        }),
      );
    });
  });

  // ─── GET /v1/payments/:id ─────────────────────────────────────────────────

  describe('GET /v1/payments/:id', () => {
    it('should return 200 with the payment for the order owner', async () => {
      (prisma.payment.findUnique as jest.Mock).mockResolvedValue(mockPayment);

      const res = await request(app)
        .get(`${BASE}/pay-uuid-001`)
        .set('Authorization', `Bearer ${userToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.id).toBe('pay-uuid-001');
    });

    it('should return 404 when payment does not exist', async () => {
      (prisma.payment.findUnique as jest.Mock).mockResolvedValue(null);

      const res = await request(app)
        .get(`${BASE}/non-existent`)
        .set('Authorization', `Bearer ${userToken}`);

      expect(res.status).toBe(404);
    });

    it('should return 403 when user does not own the associated order', async () => {
      (prisma.payment.findUnique as jest.Mock).mockResolvedValue({
        ...mockPayment,
        order: { id: 'order-uuid-001', userId: 'another-user' },
      });

      const res = await request(app)
        .get(`${BASE}/pay-uuid-001`)
        .set('Authorization', `Bearer ${userToken}`);

      expect(res.status).toBe(403);
    });
  });

  // ─── GET /v1/payments/order/:orderId ─────────────────────────────────────

  describe('GET /v1/payments/order/:orderId', () => {
    it('should return all payments for an order the user owns', async () => {
      (prisma.order.findUnique as jest.Mock).mockResolvedValue({
        id: 'order-uuid-001',
        userId: 'user-uuid-001',
      });
      (prisma.payment.findMany as jest.Mock).mockResolvedValue([mockPayment]);

      const res = await request(app)
        .get(`${BASE}/order/order-uuid-001`)
        .set('Authorization', `Bearer ${userToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data).toHaveLength(1);
    });

    it('should return 403 when user does not own the order', async () => {
      (prisma.order.findUnique as jest.Mock).mockResolvedValue({
        id: 'order-uuid-001',
        userId: 'other-user',
      });

      const res = await request(app)
        .get(`${BASE}/order/order-uuid-001`)
        .set('Authorization', `Bearer ${userToken}`);

      expect(res.status).toBe(403);
    });
  });
});