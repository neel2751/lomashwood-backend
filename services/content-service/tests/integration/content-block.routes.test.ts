import request from 'supertest';
import { jest, describe, it, expect, beforeEach } from '@jest/globals';
import { createApp } from '../../src/app';
import { prisma } from '../../src/infrastructure/db/prisma.client';
import { mockAdminToken, mockUserToken } from '../helpers/auth.helper';

const mockedPrisma = prisma as jest.Mocked<typeof prisma>;

jest.mock('../../src/infrastructure/db/prisma.client', () => ({
  prisma: {
    contentBlock: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      updateMany: jest.fn(),
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

const mockBlock = {
  id: 'block-1',
  key: 'home-hero-title',
  type: 'text',
  label: 'Home Hero Title',
  content: 'Design Your Dream Kitchen',
  pageSlug: 'home',
  section: 'hero',
  isActive: true,
  sortOrder: 1,
  metadata: null,
  createdAt: new Date('2025-01-01').toISOString(),
  updatedAt: new Date('2025-01-01').toISOString(),
};

describe('Content Block Routes', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ─── GET /v1/content-blocks ──────────────────────────────────────────────────

  describe('GET /v1/content-blocks', () => {
    it('should return 200 with all content blocks for admin', async () => {
      mockedPrisma.contentBlock.findMany.mockResolvedValue([mockBlock]);
      mockedPrisma.contentBlock.count.mockResolvedValue(1);

      const res = await request(app)
        .get('/v1/content-blocks')
        .set('Authorization', `Bearer ${mockAdminToken}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data[0]).toHaveProperty('key', 'home-hero-title');
    });

    it('should return 401 without auth token', async () => {
      const res = await request(app).get('/v1/content-blocks');

      expect(res.status).toBe(401);
    });

    it('should support pageSlug filter query param', async () => {
      mockedPrisma.contentBlock.findMany.mockResolvedValue([mockBlock]);
      mockedPrisma.contentBlock.count.mockResolvedValue(1);

      const res = await request(app)
        .get('/v1/content-blocks?pageSlug=home')
        .set('Authorization', `Bearer ${mockAdminToken}`);

      expect(res.status).toBe(200);
      const call = mockedPrisma.contentBlock.findMany.mock.calls[0][0];
      expect(call.where).toHaveProperty('pageSlug', 'home');
    });

    it('should support type filter query param', async () => {
      mockedPrisma.contentBlock.findMany.mockResolvedValue([mockBlock]);
      mockedPrisma.contentBlock.count.mockResolvedValue(1);

      const res = await request(app)
        .get('/v1/content-blocks?type=text')
        .set('Authorization', `Bearer ${mockAdminToken}`);

      expect(res.status).toBe(200);
    });

    it('should return 400 for invalid type filter', async () => {
      const res = await request(app)
        .get('/v1/content-blocks?type=invalid-type')
        .set('Authorization', `Bearer ${mockAdminToken}`);

      expect(res.status).toBe(400);
    });
  });

  // ─── GET /v1/content-blocks/page/:pageSlug ───────────────────────────────────

  describe('GET /v1/content-blocks/page/:pageSlug', () => {
    it('should return 200 with active blocks for page (public)', async () => {
      mockedPrisma.contentBlock.findMany.mockResolvedValue([mockBlock]);

      const res = await request(app).get('/v1/content-blocks/page/home');

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.data)).toBe(true);
    });

    it('should only return active blocks for unauthenticated requests', async () => {
      mockedPrisma.contentBlock.findMany.mockResolvedValue([mockBlock]);

      await request(app).get('/v1/content-blocks/page/home');

      const call = mockedPrisma.contentBlock.findMany.mock.calls[0][0];
      expect(call.where).toHaveProperty('pageSlug', 'home');
      expect(call.where).toHaveProperty('isActive', true);
    });

    it('should return 400 when pageSlug is empty string', async () => {
      const res = await request(app).get('/v1/content-blocks/page/ ');

      expect(res.status).toBe(400);
    });

    it('should return blocks structured by section when ?structured=true', async () => {
      mockedPrisma.contentBlock.findMany.mockResolvedValue([
        mockBlock,
        { ...mockBlock, id: 'block-2', key: 'home-hero-image', type: 'image', section: 'hero', sortOrder: 2 },
      ]);

      const res = await request(app).get('/v1/content-blocks/page/home?structured=true');

      expect(res.status).toBe(200);
      expect(res.body.data).toHaveProperty('hero');
    });

    it('should return empty array when no blocks for page', async () => {
      mockedPrisma.contentBlock.findMany.mockResolvedValue([]);

      const res = await request(app).get('/v1/content-blocks/page/nonexistent');

      expect(res.body.data).toHaveLength(0);
    });
  });

  // ─── GET /v1/content-blocks/key/:key ────────────────────────────────────────

  describe('GET /v1/content-blocks/key/:key', () => {
    it('should return 200 with block by key (public)', async () => {
      mockedPrisma.contentBlock.findUnique.mockResolvedValue(mockBlock);

      const res = await request(app).get('/v1/content-blocks/key/home-hero-title');

      expect(res.status).toBe(200);
      expect(res.body.data).toHaveProperty('content', 'Design Your Dream Kitchen');
    });

    it('should return 404 when key not found', async () => {
      mockedPrisma.contentBlock.findUnique.mockResolvedValue(null as any);

      const res = await request(app).get('/v1/content-blocks/key/nonexistent-key');

      expect(res.status).toBe(404);
    });
  });

  // ─── GET /v1/content-blocks/:id ─────────────────────────────────────────────

  describe('GET /v1/content-blocks/:id', () => {
    it('should return 200 with block by id for admin', async () => {
      mockedPrisma.contentBlock.findUnique.mockResolvedValue(mockBlock);

      const res = await request(app)
        .get('/v1/content-blocks/block-1')
        .set('Authorization', `Bearer ${mockAdminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data).toHaveProperty('key', 'home-hero-title');
    });

    it('should return 404 when block not found', async () => {
      mockedPrisma.contentBlock.findUnique.mockResolvedValue(null as any);

      const res = await request(app)
        .get('/v1/content-blocks/nonexistent')
        .set('Authorization', `Bearer ${mockAdminToken}`);

      expect(res.status).toBe(404);
    });

    it('should return 401 without auth token', async () => {
      const res = await request(app).get('/v1/content-blocks/block-1');

      expect(res.status).toBe(401);
    });
  });

  // ─── POST /v1/content-blocks ─────────────────────────────────────────────────

  describe('POST /v1/content-blocks', () => {
    const createPayload = {
      key: 'finance-hero-title',
      type: 'text',
      label: 'Finance Hero Title',
      content: 'Flexible Finance for Your Dream Kitchen',
      pageSlug: 'finance',
      section: 'hero',
      isActive: true,
      sortOrder: 1,
    };

    it('should return 201 with created block using admin token', async () => {
      const created = { ...mockBlock, ...createPayload, id: 'block-new' };
      mockedPrisma.contentBlock.findUnique.mockResolvedValue(null as any);
      mockedPrisma.contentBlock.create.mockResolvedValue(created);

      const res = await request(app)
        .post('/v1/content-blocks')
        .set('Authorization', `Bearer ${mockAdminToken}`)
        .send(createPayload);

      expect(res.status).toBe(201);
      expect(res.body.data).toHaveProperty('key', 'finance-hero-title');
    });

    it('should return 409 when key already exists', async () => {
      mockedPrisma.contentBlock.findUnique.mockResolvedValue(mockBlock);

      const res = await request(app)
        .post('/v1/content-blocks')
        .set('Authorization', `Bearer ${mockAdminToken}`)
        .send(createPayload);

      expect(res.status).toBe(409);
    });

    it('should return 400 when key is empty', async () => {
      const res = await request(app)
        .post('/v1/content-blocks')
        .set('Authorization', `Bearer ${mockAdminToken}`)
        .send({ ...createPayload, key: '' });

      expect(res.status).toBe(400);
    });

    it('should return 400 when type is invalid', async () => {
      const res = await request(app)
        .post('/v1/content-blocks')
        .set('Authorization', `Bearer ${mockAdminToken}`)
        .send({ ...createPayload, type: 'invalid-type' });

      expect(res.status).toBe(400);
    });

    it('should return 400 when content is empty', async () => {
      const res = await request(app)
        .post('/v1/content-blocks')
        .set('Authorization', `Bearer ${mockAdminToken}`)
        .send({ ...createPayload, content: '' });

      expect(res.status).toBe(400);
    });

    it('should return 400 when pageSlug is missing', async () => {
      const res = await request(app)
        .post('/v1/content-blocks')
        .set('Authorization', `Bearer ${mockAdminToken}`)
        .send({ ...createPayload, pageSlug: '' });

      expect(res.status).toBe(400);
    });

    it('should return 401 without auth token', async () => {
      const res = await request(app).post('/v1/content-blocks').send(createPayload);

      expect(res.status).toBe(401);
    });

    it('should return 403 for non-admin user', async () => {
      const res = await request(app)
        .post('/v1/content-blocks')
        .set('Authorization', `Bearer ${mockUserToken}`)
        .send(createPayload);

      expect(res.status).toBe(403);
    });
  });

  // ─── PATCH /v1/content-blocks/:id ────────────────────────────────────────────

  describe('PATCH /v1/content-blocks/:id', () => {
    it('should return 200 and update the block', async () => {
      const updated = { ...mockBlock, content: 'Updated hero title' };
      mockedPrisma.contentBlock.findUnique.mockResolvedValue(mockBlock);
      mockedPrisma.contentBlock.update.mockResolvedValue(updated);

      const res = await request(app)
        .patch('/v1/content-blocks/block-1')
        .set('Authorization', `Bearer ${mockAdminToken}`)
        .send({ content: 'Updated hero title' });

      expect(res.status).toBe(200);
      expect(res.body.data.content).toBe('Updated hero title');
    });

    it('should return 409 on key conflict with another block', async () => {
      const conflictBlock = { ...mockBlock, id: 'block-999' };
      mockedPrisma.contentBlock.findUnique
        .mockResolvedValueOnce(mockBlock)
        .mockResolvedValueOnce(conflictBlock);

      const res = await request(app)
        .patch('/v1/content-blocks/block-1')
        .set('Authorization', `Bearer ${mockAdminToken}`)
        .send({ key: 'existing-key' });

      expect(res.status).toBe(409);
    });

    it('should return 404 when block not found', async () => {
      mockedPrisma.contentBlock.findUnique.mockResolvedValue(null as any);

      const res = await request(app)
        .patch('/v1/content-blocks/nonexistent')
        .set('Authorization', `Bearer ${mockAdminToken}`)
        .send({ content: 'x' });

      expect(res.status).toBe(404);
    });

    it('should return 401 without auth token', async () => {
      const res = await request(app).patch('/v1/content-blocks/block-1').send({ content: 'x' });

      expect(res.status).toBe(401);
    });
  });

  // ─── PUT /v1/content-blocks/key/:key/content ─────────────────────────────────

  describe('PUT /v1/content-blocks/key/:key/content', () => {
    it('should return 200 and update block content by key', async () => {
      const updated = { ...mockBlock, content: 'New hero content' };
      mockedPrisma.contentBlock.findUnique.mockResolvedValue(mockBlock);
      mockedPrisma.contentBlock.update.mockResolvedValue(updated);

      const res = await request(app)
        .put('/v1/content-blocks/key/home-hero-title/content')
        .set('Authorization', `Bearer ${mockAdminToken}`)
        .send({ content: 'New hero content' });

      expect(res.status).toBe(200);
      expect(res.body.data.content).toBe('New hero content');
    });

    it('should return 404 when block key not found', async () => {
      mockedPrisma.contentBlock.findUnique.mockResolvedValue(null as any);

      const res = await request(app)
        .put('/v1/content-blocks/key/nonexistent-key/content')
        .set('Authorization', `Bearer ${mockAdminToken}`)
        .send({ content: 'value' });

      expect(res.status).toBe(404);
    });

    it('should return 400 when content is empty', async () => {
      mockedPrisma.contentBlock.findUnique.mockResolvedValue(mockBlock);

      const res = await request(app)
        .put('/v1/content-blocks/key/home-hero-title/content')
        .set('Authorization', `Bearer ${mockAdminToken}`)
        .send({ content: '' });

      expect(res.status).toBe(400);
    });

    it('should return 401 without auth token', async () => {
      const res = await request(app)
        .put('/v1/content-blocks/key/home-hero-title/content')
        .send({ content: 'value' });

      expect(res.status).toBe(401);
    });
  });

  // ─── POST /v1/content-blocks/bulk-update ─────────────────────────────────────

  describe('POST /v1/content-blocks/bulk-update', () => {
    it('should return 200 with count of updated blocks', async () => {
      mockedPrisma.$transaction.mockResolvedValue([
        { ...mockBlock, content: 'Updated 1' },
        { ...mockBlock, id: 'block-2', content: 'Updated 2' },
      ]);

      const res = await request(app)
        .post('/v1/content-blocks/bulk-update')
        .set('Authorization', `Bearer ${mockAdminToken}`)
        .send({
          items: [
            { id: 'block-1', content: 'Updated 1' },
            { id: 'block-2', content: 'Updated 2' },
          ],
        });

      expect(res.status).toBe(200);
      expect(res.body.data).toHaveProperty('updated');
      expect(typeof res.body.data.updated).toBe('number');
    });

    it('should return 400 for empty items array', async () => {
      const res = await request(app)
        .post('/v1/content-blocks/bulk-update')
        .set('Authorization', `Bearer ${mockAdminToken}`)
        .send({ items: [] });

      expect(res.status).toBe(400);
    });

    it('should return 400 when items is missing from body', async () => {
      const res = await request(app)
        .post('/v1/content-blocks/bulk-update')
        .set('Authorization', `Bearer ${mockAdminToken}`)
        .send({});

      expect(res.status).toBe(400);
    });

    it('should return 401 without auth token', async () => {
      const res = await request(app)
        .post('/v1/content-blocks/bulk-update')
        .send({ items: [{ id: 'block-1', content: 'x' }] });

      expect(res.status).toBe(401);
    });

    it('should return 403 for non-admin user', async () => {
      const res = await request(app)
        .post('/v1/content-blocks/bulk-update')
        .set('Authorization', `Bearer ${mockUserToken}`)
        .send({ items: [{ id: 'block-1', content: 'x' }] });

      expect(res.status).toBe(403);
    });
  });

  // ─── PATCH /v1/content-blocks/:id/toggle ─────────────────────────────────────

  describe('PATCH /v1/content-blocks/:id/toggle', () => {
    it('should return 200 and toggle block active state', async () => {
      const toggled = { ...mockBlock, isActive: false };
      mockedPrisma.contentBlock.findUnique.mockResolvedValue(mockBlock);
      mockedPrisma.contentBlock.update.mockResolvedValue(toggled);

      const res = await request(app)
        .patch('/v1/content-blocks/block-1/toggle')
        .set('Authorization', `Bearer ${mockAdminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.isActive).toBe(false);
    });

    it('should return 404 when block not found', async () => {
      mockedPrisma.contentBlock.findUnique.mockResolvedValue(null as any);

      const res = await request(app)
        .patch('/v1/content-blocks/nonexistent/toggle')
        .set('Authorization', `Bearer ${mockAdminToken}`);

      expect(res.status).toBe(404);
    });
  });

  // ─── DELETE /v1/content-blocks/:id ───────────────────────────────────────────

  describe('DELETE /v1/content-blocks/:id', () => {
    it('should return 204 on successful deletion', async () => {
      mockedPrisma.contentBlock.findUnique.mockResolvedValue(mockBlock);
      mockedPrisma.contentBlock.delete.mockResolvedValue(mockBlock);

      const res = await request(app)
        .delete('/v1/content-blocks/block-1')
        .set('Authorization', `Bearer ${mockAdminToken}`);

      expect(res.status).toBe(204);
    });

    it('should return 404 when block not found', async () => {
      mockedPrisma.contentBlock.findUnique.mockResolvedValue(null as any);

      const res = await request(app)
        .delete('/v1/content-blocks/nonexistent')
        .set('Authorization', `Bearer ${mockAdminToken}`);

      expect(res.status).toBe(404);
    });

    it('should return 401 without auth token', async () => {
      const res = await request(app).delete('/v1/content-blocks/block-1');

      expect(res.status).toBe(401);
    });

    it('should return 403 for non-admin user', async () => {
      const res = await request(app)
        .delete('/v1/content-blocks/block-1')
        .set('Authorization', `Bearer ${mockUserToken}`);

      expect(res.status).toBe(403);
    });
  });
});