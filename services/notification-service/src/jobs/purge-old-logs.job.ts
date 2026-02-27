import cron from 'node-cron';
import { Logger } from 'winston';
import type { PrismaClient } from '@prisma/client';

const RETENTION_DAYS = 90;

export function startPurgeOldLogsJob(deps: {
  prisma: PrismaClient;
  logger: Logger;
  retentionDays?: number;
}): cron.ScheduledTask {
  return cron.schedule('0 2 * * *', async () => {
    deps.logger.info('purge-old-logs job started');

    const days = deps.retentionDays ?? RETENTION_DAYS;
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - days);

    try {
      const [emails, sms, push] = await Promise.all([
        deps.prisma.emailNotification.deleteMany({
          where: { createdAt: { lt: cutoff }, status: { in: ['SENT', 'FAILED'] } },
        }),
        deps.prisma.smsNotification.deleteMany({
          where: { createdAt: { lt: cutoff }, status: { in: ['SENT', 'FAILED'] } },
        }),
        deps.prisma.pushNotification.deleteMany({
          where: { createdAt: { lt: cutoff }, status: { in: ['SENT', 'FAILED'] } },
        }),
      ]);

      deps.logger.info('purge-old-logs job completed', {
        cutoff: cutoff.toISOString(),
        deletedEmails: emails.count,
        deletedSms: sms.count,
        deletedPush: push.count,
      });
    } catch (err: unknown) {
      deps.logger.error('purge-old-logs job error', {
        error: (err as Error).message,
      });
    }
  });
}