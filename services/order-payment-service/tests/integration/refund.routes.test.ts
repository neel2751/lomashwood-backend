import request from 'supertest';
import { app } from '../../src/app';
import { prisma } from '../../src/infrastructure/db/prisma.client';
import { stripeClient } from '../../src/infrastructure/payments/stripe.client';
import { RefundStatus, PaymentStatus, OrderStatus } from '@prisma/client';
import { generateAuthToken } from '../helpers/auth.helper';

jest.mock('../../src/infrastructure/db/prisma.client', () => ({
  prisma: {
    refund: {
      create: jest.fn(),
      findUnique: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
      count: jest.fn(),
    },
    payment: { findUnique: jest.fn(), update: jest.fn() },
    order: { findUnique: jest.fn(), update: jest.fn() },
    $transaction: jest.fn((cb: any) => cb(prisma)),
  },
}));

jest.mock('../../src/infrastructure/payments/stripe.client', () => ({
  stripeClient: {
    refunds: { create: jest.fn() },
  },
}));

const BASE = '/v1/refunds';

describe('Refund Routes — Integration', () => {
  let adminToken: string;
  let userToken: string;

  const mockPayment = {
    id: 'pay-uuid-001',
    orderId: 'order-uuid-001',
    stripePaymentIntentId: 'pi_test_abc123',
    amount: 180995,
    currency: 'GBP',
    status: PaymentStatus.SUCCEEDED,
    order: { id: 'order-uuid-001', userId: 'user-uuid-001', status: OrderStatus.CONFIRMED },
  };

  const mockRefund = {
    id: 'refund-uuid-001',
    paymentId: 'pay-uuid-001',
    stripeRefundId: 're_test_xyz789',
    amount: 50000,
    reason: 'Customer requested',
    status: RefundStatus.SUCCEEDED,
    createdAt: new Date('2026-01-15T10:00:00Z'),
    updatedAt: new Date('2026-01-15T10:00:00Z'),
    payment: mockPayment,
  };

  const mockStripeRefund = {
    id: 're_test_xyz789',
    amount: 50000,
    currency: 'gbp',
    status: 'succeeded',
  };

  beforeAll(() => {
    userToken = generateAuthToken({ id: 'user-uuid-001', role: 'CUSTOMER' });
    adminToken = generateAuthToken({ id: 'admin-uuid-001', role: 'ADMIN' });
  });

  beforeEach(() => jest.clearAllMocks());

  // ─── POST /v1/refunds ─────────────────────────────────────────────────────

  describe('POST /v1/refunds', () => {
    const validPayload = {
      paymentId: 'pay-uuid-001',
      amount: 50000,
      reason: 'Customer requested',
    };

    it('admin should successfully create a refund and return 201', async () => {
      (prisma.payment.findUnique as jest.Mock).mockResolvedValue(mockPayment);
      (stripeClient.refunds.create as jest.Mock).mockResolvedValue(mockStripeRefund);
      (prisma.$transaction as jest.Mock).mockResolvedValue(mockRefund);

      const res = await request(app)
        .post(BASE)
        .set('Authorization', `Bearer ${adminToken}`)
        .send(validPayload);

      expect(res.status).toBe(201);
      expect(res.body.data.stripeRefundId).toBe('re_test_xyz789');
      expect(res.body.data.amount).toBe(50000);
    });

    it('should return 403 when a non-admin tries to issue a refund', async () => {
      const res = await request(app)
        .post(BASE)
        .set('Authorization', `Bearer ${userToken}`)
        .send(validPayload);

      expect(res.status).toBe(403);
    });

    it('should return 400 when amount is missing', async () => {
      const res = await request(app)
        .post(BASE)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ paymentId: 'pay-uuid-001', reason: 'reason' });

      expect(res.status).toBe(400);
    });

    it('should return 400 when amount is zero', async () => {
      const res = await request(app)
        .post(BASE)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ ...validPayload, amount: 0 });

      expect(res.status).toBe(400);
    });

    it('should return 404 when payment does not exist', async () => {
      (prisma.payment.findUnique as jest.Mock).mockResolvedValue(null);

      const res = await request(app)
        .post(BASE)
        .set('Authorization', `Bearer ${adminToken}`)
        .send(validPayload);

      expect(res.status).toBe(404);
    });

    it('should return 422 when refund amount exceeds original payment', async () => {
      (prisma.payment.findUnique as jest.Mock).mockResolvedValue(mockPayment);

      const res = await request(app)
        .post(BASE)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ ...validPayload, amount: 999999 });

      expect(res.status).toBe(422);
    });

    it('should return 422 when Stripe refund fails', async () => {
      (prisma.payment.findUnique as jest.Mock).mockResolvedValue(mockPayment);
      (stripeClient.refunds.create as jest.Mock).mockRejectedValue(
        new Error('Charge has already been refunded.'),
      );

      const res = await request(app)
        .post(BASE)
        .set('Authorization', `Bearer ${adminToken}`)
        .send(validPayload);

      expect(res.status).toBe(422);
    });

    it('should return 401 when unauthenticated', async () => {
      const res = await request(app).post(BASE).send(validPayload);

      expect(res.status).toBe(401);
    });
  });

  // ─── GET /v1/refunds ──────────────────────────────────────────────────────

  describe('GET /v1/refunds', () => {
    it('admin should receive a paginated list of all refunds', async () => {
      (prisma.refund.findMany as jest.Mock).mockResolvedValue([mockRefund]);
      (prisma.refund.count as jest.Mock).mockResolvedValue(1);

      const res = await request(app)
        .get(BASE)
        .set('Authorization', `Bearer ${adminToken}`)
        .query({ page: 1, limit: 10 });

      expect(res.status).toBe(200);
      expect(res.body.data.refunds).toHaveLength(1);
    });

    it('should return 403 for non-admin users', async () => {
      const res = await request(app)
        .get(BASE)
        .set('Authorization', `Bearer ${userToken}`);

      expect(res.status).toBe(403);
    });

    it('should filter by status when query param is provided', async () => {
      (prisma.refund.findMany as jest.Mock).mockResolvedValue([]);
      (prisma.refund.count as jest.Mock).mockResolvedValue(0);

      await request(app)
        .get(BASE)
        .set('Authorization', `Bearer ${adminToken}`)
        .query({ status: RefundStatus.PENDING });

      expect(prisma.refund.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ status: RefundStatus.PENDING }),
        }),
      );
    });
  });

  // ─── GET /v1/refunds/:id ──────────────────────────────────────────────────

  describe('GET /v1/refunds/:id', () => {
    it('should return 200 with the refund for admin', async () => {
      (prisma.refund.findUnique as jest.Mock).mockResolvedValue(mockRefund);

      const res = await request(app)
        .get(`${BASE}/refund-uuid-001`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.id).toBe('refund-uuid-001');
    });

    it('should return 200 when the order owner views their refund', async () => {
      (prisma.refund.findUnique as jest.Mock).mockResolvedValue(mockRefund);

      const res = await request(app)
        .get(`${BASE}/refund-uuid-001`)
        .set('Authorization', `Bearer ${userToken}`);

      expect(res.status).toBe(200);
    });

    it('should return 403 when another user tries to view the refund', async () => {
      const otherToken = generateAuthToken({ id: 'other-user', role: 'CUSTOMER' });
      (prisma.refund.findUnique as jest.Mock).mockResolvedValue(mockRefund);

      const res = await request(app)
        .get(`${BASE}/refund-uuid-001`)
        .set('Authorization', `Bearer ${otherToken}`);

      expect(res.status).toBe(403);
    });

    it('should return 404 when refund does not exist', async () => {
      (prisma.refund.findUnique as jest.Mock).mockResolvedValue(null);

      const res = await request(app)
        .get(`${BASE}/non-existent`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(404);
    });
  });

  // ─── GET /v1/refunds/payment/:paymentId ───────────────────────────────────

  describe('GET /v1/refunds/payment/:paymentId', () => {
    it('should return all refunds for a payment the user owns', async () => {
      (prisma.payment.findUnique as jest.Mock).mockResolvedValue(mockPayment);
      (prisma.refund.findMany as jest.Mock).mockResolvedValue([mockRefund]);

      const res = await request(app)
        .get(`${BASE}/payment/pay-uuid-001`)
        .set('Authorization', `Bearer ${userToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data).toHaveLength(1);
    });

    it('should return 403 when user does not own the associated order', async () => {
      (prisma.payment.findUnique as jest.Mock).mockResolvedValue({
        ...mockPayment,
        order: { id: 'order-uuid-001', userId: 'other-user' },
      });

      const res = await request(app)
        .get(`${BASE}/payment/pay-uuid-001`)
        .set('Authorization', `Bearer ${userToken}`);

      expect(res.status).toBe(403);
    });
  });
});