import request from 'supertest';
import { app } from '../../src/app';
import { prisma } from '../../src/infrastructure/db/prisma.client';
import { OrderStatus, PaymentStatus } from '@prisma/client';
import { generateAuthToken } from '../helpers/auth.helper';
import { createTestOrder, createTestUser } from '../helpers/factory.helper';

jest.mock('../../src/infrastructure/db/prisma.client', () => ({
  prisma: {
    order: {
      create: jest.fn(),
      findUnique: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
    },
    orderItem: { createMany: jest.fn(), deleteMany: jest.fn() },
    $transaction: jest.fn((cb: any) => cb(prisma)),
  },
}));

const BASE = '/v1/orders';

describe('Order Routes — Integration', () => {
  let adminToken: string;
  let userToken: string;
  let userId: string;

  const mockOrder = {
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
    notes: null,
    createdAt: new Date('2026-01-10T10:00:00Z'),
    updatedAt: new Date('2026-01-10T10:00:00Z'),
    items: [
      {
        id: 'item-uuid-001',
        orderId: 'order-uuid-001',
        productId: 'product-uuid-001',
        name: 'Luna White Kitchen',
        quantity: 1,
        unitPrice: 150000,
        totalPrice: 150000,
      },
    ],
  };

  beforeAll(() => {
    userId = 'user-uuid-001';
    userToken = generateAuthToken({ id: userId, role: 'CUSTOMER' });
    adminToken = generateAuthToken({ id: 'admin-uuid-001', role: 'ADMIN' });
  });

  beforeEach(() => jest.clearAllMocks());

  // ─── GET /v1/orders ───────────────────────────────────────────────────────

  describe('GET /v1/orders', () => {
    it('should return 200 with paginated orders for authenticated user', async () => {
      (prisma.order.findMany as jest.Mock).mockResolvedValue([mockOrder]);
      (prisma.order.count as jest.Mock).mockResolvedValue(1);

      const res = await request(app)
        .get(BASE)
        .set('Authorization', `Bearer ${userToken}`)
        .query({ page: 1, limit: 10 });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.orders).toHaveLength(1);
      expect(res.body.data.total).toBe(1);
    });

    it('should return 401 when no auth token is provided', async () => {
      const res = await request(app).get(BASE);

      expect(res.status).toBe(401);
    });

    it('should filter orders by status when query param is provided', async () => {
      (prisma.order.findMany as jest.Mock).mockResolvedValue([]);
      (prisma.order.count as jest.Mock).mockResolvedValue(0);

      const res = await request(app)
        .get(BASE)
        .set('Authorization', `Bearer ${userToken}`)
        .query({ status: OrderStatus.CONFIRMED });

      expect(res.status).toBe(200);
      expect(prisma.order.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ status: OrderStatus.CONFIRMED }),
        }),
      );
    });

    it('should return 400 when invalid page query param is provided', async () => {
      const res = await request(app)
        .get(BASE)
        .set('Authorization', `Bearer ${userToken}`)
        .query({ page: 'not-a-number' });

      expect(res.status).toBe(400);
    });

    it('admin should see all orders regardless of userId', async () => {
      (prisma.order.findMany as jest.Mock).mockResolvedValue([mockOrder]);
      (prisma.order.count as jest.Mock).mockResolvedValue(1);

      const res = await request(app)
        .get(BASE)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(prisma.order.findMany).not.toHaveBeenCalledWith(
        expect.objectContaining({ where: expect.objectContaining({ userId: 'admin-uuid-001' }) }),
      );
    });
  });

  // ─── GET /v1/orders/:id ───────────────────────────────────────────────────

  describe('GET /v1/orders/:id', () => {
    it('should return 200 with the order for the owner', async () => {
      (prisma.order.findUnique as jest.Mock).mockResolvedValue(mockOrder);

      const res = await request(app)
        .get(`${BASE}/order-uuid-001`)
        .set('Authorization', `Bearer ${userToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.id).toBe('order-uuid-001');
    });

    it('should return 404 when order does not exist', async () => {
      (prisma.order.findUnique as jest.Mock).mockResolvedValue(null);

      const res = await request(app)
        .get(`${BASE}/non-existent`)
        .set('Authorization', `Bearer ${userToken}`);

      expect(res.status).toBe(404);
    });

    it('should return 403 when a user tries to access another user\'s order', async () => {
      const otherOrder = { ...mockOrder, userId: 'other-user-uuid' };
      (prisma.order.findUnique as jest.Mock).mockResolvedValue(otherOrder);

      const res = await request(app)
        .get(`${BASE}/order-uuid-001`)
        .set('Authorization', `Bearer ${userToken}`);

      expect(res.status).toBe(403);
    });

    it('admin should be able to view any order', async () => {
      const otherOrder = { ...mockOrder, userId: 'other-user-uuid' };
      (prisma.order.findUnique as jest.Mock).mockResolvedValue(otherOrder);

      const res = await request(app)
        .get(`${BASE}/order-uuid-001`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
    });
  });

  // ─── POST /v1/orders ──────────────────────────────────────────────────────

  describe('POST /v1/orders', () => {
    const validPayload = {
      items: [{ productId: 'product-uuid-001', quantity: 1 }],
      shippingAddress: {
        line1: '123 High Street',
        city: 'London',
        postcode: 'SW1A 1AA',
        country: 'GB',
      },
      shippingRateId: 'ship-rate-uuid-001',
    };

    it('should return 201 with the created order', async () => {
      (prisma.$transaction as jest.Mock).mockResolvedValue(mockOrder);

      const res = await request(app)
        .post(BASE)
        .set('Authorization', `Bearer ${userToken}`)
        .send(validPayload);

      expect(res.status).toBe(201);
      expect(res.body.data.id).toBe('order-uuid-001');
    });

    it('should return 400 when items array is empty', async () => {
      const res = await request(app)
        .post(BASE)
        .set('Authorization', `Bearer ${userToken}`)
        .send({ ...validPayload, items: [] });

      expect(res.status).toBe(400);
    });

    it('should return 400 when shippingAddress is missing', async () => {
      const { shippingAddress, ...rest } = validPayload;
      const res = await request(app)
        .post(BASE)
        .set('Authorization', `Bearer ${userToken}`)
        .send(rest);

      expect(res.status).toBe(400);
    });

    it('should return 401 when not authenticated', async () => {
      const res = await request(app).post(BASE).send(validPayload);

      expect(res.status).toBe(401);
    });
  });

  // ─── PATCH /v1/orders/:id/status ─────────────────────────────────────────

  describe('PATCH /v1/orders/:id/status', () => {
    it('admin should be able to update order status', async () => {
      const updated = { ...mockOrder, status: OrderStatus.CONFIRMED };
      (prisma.order.findUnique as jest.Mock).mockResolvedValue(mockOrder);
      (prisma.order.update as jest.Mock).mockResolvedValue(updated);

      const res = await request(app)
        .patch(`${BASE}/order-uuid-001/status`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ status: OrderStatus.CONFIRMED });

      expect(res.status).toBe(200);
      expect(res.body.data.status).toBe(OrderStatus.CONFIRMED);
    });

    it('should return 403 when a non-admin tries to update order status', async () => {
      const res = await request(app)
        .patch(`${BASE}/order-uuid-001/status`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({ status: OrderStatus.CONFIRMED });

      expect(res.status).toBe(403);
    });

    it('should return 400 when an invalid status value is provided', async () => {
      const res = await request(app)
        .patch(`${BASE}/order-uuid-001/status`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ status: 'INVALID_STATUS' });

      expect(res.status).toBe(400);
    });

    it('should return 404 when order does not exist', async () => {
      (prisma.order.findUnique as jest.Mock).mockResolvedValue(null);

      const res = await request(app)
        .patch(`${BASE}/non-existent/status`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ status: OrderStatus.CONFIRMED });

      expect(res.status).toBe(404);
    });
  });

  // ─── DELETE /v1/orders/:id ────────────────────────────────────────────────

  describe('DELETE /v1/orders/:id', () => {
    it('admin should be able to cancel (soft-delete) an order', async () => {
      const cancelled = { ...mockOrder, status: OrderStatus.CANCELLED };
      (prisma.order.findUnique as jest.Mock).mockResolvedValue(mockOrder);
      (prisma.order.update as jest.Mock).mockResolvedValue(cancelled);

      const res = await request(app)
        .delete(`${BASE}/order-uuid-001`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
    });

    it('should return 403 for a regular user trying to delete an order', async () => {
      const res = await request(app)
        .delete(`${BASE}/order-uuid-001`)
        .set('Authorization', `Bearer ${userToken}`);

      expect(res.status).toBe(403);
    });

    it('should return 404 when order does not exist', async () => {
      (prisma.order.findUnique as jest.Mock).mockResolvedValue(null);

      const res = await request(app)
        .delete(`${BASE}/non-existent`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(404);
    });
  });
});