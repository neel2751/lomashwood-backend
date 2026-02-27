
import request from 'supertest';
import app from '../../src/app';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient({
  datasources: { db: { url: process.env.TEST_DATABASE_URL } },
});

describe('Pageview Routes', () => {
  afterAll(async () => { await prisma.$disconnect(); });

  describe('POST /api/v1/analytics/pageviews', () => {
    it('should record a pageview and return 201', async () => {
      const res = await request(app)
        .post('/api/v1/analytics/pageviews')
        .set('Authorization', `Bearer ${process.env.TEST_SERVICE_TOKEN}`)
        .send({
          sessionId: 'session-pv-001',
          userId: 'user-001',
          path: '/kitchens/luna',
          title: 'Luna Kitchen | Lomash Wood',
          referrer: '/kitchens',
          duration: 45,
          timestamp: new Date().toISOString(),
        })
        .expect(201);

      expect(res.body.success).toBe(true);
      expect(res.body.data.path).toBe('/kitchens/luna');
    });

    it('should return 400 for missing path', async () => {
      const res = await request(app)
        .post('/api/v1/analytics/pageviews')
        .set('Authorization', `Bearer ${process.env.TEST_SERVICE_TOKEN}`)
        .send({ sessionId: 'session-pv-001', timestamp: new Date().toISOString() })
        .expect(400);

      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('should record pageview without userId (anonymous)', async () => {
      const res = await request(app)
        .post('/api/v1/analytics/pageviews')
        .set('Authorization', `Bearer ${process.env.TEST_SERVICE_TOKEN}`)
        .send({
          sessionId: 'anon-session-pv-001',
          path: '/bedrooms',
          timestamp: new Date().toISOString(),
        })
        .expect(201);

      expect(res.body.data.userId).toBeNull();
    });
  });

  describe('GET /api/v1/analytics/pageviews', () => {
    it('should return paginated pageviews', async () => {
      const res = await request(app)
        .get('/api/v1/analytics/pageviews')
        .set('Authorization', `Bearer ${process.env.TEST_ADMIN_TOKEN}`)
        .query({ page: 1, limit: 10 })
        .expect(200);

      expect(Array.isArray(res.body.data.items)).toBe(true);
    });

    it('should filter pageviews by path', async () => {
      const res = await request(app)
        .get('/api/v1/analytics/pageviews')
        .set('Authorization', `Bearer ${process.env.TEST_ADMIN_TOKEN}`)
        .query({ path: '/kitchens/luna', page: 1, limit: 10 })
        .expect(200);

      res.body.data.items.forEach((pv: { path: string }) => {
        expect(pv.path).toBe('/kitchens/luna');
      });
    });

    it('should filter pageviews by sessionId', async () => {
      const res = await request(app)
        .get('/api/v1/analytics/pageviews')
        .set('Authorization', `Bearer ${process.env.TEST_ADMIN_TOKEN}`)
        .query({ sessionId: 'session-pv-001', page: 1, limit: 10 })
        .expect(200);

      res.body.data.items.forEach((pv: { sessionId: string }) => {
        expect(pv.sessionId).toBe('session-pv-001');
      });
    });
  });

  describe('GET /api/v1/analytics/pageviews/top', () => {
    it('should return top pages by view count', async () => {
      const res = await request(app)
        .get('/api/v1/analytics/pageviews/top')
        .set('Authorization', `Bearer ${process.env.TEST_ADMIN_TOKEN}`)
        .query({ limit: 10, period: '7d' })
        .expect(200);

      expect(Array.isArray(res.body.data)).toBe(true);
      res.body.data.forEach((p: { path: string; views: number }) => {
        expect(p).toHaveProperty('path');
        expect(p).toHaveProperty('views');
      });
    });

    it('should return 400 for invalid period value', async () => {
      const res = await request(app)
        .get('/api/v1/analytics/pageviews/top')
        .set('Authorization', `Bearer ${process.env.TEST_ADMIN_TOKEN}`)
        .query({ period: 'invalid' })
        .expect(400);

      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });
  });
});