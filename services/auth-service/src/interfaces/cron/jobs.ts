import cron from 'node-cron';
import { redisClient } from '../../infrastructure/cache/redis.client';
import { prisma as rawPrisma } from '../../infrastructure/db/prisma.client';
import RedisKeys from '../../infrastructure/cache/redis.keys';
import { eventRegistry } from '../events/handlers';
import { EventType } from '../events/subscriptions';

const prisma = rawPrisma as any;

export interface CronJob {
  name: string;
  schedule: string;
  enabled: boolean;
  task: () => Promise<void>;
  onError?: (error: Error) => void;
}

export class JobRegistry {
  private jobs: Map<string, cron.ScheduledTask> = new Map();
  private jobDefinitions: Map<string, CronJob> = new Map();

  register(job: CronJob): void {
    if (this.jobs.has(job.name)) {
      throw new Error(`Job ${job.name} is already registered`);
    }
    this.jobDefinitions.set(job.name, job);
    if (job.enabled) this.start(job.name);
  }

  start(jobName: string): void {
    const jobDef = this.jobDefinitions.get(jobName);
    if (!jobDef) throw new Error(`Job ${jobName} not found`);
    if (this.jobs.has(jobName)) {
      console.log(`Job ${jobName} is already running`);
      return;
    }

    const task = cron.schedule(jobDef.schedule, async () => {
      const startTime = Date.now();
      console.log(`[${new Date().toISOString()}] Starting job: ${jobName}`);
      try {
        await jobDef.task();
        const duration = Date.now() - startTime;
        console.log(`[${new Date().toISOString()}] Completed job: ${jobName} (${duration}ms)`);
        await this.recordJobExecution(jobName, 'success', duration);
      } catch (error) {
        const duration = Date.now() - startTime;
        console.error(`[${new Date().toISOString()}] Failed job: ${jobName}`, error);
        await this.recordJobExecution(jobName, 'failed', duration, error as Error);
        if (jobDef.onError) jobDef.onError(error as Error);
      }
    });

    this.jobs.set(jobName, task);
    console.log(`Job ${jobName} started with schedule: ${jobDef.schedule}`);
  }

  stop(jobName: string): void {
    const task = this.jobs.get(jobName);
    if (task) {
      task.stop();
      this.jobs.delete(jobName);
      console.log(`Job ${jobName} stopped`);
    }
  }

  stopAll(): void {
    this.jobs.forEach((task, name) => {
      task.stop();
      console.log(`Job ${name} stopped`);
    });
    this.jobs.clear();
  }

  getStatus(jobName: string): { running: boolean; schedule?: string } {
    return {
      running: this.jobs.has(jobName),
      schedule: this.jobDefinitions.get(jobName)?.schedule,
    };
  }

  getAllStatus(): Map<string, { running: boolean; schedule: string }> {
    const status = new Map<string, { running: boolean; schedule: string }>();
    this.jobDefinitions.forEach((jobDef, name) => {
      status.set(name, { running: this.jobs.has(name), schedule: jobDef.schedule });
    });
    return status;
  }

  private async recordJobExecution(
    jobName: string,
    status: 'success' | 'failed',
    duration: number,
    error?: Error,
  ): Promise<void> {
    const key = `job_execution:${jobName}:${Date.now()}`;
    await redisClient.set(
      key,
      JSON.stringify({ jobName, status, duration, error: error?.message, timestamp: new Date().toISOString() }),
      86400,
    );
  }
}

export const cleanupExpiredSessionsJob: CronJob = {
  name: 'cleanup-expired-sessions',
  schedule: '0 */6 * * *',
  enabled: true,
  task: async () => {
    const result = await prisma.session.deleteMany({
      where: { expiresAt: { lt: new Date() } },
    });
    console.log(`Cleaned up ${result.count} expired sessions`);
  },
};

export const cleanupBlacklistedTokensJob: CronJob = {
  name: 'cleanup-blacklisted-tokens',
  schedule: '0 0 * * *',
  enabled: true,
  task: async () => {
    const pattern = RedisKeys.auth.blacklist('*');
    const keys = await redisClient.keys(pattern);
    let cleaned = 0;
    for (const key of keys) {
      const ttl = await redisClient.ttl(key);
      if (ttl === -1 || ttl === -2) {
        await redisClient.del(key);
        cleaned++;
      }
    }
    console.log(`Cleaned up ${cleaned} expired blacklisted tokens`);
  },
};

export const sendAppointmentRemindersJob: CronJob = {
  name: 'send-appointment-reminders',
  schedule: '0 9 * * *',
  enabled: true,
  task: async () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);
    const endOfTomorrow = new Date(tomorrow);
    endOfTomorrow.setHours(23, 59, 59, 999);

    const appointments = await prisma.appointment.findMany({
      where: {
        date: { gte: tomorrow, lte: endOfTomorrow },
        status: 'confirmed',
        reminderSent: false,
      },
      include: { customer: true },
    });

    for (const appointment of appointments) {
      await eventRegistry.emit(EventType.APPOINTMENT_REMINDER_SENT, {
        appointmentId: appointment.id,
        customerId: appointment.customerId,
        customerEmail: appointment.customer.email,
        customerPhone: appointment.customer.phone,
        channel: 'email',
        sentAt: new Date().toISOString(),
      });
      await prisma.appointment.update({
        where: { id: appointment.id },
        data: { reminderSent: true },
      });
    }
    console.log(`Sent reminders for ${appointments.length} appointments`);
  },
};

export const expireOldOrdersJob: CronJob = {
  name: 'expire-old-orders',
  schedule: '0 1 * * *',
  enabled: true,
  task: async () => {
    const cutoffDate = new Date();
    cutoffDate.setHours(cutoffDate.getHours() - 24);
    const result = await prisma.order.updateMany({
      where: { status: 'pending', createdAt: { lt: cutoffDate } },
      data: { status: 'expired' },
    });
    console.log(`Expired ${result.count} old orders`);
  },
};

export const syncInventoryJob: CronJob = {
  name: 'sync-inventory',
  schedule: '*/30 * * * *',
  enabled: true,
  task: async () => {
    const products = await prisma.product.findMany({
      where: { deletedAt: null },
      select: { id: true, inventory: true },
    });

    let lowStockCount = 0;
    let outOfStockCount = 0;

    for (const product of products) {
      if (product.inventory <= 0) {
        outOfStockCount++;
        await eventRegistry.emit(EventType.INVENTORY_OUT_OF_STOCK, {
          productId: product.id,
          sku: product.id,
          timestamp: new Date().toISOString(),
        });
      } else if (product.inventory <= 10) {
        lowStockCount++;
        await eventRegistry.emit(EventType.INVENTORY_LOW_STOCK, {
          productId: product.id,
          sku: product.id,
          currentQuantity: product.inventory,
          threshold: 10,
          timestamp: new Date().toISOString(),
        });
      }
    }
    console.log(`Inventory sync: ${lowStockCount} low stock, ${outOfStockCount} out of stock`);
  },
};

export const purgeCacheJob: CronJob = {
  name: 'purge-expired-cache',
  schedule: '0 */12 * * *',
  enabled: true,
  task: async () => {
    const pattern = RedisKeys.cache.api('*', '*');
    const keys = await redisClient.keys(pattern);
    let purged = 0;
    for (const key of keys) {
      const ttl = await redisClient.ttl(key);
      if (ttl === -1 || ttl === -2) {
        await redisClient.del(key);
        purged++;
      }
    }
    console.log(`Purged ${purged} expired cache entries`);
  },
};

export const generateDailyReportsJob: CronJob = {
  name: 'generate-daily-reports',
  schedule: '0 23 * * *',
  enabled: true,
  task: async () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const [orders, appointments, revenue] = await Promise.all([
      prisma.order.count({ where: { createdAt: { gte: today, lt: tomorrow } } }),
      prisma.appointment.count({ where: { createdAt: { gte: today, lt: tomorrow } } }),
      prisma.payment.aggregate({
        where: { status: 'succeeded', createdAt: { gte: today, lt: tomorrow } },
        _sum: { amount: true },
      }),
    ]);

    const report = {
      date: today.toISOString(),
      orders,
      appointments,
      revenue: revenue._sum.amount ?? 0,
    };

    await redisClient.set(
      `daily_report:${today.toISOString().split('T')[0]}`,
      JSON.stringify(report),
      604800,
    );
    console.log('Generated daily report:', report);
  },
};

export const cleanupOldLogsJob: CronJob = {
  name: 'cleanup-old-logs',
  schedule: '0 2 * * 0',
  enabled: true,
  task: async () => {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - 90);

    const result = await prisma.log.deleteMany({
      where: { createdAt: { lt: cutoffDate } },
    });
    console.log(`Deleted ${result.count} old log entries`);
  },
};

export const updateProductSearchIndexJob: CronJob = {
  name: 'update-product-search-index',
  schedule: '0 3 * * *',
  enabled: true,
  task: async () => {
    const products = await prisma.product.findMany({
      where: { deletedAt: null },
      include: { category: true, colours: true },
    });

    for (const product of products) {
      const searchData = {
        id: product.id,
        title: product.title,
        description: product.description,
        category: product.category?.name,
        colours: product.colours.map((c: { name: string }) => c.name),
      };
      await redisClient.set(
        RedisKeys.search.index(product.id),
        JSON.stringify(searchData),
        86400,
      );
    }
    console.log(`Updated search index for ${products.length} products`);
  },
};

export const anonymizeInactiveUsersJob: CronJob = {
  name: 'anonymize-inactive-users',
  schedule: '0 4 * * 0',
  enabled: false,
  task: async () => {
    const cutoffDate = new Date();
    cutoffDate.setFullYear(cutoffDate.getFullYear() - 2);

    const inactiveUsers = await prisma.user.findMany({
      where: {
        lastLoginAt: { lt: cutoffDate },
        isActive: true,
        deletedAt: null,
      },
    });

    for (const user of inactiveUsers) {
      await prisma.user.update({
        where: { id: user.id },
        data: {
          email: `anonymized_${user.id}@example.com`,
          firstName: 'Anonymized',
          lastName: 'User',
          phone: null,
          isActive: false,
          deletedAt: new Date(),
        },
      });
    }
    console.log(`Anonymized ${inactiveUsers.length} inactive users`);
  },
};

export const retryFailedWebhooksJob: CronJob = {
  name: 'retry-failed-webhooks',
  schedule: '*/15 * * * *',
  enabled: true,
  task: async () => {

    const failedWebhooks = await prisma.webhook.findMany({
      where: { status: 'failed', retries: { lt: 3 } },
    });

    for (const webhook of failedWebhooks) {
      try {
        await prisma.webhook.update({
          where: { id: webhook.id },
          data: { status: 'retrying', retries: webhook.retries + 1 },
        });
      } catch (error) {
        console.error(`Failed to retry webhook ${webhook.id}:`, error);
      }
    }
    console.log(`Retrying ${failedWebhooks.length} failed webhooks`);
  },
};

export const cleanupTempFilesJob: CronJob = {
  name: 'cleanup-temp-files',
  schedule: '0 5 * * *',
  enabled: true,
  task: async () => {
    const pattern = RedisKeys.temporary.data('*');
    const keys = await redisClient.keys(pattern);
    let cleaned = 0;
    for (const key of keys) {
      await redisClient.del(key);
      cleaned++;
    }
    console.log(`Cleaned up ${cleaned} temporary files`);
  },
};

export const jobRegistry = new JobRegistry();

export function registerAllJobs(): void {
  jobRegistry.register(cleanupExpiredSessionsJob);
  jobRegistry.register(cleanupBlacklistedTokensJob);
  jobRegistry.register(sendAppointmentRemindersJob);
  jobRegistry.register(expireOldOrdersJob);
  jobRegistry.register(syncInventoryJob);
  jobRegistry.register(purgeCacheJob);
  jobRegistry.register(generateDailyReportsJob);
  jobRegistry.register(cleanupOldLogsJob);
  jobRegistry.register(updateProductSearchIndexJob);
  jobRegistry.register(anonymizeInactiveUsersJob);
  jobRegistry.register(retryFailedWebhooksJob);
  jobRegistry.register(cleanupTempFilesJob);
}

export default jobRegistry;