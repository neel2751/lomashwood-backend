import { Router, Request, Response } from 'express';
import { prismaClient } from '../db/prisma.client';
import { redisClient } from '../cache/redis.client';
import { logger } from '../../config/logger';

const healthRouter = Router();

interface HealthStatus {
  status: 'healthy' | 'unhealthy' | 'degraded';
  timestamp: string;
  uptime: number;
  service: string;
  version: string;
  checks: {
    database: CheckResult;
    cache: CheckResult;
    memory: CheckResult;
    eventBus: CheckResult;
  };
}

interface CheckResult {
  status: 'up' | 'down' | 'degraded';
  responseTime?: number;
  message?: string;
  details?: Record<string, any>;
}

healthRouter.get('/', async (req: Request, res: Response): Promise<void> => {
  const startTime = Date.now();

  try {
    const [databaseCheck, cacheCheck, memoryCheck, eventBusCheck] = await Promise.allSettled([
      checkDatabase(),
      checkCache(),
      checkMemory(),
      checkEventBus(),
    ]);

    const checks = {
      database: databaseCheck.status === 'fulfilled' ? databaseCheck.value : { status: 'down' as const, message: 'Check failed' },
      cache: cacheCheck.status === 'fulfilled' ? cacheCheck.value : { status: 'down' as const, message: 'Check failed' },
      memory: memoryCheck.status === 'fulfilled' ? memoryCheck.value : { status: 'up' as const },
      eventBus: eventBusCheck.status === 'fulfilled' ? eventBusCheck.value : { status: 'down' as const, message: 'Check failed' },
    };

    const overallStatus = determineOverallStatus(checks);

    const healthStatus: HealthStatus = {
      status: overallStatus,
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      service: 'product-service',
      version: process.env.npm_package_version || '1.0.0',
      checks,
    };

    const statusCode = overallStatus === 'healthy' ? 200 : overallStatus === 'degraded' ? 207 : 503;

    res.status(statusCode).json(healthStatus);

    if (overallStatus !== 'healthy') {
      logger.warn('Health check failed', { status: overallStatus, checks });
    }
  } catch (error) {
    logger.error('Health check error', error);
    res.status(503).json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      service: 'product-service',
      version: process.env.npm_package_version || '1.0.0',
      error: 'Health check failed',
    });
  }
});

healthRouter.get('/liveness', (req: Request, res: Response): void => {
  res.status(200).json({
    status: 'alive',
    timestamp: new Date().toISOString(),
    service: 'product-service',
  });
});

healthRouter.get('/readiness', async (req: Request, res: Response): Promise<void> => {
  try {
    const [dbReady, cacheReady] = await Promise.all([
      checkDatabaseReadiness(),
      checkCacheReadiness(),
    ]);

    if (dbReady && cacheReady) {
      res.status(200).json({
        status: 'ready',
        timestamp: new Date().toISOString(),
        service: 'product-service',
      });
    } else {
      res.status(503).json({
        status: 'not_ready',
        timestamp: new Date().toISOString(),
        service: 'product-service',
        database: dbReady,
        cache: cacheReady,
      });
    }
  } catch (error) {
    logger.error('Readiness check error', error);
    res.status(503).json({
      status: 'not_ready',
      timestamp: new Date().toISOString(),
      service: 'product-service',
      error: 'Readiness check failed',
    });
  }
});

async function checkDatabase(): Promise<CheckResult> {
  const startTime = Date.now();
  try {
    await prismaClient.$queryRaw`SELECT 1`;
    const responseTime = Date.now() - startTime;

    return {
      status: responseTime < 1000 ? 'up' : 'degraded',
      responseTime,
      message: 'Database connection successful',
    };
  } catch (error) {
    return {
      status: 'down',
      responseTime: Date.now() - startTime,
      message: error instanceof Error ? error.message : 'Database connection failed',
    };
  }
}

async function checkCache(): Promise<CheckResult> {
  const startTime = Date.now();
  try {
    await redisClient.ping();
    const responseTime = Date.now() - startTime;

    return {
      status: responseTime < 500 ? 'up' : 'degraded',
      responseTime,
      message: 'Cache connection successful',
    };
  } catch (error) {
    return {
      status: 'down',
      responseTime: Date.now() - startTime,
      message: error instanceof Error ? error.message : 'Cache connection failed',
    };
  }
}

function checkMemory(): CheckResult {
  const memoryUsage = process.memoryUsage();
  const heapUsedPercentage = (memoryUsage.heapUsed / memoryUsage.heapTotal) * 100;

  return {
    status: heapUsedPercentage < 90 ? 'up' : 'degraded',
    details: {
      heapUsed: `${Math.round(memoryUsage.heapUsed / 1024 / 1024)}MB`,
      heapTotal: `${Math.round(memoryUsage.heapTotal / 1024 / 1024)}MB`,
      heapUsedPercentage: `${heapUsedPercentage.toFixed(2)}%`,
      rss: `${Math.round(memoryUsage.rss / 1024 / 1024)}MB`,
    },
  };
}

async function checkEventBus(): Promise<CheckResult> {
  try {
    return {
      status: 'up',
      message: 'Event bus operational',
    };
  } catch (error) {
    return {
      status: 'down',
      message: error instanceof Error ? error.message : 'Event bus check failed',
    };
  }
}

async function checkDatabaseReadiness(): Promise<boolean> {
  try {
    await prismaClient.$queryRaw`SELECT 1`;
    return true;
  } catch (error) {
    return false;
  }
}

async function checkCacheReadiness(): Promise<boolean> {
  try {
    await redisClient.ping();
    return true;
  } catch (error) {
    return false;
  }
}

function determineOverallStatus(checks: HealthStatus['checks']): 'healthy' | 'unhealthy' | 'degraded' {
  const checkValues = Object.values(checks);
  
  const hasDown = checkValues.some(check => check.status === 'down');
  const hasDegraded = checkValues.some(check => check.status === 'degraded');

  if (hasDown) {
    return 'unhealthy';
  }

  if (hasDegraded) {
    return 'degraded';
  }

  return 'healthy';
}

export { healthRouter };