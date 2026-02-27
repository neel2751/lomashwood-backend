import cron from 'node-cron';
import { prisma } from '../infrastructure/db/prisma.client';
import { logger } from '../config/logger';
import { redisClient } from '../infrastructure/cache/redis.client';

export interface IEventProducer {
  publishUserInactivityWarning(payload: {
    userId: string;
    email: string;
    firstName: string | null;
    lastName: string | null;
    lastLoginAt: Date | null;
    daysUntilDeactivation: number;
  }): Promise<void>;

  publishUserDeactivated(payload: {
    userId: string;
    email: string;
    reason: string;
    deactivatedAt: Date;
    lastLoginAt: Date | null;
  }): Promise<void>;

  publishUserDeleted(payload: {
    userId: string;
    deletedAt: Date;
    reason: string;
  }): Promise<void>;

  publishUserReactivated(payload: {
    userId: string;
    email: string;
    reactivatedAt: Date;
  }): Promise<void>;
}

interface DeactivationResult {
  warned: number;
  deactivated: number;
  deleted: number;
  notified: number;
}

interface InactivityTiers {
  warningDays: number;
  deactivationDays: number;
  deletionDays: number;
}

export class DeactivateInactiveUsersJob {
  private readonly prisma = prisma;
  private eventProducer: IEventProducer;
  private cronExpression: string;
  private task: cron.ScheduledTask | null = null;
  private isRunning: boolean = false;
  private readonly jobName: string = 'DeactivateInactiveUsersJob';
  private inactivityTiers: InactivityTiers;

  constructor(
    eventProducer: IEventProducer,
    cronExpression: string = '0 2 * * *',
    inactivityTiers: InactivityTiers = {
      warningDays: 60,
      deactivationDays: 90,
      deletionDays: 365,
    }
  ) {
    this.eventProducer = eventProducer;
    this.cronExpression = cronExpression;
    this.inactivityTiers = inactivityTiers;
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
        this.sendInactivityWarnings(),
        this.deactivateInactiveUsers(),
        this.deleteInactiveUsers(),
        this.cleanupUserSessions(),
        this.cleanupUserCache(),
        this.updateInactivityStatistics(),
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

  private async sendInactivityWarnings(): Promise<number> {
    try {
      const warningThreshold = new Date();
      warningThreshold.setDate(warningThreshold.getDate() - this.inactivityTiers.warningDays);

      const usersToWarn = await this.prisma.user.findMany({
        where: {
          lastLoginAt: { lt: warningThreshold },
          isActive: true,
          // emailVerifiedAt not null means email is verified
          emailVerifiedAt: { not: null },
          deletedAt: null,
        },
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          lastLoginAt: true,
        },
      });

      let warnedCount = 0;

      for (const user of usersToWarn) {
        try {
          // Store warning sent timestamp in a metadata field or log only
          // if your schema does not have inactivityWarningSentAt, add it via migration:
          // inactivityWarningSentAt DateTime?
          await (this.prisma.user as any).update({
            where: { id: user.id },
            data: { inactivityWarningSentAt: new Date() },
          });

          await this.eventProducer.publishUserInactivityWarning({
            userId: user.id,
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            lastLoginAt: user.lastLoginAt,
            daysUntilDeactivation:
              this.inactivityTiers.deactivationDays - this.inactivityTiers.warningDays,
          });

          warnedCount++;
        } catch (error) {
          logger.error(
            `Failed to send inactivity warning | userId: ${user.id} | error: ${error instanceof Error ? error.message : 'Unknown error'}`
          );
        }
      }

      logger.info(
        `Sent inactivity warnings | count: ${warnedCount} | thresholdDays: ${this.inactivityTiers.warningDays}`
      );

      return warnedCount;
    } catch (error) {
      logger.error(
        `Failed to send inactivity warnings | error: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
      throw error;
    }
  }

  private async deactivateInactiveUsers(): Promise<number> {
    try {
      const deactivationThreshold = new Date();
      deactivationThreshold.setDate(
        deactivationThreshold.getDate() - this.inactivityTiers.deactivationDays
      );

      const usersToDeactivate = await this.prisma.user.findMany({
        where: {
          lastLoginAt: { lt: deactivationThreshold },
          isActive: true,
          deletedAt: null,
        },
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          lastLoginAt: true,
        },
      });

      let deactivatedCount = 0;

      for (const user of usersToDeactivate) {
        try {
          await this.prisma.$transaction(async (tx: any) => {
            // Use (tx.user as any) for optional schema fields not yet migrated
            await (tx.user as any).update({
              where: { id: user.id },
              data: {
                isActive: false,
                // Add these fields to your schema if not present:
                // deactivatedAt DateTime?
                // deactivationReason String?
                deactivatedAt: new Date(),
                deactivationReason: 'INACTIVITY',
              },
            });

            await tx.session.updateMany({
              where: { userId: user.id, isRevoked: false },
              data: { isRevoked: true, revokedAt: new Date() },
            });

            await tx.refreshToken.updateMany({
              where: { userId: user.id, isRevoked: false },
              data: { isRevoked: true, revokedAt: new Date() },
            });
          });

          await this.eventProducer.publishUserDeactivated({
            userId: user.id,
            email: user.email,
            reason: 'INACTIVITY',
            deactivatedAt: new Date(),
            lastLoginAt: user.lastLoginAt,
          });

          await redisClient.del(`user:${user.id}`);
          await redisClient.del(`user:email:${user.email}`);

          deactivatedCount++;
        } catch (error) {
          logger.error(
            `Failed to deactivate user | userId: ${user.id} | error: ${error instanceof Error ? error.message : 'Unknown error'}`
          );
        }
      }

      logger.info(
        `Deactivated inactive users | count: ${deactivatedCount} | thresholdDays: ${this.inactivityTiers.deactivationDays}`
      );

      return deactivatedCount;
    } catch (error) {
      logger.error(
        `Failed to deactivate inactive users | error: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
      throw error;
    }
  }

  private async deleteInactiveUsers(): Promise<number> {
    try {
      const deletionThreshold = new Date();
      deletionThreshold.setDate(
        deletionThreshold.getDate() - this.inactivityTiers.deletionDays
      );

      const usersToDelete = await this.prisma.user.findMany({
        where: {
          OR: [
            { lastLoginAt: { lt: deletionThreshold } },
            { lastLoginAt: null, createdAt: { lt: deletionThreshold } },
          ],
          isActive: false,
          deletedAt: null,
        },
        select: { id: true, email: true },
      });

      let deletedCount = 0;

      for (const user of usersToDelete) {
        try {
          await this.anonymizeAndDeleteUser(user.id);
          deletedCount++;
        } catch (error) {
          logger.error(
            `Failed to delete user | userId: ${user.id} | error: ${error instanceof Error ? error.message : 'Unknown error'}`
          );
        }
      }

      logger.info(
        `Deleted inactive users | count: ${deletedCount} | thresholdDays: ${this.inactivityTiers.deletionDays}`
      );

      return deletedCount;
    } catch (error) {
      logger.error(
        `Failed to delete inactive users | error: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
      throw error;
    }
  }

  private async anonymizeAndDeleteUser(userId: string): Promise<void> {
    try {
      const anonymizedEmail = `deleted_${userId}@anonymized.local`;

      await this.prisma.$transaction(async (tx: any) => {
        await tx.user.update({
          where: { id: userId },
          data: {
            email: anonymizedEmail,
            firstName: 'Deleted',
            lastName: 'User',
            phone: null,
            avatarUrl: null,
            isActive: false,
            emailVerifiedAt: null,
            deletedAt: new Date(),
          },
        });

        await tx.session.deleteMany({ where: { userId } });
        await tx.refreshToken.deleteMany({ where: { userId } });
        await tx.passwordResetToken.deleteMany({ where: { userId } });
        await tx.emailVerificationToken.deleteMany({ where: { userId } });
      });

      await redisClient.del(`user:${userId}`);
      await redisClient.del(`user:email:${anonymizedEmail}`);

      await this.eventProducer.publishUserDeleted({
        userId,
        deletedAt: new Date(),
        reason: 'INACTIVITY',
      });

      logger.info(`Anonymized and deleted user | userId: ${userId}`);
    } catch (error) {
      logger.error(
        `Failed to anonymize and delete user | userId: ${userId} | error: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
      throw error;
    }
  }

  private async cleanupUserSessions(): Promise<number> {
    try {
      const result = await this.prisma.session.deleteMany({
        where: { user: { isActive: false } },
      });

      logger.info(`Cleaned up deactivated user sessions | count: ${result.count}`);

      return result.count;
    } catch (error) {
      logger.error(
        `Failed to cleanup user sessions | error: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
      throw error;
    }
  }

  private async cleanupUserCache(): Promise<number> {
    try {
      try {
        await redisClient.ping();
      } catch {
        logger.warn('Redis is not connected, skipping cache cleanup');
        return 0;
      }

      const deactivatedUsers = await this.prisma.user.findMany({
        where: { isActive: false },
        select: { id: true, email: true },
      });

      let cleanedCount = 0;

      for (const user of deactivatedUsers) {
        await redisClient.del(`user:${user.id}`);
        await redisClient.del(`user:email:${user.email}`);
        cleanedCount += 2;
      }

      logger.info(`Cleaned up user cache | count: ${cleanedCount}`);

      return cleanedCount;
    } catch (error) {
      logger.error(
        `Failed to cleanup user cache | error: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
      throw error;
    }
  }

  private async updateInactivityStatistics(): Promise<void> {
    try {
      const totalUsers = await this.prisma.user.count({ where: { deletedAt: null } });
      const activeUsers = await this.prisma.user.count({
        where: { isActive: true, deletedAt: null },
      });
      const deactivatedUsers = await this.prisma.user.count({
        where: { isActive: false, deletedAt: null },
      });

      const warningThreshold = new Date();
      warningThreshold.setDate(warningThreshold.getDate() - this.inactivityTiers.warningDays);
      const usersNearingInactivity = await this.prisma.user.count({
        where: { lastLoginAt: { lt: warningThreshold }, isActive: true, deletedAt: null },
      });

      const deactivationThreshold = new Date();
      deactivationThreshold.setDate(
        deactivationThreshold.getDate() - this.inactivityTiers.deactivationDays
      );
      const usersReadyForDeactivation = await this.prisma.user.count({
        where: { lastLoginAt: { lt: deactivationThreshold }, isActive: true, deletedAt: null },
      });

      logger.info(
        `Inactivity stats | total: ${totalUsers} | active: ${activeUsers} | deactivated: ${deactivatedUsers} | nearingInactivity: ${usersNearingInactivity} | readyForDeactivation: ${usersReadyForDeactivation}`
      );
    } catch (error) {
      logger.error(
        `Failed to update inactivity statistics | error: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
      throw error;
    }
  }

  public async reactivateUser(userId: string): Promise<boolean> {
    try {
      const user = await this.prisma.user.findUnique({ where: { id: userId } });

      if (!user || user.deletedAt) {
        logger.warn(`User not found or already deleted | userId: ${userId}`);
        return false;
      }

      if (user.isActive) {
        logger.warn(`User is already active | userId: ${userId}`);
        return false;
      }

      await (this.prisma.user as any).update({
        where: { id: userId },
        data: {
          isActive: true,
          // Add these fields to your schema if not present:
          // deactivatedAt DateTime?
          // deactivationReason String?
          // inactivityWarningSentAt DateTime?
          deactivatedAt: null,
          deactivationReason: null,
          inactivityWarningSentAt: null,
          lastLoginAt: new Date(),
        },
      });

      await this.eventProducer.publishUserReactivated({
        userId,
        email: user.email,
        reactivatedAt: new Date(),
      });

      await redisClient.del(`user:${userId}`);
      await redisClient.del(`user:email:${user.email}`);

      logger.info(`Reactivated user | userId: ${userId}`);

      return true;
    } catch (error) {
      logger.error(
        `Failed to reactivate user | userId: ${userId} | error: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
      throw error;
    }
  }

  public async performFullDeactivation(): Promise<DeactivationResult> {
    try {
      const [warned, deactivated, deleted] = await Promise.all([
        this.sendInactivityWarnings(),
        this.deactivateInactiveUsers(),
        this.deleteInactiveUsers(),
      ]);

      await this.cleanupUserSessions();
      await this.cleanupUserCache();
      await this.updateInactivityStatistics();

      const result = { warned, deactivated, deleted, notified: warned + deactivated };

      logger.info(
        `Full user deactivation completed | warned: ${result.warned} | deactivated: ${result.deactivated} | deleted: ${result.deleted}`
      );

      return result;
    } catch (error) {
      logger.error(
        `Failed to perform full deactivation | error: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
      throw error;
    }
  }

  public async getInactivityReport(days: number = 90): Promise<{
    totalUsers: number;
    activeUsers: number;
    inactiveUsers: number;
    deactivatedUsers: number;
    deletedUsers: number;
    averageInactiveDays: number;
  }> {
    try {
      const threshold = new Date();
      threshold.setDate(threshold.getDate() - days);

      const totalUsers = await this.prisma.user.count();
      const activeUsers = await this.prisma.user.count({
        where: { isActive: true, lastLoginAt: { gte: threshold } },
      });
      const inactiveUsers = await this.prisma.user.count({
        where: {
          isActive: true,
          OR: [{ lastLoginAt: { lt: threshold } }, { lastLoginAt: null }],
        },
      });
      const deactivatedUsers = await this.prisma.user.count({
        where: { isActive: false, deletedAt: null },
      });
      const deletedUsers = await this.prisma.user.count({
        where: { deletedAt: { not: null } },
      });

      const usersWithLastLogin = await this.prisma.user.findMany({
        where: { lastLoginAt: { not: null } },
        select: { lastLoginAt: true },
      });

      const now = Date.now();
      const totalInactiveDays = usersWithLastLogin.reduce(
        (sum: number, user: { lastLoginAt: Date | null }) => {
          if (user.lastLoginAt) {
            return sum + (now - user.lastLoginAt.getTime()) / (1000 * 60 * 60 * 24);
          }
          return sum;
        },
        0
      );

      const averageInactiveDays =
        usersWithLastLogin.length > 0 ? totalInactiveDays / usersWithLastLogin.length : 0;

      return {
        totalUsers,
        activeUsers,
        inactiveUsers,
        deactivatedUsers,
        deletedUsers,
        averageInactiveDays: Math.round(averageInactiveDays * 100) / 100,
      };
    } catch (error) {
      logger.error(
        `Failed to get inactivity report | error: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
      throw error;
    }
  }

  public getStatus(): {
    isScheduled: boolean;
    isRunning: boolean;
    cronExpression: string;
    inactivityTiers: InactivityTiers;
  } {
    return {
      isScheduled: this.task !== null,
      isRunning: this.isRunning,
      cronExpression: this.cronExpression,
      inactivityTiers: this.inactivityTiers,
    };
  }
}

let deactivateInactiveUsersJob: DeactivateInactiveUsersJob | null = null;

export const initDeactivateInactiveUsersJob = (
  producer: IEventProducer,
  cronExpression?: string,
  inactivityTiers?: InactivityTiers
): DeactivateInactiveUsersJob => {
  if (!deactivateInactiveUsersJob) {
    deactivateInactiveUsersJob = new DeactivateInactiveUsersJob(
      producer,
      cronExpression,
      inactivityTiers
    );
  }
  return deactivateInactiveUsersJob;
};

export const getDeactivateInactiveUsersJob = (): DeactivateInactiveUsersJob | null =>
  deactivateInactiveUsersJob;

export const startDeactivateInactiveUsersJob = (
  producer: IEventProducer,
  cronExpression?: string,
  inactivityTiers?: InactivityTiers
): void => {
  const job = initDeactivateInactiveUsersJob(producer, cronExpression, inactivityTiers);
  job.start();
};

export const stopDeactivateInactiveUsersJob = (): void => {
  deactivateInactiveUsersJob?.stop();
};

export default DeactivateInactiveUsersJob;