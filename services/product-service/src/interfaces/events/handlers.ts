import { logger } from '../../config/logger';
import { prismaClient } from '../../infrastructure/db/prisma.client';
import { redisClient } from '../../infrastructure/cache/redis.client';
import { eventProducer } from '../../infrastructure/messaging/event-producer';
import {
  ProductCreatedPayload,
  ProductUpdatedPayload,
  InventoryUpdatedPayload,
  PriceChangedPayload,
  OrderCreatedPayload,
  OrderCancelledPayload,
} from './payload.types';

export interface EventHandler<T = any> {
  handle(payload: T): Promise<void>;
}

export class ProductCreatedHandler implements EventHandler<ProductCreatedPayload> {
  async handle(payload: ProductCreatedPayload): Promise<void> {
    try {
      logger.info('Handling product created event', { productId: payload.productId });

      await redisClient.del(`product:${payload.productId}`);
      await redisClient.del('products:list:*');

      await eventProducer.publish('product.created', payload);

      logger.info('Product created event handled successfully', {
        productId: payload.productId,
      });
    } catch (error) {
      logger.error('Error handling product created event', {
        error,
        payload,
      });
      throw error;
    }
  }
}

export class ProductUpdatedHandler implements EventHandler<ProductUpdatedPayload> {
  async handle(payload: ProductUpdatedPayload): Promise<void> {
    try {
      logger.info('Handling product updated event', { productId: payload.productId });

      await redisClient.del(`product:${payload.productId}`);
      await redisClient.del('products:list:*');

      if (payload.changes.includes('category')) {
        await redisClient.del('categories:products:*');
      }

      if (payload.changes.includes('colours')) {
        await redisClient.del('colours:products:*');
      }

      await eventProducer.publish('product.updated', payload);

      logger.info('Product updated event handled successfully', {
        productId: payload.productId,
        changes: payload.changes,
      });
    } catch (error) {
      logger.error('Error handling product updated event', {
        error,
        payload,
      });
      throw error;
    }
  }
}

export class InventoryUpdatedHandler implements EventHandler<InventoryUpdatedPayload> {
  async handle(payload: InventoryUpdatedPayload): Promise<void> {
    try {
      logger.info('Handling inventory updated event', {
        productId: payload.productId,
      });

      await redisClient.del(`inventory:${payload.productId}`);
      await redisClient.del(`product:${payload.productId}`);

      if (payload.stockLevel <= payload.lowStockThreshold) {
        await this.notifyLowStock(payload);
      }

      if (payload.previousStockLevel > 0 && payload.stockLevel === 0) {
        await this.notifyOutOfStock(payload);
      }

      await eventProducer.publish('inventory.updated', payload);

      logger.info('Inventory updated event handled successfully', {
        productId: payload.productId,
        stockLevel: payload.stockLevel,
      });
    } catch (error) {
      logger.error('Error handling inventory updated event', {
        error,
        payload,
      });
      throw error;
    }
  }

  private async notifyLowStock(payload: InventoryUpdatedPayload): Promise<void> {
    await eventProducer.publish('inventory.low-stock', {
      productId: payload.productId,
      stockLevel: payload.stockLevel,
      threshold: payload.lowStockThreshold,
      timestamp: new Date().toISOString(),
    });

    logger.warn('Low stock notification sent', {
      productId: payload.productId,
      stockLevel: payload.stockLevel,
    });
  }

  private async notifyOutOfStock(payload: InventoryUpdatedPayload): Promise<void> {
    await eventProducer.publish('inventory.out-of-stock', {
      productId: payload.productId,
      previousStock: payload.previousStockLevel,
      timestamp: new Date().toISOString(),
    });

    logger.warn('Out of stock notification sent', {
      productId: payload.productId,
    });
  }
}

export class PriceChangedHandler implements EventHandler<PriceChangedPayload> {
  async handle(payload: PriceChangedPayload): Promise<void> {
    try {
      logger.info('Handling price changed event', { productId: payload.productId });

      await redisClient.del(`product:${payload.productId}`);
      await redisClient.del(`pricing:${payload.productId}`);
      await redisClient.del('products:list:*');

      const priceChangePercentage = 
        ((payload.newPrice - payload.oldPrice) / payload.oldPrice) * 100;

      if (Math.abs(priceChangePercentage) >= 10) {
        await this.notifySignificantPriceChange(payload, priceChangePercentage);
      }

      await prismaClient.priceHistory.create({
        data: {
          productId: payload.productId,
          oldPrice: payload.oldPrice,
          newPrice: payload.newPrice,
          changePercentage: priceChangePercentage,
          changedBy: payload.changedBy,
          reason: payload.reason,
          effectiveDate: payload.effectiveDate,
        },
      });

      await eventProducer.publish('price.changed', payload);

      logger.info('Price changed event handled successfully', {
        productId: payload.productId,
        oldPrice: payload.oldPrice,
        newPrice: payload.newPrice,
      });
    } catch (error) {
      logger.error('Error handling price changed event', {
        error,
        payload,
      });
      throw error;
    }
  }

  private async notifySignificantPriceChange(
    payload: PriceChangedPayload,
    changePercentage: number
  ): Promise<void> {
    await eventProducer.publish('price.significant-change', {
      productId: payload.productId,
      oldPrice: payload.oldPrice,
      newPrice: payload.newPrice,
      changePercentage,
      timestamp: new Date().toISOString(),
    });

    logger.info('Significant price change notification sent', {
      productId: payload.productId,
      changePercentage: `${changePercentage.toFixed(2)}%`,
    });
  }
}

export class OrderCreatedHandler implements EventHandler<OrderCreatedPayload> {
  async handle(payload: OrderCreatedPayload): Promise<void> {
    try {
      logger.info('Handling order created event', { orderId: payload.orderId });

      for (const item of payload.items) {
        await this.reserveInventory(item.productId, item.quantity);
      }

      logger.info('Order created event handled successfully', {
        orderId: payload.orderId,
        itemCount: payload.items.length,
      });
    } catch (error) {
      logger.error('Error handling order created event', {
        error,
        payload,
      });
      throw error;
    }
  }

  private async reserveInventory(
    productId: string,
    quantity: number
  ): Promise<void> {
    const inventory = await prismaClient.inventory.findUnique({
      where: { productId },
    });

    if (!inventory) {
      throw new Error(`Inventory not found for product ${productId}`);
    }

    if (inventory.availableStock < quantity) {
      throw new Error(
        `Insufficient stock for product ${productId}. Available: ${inventory.availableStock}, Requested: ${quantity}`
      );
    }

    await prismaClient.inventory.update({
      where: { productId },
      data: {
        availableStock: {
          decrement: quantity,
        },
        reservedStock: {
          increment: quantity,
        },
      },
    });

    await redisClient.del(`inventory:${productId}`);
    await redisClient.del(`product:${productId}`);

    logger.info('Inventory reserved', {
      productId,
      quantity,
      remainingStock: inventory.availableStock - quantity,
    });
  }
}

export class OrderCancelledHandler implements EventHandler<OrderCancelledPayload> {
  async handle(payload: OrderCancelledPayload): Promise<void> {
    try {
      logger.info('Handling order cancelled event', { orderId: payload.orderId });

      for (const item of payload.items) {
        await this.releaseInventory(item.productId, item.quantity);
      }

      logger.info('Order cancelled event handled successfully', {
        orderId: payload.orderId,
        itemCount: payload.items.length,
      });
    } catch (error) {
      logger.error('Error handling order cancelled event', {
        error,
        payload,
      });
      throw error;
    }
  }

  private async releaseInventory(
    productId: string,
    quantity: number
  ): Promise<void> {
    const inventory = await prismaClient.inventory.findUnique({
      where: { productId },
    });

    if (!inventory) {
      throw new Error(`Inventory not found for product ${productId}`);
    }

    await prismaClient.inventory.update({
      where: { productId },
      data: {
        availableStock: {
          increment: quantity,
        },
        reservedStock: {
          decrement: quantity,
        },
      },
    });

    await redisClient.del(`inventory:${productId}`);
    await redisClient.del(`product:${productId}`);

    logger.info('Inventory released', {
      productId,
      quantity,
      newAvailableStock: inventory.availableStock + quantity,
    });
  }
}

export class EventHandlerRegistry {
  private handlers: Map<string, EventHandler> = new Map();

  public register(eventType: string, handler: EventHandler): void {
    this.handlers.set(eventType, handler);
    logger.debug(`Event handler registered: ${eventType}`);
  }

  public get(eventType: string): EventHandler | undefined {
    return this.handlers.get(eventType);
  }

  public async handle(eventType: string, payload: any): Promise<void> {
    const handler = this.handlers.get(eventType);

    if (!handler) {
      logger.warn(`No handler found for event type: ${eventType}`);
      return;
    }

    try {
      await handler.handle(payload);
    } catch (error) {
      logger.error(`Error handling event: ${eventType}`, { error, payload });
      throw error;
    }
  }
}

export const eventHandlerRegistry = new EventHandlerRegistry();

eventHandlerRegistry.register('product.created', new ProductCreatedHandler());
eventHandlerRegistry.register('product.updated', new ProductUpdatedHandler());
eventHandlerRegistry.register('inventory.updated', new InventoryUpdatedHandler());
eventHandlerRegistry.register('price.changed', new PriceChangedHandler());
eventHandlerRegistry.register('order.created', new OrderCreatedHandler());
eventHandlerRegistry.register('order.cancelled', new OrderCancelledHandler());

export function registerEventHandlers(): void {
  logger.info('Event handlers registered successfully');
}