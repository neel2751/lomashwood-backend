import request from 'supertest';
import { app } from '../../src/app';
import { prisma } from '../../src/infrastructure/db/prisma.client';
import { ShippingMethod, ShippingStatus } from '@prisma/client';
import { generateAuthToken } from '../helpers/auth.helper';

jest.mock('../../src/infrastructure/db/prisma.client', () => ({
  prisma: {
    shipping: {
      create: jest.fn(),
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
      count: jest.fn(),
    },
    shippingRate: {
      create: jest.fn(),
      findUnique: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
    },
    order: { findUnique: jest.fn() },
  },
}));

const BASE = '/v1/shipping';

describe('Shipping Routes — Integration', () => {
  let adminToken: string;
  let userToken: string;

  const mockShippingRate = {
    id: 'ship-rate-uuid-001',
    name: 'Standard Delivery',
    description: '3-5 business days',
    method: ShippingMethod.STANDARD,
    price: 995,
    freeThreshold: 50000,
    estimatedDays: 5,
    isActive: true,
    countries: ['GB'],
    createdAt: new Date('2026-01-01T00:00:00Z'),
    updatedAt: new Date('2026-01-01T00:00:00Z'),
  };

  const mockShipment = {
    id: 'ship-uuid-001',
    orderId: 'order-uuid-001',
    rateId: 'ship-rate-uuid-001',
    trackingNumber: null,
    carrier: null,
    status: ShippingStatus.PENDING,
    address: { line1: '123 High Street', city: 'London', postcode: 'SW1A 1AA', country: 'GB' },
    estimatedDelivery: new Date('2026-02-01'),
    shippedAt: null,
    deliveredAt: null,
    createdAt: new Date('2026-01-10T10:00:00Z'),
    updatedAt: new Date('2026-01-10T10:00:00Z'),
    order: { id: 'order-uuid-001', userId: 'user-uuid-001' },
    rate: mockShippingRate,
  };

  beforeAll(() => {
    userToken = generateAuthToken({ id: 'user-uuid-001', role: 'CUSTOMER' });
    adminToken = generateAuthToken({ id: 'admin-uuid-001', role: 'ADMIN' });
  });

  beforeEach(() => jest.clearAllMocks());

  // ─── GET /v1/shipping/rates ───────────────────────────────────────────────

  describe('GET /v1/shipping/rates', () => {
    it('should return 200 with available rates for a country', async () => {
      (prisma.shippingRate.findMany as jest.Mock).mockResolvedValue([mockShippingRate]);

      const res = await request(app)
        .get(`${BASE}/rates`)
        .set('Authorization', `Bearer ${userToken}`)
        .query({ country: 'GB' });

      expect(res.status).toBe(200);
      expect(res.body.data).toHaveLength(1);
    });

    it('should return 400 when country query param is missing', async () => {
      const res = await request(app)
        .get(`${BASE}/rates`)
        .set('Authorization', `Bearer ${userToken}`);

      expect(res.status).toBe(400);
    });

    it('should return empty array when no rates are available for country', async () => {
      (prisma.shippingRate.findMany as jest.Mock).mockResolvedValue([]);

      const res = await request(app)
        .get(`${BASE}/rates`)
        .set('Authorization', `Bearer ${userToken}`)
        .query({ country: 'XX' });

      expect(res.status).toBe(200);
      expect(res.body.data).toEqual([]);
    });

    it('should return 401 when unauthenticated', async () => {
      const res = await request(app)
        .get(`${BASE}/rates`)
        .query({ country: 'GB' });

      expect(res.status).toBe(401);
    });
  });

  // ─── POST /v1/shipping/rates ──────────────────────────────────────────────

  describe('POST /v1/shipping/rates', () => {
    const validPayload = {
      name: 'Express Delivery',
      description: '1-2 business days',
      method: ShippingMethod.EXPRESS,
      price: 2995,
      freeThreshold: null,
      estimatedDays: 2,
      countries: ['GB'],
    };

    it('admin should create a shipping rate and return 201', async () => {
      (prisma.shippingRate.create as jest.Mock).mockResolvedValue({
        ...mockShippingRate,
        ...validPayload,
        id: 'ship-rate-uuid-002',
      });

      const res = await request(app)
        .post(`${BASE}/rates`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send(validPayload);

      expect(res.status).toBe(201);
      expect(res.body.data.method).toBe(ShippingMethod.EXPRESS);
    });

    it('should return 400 when price is negative', async () => {
      const res = await request(app)
        .post(`${BASE}/rates`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ ...validPayload, price: -100 });

      expect(res.status).toBe(400);
    });

    it('should return 400 when countries array is empty', async () => {
      const res = await request(app)
        .post(`${BASE}/rates`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ ...validPayload, countries: [] });

      expect(res.status).toBe(400);
    });

    it('should return 403 for non-admin users', async () => {
      const res = await request(app)
        .post(`${BASE}/rates`)
        .set('Authorization', `Bearer ${userToken}`)
        .send(validPayload);

      expect(res.status).toBe(403);
    });
  });

  // ─── GET /v1/shipping ─────────────────────────────────────────────────────

  describe('GET /v1/shipping', () => {
    it('admin should receive paginated list of all shipments', async () => {
      (prisma.shipping.findMany as jest.Mock).mockResolvedValue([mockShipment]);
      (prisma.shipping.count as jest.Mock).mockResolvedValue(1);

      const res = await request(app)
        .get(BASE)
        .set('Authorization', `Bearer ${adminToken}`)
        .query({ page: 1, limit: 10 });

      expect(res.status).toBe(200);
      expect(res.body.data.shipments).toHaveLength(1);
    });

    it('should return 403 for non-admin users', async () => {
      const res = await request(app)
        .get(BASE)
        .set('Authorization', `Bearer ${userToken}`);

      expect(res.status).toBe(403);
    });

    it('should filter by status when query param provided', async () => {
      (prisma.shipping.findMany as jest.Mock).mockResolvedValue([]);
      (prisma.shipping.count as jest.Mock).mockResolvedValue(0);

      await request(app)
        .get(BASE)
        .set('Authorization', `Bearer ${adminToken}`)
        .query({ status: ShippingStatus.SHIPPED });

      expect(prisma.shipping.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ status: ShippingStatus.SHIPPED }),
        }),
      );
    });
  });

  // ─── GET /v1/shipping/:id ─────────────────────────────────────────────────

  describe('GET /v1/shipping/:id', () => {
    it('order owner should be able to view their shipment', async () => {
      (prisma.shipping.findUnique as jest.Mock).mockResolvedValue(mockShipment);

      const res = await request(app)
        .get(`${BASE}/ship-uuid-001`)
        .set('Authorization', `Bearer ${userToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.id).toBe('ship-uuid-001');
    });

    it('should return 404 when shipment does not exist', async () => {
      (prisma.shipping.findUnique as jest.Mock).mockResolvedValue(null);

      const res = await request(app)
        .get(`${BASE}/ghost-id`)
        .set('Authorization', `Bearer ${userToken}`);

      expect(res.status).toBe(404);
    });

    it('should return 403 when a different user tries to access the shipment', async () => {
      const otherToken = generateAuthToken({ id: 'stranger', role: 'CUSTOMER' });
      (prisma.shipping.findUnique as jest.Mock).mockResolvedValue(mockShipment);

      const res = await request(app)
        .get(`${BASE}/ship-uuid-001`)
        .set('Authorization', `Bearer ${otherToken}`);

      expect(res.status).toBe(403);
    });
  });

  // ─── PATCH /v1/shipping/:id/tracking ─────────────────────────────────────

  describe('PATCH /v1/shipping/:id/tracking', () => {
    it('admin should update tracking info and return 200', async () => {
      const updated = { ...mockShipment, trackingNumber: 'TRACK123', carrier: 'DPD', status: ShippingStatus.SHIPPED };
      (prisma.shipping.findUnique as jest.Mock).mockResolvedValue(mockShipment);
      (prisma.shipping.update as jest.Mock).mockResolvedValue(updated);

      const res = await request(app)
        .patch(`${BASE}/ship-uuid-001/tracking`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ trackingNumber: 'TRACK123', carrier: 'DPD' });

      expect(res.status).toBe(200);
      expect(res.body.data.trackingNumber).toBe('TRACK123');
      expect(res.body.data.status).toBe(ShippingStatus.SHIPPED);
    });

    it('should return 400 when trackingNumber is missing', async () => {
      const res = await request(app)
        .patch(`${BASE}/ship-uuid-001/tracking`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ carrier: 'DPD' });

      expect(res.status).toBe(400);
    });

    it('should return 403 for non-admin users', async () => {
      const res = await request(app)
        .patch(`${BASE}/ship-uuid-001/tracking`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({ trackingNumber: 'TRACK123', carrier: 'DPD' });

      expect(res.status).toBe(403);
    });
  });

  // ─── PATCH /v1/shipping/:id/delivered ────────────────────────────────────

  describe('PATCH /v1/shipping/:id/delivered', () => {
    it('admin should mark a shipment as delivered and return 200', async () => {
      const shipped = { ...mockShipment, status: ShippingStatus.SHIPPED, trackingNumber: 'TRACK123' };
      const delivered = { ...shipped, status: ShippingStatus.DELIVERED, deliveredAt: new Date() };
      (prisma.shipping.findUnique as jest.Mock).mockResolvedValue(shipped);
      (prisma.shipping.update as jest.Mock).mockResolvedValue(delivered);

      const res = await request(app)
        .patch(`${BASE}/ship-uuid-001/delivered`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.status).toBe(ShippingStatus.DELIVERED);
    });

    it('should return 422 when shipment is not in SHIPPED status', async () => {
      (prisma.shipping.findUnique as jest.Mock).mockResolvedValue(mockShipment); // PENDING

      const res = await request(app)
        .patch(`${BASE}/ship-uuid-001/delivered`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(422);
    });

    it('should return 403 for non-admin users', async () => {
      const res = await request(app)
        .patch(`${BASE}/ship-uuid-001/delivered`)
        .set('Authorization', `Bearer ${userToken}`);

      expect(res.status).toBe(403);
    });

    it('should return 404 when shipment does not exist', async () => {
      (prisma.shipping.findUnique as jest.Mock).mockResolvedValue(null);

      const res = await request(app)
        .patch(`${BASE}/ghost-id/delivered`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(404);
    });
  });
});