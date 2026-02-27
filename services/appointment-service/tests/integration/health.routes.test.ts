import supertest from 'supertest';
import { createApp } from '../../src/app';
import { prisma } from '../../src/infrastructure/db/prisma.client';
import { redis } from '../../src/infrastructure/cache/redis.client';

const app = createApp();
const request = supertest(app);

beforeAll(async () => {
  await prisma.$connect();
});

afterAll(async () => {
  await prisma.$disconnect();
  await redis.quit();
});

describe('GET /health', () => {
  it('should return 200 with healthy status', async () => {
    const res = await request.get('/health');

    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({
      status: 'ok',
      service: 'appointment-service',
    });
  });

  it('should include uptime in response', async () => {
    const res = await request.get('/health');

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('uptime');
    expect(typeof res.body.uptime).toBe('number');
  });

  it('should include timestamp in response', async () => {
    const res = await request.get('/health');

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('timestamp');
    expect(() => new Date(res.body.timestamp)).not.toThrow();
  });
});

describe('GET /health/live', () => {
  it('should return 200 for liveness check', async () => {
    const res = await request.get('/health/live');

    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ status: 'alive' });
  });
});

describe('GET /health/ready', () => {
  it('should return 200 for readiness check when all dependencies are up', async () => {
    const res = await request.get('/health/ready');

    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ status: 'ready' });
  });

  it('should include database status in readiness check', async () => {
    const res = await request.get('/health/ready');

    expect(res.status).toBe(200);
    expect(res.body.checks).toHaveProperty('database');
    expect(res.body.checks.database).toMatchObject({ status: 'up' });
  });

  it('should include redis status in readiness check', async () => {
    const res = await request.get('/health/ready');

    expect(res.status).toBe(200);
    expect(res.body.checks).toHaveProperty('redis');
    expect(res.body.checks.redis).toMatchObject({ status: 'up' });
  });
});

describe('GET /health/detailed', () => {
  it('should return detailed health information for admin', async () => {
    const res = await request
      .get('/health/detailed')
      .set('Authorization', `Bearer ${process.env.ADMIN_TEST_TOKEN}`);

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('checks');
    expect(res.body).toHaveProperty('version');
    expect(res.body).toHaveProperty('environment');
  });

  it('should include memory usage in detailed check', async () => {
    const res = await request
      .get('/health/detailed')
      .set('Authorization', `Bearer ${process.env.ADMIN_TEST_TOKEN}`);

    expect(res.status).toBe(200);
    expect(res.body.checks).toHaveProperty('memory');
  });

  it('should return 401 for unauthenticated detailed health', async () => {
    const res = await request.get('/health/detailed');

    expect(res.status).toBe(401);
  });
});

describe('GET /health/metrics', () => {
  it('should return prometheus metrics endpoint', async () => {
    const res = await request.get('/health/metrics');

    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toMatch(/text\/plain/);
  });

  it('should include appointment service specific metrics', async () => {
    const res = await request.get('/health/metrics');

    expect(res.status).toBe(200);
    expect(res.text).toMatch(/appointment_/);
  });
});

describe('GET /nonexistent-route', () => {
  it('should return 404 for unknown routes', async () => {
    const res = await request.get('/v1/nonexistent-endpoint');

    expect(res.status).toBe(404);
    expect(res.body).toMatchObject({
      status: 'error',
      message: expect.stringMatching(/not found/i),
    });
  });
});

describe('POST /health (method not allowed)', () => {
  it('should return 405 for unsupported HTTP method on health', async () => {
    const res = await request.post('/health');

    expect(res.status).toBe(405);
  });
});
