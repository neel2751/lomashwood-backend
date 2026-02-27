import cron from 'node-cron';
import { Logger } from 'winston';
import type { PrismaClient } from '@prisma/client';

const DRAFT_STALE_DAYS = 30;

export function startCleanupTemplatesJob(deps: {
  prisma: PrismaClient;
  logger: Logger;
  staleDays?: number;
}): cron.ScheduledTask {
  return cron.schedule('0 3 * * 0', async () => {
    deps.logger.info('cleanup-templates job started');

    const days = deps.staleDays ?? DRAFT_STALE_DAYS;
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - days);

    try {
      const stale = await deps.prisma.notificationTemplate.findMany({
        where: {
          status: 'DRAFT',
          updatedAt: { lt: cutoff },
        },
        select: { id: true, slug: true },
      });

      if (!stale.length) {
        deps.logger.info('cleanup-templates: no stale drafts found');
        return;
      }

      const ids = stale.map((t) => t.id);

      await deps.prisma.$transaction([
        deps.prisma.notificationTemplateVersion.deleteMany({
          where: { templateId: { in: ids } },
        }),
        deps.prisma.notificationTemplate.deleteMany({
          where: { id: { in: ids } },
        }),
      ]);

      deps.logger.info('cleanup-templates job completed', {
        deletedCount: stale.length,
        slugs: stale.map((t) => t.slug),
      });
    } catch (err: unknown) {
      deps.logger.error('cleanup-templates job error', {
        error: (err as Error).message,
      });
    }
  });
}