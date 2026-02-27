import request from 'supertest';
import { createApp } from '../../src/app';
import { prisma } from '../../src/infrastructure/db/prisma.client';
import { mockAdminToken, mockUserToken } from '../helpers/auth.helper';
import { jest, describe, it, expect, beforeEach } from '@jest/globals';

const mockedPrisma = prisma as jest.Mocked<typeof prisma>;

jest.mock('../../src/infrastructure/db/prisma.client', () => ({
  prisma: {
    blog: {
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

const mockBlog = {
  id: 'blog-1',
  title: 'Top 10 Kitchen Design Trends for 2025',
  slug: 'top-10-kitchen-design-trends-2025',
  excerpt: 'Discover the hottest kitchen design trends shaping 2025.',
  content: '<p>Full article content here.</p>',
  coverImage: 'https://cdn.lomashwood.com/blogs/kitchen-trends.jpg',
  author: 'Lomash Wood Team',
  status: 'published',
  publishedAt: new Date('2025-03-01').toISOString(),
  tags: ['kitchen', 'design', 'trends'],
  categoryId: 'cat-1',
  metaTitle: 'Top 10 Kitchen Design Trends | Lomash Wood',
  metaDescription: 'Explore 2025 kitchen design trends.',
  readingTime: 5,
  createdAt: new Date('2025-01-01').toISOString(),
  updatedAt: new Date('2025-01-01').toISOString(),
};

describe('Blog Routes', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ─── GET /v1/blog ────────────────────────────────────────────────────────────

  describe('GET /v1/blog', () => {
    it('should return 200 with paginated published blog posts', async () => {
      mockedPrisma.blog.findMany.mockResolvedValue([mockBlog]);
      mockedPrisma.blog.count.mockResolvedValue(1);

      const res = await request(app).get('/v1/blog');

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('data');
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data[0]).toHaveProperty('slug');
    });

    it('should include pagination metadata', async () => {
      mockedPrisma.blog.findMany.mockResolvedValue([mockBlog]);
      mockedPrisma.blog.count.mockResolvedValue(1);

      const res = await request(app).get('/v1/blog');

      expect(res.body.meta).toHaveProperty('total');
      expect(res.body.meta).toHaveProperty('page');
      expect(res.body.meta).toHaveProperty('totalPages');
    });

    it('should support page and limit query params', async () => {
      mockedPrisma.blog.findMany.mockResolvedValue([]);
      mockedPrisma.blog.count.mockResolvedValue(0);

      const res = await request(app).get('/v1/blog?page=2&limit=5');

      expect(res.status).toBe(200);
      expect(res.body.meta.page).toBe(2);
      expect(res.body.meta.perPage).toBe(5);
    });

    it('should filter by category when categoryId query param provided', async () => {
      mockedPrisma.blog.findMany.mockResolvedValue([mockBlog]);
      mockedPrisma.blog.count.mockResolvedValue(1);

      const res = await request(app).get('/v1/blog?categoryId=cat-1');

      expect(res.status).toBe(200);
    });

    it('should filter by tag when tag query param provided', async () => {
      mockedPrisma.blog.findMany.mockResolvedValue([mockBlog]);
      mockedPrisma.blog.count.mockResolvedValue(1);

      const res = await request(app).get('/v1/blog?tag=kitchen');

      expect(res.status).toBe(200);
    });

    it('should not expose draft posts to unauthenticated requests', async () => {
      mockedPrisma.blog.findMany.mockResolvedValue([mockBlog]);
      mockedPrisma.blog.count.mockResolvedValue(1);

      await request(app).get('/v1/blog');

      const findManyCall = mockedPrisma.blog.findMany.mock.calls[0][0];
      expect(findManyCall.where).toHaveProperty('status', 'published');
    });

    it('should return 400 for invalid page param', async () => {
      const res = await request(app).get('/v1/blog?page=0');

      expect(res.status).toBe(400);
    });

    it('should return empty data array when no blogs exist', async () => {
      mockedPrisma.blog.findMany.mockResolvedValue([]);
      mockedPrisma.blog.count.mockResolvedValue(0);

      const res = await request(app).get('/v1/blog');

      expect(res.body.data).toHaveLength(0);
    });
  });

  // ─── GET /v1/blog/:slug ──────────────────────────────────────────────────────

  describe('GET /v1/blog/:slug', () => {
    it('should return 200 with blog post for a valid slug', async () => {
      mockedPrisma.blog.findUnique.mockResolvedValue(mockBlog);

      const res = await request(app).get('/v1/blog/top-10-kitchen-design-trends-2025');

      expect(res.status).toBe(200);
      expect(res.body.data).toHaveProperty('slug', 'top-10-kitchen-design-trends-2025');
      expect(res.body.data).toHaveProperty('title');
      expect(res.body.data).toHaveProperty('content');
    });

    it('should return 404 when blog slug does not exist', async () => {
      mockedPrisma.blog.findUnique.mockResolvedValue(null as any);

      const res = await request(app).get('/v1/blog/nonexistent-post');

      expect(res.status).toBe(404);
    });

    it('should return 404 for a draft blog post when accessed without admin token', async () => {
      const draft = { ...mockBlog, status: 'draft' };
      mockedPrisma.blog.findUnique.mockResolvedValue(draft);

      const res = await request(app).get('/v1/blog/top-10-kitchen-design-trends-2025');

      expect(res.status).toBe(404);
    });

    it('should include reading time in response', async () => {
      mockedPrisma.blog.findUnique.mockResolvedValue(mockBlog);

      const res = await request(app).get('/v1/blog/top-10-kitchen-design-trends-2025');

      expect(res.body.data).toHaveProperty('readingTime');
    });
  });

  // ─── POST /v1/blog ───────────────────────────────────────────────────────────

  describe('POST /v1/blog', () => {
    const createPayload = {
      title: 'How to Choose the Right Kitchen Layout',
      slug: 'how-to-choose-kitchen-layout',
      excerpt: 'A guide to selecting the best kitchen layout for your home.',
      content: '<p>Detailed article content.</p>',
      coverImage: 'https://cdn.lomashwood.com/blogs/kitchen-layout.jpg',
      author: 'Design Team',
      status: 'draft',
      tags: ['kitchen', 'layout'],
      categoryId: 'cat-1',
    };

    it('should return 201 with created blog post using admin token', async () => {
      const created = { ...mockBlog, ...createPayload, id: 'blog-new' };
      mockedPrisma.blog.findUnique.mockResolvedValue(null as any);
      mockedPrisma.blog.create.mockResolvedValue(created);

      const res = await request(app)
        .post('/v1/blog')
        .set('Authorization', `Bearer ${mockAdminToken}`)
        .send(createPayload);

      expect(res.status).toBe(201);
      expect(res.body.data).toHaveProperty('slug', 'how-to-choose-kitchen-layout');
    });

    it('should return 401 without auth token', async () => {
      const res = await request(app).post('/v1/blog').send(createPayload);

      expect(res.status).toBe(401);
    });

    it('should return 403 for non-admin user', async () => {
      const res = await request(app)
        .post('/v1/blog')
        .set('Authorization', `Bearer ${mockUserToken}`)
        .send(createPayload);

      expect(res.status).toBe(403);
    });

    it('should return 409 when slug already exists', async () => {
      mockedPrisma.blog.findUnique.mockResolvedValue(mockBlog);

      const res = await request(app)
        .post('/v1/blog')
        .set('Authorization', `Bearer ${mockAdminToken}`)
        .send(createPayload);

      expect(res.status).toBe(409);
    });

    it('should return 400 when title is missing', async () => {
      const res = await request(app)
        .post('/v1/blog')
        .set('Authorization', `Bearer ${mockAdminToken}`)
        .send({ ...createPayload, title: '' });

      expect(res.status).toBe(400);
    });

    it('should return 400 when content is missing', async () => {
      const res = await request(app)
        .post('/v1/blog')
        .set('Authorization', `Bearer ${mockAdminToken}`)
        .send({ ...createPayload, content: '' });

      expect(res.status).toBe(400);
    });

    it('should return 400 for invalid status value', async () => {
      const res = await request(app)
        .post('/v1/blog')
        .set('Authorization', `Bearer ${mockAdminToken}`)
        .send({ ...createPayload, status: 'invalid-status' });

      expect(res.status).toBe(400);
    });
  });

  // ─── PATCH /v1/blog/:id ──────────────────────────────────────────────────────

  describe('PATCH /v1/blog/:id', () => {
    it('should return 200 and update blog post', async () => {
      const updated = { ...mockBlog, title: 'Updated Blog Title' };
      mockedPrisma.blog.findUnique.mockResolvedValue(mockBlog);
      mockedPrisma.blog.update.mockResolvedValue(updated);

      const res = await request(app)
        .patch('/v1/blog/blog-1')
        .set('Authorization', `Bearer ${mockAdminToken}`)
        .send({ title: 'Updated Blog Title' });

      expect(res.status).toBe(200);
      expect(res.body.data).toHaveProperty('title', 'Updated Blog Title');
    });

    it('should return 200 and publish a draft post', async () => {
      const draft = { ...mockBlog, status: 'draft' };
      const published = { ...draft, status: 'published', publishedAt: new Date().toISOString() };
      mockedPrisma.blog.findUnique.mockResolvedValue(draft);
      mockedPrisma.blog.update.mockResolvedValue(published);

      const res = await request(app)
        .patch('/v1/blog/blog-1')
        .set('Authorization', `Bearer ${mockAdminToken}`)
        .send({ status: 'published' });

      expect(res.status).toBe(200);
      expect(res.body.data.status).toBe('published');
    });

    it('should return 404 when blog not found', async () => {
      mockedPrisma.blog.findUnique.mockResolvedValue(null as any);

      const res = await request(app)
        .patch('/v1/blog/nonexistent')
        .set('Authorization', `Bearer ${mockAdminToken}`)
        .send({ title: 'x' });

      expect(res.status).toBe(404);
    });

    it('should return 401 without auth token', async () => {
      const res = await request(app).patch('/v1/blog/blog-1').send({ title: 'x' });

      expect(res.status).toBe(401);
    });
  });

  // ─── DELETE /v1/blog/:id ─────────────────────────────────────────────────────

  describe('DELETE /v1/blog/:id', () => {
    it('should return 204 on successful deletion', async () => {
      mockedPrisma.blog.findUnique.mockResolvedValue(mockBlog);
      mockedPrisma.blog.delete.mockResolvedValue(mockBlog);

      const res = await request(app)
        .delete('/v1/blog/blog-1')
        .set('Authorization', `Bearer ${mockAdminToken}`);

      expect(res.status).toBe(204);
    });

    it('should return 404 when blog not found', async () => {
      mockedPrisma.blog.findUnique.mockResolvedValue(null as any);

      const res = await request(app)
        .delete('/v1/blog/nonexistent')
        .set('Authorization', `Bearer ${mockAdminToken}`);

      expect(res.status).toBe(404);
    });

    it('should return 401 without auth token', async () => {
      const res = await request(app).delete('/v1/blog/blog-1');

      expect(res.status).toBe(401);
    });

    it('should return 403 for non-admin user', async () => {
      const res = await request(app)
        .delete('/v1/blog/blog-1')
        .set('Authorization', `Bearer ${mockUserToken}`);

      expect(res.status).toBe(403);
    });
  });
});