import request from 'supertest';
import { Application } from 'express';
import { beforeAll, afterAll, describe, it, expect } from '@jest/globals';
import { createApp } from '../../src/app';
import { PrismaClient } from '@prisma/client';
import { generateAdminToken } from '../helpers/auth.helper.ts';

let app: Application;
let prisma: PrismaClient;
let adminToken: string;

beforeAll(async () => {
  app = await createApp();
  prisma = new PrismaClient({
    datasources: { db: { url: process.env.DATABASE_URL } },
  });
  adminToken = generateAdminToken({ id: 'admin-1', role: 'ADMIN' });
});

afterAll(async () => {
  await prisma.$disconnect();
});

describe('Content Search Flow', () => {
  it('searches across all published content types with a keyword', async () => {
    const res = await request(app)
      .get('/v1/content/search?q=kitchen');

    expect(res.status).toBe(200);
    expect(res.body.data).toBeDefined();
    expect(Array.isArray(res.body.data.results)).toBe(true);
  });

  it('returns results grouped by content type', async () => {
    const res = await request(app)
      .get('/v1/content/search?q=design&grouped=true');

    expect(res.status).toBe(200);
    expect(res.body.data.blogs).toBeDefined();
    expect(res.body.data.pages).toBeDefined();
  });

  it('filters search results by content type blog', async () => {
    const res = await request(app)
      .get('/v1/content/search?q=kitchen&type=blog');

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data.results)).toBe(true);
    res.body.data.results.forEach((result: any) => {
      expect(result.type).toBe('blog');
    });
  });

  it('filters search results by content type page', async () => {
    const res = await request(app)
      .get('/v1/content/search?q=about&type=page');

    expect(res.status).toBe(200);
    res.body.data.results.forEach((result: any) => {
      expect(result.type).toBe('page');
    });
  });

  it('returns paginated search results', async () => {
    const res = await request(app)
      .get('/v1/content/search?q=design&page=1&limit=5');

    expect(res.status).toBe(200);
    expect(res.body.data.pagination).toBeDefined();
    expect(res.body.data.pagination.page).toBe(1);
    expect(res.body.data.pagination.limit).toBe(5);
  });

  it('returns empty results for a non-existent keyword', async () => {
    const res = await request(app)
      .get('/v1/content/search?q=xyznonexistentterm12345');

    expect(res.status).toBe(200);
    expect(res.body.data.results).toHaveLength(0);
    expect(res.body.data.total).toBe(0);
  });

  it('only returns published/active content in search results', async () => {
    const draftBlog = await prisma.blog.create({
      data: {
        id: 'search-draft-blog',
        title: 'SearchableDraftOnlyBlog',
        slug: 'searchable-draft-only-blog',
        content: '<p>Draft content for search test</p>',
        excerpt: 'Draft excerpt',
        status: 'DRAFT',
        authorId: 'admin-1',
        publishedAt: null,
      },
    });

    const res = await request(app)
      .get('/v1/content/search?q=SearchableDraftOnlyBlog');

    expect(res.status).toBe(200);
    const ids = res.body.data.results.map((r: any) => r.id);
    expect(ids).not.toContain(draftBlog.id);

    await prisma.blog.delete({ where: { id: 'search-draft-blog' } });
  });

  it('returns search results with relevance scores', async () => {
    const res = await request(app)
      .get('/v1/content/search?q=kitchen&sortBy=relevance');

    expect(res.status).toBe(200);
    if (res.body.data.results.length > 1) {
      const scores = res.body.data.results.map((r: any) => r.score);
      for (let i = 0; i < scores.length - 1; i++) {
        expect(scores[i]).toBeGreaterThanOrEqual(scores[i + 1]);
      }
    }
  });

  it('handles special characters in search query', async () => {
    const res = await request(app)
      .get('/v1/content/search?q=kitchen%20%26%20bedroom');

    expect(res.status).toBe(200);
    expect(res.body.data.results).toBeDefined();
  });

  it('rejects search queries shorter than 2 characters', async () => {
    const res = await request(app)
      .get('/v1/content/search?q=a');

    expect(res.status).toBe(422);
    expect(res.body.errors).toBeDefined();
  });

  it('performs full-text search on blog titles and content', async () => {
    const res = await request(app)
      .get('/v1/content/search?q=kitchen+design+trends');

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data.results)).toBe(true);
  });

  it('searches FAQs by keyword', async () => {
    const res = await request(app)
      .get('/v1/content/search?q=consultation&type=faq');

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data.results)).toBe(true);
  });

  it('admin content search includes draft content', async () => {
    const res = await request(app)
      .get('/v1/cms/search?q=bedroom&includeDrafts=true')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data.results).toBeDefined();
  });

  it('returns search suggestions for partial queries', async () => {
    const res = await request(app)
      .get('/v1/content/search/suggestions?q=kitch');

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
  });
});