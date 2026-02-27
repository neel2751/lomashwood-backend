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

describe('Menu Update Flow', () => {
  let mainNavMenuId: string;
  let hamburgerMenuId: string;
  let footerMenuId: string;

  it('creates the main navigation menu', async () => {
    const res = await request(app)
      .post('/v1/cms/menus')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        name: 'Main Navigation',
        location: 'HEADER_NAV',
        items: [
          { label: 'Bedroom', url: '/bedroom', position: 1, type: 'LINK' },
          { label: 'Kitchen', url: '/kitchen', position: 2, type: 'LINK' },
          { label: 'Offer a Free Consultation', url: '/book-appointment', position: 3, type: 'LINK' },
          { label: 'Find a Showroom', url: '/find-a-showroom', position: 4, type: 'LINK' },
          { label: 'My Account', url: '/account', position: 5, type: 'LINK' },
          { label: 'Finance', url: '/finance', position: 6, type: 'LINK' },
        ],
      });

    expect(res.status).toBe(201);
    expect(res.body.data.location).toBe('HEADER_NAV');
    expect(res.body.data.items).toHaveLength(6);
    mainNavMenuId = res.body.data.id;
  });

  it('creates the hamburger menu', async () => {
    const res = await request(app)
      .post('/v1/cms/menus')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        name: 'Hamburger Menu',
        location: 'HAMBURGER',
        items: [
          { label: 'Inspiration', url: '/inspiration', position: 1, type: 'LINK' },
          { label: 'Our Blog', url: '/blog', position: 2, type: 'LINK' },
          { label: 'Download Brochure', url: '/brochure-request', position: 3, type: 'LINK' },
        ],
      });

    expect(res.status).toBe(201);
    expect(res.body.data.location).toBe('HAMBURGER');
    expect(res.body.data.items).toHaveLength(3);
    hamburgerMenuId = res.body.data.id;
  });

  it('creates the footer menu', async () => {
    const res = await request(app)
      .post('/v1/cms/menus')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        name: 'Footer Links',
        location: 'FOOTER',
        items: [
          { label: 'Terms & Conditions', url: '/terms-and-conditions', position: 1, type: 'LINK' },
          { label: 'Privacy Policy', url: '/privacy-policy', position: 2, type: 'LINK' },
          { label: 'Cookies', url: '/cookies', position: 3, type: 'LINK' },
          { label: 'Contact Us', url: '/contact-us', position: 4, type: 'LINK' },
          { label: 'Sitemap', url: '/sitemap', position: 5, type: 'LINK' },
        ],
      });

    expect(res.status).toBe(201);
    expect(res.body.data.items).toHaveLength(5);
    footerMenuId = res.body.data.id;
  });

  it('retrieves a menu by its location', async () => {
    const res = await request(app)
      .get('/v1/content/menus?location=HEADER_NAV');

    expect(res.status).toBe(200);
    expect(res.body.data.location).toBe('HEADER_NAV');
    expect(Array.isArray(res.body.data.items)).toBe(true);
    expect(res.body.data.items).toHaveLength(6);
  });

  it('adds a new item to the main navigation menu', async () => {
    const res = await request(app)
      .post(`/v1/cms/menus/${mainNavMenuId}/items`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        label: 'Sale',
        url: '/sale',
        position: 7,
        type: 'LINK',
        badge: 'HOT',
      });

    expect(res.status).toBe(201);
    expect(res.body.data.label).toBe('Sale');
  });

  it('updates a menu item label and URL', async () => {
    const menuRes = await request(app)
      .get(`/v1/cms/menus/${mainNavMenuId}`)
      .set('Authorization', `Bearer ${adminToken}`);

    const firstItemId = menuRes.body.data.items[0].id;

    const res = await request(app)
      .patch(`/v1/cms/menus/${mainNavMenuId}/items/${firstItemId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        label: 'Bedroom Designs',
        url: '/bedroom-designs',
      });

    expect(res.status).toBe(200);
    expect(res.body.data.label).toBe('Bedroom Designs');
  });

  it('reorders menu items via drag-and-drop positions', async () => {
    const menuRes = await request(app)
      .get(`/v1/cms/menus/${hamburgerMenuId}`)
      .set('Authorization', `Bearer ${adminToken}`);

    const itemIds = menuRes.body.data.items.map((item: any) => item.id);

    const res = await request(app)
      .patch(`/v1/cms/menus/${hamburgerMenuId}/reorder`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        items: [
          { id: itemIds[0], position: 3 },
          { id: itemIds[1], position: 1 },
          { id: itemIds[2], position: 2 },
        ],
      });

    expect(res.status).toBe(200);
  });

  it('adds a dropdown submenu to a main nav item', async () => {
    const menuRes = await request(app)
      .get(`/v1/cms/menus/${mainNavMenuId}`)
      .set('Authorization', `Bearer ${adminToken}`);

    const kitchenItemId = menuRes.body.data.items.find((i: any) => i.url === '/kitchen')?.id;

    const res = await request(app)
      .post(`/v1/cms/menus/${mainNavMenuId}/items/${kitchenItemId}/children`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        children: [
          { label: 'All Kitchens', url: '/kitchen', position: 1 },
          { label: 'Kitchen Colours', url: '/kitchen/colours', position: 2 },
          { label: 'Kitchen Ranges', url: '/kitchen/ranges', position: 3 },
        ],
      });

    expect(res.status).toBe(201);
    expect(res.body.data.children).toHaveLength(3);
  });

  it('removes a menu item', async () => {
    const menuRes = await request(app)
      .get(`/v1/cms/menus/${footerMenuId}`)
      .set('Authorization', `Bearer ${adminToken}`);

    const lastItemId = menuRes.body.data.items[menuRes.body.data.items.length - 1].id;

    const res = await request(app)
      .delete(`/v1/cms/menus/${footerMenuId}/items/${lastItemId}`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
  });

  it('retrieves all menus in the CMS', async () => {
    const res = await request(app)
      .get('/v1/cms/menus')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data.items)).toBe(true);
    expect(res.body.data.items.length).toBeGreaterThanOrEqual(3);
  });

  it('prevents duplicate menu location assignment', async () => {
    const res = await request(app)
      .post('/v1/cms/menus')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        name: 'Duplicate Nav',
        location: 'HEADER_NAV',
        items: [],
      });

    expect(res.status).toBe(409);
  });

  it('deletes a menu and its items', async () => {
    const res = await request(app)
      .delete(`/v1/cms/menus/${footerMenuId}`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
  });
});