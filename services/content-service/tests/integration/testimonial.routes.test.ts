import request from 'supertest';
import { jest, describe, it, expect, beforeEach } from '@jest/globals';
import { createApp } from '../../src/app';
import { mockAdminToken, mockUserToken } from '../helpers/auth.helper';

jest.mock('../../src/infrastructure/db/prisma.client', () => ({
  prisma: {
    testimonial: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
      aggregate: jest.fn(),
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
  mock: { calls: unknown[][] };
}

const asMock = (fn: unknown): JestMock => fn as JestMock;

const testimonialFindMany   = asMock(prisma.testimonial.findMany);
const testimonialFindUnique = asMock(prisma.testimonial.findUnique);
const testimonialCreate     = asMock(prisma.testimonial.create);
const testimonialUpdate     = asMock(prisma.testimonial.update);
const testimonialDelete     = asMock(prisma.testimonial.delete);
const testimonialCount      = asMock(prisma.testimonial.count);
const testimonialAggregate  = asMock(prisma.testimonial.aggregate);
const dbTransaction         = asMock(prisma.$transaction);

const app = createApp();

const mockTestimonial = {
  id: 'testimonial-1',
  customerName: 'Sarah Johnson',
  location: 'London',
  rating: 5,
  review: 'Absolutely love our new kitchen from Lomash Wood. Outstanding quality!',
  mediaUrl: 'https://cdn.lomashwood.com/reviews/sarah-kitchen.jpg',
  mediaType: 'image',
  productCategory: 'kitchen',
  isActive: true,
  isFeatured: false,
  sortOrder: 1,
  createdAt: new Date('2025-01-01').toISOString(),
  updatedAt: new Date('2025-01-01').toISOString(),
};

describe('Testimonial Routes', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /v1/testimonials', () => {
    it('should return 200 with active testimonials for public requests', async () => {
      testimonialFindMany.mockResolvedValue([mockTestimonial]);

      const res = await request(app).get('/v1/testimonials');

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data[0]).toHaveProperty('customerName');
    });

    it('should only return active testimonials for unauthenticated requests', async () => {
      testimonialFindMany.mockResolvedValue([mockTestimonial]);

      await request(app).get('/v1/testimonials');

      const call = testimonialFindMany.mock.calls[0][0] as Record<string, unknown>;
      expect(call.where).toHaveProperty('isActive', true);
    });

    it('should support category filter query param', async () => {
      testimonialFindMany.mockResolvedValue([mockTestimonial]);

      const res = await request(app).get('/v1/testimonials?category=kitchen');

      expect(res.status).toBe(200);
      const call = testimonialFindMany.mock.calls[0][0] as Record<string, unknown>;
      expect(call.where).toHaveProperty('productCategory', 'kitchen');
    });

    it('should return 400 for invalid category param', async () => {
      const res = await request(app).get('/v1/testimonials?category=invalid-category');

      expect(res.status).toBe(400);
    });

    it('should support featured filter query param', async () => {
      testimonialFindMany.mockResolvedValue([{ ...mockTestimonial, isFeatured: true }]);

      const res = await request(app).get('/v1/testimonials?featured=true');

      expect(res.status).toBe(200);
      const call = testimonialFindMany.mock.calls[0][0] as Record<string, unknown>;
      expect(call.where).toHaveProperty('isFeatured', true);
    });

    it('should return empty array when no testimonials exist', async () => {
      testimonialFindMany.mockResolvedValue([]);

      const res = await request(app).get('/v1/testimonials');

      expect(res.body.data).toHaveLength(0);
    });

    it('should support page and limit query params', async () => {
      testimonialFindMany.mockResolvedValue([]);
      testimonialCount.mockResolvedValue(0);

      const res = await request(app).get('/v1/testimonials?page=1&limit=5');

      expect(res.status).toBe(200);
    });
  });

  describe('GET /v1/testimonials/featured', () => {
    it('should return 200 with featured testimonials', async () => {
      testimonialFindMany.mockResolvedValue([{ ...mockTestimonial, isFeatured: true }]);

      const res = await request(app).get('/v1/testimonials/featured');

      expect(res.status).toBe(200);
      expect(res.body.data[0]).toHaveProperty('isFeatured', true);
    });

    it('should return empty array when no featured testimonials', async () => {
      testimonialFindMany.mockResolvedValue([]);

      const res = await request(app).get('/v1/testimonials/featured');

      expect(res.body.data).toHaveLength(0);
    });
  });

  describe('GET /v1/testimonials/average-rating', () => {
    it('should return 200 with average rating', async () => {
      testimonialAggregate.mockResolvedValue({ _avg: { rating: 4.7 } });

      const res = await request(app).get('/v1/testimonials/average-rating');

      expect(res.status).toBe(200);
      expect(res.body.data).toHaveProperty('averageRating');
      expect(typeof res.body.data.averageRating).toBe('number');
    });

    it('should return 0 when no testimonials exist', async () => {
      testimonialAggregate.mockResolvedValue({ _avg: { rating: null } });

      const res = await request(app).get('/v1/testimonials/average-rating');

      expect(res.status).toBe(200);
      expect(res.body.data.averageRating).toBe(0);
    });
  });

  describe('GET /v1/testimonials/:id', () => {
    it('should return 200 with testimonial by id', async () => {
      testimonialFindUnique.mockResolvedValue(mockTestimonial);

      const res = await request(app).get('/v1/testimonials/testimonial-1');

      expect(res.status).toBe(200);
      expect(res.body.data).toHaveProperty('customerName', 'Sarah Johnson');
    });

    it('should return 404 when testimonial not found', async () => {
      testimonialFindUnique.mockResolvedValue(null);

      const res = await request(app).get('/v1/testimonials/nonexistent');

      expect(res.status).toBe(404);
    });
  });

  describe('POST /v1/testimonials', () => {
    const createPayload = {
      customerName: 'James Smith',
      location: 'Manchester',
      rating: 4,
      review: 'Excellent bedroom installation. Very professional team.',
      productCategory: 'bedroom',
      isActive: true,
      isFeatured: false,
      sortOrder: 2,
    };

    it('should return 201 with created testimonial using admin token', async () => {
      testimonialCreate.mockResolvedValue({ ...mockTestimonial, ...createPayload, id: 'testimonial-new' });

      const res = await request(app)
        .post('/v1/testimonials')
        .set('Authorization', `Bearer ${mockAdminToken}`)
        .send(createPayload);

      expect(res.status).toBe(201);
      expect(res.body.data).toHaveProperty('customerName', 'James Smith');
    });

    it('should return 400 when rating is below 1', async () => {
      const res = await request(app)
        .post('/v1/testimonials')
        .set('Authorization', `Bearer ${mockAdminToken}`)
        .send({ ...createPayload, rating: 0 });

      expect(res.status).toBe(400);
    });

    it('should return 400 when rating is above 5', async () => {
      const res = await request(app)
        .post('/v1/testimonials')
        .set('Authorization', `Bearer ${mockAdminToken}`)
        .send({ ...createPayload, rating: 6 });

      expect(res.status).toBe(400);
    });

    it('should return 400 when review text is empty', async () => {
      const res = await request(app)
        .post('/v1/testimonials')
        .set('Authorization', `Bearer ${mockAdminToken}`)
        .send({ ...createPayload, review: '' });

      expect(res.status).toBe(400);
    });

    it('should return 400 when customer name is empty', async () => {
      const res = await request(app)
        .post('/v1/testimonials')
        .set('Authorization', `Bearer ${mockAdminToken}`)
        .send({ ...createPayload, customerName: '' });

      expect(res.status).toBe(400);
    });

    it('should return 400 when productCategory is invalid', async () => {
      const res = await request(app)
        .post('/v1/testimonials')
        .set('Authorization', `Bearer ${mockAdminToken}`)
        .send({ ...createPayload, productCategory: 'invalid-category' });

      expect(res.status).toBe(400);
    });

    it('should return 401 without auth token', async () => {
      const res = await request(app).post('/v1/testimonials').send(createPayload);

      expect(res.status).toBe(401);
    });

    it('should return 403 for non-admin user', async () => {
      const res = await request(app)
        .post('/v1/testimonials')
        .set('Authorization', `Bearer ${mockUserToken}`)
        .send(createPayload);

      expect(res.status).toBe(403);
    });

    it('should allow creating testimonial without optional media fields', async () => {
      const noMediaPayload = { ...createPayload };
      delete (noMediaPayload as Record<string, unknown>).mediaUrl;
      testimonialCreate.mockResolvedValue({ ...mockTestimonial, ...noMediaPayload, id: 'testimonial-nomedia', mediaUrl: null });

      const res = await request(app)
        .post('/v1/testimonials')
        .set('Authorization', `Bearer ${mockAdminToken}`)
        .send(noMediaPayload);

      expect(res.status).toBe(201);
    });
  });

  describe('PATCH /v1/testimonials/:id', () => {
    it('should return 200 and update testimonial', async () => {
      testimonialFindUnique.mockResolvedValue(mockTestimonial);
      testimonialUpdate.mockResolvedValue({ ...mockTestimonial, rating: 4, isFeatured: true });

      const res = await request(app)
        .patch('/v1/testimonials/testimonial-1')
        .set('Authorization', `Bearer ${mockAdminToken}`)
        .send({ rating: 4, isFeatured: true });

      expect(res.status).toBe(200);
      expect(res.body.data.isFeatured).toBe(true);
    });

    it('should return 400 on invalid rating update', async () => {
      testimonialFindUnique.mockResolvedValue(mockTestimonial);

      const res = await request(app)
        .patch('/v1/testimonials/testimonial-1')
        .set('Authorization', `Bearer ${mockAdminToken}`)
        .send({ rating: 10 });

      expect(res.status).toBe(400);
    });

    it('should return 404 when testimonial not found', async () => {
      testimonialFindUnique.mockResolvedValue(null);

      const res = await request(app)
        .patch('/v1/testimonials/nonexistent')
        .set('Authorization', `Bearer ${mockAdminToken}`)
        .send({ rating: 5 });

      expect(res.status).toBe(404);
    });

    it('should return 401 without auth token', async () => {
      const res = await request(app).patch('/v1/testimonials/testimonial-1').send({ rating: 5 });

      expect(res.status).toBe(401);
    });
  });

  describe('PATCH /v1/testimonials/:id/toggle-featured', () => {
    it('should return 200 and toggle featured state', async () => {
      testimonialFindUnique.mockResolvedValue(mockTestimonial);
      testimonialUpdate.mockResolvedValue({ ...mockTestimonial, isFeatured: true });

      const res = await request(app)
        .patch('/v1/testimonials/testimonial-1/toggle-featured')
        .set('Authorization', `Bearer ${mockAdminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.isFeatured).toBe(true);
    });

    it('should return 404 when testimonial not found', async () => {
      testimonialFindUnique.mockResolvedValue(null);

      const res = await request(app)
        .patch('/v1/testimonials/nonexistent/toggle-featured')
        .set('Authorization', `Bearer ${mockAdminToken}`);

      expect(res.status).toBe(404);
    });
  });

  describe('POST /v1/testimonials/reorder', () => {
    it('should return 200 after reordering', async () => {
      dbTransaction.mockResolvedValue([]);

      const res = await request(app)
        .post('/v1/testimonials/reorder')
        .set('Authorization', `Bearer ${mockAdminToken}`)
        .send({ items: [{ id: 'testimonial-1', sortOrder: 2 }, { id: 'testimonial-2', sortOrder: 1 }] });

      expect(res.status).toBe(200);
    });

    it('should return 400 for empty items array', async () => {
      const res = await request(app)
        .post('/v1/testimonials/reorder')
        .set('Authorization', `Bearer ${mockAdminToken}`)
        .send({ items: [] });

      expect(res.status).toBe(400);
    });

    it('should return 401 without auth token', async () => {
      const res = await request(app)
        .post('/v1/testimonials/reorder')
        .send({ items: [{ id: 'testimonial-1', sortOrder: 1 }] });

      expect(res.status).toBe(401);
    });
  });

  describe('DELETE /v1/testimonials/:id', () => {
    it('should return 204 on successful deletion', async () => {
      testimonialFindUnique.mockResolvedValue(mockTestimonial);
      testimonialDelete.mockResolvedValue(mockTestimonial);

      const res = await request(app)
        .delete('/v1/testimonials/testimonial-1')
        .set('Authorization', `Bearer ${mockAdminToken}`);

      expect(res.status).toBe(204);
    });

    it('should return 404 when testimonial not found', async () => {
      testimonialFindUnique.mockResolvedValue(null);

      const res = await request(app)
        .delete('/v1/testimonials/nonexistent')
        .set('Authorization', `Bearer ${mockAdminToken}`);

      expect(res.status).toBe(404);
    });

    it('should return 401 without auth token', async () => {
      const res = await request(app).delete('/v1/testimonials/testimonial-1');

      expect(res.status).toBe(401);
    });

    it('should return 403 for non-admin user', async () => {
      const res = await request(app)
        .delete('/v1/testimonials/testimonial-1')
        .set('Authorization', `Bearer ${mockUserToken}`);

      expect(res.status).toBe(403);
    });
  });
});