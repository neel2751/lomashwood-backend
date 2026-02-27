
/// <reference types="jest" />
import request from 'supertest';
import app from '../../src/app';

describe('[E2E] Smoke Tests — Analytics Service', () => {
  describe('Health Checks', () => {
    it('GET /health should return 200', async () => {
      const res = await request(app).get('/health').expect(200);

      expect(res.body.status).toBe('ok');
      expect(res.body.service).toBe('analytics-service');
    });

    it('GET /health/live should return 200', async () => {
      const res = await request(app).get('/health/live').expect(200);
      expect(res.body.status).toBe('ok');
    });

    it('GET /health/ready should return 200 with dependency status', async () => {
      const res = await request(app).get('/health/ready').expect(200);

      expect(res.body).toHaveProperty('db');
      expect(res.body).toHaveProperty('redis');
      expect(res.body.db).toBe('connected');
      expect(res.body.redis).toBe('connected');
    });
  });

  describe('Auth Guards', () => {
    const protectedRoutes = [
      { method: 'get', path: '/api/v1/analytics/events' },
      { method: 'get', path: '/api/v1/analytics/sessions' },
      { method: 'get', path: '/api/v1/analytics/pageviews' },
      { method: 'get', path: '/api/v1/analytics/conversions' },
      { method: 'get', path: '/api/v1/analytics/funnels' },
      { method: 'get', path: '/api/v1/analytics/cohorts' },
      { method: 'get', path: '/api/v1/analytics/dashboards' },
      { method: 'get', path: '/api/v1/analytics/reports' },
      { method: 'get', path: '/api/v1/analytics/exports' },
      { method: 'get', path: '/api/v1/analytics/metrics/summary' },
      { method: 'get', path: '/api/v1/analytics/metrics/realtime' },
      { method: 'post', path: '/api/v1/analytics/ingest/events' },
    ];

    protectedRoutes.forEach(({ method, path }) => {
      it(`${method.toUpperCase()} ${path} should return 401 without auth`, async () => {
        await (request(app) as Record<string, (path: string) => request.Test>)[method](path).expect(401);
      });
    });
  });

  describe('Not Found', () => {
    it('should return 404 for unknown routes', async () => {
      const res = await request(app)
        .get('/api/v1/analytics/this-does-not-exist')
        .expect(404);

      expect(res.body.error.code).toBe('ROUTE_NOT_FOUND');
    });
  });
});