import cron from 'node-cron';
import { prismaClient } from '../infrastructure/db/prisma.client';
import { redisClient } from '../infrastructure/cache/redis.client';
import { eventProducer } from '../infrastructure/messaging/event-producer';
import { logger } from '../config/logger';
import { createEventPayload } from '../interfaces/events/payload.types';

interface PurgeResult {
  totalChecked: number;
  purged: number;
  archived: number;
  skipped: number;
  errors: number;
  duration: number;
}

interface PurgeConfig {
  inactiveDays: number;
  zeroStockDays: number;
  enableArchiving: boolean;
  enableHardDelete: boolean;
  batchSize: number;
}

const defaultConfig: PurgeConfig = {
  inactiveDays: 365,
  zeroStockDays: 180,
  enableArchiving: true,
  enableHardDelete: false,
  batchSize: 100,
};

export class PurgeOutdatedProductsJob {
  private cronExpression: string = '0 3 * * 0';
  private isRunning: boolean = false;
  private lastRun: Date | null = null;
  private task: cron.ScheduledTask | null = null;
  private config: PurgeConfig;

  constructor(cronExpression?: string, config?: Partial<PurgeConfig>) {
    if (cronExpression) {
      this.cronExpression = cronExpression;
    }
    this.config = { ...defaultConfig, ...config };
  }

  public start(): void {
    if (this.task) {
      logger.warn('Purge outdated products job is already running');
      return;
    }

    this.task = cron.schedule(this.cronExpression, async () => {
      await this.execute();
    });

    logger.info('Purge outdated products job scheduled', {
      cronExpression: this.cronExpression,
      config: this.config,
    });
  }

  public stop(): void {
    if (this.task) {
      this.task.stop();
      this.task = null;
      logger.info('Purge outdated products job stopped');
    }
  }

  public async execute(): Promise<PurgeResult> {
    if (this.isRunning) {
      logger.warn('Purge outdated products job is already running, skipping this execution');
      return this.createEmptyResult();
    }

    this.isRunning = true;
    const startTime = Date.now();

    logger.info('Starting purge outdated products job');

    try {
      const result = await this.purgeOutdatedProducts();
      
      this.lastRun = new Date();
      const duration = Date.now() - startTime;

      logger.info('Purge outdated products job completed', {
        ...result,
        duration,
      });

      return { ...result, duration };
    } catch (error) {
      logger.error('Purge outdated products job failed', {
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
      });
      throw error;
    } finally {
      this.isRunning = false;
    }
  }

  private async purgeOutdatedProducts(): Promise<Omit<PurgeResult, 'duration'>> {
    const result: Omit<PurgeResult, 'duration'> = {
      totalChecked: 0,
      purged: 0,
      archived: 0,
      skipped: 0,
      errors: 0,
    };

    try {
      const outdatedProducts = await this.findOutdatedProducts();
      result.totalChecked = outdatedProducts.length;

      if (outdatedProducts.length === 0) {
        logger.info('No outdated products found');
        return result;
      }

      logger.info('Found outdated products', { count: outdatedProducts.length });

      const batches = this.createBatches(outdatedProducts, this.config.batchSize);

      for (const batch of batches) {
        await this.processBatch(batch, result);
      }

      await this.cleanupRelatedData();
      await this.generatePurgeReport(result);

      return result;
    } catch (error) {
      logger.error('Failed to purge outdated products', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }

  private async findOutdatedProducts(): Promise<any[]> {
    const inactiveDate = new Date();
    inactiveDate.setDate(inactiveDate.getDate() - this.config.inactiveDays);

    const zeroStockDate = new Date();
    zeroStockDate.setDate(zeroStockDate.getDate() - this.config.zeroStockDays);

    const products = await prismaClient.product.findMany({
      where: {
        OR: [
          {
            AND: [
              { updatedAt: { lt: inactiveDate } },
              { isActive: false },
            ],
          },
          {
            AND: [
              { updatedAt: { lt: zeroStockDate } },
              {
                inventory: {
                  totalStock: 0,
                },
              },
            ],
          },
        ],
        deletedAt: null,
      },
      include: {
        inventory: true,
        category: true,
        _count: {
          select: {
            orderItems: true,
            reviews: true,
          },
        },
      },
    });

    return products;
  }

  private createBatches<T>(items: T[], batchSize: number): T[][] {
    const batches: T[][] = [];
    for (let i = 0; i < items.length; i += batchSize) {
      batches.push(items.slice(i, i + batchSize));
    }
    return batches;
  }

  private async processBatch(
    batch: any[],
    result: Omit<PurgeResult, 'duration'>
  ): Promise<void> {
    for (const product of batch) {
      try {
        if (this.shouldSkipProduct(product)) {
          result.skipped++;
          logger.debug('Skipping product', {
            productId: product.id,
            reason: 'Has orders or reviews',
          });
          continue;
        }

        if (this.config.enableArchiving && !this.config.enableHardDelete) {
          await this.archiveProduct(product);
          result.archived++;
        } else if (this.config.enableHardDelete) {
          await this.deleteProduct(product);
          result.purged++;
        } else {
          await this.softDeleteProduct(product);
          result.archived++;
        }
      } catch (error) {
        result.errors++;
        logger.error('Failed to process product', {
          productId: product.id,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }
  }

  private shouldSkipProduct(product: any): boolean {
    if (product._count.orderItems > 0) {
      return true;
    }

    if (product._count.reviews > 5) {
      return true;
    }

    return false;
  }

  private async archiveProduct(product: any): Promise<void> {
    try {
      await prismaClient.$transaction(async (tx) => {
        await tx.productArchive.create({
          data: {
            productId: product.id,
            title: product.title,
            description: product.description,
            category: product.category?.name,
            price: product.price,
            archivedAt: new Date(),
            archivedReason: 'Outdated - No activity',
            metadata: JSON.stringify({
              lastUpdated: product.updatedAt,
              stockLevel: product.inventory?.totalStock || 0,
              orderCount: product._count.orderItems,
              reviewCount: product._count.reviews,
            }),
          },
        });

        await tx.product.update({
          where: { id: product.id },
          data: {
            deletedAt: new Date(),
            isActive: false,
          },
        });
      });

      await this.invalidateProductCache(product.id);

      await eventProducer.publish(
        'product.archived',
        createEventPayload('product.archived', {
          productId: product.id,
          title: product.title,
          category: product.category,
          reason: 'Outdated - No activity',
        })
      );

      logger.info('Product archived', {
        productId: product.id,
        title: product.title,
      });
    } catch (error) {
      logger.error('Failed to archive product', {
        productId: product.id,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }

  private async softDeleteProduct(product: any): Promise<void> {
    try {
      await prismaClient.product.update({
        where: { id: product.id },
        data: {
          deletedAt: new Date(),
          isActive: false,
        },
      });

      await this.invalidateProductCache(product.id);

      await eventProducer.publish(
        'product.deleted',
        createEventPayload('product.deleted', {
          productId: product.id,
          title: product.title,
          category: product.category,
          deletedBy: 'system',
          reason: 'Outdated - No activity',
        })
      );

      logger.info('Product soft deleted', {
        productId: product.id,
        title: product.title,
      });
    } catch (error) {
      logger.error('Failed to soft delete product', {
        productId: product.id,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }

  private async deleteProduct(product: any): Promise<void> {
    try {
      await prismaClient.$transaction(async (tx) => {
        await tx.productImage.deleteMany({
          where: { productId: product.id },
        });

        await tx.productColour.deleteMany({
          where: { productId: product.id },
        });

        await tx.productSize.deleteMany({
          where: { productId: product.id },
        });

        await tx.inventory.deleteMany({
          where: { productId: product.id },
        });

        await tx.priceHistory.deleteMany({
          where: { productId: product.id },
        });

        await tx.product.delete({
          where: { id: product.id },
        });
      });

      await this.invalidateProductCache(product.id);

      logger.warn('Product hard deleted', {
        productId: product.id,
        title: product.title,
      });
    } catch (error) {
      logger.error('Failed to hard delete product', {
        productId: product.id,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }

  private async invalidateProductCache(productId: string): Promise<void> {
    try {
      await redisClient.del(`product:${productId}`);
      await redisClient.del(`inventory:${productId}`);
      await redisClient.del(`pricing:${productId}`);
      
      const pattern = 'products:list:*';
      const keys = await redisClient.keys(pattern);
      if (keys.length > 0) {
        await redisClient.del(keys);
      }
    } catch (error) {
      logger.error('Failed to invalidate product cache', {
        productId,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  private async cleanupRelatedData(): Promise<void> {
    try {
      const orphanedInventory = await prismaClient.inventory.findMany({
        where: {
          product: null,
        },
      });

      if (orphanedInventory.length > 0) {
        await prismaClient.inventory.deleteMany({
          where: {
            id: { in: orphanedInventory.map(i => i.id) },
          },
        });

        logger.info('Cleaned up orphaned inventory records', {
          count: orphanedInventory.length,
        });
      }

      await redisClient.del('products:list:*');
      
      logger.info('Related data cleanup completed');
    } catch (error) {
      logger.error('Failed to cleanup related data', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  private async generatePurgeReport(result: Omit<PurgeResult, 'duration'>): Promise<void> {
    try {
      const report = {
        timestamp: new Date().toISOString(),
        config: this.config,
        ...result,
      };

      await redisClient.setEx(
        `purge:report:${Date.now()}`,
        30 * 24 * 60 * 60,
        JSON.stringify(report)
      );

      logger.info('Purge report generated', report);
    } catch (error) {
      logger.error('Failed to generate purge report', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  private createEmptyResult(): PurgeResult {
    return {
      totalChecked: 0,
      purged: 0,
      archived: 0,
      skipped: 0,
      errors: 0,
      duration: 0,
    };
  }

  public getLastRun(): Date | null {
    return this.lastRun;
  }

  public isJobRunning(): boolean {
    return this.isRunning;
  }

  public getCronExpression(): string {
    return this.cronExpression;
  }

  public getConfig(): PurgeConfig {
    return { ...this.config };
  }

  public updateConfig(config: Partial<PurgeConfig>): void {
    this.config = { ...this.config, ...config };
    logger.info('Purge config updated', { config: this.config });
  }
}

export const purgeOutdatedProductsJob = new PurgeOutdatedProductsJob();

export function startPurgeOutdatedProductsJob(): void {
  purgeOutdatedProductsJob.start();
  logger.info('Purge outdated products job started');
}

export function stopPurgeOutdatedProductsJob(): void {
  purgeOutdatedProductsJob.stop();
  logger.info('Purge outdated products job stopped');
}

export async function runPurgeOutdatedProductsJobNow(): Promise<PurgeResult> {
  logger.info('Running purge outdated products job manually');
  return await purgeOutdatedProductsJob.execute();
}