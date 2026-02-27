import cron from 'node-cron';
import { prisma } from '../infrastructure/db/prisma.client';
import { logger } from '../config/logger';
import { redisClient } from '../infrastructure/cache/redis.client';

interface PasswordResetCleanupResult {
  expired: number;
  used: number;
  abandoned: number;
  cached: number;
}

type AnyPrisma = Record<string, any>;
const db = prisma as unknown as AnyPrisma;

export class ExpirePasswordResetJob {
  private cronExpression: string;
  private task: cron.ScheduledTask | null = null;
  private isRunning: boolean = false;
  private readonly jobName: string = 'ExpirePasswordResetJob';
  private readonly abandonedThresholdHours: number = 24;
  private readonly usedRetentionDays: number = 7;

  constructor(
    cronExpression: string = '*/30 * * * *',
    abandonedThresholdHours: number = 24
  ) {
    this.cronExpression = cronExpression;
    this.abandonedThresholdHours = abandonedThresholdHours;
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
        this.expirePasswordResetTokens(),
        this.cleanupUsedTokens(),
        this.cleanupAbandonedTokens(),
        this.cleanupRedisCache(),
        this.detectSuspiciousActivity(),
        this.updatePasswordResetStatistics(),
      ]);

      const errors = results.filter((r) => r.status === 'rejected');
      if (errors.length > 0) {
        logger.error(
          `${this.jobName} completed with errors: ${JSON.stringify(
            errors.map((e) => (e as PromiseRejectedResult).reason)
          )}`
        );
      } else {
        logger.info(
          `${this.jobName} completed successfully | duration: ${Date.now() - startTime}ms`
        );
      }
    } catch (error) {
      logger.error(
        `${this.jobName} failed | error: ${error instanceof Error ? error.message : 'Unknown error'} | stack: ${error instanceof Error ? error.stack : ''}`
      );
    } finally {
      this.isRunning = false;
    }
  }

  private async expirePasswordResetTokens(): Promise<number> {
    try {
      const now = new Date();

      const result = await db['passwordResetToken'].updateMany({
        where: {
          expiresAt: { lt: now },
          isUsed: false,
          isExpired: false,
          deletedAt: null,
        },
        data: {
          isExpired: true,
          expiredAt: now,
        },
      });

      logger.info(`Expired password reset tokens | count: ${result.count}`);

      return result.count;
    } catch (error) {
      logger.error(
        `Failed to expire password reset tokens | error: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
      throw error;
    }
  }

  private async cleanupUsedTokens(): Promise<number> {
    try {
      const usedRetentionThreshold = new Date();
      usedRetentionThreshold.setDate(usedRetentionThreshold.getDate() - this.usedRetentionDays);

      const result = await db['passwordResetToken'].deleteMany({
        where: {
          isUsed: true,
          usedAt: { lt: usedRetentionThreshold },
          deletedAt: null,
        },
      });

      logger.info(
        `Cleaned up used password reset tokens | count: ${result.count} | retentionDays: ${this.usedRetentionDays}`
      );

      return result.count;
    } catch (error) {
      logger.error(
        `Failed to cleanup used password reset tokens | error: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
      throw error;
    }
  }

  private async cleanupAbandonedTokens(): Promise<number> {
    try {
      const abandonedThreshold = new Date();
      abandonedThreshold.setHours(abandonedThreshold.getHours() - this.abandonedThresholdHours);

      const result = await db['passwordResetToken'].deleteMany({
        where: {
          createdAt: { lt: abandonedThreshold },
          isUsed: false,
          isExpired: true,
          deletedAt: null,
        },
      });

      logger.info(
        `Cleaned up abandoned password reset tokens | count: ${result.count} | thresholdHours: ${this.abandonedThresholdHours}`
      );

      return result.count;
    } catch (error) {
      logger.error(
        `Failed to cleanup abandoned password reset tokens | error: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
      throw error;
    }
  }

  private async cleanupRedisCache(): Promise<number> {
    try {
      try {
        await redisClient.ping();
      } catch {
        logger.warn('Redis is not connected, skipping cache cleanup');
        return 0;
      }

      const resetTokenKeys = await redisClient.keys('password_reset:*');
      let cleanedCount = 0;

      for (const key of resetTokenKeys) {
        const token = key.replace('password_reset:', '');

        const resetToken = await db['passwordResetToken'].findUnique({
          where: { token },
        });

        if (
          !resetToken ||
          resetToken.deletedAt ||
          resetToken.isUsed ||
          resetToken.isExpired ||
          resetToken.expiresAt < new Date()
        ) {
          await redisClient.del(key);
          cleanedCount++;
        }
      }

      logger.info(`Cleaned up Redis password reset cache | count: ${cleanedCount}`);

      return cleanedCount;
    } catch (error) {
      logger.error(
        `Failed to cleanup Redis password reset cache | error: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
      throw error;
    }
  }

  private async detectSuspiciousActivity(): Promise<{
    suspiciousUsers: number;
    suspiciousIPs: number;
  }> {
    try {
      const last24Hours = new Date();
      last24Hours.setHours(last24Hours.getHours() - 24);

      const suspiciousUsers = await db['passwordResetToken'].groupBy({
        by: ['userId'],
        where: { createdAt: { gte: last24Hours } },
        _count: { userId: true },
        having: { userId: { _count: { gt: 5 } } },
      });

      const suspiciousIPs = await db['passwordResetToken'].groupBy({
        by: ['ipAddress'],
        where: {
          createdAt: { gte: last24Hours },
          ipAddress: { not: null },
        },
        _count: { ipAddress: true },
        having: { ipAddress: { _count: { gt: 10 } } },
      });

      if (suspiciousUsers.length > 0 || suspiciousIPs.length > 0) {
        logger.warn(
          `Suspicious password reset activity detected | suspiciousUsers: ${JSON.stringify(
            suspiciousUsers.map((u: { userId: string; _count: { userId: number } }) => ({
              userId: u.userId,
              count: u._count.userId,
            }))
          )} | suspiciousIPs: ${JSON.stringify(
            suspiciousIPs.map((ip: { ipAddress: string | null; _count: { ipAddress: number } }) => ({
              ipAddress: ip.ipAddress,
              count: ip._count.ipAddress,
            }))
          )}`
        );

        for (const user of suspiciousUsers) {
          await this.rateLimitUser(user.userId);
        }

        for (const ip of suspiciousIPs) {
          if (ip.ipAddress) {
            await this.rateLimitIP(ip.ipAddress);
          }
        }
      }

      logger.info(
        `Checked for suspicious password reset activity | suspiciousUsers: ${suspiciousUsers.length} | suspiciousIPs: ${suspiciousIPs.length}`
      );

      return {
        suspiciousUsers: suspiciousUsers.length,
        suspiciousIPs: suspiciousIPs.length,
      };
    } catch (error) {
      logger.error(
        `Failed to detect suspicious activity | error: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
      throw error;
    }
  }

  private async rateLimitUser(userId: string): Promise<void> {
    try {
      const lockKey = `password_reset_lock:user:${userId}`;
      const lockDuration = 3600;

      await redisClient.set(lockKey, '1', lockDuration);

      logger.info(
        `Rate limited user for password reset | userId: ${userId} | duration: ${lockDuration}s`
      );
    } catch (error) {
      logger.error(
        `Failed to rate limit user | userId: ${userId} | error: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  private async rateLimitIP(ipAddress: string): Promise<void> {
    try {
      const lockKey = `password_reset_lock:ip:${ipAddress}`;
      const lockDuration = 3600;

      await redisClient.set(lockKey, '1', lockDuration);

      logger.info(
        `Rate limited IP for password reset | ipAddress: ${ipAddress} | duration: ${lockDuration}s`
      );
    } catch (error) {
      logger.error(
        `Failed to rate limit IP | ipAddress: ${ipAddress} | error: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  private async updatePasswordResetStatistics(): Promise<void> {
    try {
      const totalTokens = await db['passwordResetToken'].count({
        where: { deletedAt: null },
      });
      const activeTokens = await db['passwordResetToken'].count({
        where: {
          deletedAt: null,
          isUsed: false,
          isExpired: false,
          expiresAt: { gte: new Date() },
        },
      });
      const usedTokens = await db['passwordResetToken'].count({
        where: { deletedAt: null, isUsed: true },
      });
      const expiredTokens = await db['passwordResetToken'].count({
        where: {
          deletedAt: null,
          OR: [{ isExpired: true }, { expiresAt: { lt: new Date() } }],
        },
      });

      const last24Hours = new Date();
      last24Hours.setHours(last24Hours.getHours() - 24);
      const recentTokens = await db['passwordResetToken'].count({
        where: { createdAt: { gte: last24Hours } },
      });

      logger.info(
        `Password reset statistics | total: ${totalTokens} | active: ${activeTokens} | used: ${usedTokens} | expired: ${expiredTokens} | last24Hours: ${recentTokens}`
      );
    } catch (error) {
      logger.error(
        `Failed to update password reset statistics | error: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
      throw error;
    }
  }

  public async revokeUserPasswordResets(userId: string): Promise<number> {
    try {
      const result = await db['passwordResetToken'].updateMany({
        where: {
          userId,
          isUsed: false,
          isExpired: false,
          deletedAt: null,
        },
        data: {
          isExpired: true,
          expiredAt: new Date(),
        },
      });

      const tokens = await db['passwordResetToken'].findMany({
        where: { userId, isExpired: true },
        select: { token: true },
      });

      for (const { token } of tokens) {
        await redisClient.del(`password_reset:${token}`);
      }

      logger.info(
        `Revoked all user password reset tokens | userId: ${userId} | count: ${result.count}`
      );

      return result.count;
    } catch (error) {
      logger.error(
        `Failed to revoke user password reset tokens | userId: ${userId} | error: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
      throw error;
    }
  }

  public async expireSpecificToken(token: string): Promise<boolean> {
    try {
      const resetToken = await db['passwordResetToken'].findUnique({
        where: { token },
      });

      if (!resetToken || resetToken.isUsed || resetToken.isExpired) {
        return false;
      }

      await db['passwordResetToken'].update({
        where: { token },
        data: {
          isExpired: true,
          expiredAt: new Date(),
        },
      });

      await redisClient.del(`password_reset:${token}`);

      logger.info(`Expired specific password reset token | token: ${token.substring(0, 10)}...`);

      return true;
    } catch (error) {
      logger.error(
        `Failed to expire specific token | error: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
      throw error;
    }
  }

  public async performFullCleanup(): Promise<PasswordResetCleanupResult> {
    try {
      const [expired, used, abandoned, cached] = await Promise.all([
        this.expirePasswordResetTokens(),
        this.cleanupUsedTokens(),
        this.cleanupAbandonedTokens(),
        this.cleanupRedisCache(),
      ]);

      await this.detectSuspiciousActivity();
      await this.updatePasswordResetStatistics();

      const result = { expired, used, abandoned, cached };

      logger.info(
        `Full password reset cleanup completed | expired: ${result.expired} | used: ${result.used} | abandoned: ${result.abandoned} | cached: ${result.cached}`
      );

      return result;
    } catch (error) {
      logger.error(
        `Failed to perform full cleanup | error: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
      throw error;
    }
  }

  public async getTokenAnalytics(days: number = 30): Promise<{
    totalRequested: number;
    totalUsed: number;
    totalExpired: number;
    totalAbandoned: number;
    usageRate: number;
    avgTimeToUse: number;
  }> {
    try {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      const tokens = await db['passwordResetToken'].findMany({
        where: { createdAt: { gte: startDate } },
      });

      type TokenWithTime = {
        isUsed: boolean;
        usedAt: Date | null;
        createdAt: Date;
        isExpired: boolean;
      };

      const totalRequested = tokens.length;
      const totalUsed = tokens.filter((t: TokenWithTime) => t.isUsed).length;
      const totalExpired = tokens.filter((t: TokenWithTime) => t.isExpired).length;
      const totalAbandoned = tokens.filter(
        (t: TokenWithTime) => !t.isUsed && t.isExpired
      ).length;
      const usageRate = totalRequested > 0 ? (totalUsed / totalRequested) * 100 : 0;

      const usedTokensWithTime = tokens.filter(
        (t: TokenWithTime) => t.isUsed && t.usedAt && t.createdAt
      );

      const avgTimeToUse =
        usedTokensWithTime.length > 0
          ? usedTokensWithTime.reduce(
              (sum: number, t: TokenWithTime) =>
                sum + (t.usedAt!.getTime() - t.createdAt.getTime()) / (1000 * 60),
              0
            ) / usedTokensWithTime.length
          : 0;

      return {
        totalRequested,
        totalUsed,
        totalExpired,
        totalAbandoned,
        usageRate: Math.round(usageRate * 100) / 100,
        avgTimeToUse: Math.round(avgTimeToUse * 100) / 100,
      };
    } catch (error) {
      logger.error(
        `Failed to get token analytics | error: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
      throw error;
    }
  }

  public getStatus(): {
    isScheduled: boolean;
    isRunning: boolean;
    cronExpression: string;
    abandonedThresholdHours: number;
  } {
    return {
      isScheduled: this.task !== null,
      isRunning: this.isRunning,
      cronExpression: this.cronExpression,
      abandonedThresholdHours: this.abandonedThresholdHours,
    };
  }
}

let expirePasswordResetJob: ExpirePasswordResetJob | null = null;

export const initExpirePasswordResetJob = (
  cronExpression?: string,
  abandonedThresholdHours?: number
): ExpirePasswordResetJob => {
  if (!expirePasswordResetJob) {
    expirePasswordResetJob = new ExpirePasswordResetJob(cronExpression, abandonedThresholdHours);
  }
  return expirePasswordResetJob;
};

export const getExpirePasswordResetJob = (): ExpirePasswordResetJob | null =>
  expirePasswordResetJob;

export const startExpirePasswordResetJob = (
  cronExpression?: string,
  abandonedThresholdHours?: number
): void => {
  const job = initExpirePasswordResetJob(cronExpression, abandonedThresholdHours);
  job.start();
};

export const stopExpirePasswordResetJob = (): void => {
  expirePasswordResetJob?.stop();
};

export default ExpirePasswordResetJob;