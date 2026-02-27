import { EventEmitter } from 'events';

export interface EventPayload {
  eventId: string;
  eventType: string;
  timestamp: string;
  data: any;
  metadata?: {
    userId?: string;
    sessionId?: string;
    correlationId?: string;
    source?: string;
    version?: string;
  };
}

export interface EventHandler {
  handle(payload: EventPayload): Promise<void>;
}

export class EventHandlerRegistry {
  private static instance: EventHandlerRegistry;
  private emitter: EventEmitter;
  private handlers: Map<string, EventHandler[]>;
  private errorHandlers: Map<string, ((error: Error, payload: EventPayload) => void)[]>;

  private constructor() {
    this.emitter = new EventEmitter();
    this.emitter.setMaxListeners(100);
    this.handlers = new Map();
    this.errorHandlers = new Map();
  }

  static getInstance(): EventHandlerRegistry {
    if (!this.instance) {
      this.instance = new EventHandlerRegistry();
    }
    return this.instance;
  }

  register(eventType: string, handler: EventHandler): void {
    const handlers = this.handlers.get(eventType) || [];
    handlers.push(handler);
    this.handlers.set(eventType, handlers);

    this.emitter.on(eventType, async (payload: EventPayload) => {
      try {
        await handler.handle(payload);
      } catch (error) {
        await this.handleError(eventType, error as Error, payload);
      }
    });
  }

  unregister(eventType: string, handler: EventHandler): void {
    const handlers = this.handlers.get(eventType) || [];
    const index = handlers.indexOf(handler);
    if (index > -1) {
      handlers.splice(index, 1);
      this.handlers.set(eventType, handlers);
    }
  }

  registerErrorHandler(
    eventType: string,
    errorHandler: (error: Error, payload: EventPayload) => void
  ): void {
    const handlers = this.errorHandlers.get(eventType) || [];
    handlers.push(errorHandler);
    this.errorHandlers.set(eventType, handlers);
  }

  async emit(eventType: string, data: any, metadata?: EventPayload['metadata']): Promise<void> {
    const payload: EventPayload = {
      eventId: this.generateEventId(),
      eventType,
      timestamp: new Date().toISOString(),
      data,
      metadata,
    };

    this.emitter.emit(eventType, payload);
  }

  async emitAndWait(eventType: string, data: any, metadata?: EventPayload['metadata']): Promise<void> {
    const payload: EventPayload = {
      eventId: this.generateEventId(),
      eventType,
      timestamp: new Date().toISOString(),
      data,
      metadata,
    };

    const handlers = this.handlers.get(eventType) || [];
    await Promise.all(handlers.map((handler) => handler.handle(payload)));
  }

  private async handleError(eventType: string, error: Error, payload: EventPayload): Promise<void> {
    console.error(`Error handling event ${eventType}:`, error);

    const errorHandlers = this.errorHandlers.get(eventType) || [];
    for (const handler of errorHandlers) {
      try {
        handler(error, payload);
      } catch (err) {
        console.error('Error in error handler:', err);
      }
    }
  }

  private generateEventId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  removeAllHandlers(eventType: string): void {
    this.handlers.delete(eventType);
    this.errorHandlers.delete(eventType);
    this.emitter.removeAllListeners(eventType);
  }

  getHandlerCount(eventType: string): number {
    return (this.handlers.get(eventType) || []).length;
  }
}

export class UserCreatedHandler implements EventHandler {
  async handle(payload: EventPayload): Promise<void> {
    console.log('User created:', payload.data);
  }
}

export class UserLoggedInHandler implements EventHandler {
  async handle(payload: EventPayload): Promise<void> {
    console.log('User logged in:', payload.data);
  }
}

export class OrderCreatedHandler implements EventHandler {
  async handle(payload: EventPayload): Promise<void> {
    console.log('Order created:', payload.data);
  }
}

export class OrderCancelledHandler implements EventHandler {
  async handle(payload: EventPayload): Promise<void> {
    console.log('Order cancelled:', payload.data);
  }
}

export class PaymentSucceededHandler implements EventHandler {
  async handle(payload: EventPayload): Promise<void> {
    console.log('Payment succeeded:', payload.data);
  }
}

export class PaymentFailedHandler implements EventHandler {
  async handle(payload: EventPayload): Promise<void> {
    console.log('Payment failed:', payload.data);
  }
}

export class AppointmentCreatedHandler implements EventHandler {
  async handle(payload: EventPayload): Promise<void> {
    console.log('Appointment created:', payload.data);
  }
}

export class AppointmentCancelledHandler implements EventHandler {
  async handle(payload: EventPayload): Promise<void> {
    console.log('Appointment cancelled:', payload.data);
  }
}

export class ProductCreatedHandler implements EventHandler {
  async handle(payload: EventPayload): Promise<void> {
    console.log('Product created:', payload.data);
  }
}

export class ProductUpdatedHandler implements EventHandler {
  async handle(payload: EventPayload): Promise<void> {
    console.log('Product updated:', payload.data);
  }
}

export class InventoryUpdatedHandler implements EventHandler {
  async handle(payload: EventPayload): Promise<void> {
    console.log('Inventory updated:', payload.data);
  }
}

export class EmailSentHandler implements EventHandler {
  async handle(payload: EventPayload): Promise<void> {
    console.log('Email sent:', payload.data);
  }
}

export class SMSSentHandler implements EventHandler {
  async handle(payload: EventPayload): Promise<void> {
    console.log('SMS sent:', payload.data);
  }
}

export class NotificationSentHandler implements EventHandler {
  async handle(payload: EventPayload): Promise<void> {
    console.log('Notification sent:', payload.data);
  }
}

export class ReviewCreatedHandler implements EventHandler {
  async handle(payload: EventPayload): Promise<void> {
    console.log('Review created:', payload.data);
  }
}

export class BlogPublishedHandler implements EventHandler {
  async handle(payload: EventPayload): Promise<void> {
    console.log('Blog published:', payload.data);
  }
}

export class MediaUploadedHandler implements EventHandler {
  async handle(payload: EventPayload): Promise<void> {
    console.log('Media uploaded:', payload.data);
  }
}

export class EventTrackedHandler implements EventHandler {
  async handle(payload: EventPayload): Promise<void> {
    console.log('Event tracked:', payload.data);
  }
}

export class BaseEventHandler implements EventHandler {
  constructor(private handlerFn: (payload: EventPayload) => Promise<void>) {}

  async handle(payload: EventPayload): Promise<void> {
    await this.handlerFn(payload);
  }
}

export class BatchEventHandler implements EventHandler {
  private batch: EventPayload[] = [];
  private batchSize: number;
  private flushInterval: number;
  private timer: NodeJS.Timeout | null = null;
  private processFn: (batch: EventPayload[]) => Promise<void>;

  constructor(
    processFn: (batch: EventPayload[]) => Promise<void>,
    options: { batchSize?: number; flushInterval?: number } = {}
  ) {
    this.processFn = processFn;
    this.batchSize = options.batchSize || 100;
    this.flushInterval = options.flushInterval || 5000;
    this.startTimer();
  }

  async handle(payload: EventPayload): Promise<void> {
    this.batch.push(payload);

    if (this.batch.length >= this.batchSize) {
      await this.flush();
    }
  }

  private async flush(): Promise<void> {
    if (this.batch.length === 0) return;

    const currentBatch = [...this.batch];
    this.batch = [];

    try {
      await this.processFn(currentBatch);
    } catch (error) {
      console.error('Error processing batch:', error);
    }
  }

  private startTimer(): void {
    this.timer = setInterval(() => {
      this.flush().catch((err) => console.error('Flush error:', err));
    }, this.flushInterval);
  }

  stop(): void {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
    this.flush().catch((err) => console.error('Final flush error:', err));
  }
}

export class RetryEventHandler implements EventHandler {
  constructor(
    private handler: EventHandler,
    private maxRetries: number = 3,
    private retryDelay: number = 1000
  ) {}

  async handle(payload: EventPayload): Promise<void> {
    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
      try {
        await this.handler.handle(payload);
        return;
      } catch (error) {
        lastError = error as Error;
        console.error(`Attempt ${attempt} failed:`, error);

        if (attempt < this.maxRetries) {
          await new Promise((resolve) => setTimeout(resolve, this.retryDelay * attempt));
        }
      }
    }

    throw new Error(
      `Handler failed after ${this.maxRetries} attempts. Last error: ${lastError?.message}`
    );
  }
}

export class FilteredEventHandler implements EventHandler {
  constructor(
    private handler: EventHandler,
    private filter: (payload: EventPayload) => boolean
  ) {}

  async handle(payload: EventPayload): Promise<void> {
    if (this.filter(payload)) {
      await this.handler.handle(payload);
    }
  }
}

export class LoggingEventHandler implements EventHandler {
  constructor(private handler: EventHandler) {}

  async handle(payload: EventPayload): Promise<void> {
    console.log(`Handling event ${payload.eventType} (${payload.eventId})`);
    const start = Date.now();

    try {
      await this.handler.handle(payload);
      console.log(`Event ${payload.eventType} handled in ${Date.now() - start}ms`);
    } catch (error) {
      console.error(`Event ${payload.eventType} failed after ${Date.now() - start}ms:`, error);
      throw error;
    }
  }
}

export const eventRegistry = EventHandlerRegistry.getInstance();
export default eventRegistry;