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

describe('SEO Update Flow', () => {
  let blogSeoId: string;
  let pageSeoId: string;

  it('creates SEO metadata for a published blog post', async () => {
    const res = await request(app)
      .post('/v1/cms/seo')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        entityId: 'seed-blog-1',
        entityType: 'BLOG',
        metaTitle: 'Kitchen Design Trends 2025 | Lomash Wood Blog',
        metaDescription: 'Discover the latest kitchen design trends for 2025 with Lomash Wood.',
        canonicalUrl: 'https://lomashwood.co.uk/blog/kitchen-design-trends-2025',
        ogTitle: 'Kitchen Design Trends 2025',
        ogDescription: 'Explore the top kitchen design trends for 2025',
        ogImage: 'https://lomashwood.co.uk/images/og-kitchen-2025.jpg',
        twitterCard: 'summary_large_image',
        twitterTitle: 'Kitchen Design Trends 2025',
        twitterDescription: 'Top kitchen design trends you need to know in 2025',
        structuredData: JSON.stringify({
          '@context': 'https://schema.org',
          '@type': 'Article',
          headline: 'Kitchen Design Trends 2025',
        }),
        noIndex: false,
        noFollow: false,
      });

    expect(res.status).toBe(201);
    expect(res.body.data.entityId).toBe('seed-blog-1');
    expect(res.body.data.metaTitle).toContain('Lomash Wood Blog');
    blogSeoId = res.body.data.id;
  });

  it('retrieves SEO metadata for a blog entity', async () => {
    const res = await request(app)
      .get('/v1/cms/seo?entityId=seed-blog-1&entityType=BLOG')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data.entityId).toBe('seed-blog-1');
    expect(res.body.data.metaTitle).toBeDefined();
  });

  it('updates SEO metadata for a blog post', async () => {
    const res = await request(app)
      .patch(`/v1/cms/seo/${blogSeoId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        metaTitle: 'Updated: Kitchen Design Trends 2025 | Lomash Wood',
        metaDescription: 'Updated description for kitchen design trends 2025.',
        noIndex: false,
      });

    expect(res.status).toBe(200);
    expect(res.body.data.metaTitle).toContain('Updated:');
  });

  it('creates SEO metadata for a CMS page', async () => {
    const res = await request(app)
      .post('/v1/cms/seo')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        entityId: 'seed-page-1',
        entityType: 'PAGE',
        metaTitle: 'About Us | Lomash Wood Kitchen & Bedroom Design',
        metaDescription: 'Learn about Lomash Wood, the UK\'s leading kitchen and bedroom design specialists.',
        canonicalUrl: 'https://lomashwood.co.uk/about-us',
        ogTitle: 'About Lomash Wood',
        ogImage: 'https://lomashwood.co.uk/images/og-about.jpg',
        noIndex: false,
        noFollow: false,
      });

    expect(res.status).toBe(201);
    expect(res.body.data.entityType).toBe('PAGE');
    pageSeoId = res.body.data.id;
  });

  it('bulk updates SEO for multiple entities', async () => {
    const res = await request(app)
      .post('/v1/cms/seo/bulk-update')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        updates: [
          {
            entityId: 'seed-blog-1',
            entityType: 'BLOG',
            noIndex: false,
            noFollow: false,
          },
          {
            entityId: 'seed-page-2',
            entityType: 'PAGE',
            metaTitle: 'Why Choose Lomash Wood | Kitchen & Bedroom Design',
            metaDescription: 'Discover why thousands of UK homeowners choose Lomash Wood.',
          },
        ],
      });

    expect(res.status).toBe(200);
    expect(res.body.data.updated).toBeGreaterThanOrEqual(1);
  });

  it('generates sitemap XML endpoint', async () => {
    const res = await request(app)
      .get('/sitemap.xml');

    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toContain('xml');
    expect(res.text).toContain('<?xml');
    expect(res.text).toContain('<urlset');
  });

  it('serves robots.txt', async () => {
    const res = await request(app)
      .get('/robots.txt');

    expect(res.status).toBe(200);
    expect(res.text).toContain('User-agent:');
    expect(res.text).toContain('Sitemap:');
  });

  it('regenerates sitemap on demand', async () => {
    const res = await request(app)
      .post('/v1/cms/seo/regenerate-sitemap')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data.success).toBe(true);
  });

  it('retrieves global SEO defaults', async () => {
    const res = await request(app)
      .get('/v1/cms/seo/defaults')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data).toBeDefined();
  });

  it('updates global SEO defaults', async () => {
    const res = await request(app)
      .put('/v1/cms/seo/defaults')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        defaultMetaTitle: 'Lomash Wood | Kitchen & Bedroom Design Specialists',
        defaultMetaDescription: 'Lomash Wood offers premium kitchen and bedroom design and installation across the UK.',
        defaultOgImage: 'https://lomashwood.co.uk/images/og-default.jpg',
        googleTagManagerId: 'GTM-XXXXXXX',
        googleAnalyticsId: 'G-XXXXXXXXXX',
        googleSearchConsoleVerification: 'verification-token',
      });

    expect(res.status).toBe(200);
    expect(res.body.data.googleTagManagerId).toBe('GTM-XXXXXXX');
  });

  it('marks entity as noIndex for search engines', async () => {
    const res = await request(app)
      .patch(`/v1/cms/seo/${blogSeoId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ noIndex: true });

    expect(res.status).toBe(200);
    expect(res.body.data.noIndex).toBe(true);
  });

  it('validates metaTitle length does not exceed 60 characters', async () => {
    const res = await request(app)
      .post('/v1/cms/seo')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        entityId: 'non-existent-entity',
        entityType: 'BLOG',
        metaTitle: 'A'.repeat(61),
        metaDescription: 'Valid description',
      });

    expect(res.status).toBe(422);
  });

  it('deletes SEO metadata entry', async () => {
    const res = await request(app)
      .delete(`/v1/cms/seo/${pageSeoId}`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);

    const deleted = await prisma.seoMeta.findUnique({ where: { id: pageSeoId } });
    expect(deleted).toBeNull();
  });
});