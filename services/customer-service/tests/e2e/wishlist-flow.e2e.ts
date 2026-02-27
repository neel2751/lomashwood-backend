import request from 'supertest';
import { app } from '../../src/app';
import { PrismaClient } from '@prisma/client';
import { generateTestToken } from '../helpers/auth.helper';

const prisma = new PrismaClient();

describe('Wishlist Flow E2E', () => {
  let authToken: string;
  const testUserId = `wishlist-user-${Date.now()}`;
  const testProductId1 = 'product-kitchen-001';
  const testProductId2 = 'product-bedroom-002';
  let wishlistItemId: string;

  beforeAll(async () => {
    authToken = generateTestToken({ sub: testUserId, role: 'customer' });

    await prisma.customerProfile.create({
      data: {
        userId: testUserId,
        firstName: 'Emma',
        lastName: 'Davies',
        email: `emma.d.${Date.now()}@test.com`,
        phone: '+447922333444',
        isVerified: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    });
  });

  afterAll(async () => {
    await prisma.wishlistItem.deleteMany({ where: { wishlist: { userId: testUserId } } });
    await prisma.wishlist.deleteMany({ where: { userId: testUserId } });
    await prisma.customerProfile.deleteMany({ where: { userId: testUserId } });
    await prisma.$disconnect();
  });

  it('retrieves an empty wishlist on first access', async () => {
    const res = await request(app)
      .get('/v1/customers/wishlist')
      .set('Authorization', `Bearer ${authToken}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data.items)).toBe(true);
    expect(res.body.data.items.length).toBe(0);
    expect(res.body.data.itemCount).toBe(0);
  });

  it('adds a kitchen product to wishlist', async () => {
    const res = await request(app)
      .post('/v1/customers/wishlist/items')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        productId: testProductId1,
        category: 'KITCHEN',
      });

    expect(res.status).toBe(201);
    expect(res.body.data.productId).toBe(testProductId1);
    expect(res.body.data.category).toBe('KITCHEN');
    wishlistItemId = res.body.data.id;
  });

  it('adds a bedroom product to wishlist', async () => {
    const res = await request(app)
      .post('/v1/customers/wishlist/items')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        productId: testProductId2,
        category: 'BEDROOM',
      });

    expect(res.status).toBe(201);
    expect(res.body.data.productId).toBe(testProductId2);
  });

  it('shows two items in wishlist', async () => {
    const res = await request(app)
      .get('/v1/customers/wishlist')
      .set('Authorization', `Bearer ${authToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data.items.length).toBe(2);
    expect(res.body.data.itemCount).toBe(2);
  });

  it('prevents duplicate wishlist items', async () => {
    const res = await request(app)
      .post('/v1/customers/wishlist/items')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        productId: testProductId1,
        category: 'KITCHEN',
      });

    expect(res.status).toBe(409);
    expect(res.body.error).toBeDefined();
  });

  it('checks if a specific product is in wishlist', async () => {
    const res = await request(app)
      .get(`/v1/customers/wishlist/check/${testProductId1}`)
      .set('Authorization', `Bearer ${authToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data.inWishlist).toBe(true);
  });

  it('checks a product not in wishlist', async () => {
    const res = await request(app)
      .get('/v1/customers/wishlist/check/not-in-wishlist-product')
      .set('Authorization', `Bearer ${authToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data.inWishlist).toBe(false);
  });

  it('removes an item from wishlist', async () => {
    const res = await request(app)
      .delete(`/v1/customers/wishlist/items/${wishlistItemId}`)
      .set('Authorization', `Bearer ${authToken}`);

    expect(res.status).toBe(204);

    const listRes = await request(app)
      .get('/v1/customers/wishlist')
      .set('Authorization', `Bearer ${authToken}`);

    expect(listRes.body.data.items.length).toBe(1);
    expect(listRes.body.data.items[0].productId).toBe(testProductId2);
  });

  it('clears all items from wishlist', async () => {
    const res = await request(app)
      .delete('/v1/customers/wishlist/items')
      .set('Authorization', `Bearer ${authToken}`);

    expect(res.status).toBe(204);

    const listRes = await request(app)
      .get('/v1/customers/wishlist')
      .set('Authorization', `Bearer ${authToken}`);

    expect(listRes.body.data.items.length).toBe(0);
    expect(listRes.body.data.itemCount).toBe(0);
  });

  it('returns 401 for unauthenticated wishlist access', async () => {
    const res = await request(app).get('/v1/customers/wishlist');
    expect(res.status).toBe(401);
  });
});