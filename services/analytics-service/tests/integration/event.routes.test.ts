import request from 'supertest';
import app from '../../src/app';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient({
  datasources: { db: { url: process.env.TEST_DATABASE_URL } },
});

describe('Event Routes', () => {
  afterAll(async () => { await prisma.$disconnect(); });

  describe('POST /api/v1/analytics/events', () => {
    it('should track a new event and return 201', async () => {
      const res = await request(app)
        .post('/api/v1/analytics/events')
        .set('Authorization', `Bearer ${process.env.TEST_SERVICE_TOKEN}`)
        .send({
          name: 'product_viewed',
          userId: 'user-001',
          sessionId: 'session-001',
          properties: { productId: 'prod-001', category: 'kitchen' },
          timestamp: new Date().toISOString(),
        })
        .expect(201);

      expect(res.body.success).toBe(true);
      expect(res.body.data.name).toBe('product_viewed');
    });

    it('should return 400 for missing event name', async () => {
      const res = await request(app)
        .post('/api/v1/analytics/events')
        .set('Authorization', `Bearer ${process.env.TEST_SERVICE_TOKEN}`)
        .send({ userId: 'user-001', sessionId: 'session-001' })
        .expect(400);

      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('should return 401 without auth token', async () => {
      await request(app)
        .post('/api/v1/analytics/events')
        .send({ name: 'product_viewed', userId: 'user-001' })
        .expect(401);
    });

    it('should track event without userId (anonymous)', async () => {
      const res = await request(app)
        .post('/api/v1/analytics/events')
        .set('Authorization', `Bearer ${process.env.TEST_SERVICE_TOKEN}`)
        .send({
          name: 'page_viewed',
          sessionId: 'anon-session-001',
          properties: { path: '/kitchens' },
          timestamp: new Date().toISOString(),
        })
        .expect(201);

      expect(res.body.data.userId).toBeNull();
    });

    it('should track batch of events', async () => {
      const res = await request(app)
        .post('/api/v1/analytics/events/batch')
        .set('Authorization', `Bearer ${process.env.TEST_SERVICE_TOKEN}`)
        .send({
          events: [
            { name: 'product_viewed', sessionId: 'session-002', properties: { productId: 'prod-001' }, timestamp: new Date().toISOString() },
            { name: 'product_viewed', sessionId: 'session-002', properties: { productId: 'prod-002' }, timestamp: new Date().toISOString() },
            { name: 'cta_clicked', sessionId: 'session-002', properties: { cta: 'book_consultation' }, timestamp: new Date().toISOString() },
          ],
        })
        .expect(202);

      expect(res.body.data.accepted).toBe(3);
    });
  });

  describe('GET /api/v1/analytics/events', () => {
    it('should return paginated events list', async () => {
      const res = await request(app)
        .get('/api/v1/analytics/events')
        .set('Authorization', `Bearer ${process.env.TEST_ADMIN_TOKEN}`)
        .query({ page: 1, limit: 10 })
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data.items)).toBe(true);
      expect(res.body.data).toHaveProperty('total');
    });

    it('should filter events by name', async () => {
      const res = await request(app)
        .get('/api/v1/analytics/events')
        .set('Authorization', `Bearer ${process.env.TEST_ADMIN_TOKEN}`)
        .query({ name: 'product_viewed', page: 1, limit: 10 })
        .expect(200);

      res.body.data.items.forEach((e: { name: string }) => {
        expect(e.name).toBe('product_viewed');
      });
    });

    it('should filter events by date range', async () => {
      const from = new Date(Date.now() - 86_400_000).toISOString();
      const to = new Date().toISOString();

      const res = await request(app)
        .get('/api/v1/analytics/events')
        .set('Authorization', `Bearer ${process.env.TEST_ADMIN_TOKEN}`)
        .query({ from, to, page: 1, limit: 10 })
        .expect(200);

      expect(res.body.success).toBe(true);
    });

    it('should filter events by userId', async () => {
      const res = await request(app)
        .get('/api/v1/analytics/events')
        .set('Authorization', `Bearer ${process.env.TEST_ADMIN_TOKEN}`)
        .query({ userId: 'user-001', page: 1, limit: 10 })
        .expect(200);

      res.body.data.items.forEach((e: { userId: string }) => {
        expect(e.userId).toBe('user-001');
      });
    });

    it('should return 401 without admin token', async () => {
      await request(app)
        .get('/api/v1/analytics/events')
        .expect(401);
    });
  });

  describe('GET /api/v1/analytics/events/:id', () => {
    let eventId: string;

    beforeAll(async () => {
      const res = await request(app)
        .post('/api/v1/analytics/events')
        .set('Authorization', `Bearer ${process.env.TEST_SERVICE_TOKEN}`)
        .send({ name: 'test_event_get', sessionId: 'session-003', properties: {}, timestamp: new Date().toISOString() });
      eventId = res.body.data.id;
    });

    it('should return event by id', async () => {
      const res = await request(app)
        .get(`/api/v1/analytics/events/${eventId}`)
        .set('Authorization', `Bearer ${process.env.TEST_ADMIN_TOKEN}`)
        .expect(200);

      expect(res.body.data.id).toBe(eventId);
    });

    it('should return 404 for non-existent event', async () => {
      await request(app)
        .get('/api/v1/analytics/events/nonexistent-event-id')
        .set('Authorization', `Bearer ${process.env.TEST_ADMIN_TOKEN}`)
        .expect(404);
    });
  });
});