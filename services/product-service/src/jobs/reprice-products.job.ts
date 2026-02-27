import cron from 'node-cron';
import { prismaClient } from '../infrastructure/db/prisma.client';
import { redisClient } from '../infrastructure/cache/redis.client';
import { eventProducer } from '../infrastructure/messaging/event-producer';
import { logger } from '../config/logger';
import { config } from '../config';
import { createEventPayload } from '../interfaces/events/payload.types';

interface RepriceResult {
  totalProducts: number;
  repriced: number;
  skipped: number;
  errors: number;
  totalPriceIncrease: number;
  totalPriceDecrease: number;
  duration: number;
}

interface PricingRule {
  id: string;
  name: string;
  type: 'percentage' | 'fixed' | 'dynamic';
  value: number;
  conditions?: {
    categoryId?: string;
    minPrice?: number;
    maxPrice?: number;
    stockLevel?: 'low' | 'normal' | 'high';
  };
  enabled: boolean;
}

export class RepriceProductsJob {
  private cronExpression: string = '0 2 * * *';
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
      logger.warn('Reprice products job is already running');
      return;
    }

    this.task = cron.schedule(this.cronExpression, async () => {
      await this.execute();
    });

    logger.info('Reprice products job scheduled', {
      cronExpression: this.cronExpression,
    });
  }

  public stop(): void {
    if (this.task) {
      this.task.stop();
      this.task = null;
      logger.info('Reprice products job stopped');
    }
  }

  public async execute(): Promise<RepriceResult> {
    if (this.isRunning) {
      logger.warn('Reprice products job is already running, skipping this execution');
      return this.createEmptyResult();
    }

    this.isRunning = true;
    const startTime = Date.now();

    logger.info('Starting reprice products job');

    try {
      const result = await this.repriceProducts();
      
      this.lastRun = new Date();
      const duration = Date.now() - startTime;

      logger.info('Reprice products job completed', {
        ...result,
        duration,
      });

      return { ...result, duration };
    } catch (error) {
      logger.error('Reprice products job failed', {
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
      });
      throw error;
    } finally {
      this.isRunning = false;
    }
  }

  private async repriceProducts(): Promise<Omit<RepriceResult, 'duration'>> {
    const result: Omit<RepriceResult, 'duration'> = {
      totalProducts: 0,
      repriced: 0,
      skipped: 0,
      errors: 0,
      totalPriceIncrease: 0,
      totalPriceDecrease: 0,
    };

    try {
      const pricingRules = await this.getPricingRules();

      if (pricingRules.length === 0) {
        logger.info('No active pricing rules found, skipping repricing');
        return result;
      }

      const products = await prismaClient.product.findMany({
        include: {
          inventory: true,
          category: true,
        },
      });

      result.totalProducts = products.length;

      for (const product of products) {
        try {
          const repriced = await this.repriceProduct(product, pricingRules, result);
          
          if (repriced) {
            result.repriced++;
          } else {
            result.skipped++;
          }
        } catch (error) {
          result.errors++;
          logger.error('Failed to reprice product', {
            productId: product.id,
            error: error instanceof Error ? error.message : 'Unknown error',
          });
        }
      }

      await this.generateRepriceReport(result);
      
      return result;
    } catch (error) {
      logger.error('Failed to reprice products', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }

  private async getPricingRules(): Promise<PricingRule[]> {
    const cachedRules = await redisClient.get('pricing:rules');
    
    if (cachedRules) {
      return JSON.parse(cachedRules);
    }

    const rules: PricingRule[] = [
      {
        id: 'seasonal-discount',
        name: 'Seasonal Discount',
        type: 'percentage',
        value: -10,
        enabled: false,
      },
      {
        id: 'low-stock-premium',
        name: 'Low Stock Premium',
        type: 'percentage',
        value: 5,
        conditions: {
          stockLevel: 'low',
        },
        enabled: true,
      },
      {
        id: 'high-stock-discount',
        name: 'High Stock Discount',
        type: 'percentage',
        value: -5,
        conditions: {
          stockLevel: 'high',
        },
        enabled: false,
      },
    ];

    await redisClient.setEx('pricing:rules', 3600, JSON.stringify(rules));

    return rules.filter(rule => rule.enabled);
  }

  private async repriceProduct(
    product: any,
    pricingRules: PricingRule[],
    result: Omit<RepriceResult, 'duration'>
  ): Promise<boolean> {
    const applicableRules = this.getApplicableRules(product, pricingRules);

    if (applicableRules.length === 0) {
      return false;
    }

    const oldPrice = product.price;
    let newPrice = oldPrice;

    for (const rule of applicableRules) {
      newPrice = this.applyPricingRule(newPrice, rule);
    }

    newPrice = Math.round(newPrice * 100) / 100;

    if (newPrice === oldPrice) {
      return false;
    }

    const minPrice = oldPrice * 0.5;
    const maxPrice = oldPrice * 1.5;

    if (newPrice < minPrice || newPrice > maxPrice) {
      logger.warn('Price change exceeds threshold, skipping', {
        productId: product.id,
        oldPrice,
        newPrice,
        minPrice,
        maxPrice,
      });
      return false;
    }

    const changePercentage = ((newPrice - oldPrice) / oldPrice) * 100;

    if (Math.abs(changePercentage) >= config.business.priceChangeNotificationThreshold) {
      await this.notifySignificantPriceChange(product, oldPrice, newPrice, changePercentage);
    }

    await this.updateProductPrice(product.id, oldPrice, newPrice, applicableRules);

    if (newPrice > oldPrice) {
      result.totalPriceIncrease += (newPrice - oldPrice);
    } else {
      result.totalPriceDecrease += (oldPrice - newPrice);
    }

    return true;
  }

  private getApplicableRules(product: any, rules: PricingRule[]): PricingRule[] {
    return rules.filter(rule => {
      if (!rule.conditions) {
        return true;
      }

      const conditions = rule.conditions;

      if (conditions.categoryId && product.categoryId !== conditions.categoryId) {
        return false;
      }

      if (conditions.minPrice && product.price < conditions.minPrice) {
        return false;
      }

      if (conditions.maxPrice && product.price > conditions.maxPrice) {
        return false;
      }

      if (conditions.stockLevel) {
        const stockLevel = this.getStockLevel(product.inventory);
        if (stockLevel !== conditions.stockLevel) {
          return false;
        }
      }

      return true;
    });
  }

  private getStockLevel(inventory: any): 'low' | 'normal' | 'high' {
    if (!inventory) {
      return 'normal';
    }

    const { availableStock } = inventory;
    const lowThreshold = config.business.lowStockThreshold;

    if (availableStock <= lowThreshold) {
      return 'low';
    }

    if (availableStock > lowThreshold * 5) {
      return 'high';
    }

    return 'normal';
  }

  private applyPricingRule(currentPrice: number, rule: PricingRule): number {
    switch (rule.type) {
      case 'percentage':
        return currentPrice * (1 + rule.value / 100);
      
      case 'fixed':
        return currentPrice + rule.value;
      
      case 'dynamic':
        return currentPrice;
      
      default:
        return currentPrice;
    }
  }

  private async updateProductPrice(
    productId: string,
    oldPrice: number,
    newPrice: number,
    appliedRules: PricingRule[]
  ): Promise<void> {
    try {
      await prismaClient.$transaction(async (tx) => {
        await tx.product.update({
          where: { id: productId },
          data: { price: newPrice },
        });

        await tx.priceHistory.create({
          data: {
            productId,
            oldPrice,
            newPrice,
            changePercentage: ((newPrice - oldPrice) / oldPrice) * 100,
            changedBy: 'system',
            reason: `Automated repricing: ${appliedRules.map(r => r.name).join(', ')}`,
            effectiveDate: new Date(),
          },
        });
      });

      await redisClient.del(`product:${productId}`);
      await redisClient.del(`pricing:${productId}`);

      await eventProducer.publish(
        'price.changed',
        createEventPayload('price.changed', {
          productId,
          oldPrice,
          newPrice,
          currency: config.business.currency,
          effectiveDate: new Date().toISOString(),
          changedBy: 'system',
          reason: `Automated repricing: ${appliedRules.map(r => r.name).join(', ')}`,
        })
      );

      logger.info('Product price updated', {
        productId,
        oldPrice,
        newPrice,
        rules: appliedRules.map(r => r.name),
      });
    } catch (error) {
      logger.error('Failed to update product price', {
        productId,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }

  private async notifySignificantPriceChange(
    product: any,
    oldPrice: number,
    newPrice: number,
    changePercentage: number
  ): Promise<void> {
    try {
      await eventProducer.publish(
        'price.significant-change',
        createEventPayload('price.significant-change', {
          productId: product.id,
          productTitle: product.title,
          oldPrice,
          newPrice,
          changePercentage,
        })
      );

      logger.warn('Significant price change detected', {
        productId: product.id,
        title: product.title,
        oldPrice,
        newPrice,
        changePercentage: `${changePercentage.toFixed(2)}%`,
      });
    } catch (error) {
      logger.error('Failed to notify significant price change', {
        productId: product.id,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  private async generateRepriceReport(result: Omit<RepriceResult, 'duration'>): Promise<void> {
    try {
      const report = {
        timestamp: new Date().toISOString(),
        ...result,
      };

      await redisClient.setEx(
        `reprice:report:${Date.now()}`,
        7 * 24 * 60 * 60,
        JSON.stringify(report)
      );

      logger.info('Reprice report generated', report);
    } catch (error) {
      logger.error('Failed to generate reprice report', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  private createEmptyResult(): RepriceResult {
    return {
      totalProducts: 0,
      repriced: 0,
      skipped: 0,
      errors: 0,
      totalPriceIncrease: 0,
      totalPriceDecrease: 0,
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

export const repriceProductsJob = new RepriceProductsJob();

export function startRepriceProductsJob(): void {
  repriceProductsJob.start();
  logger.info('Reprice products job started');
}

export function stopRepriceProductsJob(): void {
  repriceProductsJob.stop();
  logger.info('Reprice products job stopped');
}

export async function runRepriceProductsJobNow(): Promise<RepriceResult> {
  logger.info('Running reprice products job manually');
  return await repriceProductsJob.execute();
}