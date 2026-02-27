import request from 'supertest';
import { jest, describe, it, expect, beforeEach } from '@jest/globals';
import { createApp } from '../../src/app';
import { mockAdminToken, mockUserToken } from '../helpers/auth.helper';

jest.mock('../../src/infrastructure/db/prisma.client', () => ({
  prisma: {
    page: {
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

import { prisma } from '../../src/infrastructure/db/prisma.client';

interface JestMock {
  mockResolvedValue: (val: unknown) => void;
  mockResolvedValueOnce: (val: unknown) => JestMock;
  mockRejectedValue: (val: unknown) => void;
  mock: { calls: unknown[][] };
}

const asMock = (fn: unknown): JestMock => fn as JestMock;

const pageFindMany   = asMock(prisma.page.findMany);
const pageFindUnique = asMock(prisma.page.findUnique);
const pageCreate     = asMock(prisma.page.create);
const pageUpdate     = asMock(prisma.page.update);
const pageDelete     = asMock(prisma.page.delete);
const pageCount      = asMock(prisma.page.count);

const app = createApp();

const mockPage = {
  id: 'page-1',
  title: 'About Us',
  slug: 'about-us',
  content: '<p>Welcome to Lomash Wood.</p>',
  metaTitle: 'About Us | Lomash Wood',
  metaDescription: 'Learn about Lomash Wood kitchens and bedrooms.',
  isPublished: true,
  publishedAt: new Date('2025-01-01').toISOString(),
  createdAt: new Date('2025-01-01').toISOString(),
  updatedAt: new Date('2025-01-01').toISOString(),
};

describe('Page Routes', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /v1/pages', () => {
    it('should return 200 with paginated list of published pages', async () => {
      pageFindMany.mockResolvedValue([mockPage]);
      pageCount.mockResolvedValue(1);

      const res = await request(app).get('/v1/pages');

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('data');
      expect(Array.isArray(res.body.data)).toBe(true);
    });

    it('should return 200 with pagination metadata', async () => {
      pageFindMany.mockResolvedValue([mockPage]);
      pageCount.mockResolvedValue(1);

      const res = await request(app).get('/v1/pages');

      expect(res.body).toHaveProperty('meta');
      expect(res.body.meta).toHaveProperty('total');
      expect(res.body.meta).toHaveProperty('page');
      expect(res.body.meta).toHaveProperty('perPage');
      expect(res.body.meta).toHaveProperty('totalPages');
    });

    it('should support page and limit query params', async () => {
      pageFindMany.mockResolvedValue([]);
      pageCount.mockResolvedValue(0);

      const res = await request(app).get('/v1/pages?page=2&limit=5');

      expect(res.status).toBe(200);
      expect(res.body.meta.page).toBe(2);
      expect(res.body.meta.perPage).toBe(5);
    });

    it('should return 400 for invalid page param', async () => {
      const res = await request(app).get('/v1/pages?page=-1');

      expect(res.status).toBe(400);
    });

    it('should return 400 for non-numeric limit param', async () => {
      const res = await request(app).get('/v1/pages?limit=abc');

      expect(res.status).toBe(400);
    });

    it('should return empty data array when no pages exist', async () => {
      pageFindMany.mockResolvedValue([]);
      pageCount.mockResolvedValue(0);

      const res = await request(app).get('/v1/pages');

      expect(res.status).toBe(200);
      expect(res.body.data).toHaveLength(0);
      expect(res.body.meta.total).toBe(0);
    });
  });

  describe('GET /v1/pages/:slug', () => {
    it('should return 200 with the page for a valid slug', async () => {
      pageFindUnique.mockResolvedValue(mockPage);

      const res = await request(app).get('/v1/pages/about-us');

      expect(res.status).toBe(200);
      expect(res.body.data).toHaveProperty('slug', 'about-us');
    });

    it('should return 404 when page slug does not exist', async () => {
      pageFindUnique.mockResolvedValue(null);

      const res = await request(app).get('/v1/pages/nonexistent-page');

      expect(res.status).toBe(404);
      expect(res.body).toHaveProperty('message');
    });

    it('should return 404 for an unpublished page when accessed publicly', async () => {
      pageFindUnique.mockResolvedValue({ ...mockPage, isPublished: false });

      const res = await request(app).get('/v1/pages/about-us');

      expect(res.status).toBe(404);
    });
  });

  describe('POST /v1/pages', () => {
    const createPayload = {
      title: 'Why Choose Us',
      slug: 'why-choose-us',
      content: '<p>We are the best.</p>',
      metaTitle: 'Why Choose Us | Lomash Wood',
      metaDescription: 'Discover why Lomash Wood is the right choice.',
      isPublished: false,
    };

    it('should return 201 and create a page with valid admin token', async () => {
      pageFindUnique.mockResolvedValue(null);
      pageCreate.mockResolvedValue({ ...mockPage, ...createPayload, id: 'page-new' });

      const res = await request(app)
        .post('/v1/pages')
        .set('Authorization', `Bearer ${mockAdminToken}`)
        .send(createPayload);

      expect(res.status).toBe(201);
      expect(res.body.data).toHaveProperty('slug', 'why-choose-us');
    });

    it('should return 401 when no auth token is provided', async () => {
      const res = await request(app).post('/v1/pages').send(createPayload);

      expect(res.status).toBe(401);
    });

    it('should return 403 when a non-admin user attempts to create a page', async () => {
      const res = await request(app)
        .post('/v1/pages')
        .set('Authorization', `Bearer ${mockUserToken}`)
        .send(createPayload);

      expect(res.status).toBe(403);
    });

    it('should return 409 when slug already exists', async () => {
      pageFindUnique.mockResolvedValue(mockPage);

      const res = await request(app)
        .post('/v1/pages')
        .set('Authorization', `Bearer ${mockAdminToken}`)
        .send(createPayload);

      expect(res.status).toBe(409);
    });

    it('should return 400 when title is missing', async () => {
      const res = await request(app)
        .post('/v1/pages')
        .set('Authorization', `Bearer ${mockAdminToken}`)
        .send({ ...createPayload, title: '' });

      expect(res.status).toBe(400);
    });

    it('should return 400 when slug is missing', async () => {
      const res = await request(app)
        .post('/v1/pages')
        .set('Authorization', `Bearer ${mockAdminToken}`)
        .send({ ...createPayload, slug: '' });

      expect(res.status).toBe(400);
    });

    it('should return 400 when content is missing', async () => {
      const res = await request(app)
        .post('/v1/pages')
        .set('Authorization', `Bearer ${mockAdminToken}`)
        .send({ ...createPayload, content: undefined });

      expect(res.status).toBe(400);
    });
  });

  describe('PATCH /v1/pages/:id', () => {
    it('should return 200 and update the page with valid admin token', async () => {
      pageFindUnique.mockResolvedValue(mockPage);
      pageUpdate.mockResolvedValue({ ...mockPage, title: 'Updated Title' });

      const res = await request(app)
        .patch('/v1/pages/page-1')
        .set('Authorization', `Bearer ${mockAdminToken}`)
        .send({ title: 'Updated Title' });

      expect(res.status).toBe(200);
      expect(res.body.data).toHaveProperty('title', 'Updated Title');
    });

    it('should return 404 when page not found', async () => {
      pageFindUnique.mockResolvedValue(null);

      const res = await request(app)
        .patch('/v1/pages/nonexistent')
        .set('Authorization', `Bearer ${mockAdminToken}`)
        .send({ title: 'New Title' });

      expect(res.status).toBe(404);
    });

    it('should return 401 without auth token', async () => {
      const res = await request(app).patch('/v1/pages/page-1').send({ title: 'x' });

      expect(res.status).toBe(401);
    });

    it('should return 403 for non-admin user', async () => {
      const res = await request(app)
        .patch('/v1/pages/page-1')
        .set('Authorization', `Bearer ${mockUserToken}`)
        .send({ title: 'x' });

      expect(res.status).toBe(403);
    });
  });

  describe('DELETE /v1/pages/:id', () => {
    it('should return 204 on successful deletion', async () => {
      pageFindUnique.mockResolvedValue(mockPage);
      pageDelete.mockResolvedValue(mockPage);

      const res = await request(app)
        .delete('/v1/pages/page-1')
        .set('Authorization', `Bearer ${mockAdminToken}`);

      expect(res.status).toBe(204);
    });

    it('should return 404 when page not found', async () => {
      pageFindUnique.mockResolvedValue(null);

      const res = await request(app)
        .delete('/v1/pages/nonexistent')
        .set('Authorization', `Bearer ${mockAdminToken}`);

      expect(res.status).toBe(404);
    });

    it('should return 401 without auth token', async () => {
      const res = await request(app).delete('/v1/pages/page-1');

      expect(res.status).toBe(401);
    });
  });
});