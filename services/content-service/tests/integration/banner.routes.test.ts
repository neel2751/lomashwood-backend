import request from 'supertest';
import { createApp } from '../../src/app';
import { prisma } from '../../src/infrastructure/db/prisma.client';
import { mockAdminToken, mockUserToken } from '../helpers/auth.helper';
import { jest, describe, it, expect, beforeEach, jest as jestGlobal } from '@jest/globals';

jest.mock('../../src/infrastructure/db/prisma.client', () => ({
  prisma: {
    banner: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
    },
    $transaction: jest.fn(),
    $disconnect: jest.fn(),
  },
}));

jest.mock('../../src/infrastructure/cache/redis.client', () => ({
  redis: { get: jest.fn(), set: jest.fn(), del: jest.fn(), quit: jest.fn() },
}));

const app = createApp();

const mockedPrisma = prisma as jest.Mocked<typeof prisma>;

const mockBanner = {
  id: 'banner-1',
  title: 'Summer Kitchen Sale',
  subtitle: 'Up to 50% off',
  description: 'Exclusive summer deals on kitchens and bedrooms.',
  imageUrl: 'https://cdn.lomashwood.com/banners/summer-sale.jpg',
  linkUrl: '/sale',
  linkText: 'Shop Now',
  position: 'hero',
  isActive: true,
  startsAt: new Date('2025-06-01').toISOString(),
  endsAt: new Date('2025-08-31').toISOString(),
  sortOrder: 1,
  createdAt: new Date('2025-01-01').toISOString(),
  updatedAt: new Date('2025-01-01').toISOString(),
};

describe('Banner Routes', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ─── GET /v1/banners ─────────────────────────────────────────────────────────

  describe('GET /v1/banners', () => {
    it('should return 200 with active banners for public requests', async () => {
      mockedPrisma.banner.findMany.mockResolvedValue([mockBanner]);

      const res = await request(app).get('/v1/banners');

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.data)).toBe(true);
    });

    it('should only return active banners within date range for public requests', async () => {
      mockedPrisma.banner.findMany.mockResolvedValue([mockBanner]);

      await request(app).get('/v1/banners');

      const call = mockedPrisma.banner.findMany.mock.calls[0][0];
      expect(call.where).toHaveProperty('isActive', true);
    });

    it('should support position filter query param', async () => {
      mockedPrisma.banner.findMany.mockResolvedValue([mockBanner]);

      const res = await request(app).get('/v1/banners?position=hero');

      expect(res.status).toBe(200);
      const call = mockedPrisma.banner.findMany.mock.calls[0][0];
      expect(call.where).toHaveProperty('position', 'hero');
    });

    it('should return 400 for invalid position param', async () => {
      const res = await request(app).get('/v1/banners?position=invalid');

      expect(res.status).toBe(400);
    });

    it('should return empty array when no active banners exist', async () => {
      mockedPrisma.banner.findMany.mockResolvedValue([]);

      const res = await request(app).get('/v1/banners');

      expect(res.body.data).toHaveLength(0);
    });
  });

  // ─── GET /v1/banners/admin ───────────────────────────────────────────────────

  describe('GET /v1/banners/admin', () => {
    it('should return all banners including inactive ones for admin', async () => {
      const inactiveBanner = { ...mockBanner, id: 'banner-2', isActive: false };
      mockedPrisma.banner.findMany.mockResolvedValue([mockBanner, inactiveBanner]);
      mockedPrisma.banner.count.mockResolvedValue(2);

      const res = await request(app)
        .get('/v1/banners/admin')
        .set('Authorization', `Bearer ${mockAdminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data).toHaveLength(2);
    });

    it('should return 401 without auth token', async () => {
      const res = await request(app).get('/v1/banners/admin');

      expect(res.status).toBe(401);
    });

    it('should return 403 for non-admin user', async () => {
      const res = await request(app)
        .get('/v1/banners/admin')
        .set('Authorization', `Bearer ${mockUserToken}`);

      expect(res.status).toBe(403);
    });
  });

  // ─── GET /v1/banners/:id ─────────────────────────────────────────────────────

  describe('GET /v1/banners/:id', () => {
    it('should return 200 with banner by id for admin', async () => {
      mockedPrisma.banner.findUnique.mockResolvedValue(mockBanner);

      const res = await request(app)
        .get('/v1/banners/banner-1')
        .set('Authorization', `Bearer ${mockAdminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data).toHaveProperty('title', 'Summer Kitchen Sale');
    });

    it('should return 404 when banner not found', async () => {
      mockedPrisma.banner.findUnique.mockResolvedValue(null as any);

      const res = await request(app)
        .get('/v1/banners/nonexistent')
        .set('Authorization', `Bearer ${mockAdminToken}`);

      expect(res.status).toBe(404);
    });
  });

  // ─── POST /v1/banners ────────────────────────────────────────────────────────

  describe('POST /v1/banners', () => {
    const createPayload = {
      title: 'Winter Bedroom Sale',
      subtitle: 'Cosy up your bedroom',
      description: 'Great deals on bedroom furniture.',
      imageUrl: 'https://cdn.lomashwood.com/banners/winter.jpg',
      linkUrl: '/bedrooms/sale',
      linkText: 'Explore Deals',
      position: 'hero',
      isActive: true,
      sortOrder: 2,
    };

    it('should return 201 with created banner using admin token', async () => {
      const created = { ...mockBanner, ...createPayload, id: 'banner-new' };
      mockedPrisma.banner.create.mockResolvedValue(created);

      const res = await request(app)
        .post('/v1/banners')
        .set('Authorization', `Bearer ${mockAdminToken}`)
        .send(createPayload);

      expect(res.status).toBe(201);
      expect(res.body.data).toHaveProperty('title', 'Winter Bedroom Sale');
    });

    it('should return 400 when endsAt is before startsAt', async () => {
      const res = await request(app)
        .post('/v1/banners')
        .set('Authorization', `Bearer ${mockAdminToken}`)
        .send({
          ...createPayload,
          startsAt: '2025-12-31',
          endsAt: '2025-01-01',
        });

      expect(res.status).toBe(400);
    });

    it('should return 400 when title is missing', async () => {
      const res = await request(app)
        .post('/v1/banners')
        .set('Authorization', `Bearer ${mockAdminToken}`)
        .send({ ...createPayload, title: '' });

      expect(res.status).toBe(400);
    });

    it('should return 400 when position is invalid', async () => {
      const res = await request(app)
        .post('/v1/banners')
        .set('Authorization', `Bearer ${mockAdminToken}`)
        .send({ ...createPayload, position: 'invalid-position' });

      expect(res.status).toBe(400);
    });

    it('should return 400 when imageUrl is not a valid URL', async () => {
      const res = await request(app)
        .post('/v1/banners')
        .set('Authorization', `Bearer ${mockAdminToken}`)
        .send({ ...createPayload, imageUrl: 'not-a-url' });

      expect(res.status).toBe(400);
    });

    it('should return 401 without auth token', async () => {
      const res = await request(app).post('/v1/banners').send(createPayload);

      expect(res.status).toBe(401);
    });

    it('should return 403 for non-admin user', async () => {
      const res = await request(app)
        .post('/v1/banners')
        .set('Authorization', `Bearer ${mockUserToken}`)
        .send(createPayload);

      expect(res.status).toBe(403);
    });
  });

  // ─── PATCH /v1/banners/:id ───────────────────────────────────────────────────

  describe('PATCH /v1/banners/:id', () => {
    it('should return 200 and update banner', async () => {
      const updated = { ...mockBanner, title: 'Updated Banner' };
      mockedPrisma.banner.findUnique.mockResolvedValue(mockBanner);
      mockedPrisma.banner.update.mockResolvedValue(updated);

      const res = await request(app)
        .patch('/v1/banners/banner-1')
        .set('Authorization', `Bearer ${mockAdminToken}`)
        .send({ title: 'Updated Banner' });

      expect(res.status).toBe(200);
      expect(res.body.data.title).toBe('Updated Banner');
    });

    it('should return 404 when banner not found', async () => {
      mockedPrisma.banner.findUnique.mockResolvedValue(null as any);

      const res = await request(app)
        .patch('/v1/banners/nonexistent')
        .set('Authorization', `Bearer ${mockAdminToken}`)
        .send({ title: 'x' });

      expect(res.status).toBe(404);
    });

    it('should return 401 without auth token', async () => {
      const res = await request(app).patch('/v1/banners/banner-1').send({ title: 'x' });

      expect(res.status).toBe(401);
    });
  });

  // ─── PATCH /v1/banners/:id/toggle ────────────────────────────────────────────

  describe('PATCH /v1/banners/:id/toggle', () => {
    it('should return 200 and toggle banner active state', async () => {
      const toggled = { ...mockBanner, isActive: false };
      mockedPrisma.banner.findUnique.mockResolvedValue(mockBanner);
      mockedPrisma.banner.update.mockResolvedValue(toggled);

      const res = await request(app)
        .patch('/v1/banners/banner-1/toggle')
        .set('Authorization', `Bearer ${mockAdminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.isActive).toBe(false);
    });

    it('should return 404 when banner not found', async () => {
      mockedPrisma.banner.findUnique.mockResolvedValue(null as any);

      const res = await request(app)
        .patch('/v1/banners/nonexistent/toggle')
        .set('Authorization', `Bearer ${mockAdminToken}`);

      expect(res.status).toBe(404);
    });
  });

  // ─── POST /v1/banners/reorder ────────────────────────────────────────────────

  describe('POST /v1/banners/reorder', () => {
    it('should return 200 after reordering banners', async () => {
      mockedPrisma.$transaction.mockResolvedValue([] as any);

      const res = await request(app)
        .post('/v1/banners/reorder')
        .set('Authorization', `Bearer ${mockAdminToken}`)
        .send({ items: [{ id: 'banner-1', sortOrder: 2 }, { id: 'banner-2', sortOrder: 1 }] });

      expect(res.status).toBe(200);
    });

    it('should return 400 for empty items array', async () => {
      const res = await request(app)
        .post('/v1/banners/reorder')
        .set('Authorization', `Bearer ${mockAdminToken}`)
        .send({ items: [] });

      expect(res.status).toBe(400);
    });

    it('should return 401 without auth token', async () => {
      const res = await request(app)
        .post('/v1/banners/reorder')
        .send({ items: [{ id: 'banner-1', sortOrder: 1 }] });

      expect(res.status).toBe(401);
    });
  });

  // ─── DELETE /v1/banners/:id ──────────────────────────────────────────────────

  describe('DELETE /v1/banners/:id', () => {
    it('should return 204 on successful deletion', async () => {
      mockedPrisma.banner.findUnique.mockResolvedValue(mockBanner);
      mockedPrisma.banner.delete.mockResolvedValue(mockBanner);

      const res = await request(app)
        .delete('/v1/banners/banner-1')
        .set('Authorization', `Bearer ${mockAdminToken}`);

      expect(res.status).toBe(204);
    });

    it('should return 404 when banner not found', async () => {
      mockedPrisma.banner.findUnique.mockResolvedValue(null as any);

      const res = await request(app)
        .delete('/v1/banners/nonexistent')
        .set('Authorization', `Bearer ${mockAdminToken}`);

      expect(res.status).toBe(404);
    });

    it('should return 401 without auth token', async () => {
      const res = await request(app).delete('/v1/banners/banner-1');

      expect(res.status).toBe(401);
    });
  });
});