import request from 'supertest';
import { createApp } from '../../src/app';
import { prisma } from '../../src/infrastructure/db/prisma.client';
import { mockAdminToken, mockUserToken } from '../helpers/auth.helper';
import { jest, describe, it, expect, beforeEach } from '@jest/globals';

jest.mock('../../src/infrastructure/db/prisma.client', () => ({
  prisma: {
    tag: {
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

const mockTag = {
  id: 'tag-1',
  name: 'Kitchen',
  slug: 'kitchen',
  isActive: true,
  createdAt: new Date('2025-01-01').toISOString(),
  updatedAt: new Date('2025-01-01').toISOString(),
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type MockFn = ReturnType<typeof jest.fn<() => any>>;

function asMock(fn: unknown): MockFn {
  return fn as MockFn;
}

describe('Tag Routes', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /v1/tags', () => {
    it('should return 200 with list of all tags', async () => {
      asMock(prisma.tag.findMany).mockResolvedValue([mockTag]);

      const res = await request(app).get('/v1/tags');

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data[0]).toHaveProperty('slug', 'kitchen');
    });

    it('should return empty array when no tags exist', async () => {
      asMock(prisma.tag.findMany).mockResolvedValue([]);

      const res = await request(app).get('/v1/tags');

      expect(res.status).toBe(200);
      expect(res.body.data).toHaveLength(0);
    });

    it('should support search query param to filter by name', async () => {
      asMock(prisma.tag.findMany).mockResolvedValue([mockTag]);

      const res = await request(app).get('/v1/tags?search=kitchen');

      expect(res.status).toBe(200);
    });

    it('should return tags ordered alphabetically by name', async () => {
      asMock(prisma.tag.findMany).mockResolvedValue([mockTag]);

      await request(app).get('/v1/tags');

      const calls = asMock(prisma.tag.findMany).mock.calls;
      const arg = (calls[0] as unknown[])[0] as Record<string, unknown>;
      expect(arg.orderBy).toMatchObject({ name: 'asc' });
    });
  });

  describe('GET /v1/tags/:slug', () => {
    it('should return 200 with tag details', async () => {
      asMock(prisma.tag.findUnique).mockResolvedValue(mockTag);

      const res = await request(app).get('/v1/tags/kitchen');

      expect(res.status).toBe(200);
      expect(res.body.data).toHaveProperty('name', 'Kitchen');
    });

    it('should return 404 when tag not found', async () => {
      asMock(prisma.tag.findUnique).mockResolvedValue(null);

      const res = await request(app).get('/v1/tags/nonexistent');

      expect(res.status).toBe(404);
    });
  });

  describe('POST /v1/tags', () => {
    const createPayload = { name: 'Bedroom', slug: 'bedroom', isActive: true };

    it('should return 201 with created tag using admin token', async () => {
      const created = { ...mockTag, ...createPayload, id: 'tag-new' };
      asMock(prisma.tag.findUnique).mockResolvedValue(null);
      asMock(prisma.tag.create).mockResolvedValue(created);

      const res = await request(app)
        .post('/v1/tags')
        .set('Authorization', `Bearer ${mockAdminToken}`)
        .send(createPayload);

      expect(res.status).toBe(201);
      expect(res.body.data).toHaveProperty('slug', 'bedroom');
    });

    it('should return 401 without auth token', async () => {
      const res = await request(app).post('/v1/tags').send(createPayload);

      expect(res.status).toBe(401);
    });

    it('should return 403 for non-admin user', async () => {
      const res = await request(app)
        .post('/v1/tags')
        .set('Authorization', `Bearer ${mockUserToken}`)
        .send(createPayload);

      expect(res.status).toBe(403);
    });

    it('should return 409 when tag slug already exists', async () => {
      asMock(prisma.tag.findUnique).mockResolvedValue(mockTag);

      const res = await request(app)
        .post('/v1/tags')
        .set('Authorization', `Bearer ${mockAdminToken}`)
        .send(createPayload);

      expect(res.status).toBe(409);
    });

    it('should return 400 when name is missing', async () => {
      const res = await request(app)
        .post('/v1/tags')
        .set('Authorization', `Bearer ${mockAdminToken}`)
        .send({ ...createPayload, name: '' });

      expect(res.status).toBe(400);
    });

    it('should auto-generate slug from name when slug is not provided', async () => {
      const created = { ...mockTag, name: 'Design Tips', slug: 'design-tips', id: 'tag-2' };
      asMock(prisma.tag.findUnique).mockResolvedValue(null);
      asMock(prisma.tag.create).mockResolvedValue(created);

      const res = await request(app)
        .post('/v1/tags')
        .set('Authorization', `Bearer ${mockAdminToken}`)
        .send({ name: 'Design Tips', isActive: true });

      expect(res.status).toBe(201);
      expect(res.body.data).toHaveProperty('slug', 'design-tips');
    });
  });

  describe('PATCH /v1/tags/:id', () => {
    it('should return 200 and update the tag', async () => {
      const updated = { ...mockTag, name: 'Updated Kitchen' };
      asMock(prisma.tag.findUnique).mockResolvedValue(mockTag);
      asMock(prisma.tag.update).mockResolvedValue(updated);

      const res = await request(app)
        .patch('/v1/tags/tag-1')
        .set('Authorization', `Bearer ${mockAdminToken}`)
        .send({ name: 'Updated Kitchen' });

      expect(res.status).toBe(200);
      expect(res.body.data.name).toBe('Updated Kitchen');
    });

    it('should return 404 when tag not found', async () => {
      asMock(prisma.tag.findUnique).mockResolvedValue(null);

      const res = await request(app)
        .patch('/v1/tags/nonexistent')
        .set('Authorization', `Bearer ${mockAdminToken}`)
        .send({ name: 'x' });

      expect(res.status).toBe(404);
    });

    it('should return 401 without auth token', async () => {
      const res = await request(app).patch('/v1/tags/tag-1').send({ name: 'x' });

      expect(res.status).toBe(401);
    });
  });

  describe('DELETE /v1/tags/:id', () => {
    it('should return 204 on successful deletion', async () => {
      asMock(prisma.tag.findUnique).mockResolvedValue(mockTag);
      asMock(prisma.tag.delete).mockResolvedValue(mockTag);

      const res = await request(app)
        .delete('/v1/tags/tag-1')
        .set('Authorization', `Bearer ${mockAdminToken}`);

      expect(res.status).toBe(204);
    });

    it('should return 404 when tag not found', async () => {
      asMock(prisma.tag.findUnique).mockResolvedValue(null);

      const res = await request(app)
        .delete('/v1/tags/nonexistent')
        .set('Authorization', `Bearer ${mockAdminToken}`);

      expect(res.status).toBe(404);
    });

    it('should return 401 without auth token', async () => {
      const res = await request(app).delete('/v1/tags/tag-1');

      expect(res.status).toBe(401);
    });
  });
});