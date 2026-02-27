import request from 'supertest';
import { app } from '../../src/app';
import { prisma } from '../../src/infrastructure/db/prisma.client';
import { CouponType, CouponStatus } from '@prisma/client';
import { generateAuthToken } from '../helpers/auth.helper';

jest.mock('../../src/infrastructure/db/prisma.client', () => ({
  prisma: {
    coupon: {
      create: jest.fn(),
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
    },
  },
}));

const BASE = '/v1/coupons';

describe('Coupon Routes — Integration', () => {
  let adminToken: string;
  let userToken: string;

  const mockCoupon = {
    id: 'coupon-uuid-001',
    code: 'LOMASH20',
    description: '20% off your order',
    type: CouponType.PERCENTAGE,
    value: 20,
    minOrderAmount: 50000,
    maxDiscountAmount: 30000,
    usageLimit: 100,
    usageCount: 5,
    expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 30),
    status: CouponStatus.ACTIVE,
    createdAt: new Date('2026-01-01T00:00:00Z'),
    updatedAt: new Date('2026-01-01T00:00:00Z'),
  };

  beforeAll(() => {
    userToken = generateAuthToken({ id: 'user-uuid-001', role: 'CUSTOMER' });
    adminToken = generateAuthToken({ id: 'admin-uuid-001', role: 'ADMIN' });
  });

  beforeEach(() => jest.clearAllMocks());

  // ─── POST /v1/coupons ─────────────────────────────────────────────────────

  describe('POST /v1/coupons', () => {
    const validPayload = {
      code: 'LOMASH20',
      description: '20% off your order',
      type: CouponType.PERCENTAGE,
      value: 20,
      minOrderAmount: 50000,
      maxDiscountAmount: 30000,
      usageLimit: 100,
      expiresAt: new Date(Date.now() + 86400000 * 30).toISOString(),
    };

    it('admin should create a coupon and return 201', async () => {
      (prisma.coupon.findFirst as jest.Mock).mockResolvedValue(null);
      (prisma.coupon.create as jest.Mock).mockResolvedValue(mockCoupon);

      const res = await request(app)
        .post(BASE)
        .set('Authorization', `Bearer ${adminToken}`)
        .send(validPayload);

      expect(res.status).toBe(201);
      expect(res.body.data.code).toBe('LOMASH20');
    });

    it('should return 409 when coupon code already exists', async () => {
      (prisma.coupon.findFirst as jest.Mock).mockResolvedValue(mockCoupon);

      const res = await request(app)
        .post(BASE)
        .set('Authorization', `Bearer ${adminToken}`)
        .send(validPayload);

      expect(res.status).toBe(409);
    });

    it('should return 400 when value is missing', async () => {
      const { value, ...rest } = validPayload;

      const res = await request(app)
        .post(BASE)
        .set('Authorization', `Bearer ${adminToken}`)
        .send(rest);

      expect(res.status).toBe(400);
    });

    it('should return 400 when PERCENTAGE value exceeds 100', async () => {
      const res = await request(app)
        .post(BASE)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ ...validPayload, value: 150 });

      expect(res.status).toBe(400);
    });

    it('should return 400 when expiresAt is in the past', async () => {
      const res = await request(app)
        .post(BASE)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ ...validPayload, expiresAt: new Date('2020-01-01').toISOString() });

      expect(res.status).toBe(400);
    });

    it('should return 403 for non-admin users', async () => {
      const res = await request(app)
        .post(BASE)
        .set('Authorization', `Bearer ${userToken}`)
        .send(validPayload);

      expect(res.status).toBe(403);
    });

    it('should return 401 when unauthenticated', async () => {
      const res = await request(app).post(BASE).send(validPayload);

      expect(res.status).toBe(401);
    });
  });

  // ─── GET /v1/coupons ──────────────────────────────────────────────────────

  describe('GET /v1/coupons', () => {
    it('admin should receive a paginated list of all coupons', async () => {
      (prisma.coupon.findMany as jest.Mock).mockResolvedValue([mockCoupon]);
      (prisma.coupon.count as jest.Mock).mockResolvedValue(1);

      const res = await request(app)
        .get(BASE)
        .set('Authorization', `Bearer ${adminToken}`)
        .query({ page: 1, limit: 10 });

      expect(res.status).toBe(200);
      expect(res.body.data.coupons).toHaveLength(1);
    });

    it('should return 403 for regular users', async () => {
      const res = await request(app)
        .get(BASE)
        .set('Authorization', `Bearer ${userToken}`);

      expect(res.status).toBe(403);
    });

    it('should filter by status when query param is provided', async () => {
      (prisma.coupon.findMany as jest.Mock).mockResolvedValue([mockCoupon]);
      (prisma.coupon.count as jest.Mock).mockResolvedValue(1);

      await request(app)
        .get(BASE)
        .set('Authorization', `Bearer ${adminToken}`)
        .query({ status: CouponStatus.ACTIVE });

      expect(prisma.coupon.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ status: CouponStatus.ACTIVE }),
        }),
      );
    });
  });

  // ─── GET /v1/coupons/:id ──────────────────────────────────────────────────

  describe('GET /v1/coupons/:id', () => {
    it('admin should return 200 with coupon details', async () => {
      (prisma.coupon.findUnique as jest.Mock).mockResolvedValue(mockCoupon);

      const res = await request(app)
        .get(`${BASE}/coupon-uuid-001`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.code).toBe('LOMASH20');
    });

    it('should return 404 when coupon does not exist', async () => {
      (prisma.coupon.findUnique as jest.Mock).mockResolvedValue(null);

      const res = await request(app)
        .get(`${BASE}/ghost-id`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(404);
    });
  });

  // ─── PATCH /v1/coupons/:id ────────────────────────────────────────────────

  describe('PATCH /v1/coupons/:id', () => {
    it('admin should update coupon and return 200', async () => {
      const updated = { ...mockCoupon, description: 'Updated description' };
      (prisma.coupon.findUnique as jest.Mock).mockResolvedValue(mockCoupon);
      (prisma.coupon.update as jest.Mock).mockResolvedValue(updated);

      const res = await request(app)
        .patch(`${BASE}/coupon-uuid-001`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ description: 'Updated description' });

      expect(res.status).toBe(200);
      expect(res.body.data.description).toBe('Updated description');
    });

    it('should return 400 when PERCENTAGE value is updated to > 100', async () => {
      (prisma.coupon.findUnique as jest.Mock).mockResolvedValue(mockCoupon);

      const res = await request(app)
        .patch(`${BASE}/coupon-uuid-001`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ value: 200 });

      expect(res.status).toBe(400);
    });

    it('should return 403 for non-admin users', async () => {
      const res = await request(app)
        .patch(`${BASE}/coupon-uuid-001`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({ description: 'Hacked' });

      expect(res.status).toBe(403);
    });
  });

  // ─── PATCH /v1/coupons/:id/deactivate ────────────────────────────────────

  describe('PATCH /v1/coupons/:id/deactivate', () => {
    it('admin should deactivate coupon and return 200', async () => {
      const deactivated = { ...mockCoupon, status: CouponStatus.INACTIVE };
      (prisma.coupon.findUnique as jest.Mock).mockResolvedValue(mockCoupon);
      (prisma.coupon.update as jest.Mock).mockResolvedValue(deactivated);

      const res = await request(app)
        .patch(`${BASE}/coupon-uuid-001/deactivate`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.status).toBe(CouponStatus.INACTIVE);
    });

    it('should return 403 for non-admin users', async () => {
      const res = await request(app)
        .patch(`${BASE}/coupon-uuid-001/deactivate`)
        .set('Authorization', `Bearer ${userToken}`);

      expect(res.status).toBe(403);
    });
  });

  // ─── DELETE /v1/coupons/:id ───────────────────────────────────────────────

  describe('DELETE /v1/coupons/:id', () => {
    it('admin should delete coupon and return 204', async () => {
      (prisma.coupon.findUnique as jest.Mock).mockResolvedValue(mockCoupon);
      (prisma.coupon.delete as jest.Mock).mockResolvedValue(mockCoupon);

      const res = await request(app)
        .delete(`${BASE}/coupon-uuid-001`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(204);
    });

    it('should return 404 when coupon does not exist', async () => {
      (prisma.coupon.findUnique as jest.Mock).mockResolvedValue(null);

      const res = await request(app)
        .delete(`${BASE}/ghost-id`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(404);
    });

    it('should return 403 for non-admin users', async () => {
      const res = await request(app)
        .delete(`${BASE}/coupon-uuid-001`)
        .set('Authorization', `Bearer ${userToken}`);

      expect(res.status).toBe(403);
    });
  });

  // ─── POST /v1/coupons/validate ────────────────────────────────────────────

  describe('POST /v1/coupons/validate', () => {
    it('should return 200 with discount details for a valid active coupon', async () => {
      (prisma.coupon.findFirst as jest.Mock).mockResolvedValue(mockCoupon);

      const res = await request(app)
        .post(`${BASE}/validate`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({ code: 'LOMASH20', orderAmount: 100000 });

      expect(res.status).toBe(200);
      expect(res.body.data.discountAmount).toBeGreaterThan(0);
      expect(res.body.data.isValid).toBe(true);
    });

    it('should return 404 when coupon code does not exist', async () => {
      (prisma.coupon.findFirst as jest.Mock).mockResolvedValue(null);

      const res = await request(app)
        .post(`${BASE}/validate`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({ code: 'FAKE', orderAmount: 100000 });

      expect(res.status).toBe(404);
    });

    it('should return 422 for an expired coupon', async () => {
      (prisma.coupon.findFirst as jest.Mock).mockResolvedValue({
        ...mockCoupon,
        expiresAt: new Date(Date.now() - 1000),
      });

      const res = await request(app)
        .post(`${BASE}/validate`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({ code: 'LOMASH20', orderAmount: 100000 });

      expect(res.status).toBe(422);
    });
  });
});