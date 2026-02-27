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

describe('Banner Management Flow', () => {
  let heroBannerId: string;
  let saleBannerId: string;

  it('creates a hero slider banner', async () => {
    const res = await request(app)
      .post('/v1/cms/banners')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        title: 'Discover Your Dream Kitchen',
        description: 'Explore our range of premium kitchen designs',
        imageUrl: 'https://example.com/hero-kitchen.jpg',
        buttonText: 'Explore Kitchens',
        buttonUrl: '/kitchen',
        type: 'HERO_SLIDER',
        position: 1,
        isActive: true,
        validFrom: new Date().toISOString(),
        validTo: new Date(Date.now() + 30 * 86400000).toISOString(),
      });

    expect(res.status).toBe(201);
    expect(res.body.data.type).toBe('HERO_SLIDER');
    expect(res.body.data.title).toBe('Discover Your Dream Kitchen');
    heroBannerId = res.body.data.id;
  });

  it('creates a sale/offer banner', async () => {
    const res = await request(app)
      .post('/v1/cms/banners')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        title: 'Summer Kitchen Sale - Up to 40% Off',
        description: 'Limited time offer on selected kitchen ranges',
        imageUrl: 'https://example.com/sale-banner.jpg',
        buttonText: 'View Offers',
        buttonUrl: '/sale',
        type: 'OFFER_SLIDER',
        position: 1,
        isActive: true,
        validFrom: new Date().toISOString(),
        validTo: new Date(Date.now() + 14 * 86400000).toISOString(),
        badgeText: 'LIMITED TIME',
      });

    expect(res.status).toBe(201);
    expect(res.body.data.type).toBe('OFFER_SLIDER');
    saleBannerId = res.body.data.id;
  });

  it('retrieves active hero slider banners for the home page', async () => {
    const res = await request(app)
      .get('/v1/content/banners?type=HERO_SLIDER&active=true');

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
    res.body.data.forEach((banner: any) => {
      expect(banner.isActive).toBe(true);
      expect(banner.type).toBe('HERO_SLIDER');
    });
  });

  it('retrieves active offer slider banners', async () => {
    const res = await request(app)
      .get('/v1/content/banners?type=OFFER_SLIDER&active=true');

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
  });

  it('updates banner content', async () => {
    const res = await request(app)
      .patch(`/v1/cms/banners/${heroBannerId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        title: 'Discover Your Perfect Kitchen Design',
        description: 'Updated description for dream kitchen hero banner',
        buttonText: 'View Kitchens',
      });

    expect(res.status).toBe(200);
    expect(res.body.data.title).toBe('Discover Your Perfect Kitchen Design');
  });

  it('deactivates a banner', async () => {
    const res = await request(app)
      .patch(`/v1/cms/banners/${saleBannerId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ isActive: false });

    expect(res.status).toBe(200);
    expect(res.body.data.isActive).toBe(false);
  });

  it('deactivated banner does not appear in public list', async () => {
    const res = await request(app)
      .get('/v1/content/banners?type=OFFER_SLIDER&active=true');

    expect(res.status).toBe(200);
    const ids = res.body.data.map((b: any) => b.id);
    expect(ids).not.toContain(saleBannerId);
  });

  it('reorders banner positions', async () => {
    const secondBannerRes = await request(app)
      .post('/v1/cms/banners')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        title: 'Design Your Dream Bedroom',
        imageUrl: 'https://example.com/hero-bedroom.jpg',
        buttonText: 'Explore Bedrooms',
        buttonUrl: '/bedroom',
        type: 'HERO_SLIDER',
        position: 2,
        isActive: true,
      });

    const secondBannerId = secondBannerRes.body.data.id;

    const res = await request(app)
      .patch('/v1/cms/banners/reorder')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        type: 'HERO_SLIDER',
        items: [
          { id: heroBannerId, position: 2 },
          { id: secondBannerId, position: 1 },
        ],
      });

    expect(res.status).toBe(200);

    await request(app)
      .delete(`/v1/cms/banners/${secondBannerId}`)
      .set('Authorization', `Bearer ${adminToken}`);
  });

  it('lists all banners in CMS with type filter', async () => {
    const res = await request(app)
      .get('/v1/cms/banners?type=HERO_SLIDER')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data.items)).toBe(true);
  });

  it('validates banner validity dates - validTo must be after validFrom', async () => {
    const res = await request(app)
      .post('/v1/cms/banners')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        title: 'Invalid Dates Banner',
        imageUrl: 'https://example.com/invalid.jpg',
        type: 'HERO_SLIDER',
        position: 99,
        isActive: true,
        validFrom: new Date(Date.now() + 86400000).toISOString(),
        validTo: new Date().toISOString(),
      });

    expect(res.status).toBe(422);
  });

  it('auto-expires banner past its validTo date', async () => {
    const expiredBanner = await prisma.banner.create({
      data: {
        title: 'Expired Banner',
        imageUrl: 'https://example.com/expired.jpg',
        type: 'HERO_SLIDER',
        position: 99,
        isActive: true,
        validFrom: new Date(Date.now() - 172800000),
        validTo: new Date(Date.now() - 86400000),
      },
    });

    const res = await request(app)
      .get('/v1/content/banners?type=HERO_SLIDER&active=true');

    expect(res.status).toBe(200);
    const ids = res.body.data.map((b: any) => b.id);
    expect(ids).not.toContain(expiredBanner.id);

    await prisma.banner.delete({ where: { id: expiredBanner.id } });
  });

  it('deletes a banner', async () => {
    const res = await request(app)
      .delete(`/v1/cms/banners/${saleBannerId}`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
  });
});