import { Router, Request, Response } from 'express';
import { prisma } from '../db/prisma.client';
import { checkRedisHealth, isRedisHealthy } from '../cache/redis.health';
import { logger } from '../../config/logger';
import { env } from '../../config/env';

const router = Router();

router.get('/health', async (_req: Request, res: Response): Promise<void> => {
  res.status(200).json({
    status: 'ok',
    service: 'customer-service',
    timestamp: new Date().toISOString(),
  });
});

router.get('/health/ready', async (_req: Request, res: Response): Promise<void> => {
  const checks = await Promise.allSettled([
    checkDatabaseHealth(),
    isRedisHealthy(),
  ]);

  const dbResult = checks[0];
  const redisResult = checks[1];

  const dbHealthy =
    dbResult.status === 'fulfilled' && dbResult.value === true;
  const redisHealthy =
    redisResult.status === 'fulfilled' && redisResult.value === true;

  const isReady = dbHealthy && redisHealthy;

  const body = {
    status: isReady ? 'ready' : 'not_ready',
    service: 'customer-service',
    timestamp: new Date().toISOString(),
    checks: {
      database: dbHealthy ? 'healthy' : 'unhealthy',
      redis: redisHealthy ? 'healthy' : 'unhealthy',
    },
  };

  res.status(isReady ? 200 : 503).json(body);
});

router.get('/health/live', async (_req: Request, res: Response): Promise<void> => {
  res.status(200).json({
    status: 'alive',
    service: 'customer-service',
    pid: process.pid,
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
  });
});

router.get('/health/detailed', async (_req: Request, res: Response): Promise<void> => {
  const startTime = Date.now();

  const [dbStatus, redisStatus] = await Promise.allSettled([
    checkDatabaseHealthDetailed(),
    checkRedisHealth(),
  ]);

  const db =
    dbStatus.status === 'fulfilled'
      ? dbStatus.value
      : { status: 'unhealthy', error: String(dbStatus.reason) };

  const redis =
    redisStatus.status === 'fulfilled'
      ? redisStatus.value
      : { status: 'unhealthy', error: String(redisStatus.reason) };

  const allHealthy =
    db.status === 'healthy' && redis.status === 'healthy';

  const body = {
    status: allHealthy ? 'healthy' : 'degraded',
    service: 'customer-service',
    version: env.npm_package_version ?? '1.0.0',
    environment: env.NODE_ENV,
    pid: process.pid,
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    timestamp: new Date().toISOString(),
    responseTimeMs: Date.now() - startTime,
    checks: {
      database: db,
      redis,
    },
  };

  res.status(allHealthy ? 200 : 503).json(body);
});

async function checkDatabaseHealth(): Promise<boolean> {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return true;
  } catch {
    return false;
  }
}

async function checkDatabaseHealthDetailed(): Promise<{
  status: 'healthy' | 'unhealthy';
  latencyMs: number;
  error?: string;
}> {
  const start = Date.now();
  try {
    await prisma.$queryRaw`SELECT 1`;
    return { status: 'healthy', latencyMs: Date.now() - start };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    logger.error({ error: message }, 'Database health check failed');
    return { status: 'unhealthy', latencyMs: Date.now() - start, error: message };
  }
}

export { router as healthRoutes };