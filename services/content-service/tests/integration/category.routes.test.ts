import request from 'supertest';
import { createApp } from '../../src/app';
import { prisma } from '../../src/infrastructure/db/prisma.client';
import { mockAdminToken, mockUserToken } from '../helpers/auth.helper';
import { jest, describe, it, expect, beforeEach } from '@jest/globals';

const mockedPrisma = prisma as jest.Mocked<typeof prisma>;

jest.mock('../../src/infrastructure/db/prisma.client', () => ({
  prisma: {
    category: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
    },
    $disconnect: jest.fn(),
  },
}));

jest.mock('../../src/infrastructure/cache/redis.client', () => ({
  redis: { get: jest.fn(), set: jest.fn(), del: jest.fn(), quit: jest.fn() },
}));

const app = createApp();

const mockCategory = {
  id: 'cat-1',
  name: 'Kitchen Design',
  slug: 'kitchen-design',
  description: 'Articles about kitchen design.',
  imageUrl: 'https://cdn.lomashwood.com/categories/kitchen.jpg',
  isActive: true,
  sortOrder: 1,
  createdAt: new Date('2025-01-01').toISOString(),
  updatedAt: new Date('2025-01-01').toISOString(),
};

describe('Category Routes', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ─── GET /v1/categories ──────────────────────────────────────────────────────

  describe('GET /v1/categories', () => {
    it('should return 200 with list of categories', async () => {
      mockedPrisma.category.findMany.mockResolvedValue([mockCategory]);

      const res = await request(app).get('/v1/categories');

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data[0]).toHaveProperty('slug', 'kitchen-design');
    });

    it('should return only active categories for public requests', async () => {
      mockedPrisma.category.findMany.mockResolvedValue([mockCategory]);

      await request(app).get('/v1/categories');

      const call = mockedPrisma.category.findMany.mock.calls[0][0];
      expect(call.where).toHaveProperty('isActive', true);
    });

    it('should return empty array when no categories exist', async () => {
      mockedPrisma.category.findMany.mockResolvedValue([]);

      const res = await request(app).get('/v1/categories');

      expect(res.status).toBe(200);
      expect(res.body.data).toHaveLength(0);
    });

    it('should return categories ordered by sortOrder', async () => {
      mockedPrisma.category.findMany.mockResolvedValue([mockCategory]);

      await request(app).get('/v1/categories');

      const call = mockedPrisma.category.findMany.mock.calls[0][0];
      expect(call.orderBy).toMatchObject({ sortOrder: 'asc' });
    });
  });

  // ─── GET /v1/categories/:slug ────────────────────────────────────────────────

  describe('GET /v1/categories/:slug', () => {
    it('should return 200 with a category for a valid slug', async () => {
      mockedPrisma.category.findUnique.mockResolvedValue(mockCategory);

      const res = await request(app).get('/v1/categories/kitchen-design');

      expect(res.status).toBe(200);
      expect(res.body.data).toHaveProperty('name', 'Kitchen Design');
    });

    it('should return 404 when category not found', async () => {
      mockedPrisma.category.findUnique.mockResolvedValue(null as any);

      const res = await request(app).get('/v1/categories/nonexistent');

      expect(res.status).toBe(404);
    });
  });

  // ─── POST /v1/categories ─────────────────────────────────────────────────────

  describe('POST /v1/categories', () => {
    const createPayload = {
      name: 'Bedroom Inspiration',
      slug: 'bedroom-inspiration',
      description: 'Bedroom design inspiration and ideas.',
      isActive: true,
      sortOrder: 2,
    };

    it('should return 201 with created category using admin token', async () => {
      const created = { ...mockCategory, ...createPayload, id: 'cat-new' };
      mockedPrisma.category.findUnique.mockResolvedValue(null as any);
      mockedPrisma.category.create.mockResolvedValue(created);

      const res = await request(app)
        .post('/v1/categories')
        .set('Authorization', `Bearer ${mockAdminToken}`)
        .send(createPayload);

      expect(res.status).toBe(201);
      expect(res.body.data).toHaveProperty('slug', 'bedroom-inspiration');
    });

    it('should return 401 without auth token', async () => {
      const res = await request(app).post('/v1/categories').send(createPayload);

      expect(res.status).toBe(401);
    });

    it('should return 403 for non-admin user', async () => {
      const res = await request(app)
        .post('/v1/categories')
        .set('Authorization', `Bearer ${mockUserToken}`)
        .send(createPayload);

      expect(res.status).toBe(403);
    });

    it('should return 409 when category slug already exists', async () => {
      mockedPrisma.category.findUnique.mockResolvedValue(mockCategory);

      const res = await request(app)
        .post('/v1/categories')
        .set('Authorization', `Bearer ${mockAdminToken}`)
        .send(createPayload);

      expect(res.status).toBe(409);
    });

    it('should return 400 when name is missing', async () => {
      const res = await request(app)
        .post('/v1/categories')
        .set('Authorization', `Bearer ${mockAdminToken}`)
        .send({ ...createPayload, name: '' });

      expect(res.status).toBe(400);
    });
  });

  // ─── PATCH /v1/categories/:id ────────────────────────────────────────────────

  describe('PATCH /v1/categories/:id', () => {
    it('should return 200 and update the category', async () => {
      const updated = { ...mockCategory, name: 'Updated Name' };
      mockedPrisma.category.findUnique.mockResolvedValue(mockCategory);
      mockedPrisma.category.update.mockResolvedValue(updated);

      const res = await request(app)
        .patch('/v1/categories/cat-1')
        .set('Authorization', `Bearer ${mockAdminToken}`)
        .send({ name: 'Updated Name' });

      expect(res.status).toBe(200);
      expect(res.body.data.name).toBe('Updated Name');
    });

    it('should return 404 when category not found', async () => {
      mockedPrisma.category.findUnique.mockResolvedValue(null as any);

      const res = await request(app)
        .patch('/v1/categories/nonexistent')
        .set('Authorization', `Bearer ${mockAdminToken}`)
        .send({ name: 'x' });

      expect(res.status).toBe(404);
    });

    it('should return 401 without auth token', async () => {
      const res = await request(app).patch('/v1/categories/cat-1').send({ name: 'x' });

      expect(res.status).toBe(401);
    });
  });

  // ─── DELETE /v1/categories/:id ───────────────────────────────────────────────

  describe('DELETE /v1/categories/:id', () => {
    it('should return 204 on successful deletion', async () => {
      mockedPrisma.category.findUnique.mockResolvedValue(mockCategory);
      mockedPrisma.category.delete.mockResolvedValue(mockCategory);

      const res = await request(app)
        .delete('/v1/categories/cat-1')
        .set('Authorization', `Bearer ${mockAdminToken}`);

      expect(res.status).toBe(204);
    });

    it('should return 404 when category not found', async () => {
      mockedPrisma.category.findUnique.mockResolvedValue(null as any);

      const res = await request(app)
        .delete('/v1/categories/nonexistent')
        .set('Authorization', `Bearer ${mockAdminToken}`);

      expect(res.status).toBe(404);
    });

    it('should return 401 without auth token', async () => {
      const res = await request(app).delete('/v1/categories/cat-1');

      expect(res.status).toBe(401);
    });
  });
});