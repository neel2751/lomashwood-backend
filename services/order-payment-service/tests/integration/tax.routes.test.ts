import request from 'supertest';
import { app } from '../../src/app';
import { prisma } from '../../src/infrastructure/db/prisma.client';
import { TaxType } from '@prisma/client';
import { generateAuthToken } from '../helpers/auth.helper';

jest.mock('../../src/infrastructure/db/prisma.client', () => ({
  prisma: {
    taxRule: {
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

const BASE = '/v1/tax-rules';

describe('Tax Routes — Integration', () => {
  let adminToken: string;
  let userToken: string;

  const mockTaxRule = {
    id: 'tax-uuid-001',
    name: 'UK Standard VAT',
    type: TaxType.PERCENTAGE,
    rate: 20,
    country: 'GB',
    region: null,
    category: 'GENERAL',
    isDefault: true,
    isActive: true,
    createdAt: new Date('2026-01-01T00:00:00Z'),
    updatedAt: new Date('2026-01-01T00:00:00Z'),
  };

  beforeAll(() => {
    userToken = generateAuthToken({ id: 'user-uuid-001', role: 'CUSTOMER' });
    adminToken = generateAuthToken({ id: 'admin-uuid-001', role: 'ADMIN' });
  });

  beforeEach(() => jest.clearAllMocks());

  // ─── POST /v1/tax-rules ───────────────────────────────────────────────────

  describe('POST /v1/tax-rules', () => {
    const validPayload = {
      name: 'UK Standard VAT',
      type: TaxType.PERCENTAGE,
      rate: 20,
      country: 'GB',
      category: 'GENERAL',
      isDefault: true,
    };

    it('admin should create a tax rule and return 201', async () => {
      (prisma.taxRule.create as jest.Mock).mockResolvedValue(mockTaxRule);

      const res = await request(app)
        .post(BASE)
        .set('Authorization', `Bearer ${adminToken}`)
        .send(validPayload);

      expect(res.status).toBe(201);
      expect(res.body.data.name).toBe('UK Standard VAT');
      expect(res.body.data.rate).toBe(20);
    });

    it('should return 400 when rate is missing', async () => {
      const { rate, ...rest } = validPayload;

      const res = await request(app)
        .post(BASE)
        .set('Authorization', `Bearer ${adminToken}`)
        .send(rest);

      expect(res.status).toBe(400);
    });

    it('should return 400 when PERCENTAGE rate exceeds 100', async () => {
      const res = await request(app)
        .post(BASE)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ ...validPayload, rate: 150 });

      expect(res.status).toBe(400);
    });

    it('should return 400 when FIXED rate is negative', async () => {
      const res = await request(app)
        .post(BASE)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ ...validPayload, type: TaxType.FIXED, rate: -100 });

      expect(res.status).toBe(400);
    });

    it('should return 400 when country code is not 2 characters', async () => {
      const res = await request(app)
        .post(BASE)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ ...validPayload, country: 'GREAT_BRITAIN' });

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

  // ─── GET /v1/tax-rules ────────────────────────────────────────────────────

  describe('GET /v1/tax-rules', () => {
    it('admin should receive a paginated list of tax rules', async () => {
      (prisma.taxRule.findMany as jest.Mock).mockResolvedValue([mockTaxRule]);
      (prisma.taxRule.count as jest.Mock).mockResolvedValue(1);

      const res = await request(app)
        .get(BASE)
        .set('Authorization', `Bearer ${adminToken}`)
        .query({ page: 1, limit: 10 });

      expect(res.status).toBe(200);
      expect(res.body.data.taxRules).toHaveLength(1);
    });

    it('should return 403 for non-admin users', async () => {
      const res = await request(app)
        .get(BASE)
        .set('Authorization', `Bearer ${userToken}`);

      expect(res.status).toBe(403);
    });

    it('should filter by country when query param is provided', async () => {
      (prisma.taxRule.findMany as jest.Mock).mockResolvedValue([mockTaxRule]);
      (prisma.taxRule.count as jest.Mock).mockResolvedValue(1);

      await request(app)
        .get(BASE)
        .set('Authorization', `Bearer ${adminToken}`)
        .query({ country: 'GB' });

      expect(prisma.taxRule.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ country: 'GB' }),
        }),
      );
    });

    it('should filter by isActive when query param is provided', async () => {
      (prisma.taxRule.findMany as jest.Mock).mockResolvedValue([mockTaxRule]);
      (prisma.taxRule.count as jest.Mock).mockResolvedValue(1);

      await request(app)
        .get(BASE)
        .set('Authorization', `Bearer ${adminToken}`)
        .query({ isActive: 'true' });

      expect(prisma.taxRule.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ isActive: true }),
        }),
      );
    });
  });

  // ─── GET /v1/tax-rules/:id ────────────────────────────────────────────────

  describe('GET /v1/tax-rules/:id', () => {
    it('admin should return 200 with tax rule details', async () => {
      (prisma.taxRule.findUnique as jest.Mock).mockResolvedValue(mockTaxRule);

      const res = await request(app)
        .get(`${BASE}/tax-uuid-001`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.rate).toBe(20);
    });

    it('should return 404 when tax rule does not exist', async () => {
      (prisma.taxRule.findUnique as jest.Mock).mockResolvedValue(null);

      const res = await request(app)
        .get(`${BASE}/ghost-id`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(404);
    });
  });

  // ─── PATCH /v1/tax-rules/:id ──────────────────────────────────────────────

  describe('PATCH /v1/tax-rules/:id', () => {
    it('admin should update a tax rule and return 200', async () => {
      const updated = { ...mockTaxRule, rate: 15 };
      (prisma.taxRule.findUnique as jest.Mock).mockResolvedValue(mockTaxRule);
      (prisma.taxRule.update as jest.Mock).mockResolvedValue(updated);

      const res = await request(app)
        .patch(`${BASE}/tax-uuid-001`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ rate: 15 });

      expect(res.status).toBe(200);
      expect(res.body.data.rate).toBe(15);
    });

    it('should return 400 when updating PERCENTAGE rate to above 100', async () => {
      (prisma.taxRule.findUnique as jest.Mock).mockResolvedValue(mockTaxRule);

      const res = await request(app)
        .patch(`${BASE}/tax-uuid-001`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ rate: 150 });

      expect(res.status).toBe(400);
    });

    it('should return 403 for non-admin users', async () => {
      const res = await request(app)
        .patch(`${BASE}/tax-uuid-001`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({ rate: 10 });

      expect(res.status).toBe(403);
    });
  });

  // ─── PATCH /v1/tax-rules/:id/deactivate ──────────────────────────────────

  describe('PATCH /v1/tax-rules/:id/deactivate', () => {
    it('admin should deactivate a tax rule and return 200', async () => {
      const deactivated = { ...mockTaxRule, isActive: false };
      (prisma.taxRule.findUnique as jest.Mock).mockResolvedValue(mockTaxRule);
      (prisma.taxRule.update as jest.Mock).mockResolvedValue(deactivated);

      const res = await request(app)
        .patch(`${BASE}/tax-uuid-001/deactivate`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.isActive).toBe(false);
    });

    it('should return 404 when tax rule does not exist', async () => {
      (prisma.taxRule.findUnique as jest.Mock).mockResolvedValue(null);

      const res = await request(app)
        .patch(`${BASE}/ghost-id/deactivate`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(404);
    });
  });

  // ─── DELETE /v1/tax-rules/:id ─────────────────────────────────────────────

  describe('DELETE /v1/tax-rules/:id', () => {
    it('admin should delete a tax rule and return 204', async () => {
      (prisma.taxRule.findUnique as jest.Mock).mockResolvedValue(mockTaxRule);
      (prisma.taxRule.delete as jest.Mock).mockResolvedValue(mockTaxRule);

      const res = await request(app)
        .delete(`${BASE}/tax-uuid-001`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(204);
    });

    it('should return 404 when tax rule does not exist', async () => {
      (prisma.taxRule.findUnique as jest.Mock).mockResolvedValue(null);

      const res = await request(app)
        .delete(`${BASE}/ghost-id`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(404);
    });

    it('should return 403 for non-admin users', async () => {
      const res = await request(app)
        .delete(`${BASE}/tax-uuid-001`)
        .set('Authorization', `Bearer ${userToken}`);

      expect(res.status).toBe(403);
    });
  });

  // ─── POST /v1/tax-rules/calculate ────────────────────────────────────────

  describe('POST /v1/tax-rules/calculate', () => {
    it('should return 200 with calculated tax for a valid country and amount', async () => {
      (prisma.taxRule.findFirst as jest.Mock).mockResolvedValue(mockTaxRule);

      const res = await request(app)
        .post(`${BASE}/calculate`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({ amount: 100000, country: 'GB', category: 'GENERAL' });

      expect(res.status).toBe(200);
      expect(res.body.data.taxAmount).toBe(20000);
      expect(res.body.data.totalWithTax).toBe(120000);
    });

    it('should return 0 tax when no matching rule exists', async () => {
      (prisma.taxRule.findFirst as jest.Mock).mockResolvedValue(null);

      const res = await request(app)
        .post(`${BASE}/calculate`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({ amount: 100000, country: 'XX', category: 'EXEMPT' });

      expect(res.status).toBe(200);
      expect(res.body.data.taxAmount).toBe(0);
    });

    it('should return 400 when amount is missing', async () => {
      const res = await request(app)
        .post(`${BASE}/calculate`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({ country: 'GB', category: 'GENERAL' });

      expect(res.status).toBe(400);
    });

    it('should return 401 when unauthenticated', async () => {
      const res = await request(app)
        .post(`${BASE}/calculate`)
        .send({ amount: 100000, country: 'GB', category: 'GENERAL' });

      expect(res.status).toBe(401);
    });
  });
});