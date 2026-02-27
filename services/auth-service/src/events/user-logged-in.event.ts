

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
  USER_LOGGED_IN: 'user.logged_in', 
} as const;


export interface UserLoggedInEventPayload {
  userId: string;
  email: string;
  sessionId: string;
  ipAddress?: string;
  userAgent?: string;
  loginMethod: 'email' | 'oauth' | 'sso';
  loggedInAt: Date;
  metadata?: Record<string, unknown>;
}

export class UserLoggedInEvent {
  private readonly eventProducer: EventProducer;

  constructor(eventProducer: EventProducer) {
    this.eventProducer = eventProducer;
  }

  async publish(payload: UserLoggedInEventPayload): Promise<void> {
    await this.eventProducer.publish({
      topic: EVENT_TOPICS.USER_LOGGED_IN,
      key: payload.userId,
      value: {
        eventType: 'USER_LOGGED_IN',
        eventId: this.generateEventId(),
        timestamp: new Date().toISOString(),
        version: '1.0',
        data: {
          userId: payload.userId,
          email: payload.email,
          sessionId: payload.sessionId,
          ipAddress: payload.ipAddress,
          userAgent: payload.userAgent,
          loginMethod: payload.loginMethod,
          loggedInAt: payload.loggedInAt.toISOString(),
          metadata: payload.metadata || {},
        },
      },
      headers: {
        'event-source': 'auth-service',
        'event-type':   'USER_LOGGED_IN',
        'content-type': 'application/json',
      },
    });
  }

  private generateEventId(): string {
    return `evt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}