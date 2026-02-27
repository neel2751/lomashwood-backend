import request from 'supertest';
import { app } from '../../src/app';
import { PrismaClient } from '@prisma/client';
import { generateTestToken } from '../helpers/auth.helper';

const prisma = new PrismaClient();

describe('Wishlist Routes Integration', () => {
  let customerToken: string;
  let otherToken: string;
  const userId = `wishlist-integration-${Date.now()}`;
  const otherUserId = `wishlist-other-${Date.now()}`;
  const productId1 = `prod-kitchen-${Date.now()}`;
  const productId2 = `prod-bedroom-${Date.now()}`;
  let wishlistItemId: string;

  beforeAll(async () => {
    customerToken = generateTestToken({ sub: userId, role: 'customer' });
    otherToken = generateTestToken({ sub: otherUserId, role: 'customer' });

    await prisma.customerProfile.createMany({
      data: [
        {
          userId,
          firstName: 'Wishlist',
          lastName: 'Tester',
          email: `wishlist.tester.${Date.now()}@test.com`,
          phone: '+447800100200',
          isVerified: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          userId: otherUserId,
          firstName: 'Other',
          lastName: 'User',
          email: `other.user.${Date.now()}@test.com`,
          phone: '+447800300400',
          isVerified: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ],
    });
  });

  afterAll(async () => {
    await prisma.wishlistItem.deleteMany({
      where: {
        wishlist: { userId: { in: [userId, otherUserId] } },
      },
    });
    await prisma.wishlist.deleteMany({
      where: { userId: { in: [userId, otherUserId] } },
    });
    await prisma.customerProfile.deleteMany({
      where: { userId: { in: [userId, otherUserId] } },
    });
    await prisma.$disconnect();
  });

  describe('GET /v1/customers/wishlist', () => {
    it('returns 401 without auth token', async () => {
      const res = await request(app).get('/v1/customers/wishlist');
      expect(res.status).toBe(401);
    });

    it('returns empty wishlist for new user', async () => {
      const res = await request(app)
        .get('/v1/customers/wishlist')
        .set('Authorization', `Bearer ${customerToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data).toBeDefined();
      expect(Array.isArray(res.body.data.items)).toBe(true);
      expect(res.body.data.items.length).toBe(0);
      expect(res.body.data.itemCount).toBe(0);
    });

    it('returns wishlist with userId matching authenticated user', async () => {
      const res = await request(app)
        .get('/v1/customers/wishlist')
        .set('Authorization', `Bearer ${customerToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.userId).toBe(userId);
    });
  });

  describe('POST /v1/customers/wishlist/items', () => {
    it('returns 401 without auth token', async () => {
      const res = await request(app)
        .post('/v1/customers/wishlist/items')
        .send({ productId: productId1, category: 'KITCHEN' });

      expect(res.status).toBe(401);
    });

    it('adds a kitchen product to the wishlist', async () => {
      const res = await request(app)
        .post('/v1/customers/wishlist/items')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({ productId: productId1, category: 'KITCHEN' });

      expect(res.status).toBe(201);
      expect(res.body.data.productId).toBe(productId1);
      expect(res.body.data.category).toBe('KITCHEN');
      expect(res.body.data.id).toBeDefined();
      wishlistItemId = res.body.data.id;
    });

    it('adds a bedroom product to the wishlist', async () => {
      const res = await request(app)
        .post('/v1/customers/wishlist/items')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({ productId: productId2, category: 'BEDROOM' });

      expect(res.status).toBe(201);
      expect(res.body.data.productId).toBe(productId2);
      expect(res.body.data.category).toBe('BEDROOM');
    });

    it('returns 409 when adding duplicate product', async () => {
      const res = await request(app)
        .post('/v1/customers/wishlist/items')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({ productId: productId1, category: 'KITCHEN' });

      expect(res.status).toBe(409);
      expect(res.body.error).toBeDefined();
    });

    it('returns 422 when productId is missing', async () => {
      const res = await request(app)
        .post('/v1/customers/wishlist/items')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({ category: 'KITCHEN' });

      expect(res.status).toBe(422);
    });

    it('returns 422 when category is invalid', async () => {
      const res = await request(app)
        .post('/v1/customers/wishlist/items')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({ productId: 'any-product', category: 'INVALID_CATEGORY' });

      expect(res.status).toBe(422);
    });

    it('returns 422 when category is missing', async () => {
      const res = await request(app)
        .post('/v1/customers/wishlist/items')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({ productId: 'any-product' });

      expect(res.status).toBe(422);
    });
  });

  describe('GET /v1/customers/wishlist (with items)', () => {
    it('lists all added wishlist items', async () => {
      const res = await request(app)
        .get('/v1/customers/wishlist')
        .set('Authorization', `Bearer ${customerToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.items.length).toBe(2);
      expect(res.body.data.itemCount).toBe(2);
    });

    it('each item has required fields', async () => {
      const res = await request(app)
        .get('/v1/customers/wishlist')
        .set('Authorization', `Bearer ${customerToken}`);

      res.body.data.items.forEach((item: {
        id: string;
        productId: string;
        category: string;
        addedAt: string;
      }) => {
        expect(item.id).toBeDefined();
        expect(item.productId).toBeDefined();
        expect(item.category).toBeDefined();
        expect(item.addedAt).toBeDefined();
      });
    });

    it('does not return items belonging to another user', async () => {
      const res = await request(app)
        .get('/v1/customers/wishlist')
        .set('Authorization', `Bearer ${otherToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.items.length).toBe(0);
    });
  });

  describe('GET /v1/customers/wishlist/check/:productId', () => {
    it('returns true for a product in the wishlist', async () => {
      const res = await request(app)
        .get(`/v1/customers/wishlist/check/${productId1}`)
        .set('Authorization', `Bearer ${customerToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.inWishlist).toBe(true);
      expect(res.body.data.itemId).toBe(wishlistItemId);
    });

    it('returns false for a product not in the wishlist', async () => {
      const res = await request(app)
        .get('/v1/customers/wishlist/check/product-not-in-list')
        .set('Authorization', `Bearer ${customerToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.inWishlist).toBe(false);
      expect(res.body.data.itemId).toBeNull();
    });

    it('returns false for a product in another user wishlist', async () => {
      const res = await request(app)
        .get(`/v1/customers/wishlist/check/${productId1}`)
        .set('Authorization', `Bearer ${otherToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.inWishlist).toBe(false);
    });

    it('returns 401 without auth', async () => {
      const res = await request(app).get(`/v1/customers/wishlist/check/${productId1}`);
      expect(res.status).toBe(401);
    });
  });

  describe('DELETE /v1/customers/wishlist/items/:id', () => {
    it('returns 401 without auth token', async () => {
      const res = await request(app).delete(`/v1/customers/wishlist/items/${wishlistItemId}`);
      expect(res.status).toBe(401);
    });

    it('returns 404 when another user tries to delete the item', async () => {
      const res = await request(app)
        .delete(`/v1/customers/wishlist/items/${wishlistItemId}`)
        .set('Authorization', `Bearer ${otherToken}`);

      expect(res.status).toBe(404);
    });

    it('deletes a specific wishlist item', async () => {
      const res = await request(app)
        .delete(`/v1/customers/wishlist/items/${wishlistItemId}`)
        .set('Authorization', `Bearer ${customerToken}`);

      expect(res.status).toBe(204);
    });

    it('wishlist now contains one item after deletion', async () => {
      const res = await request(app)
        .get('/v1/customers/wishlist')
        .set('Authorization', `Bearer ${customerToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.items.length).toBe(1);
      expect(res.body.data.items[0].productId).toBe(productId2);
    });

    it('returns 404 for already deleted item', async () => {
      const res = await request(app)
        .delete(`/v1/customers/wishlist/items/${wishlistItemId}`)
        .set('Authorization', `Bearer ${customerToken}`);

      expect(res.status).toBe(404);
    });

    it('returns 404 for non-existent item id', async () => {
      const res = await request(app)
        .delete('/v1/customers/wishlist/items/non-existent-uuid')
        .set('Authorization', `Bearer ${customerToken}`);

      expect(res.status).toBe(404);
    });
  });

  describe('DELETE /v1/customers/wishlist/items (clear all)', () => {
    it('adds an item back before clearing', async () => {
      const addRes = await request(app)
        .post('/v1/customers/wishlist/items')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({ productId: productId1, category: 'KITCHEN' });

      expect(addRes.status).toBe(201);
    });

    it('returns 401 without auth token', async () => {
      const res = await request(app).delete('/v1/customers/wishlist/items');
      expect(res.status).toBe(401);
    });

    it('clears all items from wishlist', async () => {
      const res = await request(app)
        .delete('/v1/customers/wishlist/items')
        .set('Authorization', `Bearer ${customerToken}`);

      expect(res.status).toBe(204);
    });

    it('wishlist is empty after clearing', async () => {
      const res = await request(app)
        .get('/v1/customers/wishlist')
        .set('Authorization', `Bearer ${customerToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.items.length).toBe(0);
      expect(res.body.data.itemCount).toBe(0);
    });

    it('clearing an already empty wishlist returns 204', async () => {
      const res = await request(app)
        .delete('/v1/customers/wishlist/items')
        .set('Authorization', `Bearer ${customerToken}`);

      expect(res.status).toBe(204);
    });
  });

  describe('Wishlist pagination and filtering', () => {
    beforeAll(async () => {
      for (let i = 0; i < 5; i++) {
        await request(app)
          .post('/v1/customers/wishlist/items')
          .set('Authorization', `Bearer ${customerToken}`)
          .send({
            productId: `paginate-product-${i}-${Date.now()}`,
            category: i % 2 === 0 ? 'KITCHEN' : 'BEDROOM',
          });
      }
    });

    it('returns paginated wishlist items with limit', async () => {
      const res = await request(app)
        .get('/v1/customers/wishlist')
        .set('Authorization', `Bearer ${customerToken}`)
        .query({ limit: 2, page: 1 });

      expect(res.status).toBe(200);
      expect(res.body.data.items.length).toBeLessThanOrEqual(2);
    });

    it('filters wishlist by category KITCHEN', async () => {
      const res = await request(app)
        .get('/v1/customers/wishlist')
        .set('Authorization', `Bearer ${customerToken}`)
        .query({ category: 'KITCHEN' });

      expect(res.status).toBe(200);
      res.body.data.items.forEach((item: { category: string }) => {
        expect(item.category).toBe('KITCHEN');
      });
    });

    it('filters wishlist by category BEDROOM', async () => {
      const res = await request(app)
        .get('/v1/customers/wishlist')
        .set('Authorization', `Bearer ${customerToken}`)
        .query({ category: 'BEDROOM' });

      expect(res.status).toBe(200);
      res.body.data.items.forEach((item: { category: string }) => {
        expect(item.category).toBe('BEDROOM');
      });
    });
  });
});