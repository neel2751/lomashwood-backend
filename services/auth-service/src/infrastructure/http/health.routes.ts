import { Router, Request, Response } from 'express';
import { prisma } from '../db/prisma.client';
import redis from '../cache/redis.client';
import { logger } from '../../config/logger';
import { env } from '../../config/env';

export const healthRoutes = Router();

healthRoutes.get('/', async (_req: Request, res: Response) => {
  try {
    const health = await performHealthCheck();

    const statusCode = health.status === 'healthy' ? 200 : 503;

    res.status(statusCode).json({
      status: health.status,
      timestamp: new Date().toISOString(),
      service: 'auth-service',
      version: '1.0.0',
      environment: env.NODE_ENV,
      uptime: process.uptime(),
      checks: health.checks,
    });
  } catch (error) {
    logger.error('Health check failed:', error instanceof Error ? error.message : String(error));
    res.status(503).json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      service: 'auth-service',
      error: 'Health check failed',
    });
  }
});

healthRoutes.get('/liveness', (_req: Request, res: Response) => {
  res.status(200).json({
    status: 'alive',
    timestamp: new Date().toISOString(),
    service: 'auth-service',
  });
});

healthRoutes.get('/readiness', async (_req: Request, res: Response) => {
  try {
    const isReady = await checkReadiness();

    if (isReady) {
      res.status(200).json({
        status: 'ready',
        timestamp: new Date().toISOString(),
        service: 'auth-service',
      });
    } else {
      res.status(503).json({
        status: 'not_ready',
        timestamp: new Date().toISOString(),
        service: 'auth-service',
      });
    }
  } catch (error) {
    logger.error('Readiness check failed:', error instanceof Error ? error.message : String(error));
    res.status(503).json({
      status: 'not_ready',
      timestamp: new Date().toISOString(),
      service: 'auth-service',
      error: 'Readiness check failed',
    });
  }
});

healthRoutes.get('/startup', async (_req: Request, res: Response) => {
  try {
    const isStarted = await checkStartup();

    if (isStarted) {
      res.status(200).json({
        status: 'started',
        timestamp: new Date().toISOString(),
        service: 'auth-service',
      });
    } else {
      res.status(503).json({
        status: 'starting',
        timestamp: new Date().toISOString(),
        service: 'auth-service',
      });
    }
  } catch (error) {
    logger.error('Startup check failed:', error instanceof Error ? error.message : String(error));
    res.status(503).json({
      status: 'failed',
      timestamp: new Date().toISOString(),
      service: 'auth-service',
      error: 'Startup check failed',
    });
  }
});

healthRoutes.get('/detailed', async (_req: Request, res: Response) => {
  try {
    const health = await performDetailedHealthCheck();
    const statusCode = health.status === 'healthy' ? 200 : 503;

    res.status(statusCode).json(health);
  } catch (error) {
    logger.error('Detailed health check failed:', error instanceof Error ? error.message : String(error));
    res.status(503).json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      service: 'auth-service',
      error: 'Detailed health check failed',
    });
  }
});

async function performHealthCheck(): Promise<{
  status: 'healthy' | 'unhealthy';
  checks: {
    database: 'up' | 'down';
    cache: 'up' | 'down';
  };
}> {
  const checks = {
    database: 'down' as 'up' | 'down',
    cache: 'down' as 'up' | 'down',
  };

  try {
    await prisma.$queryRaw`SELECT 1`;
    checks.database = 'up';
  } catch (error) {
    logger.error('Database health check failed:', error instanceof Error ? error.message : String(error));
  }

  try {
    await redis.ping();
    checks.cache = 'up';
  } catch (error) {
    logger.error('Cache health check failed:', error instanceof Error ? error.message : String(error));
  }

  const status =
    checks.database === 'up' && checks.cache === 'up' ? 'healthy' : 'unhealthy';

  return { status, checks };
}

async function performDetailedHealthCheck(): Promise<{
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: string;
  service: string;
  version: string;
  environment: string;
  uptime: number;
  memory: {
    used: number;
    total: number;
    percentage: number;
  };
  checks: {
    database: {
      status: 'up' | 'down';
      responseTime?: number;
      error?: string;
    };
    cache: {
      status: 'up' | 'down';
      responseTime?: number;
      error?: string;
    };
  };
}> {
  const memoryUsage = process.memoryUsage();
  const memoryUsedMB = Math.round(memoryUsage.heapUsed / 1024 / 1024);
  const memoryTotalMB = Math.round(memoryUsage.heapTotal / 1024 / 1024);
  const memoryPercentage = Math.round((memoryUsedMB / memoryTotalMB) * 100);

  const checks = {
    database: {
      status: 'down' as 'up' | 'down',
      responseTime: undefined as number | undefined,
      error: undefined as string | undefined,
    },
    cache: {
      status: 'down' as 'up' | 'down',
      responseTime: undefined as number | undefined,
      error: undefined as string | undefined,
    },
  };

  const dbStart = Date.now();
  try {
    await prisma.$queryRaw`SELECT 1`;
    checks.database.status = 'up';
    checks.database.responseTime = Date.now() - dbStart;
  } catch (error) {
    checks.database.error = error instanceof Error ? error.message : String(error);
    logger.error('Database health check failed:', checks.database.error);
  }

  const cacheStart = Date.now();
  try {
    await redis.ping();
    checks.cache.status = 'up';
    checks.cache.responseTime = Date.now() - cacheStart;
  } catch (error) {
    checks.cache.error = error instanceof Error ? error.message : String(error);
    logger.error('Cache health check failed:', checks.cache.error);
  }

  let status: 'healthy' | 'degraded' | 'unhealthy';
  if (checks.database.status === 'up' && checks.cache.status === 'up') {
    status = 'healthy';
  } else if (checks.database.status === 'up' || checks.cache.status === 'up') {
    status = 'degraded';
  } else {
    status = 'unhealthy';
  }

  return {
    status,
    timestamp: new Date().toISOString(),
    service: 'auth-service',
    version: '1.0.0',
    environment: env.NODE_ENV,
    uptime: process.uptime(),
    memory: {
      used: memoryUsedMB,
      total: memoryTotalMB,
      percentage: memoryPercentage,
    },
    checks,
  };
}

async function checkReadiness(): Promise<boolean> {
  try {
    await prisma.$queryRaw`SELECT 1`;
    await redis.ping();
    return true;
  } catch (error) {
    logger.error('Readiness check failed:', error instanceof Error ? error.message : String(error));
    return false;
  }
}

async function checkStartup(): Promise<boolean> {
  try {
    await prisma.$queryRaw`SELECT 1`;
    await redis.ping();
    return true;
  } catch (error) {
    logger.error('Startup check failed:', error instanceof Error ? error.message : String(error));
    return false;
  }
}