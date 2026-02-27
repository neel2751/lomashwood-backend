import request from 'supertest';
import { jest, describe, it, expect, beforeEach } from '@jest/globals';
import { createApp } from '../../src/app';
import { mockAdminToken, mockUserToken } from '../helpers/auth.helper';

jest.mock('../../src/infrastructure/db/prisma.client', () => ({
  prisma: {
    seo: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      upsert: jest.fn(),
      delete: jest.fn(),
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

const seoFindMany   = asMock(prisma.seo.findMany);
const seoFindUnique = asMock(prisma.seo.findUnique);
const seoCreate     = asMock(prisma.seo.create);
const seoUpdate     = asMock(prisma.seo.update);
const seoUpsert     = asMock(prisma.seo.upsert);
const seoDelete     = asMock(prisma.seo.delete);

const app = createApp();

const mockSeo = {
  id: 'seo-1',
  pageSlug: 'home',
  title: 'Lomash Wood | Premium Kitchen & Bedroom Design',
  description: 'Discover beautiful, bespoke kitchen and bedroom designs from Lomash Wood.',
  canonicalUrl: 'https://lomashwood.com/',
  ogTitle: 'Lomash Wood | Premium Kitchen & Bedroom Design',
  ogDescription: 'Bespoke kitchen and bedroom designs.',
  ogImage: 'https://cdn.lomashwood.com/og/home.jpg',
  twitterTitle: null,
  twitterDescription: null,
  twitterImage: null,
  structuredData: null,
  robots: 'index, follow',
  createdAt: new Date('2025-01-01').toISOString(),
  updatedAt: new Date('2025-01-01').toISOString(),
};

describe('SEO Routes', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /v1/seo', () => {
    it('should return 200 with all SEO entries for admin', async () => {
      seoFindMany.mockResolvedValue([mockSeo]);

      const res = await request(app)
        .get('/v1/seo')
        .set('Authorization', `Bearer ${mockAdminToken}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.data)).toBe(true);
    });

    it('should return 401 without auth token', async () => {
      const res = await request(app).get('/v1/seo');

      expect(res.status).toBe(401);
    });

    it('should return 403 for non-admin user', async () => {
      const res = await request(app)
        .get('/v1/seo')
        .set('Authorization', `Bearer ${mockUserToken}`);

      expect(res.status).toBe(403);
    });
  });

  describe('GET /v1/seo/:pageSlug', () => {
    it('should return 200 with SEO data for a valid page slug (public)', async () => {
      seoFindUnique.mockResolvedValue(mockSeo);

      const res = await request(app).get('/v1/seo/home');

      expect(res.status).toBe(200);
      expect(res.body.data).toHaveProperty('pageSlug', 'home');
      expect(res.body.data).toHaveProperty('title');
      expect(res.body.data).toHaveProperty('description');
    });

    it('should return 404 when no SEO data exists for page slug', async () => {
      seoFindUnique.mockResolvedValue(null);

      const res = await request(app).get('/v1/seo/nonexistent-page');

      expect(res.status).toBe(404);
    });

    it('should not expose admin-only fields in public response', async () => {
      seoFindUnique.mockResolvedValue(mockSeo);

      const res = await request(app).get('/v1/seo/home');

      expect(res.status).toBe(200);
      expect(res.body.data).not.toHaveProperty('createdAt');
      expect(res.body.data).not.toHaveProperty('updatedAt');
    });
  });

  describe('POST /v1/seo', () => {
    const createPayload = {
      pageSlug: 'about-us',
      title: 'About Us | Lomash Wood',
      description: 'Learn about Lomash Wood and our passion for kitchen design.',
      canonicalUrl: 'https://lomashwood.com/about-us',
      ogTitle: 'About Us | Lomash Wood',
      ogDescription: 'Our story and passion.',
      robots: 'index, follow',
    };

    it('should return 201 with created SEO record using admin token', async () => {
      seoFindUnique.mockResolvedValue(null);
      seoCreate.mockResolvedValue({ ...mockSeo, ...createPayload, id: 'seo-new' });

      const res = await request(app)
        .post('/v1/seo')
        .set('Authorization', `Bearer ${mockAdminToken}`)
        .send(createPayload);

      expect(res.status).toBe(201);
      expect(res.body.data).toHaveProperty('pageSlug', 'about-us');
    });

    it('should return 409 when SEO record already exists for page slug', async () => {
      seoFindUnique.mockResolvedValue(mockSeo);

      const res = await request(app)
        .post('/v1/seo')
        .set('Authorization', `Bearer ${mockAdminToken}`)
        .send(createPayload);

      expect(res.status).toBe(409);
    });

    it('should return 401 without auth token', async () => {
      const res = await request(app).post('/v1/seo').send(createPayload);

      expect(res.status).toBe(401);
    });

    it('should return 403 for non-admin user', async () => {
      const res = await request(app)
        .post('/v1/seo')
        .set('Authorization', `Bearer ${mockUserToken}`)
        .send(createPayload);

      expect(res.status).toBe(403);
    });

    it('should return 400 when pageSlug is missing', async () => {
      const res = await request(app)
        .post('/v1/seo')
        .set('Authorization', `Bearer ${mockAdminToken}`)
        .send({ ...createPayload, pageSlug: '' });

      expect(res.status).toBe(400);
    });

    it('should return 400 when title exceeds 70 characters', async () => {
      const res = await request(app)
        .post('/v1/seo')
        .set('Authorization', `Bearer ${mockAdminToken}`)
        .send({ ...createPayload, title: 'A'.repeat(71) });

      expect(res.status).toBe(400);
    });

    it('should return 400 when description exceeds 160 characters', async () => {
      const res = await request(app)
        .post('/v1/seo')
        .set('Authorization', `Bearer ${mockAdminToken}`)
        .send({ ...createPayload, description: 'A'.repeat(161) });

      expect(res.status).toBe(400);
    });
  });

  describe('PUT /v1/seo/:pageSlug', () => {
    const upsertPayload = {
      title: 'Home | Lomash Wood',
      description: 'Updated description for the home page.',
      robots: 'index, follow',
    };

    it('should return 200 and upsert SEO data', async () => {
      seoUpsert.mockResolvedValue({ ...mockSeo, ...upsertPayload });

      const res = await request(app)
        .put('/v1/seo/home')
        .set('Authorization', `Bearer ${mockAdminToken}`)
        .send(upsertPayload);

      expect(res.status).toBe(200);
      expect(res.body.data).toHaveProperty('title', 'Home | Lomash Wood');
    });

    it('should return 401 without auth token', async () => {
      const res = await request(app).put('/v1/seo/home').send(upsertPayload);

      expect(res.status).toBe(401);
    });
  });

  describe('PATCH /v1/seo/:id', () => {
    it('should return 200 and update SEO record', async () => {
      seoFindUnique.mockResolvedValue(mockSeo);
      seoUpdate.mockResolvedValue({ ...mockSeo, title: 'Updated SEO Title' });

      const res = await request(app)
        .patch('/v1/seo/seo-1')
        .set('Authorization', `Bearer ${mockAdminToken}`)
        .send({ title: 'Updated SEO Title' });

      expect(res.status).toBe(200);
      expect(res.body.data.title).toBe('Updated SEO Title');
    });

    it('should return 404 when SEO record not found', async () => {
      seoFindUnique.mockResolvedValue(null);

      const res = await request(app)
        .patch('/v1/seo/nonexistent')
        .set('Authorization', `Bearer ${mockAdminToken}`)
        .send({ title: 'x' });

      expect(res.status).toBe(404);
    });

    it('should return 401 without auth token', async () => {
      const res = await request(app).patch('/v1/seo/seo-1').send({ title: 'x' });

      expect(res.status).toBe(401);
    });
  });

  describe('DELETE /v1/seo/:id', () => {
    it('should return 204 on successful deletion', async () => {
      seoFindUnique.mockResolvedValue(mockSeo);
      seoDelete.mockResolvedValue(mockSeo);

      const res = await request(app)
        .delete('/v1/seo/seo-1')
        .set('Authorization', `Bearer ${mockAdminToken}`);

      expect(res.status).toBe(204);
    });

    it('should return 404 when SEO record not found', async () => {
      seoFindUnique.mockResolvedValue(null);

      const res = await request(app)
        .delete('/v1/seo/nonexistent')
        .set('Authorization', `Bearer ${mockAdminToken}`);

      expect(res.status).toBe(404);
    });

    it('should return 401 without auth token', async () => {
      const res = await request(app).delete('/v1/seo/seo-1');

      expect(res.status).toBe(401);
    });
  });
});