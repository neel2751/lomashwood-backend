import request from 'supertest';
import { jest, describe, it, expect, beforeEach } from '@jest/globals';
import { createApp } from '../../src/app';
import { mockAdminToken, mockUserToken } from '../helpers/auth.helper';

jest.mock('../../src/infrastructure/db/prisma.client', () => ({
  prisma: {
    menu: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    menuItem: {
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      updateMany: jest.fn(),
    },
    $transaction: jest.fn(),
    $disconnect: jest.fn(),
  },
}));

jest.mock('../../src/infrastructure/cache/redis.client', () => ({
  redis: { get: jest.fn(), set: jest.fn(), del: jest.fn(), quit: jest.fn() },
}));

import { prisma } from '../../src/infrastructure/db/prisma.client';

interface JestMock {
  mockResolvedValue: (val: unknown) => void;
  mockResolvedValueOnce: (val: unknown) => JestMock;
  mockRejectedValue: (val: unknown) => void;
  mockReturnValue: (val: unknown) => void;
  mock: { calls: unknown[][] };
}

const asMock = (fn: unknown): JestMock => fn as JestMock;

const menuFindMany = asMock(prisma.menu.findMany);
const menuFindUnique = asMock(prisma.menu.findUnique);
const menuCreate = asMock(prisma.menu.create);
const menuUpdate = asMock(prisma.menu.update);
const menuDelete = asMock(prisma.menu.delete);
const menuItemCreate = asMock(prisma.menuItem.create);
const menuItemDelete = asMock(prisma.menuItem.delete);

const app = createApp();

const mockMenu = {
  id: 'menu-1',
  name: 'Main Navigation',
  slug: 'main-navigation',
  location: 'header',
  isActive: true,
  items: [
    { id: 'item-1', menuId: 'menu-1', label: 'Home', url: '/', order: 1, parentId: null, target: '_self', isActive: true, children: [] },
    { id: 'item-2', menuId: 'menu-1', label: 'Kitchens', url: '/kitchens', order: 2, parentId: null, target: '_self', isActive: true, children: [] },
  ],
  createdAt: new Date('2025-01-01').toISOString(),
  updatedAt: new Date('2025-01-01').toISOString(),
};

describe('Menu Routes', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /v1/menus', () => {
    it('should return 200 with all menus (public)', async () => {
      menuFindMany.mockResolvedValue([mockMenu]);

      const res = await request(app).get('/v1/menus');

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.data)).toBe(true);
    });

    it('should return menus with their items nested', async () => {
      menuFindMany.mockResolvedValue([mockMenu]);

      const res = await request(app).get('/v1/menus');

      expect(res.body.data[0]).toHaveProperty('items');
      expect(Array.isArray(res.body.data[0].items)).toBe(true);
    });

    it('should support location filter query param', async () => {
      menuFindMany.mockResolvedValue([mockMenu]);

      const res = await request(app).get('/v1/menus?location=header');

      expect(res.status).toBe(200);
      const call = menuFindMany.mock.calls[0][0] as Record<string, unknown>;
      expect(call.where).toHaveProperty('location', 'header');
    });

    it('should return empty array when no menus exist', async () => {
      menuFindMany.mockResolvedValue([]);

      const res = await request(app).get('/v1/menus');

      expect(res.body.data).toHaveLength(0);
    });
  });

  describe('GET /v1/menus/:id', () => {
    it('should return 200 with menu by id', async () => {
      menuFindUnique.mockResolvedValue(mockMenu);

      const res = await request(app).get('/v1/menus/menu-1');

      expect(res.status).toBe(200);
      expect(res.body.data).toHaveProperty('id', 'menu-1');
    });

    it('should return 404 when menu not found', async () => {
      menuFindUnique.mockResolvedValue(null);

      const res = await request(app).get('/v1/menus/nonexistent');

      expect(res.status).toBe(404);
    });
  });

  describe('POST /v1/menus', () => {
    const createPayload = {
      name: 'Footer Navigation',
      slug: 'footer-navigation',
      location: 'footer',
      isActive: true,
      items: [],
    };

    it('should return 201 with created menu using admin token', async () => {
      menuFindUnique.mockResolvedValue(null);
      menuCreate.mockResolvedValue({ ...mockMenu, ...createPayload, id: 'menu-new' });

      const res = await request(app)
        .post('/v1/menus')
        .set('Authorization', `Bearer ${mockAdminToken}`)
        .send(createPayload);

      expect(res.status).toBe(201);
      expect(res.body.data).toHaveProperty('slug', 'footer-navigation');
    });

    it('should return 409 when slug already exists', async () => {
      menuFindUnique.mockResolvedValue(mockMenu);

      const res = await request(app)
        .post('/v1/menus')
        .set('Authorization', `Bearer ${mockAdminToken}`)
        .send(createPayload);

      expect(res.status).toBe(409);
    });

    it('should return 401 without auth token', async () => {
      const res = await request(app).post('/v1/menus').send(createPayload);

      expect(res.status).toBe(401);
    });

    it('should return 403 for non-admin user', async () => {
      const res = await request(app)
        .post('/v1/menus')
        .set('Authorization', `Bearer ${mockUserToken}`)
        .send(createPayload);

      expect(res.status).toBe(403);
    });

    it('should return 400 when name is missing', async () => {
      const res = await request(app)
        .post('/v1/menus')
        .set('Authorization', `Bearer ${mockAdminToken}`)
        .send({ ...createPayload, name: '' });

      expect(res.status).toBe(400);
    });

    it('should return 400 when location is invalid', async () => {
      const res = await request(app)
        .post('/v1/menus')
        .set('Authorization', `Bearer ${mockAdminToken}`)
        .send({ ...createPayload, location: 'invalid-location' });

      expect(res.status).toBe(400);
    });
  });

  describe('PATCH /v1/menus/:id', () => {
    it('should return 200 and update the menu', async () => {
      menuFindUnique.mockResolvedValue(mockMenu);
      menuUpdate.mockResolvedValue({ ...mockMenu, name: 'Updated Navigation' });

      const res = await request(app)
        .patch('/v1/menus/menu-1')
        .set('Authorization', `Bearer ${mockAdminToken}`)
        .send({ name: 'Updated Navigation' });

      expect(res.status).toBe(200);
      expect(res.body.data.name).toBe('Updated Navigation');
    });

    it('should return 404 when menu not found', async () => {
      menuFindUnique.mockResolvedValue(null);

      const res = await request(app)
        .patch('/v1/menus/nonexistent')
        .set('Authorization', `Bearer ${mockAdminToken}`)
        .send({ name: 'x' });

      expect(res.status).toBe(404);
    });

    it('should return 401 without auth token', async () => {
      const res = await request(app).patch('/v1/menus/menu-1').send({ name: 'x' });

      expect(res.status).toBe(401);
    });
  });

  describe('POST /v1/menus/:id/items', () => {
    const itemPayload = {
      label: 'Bedrooms',
      url: '/bedrooms',
      order: 3,
      target: '_self',
      isActive: true,
    };

    it('should return 201 and add item to menu', async () => {
      const updatedMenu = {
        ...mockMenu,
        items: [
          ...mockMenu.items,
          { id: 'item-3', menuId: 'menu-1', parentId: null, children: [], ...itemPayload },
        ],
      };
      menuFindUnique
        .mockResolvedValueOnce(mockMenu)
        .mockResolvedValueOnce(updatedMenu);
      menuItemCreate.mockResolvedValue({ id: 'item-3', menuId: 'menu-1', ...itemPayload });

      const res = await request(app)
        .post('/v1/menus/menu-1/items')
        .set('Authorization', `Bearer ${mockAdminToken}`)
        .send(itemPayload);

      expect(res.status).toBe(201);
    });

    it('should return 404 when menu not found', async () => {
      menuFindUnique.mockResolvedValue(null);

      const res = await request(app)
        .post('/v1/menus/nonexistent/items')
        .set('Authorization', `Bearer ${mockAdminToken}`)
        .send(itemPayload);

      expect(res.status).toBe(404);
    });

    it('should return 401 without auth token', async () => {
      const res = await request(app).post('/v1/menus/menu-1/items').send(itemPayload);

      expect(res.status).toBe(401);
    });

    it('should return 400 when label is missing', async () => {
      const res = await request(app)
        .post('/v1/menus/menu-1/items')
        .set('Authorization', `Bearer ${mockAdminToken}`)
        .send({ ...itemPayload, label: '' });

      expect(res.status).toBe(400);
    });
  });

  describe('DELETE /v1/menus/:id/items/:itemId', () => {
    it('should return 204 on successful item deletion', async () => {
      menuFindUnique.mockResolvedValue(mockMenu);
      menuItemDelete.mockResolvedValue(mockMenu.items[0]);

      const res = await request(app)
        .delete('/v1/menus/menu-1/items/item-1')
        .set('Authorization', `Bearer ${mockAdminToken}`);

      expect(res.status).toBe(204);
    });

    it('should return 404 when item not in menu', async () => {
      menuFindUnique.mockResolvedValue(mockMenu);

      const res = await request(app)
        .delete('/v1/menus/menu-1/items/nonexistent-item')
        .set('Authorization', `Bearer ${mockAdminToken}`);

      expect(res.status).toBe(404);
    });

    it('should return 401 without auth token', async () => {
      const res = await request(app).delete('/v1/menus/menu-1/items/item-1');

      expect(res.status).toBe(401);
    });
  });

  describe('DELETE /v1/menus/:id', () => {
    it('should return 204 on successful menu deletion', async () => {
      menuFindUnique.mockResolvedValue(mockMenu);
      menuDelete.mockResolvedValue(mockMenu);

      const res = await request(app)
        .delete('/v1/menus/menu-1')
        .set('Authorization', `Bearer ${mockAdminToken}`);

      expect(res.status).toBe(204);
    });

    it('should return 404 when menu not found', async () => {
      menuFindUnique.mockResolvedValue(null);

      const res = await request(app)
        .delete('/v1/menus/nonexistent')
        .set('Authorization', `Bearer ${mockAdminToken}`);

      expect(res.status).toBe(404);
    });

    it('should return 401 without auth token', async () => {
      const res = await request(app).delete('/v1/menus/menu-1');

      expect(res.status).toBe(401);
    });
  });
});