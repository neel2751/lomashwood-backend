
import request from 'supertest';
import app from '../../src/app';

describe('Health Routes', () => {
  describe('GET /health', () => {
    it('should return 200 with service status', async () => {
      const res = await request(app).get('/health').expect(200);

      expect(res.body.status).toBe('ok');
      expect(res.body.service).toBe('analytics-service');
      expect(res.body).toHaveProperty('uptime');
      expect(res.body).toHaveProperty('timestamp');
    });
  });

  describe('GET /health/live', () => {
    it('should return 200 for liveness probe', async () => {
      const res = await request(app).get('/health/live').expect(200);

      expect(res.body.status).toBe('ok');
    });
  });

  describe('GET /health/ready', () => {
    it('should return 200 with dependency checks', async () => {
      const res = await request(app).get('/health/ready').expect(200);

      expect(res.body.db).toBe('connected');
      expect(res.body.redis).toBe('connected');
    });

    it('should include all required dependency keys', async () => {
      const res = await request(app).get('/health/ready').expect(200);

      expect(res.body).toHaveProperty('db');
      expect(res.body).toHaveProperty('redis');
    });
  });

  describe('GET /health/metrics', () => {
    it('should return Prometheus-compatible metrics', async () => {
      const res = await request(app)
        .get('/health/metrics')
        .set('Authorization', `Bearer ${process.env.TEST_ADMIN_TOKEN}`)
        .expect(200);

      expect(res.headers['content-type']).toMatch(/text\/plain/);
      expect(res.text).toContain('http_requests_total');
    });

    it('should return 401 without auth for metrics endpoint', async () => {
      await request(app).get('/health/metrics').expect(401);
    });
  });
});