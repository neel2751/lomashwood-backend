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

describe('Blog Publish Flow', () => {
  let createdBlogId: string;
  let createdBlogSlug: string;

  it('creates a new blog post as draft', async () => {
    const res = await request(app)
      .post('/v1/cms/blogs')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        title: 'Top 10 Kitchen Design Ideas for 2026',
        slug: 'top-10-kitchen-design-ideas-2026',
        content: '<p>Detailed kitchen design ideas content.</p>',
        excerpt: 'Discover the top kitchen design trends for 2026',
        authorId: 'admin-1',
        tags: ['kitchen', 'design', 'trends'],
        categoryId: null,
        coverImage: 'https://example.com/kitchen-design.jpg',
        status: 'DRAFT',
      });

    expect(res.status).toBe(201);
    expect(res.body.data.status).toBe('DRAFT');
    expect(res.body.data.slug).toBe('top-10-kitchen-design-ideas-2026');
    createdBlogId = res.body.data.id;
    createdBlogSlug = res.body.data.slug;
  });

  it('retrieves the draft blog by id in admin panel', async () => {
    const res = await request(app)
      .get(`/v1/cms/blogs/${createdBlogId}`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data.id).toBe(createdBlogId);
    expect(res.body.data.status).toBe('DRAFT');
    expect(res.body.data.tags).toHaveLength(3);
  });

  it('updates the blog post content and metadata', async () => {
    const res = await request(app)
      .patch(`/v1/cms/blogs/${createdBlogId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        title: 'Top 10 Kitchen Design Ideas for 2026 - Updated',
        content: '<p>Updated and expanded kitchen design ideas content.</p>',
        excerpt: 'Updated excerpt for kitchen design trends 2026',
      });

    expect(res.status).toBe(200);
    expect(res.body.data.title).toContain('Updated');
  });

  it('schedules blog post for future publication', async () => {
    const scheduledDate = new Date(Date.now() + 86400000).toISOString();

    const res = await request(app)
      .post(`/v1/cms/blogs/${createdBlogId}/schedule`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ scheduledAt: scheduledDate });

    expect(res.status).toBe(200);
    expect(res.body.data.status).toBe('SCHEDULED');
    expect(res.body.data.scheduledAt).toBeTruthy();
  });

  it('publishes blog post immediately, overriding schedule', async () => {
    const res = await request(app)
      .post(`/v1/cms/blogs/${createdBlogId}/publish`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data.status).toBe('PUBLISHED');
    expect(res.body.data.publishedAt).toBeTruthy();
  });

  it('published blog is publicly accessible by slug', async () => {
    const res = await request(app)
      .get(`/v1/blog/${createdBlogSlug}`);

    expect(res.status).toBe(200);
    expect(res.body.data.slug).toBe(createdBlogSlug);
    expect(res.body.data.status).toBe('PUBLISHED');
  });

  it('lists published blogs publicly with pagination', async () => {
    const res = await request(app)
      .get('/v1/blog?page=1&limit=10');

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data.items)).toBe(true);
    expect(res.body.data.pagination).toBeDefined();
    res.body.data.items.forEach((blog: any) => {
      expect(blog.status).toBe('PUBLISHED');
    });
  });

  it('filters blogs by tag', async () => {
    const res = await request(app)
      .get('/v1/blog?tag=kitchen');

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data.items)).toBe(true);
  });

  it('admin can view all blogs regardless of status', async () => {
    const res = await request(app)
      .get('/v1/cms/blogs?status=DRAFT')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data.items)).toBe(true);
  });

  it('adds SEO metadata to the blog post', async () => {
    const res = await request(app)
      .put(`/v1/cms/blogs/${createdBlogId}/seo`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        metaTitle: 'Top 10 Kitchen Design Ideas 2026 | Lomash Wood Blog',
        metaDescription: 'Explore the top kitchen design ideas for 2026 with Lomash Wood',
        canonicalUrl: `https://lomashwood.co.uk/blog/${createdBlogSlug}`,
        ogTitle: 'Top 10 Kitchen Design Ideas 2026',
        ogImage: 'https://example.com/og-image.jpg',
      });

    expect(res.status).toBe(200);
    expect(res.body.data.seo.metaTitle).toContain('Lomash Wood Blog');
  });

  it('gets related blogs for a published post', async () => {
    const res = await request(app)
      .get(`/v1/blog/${createdBlogSlug}/related`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
  });

  it('unpublishes the blog post', async () => {
    const res = await request(app)
      .post(`/v1/cms/blogs/${createdBlogId}/unpublish`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data.status).toBe('DRAFT');
  });

  it('soft-deletes the blog post', async () => {
    const res = await request(app)
      .delete(`/v1/cms/blogs/${createdBlogId}`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);

    const deleted = await prisma.blog.findUnique({ where: { id: createdBlogId } });
    expect(deleted?.deletedAt).toBeTruthy();
  });

  it('deleted blog is not accessible publicly', async () => {
    const res = await request(app)
      .get(`/v1/blog/${createdBlogSlug}`);

    expect(res.status).toBe(404);
  });

  it('validates blog creation fields', async () => {
    const res = await request(app)
      .post('/v1/cms/blogs')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        title: '',
        slug: '',
        content: '',
        status: 'INVALID_STATUS',
      });

    expect(res.status).toBe(422);
  });
});