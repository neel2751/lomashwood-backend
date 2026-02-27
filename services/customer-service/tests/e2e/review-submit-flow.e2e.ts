import request from 'supertest';
import { app } from '../../src/app';
import { PrismaClient } from '@prisma/client';
import { generateTestToken } from '../helpers/auth.helper';

const prisma = new PrismaClient();

describe('Review Submit Flow E2E', () => {
  let customerToken: string;
  let adminToken: string;
  const testUserId = `review-user-${Date.now()}`;
  const testProductId = `product-review-test-${Date.now()}`;
  let reviewId: string;

  beforeAll(async () => {
    customerToken = generateTestToken({ sub: testUserId, role: 'customer' });
    adminToken = generateTestToken({ sub: 'admin-review-user', role: 'admin' });

    await prisma.customerProfile.create({
      data: {
        userId: testUserId,
        firstName: 'Oliver',
        lastName: 'Green',
        email: `oliver.g.${Date.now()}@test.com`,
        phone: '+447933444555',
        isVerified: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    });
  });

  afterAll(async () => {
    await prisma.productReview.deleteMany({ where: { userId: testUserId } });
    await prisma.customerProfile.deleteMany({ where: { userId: testUserId } });
    await prisma.$disconnect();
  });

  it('submits a product review with rating and text', async () => {
    const res = await request(app)
      .post('/v1/customers/reviews')
      .set('Authorization', `Bearer ${customerToken}`)
      .send({
        productId: testProductId,
        rating: 5,
        title: 'Outstanding Kitchen Design',
        body: 'We are absolutely delighted with our new kitchen from Lomash Wood. The finish is impeccable and the installation team was professional throughout.',
        category: 'KITCHEN',
      });

    expect(res.status).toBe(201);
    expect(res.body.data.rating).toBe(5);
    expect(res.body.data.status).toBe('PENDING');
    reviewId = res.body.data.id;
  });

  it('retrieves the submitted review', async () => {
    const res = await request(app)
      .get(`/v1/customers/reviews/${reviewId}`)
      .set('Authorization', `Bearer ${customerToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data.title).toBe('Outstanding Kitchen Design');
    expect(res.body.data.productId).toBe(testProductId);
  });

  it('prevents submitting a second review for the same product', async () => {
    const res = await request(app)
      .post('/v1/customers/reviews')
      .set('Authorization', `Bearer ${customerToken}`)
      .send({
        productId: testProductId,
        rating: 3,
        title: 'Another review',
        body: 'Duplicate attempt',
        category: 'KITCHEN',
      });

    expect(res.status).toBe(409);
    expect(res.body.error).toBeDefined();
  });

  it('rejects a review with rating out of range', async () => {
    const res = await request(app)
      .post('/v1/customers/reviews')
      .set('Authorization', `Bearer ${customerToken}`)
      .send({
        productId: 'another-product',
        rating: 6,
        title: 'Bad rating',
        body: 'This should fail',
        category: 'KITCHEN',
      });

    expect(res.status).toBe(422);
  });

  it('rejects a review with too-short body', async () => {
    const res = await request(app)
      .post('/v1/customers/reviews')
      .set('Authorization', `Bearer ${customerToken}`)
      .send({
        productId: 'another-product-2',
        rating: 4,
        title: 'Short',
        body: 'Too short',
        category: 'KITCHEN',
      });

    expect(res.status).toBe(422);
  });

  it('admin approves a pending review', async () => {
    const res = await request(app)
      .patch(`/v1/customers/reviews/${reviewId}/status`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ status: 'APPROVED' });

    expect(res.status).toBe(200);
    expect(res.body.data.status).toBe('APPROVED');
  });

  it('approved review appears on public product reviews endpoint', async () => {
    const res = await request(app)
      .get(`/v1/customers/reviews/product/${testProductId}`)
      .set('Authorization', `Bearer ${customerToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data.reviews.length).toBeGreaterThan(0);
    expect(res.body.data.reviews[0].status).toBe('APPROVED');
  });

  it('customer lists their own reviews', async () => {
    const res = await request(app)
      .get('/v1/customers/reviews')
      .set('Authorization', `Bearer ${customerToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data.length).toBeGreaterThan(0);
    expect(res.body.data.every((r: { userId: string }) => r.userId === testUserId)).toBe(true);
  });

  it('admin rejects a review', async () => {
    const newReview = await request(app)
      .post('/v1/customers/reviews')
      .set('Authorization', `Bearer ${customerToken}`)
      .send({
        productId: `product-to-reject-${Date.now()}`,
        rating: 1,
        title: 'Terrible experience',
        body: 'Completely unacceptable quality and service throughout the entire project completion.',
        category: 'BEDROOM',
      });

    const rejRes = await request(app)
      .patch(`/v1/customers/reviews/${newReview.body.data.id}/status`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ status: 'REJECTED', rejectionReason: 'Violates community guidelines' });

    expect(rejRes.status).toBe(200);
    expect(rejRes.body.data.status).toBe('REJECTED');
  });

  it('returns 401 for unauthenticated review submission', async () => {
    const res = await request(app)
      .post('/v1/customers/reviews')
      .send({ productId: 'test', rating: 5, title: 'Test', body: 'Test body text here' });

    expect(res.status).toBe(401);
  });
});