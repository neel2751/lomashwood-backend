import Redis from "ioredis";
import { AnyEventPayload } from "./payload";
import { EventTopic } from "./topics";
import { deserializeEvent } from "./serializer";
import { EventMiddlewareFn, composeMiddleware } from "./middleware";

export type EventHandler<T extends AnyEventPayload = AnyEventPayload> = (
  event: T
) => Promise<void>;

export interface SubscriberConfig {
  redis: Redis;
  groupName?: string;
  middlewares?: EventMiddlewareFn[];
  onError?: (error: Error, event: AnyEventPayload | null, topic: string) => void;
}

export interface Subscription {
  topic: EventTopic;
  handler: EventHandler;
  unsubscribe: () => Promise<void>;
}

export class EventSubscriber {
  private readonly redis: Redis;
  private readonly subClient: Redis;
  private readonly middlewares: EventMiddlewareFn[];
  private readonly onError: (error: Error, event: AnyEventPayload | null, topic: string) => void;
  private readonly handlers: Map<string, Set<EventHandler>> = new Map();
  private isListening = false;

  constructor(config: SubscriberConfig) {
    this.redis = config.redis;
    this.subClient = config.redis.duplicate();
    this.middlewares = config.middlewares ?? [];
    this.onError = config.onError ?? ((error, _event, topic) => {
      console.error(`[EventSubscriber] Error on topic "${topic}":`, error.message);
    });

    this.subClient.on("message", this.handleMessage.bind(this));
  }

  async subscribe<T extends AnyEventPayload>(
    topic: EventTopic,
    handler: EventHandler<T>
  ): Promise<Subscription> {
    if (!this.handlers.has(topic)) {
      this.handlers.set(topic, new Set());
      await this.subClient.subscribe(topic);
    }

    const handlers = this.handlers.get(topic)!;
    handlers.add(handler as EventHandler);

    this.isListening = true;

    return {
      topic,
      handler: handler as EventHandler,
      unsubscribe: async () => {
        handlers.delete(handler as EventHandler);
        if (handlers.size === 0) {
          this.handlers.delete(topic);
          await this.subClient.unsubscribe(topic);
        }
      },
    };
  }

  async subscribeMany<T extends AnyEventPayload>(
    topics: EventTopic[],
    handler: EventHandler<T>
  ): Promise<Subscription[]> {
    return Promise.all(topics.map((topic) => this.subscribe(topic, handler)));
  }

  async unsubscribeAll(): Promise<void> {
    const topics = Array.from(this.handlers.keys());
    if (topics.length > 0) {
      await this.subClient.unsubscribe(...topics);
    }
    this.handlers.clear();
    this.isListening = false;
  }

  private async handleMessage(topic: string, message: string): Promise<void> {
    let event: AnyEventPayload | null = null;

    try {
      event = deserializeEvent(message);
    } catch (error) {
      this.onError(
        error instanceof Error ? error : new Error("Failed to deserialize event"),
        null,
        topic
      );
      return;
    }

    const handlers = this.handlers.get(topic as EventTopic);
    if (!handlers || handlers.size === 0) return;

    for (const handler of handlers) {
      try {
        if (this.middlewares.length > 0) {
          const composed = composeMiddleware(this.middlewares);
          await composed(event, async () => {
            await handler(event!);
          });
        } else {
          await handler(event);
        }
      } catch (error) {
        this.onError(
          error instanceof Error ? error : new Error(String(error)),
          event,
          topic
        );
      }
    }
  }

  get subscribedTopics(): string[] {
    return Array.from(this.handlers.keys());
  }

  get isActive(): boolean {
    return this.isListening && this.handlers.size > 0;
  }

  async disconnect(): Promise<void> {
    await this.unsubscribeAll();
    this.subClient.disconnect();
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