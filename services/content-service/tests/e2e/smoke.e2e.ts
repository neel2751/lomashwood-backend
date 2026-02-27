import request from 'supertest';
import { Application } from 'express';
import { beforeAll, describe, it, expect } from '@jest/globals';
import { createApp } from '../../src/app';
import { generateAdminToken } from '../helpers/auth.helper.ts';

let app: Application;
let adminToken: string;

beforeAll(async () => {
  app = await createApp();
  adminToken = generateAdminToken({ id: 'admin-1', role: 'ADMIN' });
});

describe('Content Service Smoke Tests', () => {
  it('health check returns 200', async () => {
    const res = await request(app).get('/health');

    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
    expect(res.body.service).toBe('content-service');
  });

  it('liveness check returns 200', async () => {
    const res = await request(app).get('/health/live');

    expect(res.status).toBe(200);
    expect(res.body.status).toBe('alive');
  });

  it('readiness check returns 200 with dependency statuses', async () => {
    const res = await request(app).get('/health/ready');

    expect(res.status).toBe(200);
    expect(res.body.database).toBe('connected');
    expect(res.body.redis).toBe('connected');
  });

  it('public blog listing endpoint is accessible', async () => {
    const res = await request(app).get('/v1/blog');

    expect(res.status).toBe(200);
    expect(res.body.data).toBeDefined();
  });

  it('public page endpoint is accessible by slug', async () => {
    const res = await request(app).get('/v1/content/pages/about-us');

    expect([200, 404]).toContain(res.status);
  });

  it('public media wall endpoint is accessible', async () => {
    const res = await request(app).get('/v1/content/media-wall');

    expect([200, 404]).toContain(res.status);
  });

  it('public FAQ listing endpoint is accessible', async () => {
    const res = await request(app).get('/v1/content/faqs');

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
  });

  it('public testimonials endpoint is accessible', async () => {
    const res = await request(app).get('/v1/content/testimonials');

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
  });

  it('public banner endpoint is accessible', async () => {
    const res = await request(app).get('/v1/content/banners?type=HERO_SLIDER');

    expect(res.status).toBe(200);
  });

  it('content search endpoint is accessible', async () => {
    const res = await request(app).get('/v1/content/search?q=kitchen');

    expect(res.status).toBe(200);
    expect(res.body.data.results).toBeDefined();
  });

  it('sitemap.xml is accessible', async () => {
    const res = await request(app).get('/sitemap.xml');

    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toContain('xml');
  });

  it('robots.txt is accessible', async () => {
    const res = await request(app).get('/robots.txt');

    expect(res.status).toBe(200);
  });

  it('CMS endpoints require authentication', async () => {
    const protectedRoutes = [
      '/v1/cms/blogs',
      '/v1/cms/pages',
      '/v1/cms/media-wall',
      '/v1/cms/banners',
      '/v1/cms/menus',
      '/v1/cms/faqs',
      '/v1/cms/testimonials',
      '/v1/cms/seo',
    ];

    for (const route of protectedRoutes) {
      const res = await request(app).get(route);
      expect(res.status).toBe(401);
    }
  });

  it('authenticated admin can access CMS overview', async () => {
    const res = await request(app)
      .get('/v1/cms/blogs')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
  });

  it('returns 404 for unknown routes', async () => {
    const res = await request(app).get('/v1/nonexistent-route-xyz');

    expect(res.status).toBe(404);
  });

  it('returns proper error format on validation failure', async () => {
    const res = await request(app)
      .post('/v1/cms/blogs')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({});

    expect(res.status).toBe(422);
    expect(res.body.errors).toBeDefined();
    expect(Array.isArray(res.body.errors)).toBe(true);
  });

  it('CORS headers are present on public routes', async () => {
    const res = await request(app)
      .get('/v1/blog')
      .set('Origin', 'https://lomashwood.co.uk');

    expect(res.headers['access-control-allow-origin']).toBeDefined();
  });
});