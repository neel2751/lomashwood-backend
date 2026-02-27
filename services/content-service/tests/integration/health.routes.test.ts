import request from 'supertest';
import { createApp } from '../../src/app';
import { prisma } from '../../src/infrastructure/db/prisma.client';
import { redis } from '../../src/infrastructure/cache/redis.client';
import { jest, describe, it, expect, beforeEach } from '@jest/globals';

jest.mock('../../src/infrastructure/db/prisma.client', () => ({
  prisma: {
    $queryRaw: jest.fn(),
    $disconnect: jest.fn(),
  },
}));

jest.mock('../../src/infrastructure/cache/redis.client', () => ({
  redis: {
    ping: jest.fn(),
    quit: jest.fn(),
  },
}));

const app = createApp();

const mockQueryRaw = prisma.$queryRaw as jest.MockedFunction<() => Promise<unknown>>;
const mockRedisPing = redis.ping as jest.MockedFunction<() => Promise<string>>;

describe('Health Routes — GET /health', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /health', () => {
    it('should return 200 with status ok when all dependencies are healthy', async () => {
      mockQueryRaw.mockResolvedValue([{ 1: 1 }]);
      mockRedisPing.mockResolvedValue('PONG');

      const res = await request(app).get('/health');

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('status', 'ok');
      expect(res.body).toHaveProperty('service', 'content-service');
    });

    it('should include uptime in the response', async () => {
      mockQueryRaw.mockResolvedValue([{ 1: 1 }]);
      mockRedisPing.mockResolvedValue('PONG');

      const res = await request(app).get('/health');

      expect(res.body).toHaveProperty('uptime');
      expect(typeof res.body.uptime).toBe('number');
    });

    it('should include a timestamp in the response', async () => {
      mockQueryRaw.mockResolvedValue([{ 1: 1 }]);
      mockRedisPing.mockResolvedValue('PONG');

      const res = await request(app).get('/health');

      expect(res.body).toHaveProperty('timestamp');
      expect(() => new Date(res.body.timestamp)).not.toThrow();
    });

    it('should report database status as healthy', async () => {
      mockQueryRaw.mockResolvedValue([{ 1: 1 }]);
      mockRedisPing.mockResolvedValue('PONG');

      const res = await request(app).get('/health');

      expect(res.body).toHaveProperty('dependencies');
      expect(res.body.dependencies).toHaveProperty('database', 'healthy');
    });

    it('should report redis status as healthy', async () => {
      mockQueryRaw.mockResolvedValue([{ 1: 1 }]);
      mockRedisPing.mockResolvedValue('PONG');

      const res = await request(app).get('/health');

      expect(res.body.dependencies).toHaveProperty('redis', 'healthy');
    });

    it('should return 503 when database is unreachable', async () => {
      mockQueryRaw.mockRejectedValue(new Error('Connection refused'));
      mockRedisPing.mockResolvedValue('PONG');

      const res = await request(app).get('/health');

      expect(res.status).toBe(503);
      expect(res.body).toHaveProperty('status', 'degraded');
      expect(res.body.dependencies).toHaveProperty('database', 'unhealthy');
    });

    it('should return 503 when redis is unreachable', async () => {
      mockQueryRaw.mockResolvedValue([{ 1: 1 }]);
      mockRedisPing.mockRejectedValue(new Error('Redis connection refused'));

      const res = await request(app).get('/health');

      expect(res.status).toBe(503);
      expect(res.body.dependencies).toHaveProperty('redis', 'unhealthy');
    });

    it('should return 503 when both dependencies are unhealthy', async () => {
      mockQueryRaw.mockRejectedValue(new Error('DB down'));
      mockRedisPing.mockRejectedValue(new Error('Redis down'));

      const res = await request(app).get('/health');

      expect(res.status).toBe(503);
      expect(res.body.dependencies.database).toBe('unhealthy');
      expect(res.body.dependencies.redis).toBe('unhealthy');
    });

    it('should set content-type to application/json', async () => {
      mockQueryRaw.mockResolvedValue([{ 1: 1 }]);
      mockRedisPing.mockResolvedValue('PONG');

      const res = await request(app).get('/health');

      expect(res.headers['content-type']).toMatch(/application\/json/);
    });
  });

  describe('GET /health/ready', () => {
    it('should return 200 when service is ready to handle traffic', async () => {
      mockQueryRaw.mockResolvedValue([{ 1: 1 }]);

      const res = await request(app).get('/health/ready');

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('ready', true);
    });

    it('should return 503 when database is not ready', async () => {
      mockQueryRaw.mockRejectedValue(new Error('DB not ready'));

      const res = await request(app).get('/health/ready');

      expect(res.status).toBe(503);
      expect(res.body).toHaveProperty('ready', false);
    });
  });

  describe('GET /health/live', () => {
    it('should return 200 to confirm the process is alive', async () => {
      const res = await request(app).get('/health/live');

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('alive', true);
    });

    it('should not require database or redis connectivity', async () => {
      mockQueryRaw.mockRejectedValue(new Error('DB down'));
      mockRedisPing.mockRejectedValue(new Error('Redis down'));

      const res = await request(app).get('/health/live');

      expect(res.status).toBe(200);
    });
  });
});