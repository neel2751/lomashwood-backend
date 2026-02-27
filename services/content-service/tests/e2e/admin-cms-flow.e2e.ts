import request from 'supertest';
import { Application } from 'express';
import { beforeAll, afterAll, describe, it, expect } from '@jest/globals';
import { createApp } from '../../src/app';
import { PrismaClient } from '@prisma/client';
import { generateAdminToken } from '../helpers/auth.helper.ts';

let app: Application;
let prisma: PrismaClient;
let adminToken: string;
let editorToken: string;

beforeAll(async () => {
  app = await createApp();
  prisma = new PrismaClient({
    datasources: { db: { url: process.env.DATABASE_URL } },
  });
  adminToken = generateAdminToken({ id: 'admin-1', role: 'ADMIN' });
  editorToken = generateAdminToken({ id: 'editor-1', role: 'EDITOR' });
});

afterAll(async () => {
  await prisma.$disconnect();
});

describe('Admin CMS Full Flow', () => {
  it('admin retrieves CMS dashboard content summary', async () => {
    const res = await request(app)
      .get('/v1/cms/dashboard/summary')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data.totalBlogs).toBeDefined();
    expect(res.body.data.totalPages).toBeDefined();
    expect(res.body.data.totalMediaItems).toBeDefined();
    expect(res.body.data.publishedBlogs).toBeDefined();
    expect(res.body.data.draftBlogs).toBeDefined();
  });

  it('admin accesses the complete content management overview', async () => {
    const res = await request(app)
      .get('/v1/cms/overview')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data.recentBlogs).toBeDefined();
    expect(res.body.data.recentPages).toBeDefined();
    expect(res.body.data.pendingReviews).toBeDefined();
  });

  it('admin manages the home page slider content', async () => {
    const createRes = await request(app)
      .post('/v1/cms/home-slider')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        title: 'Design Your Dream Kitchen',
        description: 'Explore premium kitchen designs crafted for modern living',
        imageUrl: 'https://example.com/hero1.jpg',
        buttonText: 'Explore Kitchens',
        buttonUrl: '/kitchen',
        position: 1,
        isActive: true,
      });

    expect(createRes.status).toBe(201);

    const sliderId = createRes.body.data.id;

    const listRes = await request(app)
      .get('/v1/content/home-slider');

    expect(listRes.status).toBe(200);
    expect(Array.isArray(listRes.body.data)).toBe(true);

    const updateRes = await request(app)
      .patch(`/v1/cms/home-slider/${sliderId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ description: 'Updated slider description for kitchen designs' });

    expect(updateRes.status).toBe(200);

    const deleteRes = await request(app)
      .delete(`/v1/cms/home-slider/${sliderId}`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(deleteRes.status).toBe(200);
  });

  it('admin manages finance content page', async () => {
    const updateRes = await request(app)
      .put('/v1/cms/pages/finance/content')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        title: 'Flexible Finance Options',
        description: 'Spread the cost of your new kitchen or bedroom with our flexible finance plans.',
        content: '<h2>Our Finance Plans</h2><p>We offer 0% finance for up to 5 years on all kitchen and bedroom orders over £5,000.</p>',
        isActive: true,
      });

    expect(updateRes.status).toBe(200);

    const publicRes = await request(app)
      .get('/v1/content/pages/finance');

    expect(publicRes.status).toBe(200);
    expect(publicRes.body.data.title).toBe('Flexible Finance Options');
  });

  it('admin manages media wall configuration', async () => {
    const updateRes = await request(app)
      .patch(`/v1/cms/media-wall/seed-media-1`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        title: 'Our Work - Media & Fireplace Walls',
        description: 'Discover our stunning media wall and fireplace installations',
        backgroundImage: 'https://example.com/media-wall-bg.jpg',
        isActive: true,
      });

    expect(updateRes.status).toBe(200);

    const publicRes = await request(app)
      .get('/v1/content/media-wall');

    expect(publicRes.status).toBe(200);
    expect(publicRes.body.data.title).toContain('Media');
  });

  it('admin manages newsletter table and subscribers', async () => {
    const listRes = await request(app)
      .get('/v1/cms/newsletter/subscribers?page=1&limit=10')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(listRes.status).toBe(200);
    expect(Array.isArray(listRes.body.data.items)).toBe(true);
    expect(listRes.body.data.pagination).toBeDefined();
  });

  it('admin manages accreditation logos', async () => {
    const createRes = await request(app)
      .post('/v1/cms/accreditations')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        name: 'Which? Trusted Trader',
        logoUrl: 'https://example.com/which-trusted.png',
        url: 'https://trustedtraders.which.co.uk',
        position: 1,
        isActive: true,
      });

    expect(createRes.status).toBe(201);
    const accredId = createRes.body.data.id;

    const publicRes = await request(app)
      .get('/v1/content/accreditations');

    expect(publicRes.status).toBe(200);
    expect(Array.isArray(publicRes.body.data)).toBe(true);

    await request(app)
      .delete(`/v1/cms/accreditations/${accredId}`)
      .set('Authorization', `Bearer ${adminToken}`);
  });

  it('admin manages brand logos', async () => {
    const createRes = await request(app)
      .post('/v1/cms/logos')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        name: 'Blum',
        logoUrl: 'https://example.com/blum-logo.png',
        position: 1,
        isActive: true,
      });

    expect(createRes.status).toBe(201);
    const logoId = createRes.body.data.id;

    const publicRes = await request(app)
      .get('/v1/content/logos');

    expect(publicRes.status).toBe(200);
    expect(Array.isArray(publicRes.body.data)).toBe(true);

    await request(app)
      .delete(`/v1/cms/logos/${logoId}`)
      .set('Authorization', `Bearer ${adminToken}`);
  });

  it('admin manages career page content', async () => {
    const updateRes = await request(app)
      .put('/v1/cms/pages/careers/content')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        title: 'Careers at Lomash Wood',
        description: 'Join our growing team of kitchen and bedroom design specialists.',
        content: '<h2>Current Openings</h2><p>We are always looking for talented individuals.</p>',
        isActive: true,
      });

    expect(updateRes.status).toBe(200);
  });

  it('editor role can create and update content but not delete', async () => {
    const createRes = await request(app)
      .post('/v1/cms/blogs')
      .set('Authorization', `Bearer ${editorToken}`)
      .send({
        title: 'Editor Created Blog',
        slug: 'editor-created-blog-' + Date.now(),
        content: '<p>Editor content</p>',
        excerpt: 'Editor excerpt',
        authorId: 'editor-1',
        status: 'DRAFT',
      });

    expect(createRes.status).toBe(201);
    const blogId = createRes.body.data.id;

    const updateRes = await request(app)
      .patch(`/v1/cms/blogs/${blogId}`)
      .set('Authorization', `Bearer ${editorToken}`)
      .send({ title: 'Updated by Editor' });

    expect(updateRes.status).toBe(200);

    const deleteRes = await request(app)
      .delete(`/v1/cms/blogs/${blogId}`)
      .set('Authorization', `Bearer ${editorToken}`);

    expect(deleteRes.status).toBe(403);

    await prisma.blog.delete({ where: { id: blogId } });
  });

  it('admin can export CMS content as JSON', async () => {
    const res = await request(app)
      .get('/v1/cms/export?types=blogs,pages')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data.blogs).toBeDefined();
    expect(res.body.data.pages).toBeDefined();
  });

  it('admin can import CMS content from JSON', async () => {
    const importPayload = {
      blogs: [
        {
          title: 'Imported Blog Post',
          slug: 'imported-blog-post-e2e-' + Date.now(),
          content: '<p>Imported content</p>',
          excerpt: 'Imported excerpt',
          status: 'DRAFT',
          authorId: 'admin-1',
        },
      ],
    };

    const res = await request(app)
      .post('/v1/cms/import')
      .set('Authorization', `Bearer ${adminToken}`)
      .send(importPayload);

    expect(res.status).toBe(200);
    expect(res.body.data.imported.blogs).toBe(1);

    const imported = await prisma.blog.findFirst({
      where: { slug: importPayload.blogs[0].slug },
    });

    if (imported) {
      await prisma.blog.delete({ where: { id: imported.id } });
    }
  });

  it('unauthenticated users cannot access CMS endpoints', async () => {
    const endpoints = [
      { method: 'get', path: '/v1/cms/dashboard/summary' },
      { method: 'get', path: '/v1/cms/blogs' },
      { method: 'post', path: '/v1/cms/blogs' },
      { method: 'get', path: '/v1/cms/pages' },
    ];

    for (const endpoint of endpoints) {
      const res = await (request(app) as any)[endpoint.method](endpoint.path);
      expect(res.status).toBe(401);
    }
  });
});