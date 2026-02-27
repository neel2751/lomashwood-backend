

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
  USER_CREATED: 'user.created', 
} as const;


export interface UserCreatedEventPayload {
  userId: string;
  email: string;
  name: string;
  role: string;
  createdAt: Date;
  metadata?: Record<string, unknown>;
}

export class UserCreatedEvent {
  private readonly eventProducer: EventProducer;

  constructor(eventProducer: EventProducer) {
    this.eventProducer = eventProducer;
  }

  async publish(payload: UserCreatedEventPayload): Promise<void> {
    await this.eventProducer.publish({
      topic: EVENT_TOPICS.USER_CREATED,
      key: payload.userId,
      value: {
        eventType: 'USER_CREATED',
        eventId: this.generateEventId(),
        timestamp: new Date().toISOString(),
        version: '1.0',
        data: {
          userId: payload.userId,
          email: payload.email,
          name: payload.name,
          role: payload.role,
          createdAt: payload.createdAt.toISOString(),
          metadata: payload.metadata || {},
        },
      },
      headers: {
        'event-source': 'auth-service',
        'event-type':   'USER_CREATED',
        'content-type': 'application/json',
      },
    });
  }

  private generateEventId(): string {
    return `evt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}