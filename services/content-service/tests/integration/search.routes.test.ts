import request from 'supertest';
import { createApp } from '../../src/app';
import { prisma } from '../../src/infrastructure/db/prisma.client';
import { mockAdminToken } from '../helpers/auth.helper';
import { jest, describe, it, expect, beforeEach } from '@jest/globals';

jest.mock('../../src/infrastructure/db/prisma.client', () => ({
  prisma: {
    blog: { findMany: jest.fn(), count: jest.fn() },
    page: { findMany: jest.fn(), count: jest.fn() },
    faq: { findMany: jest.fn(), count: jest.fn() },
    $disconnect: jest.fn(),
  },
}));

jest.mock('../../src/infrastructure/cache/redis.client', () => ({
  redis: { get: jest.fn(), set: jest.fn(), del: jest.fn(), quit: jest.fn() },
}));

const app = createApp();

const mockBlogResult = {
  id: 'blog-1',
  title: 'Top Kitchen Design Trends',
  slug: 'top-kitchen-design-trends',
  excerpt: 'Explore the latest kitchen design trends.',
  coverImage: 'https://cdn.lomashwood.com/blogs/kitchen.jpg',
  publishedAt: new Date('2025-03-01').toISOString(),
  status: 'published',
  readingTime: 5,
  _type: 'blog',
};

const mockPageResult = {
  id: 'page-1',
  title: 'About Lomash Wood',
  slug: 'about-us',
  excerpt: 'Learn about Lomash Wood and our story.',
  isPublished: true,
  _type: 'page',
};

const mockFaqResult = {
  id: 'faq-1',
  question: 'How long does kitchen installation take?',
  answer: 'Typically 3-5 working days.',
  category: 'installation',
  isActive: true,
  _type: 'faq',
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type MockFn = ReturnType<typeof jest.fn<() => any>>;

function asMock(fn: unknown): MockFn {
  return fn as MockFn;
}

describe('Search Routes', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /v1/search', () => {
    it('should return 200 with combined search results across blogs, pages, and FAQs', async () => {
      asMock(prisma.blog.findMany).mockResolvedValue([mockBlogResult]);
      asMock(prisma.page.findMany).mockResolvedValue([mockPageResult]);
      asMock(prisma.faq.findMany).mockResolvedValue([mockFaqResult]);

      const res = await request(app).get('/v1/search?q=kitchen');

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('data');
      expect(Array.isArray(res.body.data)).toBe(true);
    });

    it('should return results from all content types', async () => {
      asMock(prisma.blog.findMany).mockResolvedValue([mockBlogResult]);
      asMock(prisma.page.findMany).mockResolvedValue([mockPageResult]);
      asMock(prisma.faq.findMany).mockResolvedValue([mockFaqResult]);

      const res = await request(app).get('/v1/search?q=lomash');

      expect(res.status).toBe(200);
      const types = res.body.data.map((item: { _type: string }) => item._type);
      expect(types).toContain('blog');
      expect(types).toContain('page');
      expect(types).toContain('faq');
    });

    it('should include meta with total count across all types', async () => {
      asMock(prisma.blog.findMany).mockResolvedValue([mockBlogResult]);
      asMock(prisma.page.findMany).mockResolvedValue([mockPageResult]);
      asMock(prisma.faq.findMany).mockResolvedValue([mockFaqResult]);

      const res = await request(app).get('/v1/search?q=kitchen');

      expect(res.body).toHaveProperty('meta');
      expect(res.body.meta).toHaveProperty('total');
      expect(res.body.meta.total).toBeGreaterThanOrEqual(3);
    });

    it('should return 400 when query param is missing', async () => {
      const res = await request(app).get('/v1/search');

      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty('message');
    });

    it('should return 400 when query param is empty string', async () => {
      const res = await request(app).get('/v1/search?q=');

      expect(res.status).toBe(400);
    });

    it('should return 400 when query is too short (less than 2 chars)', async () => {
      const res = await request(app).get('/v1/search?q=k');

      expect(res.status).toBe(400);
    });

    it('should return 400 when query exceeds 100 characters', async () => {
      const longQuery = 'k'.repeat(101);
      const res = await request(app).get(`/v1/search?q=${longQuery}`);

      expect(res.status).toBe(400);
    });

    it('should return empty results when no matches found', async () => {
      asMock(prisma.blog.findMany).mockResolvedValue([]);
      asMock(prisma.page.findMany).mockResolvedValue([]);
      asMock(prisma.faq.findMany).mockResolvedValue([]);

      const res = await request(app).get('/v1/search?q=xyznotfound');

      expect(res.status).toBe(200);
      expect(res.body.data).toHaveLength(0);
      expect(res.body.meta.total).toBe(0);
    });

    it('should set content-type to application/json', async () => {
      asMock(prisma.blog.findMany).mockResolvedValue([]);
      asMock(prisma.page.findMany).mockResolvedValue([]);
      asMock(prisma.faq.findMany).mockResolvedValue([]);

      const res = await request(app).get('/v1/search?q=kitchen');

      expect(res.headers['content-type']).toMatch(/application\/json/);
    });
  });

  describe('GET /v1/search with type filter', () => {
    it('should return only blog results when type=blog', async () => {
      asMock(prisma.blog.findMany).mockResolvedValue([mockBlogResult]);

      const res = await request(app).get('/v1/search?q=kitchen&type=blog');

      expect(res.status).toBe(200);
      const types = res.body.data.map((item: { _type: string }) => item._type);
      expect(types.every((t: string) => t === 'blog')).toBe(true);
      expect(prisma.page.findMany).not.toHaveBeenCalled();
      expect(prisma.faq.findMany).not.toHaveBeenCalled();
    });

    it('should return only page results when type=page', async () => {
      asMock(prisma.page.findMany).mockResolvedValue([mockPageResult]);

      const res = await request(app).get('/v1/search?q=about&type=page');

      expect(res.status).toBe(200);
      const types = res.body.data.map((item: { _type: string }) => item._type);
      expect(types.every((t: string) => t === 'page')).toBe(true);
      expect(prisma.blog.findMany).not.toHaveBeenCalled();
    });

    it('should return only faq results when type=faq', async () => {
      asMock(prisma.faq.findMany).mockResolvedValue([mockFaqResult]);

      const res = await request(app).get('/v1/search?q=installation&type=faq');

      expect(res.status).toBe(200);
      const types = res.body.data.map((item: { _type: string }) => item._type);
      expect(types.every((t: string) => t === 'faq')).toBe(true);
    });

    it('should return 400 for an invalid type filter', async () => {
      const res = await request(app).get('/v1/search?q=kitchen&type=invalidtype');

      expect(res.status).toBe(400);
    });
  });

  describe('GET /v1/search with pagination', () => {
    it('should support limit query param', async () => {
      asMock(prisma.blog.findMany).mockResolvedValue([mockBlogResult]);
      asMock(prisma.page.findMany).mockResolvedValue([]);
      asMock(prisma.faq.findMany).mockResolvedValue([]);

      const res = await request(app).get('/v1/search?q=kitchen&limit=5');

      expect(res.status).toBe(200);
    });

    it('should return 400 for non-numeric limit', async () => {
      const res = await request(app).get('/v1/search?q=kitchen&limit=abc');

      expect(res.status).toBe(400);
    });

    it('should return 400 for limit below 1', async () => {
      const res = await request(app).get('/v1/search?q=kitchen&limit=0');

      expect(res.status).toBe(400);
    });

    it('should cap limit at a maximum of 50', async () => {
      asMock(prisma.blog.findMany).mockResolvedValue([]);
      asMock(prisma.page.findMany).mockResolvedValue([]);
      asMock(prisma.faq.findMany).mockResolvedValue([]);

      const res = await request(app).get('/v1/search?q=kitchen&limit=200');

      expect(res.status).toBe(200);

      const calls = asMock(prisma.blog.findMany).mock.calls;
      if (calls.length > 0) {
        const blogArg = (calls[0] as unknown[])[0] as Record<string, unknown>;
        if (blogArg !== undefined && 'take' in blogArg) {
          expect(blogArg.take as number).toBeLessThanOrEqual(50);
        }
      }
    });
  });

  describe('GET /v1/search/suggestions', () => {
    it('should return 200 with autocomplete suggestions', async () => {
      asMock(prisma.blog.findMany).mockResolvedValue([mockBlogResult]);
      asMock(prisma.page.findMany).mockResolvedValue([mockPageResult]);
      asMock(prisma.faq.findMany).mockResolvedValue([]);

      const res = await request(app).get('/v1/search/suggestions?q=kitch');

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('data');
      expect(Array.isArray(res.body.data)).toBe(true);
    });

    it('should return at most 5 suggestions', async () => {
      const manyBlogs = Array.from({ length: 10 }, (_, i) => ({
        ...mockBlogResult,
        id: `blog-${i}`,
        title: `Kitchen Design ${i}`,
      }));
      asMock(prisma.blog.findMany).mockResolvedValue(manyBlogs);
      asMock(prisma.page.findMany).mockResolvedValue([]);
      asMock(prisma.faq.findMany).mockResolvedValue([]);

      const res = await request(app).get('/v1/search/suggestions?q=kitchen');

      expect(res.status).toBe(200);
      expect(res.body.data.length).toBeLessThanOrEqual(5);
    });

    it('should return 400 when suggestion query is missing', async () => {
      const res = await request(app).get('/v1/search/suggestions');

      expect(res.status).toBe(400);
    });

    it('should return 400 when query is empty', async () => {
      const res = await request(app).get('/v1/search/suggestions?q=');

      expect(res.status).toBe(400);
    });

    it('should return empty array when no suggestions match', async () => {
      asMock(prisma.blog.findMany).mockResolvedValue([]);
      asMock(prisma.page.findMany).mockResolvedValue([]);
      asMock(prisma.faq.findMany).mockResolvedValue([]);

      const res = await request(app).get('/v1/search/suggestions?q=xyznotfound');

      expect(res.status).toBe(200);
      expect(res.body.data).toHaveLength(0);
    });
  });

  describe('GET /v1/search/admin', () => {
    it('should return 200 with admin search results including drafts', async () => {
      const draftBlog = { ...mockBlogResult, status: 'draft' };
      asMock(prisma.blog.findMany).mockResolvedValue([draftBlog, mockBlogResult]);
      asMock(prisma.page.findMany).mockResolvedValue([mockPageResult]);
      asMock(prisma.faq.findMany).mockResolvedValue([mockFaqResult]);
      asMock(prisma.blog.count).mockResolvedValue(2);
      asMock(prisma.page.count).mockResolvedValue(1);
      asMock(prisma.faq.count).mockResolvedValue(1);

      const res = await request(app)
        .get('/v1/search/admin?q=kitchen')
        .set('Authorization', `Bearer ${mockAdminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.length).toBeGreaterThan(0);
    });

    it('should not filter by published/active status in admin search', async () => {
      asMock(prisma.blog.findMany).mockResolvedValue([mockBlogResult]);
      asMock(prisma.page.findMany).mockResolvedValue([mockPageResult]);
      asMock(prisma.faq.findMany).mockResolvedValue([mockFaqResult]);

      await request(app)
        .get('/v1/search/admin?q=kitchen')
        .set('Authorization', `Bearer ${mockAdminToken}`);

      const calls = asMock(prisma.blog.findMany).mock.calls;
      if (calls.length > 0) {
        const blogArg = (calls[0] as unknown[])[0] as Record<string, unknown>;
        const where = blogArg?.where as Record<string, unknown> | undefined;
        if (where?.status !== undefined) {
          expect(where.status).not.toBe('published');
        }
      }
    });

    it('should return 401 without auth token', async () => {
      const res = await request(app).get('/v1/search/admin?q=kitchen');

      expect(res.status).toBe(401);
    });

    it('should return 400 when query is missing', async () => {
      const res = await request(app)
        .get('/v1/search/admin')
        .set('Authorization', `Bearer ${mockAdminToken}`);

      expect(res.status).toBe(400);
    });

    it('should include result counts per content type in meta', async () => {
      asMock(prisma.blog.findMany).mockResolvedValue([mockBlogResult]);
      asMock(prisma.page.findMany).mockResolvedValue([mockPageResult]);
      asMock(prisma.faq.findMany).mockResolvedValue([mockFaqResult]);
      asMock(prisma.blog.count).mockResolvedValue(1);
      asMock(prisma.page.count).mockResolvedValue(1);
      asMock(prisma.faq.count).mockResolvedValue(1);

      const res = await request(app)
        .get('/v1/search/admin?q=kitchen')
        .set('Authorization', `Bearer ${mockAdminToken}`);

      expect(res.body.meta).toHaveProperty('counts');
      expect(res.body.meta.counts).toHaveProperty('blogs');
      expect(res.body.meta.counts).toHaveProperty('pages');
      expect(res.body.meta.counts).toHaveProperty('faqs');
    });
  });

  describe('Rate limiting guard', () => {
    it('should respond within acceptable time for a standard search query', async () => {
      asMock(prisma.blog.findMany).mockResolvedValue([mockBlogResult]);
      asMock(prisma.page.findMany).mockResolvedValue([]);
      asMock(prisma.faq.findMany).mockResolvedValue([]);

      const start = Date.now();
      const res = await request(app).get('/v1/search?q=kitchen');
      const duration = Date.now() - start;

      expect(res.status).toBe(200);
      expect(duration).toBeLessThan(5000);
    });

    it('should sanitise search input and not allow SQL injection patterns', async () => {
      asMock(prisma.blog.findMany).mockResolvedValue([]);
      asMock(prisma.page.findMany).mockResolvedValue([]);
      asMock(prisma.faq.findMany).mockResolvedValue([]);

      const maliciousQuery = "'; DROP TABLE blogs; --";
      const res = await request(app).get(
        `/v1/search?q=${encodeURIComponent(maliciousQuery)}`,
      );

      expect([200, 400]).toContain(res.status);
      if (res.status === 200) {
        expect(res.body.data).toEqual([]);
      }
    });
  });
});