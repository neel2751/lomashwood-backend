import request from 'supertest';
import { app } from '../../src/app';
import { prisma } from '../../src/infrastructure/db/prisma.client';
import { redisClient } from '../../src/infrastructure/cache/redis.client';

jest.mock('../../src/infrastructure/db/prisma.client', () => ({
  prisma: {
    $queryRaw: jest.fn(),
    $disconnect: jest.fn(),
  },
}));

jest.mock('../../src/infrastructure/cache/redis.client', () => ({
  redisClient: {
    ping: jest.fn(),
    status: 'ready',
  },
}));

const BASE = '/health';

describe('Health Routes — Integration', () => {
  beforeEach(() => jest.clearAllMocks());

  // ─── GET /health ──────────────────────────────────────────────────────────

  describe('GET /health', () => {
    it('should return 200 with status UP when all dependencies are healthy', async () => {
      (prisma.$queryRaw as jest.Mock).mockResolvedValue([{ '?column?': 1 }]);
      (redisClient.ping as jest.Mock).mockResolvedValue('PONG');

      const res = await request(app).get(BASE);

      expect(res.status).toBe(200);
      expect(res.body).toMatchObject({
        status: 'UP',
        service: 'order-payment-service',
        dependencies: {
          database: 'UP',
          cache: 'UP',
        },
      });
    });

    it('should return 503 with status DEGRADED when the database is unreachable', async () => {
      (prisma.$queryRaw as jest.Mock).mockRejectedValue(new Error('ECONNREFUSED'));
      (redisClient.ping as jest.Mock).mockResolvedValue('PONG');

      const res = await request(app).get(BASE);

      expect(res.status).toBe(503);
      expect(res.body.status).toBe('DEGRADED');
      expect(res.body.dependencies.database).toBe('DOWN');
      expect(res.body.dependencies.cache).toBe('UP');
    });

    it('should return 503 with status DEGRADED when Redis is unreachable', async () => {
      (prisma.$queryRaw as jest.Mock).mockResolvedValue([{ '?column?': 1 }]);
      (redisClient.ping as jest.Mock).mockRejectedValue(new Error('Redis connection error'));

      const res = await request(app).get(BASE);

      expect(res.status).toBe(503);
      expect(res.body.status).toBe('DEGRADED');
      expect(res.body.dependencies.database).toBe('UP');
      expect(res.body.dependencies.cache).toBe('DOWN');
    });

    it('should return 503 with status DOWN when all dependencies fail', async () => {
      (prisma.$queryRaw as jest.Mock).mockRejectedValue(new Error('DB error'));
      (redisClient.ping as jest.Mock).mockRejectedValue(new Error('Redis error'));

      const res = await request(app).get(BASE);

      expect(res.status).toBe(503);
      expect(res.body.status).toBe('DOWN');
      expect(res.body.dependencies.database).toBe('DOWN');
      expect(res.body.dependencies.cache).toBe('DOWN');
    });

    it('should include uptime and timestamp in the response', async () => {
      (prisma.$queryRaw as jest.Mock).mockResolvedValue([{ '?column?': 1 }]);
      (redisClient.ping as jest.Mock).mockResolvedValue('PONG');

      const res = await request(app).get(BASE);

      expect(res.status).toBe(200);
      expect(res.body.uptime).toBeGreaterThanOrEqual(0);
      expect(res.body.timestamp).toBeDefined();
      expect(new Date(res.body.timestamp).getTime()).not.toBeNaN();
    });

    it('should not require authentication', async () => {
      (prisma.$queryRaw as jest.Mock).mockResolvedValue([{ '?column?': 1 }]);
      (redisClient.ping as jest.Mock).mockResolvedValue('PONG');

      const res = await request(app).get(BASE);

      expect(res.status).not.toBe(401);
      expect(res.status).not.toBe(403);
    });
  });

  // ─── GET /health/live ─────────────────────────────────────────────────────

  describe('GET /health/live', () => {
    it('should return 200 to confirm the process is alive', async () => {
      const res = await request(app).get(`${BASE}/live`);

      expect(res.status).toBe(200);
      expect(res.body).toMatchObject({ status: 'UP' });
    });

    it('should respond without checking dependencies', async () => {
      const res = await request(app).get(`${BASE}/live`);

      expect(res.status).toBe(200);
      expect(prisma.$queryRaw).not.toHaveBeenCalled();
      expect(redisClient.ping).not.toHaveBeenCalled();
    });
  });

  // ─── GET /health/ready ────────────────────────────────────────────────────

  describe('GET /health/ready', () => {
    it('should return 200 when database connection is healthy', async () => {
      (prisma.$queryRaw as jest.Mock).mockResolvedValue([{ '?column?': 1 }]);

      const res = await request(app).get(`${BASE}/ready`);

      expect(res.status).toBe(200);
      expect(res.body.ready).toBe(true);
    });

    it('should return 503 when database is not reachable', async () => {
      (prisma.$queryRaw as jest.Mock).mockRejectedValue(new Error('DB unavailable'));

      const res = await request(app).get(`${BASE}/ready`);

      expect(res.status).toBe(503);
      expect(res.body.ready).toBe(false);
    });
  });

  // ─── GET /health/db ───────────────────────────────────────────────────────

  describe('GET /health/db', () => {
    it('should return 200 with latency when database responds', async () => {
      (prisma.$queryRaw as jest.Mock).mockResolvedValue([{ '?column?': 1 }]);

      const res = await request(app).get(`${BASE}/db`);

      expect(res.status).toBe(200);
      expect(res.body.status).toBe('UP');
      expect(res.body.latencyMs).toBeGreaterThanOrEqual(0);
    });

    it('should return 503 with error message when database is unreachable', async () => {
      (prisma.$queryRaw as jest.Mock).mockRejectedValue(new Error('Connection refused'));

      const res = await request(app).get(`${BASE}/db`);

      expect(res.status).toBe(503);
      expect(res.body.status).toBe('DOWN');
      expect(res.body.error).toBe('Connection refused');
    });
  });

  // ─── GET /health/cache ────────────────────────────────────────────────────

  describe('GET /health/cache', () => {
    it('should return 200 when Redis responds to PING', async () => {
      (redisClient.ping as jest.Mock).mockResolvedValue('PONG');

      const res = await request(app).get(`${BASE}/cache`);

      expect(res.status).toBe(200);
      expect(res.body.status).toBe('UP');
    });

    it('should return 503 when Redis is unreachable', async () => {
      (redisClient.ping as jest.Mock).mockRejectedValue(new Error('Redis ECONNREFUSED'));

      const res = await request(app).get(`${BASE}/cache`);

      expect(res.status).toBe(503);
      expect(res.body.status).toBe('DOWN');
    });
  });
});