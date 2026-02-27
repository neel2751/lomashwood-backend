import { z } from 'zod';

export const ProductCreatedEventSchema = z.object({
  eventId: z.string().uuid(),
  eventType: z.literal('product.created'),
  timestamp: z.string().datetime(),
  version: z.literal('1.0'),
  payload: z.object({
    productId: z.string().uuid(),
    category: z.enum(['KITCHEN', 'BEDROOM']),
    title: z.string(),
    description: z.string(),
    price: z.number().positive().optional(),
    rangeName: z.string().optional(),
    images: z.array(z.object({
      id: z.string().uuid(),
      url: z.string().url(),
      alt: z.string().optional(),
      order: z.number().int().nonnegative()
    })),
    colours: z.array(z.object({
      id: z.string().uuid(),
      name: z.string(),
      hexCode: z.string().regex(/^#[0-9A-Fa-f]{6}$/)
    })),
    sizes: z.array(z.object({
      id: z.string().uuid(),
      title: z.string(),
      description: z.string().optional(),
      imageUrl: z.string().url().optional()
    })).optional(),
    isActive: z.boolean(),
    createdBy: z.string().uuid(),
    createdAt: z.string().datetime()
  }),
  metadata: z.object({
    source: z.literal('product-service'),
    correlationId: z.string().uuid().optional(),
    userId: z.string().uuid().optional()
  })
});

export type ProductCreatedEvent = z.infer<typeof ProductCreatedEventSchema>;

export class ProductCreatedEventBuilder {
  private event: Partial<ProductCreatedEvent>;

  constructor() {
    this.event = {
      eventType: 'product.created',
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

  withPayload(payload: ProductCreatedEvent['payload']): this {
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

  build(): ProductCreatedEvent {
    const result = ProductCreatedEventSchema.safeParse(this.event);
    
    if (!result.success) {
      throw new Error(`Invalid ProductCreatedEvent: ${result.error.message}`);
    }

    return result.data;
  }
}

export const createProductCreatedEvent = (
  productId: string,
  category: 'KITCHEN' | 'BEDROOM',
  title: string,
  description: string,
  images: Array<{
    id: string;
    url: string;
    alt?: string;
    order: number;
  }>,
  colours: Array<{
    id: string;
    name: string;
    hexCode: string;
  }>,
  createdBy: string,
  options?: {
    price?: number;
    rangeName?: string;
    sizes?: Array<{
      id: string;
      title: string;
      description?: string;
      imageUrl?: string;
    }>;
    isActive?: boolean;
    correlationId?: string;
    userId?: string;
  }
): ProductCreatedEvent => {
  const builder = new ProductCreatedEventBuilder()
    .withEventId(crypto.randomUUID())
    .withTimestamp(new Date().toISOString())
    .withPayload({
      productId,
      category,
      title,
      description,
      price: options?.price,
      rangeName: options?.rangeName,
      images,
      colours,
      sizes: options?.sizes,
      isActive: options?.isActive ?? true,
      createdBy,
      createdAt: new Date().toISOString()
    });

  if (options?.correlationId) {
    builder.withCorrelationId(options.correlationId);
  }

  if (options?.userId) {
    builder.withUserId(options.userId);
  }

  return builder.build();
};

export const validateProductCreatedEvent = (event: unknown): ProductCreatedEvent => {
  const result = ProductCreatedEventSchema.safeParse(event);
  
  if (!result.success) {
    throw new Error(`Invalid ProductCreatedEvent: ${result.error.message}`);
  }

  return result.data;
};