import { Router, type Request, type Response, type Router as RouterType } from 'express';

import { env } from '../../config/env';
import { getPrismaClient } from '../db/prisma.client';
import { checkRedisHealth } from '../cache/redis.health';

const router: RouterType = Router();

router.get('/health', async (_req: Request, res: Response) => {
  const start = Date.now();

  const [redisHealth, dbHealth] = await Promise.allSettled([
    checkRedisHealth(),
    checkDatabaseHealth(),
  ]);

  const redis =
    redisHealth.status === 'fulfilled'
      ? redisHealth.value
      : { status: 'unhealthy', error: 'Check failed', latencyMs: 0 };

  const database =
    dbHealth.status === 'fulfilled'
      ? dbHealth.value
      : { status: 'unhealthy', error: 'Check failed', latencyMs: 0 };

  const allHealthy = redis.status === 'healthy' && database.status === 'healthy';

  const statusCode = allHealthy ? 200 : 503;

  res.status(statusCode).json({
    status: allHealthy ? 'ok' : 'degraded',
    service: env.SERVICE_NAME,
    version: env.SERVICE_VERSION,
    environment: env.NODE_ENV,
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    responseTimeMs: Date.now() - start,
    checks: {
      database,
      redis,
    },
  });
});

router.get('/health/live', (_req: Request, res: Response) => {
  res.status(200).json({ status: 'ok' });
});

router.get('/health/ready', async (_req: Request, res: Response) => {
  try {
    const prisma = getPrismaClient();
    await prisma.$queryRaw`SELECT 1`;
    res.status(200).json({ status: 'ready' });
  } catch {
    res.status(503).json({ status: 'not ready', reason: 'Database unavailable' });
  }
});

async function checkDatabaseHealth(): Promise<{
  status: 'healthy' | 'unhealthy';
  latencyMs: number;
  error?: string;
}> {
  const start = Date.now();
  try {
    const prisma = getPrismaClient();
    await prisma.$queryRaw`SELECT 1`;
    return { status: 'healthy', latencyMs: Date.now() - start };
  } catch (error) {
    return {
      status: 'unhealthy',
      latencyMs: Date.now() - start,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

export { router as healthRouter };