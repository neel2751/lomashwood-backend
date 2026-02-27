import request from 'supertest';
import express from 'express';
import { healthRouter } from '../../src/health/health.routes';
import { PrismaClient } from '@prisma/client';

jest.mock('@prisma/client', () => {
  const mockPrisma = {
    $queryRaw: jest.fn(),
    $disconnect: jest.fn(),
  };
  return { PrismaClient: jest.fn(() => mockPrisma) };
});

const app = express();
app.use(express.json());
app.use('/health', healthRouter);

describe('Health Routes', () => {
  let prisma: PrismaClient;

  beforeEach(() => {
    jest.clearAllMocks();
    prisma = new PrismaClient();
  });

  describe('GET /health', () => {
    it('should return 200 with healthy status when database is reachable', async () => {
      (prisma.$queryRaw as jest.Mock).mockResolvedValue([{ '?column?': 1 }]);

      const res = await request(app).get('/health');

      expect(res.status).toBe(200);
      expect(res.body.status).toBe('ok');
      expect(res.body.service).toBe('customer-service');
    });

    it('should include timestamp in response', async () => {
      (prisma.$queryRaw as jest.Mock).mockResolvedValue([{ '?column?': 1 }]);

      const res = await request(app).get('/health');

      expect(res.status).toBe(200);
      expect(res.body.timestamp).toBeDefined();
      expect(new Date(res.body.timestamp).toString()).not.toBe('Invalid Date');
    });

    it('should include uptime in response', async () => {
      (prisma.$queryRaw as jest.Mock).mockResolvedValue([{ '?column?': 1 }]);

      const res = await request(app).get('/health');

      expect(res.status).toBe(200);
      expect(typeof res.body.uptime).toBe('number');
      expect(res.body.uptime).toBeGreaterThanOrEqual(0);
    });

    it('should return 503 when database is unreachable', async () => {
      (prisma.$queryRaw as jest.Mock).mockRejectedValue(new Error('Connection refused'));

      const res = await request(app).get('/health');

      expect(res.status).toBe(503);
      expect(res.body.status).toBe('error');
    });

    it('should include database status in response', async () => {
      (prisma.$queryRaw as jest.Mock).mockResolvedValue([{ '?column?': 1 }]);

      const res = await request(app).get('/health');

      expect(res.body.checks).toBeDefined();
      expect(res.body.checks.database).toBe('ok');
    });

    it('should report database down when connection fails', async () => {
      (prisma.$queryRaw as jest.Mock).mockRejectedValue(new Error('ECONNREFUSED'));

      const res = await request(app).get('/health');

      expect(res.body.checks).toBeDefined();
      expect(res.body.checks.database).toBe('error');
    });
  });

  describe('GET /health/live', () => {
    it('should return 200 without database check', async () => {
      const res = await request(app).get('/health/live');

      expect(res.status).toBe(200);
      expect(res.body.status).toBe('ok');
      expect(prisma.$queryRaw).not.toHaveBeenCalled();
    });
  });

  describe('GET /health/ready', () => {
    it('should return 200 when service is ready and database is up', async () => {
      (prisma.$queryRaw as jest.Mock).mockResolvedValue([{ '?column?': 1 }]);

      const res = await request(app).get('/health/ready');

      expect(res.status).toBe(200);
      expect(res.body.status).toBe('ok');
    });

    it('should return 503 when database is down', async () => {
      (prisma.$queryRaw as jest.Mock).mockRejectedValue(new Error('Database unavailable'));

      const res = await request(app).get('/health/ready');

      expect(res.status).toBe(503);
      expect(res.body.status).toBe('error');
    });
  });
});