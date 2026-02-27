import { EventEmitter } from 'events';
import { Logger } from '../../shared/utils/logger';
import { EVENT_TOPICS } from './event-topics';
import { EventMetadata } from './event-metadata';

interface EventPayload {
  topic: string;
  key?: string;
  value: any;
  metadata: EventMetadata;
}

interface ProducerConfig {
  maxRetries?: number;
  retryDelay?: number;
  timeout?: number;
}

export class EventProducer {
  private emitter: EventEmitter;
  private logger: Logger;
  private config: Required<ProducerConfig>;
  private pendingEvents: Map<string, EventPayload>;

  constructor(config: ProducerConfig = {}) {
    this.emitter = new EventEmitter();
    this.logger = new Logger('EventProducer');
    this.config = {
      maxRetries: config.maxRetries ?? 3,
      retryDelay: config.retryDelay ?? 1000,
      timeout: config.timeout ?? 5000,
    };
    this.pendingEvents = new Map();
    this.setupListeners();
  }

  private setupListeners(): void {
    this.emitter.on('error', (error: Error) => {
      this.logger.error('Event emitter error', { error: error.message });
    });
  }

  async publish<T = any>(
    topic: string,
    value: T,
    key?: string,
    metadata?: Partial<EventMetadata>
  ): Promise<void> {
    const eventId = this.generateEventId();
    const eventMetadata = this.createMetadata(eventId, metadata);

    const payload: EventPayload = {
      topic,
      key,
      value,
      metadata: eventMetadata,
    };

    this.pendingEvents.set(eventId, payload);

    try {
      await this.sendEvent(payload);
      this.logger.info('Event published successfully', {
        eventId,
        topic,
        key,
      });
    } catch (error) {
      this.logger.error('Failed to publish event', {
        eventId,
        topic,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    } finally {
      this.pendingEvents.delete(eventId);
    }
  }

  async publishBatch<T = any>(
    events: Array<{
      topic: string;
      value: T;
      key?: string;
      metadata?: Partial<EventMetadata>;
    }>
  ): Promise<void> {
    const publishPromises = events.map((event) =>
      this.publish(event.topic, event.value, event.key, event.metadata)
    );

    await Promise.all(publishPromises);
  }

  async publishProductCreated(productId: string, productData: any): Promise<void> {
    await this.publish(
      EVENT_TOPICS.PRODUCT.CREATED,
      productData,
      productId,
      { correlationId: productId }
    );
  }

  async publishProductUpdated(productId: string, productData: any): Promise<void> {
    await this.publish(
      EVENT_TOPICS.PRODUCT.UPDATED,
      productData,
      productId,
      { correlationId: productId }
    );
  }

  async publishInventoryUpdated(inventoryData: any): Promise<void> {
    await this.publish(
      EVENT_TOPICS.PRODUCT.INVENTORY_UPDATED,
      inventoryData
    );
  }

  async publishPriceChanged(priceData: any): Promise<void> {
    await this.publish(
      EVENT_TOPICS.PRODUCT.PRICE_CHANGED,
      priceData
    );
  }

  async publishOrderCreated(orderId: string, orderData: any): Promise<void> {
    await this.publish(
      EVENT_TOPICS.ORDER.CREATED,
      orderData,
      orderId,
      { correlationId: orderId }
    );
  }

  async publishOrderCancelled(orderId: string, orderData: any): Promise<void> {
    await this.publish(
      EVENT_TOPICS.ORDER.CANCELLED,
      orderData,
      orderId,
      { correlationId: orderId }
    );
  }

  async publishPaymentSucceeded(paymentId: string, paymentData: any): Promise<void> {
    await this.publish(
      EVENT_TOPICS.PAYMENT.SUCCEEDED,
      paymentData,
      paymentId,
      { correlationId: paymentId }
    );
  }

  async publishRefundIssued(refundId: string, refundData: any): Promise<void> {
    await this.publish(
      EVENT_TOPICS.PAYMENT.REFUND_ISSUED,
      refundData,
      refundId,
      { correlationId: refundId }
    );
  }

  async publishBookingCreated(bookingId: string, bookingData: any): Promise<void> {
    await this.publish(
      EVENT_TOPICS.APPOINTMENT.BOOKING_CREATED,
      bookingData,
      bookingId,
      { correlationId: bookingId }
    );
  }

  async publishBookingCancelled(bookingId: string, bookingData: any): Promise<void> {
    await this.publish(
      EVENT_TOPICS.APPOINTMENT.BOOKING_CANCELLED,
      bookingData,
      bookingId,
      { correlationId: bookingId }
    );
  }

  async publishReminderSent(reminderId: string, reminderData: any): Promise<void> {
    await this.publish(
      EVENT_TOPICS.APPOINTMENT.REMINDER_SENT,
      reminderData,
      reminderId
    );
  }

  async publishBlogPublished(blogId: string, blogData: any): Promise<void> {
    await this.publish(
      EVENT_TOPICS.CONTENT.BLOG_PUBLISHED,
      blogData,
      blogId,
      { correlationId: blogId }
    );
  }

  async publishMediaUploaded(mediaId: string, mediaData: any): Promise<void> {
    await this.publish(
      EVENT_TOPICS.CONTENT.MEDIA_UPLOADED,
      mediaData,
      mediaId
    );
  }

  async publishProfileUpdated(customerId: string, profileData: any): Promise<void> {
    await this.publish(
      EVENT_TOPICS.CUSTOMER.PROFILE_UPDATED,
      profileData,
      customerId,
      { correlationId: customerId }
    );
  }

  async publishReviewCreated(reviewId: string, reviewData: any): Promise<void> {
    await this.publish(
      EVENT_TOPICS.CUSTOMER.REVIEW_CREATED,
      reviewData,
      reviewId
    );
  }

  async publishEmailSent(emailId: string, emailData: any): Promise<void> {
    await this.publish(
      EVENT_TOPICS.NOTIFICATION.EMAIL_SENT,
      emailData,
      emailId
    );
  }

  async publishSmsSent(smsId: string, smsData: any): Promise<void> {
    await this.publish(
      EVENT_TOPICS.NOTIFICATION.SMS_SENT,
      smsData,
      smsId
    );
  }

  async publishEventTracked(eventData: any): Promise<void> {
    await this.publish(
      EVENT_TOPICS.ANALYTICS.EVENT_TRACKED,
      eventData
    );
  }

  private async sendEvent(payload: EventPayload): Promise<void> {
    return new Promise((resolve, reject) => {
      const timeoutId = setTimeout(() => {
        reject(new Error('Event publish timeout'));
      }, this.config.timeout);

      try {
        this.emitter.emit(payload.topic, payload);
        clearTimeout(timeoutId);
        resolve();
      } catch (error) {
        clearTimeout(timeoutId);
        reject(error);
      }
    });
  }

  private createMetadata(
    eventId: string,
    metadata?: Partial<EventMetadata>
  ): EventMetadata {
    return {
      eventId,
      timestamp: new Date().toISOString(),
      version: '1.0',
      source: 'lomash-wood-backend',
      correlationId: metadata?.correlationId,
      userId: metadata?.userId,
      traceId: metadata?.traceId,
    };
  }

  private generateEventId(): string {
    return `evt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  subscribe(topic: string, handler: (payload: EventPayload) => void | Promise<void>): void {
    this.emitter.on(topic, async (payload: EventPayload) => {
      try {
        await handler(payload);
      } catch (error) {
        this.logger.error('Event handler error', {
          topic,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    });
  }

  unsubscribe(topic: string, handler: (payload: EventPayload) => void): void {
    this.emitter.off(topic, handler);
  }

  async disconnect(): Promise<void> {
    this.emitter.removeAllListeners();
    this.pendingEvents.clear();
    this.logger.info('Event producer disconnected');
  }

  getEventEmitter(): EventEmitter {
    return this.emitter;
  }

  getPendingEvents(): Map<string, EventPayload> {
    return this.pendingEvents;
  }
}

export const createEventProducer = (config?: ProducerConfig): EventProducer => {
  return new EventProducer(config);
};