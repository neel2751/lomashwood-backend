
interface EventMessage {
  topic: string;
  key: string;
  value: Record<string, unknown>;
  headers?: Record<string, string>;
}

export interface EventProducer {
  publish: (message: EventMessage) => Promise<void>;
}

const EVENT_TOPICS = {
  PASSWORD_RESET: 'password.reset',
} as const;


export interface PasswordResetEventPayload {
  userId: string;
  email: string;
  resetToken?: string;
  ipAddress?: string;
  userAgent?: string;
  resetType: 'requested' | 'completed' | 'failed';
  resetAt: Date;
  metadata?: Record<string, unknown>;
}

export class PasswordResetEvent {
  private readonly eventProducer: EventProducer;

  constructor(eventProducer: EventProducer) {
    this.eventProducer = eventProducer;
  }

  async publish(payload: PasswordResetEventPayload): Promise<void> {
    await this.eventProducer.publish({
      topic: EVENT_TOPICS.PASSWORD_RESET,
      key: payload.userId,
      value: {
        eventType: 'PASSWORD_RESET',
        eventId: this.generateEventId(),
        timestamp: new Date().toISOString(),
        version: '1.0',
        data: {
          userId: payload.userId,
          email: payload.email,
          resetToken: payload.resetToken,
          ipAddress: payload.ipAddress,
          userAgent: payload.userAgent,
          resetType: payload.resetType,
          resetAt: payload.resetAt.toISOString(),
          metadata: payload.metadata || {},
        },
      },
      headers: {
        'event-source': 'auth-service',
        'event-type':   'PASSWORD_RESET',
        'content-type': 'application/json',
      },
    });
  }

  private generateEventId(): string {
    return `evt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}