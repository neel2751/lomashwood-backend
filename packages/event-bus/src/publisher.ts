import Redis from "ioredis";
import { AnyEventPayload } from "./payload";
import { EventTopic } from "./topics";
import { serializeEvent, createEventPayload } from "./serializer";
import { EventMiddlewareFn, composeMiddleware } from "./middleware";

export interface PublisherConfig {
  redis: Redis;
  defaultSource: string;
  middlewares?: EventMiddlewareFn[];
  maxRetries?: number;
  retryDelayMs?: number;
}

export interface PublishOptions {
  correlationId?: string;
  causationId?: string;
  version?: string;
  metadata?: Record<string, unknown>;
  delayMs?: number;
}

export class EventPublisher {
  private readonly redis: Redis;
  private readonly defaultSource: string;
  private readonly middlewares: EventMiddlewareFn[];
  private readonly maxRetries: number;
  private readonly retryDelayMs: number;

  constructor(config: PublisherConfig) {
    this.redis = config.redis;
    this.defaultSource = config.defaultSource;
    this.middlewares = config.middlewares ?? [];
    this.maxRetries = config.maxRetries ?? 3;
    this.retryDelayMs = config.retryDelayMs ?? 500;
  }

  private buildOptions(options: PublishOptions): {
    version?: string;
    correlationId?: string;
    causationId?: string;
    metadata?: Record<string, unknown>;
  } {
    const result: {
      version?: string;
      correlationId?: string;
      causationId?: string;
      metadata?: Record<string, unknown>;
    } = {};
    if (options.version !== undefined) result.version = options.version;
    if (options.correlationId !== undefined) result.correlationId = options.correlationId;
    if (options.causationId !== undefined) result.causationId = options.causationId;
    if (options.metadata !== undefined) result.metadata = options.metadata;
    return result;
  }

  async publish<T extends Record<string, unknown>>(
    topic: EventTopic,
    data: T,
    options: PublishOptions = {}
  ): Promise<string> {
    const payload = createEventPayload(
      topic,
      this.defaultSource,
      data as Record<string, unknown>,
      this.buildOptions(options)  // ← fixed
    ) as AnyEventPayload;

    if (this.middlewares.length > 0) {
      const composed = composeMiddleware(this.middlewares);
      await composed(payload, async () => {
        await this.publishWithRetry(topic, payload, options.delayMs);
      });
    } else {
      await this.publishWithRetry(topic, payload, options.delayMs);
    }

    return payload.eventId;
  }

  async publishBatch<T extends Record<string, unknown>>(
    events: Array<{ topic: EventTopic; data: T; options?: PublishOptions }>
  ): Promise<string[]> {
    const pipeline = this.redis.pipeline();
    const eventIds: string[] = [];

    for (const { topic, data, options = {} } of events) {
      const payload = createEventPayload(
        topic,
        this.defaultSource,
        data as Record<string, unknown>,
        this.buildOptions(options)  // ← fixed
      ) as AnyEventPayload;

      const serialized = serializeEvent(payload);
      pipeline.publish(topic, serialized);
      eventIds.push(payload.eventId);
    }

    await pipeline.exec();
    return eventIds;
  }

  private async publishWithRetry(
    topic: EventTopic,
    payload: AnyEventPayload,
    delayMs?: number
  ): Promise<void> {
    if (delayMs && delayMs > 0) {
      await new Promise((resolve) => setTimeout(resolve, delayMs));
    }

    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
      try {
        const serialized = serializeEvent(payload);
        await this.redis.publish(topic, serialized);
        return;
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        if (attempt < this.maxRetries) {
          await new Promise((resolve) =>
            setTimeout(resolve, this.retryDelayMs * attempt)
          );
        }
      }
    }

    throw lastError ?? new Error(`Failed to publish event to topic: ${topic}`);
  }

  async healthCheck(): Promise<boolean> {
    try {
      const result = await this.redis.ping();
      return result === "PONG";
    } catch {
      return false;
    }
  }
}