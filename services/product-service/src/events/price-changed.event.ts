import { z } from 'zod';

export const PriceChangedEventSchema = z.object({
  eventId: z.string().uuid(),
  eventType: z.literal('price.changed'),
  timestamp: z.string().datetime(),
  version: z.literal('1.0'),
  payload: z.object({
    productId: z.string().uuid(),
    priceId: z.string().uuid(),
    previousPrice: z.number().positive(),
    newPrice: z.number().positive(),
    priceChange: z.number(),
    priceChangePercentage: z.number(),
    currency: z.string().default('GBP'),
    effectiveFrom: z.string().datetime(),
    effectiveUntil: z.string().datetime().optional(),
    priceType: z.enum(['BASE', 'SALE', 'PROMOTIONAL', 'SEASONAL', 'CLEARANCE']),
    changeReason: z.string().optional(),
    sizeId: z.string().uuid().optional(),
    colourId: z.string().uuid().optional(),
    isActive: z.boolean(),
    changedBy: z.string().uuid(),
    changedAt: z.string().datetime()
  }),
  metadata: z.object({
    source: z.literal('product-service'),
    correlationId: z.string().uuid().optional(),
    userId: z.string().uuid().optional(),
    saleId: z.string().uuid().optional()
  })
});

export type PriceChangedEvent = z.infer<typeof PriceChangedEventSchema>;

export type PriceType = 'BASE' | 'SALE' | 'PROMOTIONAL' | 'SEASONAL' | 'CLEARANCE';

export class PriceChangedEventBuilder {
  private event: Partial<PriceChangedEvent>;

  constructor() {
    this.event = {
      eventType: 'price.changed',
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

  withPayload(payload: PriceChangedEvent['payload']): this {
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

  withSaleId(saleId: string): this {
    if (!this.event.metadata) {
      this.event.metadata = { source: 'product-service' };
    }
    this.event.metadata.saleId = saleId;
    return this;
  }

  build(): PriceChangedEvent {
    const result = PriceChangedEventSchema.safeParse(this.event);
    
    if (!result.success) {
      throw new Error(`Invalid PriceChangedEvent: ${result.error.message}`);
    }

    return result.data;
  }
}

export const createPriceChangedEvent = (
  productId: string,
  priceId: string,
  previousPrice: number,
  newPrice: number,
  priceType: PriceType,
  changedBy: string,
  effectiveFrom: Date,
  options?: {
    effectiveUntil?: Date;
    changeReason?: string;
    sizeId?: string;
    colourId?: string;
    isActive?: boolean;
    currency?: string;
    correlationId?: string;
    userId?: string;
    saleId?: string;
  }
): PriceChangedEvent => {
  const priceChange = newPrice - previousPrice;
  const priceChangePercentage = previousPrice > 0 
    ? ((priceChange / previousPrice) * 100) 
    : 0;

  const builder = new PriceChangedEventBuilder()
    .withEventId(crypto.randomUUID())
    .withTimestamp(new Date().toISOString())
    .withPayload({
      productId,
      priceId,
      previousPrice,
      newPrice,
      priceChange,
      priceChangePercentage: parseFloat(priceChangePercentage.toFixed(2)),
      currency: options?.currency ?? 'GBP',
      effectiveFrom: effectiveFrom.toISOString(),
      effectiveUntil: options?.effectiveUntil?.toISOString(),
      priceType,
      changeReason: options?.changeReason,
      sizeId: options?.sizeId,
      colourId: options?.colourId,
      isActive: options?.isActive ?? true,
      changedBy,
      changedAt: new Date().toISOString()
    });

  if (options?.correlationId) {
    builder.withCorrelationId(options.correlationId);
  }

  if (options?.userId) {
    builder.withUserId(options.userId);
  }

  if (options?.saleId) {
    builder.withSaleId(options.saleId);
  }

  return builder.build();
};

export const validatePriceChangedEvent = (event: unknown): PriceChangedEvent => {
  const result = PriceChangedEventSchema.safeParse(event);
  
  if (!result.success) {
    throw new Error(`Invalid PriceChangedEvent: ${result.error.message}`);
  }

  return result.data;
};

export const calculatePriceChange = (
  previousPrice: number,
  newPrice: number
): { amount: number; percentage: number } => {
  const amount = newPrice - previousPrice;
  const percentage = previousPrice > 0 
    ? parseFloat(((amount / previousPrice) * 100).toFixed(2))
    : 0;

  return { amount, percentage };
};

export const isPriceIncrease = (previousPrice: number, newPrice: number): boolean => {
  return newPrice > previousPrice;
};

export const isPriceDecrease = (previousPrice: number, newPrice: number): boolean => {
  return newPrice < previousPrice;
};

export const isSignificantPriceChange = (
  previousPrice: number,
  newPrice: number,
  thresholdPercentage: number = 5
): boolean => {
  const { percentage } = calculatePriceChange(previousPrice, newPrice);
  return Math.abs(percentage) >= thresholdPercentage;
};

export const formatPriceChange = (
  previousPrice: number,
  newPrice: number,
  currency: string = 'GBP'
): string => {
  const { amount, percentage } = calculatePriceChange(previousPrice, newPrice);
  const symbol = currency === 'GBP' ? '£' : currency;
  const sign = amount > 0 ? '+' : '';
  
  return `${sign}${symbol}${Math.abs(amount).toFixed(2)} (${sign}${percentage}%)`;
};