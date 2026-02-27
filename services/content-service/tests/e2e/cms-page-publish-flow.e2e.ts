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
  prisma = new PrismaClient();
  adminToken = generateAdminToken({ id: 'admin-1', role: 'ADMIN' });
});

afterAll(async () => {
  await prisma.$disconnect();
});

describe('CMS Page Publish Flow', () => {
  let createdPageId: string;

  it('creates a new draft page via CMS', async () => {
    const res = await request(app)
      .post('/v1/cms/pages')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        title: 'Our Services',
        slug: 'our-services',
        content: '<h1>Our Services</h1><p>We offer kitchen and bedroom design.</p>',
        status: 'DRAFT',
      });

    expect(res.status).toBe(201);
    expect(res.body.data.status).toBe('DRAFT');
    expect(res.body.data.slug).toBe('our-services');
    createdPageId = res.body.data.id;
  });

  it('retrieves the draft page by id', async () => {
    const res = await request(app)
      .get(`/v1/cms/pages/${createdPageId}`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data.id).toBe(createdPageId);
    expect(res.body.data.status).toBe('DRAFT');
  });

  it('updates page content before publishing', async () => {
    const res = await request(app)
      .patch(`/v1/cms/pages/${createdPageId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        content: '<h1>Our Services</h1><p>Updated content about kitchen and bedroom design services.</p>',
        metaTitle: 'Our Services | Lomash Wood',
        metaDescription: 'Explore our kitchen and bedroom design services',
      });

    expect(res.status).toBe(200);
    expect(res.body.data.content).toContain('Updated content');
  });

  it('publishes the page', async () => {
    const res = await request(app)
      .post(`/v1/cms/pages/${createdPageId}/publish`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data.status).toBe('PUBLISHED');
    expect(res.body.data.publishedAt).toBeTruthy();
  });

  it('published page is publicly accessible by slug', async () => {
    const res = await request(app)
      .get('/v1/content/pages/our-services');

    expect(res.status).toBe(200);
    expect(res.body.data.title).toBe('Our Services');
    expect(res.body.data.status).toBe('PUBLISHED');
  });

  it('rejects draft page access by unauthenticated users', async () => {
    await prisma.page.update({
      where: { id: createdPageId },
      data: { status: 'DRAFT', publishedAt: null },
    });

    const res = await request(app)
      .get('/v1/content/pages/our-services');

    expect(res.status).toBe(404);
  });

  it('unpublishes a published page', async () => {
    await prisma.page.update({
      where: { id: createdPageId },
      data: { status: 'PUBLISHED', publishedAt: new Date() },
    });

    const res = await request(app)
      .post(`/v1/cms/pages/${createdPageId}/unpublish`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data.status).toBe('DRAFT');
    expect(res.body.data.publishedAt).toBeNull();
  });

  it('deletes the page', async () => {
    const res = await request(app)
      .delete(`/v1/cms/pages/${createdPageId}`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);

    const deleted = await prisma.page.findUnique({ where: { id: createdPageId } });
    expect(deleted?.deletedAt).toBeTruthy();
  });

  it('rejects page creation without admin role', async () => {
    const userToken = generateAdminToken({ id: 'user-1', role: 'USER' });

    const res = await request(app)
      .post('/v1/cms/pages')
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        title: 'Unauthorized Page',
        slug: 'unauthorized-page',
        content: '<p>Content</p>',
        status: 'DRAFT',
      });

    expect(res.status).toBe(403);
  });

  it('validates required fields on page creation', async () => {
    const res = await request(app)
      .post('/v1/cms/pages')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        title: '',
        content: '',
      });

    expect(res.status).toBe(422);
    expect(res.body.errors).toBeDefined();
  });

  it('prevents duplicate slug on page creation', async () => {
    await prisma.page.create({
      data: {
        id: 'dup-slug-test-1',
        title: 'Existing Page',
        slug: 'existing-unique-slug',
        content: '<p>Existing</p>',
        status: 'PUBLISHED',
        publishedAt: new Date(),
      },
    });

    const res = await request(app)
      .post('/v1/cms/pages')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        title: 'Duplicate Slug Page',
        slug: 'existing-unique-slug',
        content: '<p>Content</p>',
        status: 'DRAFT',
      });

    expect(res.status).toBe(409);

    await prisma.page.delete({ where: { id: 'dup-slug-test-1' } });
  });

  it('lists all pages with pagination', async () => {
    const res = await request(app)
      .get('/v1/cms/pages?page=1&limit=10')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data.items)).toBe(true);
    expect(res.body.data.pagination).toBeDefined();
    expect(res.body.data.pagination.page).toBe(1);
  });

  it('filters pages by status', async () => {
    const res = await request(app)
      .get('/v1/cms/pages?status=PUBLISHED')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    res.body.data.items.forEach((page: any) => {
      expect(page.status).toBe('PUBLISHED');
    });
  });

  it('searches pages by title keyword', async () => {
    const res = await request(app)
      .get('/v1/cms/pages?search=About')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data.items)).toBe(true);
  });
});