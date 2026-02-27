

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
  ROLE_UPDATED: 'role.updated', 
} as const;


export interface RoleUpdatedEventPayload {
  userId: string;
  email: string;
  previousRole: string;
  newRole: string;
  updatedBy: string;
  reason?: string;
  updatedAt: Date;
  metadata?: Record<string, unknown>;
}

export class RoleUpdatedEvent {
  private readonly eventProducer: EventProducer;

  constructor(eventProducer: EventProducer) {
    this.eventProducer = eventProducer;
  }

  async publish(payload: RoleUpdatedEventPayload): Promise<void> {
    await this.eventProducer.publish({
      topic: EVENT_TOPICS.ROLE_UPDATED,
      key: payload.userId,
      value: {
        eventType: 'ROLE_UPDATED',
        eventId: this.generateEventId(),
        timestamp: new Date().toISOString(),
        version: '1.0',
        data: {
          userId: payload.userId,
          email: payload.email,
          previousRole: payload.previousRole,
          newRole: payload.newRole,
          updatedBy: payload.updatedBy,
          reason: payload.reason,
          updatedAt: payload.updatedAt.toISOString(),
          metadata: payload.metadata || {},
        },
      },
      headers: {
        'event-source': 'auth-service',
        'event-type':   'ROLE_UPDATED',
        'content-type': 'application/json',
      },
    });
  }

  private generateEventId(): string {
    return `evt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}