import { logger } from '../config/logger';
import { FunnelRepository } from '../app/funnels/funnel.repository';
import { FunnelService } from '../app/funnels/funnel.service';

export async function recomputeFunnelsJob(): Promise<void> {
  const jobName = 'recompute-funnels';
  const start = Date.now();

  logger.info({ job: jobName }, 'Job started');

  const funnelRepository = new FunnelRepository();
  const funnelService = new FunnelService(funnelRepository);

  try {
    const { data: funnels } = await funnelRepository.findAll({ status: 'ACTIVE' as any, limit: 100 });

    if (funnels.length === 0) {
      logger.info({ job: jobName }, 'No active funnels to recompute');
      return;
    }

    const periodEnd = new Date();
    const periodStart = new Date();
    periodStart.setDate(periodStart.getDate() - 30);

    let succeeded = 0;
    let failed = 0;

    for (const funnel of funnels) {
      try {
        await funnelService.computeFunnel({
          funnelId: funnel.id,
          periodStart,
          periodEnd,
        });
        succeeded++;
      } catch (error) {
        failed++;
        logger.error(
          { job: jobName, funnelId: funnel.id, error },
          'Failed to recompute funnel',
        );
      }
    }

    logger.info(
      { job: jobName, total: funnels.length, succeeded, failed, durationMs: Date.now() - start },
      'Job completed',
    );
  } catch (error) {
    logger.error({ job: jobName, error, durationMs: Date.now() - start }, 'Job failed');
    throw error;
  }
}