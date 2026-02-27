import request from 'supertest';
import express from 'express';
import { healthRouter } from '../../infrastructure/http/health.routes';
import { prisma } from '../../infrastructure/db/prisma.client';
import { redis } from '../../infrastructure/cache/redis.client';

jest.mock('../../infrastructure/db/prisma.client', () => ({
  prisma: {
    $queryRaw: jest.fn(),
  },
}));

jest.mock('../../infrastructure/cache/redis.client', () => ({
  redis: {
    ping: jest.fn(),
  },
}));

const app = express();
app.use(express.json());
app.use('/health', healthRouter());

describe('GET /health', () => {
  beforeEach(() => jest.clearAllMocks());

  it('returns 200 when all dependencies are healthy', async () => {
    (prisma.$queryRaw as jest.Mock).mockResolvedValue([{ 1: 1 }]);
    (redis.ping as jest.Mock).mockResolvedValue('PONG');

    const res = await request(app).get('/health');

    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
    expect(res.body.checks.database).toBe('ok');
    expect(res.body.checks.redis).toBe('ok');
  });

  it('returns 503 when database is unhealthy', async () => {
    (prisma.$queryRaw as jest.Mock).mockRejectedValue(new Error('Connection refused'));
    (redis.ping as jest.Mock).mockResolvedValue('PONG');

    const res = await request(app).get('/health');

    expect(res.status).toBe(503);
    expect(res.body.status).toBe('degraded');
    expect(res.body.checks.database).toBe('error');
    expect(res.body.checks.redis).toBe('ok');
  });

  it('returns 503 when redis is unhealthy', async () => {
    (prisma.$queryRaw as jest.Mock).mockResolvedValue([{ 1: 1 }]);
    (redis.ping as jest.Mock).mockRejectedValue(new Error('ECONNREFUSED'));

    const res = await request(app).get('/health');

    expect(res.status).toBe(503);
    expect(res.body.status).toBe('degraded');
    expect(res.body.checks.database).toBe('ok');
    expect(res.body.checks.redis).toBe('error');
  });

  it('returns 503 when both dependencies are unhealthy', async () => {
    (prisma.$queryRaw as jest.Mock).mockRejectedValue(new Error('DB down'));
    (redis.ping as jest.Mock).mockRejectedValue(new Error('Redis down'));

    const res = await request(app).get('/health');

    expect(res.status).toBe(503);
    expect(res.body.status).toBe('degraded');
    expect(res.body.checks.database).toBe('error');
    expect(res.body.checks.redis).toBe('error');
  });

  it('includes uptime in the response', async () => {
    (prisma.$queryRaw as jest.Mock).mockResolvedValue([{ 1: 1 }]);
    (redis.ping as jest.Mock).mockResolvedValue('PONG');

    const res = await request(app).get('/health');

    expect(res.status).toBe(200);
    expect(typeof res.body.uptime).toBe('number');
    expect(res.body.uptime).toBeGreaterThanOrEqual(0);
  });

  it('includes timestamp in the response', async () => {
    (prisma.$queryRaw as jest.Mock).mockResolvedValue([{ 1: 1 }]);
    (redis.ping as jest.Mock).mockResolvedValue('PONG');

    const res = await request(app).get('/health');

    expect(res.status).toBe(200);
    expect(res.body.timestamp).toBeDefined();
    expect(new Date(res.body.timestamp).toString()).not.toBe('Invalid Date');
  });

  it('includes service name in the response', async () => {
    (prisma.$queryRaw as jest.Mock).mockResolvedValue([{ 1: 1 }]);
    (redis.ping as jest.Mock).mockResolvedValue('PONG');

    const res = await request(app).get('/health');

    expect(res.status).toBe(200);
    expect(res.body.service).toBe('notification-service');
  });
});

describe('GET /health/live', () => {
  beforeEach(() => jest.clearAllMocks());

  it('returns 200 when service process is alive', async () => {
    const res = await request(app).get('/health/live');

    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
  });
});

describe('GET /health/ready', () => {
  beforeEach(() => jest.clearAllMocks());

  it('returns 200 when service is ready to handle traffic', async () => {
    (prisma.$queryRaw as jest.Mock).mockResolvedValue([{ 1: 1 }]);
    (redis.ping as jest.Mock).mockResolvedValue('PONG');

    const res = await request(app).get('/health/ready');

    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ready');
  });

  it('returns 503 when service is not ready due to db failure', async () => {
    (prisma.$queryRaw as jest.Mock).mockRejectedValue(new Error('DB not ready'));
    (redis.ping as jest.Mock).mockResolvedValue('PONG');

    const res = await request(app).get('/health/ready');

    expect(res.status).toBe(503);
    expect(res.body.status).toBe('not ready');
  });

  it('returns 503 when service is not ready due to redis failure', async () => {
    (prisma.$queryRaw as jest.Mock).mockResolvedValue([{ 1: 1 }]);
    (redis.ping as jest.Mock).mockRejectedValue(new Error('Redis not ready'));

    const res = await request(app).get('/health/ready');

    expect(res.status).toBe(503);
    expect(res.body.status).toBe('not ready');
  });
});