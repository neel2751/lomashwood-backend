import { z } from 'zod';

export const InventoryUpdatedEventSchema = z.object({
  eventId: z.string().uuid(),
  eventType: z.literal('inventory.updated'),
  timestamp: z.string().datetime(),
  version: z.literal('1.0'),
  payload: z.object({
    inventoryId: z.string().uuid(),
    productId: z.string().uuid(),
    sizeId: z.string().uuid().optional(),
    colourId: z.string().uuid().optional(),
    previousQuantity: z.number().int().nonnegative(),
    newQuantity: z.number().int().nonnegative(),
    quantityChange: z.number().int(),
    changeType: z.enum(['ADJUSTMENT', 'SALE', 'RESTOCK', 'RETURN', 'DAMAGE', 'INITIAL']),
    reason: z.string().optional(),
    location: z.string().optional(),
    isInStock: z.boolean(),
    lowStockThreshold: z.number().int().nonnegative().optional(),
    isLowStock: z.boolean(),
    updatedBy: z.string().uuid(),
    updatedAt: z.string().datetime()
  }),
  metadata: z.object({
    source: z.literal('product-service'),
    correlationId: z.string().uuid().optional(),
    userId: z.string().uuid().optional(),
    orderId: z.string().uuid().optional()
  })
});

export type InventoryUpdatedEvent = z.infer<typeof InventoryUpdatedEventSchema>;

export type InventoryChangeType = 'ADJUSTMENT' | 'SALE' | 'RESTOCK' | 'RETURN' | 'DAMAGE' | 'INITIAL';

export class InventoryUpdatedEventBuilder {
  private event: Partial<InventoryUpdatedEvent>;

  constructor() {
    this.event = {
      eventType: 'inventory.updated',
      version: '1.0',
      metadata: {
        source: 'product-service'
      }
    };
  }

  withEventId(eventId: string): this {
    this.event.eventId = eventId;
    return this;
  }

  withTimestamp(timestamp: string): this {
    this.event.timestamp = timestamp;
    return this;
  }

  withPayload(payload: InventoryUpdatedEvent['payload']): this {
    this.event.payload = payload;
    return this;
  }

  withCorrelationId(correlationId: string): this {
    if (!this.event.metadata) {
      this.event.metadata = { source: 'product-service' };
    }
    this.event.metadata.correlationId = correlationId;
    return this;
  }

  withUserId(userId: string): this {
    if (!this.event.metadata) {
      this.event.metadata = { source: 'product-service' };
    }
    this.event.metadata.userId = userId;
    return this;
  }

  withOrderId(orderId: string): this {
    if (!this.event.metadata) {
      this.event.metadata = { source: 'product-service' };
    }
    this.event.metadata.orderId = orderId;
    return this;
  }

  build(): InventoryUpdatedEvent {
    const result = InventoryUpdatedEventSchema.safeParse(this.event);
    
    if (!result.success) {
      throw new Error(`Invalid InventoryUpdatedEvent: ${result.error.message}`);
    }

    return result.data;
  }
}

export const createInventoryUpdatedEvent = (
  inventoryId: string,
  productId: string,
  previousQuantity: number,
  newQuantity: number,
  changeType: InventoryChangeType,
  updatedBy: string,
  options?: {
    sizeId?: string;
    colourId?: string;
    reason?: string;
    location?: string;
    lowStockThreshold?: number;
    correlationId?: string;
    userId?: string;
    orderId?: string;
  }
): InventoryUpdatedEvent => {
  const quantityChange = newQuantity - previousQuantity;
  const isInStock = newQuantity > 0;
  const lowStockThreshold = options?.lowStockThreshold ?? 10;
  const isLowStock = newQuantity > 0 && newQuantity <= lowStockThreshold;

  const builder = new InventoryUpdatedEventBuilder()
    .withEventId(crypto.randomUUID())
    .withTimestamp(new Date().toISOString())
    .withPayload({
      inventoryId,
      productId,
      sizeId: options?.sizeId,
      colourId: options?.colourId,
      previousQuantity,
      newQuantity,
      quantityChange,
      changeType,
      reason: options?.reason,
      location: options?.location,
      isInStock,
      lowStockThreshold,
      isLowStock,
      updatedBy,
      updatedAt: new Date().toISOString()
    });

  if (options?.correlationId) {
    builder.withCorrelationId(options.correlationId);
  }

  if (options?.userId) {
    builder.withUserId(options.userId);
  }

  if (options?.orderId) {
    builder.withOrderId(options.orderId);
  }

  return builder.build();
};

export const validateInventoryUpdatedEvent = (event: unknown): InventoryUpdatedEvent => {
  const result = InventoryUpdatedEventSchema.safeParse(event);
  
  if (!result.success) {
    throw new Error(`Invalid InventoryUpdatedEvent: ${result.error.message}`);
  }

  return result.data;
};

export const calculateInventoryChange = (
  currentQuantity: number,
  changeAmount: number,
  changeType: InventoryChangeType
): number => {
  switch (changeType) {
    case 'SALE':
    case 'DAMAGE':
      return Math.max(0, currentQuantity - Math.abs(changeAmount));
    case 'RESTOCK':
    case 'RETURN':
      return currentQuantity + Math.abs(changeAmount);
    case 'ADJUSTMENT':
      return changeAmount >= 0 ? currentQuantity + changeAmount : Math.max(0, currentQuantity + changeAmount);
    case 'INITIAL':
      return Math.max(0, changeAmount);
    default:
      return currentQuantity;
  }
};

export const shouldTriggerLowStockAlert = (
  newQuantity: number,
  previousQuantity: number,
  lowStockThreshold: number
): boolean => {
  const wasAboveThreshold = previousQuantity > lowStockThreshold;
  const isNowBelowOrAtThreshold = newQuantity <= lowStockThreshold && newQuantity > 0;
  return wasAboveThreshold && isNowBelowOrAtThreshold;
};

export const shouldTriggerOutOfStockAlert = (
  newQuantity: number,
  previousQuantity: number
): boolean => {
  return previousQuantity > 0 && newQuantity === 0;
};