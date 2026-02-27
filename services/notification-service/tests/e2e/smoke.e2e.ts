import request from 'supertest';
import app from '../../src/app';

describe('[E2E] Smoke Tests — Notification Service', () => {
  describe('Health Check', () => {
    it('GET /health should return 200', async () => {
      const res = await request(app).get('/health').expect(200);

      expect(res.body.status).toBe('ok');
      expect(res.body.service).toBe('notification-service');
    });

    it('GET /health/live should return 200 (liveness)', async () => {
      const res = await request(app).get('/health/live').expect(200);
      expect(res.body.status).toBe('ok');
    });

    it('GET /health/ready should return 200 (readiness)', async () => {
      const res = await request(app).get('/health/ready').expect(200);

      expect(res.body).toHaveProperty('db');
      expect(res.body).toHaveProperty('redis');
      expect(res.body.db).toBe('connected');
      expect(res.body.redis).toBe('connected');
    });
  });

  describe('Base API Availability', () => {
    it('GET /api/v1/notifications/templates should respond (auth required)', async () => {
      const res = await request(app)
        .get('/api/v1/notifications/templates')
        .expect(401);

      expect(res.body.error.code).toBe('UNAUTHORIZED');
    });

    it('GET /api/v1/notifications/campaigns should respond (auth required)', async () => {
      await request(app)
        .get('/api/v1/notifications/campaigns')
        .expect(401);
    });

    it('GET /api/v1/notifications/preferences/test-user should respond (auth required)', async () => {
      await request(app)
        .get('/api/v1/notifications/preferences/test-user')
        .expect(401);
    });

    it('POST /api/v1/notifications/email/send should respond (auth required)', async () => {
      await request(app)
        .post('/api/v1/notifications/email/send')
        .send({})
        .expect(401);
    });

    it('POST /api/v1/notifications/sms/send should respond (auth required)', async () => {
      await request(app)
        .post('/api/v1/notifications/sms/send')
        .send({})
        .expect(401);
    });

    it('POST /api/v1/notifications/push/send should respond (auth required)', async () => {
      await request(app)
        .post('/api/v1/notifications/push/send')
        .send({})
        .expect(401);
    });
  });

  describe('Not Found Routes', () => {
    it('should return 404 for completely unknown routes', async () => {
      const res = await request(app)
        .get('/api/v1/notifications/this-route-does-not-exist')
        .expect(404);

      expect(res.body.error.code).toBe('ROUTE_NOT_FOUND');
    });
  });

  describe('Provider Health Endpoint', () => {
    it('GET /api/v1/notifications/providers/health should be accessible with auth', async () => {
      const res = await request(app)
        .get('/api/v1/notifications/providers/health')
        .set('Authorization', `Bearer ${process.env.E2E_ADMIN_TOKEN}`)
        .expect(200);

      expect(res.body.data).toHaveProperty('email');
      expect(res.body.data).toHaveProperty('sms');
      expect(res.body.data).toHaveProperty('push');
    });
  });
});