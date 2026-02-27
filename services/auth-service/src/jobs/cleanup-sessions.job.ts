import cron from 'node-cron';
import { prisma } from '../infrastructure/db/prisma.client';
import { logger } from '../config/logger';
import { redisClient } from '../infrastructure/cache/redis.client';

export class CleanupSessionsJob {
  private prisma = prisma;
  private cronExpression: string;
  private task: cron.ScheduledTask | null = null;
  private isRunning: boolean = false;
  private readonly jobName: string = 'CleanupSessionsJob';

  constructor(cronExpression: string = '0 */6 * * *') {
    this.cronExpression = cronExpression;
  }

  public start(): void {
    if (this.task) {
      logger.warn(`${this.jobName} is already scheduled`);
      return;
    }
    this.task = cron.schedule(this.cronExpression, async () => {
      await this.execute();
    });
    logger.info(`${this.jobName} scheduled with cron expression: ${this.cronExpression}`);
  }

  public stop(): void {
    if (this.task) {
      this.task.stop();
      this.task = null;
      logger.info(`${this.jobName} stopped`);
    }
  }

  public async execute(): Promise<void> {
    if (this.isRunning) {
      logger.warn(`${this.jobName} is already running, skipping this execution`);
      return;
    }

    this.isRunning = true;
    const startTime = Date.now();

    try {
      logger.info(`${this.jobName} started`);

      const results = await Promise.allSettled([
        this.cleanupExpiredSessions(),
        this.cleanupInactiveSessions(),
        this.cleanupRevokedSessions(),
        this.cleanupOrphanedSessions(),
        this.cleanupRedisSessionCache(),
        this.updateSessionStatistics(),
      ]);

      const errors = results.filter((r) => r.status === 'rejected');
      if (errors.length > 0) {
        const messages = errors
          .map((e) => (e as PromiseRejectedResult).reason?.message ?? 'Unknown error')
          .join(', ');
        logger.error(`${this.jobName} completed with errors: ${messages}`);
      } else {
        logger.info(`${this.jobName} completed successfully in ${Date.now() - startTime}ms`);
      }
    } catch (error) {
      logger.error(
        `${this.jobName} failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    } finally {
      this.isRunning = false;
    }
  }

  private async cleanupExpiredSessions(): Promise<number> {
    try {
      const result = await this.prisma.session.deleteMany({
        where: {
          expiresAt: { lt: new Date() },
        },
      });
      logger.info(`Cleaned up ${result.count} expired sessions`);
      return result.count;
    } catch (error) {
      logger.error(
        `Failed to cleanup expired sessions: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
      throw error;
    }
  }

  private async cleanupInactiveSessions(): Promise<number> {
    try {
      const threshold = new Date();
      threshold.setDate(threshold.getDate() - 30);
      const result = await this.prisma.session.deleteMany({
        where: {
          lastActiveAt: { lt: threshold },
        },
      });
      logger.info(`Cleaned up ${result.count} inactive sessions (threshold: 30 days)`);
      return result.count;
    } catch (error) {
      logger.error(
        `Failed to cleanup inactive sessions: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
      throw error;
    }
  }

  private async cleanupRevokedSessions(): Promise<number> {
    try {
      const threshold = new Date();
      threshold.setDate(threshold.getDate() - 7);
      const result = await this.prisma.session.deleteMany({
        where: {
          revokedAt: { not: null, lt: threshold },
        },
      });
      logger.info(`Cleaned up ${result.count} revoked sessions (retention: 7 days)`);
      return result.count;
    } catch (error) {
      logger.error(
        `Failed to cleanup revoked sessions: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
      throw error;
    }
  }

  private async cleanupOrphanedSessions(): Promise<number> {
    try {
      const result = await this.prisma.session.deleteMany({
        where: {
          user: {
            deletedAt: { not: null },
          },
        },
      });
      logger.info(`Cleaned up ${result.count} orphaned sessions`);
      return result.count;
    } catch (error) {
      logger.error(
        `Failed to cleanup orphaned sessions: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
      throw error;
    }
  }

  private async cleanupRedisSessionCache(): Promise<number> {
    try {
      if (!redisClient.isReady()) {
        logger.warn('Redis is not connected, skipping cache cleanup');
        return 0;
      }

      const sessionKeys = await redisClient.keys('session:*');
      let cleanedCount = 0;

      for (const key of sessionKeys) {
        const sessionId = key.replace('session:', '');
        const session = await this.prisma.session.findUnique({
          where: { id: sessionId },
        });
        if (!session || session.revokedAt !== null || session.expiresAt < new Date()) {
          await redisClient.del(key);
          cleanedCount++;
        }
      }

      logger.info(`Cleaned up ${cleanedCount} Redis session cache entries`);
      return cleanedCount;
    } catch (error) {
      logger.error(
        `Failed to cleanup Redis session cache: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
      throw error;
    }
  }

  private async updateSessionStatistics(): Promise<void> {
    try {
      const [total, active, revoked, expired] = await Promise.all([
        this.prisma.session.count(),
        this.prisma.session.count({
          where: { revokedAt: null, expiresAt: { gte: new Date() } },
        }),
        this.prisma.session.count({
          where: { revokedAt: { not: null } },
        }),
        this.prisma.session.count({
          where: { expiresAt: { lt: new Date() } },
        }),
      ]);
      logger.info(
        `Session stats — total: ${total}, active: ${active}, revoked: ${revoked}, expired: ${expired}`
      );
    } catch (error) {
      logger.error(
        `Failed to update session statistics: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
      throw error;
    }
  }

  public async cleanupUserSessions(userId: string, keepLatest: number = 5): Promise<number> {
    try {
      const userSessions = await this.prisma.session.findMany({
        where: { userId, revokedAt: null },
        orderBy: { lastActiveAt: 'desc' },
      });

      if (userSessions.length <= keepLatest) return 0;

      const sessionIds = userSessions.slice(keepLatest).map((s: { id: string }) => s.id);
      const result = await this.prisma.session.deleteMany({
        where: { id: { in: sessionIds } },
      });
      for (const sessionId of sessionIds) await redisClient.del(`session:${sessionId}`);

      logger.info(
        `Cleaned up ${result.count} excess sessions for user ${userId} (kept: ${keepLatest})`
      );
      return result.count;
    } catch (error) {
      logger.error(
        `Failed to cleanup user sessions for ${userId}: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
      throw error;
    }
  }

  public async cleanupByDeviceType(deviceType: string, daysInactive: number = 90): Promise<number> {
    try {
      const threshold = new Date();
      threshold.setDate(threshold.getDate() - daysInactive);

      const result = await this.prisma.session.deleteMany({
        where: {
          lastActiveAt: { lt: threshold },
        } as any,
      });
      logger.info(
        `Cleaned up ${result.count} ${deviceType} sessions inactive for ${daysInactive} days`
      );
      return result.count;
    } catch (error) {
      logger.error(
        `Failed to cleanup sessions by device type ${deviceType}: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
      throw error;
    }
  }

  public async performFullCleanup(): Promise<{
    expired: number;
    inactive: number;
    revoked: number;
    orphaned: number;
    cached: number;
  }> {
    try {
      const [expired, inactive, revoked, orphaned, cached] = await Promise.all([
        this.cleanupExpiredSessions(),
        this.cleanupInactiveSessions(),
        this.cleanupRevokedSessions(),
        this.cleanupOrphanedSessions(),
        this.cleanupRedisSessionCache(),
      ]);
      await this.updateSessionStatistics();
      const totals = { expired, inactive, revoked, orphaned, cached };
      logger.info(
        `Full cleanup — expired: ${expired}, inactive: ${inactive}, revoked: ${revoked}, orphaned: ${orphaned}, cached: ${cached}`
      );
      return totals;
    } catch (error) {
      logger.error(
        `Failed to perform full cleanup: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
      throw error;
    }
  }

  public getStatus(): { isScheduled: boolean; isRunning: boolean; cronExpression: string } {
    return {
      isScheduled: this.task !== null,
      isRunning: this.isRunning,
      cronExpression: this.cronExpression,
    };
  }
}

let cleanupSessionsJob: CleanupSessionsJob | null = null;

export const initCleanupSessionsJob = (cronExpression?: string): CleanupSessionsJob => {
  if (!cleanupSessionsJob) cleanupSessionsJob = new CleanupSessionsJob(cronExpression);
  return cleanupSessionsJob;
};

export const getCleanupSessionsJob = (): CleanupSessionsJob | null => cleanupSessionsJob;

export const startCleanupSessionsJob = (cronExpression?: string): void => {
  initCleanupSessionsJob(cronExpression).start();
};

export const stopCleanupSessionsJob = (): void => {
  if (cleanupSessionsJob) cleanupSessionsJob.stop();
};

export default CleanupSessionsJob;