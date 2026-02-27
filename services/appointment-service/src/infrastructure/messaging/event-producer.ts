import { logger } from '../../config/logger';
import { env } from '../../config/env';

export interface EventPayload {
  eventId: string;
  eventType: string;
  service: string;
  timestamp: string;
  data: Record<string, unknown>;
}

export interface PublishResult {
  success: boolean;
  eventId: string;
  eventType: string;
  error?: string;
}

export class EventProducer {
  private readonly service = 'appointment-service';

  async publish(
    eventType: string,
    data: Record<string, unknown>,
  ): Promise<PublishResult> {
    const eventId = this.generateEventId();
    const payload: EventPayload = {
      eventId,
      eventType,
      service: this.service,
      timestamp: new Date().toISOString(),
      data,
    };

    try {
      if (env.NODE_ENV === 'development' || env.NODE_ENV === 'test') {
        logger.debug({
          message: 'Event published (dev mode)',
          eventId,
          eventType,
          data,
        });

        return { success: true, eventId, eventType };
      }

      await this.send(payload);

      logger.info({
        message: 'Event published',
        eventId,
        eventType,
        service: this.service,
      });

      return { success: true, eventId, eventType };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);

      logger.error({
        message: 'Failed to publish event',
        eventId,
        eventType,
        error: message,
      });

      return {
        success: false,
        eventId,
        eventType,
        error: message,
      };
    }
  }

  async publishBatch(
    events: Array<{ eventType: string; data: Record<string, unknown> }>,
  ): Promise<PublishResult[]> {
    const results = await Promise.allSettled(
      events.map(({ eventType, data }) => this.publish(eventType, data)),
    );

    return results.map((result) => {
      if (result.status === 'fulfilled') {
        return result.value;
      }
      return {
        success: false,
        eventId: this.generateEventId(),
        eventType: 'unknown',
        error: result.reason instanceof Error
          ? result.reason.message
          : String(result.reason),
      };
    });
  }

  async publishWithRetry(
    eventType: string,
    data: Record<string, unknown>,
    maxRetries: number = 3,
  ): Promise<PublishResult> {
    let lastResult: PublishResult | null = null;
    let attempt = 0;

    while (attempt < maxRetries) {
      lastResult = await this.publish(eventType, data);

      if (lastResult.success) {
        return lastResult;
      }

      attempt++;

      if (attempt < maxRetries) {
        const delay = Math.pow(2, attempt) * 100;
        logger.warn({
          message: 'Retrying event publish',
          eventType,
          attempt,
          maxRetries,
          delay: `${delay}ms`,
        });
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }

    logger.error({
      message: 'Event publish failed after max retries',
      eventType,
      maxRetries,
    });

    return lastResult!;
  }

  async publishDeadLetter(
    originalEvent: EventPayload,
    error: string,
  ): Promise<void> {
    const deadLetterPayload: EventPayload = {
      eventId: this.generateEventId(),
      eventType: `${originalEvent.eventType}.dead_letter`,
      service: this.service,
      timestamp: new Date().toISOString(),
      data: {
        originalEvent,
        error,
        deadLetteredAt: new Date().toISOString(),
      },
    };

    logger.error({
      message: 'Publishing dead letter event',
      originalEventId: originalEvent.eventId,
      originalEventType: originalEvent.eventType,
      error,
    });

    await this.send(deadLetterPayload).catch((sendError) => {
      logger.error({
        message: 'Failed to publish dead letter event',
        error: sendError instanceof Error ? sendError.message : String(sendError),
      });
    });
  }

  private async send(payload: EventPayload): Promise<void> {
    logger.debug({
      message: 'Sending event payload',
      eventId: payload.eventId,
      eventType: payload.eventType,
    });
  }

  private generateEventId(): string {
    return `${this.service}-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
  }
}