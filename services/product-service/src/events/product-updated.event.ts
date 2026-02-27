import { z } from 'zod';

export const ProductUpdatedEventSchema = z.object({
  eventId: z.string().uuid(),
  eventType: z.literal('product.updated'),
  timestamp: z.string().datetime(),
  version: z.literal('1.0'),
  payload: z.object({
    productId: z.string().uuid(),
    category: z.enum(['KITCHEN', 'BEDROOM']).optional(),
    title: z.string().optional(),
    description: z.string().optional(),
    price: z.number().positive().optional(),
    rangeName: z.string().optional(),
    images: z.array(z.object({
      id: z.string().uuid(),
      url: z.string().url(),
      alt: z.string().optional(),
      order: z.number().int().nonnegative()
    })).optional(),
    colours: z.array(z.object({
      id: z.string().uuid(),
      name: z.string(),
      hexCode: z.string().regex(/^#[0-9A-Fa-f]{6}$/)
    })).optional(),
    sizes: z.array(z.object({
      id: z.string().uuid(),
      title: z.string(),
      description: z.string().optional(),
      imageUrl: z.string().url().optional()
    })).optional(),
    isActive: z.boolean().optional(),
    updatedBy: z.string().uuid(),
    updatedAt: z.string().datetime(),
    changes: z.array(z.object({
      field: z.string(),
      oldValue: z.unknown().optional(),
      newValue: z.unknown().optional()
    }))
  }),
  metadata: z.object({
    source: z.literal('product-service'),
    correlationId: z.string().uuid().optional(),
    userId: z.string().uuid().optional()
  })
});

export type ProductUpdatedEvent = z.infer<typeof ProductUpdatedEventSchema>;

export interface ProductChange {
  field: string;
  oldValue?: unknown;
  newValue?: unknown;
}

export class ProductUpdatedEventBuilder {
  private event: Partial<ProductUpdatedEvent>;

  constructor() {
    this.event = {
      eventType: 'product.updated',
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

  withPayload(payload: ProductUpdatedEvent['payload']): this {
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

  build(): ProductUpdatedEvent {
    const result = ProductUpdatedEventSchema.safeParse(this.event);
    
    if (!result.success) {
      throw new Error(`Invalid ProductUpdatedEvent: ${result.error.message}`);
    }

    return result.data;
  }
}

export const createProductUpdatedEvent = (
  productId: string,
  updatedBy: string,
  changes: ProductChange[],
  updates: {
    category?: 'KITCHEN' | 'BEDROOM';
    title?: string;
    description?: string;
    price?: number;
    rangeName?: string;
    images?: Array<{
      id: string;
      url: string;
      alt?: string;
      order: number;
    }>;
    colours?: Array<{
      id: string;
      name: string;
      hexCode: string;
    }>;
    sizes?: Array<{
      id: string;
      title: string;
      description?: string;
      imageUrl?: string;
    }>;
    isActive?: boolean;
  },
  options?: {
    correlationId?: string;
    userId?: string;
  }
): ProductUpdatedEvent => {
  const builder = new ProductUpdatedEventBuilder()
    .withEventId(crypto.randomUUID())
    .withTimestamp(new Date().toISOString())
    .withPayload({
      productId,
      category: updates.category,
      title: updates.title,
      description: updates.description,
      price: updates.price,
      rangeName: updates.rangeName,
      images: updates.images,
      colours: updates.colours,
      sizes: updates.sizes,
      isActive: updates.isActive,
      updatedBy,
      updatedAt: new Date().toISOString(),
      changes
    });

  if (options?.correlationId) {
    builder.withCorrelationId(options.correlationId);
  }

  if (options?.userId) {
    builder.withUserId(options.userId);
  }

  return builder.build();
};

export const validateProductUpdatedEvent = (event: unknown): ProductUpdatedEvent => {
  const result = ProductUpdatedEventSchema.safeParse(event);
  
  if (!result.success) {
    throw new Error(`Invalid ProductUpdatedEvent: ${result.error.message}`);
  }

  return result.data;
};

export const trackChanges = <T extends Record<string, unknown>>(
  oldData: T,
  newData: Partial<T>,
  fieldsToTrack: (keyof T)[]
): ProductChange[] => {
  const changes: ProductChange[] = [];

  for (const field of fieldsToTrack) {
    if (field in newData && newData[field] !== oldData[field]) {
      changes.push({
        field: String(field),
        oldValue: oldData[field],
        newValue: newData[field]
      });
    }
  }

  return changes;
};