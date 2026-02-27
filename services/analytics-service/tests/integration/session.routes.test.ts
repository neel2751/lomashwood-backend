
import request from 'supertest';
import app from '../../src/app';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient({
  datasources: { db: { url: process.env.TEST_DATABASE_URL } },
});

describe('Session Routes', () => {
  afterAll(async () => { await prisma.$disconnect(); });

  describe('POST /api/v1/analytics/sessions', () => {
    it('should create a new session and return 201', async () => {
      const res = await request(app)
        .post('/api/v1/analytics/sessions')
        .set('Authorization', `Bearer ${process.env.TEST_SERVICE_TOKEN}`)
        .send({
          sessionId: 'integration-session-001',
          userId: 'user-001',
          userAgent: 'Mozilla/5.0',
          ipAddress: '192.168.1.1',
          referrer: 'https://google.com',
          landingPage: '/kitchens',
          startedAt: new Date().toISOString(),
        })
        .expect(201);

      expect(res.body.success).toBe(true);
      expect(res.body.data.sessionId).toBe('integration-session-001');
    });

    it('should return 400 for missing sessionId', async () => {
      const res = await request(app)
        .post('/api/v1/analytics/sessions')
        .set('Authorization', `Bearer ${process.env.TEST_SERVICE_TOKEN}`)
        .send({ userId: 'user-001', startedAt: new Date().toISOString() })
        .expect(400);

      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('should return 409 for duplicate sessionId', async () => {
      await request(app)
        .post('/api/v1/analytics/sessions')
        .set('Authorization', `Bearer ${process.env.TEST_SERVICE_TOKEN}`)
        .send({ sessionId: 'integration-session-001', startedAt: new Date().toISOString() });

      const res = await request(app)
        .post('/api/v1/analytics/sessions')
        .set('Authorization', `Bearer ${process.env.TEST_SERVICE_TOKEN}`)
        .send({ sessionId: 'integration-session-001', startedAt: new Date().toISOString() })
        .expect(409);

      expect(res.body.error.code).toBe('SESSION_ALREADY_EXISTS');
    });

    it('should create an anonymous session without userId', async () => {
      const res = await request(app)
        .post('/api/v1/analytics/sessions')
        .set('Authorization', `Bearer ${process.env.TEST_SERVICE_TOKEN}`)
        .send({
          sessionId: 'anon-integration-session-001',
          landingPage: '/bedrooms',
          startedAt: new Date().toISOString(),
        })
        .expect(201);

      expect(res.body.data.userId).toBeNull();
    });
  });

  describe('PATCH /api/v1/analytics/sessions/:sessionId/end', () => {
    it('should end an active session', async () => {
      const res = await request(app)
        .patch('/api/v1/analytics/sessions/integration-session-001/end')
        .set('Authorization', `Bearer ${process.env.TEST_SERVICE_TOKEN}`)
        .send({ endedAt: new Date().toISOString(), pageViews: 5, duration: 300 })
        .expect(200);

      expect(res.body.data.endedAt).not.toBeNull();
    });

    it('should return 404 for non-existent session', async () => {
      await request(app)
        .patch('/api/v1/analytics/sessions/session-does-not-exist/end')
        .set('Authorization', `Bearer ${process.env.TEST_SERVICE_TOKEN}`)
        .send({ endedAt: new Date().toISOString() })
        .expect(404);
    });
  });

  describe('GET /api/v1/analytics/sessions', () => {
    it('should return paginated sessions', async () => {
      const res = await request(app)
        .get('/api/v1/analytics/sessions')
        .set('Authorization', `Bearer ${process.env.TEST_ADMIN_TOKEN}`)
        .query({ page: 1, limit: 10 })
        .expect(200);

      expect(Array.isArray(res.body.data.items)).toBe(true);
    });

    it('should filter sessions by userId', async () => {
      const res = await request(app)
        .get('/api/v1/analytics/sessions')
        .set('Authorization', `Bearer ${process.env.TEST_ADMIN_TOKEN}`)
        .query({ userId: 'user-001', page: 1, limit: 10 })
        .expect(200);

      res.body.data.items.forEach((s: { userId: string }) => {
        expect(s.userId).toBe('user-001');
      });
    });
  });

  describe('GET /api/v1/analytics/sessions/:sessionId', () => {
    it('should return session by sessionId', async () => {
      const res = await request(app)
        .get('/api/v1/analytics/sessions/integration-session-001')
        .set('Authorization', `Bearer ${process.env.TEST_ADMIN_TOKEN}`)
        .expect(200);

      expect(res.body.data.sessionId).toBe('integration-session-001');
    });

    it('should return 404 for non-existent session', async () => {
      await request(app)
        .get('/api/v1/analytics/sessions/does-not-exist')
        .set('Authorization', `Bearer ${process.env.TEST_ADMIN_TOKEN}`)
        .expect(404);
    });
  });
});