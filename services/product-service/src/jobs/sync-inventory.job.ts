import cron from 'node-cron';
import { prismaClient } from '../infrastructure/db/prisma.client';
import { redisClient } from '../infrastructure/cache/redis.client';
import { eventProducer } from '../infrastructure/messaging/event-producer';
import { logger } from '../config/logger';
import { config } from '../config';
import { createEventPayload } from '../interfaces/events/payload.types';

interface InventorySyncResult {
  totalProducts: number;
  synced: number;
  lowStock: number;
  outOfStock: number;
  errors: number;
  duration: number;
}

export class SyncInventoryJob {
  private cronExpression: string = '*/15 * * * *';
  private isRunning: boolean = false;
  private lastRun: Date | null = null;
  private task: cron.ScheduledTask | null = null;

  constructor(cronExpression?: string) {
    if (cronExpression) {
      this.cronExpression = cronExpression;
    }
  }

  public start(): void {
    if (this.task) {
      logger.warn('Sync inventory job is already running');
      return;
    }

    this.task = cron.schedule(this.cronExpression, async () => {
      await this.execute();
    });

    logger.info('Sync inventory job scheduled', {
      cronExpression: this.cronExpression,
    });
  }

  public stop(): void {
    if (this.task) {
      this.task.stop();
      this.task = null;
      logger.info('Sync inventory job stopped');
    }
  }

  public async execute(): Promise<InventorySyncResult> {
    if (this.isRunning) {
      logger.warn('Sync inventory job is already running, skipping this execution');
      return this.createEmptyResult();
    }

    this.isRunning = true;
    const startTime = Date.now();

    logger.info('Starting inventory sync job');

    try {
      const result = await this.syncInventory();
      
      this.lastRun = new Date();
      const duration = Date.now() - startTime;

      logger.info('Inventory sync job completed', {
        ...result,
        duration,
      });

      return { ...result, duration };
    } catch (error) {
      logger.error('Inventory sync job failed', {
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
      });
      throw error;
    } finally {
      this.isRunning = false;
    }
  }

  private async syncInventory(): Promise<Omit<InventorySyncResult, 'duration'>> {
    const result = {
      totalProducts: 0,
      synced: 0,
      lowStock: 0,
      outOfStock: 0,
      errors: 0,
    };

    try {
      const products = await prismaClient.product.findMany({
        select: {
          id: true,
          title: true,
          inventory: true,
        },
      });

      result.totalProducts = products.length;

      for (const product of products) {
        try {
          await this.syncProductInventory(product, result);
        } catch (error) {
          result.errors++;
          logger.error('Failed to sync product inventory', {
            productId: product.id,
            error: error instanceof Error ? error.message : 'Unknown error',
          });
        }
      }

      await this.cleanupStaleCache();
      
      return result;
    } catch (error) {
      logger.error('Failed to fetch products for inventory sync', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }

  private async syncProductInventory(
    product: any,
    result: Omit<InventorySyncResult, 'duration'>
  ): Promise<void> {
    if (!product.inventory) {
      await this.createMissingInventory(product.id);
      result.synced++;
      return;
    }

    const inventory = product.inventory;
    const lowStockThreshold = config.business.lowStockThreshold;

    if (inventory.availableStock === 0) {
      result.outOfStock++;
      await this.handleOutOfStock(product);
    } else if (inventory.availableStock <= lowStockThreshold) {
      result.lowStock++;
      await this.handleLowStock(product, inventory);
    }

    await this.invalidateProductCache(product.id);
    result.synced++;
  }

  private async createMissingInventory(productId: string): Promise<void> {
    try {
      await prismaClient.inventory.create({
        data: {
          productId,
          totalStock: 0,
          availableStock: 0,
          reservedStock: 0,
          damagedStock: 0,
        },
      });

      logger.info('Created missing inventory record', { productId });
    } catch (error) {
      logger.error('Failed to create missing inventory', {
        productId,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  private async handleOutOfStock(product: any): Promise<void> {
    try {
      const lastNotified = await redisClient.get(
        `inventory:out-of-stock-notified:${product.id}`
      );

      if (!lastNotified) {
        await eventProducer.publish(
          'inventory.out-of-stock',
          createEventPayload('inventory.out-of-stock', {
            productId: product.id,
            productTitle: product.title,
            previousStock: product.inventory.totalStock,
          })
        );

        await redisClient.setEx(
          `inventory:out-of-stock-notified:${product.id}`,
          24 * 60 * 60,
          'true'
        );

        logger.warn('Out of stock notification sent', {
          productId: product.id,
          title: product.title,
        });
      }
    } catch (error) {
      logger.error('Failed to handle out of stock', {
        productId: product.id,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  private async handleLowStock(product: any, inventory: any): Promise<void> {
    try {
      const lastNotified = await redisClient.get(
        `inventory:low-stock-notified:${product.id}`
      );

      if (!lastNotified) {
        await eventProducer.publish(
          'inventory.low-stock',
          createEventPayload('inventory.low-stock', {
            productId: product.id,
            productTitle: product.title,
            stockLevel: inventory.availableStock,
            threshold: config.business.lowStockThreshold,
          })
        );

        await redisClient.setEx(
          `inventory:low-stock-notified:${product.id}`,
          12 * 60 * 60,
          'true'
        );

        logger.warn('Low stock notification sent', {
          productId: product.id,
          title: product.title,
          stockLevel: inventory.availableStock,
        });
      }
    } catch (error) {
      logger.error('Failed to handle low stock', {
        productId: product.id,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  private async invalidateProductCache(productId: string): Promise<void> {
    try {
      await redisClient.del(`product:${productId}`);
      await redisClient.del(`inventory:${productId}`);
    } catch (error) {
      logger.error('Failed to invalidate product cache', {
        productId,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  private async cleanupStaleCache(): Promise<void> {
    try {
      const pattern = 'product:*';
      const keys = await redisClient.keys(pattern);
      
      if (keys.length > 1000) {
        logger.warn('Large number of product cache keys detected', {
          count: keys.length,
        });
      }

      logger.debug('Cache cleanup check completed', {
        keysCount: keys.length,
      });
    } catch (error) {
      logger.error('Failed to cleanup stale cache', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  private createEmptyResult(): InventorySyncResult {
    return {
      totalProducts: 0,
      synced: 0,
      lowStock: 0,
      outOfStock: 0,
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
}

export const syncInventoryJob = new SyncInventoryJob();

export function startSyncInventoryJob(): void {
  syncInventoryJob.start();
  logger.info('Sync inventory job started');
}

export function stopSyncInventoryJob(): void {
  syncInventoryJob.stop();
  logger.info('Sync inventory job stopped');
}

export async function runSyncInventoryJobNow(): Promise<InventorySyncResult> {
  logger.info('Running sync inventory job manually');
  return await syncInventoryJob.execute();
}