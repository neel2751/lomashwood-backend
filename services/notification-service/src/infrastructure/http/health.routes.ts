import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import type { RedisClientType } from 'redis';
import { PushHealthChecker, PushInfraProvider } from '../push/push-health';
import { SmsHealthChecker, SmsProvider } from '../sms/sms-health';
import { EmailHealthChecker, EmailProvider } from '../email/email-health';
import { EventConsumer } from '../messaging/event-consumer';

export interface HealthDependencies {
  prisma: PrismaClient;
  redis: RedisClientType;
  emailHealthChecker: EmailHealthChecker;
  smsHealthChecker: SmsHealthChecker;
  pushHealthChecker: PushHealthChecker;
  eventConsumer: EventConsumer;
  activeEmailProvider: EmailProvider;
  activeSmsProvider: SmsProvider;
  activePushProvider: PushInfraProvider;
}

export function createHealthRouter(deps: HealthDependencies): Router {
  const router = Router();

  // ── Liveness — is the process alive? ─────────────────────────────────────
  router.get('/live', (_req: Request, res: Response) => {
    res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  // ── Readiness — are all critical dependencies reachable? ─────────────────
  router.get('/ready', async (_req: Request, res: Response) => {
    const checks = await Promise.allSettled([
      checkPrisma(deps.prisma),
      checkRedis(deps.redis),
    ]);

    const [prismaResult, redisResult] = checks.map((c) =>
      c.status === 'fulfilled' ? c.value : { healthy: false, error: (c.reason as Error).message },
    );

    const allHealthy = prismaResult.healthy && redisResult.healthy;

    res.status(allHealthy ? 200 : 503).json({
      status: allHealthy ? 'ready' : 'not_ready',
      checks: {
        database: prismaResult,
        cache: redisResult,
      },
      timestamp: new Date().toISOString(),
    });
  });

  // ── Full health — includes all notification channel providers ─────────────
  router.get('/', async (_req: Request, res: Response) => {
    const [prismaCheck, redisCheck, emailReport, smsReport, pushReport] =
      await Promise.all([
        checkPrisma(deps.prisma),
        checkRedis(deps.redis),
        deps.emailHealthChecker.checkAll(deps.activeEmailProvider),
        deps.smsHealthChecker.checkAll(deps.activeSmsProvider),
        deps.pushHealthChecker.checkAll(deps.activePushProvider),
      ]);

    const overall =
      prismaCheck.healthy &&
      redisCheck.healthy &&
      emailReport.overall &&
      smsReport.overall &&
      pushReport.overall;

    const consumerRunning = deps.eventConsumer.isRunning();

    res.status(overall ? 200 : 503).json({
      status: overall ? 'healthy' : 'degraded',
      service: 'notification-service',
      checks: {
        database: prismaCheck,
        cache: redisCheck,
        eventConsumer: {
          healthy: consumerRunning,
          running: consumerRunning,
        },
        email: emailReport,
        sms: smsReport,
        push: pushReport,
      },
      timestamp: new Date().toISOString(),
    });
  });

  return router;
}

// ---------------------------------------------------------------------------
// Private check helpers
// ---------------------------------------------------------------------------

async function checkPrisma(
  prisma: PrismaClient,
): Promise<{ healthy: boolean; latencyMs?: number; error?: string }> {
  const start = Date.now();
  try {
    await prisma.$queryRaw`SELECT 1`;
    return { healthy: true, latencyMs: Date.now() - start };
  } catch (err: unknown) {
    return {
      healthy: false,
      latencyMs: Date.now() - start,
      error: (err as Error).message,
    };
  }
}

async function checkRedis(
  redis: RedisClientType,
): Promise<{ healthy: boolean; latencyMs?: number; error?: string }> {
  const start = Date.now();
  try {
    const pong = await redis.ping();
    return { healthy: pong === 'PONG', latencyMs: Date.now() - start };
  } catch (err: unknown) {
    return {
      healthy: false,
      latencyMs: Date.now() - start,
      error: (err as Error).message,
    };
  }
}