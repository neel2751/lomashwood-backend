import cron from 'node-cron';
import { prisma } from '../infrastructure/db/prisma.client';
import { logger } from '../config/logger';
import { redisClient } from '../infrastructure/cache/redis.client';
import { v4 as uuidv4 } from 'uuid';

interface TokenRotationResult {
  rotated: number;
  failed: number;
  blacklisted: number;
}

// Typed alias for models not yet in schema (apiKey) or with missing fields.
// Once you add them via migration and run `npx prisma generate`, remove this
// alias and use `prisma` directly with full type safety.
type AnyPrisma = Record<string, any>;
const db = prisma as unknown as AnyPrisma;

export class RotateTokensJob {
  private cronExpression: string;
  private task: cron.ScheduledTask | null = null;
  private isRunning: boolean = false;
  private readonly jobName: string = 'RotateTokensJob';
  private readonly rotationThresholdDays: number = 7;

  constructor(
    cronExpression: string = '0 0 * * *',
    rotationThresholdDays: number = 7
  ) {
    this.cronExpression = cronExpression;
    this.rotationThresholdDays = rotationThresholdDays;
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
        this.rotateRefreshTokens(),
        this.cleanupExpiredRefreshTokens(),
        this.cleanupTokenBlacklist(),
        this.validateActiveTokens(),
        this.rotateApiKeys(),
        this.updateTokenStatistics(),
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

  private async rotateRefreshTokens(): Promise<TokenRotationResult> {
    try {
      const rotationThreshold = new Date();
      rotationThreshold.setDate(rotationThreshold.getDate() - this.rotationThresholdDays);

      // Use db alias: RefreshToken in your schema lacks deletedAt, session, sessionId,
      // deviceInfo, ipAddress, userAgent — add them via migration or adjust as needed.
      const tokensToRotate = await db['refreshToken'].findMany({
        where: {
          createdAt: { lt: rotationThreshold },
          expiresAt: { gt: new Date() },
          isRevoked: false,
        },
        include: {
          user: true,
        },
      });

      let rotated = 0;
      let failed = 0;
      let blacklisted = 0;

      for (const oldToken of tokensToRotate) {
        try {
          const newTokenValue = uuidv4();
          const expiresAt = new Date();
          expiresAt.setDate(expiresAt.getDate() + 30);

          await prisma.$transaction(async (tx: any) => {
            await tx.refreshToken.update({
              where: { id: oldToken.id },
              data: { isRevoked: true, revokedAt: new Date() },
            });

            // Only include fields that exist in your RefreshToken schema.
            // Add sessionId, deviceInfo, ipAddress, userAgent via migration if needed.
            await tx.refreshToken.create({
              data: {
                token: newTokenValue,
                userId: oldToken.userId,
                expiresAt,
              },
            });

            await this.addToBlacklist(oldToken.token, oldToken.expiresAt);
          });

          await redisClient.del(`refresh_token:${oldToken.token}`);

          rotated++;
          blacklisted++;
        } catch (error) {
          logger.error(
            `Failed to rotate refresh token | tokenId: ${oldToken.id} | error: ${error instanceof Error ? error.message : 'Unknown error'}`
          );
          failed++;
        }
      }

      logger.info(
        `Rotated refresh tokens | rotated: ${rotated} | failed: ${failed} | blacklisted: ${blacklisted}`
      );

      return { rotated, failed, blacklisted };
    } catch (error) {
      logger.error(
        `Failed to rotate refresh tokens | error: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
      throw error;
    }
  }

  private async cleanupExpiredRefreshTokens(): Promise<number> {
    try {
      // deletedAt does not exist on RefreshToken — filter by expiresAt only.
      const result = await prisma.refreshToken.deleteMany({
        where: { expiresAt: { lt: new Date() } },
      });

      logger.info(`Cleaned up expired refresh tokens | count: ${result.count}`);

      return result.count;
    } catch (error) {
      logger.error(
        `Failed to cleanup expired refresh tokens | error: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
      throw error;
    }
  }

  private async cleanupTokenBlacklist(): Promise<number> {
    try {
      const blacklistKeys = await redisClient.keys('token_blacklist:*');
      let cleanedCount = 0;

      for (const key of blacklistKeys) {
        const ttl = await redisClient.ttl(key);

        if (ttl === -1 || ttl === -2) {
          await redisClient.del(key);
          cleanedCount++;
        }
      }

      logger.info(`Cleaned up token blacklist | count: ${cleanedCount}`);

      return cleanedCount;
    } catch (error) {
      logger.error(
        `Failed to cleanup token blacklist | error: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
      throw error;
    }
  }

  private async validateActiveTokens(): Promise<{
    valid: number;
    invalid: number;
    revoked: number;
  }> {
    try {
      // Session in your schema lacks isRevoked and refreshTokens relation.
      // Query active sessions by expiresAt only, fetch tokens separately.
      const activeSessions = await db['session'].findMany({
        where: {
          expiresAt: { gt: new Date() },
        },
      });

      let valid = 0;
      let invalid = 0;
      let revoked = 0;

      for (const session of activeSessions) {
        // Fetch related refresh tokens separately since the relation doesn't exist yet.
        const refreshTokens = await db['refreshToken'].findMany({
          where: {
            sessionId: session.id,
            isRevoked: false,
          },
        });

        for (const refreshToken of refreshTokens) {
          try {
            if (refreshToken.expiresAt < new Date()) {
              await this.revokeToken(refreshToken.id);
              invalid++;
              revoked++;
            } else {
              valid++;
            }
          } catch (error) {
            logger.error(
              `Failed to validate token | tokenId: ${refreshToken.id} | error: ${error instanceof Error ? error.message : 'Unknown error'}`
            );
            invalid++;
          }
        }
      }

      logger.info(
        `Validated active tokens | valid: ${valid} | invalid: ${invalid} | revoked: ${revoked}`
      );

      return { valid, invalid, revoked };
    } catch (error) {
      logger.error(
        `Failed to validate active tokens | error: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
      throw error;
    }
  }

  private async rotateApiKeys(): Promise<number> {
    try {
      const apiKeyRotationThreshold = new Date();
      apiKeyRotationThreshold.setDate(apiKeyRotationThreshold.getDate() - 90);

      // ApiKey model does not exist yet — use db alias.
      // Add to schema: model ApiKey { id String @id, isActive Boolean, createdAt DateTime, rotationWarningAt DateTime?, deletedAt DateTime? }
      const apiKeysToRotate = await db['apiKey'].findMany({
        where: {
          createdAt: { lt: apiKeyRotationThreshold },
          isActive: true,
        },
      });

      let rotatedCount = 0;

      for (const apiKey of apiKeysToRotate) {
        try {
          await db['apiKey'].update({
            where: { id: apiKey.id },
            data: { rotationWarningAt: new Date() },
          });

          rotatedCount++;
        } catch (error) {
          logger.error(
            `Failed to flag API key for rotation | apiKeyId: ${apiKey.id} | error: ${error instanceof Error ? error.message : 'Unknown error'}`
          );
        }
      }

      logger.info(`Flagged API keys for rotation | count: ${rotatedCount}`);

      return rotatedCount;
    } catch (error) {
      logger.error(
        `Failed to rotate API keys | error: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
      return 0;
    }
  }

  private async updateTokenStatistics(): Promise<void> {
    try {
      const totalRefreshTokens = await prisma.refreshToken.count();
      const activeRefreshTokens = await prisma.refreshToken.count({
        where: { isRevoked: false, expiresAt: { gte: new Date() } },
      });
      const revokedRefreshTokens = await prisma.refreshToken.count({
        where: { isRevoked: true },
      });
      const expiredRefreshTokens = await prisma.refreshToken.count({
        where: { expiresAt: { lt: new Date() } },
      });

      logger.info(
        `Token statistics | total: ${totalRefreshTokens} | active: ${activeRefreshTokens} | revoked: ${revokedRefreshTokens} | expired: ${expiredRefreshTokens}`
      );
    } catch (error) {
      logger.error(
        `Failed to update token statistics | error: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
      throw error;
    }
  }

  private async addToBlacklist(token: string, expiresAt: Date): Promise<void> {
    try {
      const ttl = Math.max(0, Math.floor((expiresAt.getTime() - Date.now()) / 1000));

      if (ttl > 0) {
        await redisClient.set(`token_blacklist:${token}`, '1', ttl);
      }
    } catch (error) {
      logger.error(
        `Failed to add token to blacklist | error: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  private async revokeToken(tokenId: string): Promise<void> {
    try {
      await prisma.refreshToken.update({
        where: { id: tokenId },
        data: { isRevoked: true, revokedAt: new Date() },
      });
    } catch (error) {
      logger.error(
        `Failed to revoke token | tokenId: ${tokenId} | error: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
      throw error;
    }
  }

  public async revokeUserTokens(userId: string): Promise<number> {
    try {
      const tokens = await prisma.refreshToken.findMany({
        where: { userId, isRevoked: false },
      });

      const result = await prisma.refreshToken.updateMany({
        where: { userId, isRevoked: false },
        data: { isRevoked: true, revokedAt: new Date() },
      });

      for (const token of tokens) {
        await this.addToBlacklist(token.token, token.expiresAt);
        await redisClient.del(`refresh_token:${token.token}`);
      }

      logger.info(`Revoked all user tokens | userId: ${userId} | count: ${result.count}`);

      return result.count;
    } catch (error) {
      logger.error(
        `Failed to revoke user tokens | userId: ${userId} | error: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
      throw error;
    }
  }

  public async forceRotateToken(tokenId: string): Promise<string> {
    try {
      const oldToken = await db['refreshToken'].findUnique({
        where: { id: tokenId },
        include: { user: true },
      });

      if (!oldToken) throw new Error('Token not found');
      if (oldToken.isRevoked) throw new Error('Token is already revoked');

      const newTokenValue = uuidv4();
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 30);

      const newToken = await prisma.$transaction(async (tx: any) => {
        await tx.refreshToken.update({
          where: { id: oldToken.id },
          data: { isRevoked: true, revokedAt: new Date() },
        });

        return tx.refreshToken.create({
          data: {
            token: newTokenValue,
            userId: oldToken.userId,
            expiresAt,
          },
        });
      });

      await this.addToBlacklist(oldToken.token, oldToken.expiresAt);
      await redisClient.del(`refresh_token:${oldToken.token}`);

      logger.info(`Force rotated token | oldTokenId: ${tokenId} | newTokenId: ${newToken.id}`);

      return newToken.token;
    } catch (error) {
      logger.error(
        `Failed to force rotate token | tokenId: ${tokenId} | error: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
      throw error;
    }
  }

  public async performFullRotation(): Promise<TokenRotationResult> {
    try {
      const refreshResult = await this.rotateRefreshTokens();
      await this.cleanupExpiredRefreshTokens();
      await this.cleanupTokenBlacklist();
      await this.validateActiveTokens();
      await this.rotateApiKeys();
      await this.updateTokenStatistics();

      logger.info(
        `Full token rotation completed | rotated: ${refreshResult.rotated} | failed: ${refreshResult.failed} | blacklisted: ${refreshResult.blacklisted}`
      );

      return refreshResult;
    } catch (error) {
      logger.error(
        `Failed to perform full rotation | error: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
      throw error;
    }
  }

  public getStatus(): {
    isScheduled: boolean;
    isRunning: boolean;
    cronExpression: string;
    rotationThresholdDays: number;
  } {
    return {
      isScheduled: this.task !== null,
      isRunning: this.isRunning,
      cronExpression: this.cronExpression,
      rotationThresholdDays: this.rotationThresholdDays,
    };
  }
}

let rotateTokensJob: RotateTokensJob | null = null;

export const initRotateTokensJob = (
  cronExpression?: string,
  rotationThresholdDays?: number
): RotateTokensJob => {
  if (!rotateTokensJob) {
    rotateTokensJob = new RotateTokensJob(cronExpression, rotationThresholdDays);
  }
  return rotateTokensJob;
};

export const getRotateTokensJob = (): RotateTokensJob | null => rotateTokensJob;

export const startRotateTokensJob = (
  cronExpression?: string,
  rotationThresholdDays?: number
): void => {
  const job = initRotateTokensJob(cronExpression, rotationThresholdDays);
  job.start();
};

export const stopRotateTokensJob = (): void => {
  rotateTokensJob?.stop();
};

export default RotateTokensJob;