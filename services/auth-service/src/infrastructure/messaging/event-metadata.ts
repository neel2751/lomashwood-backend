import crypto from 'crypto';

export interface EventMetadata {
  eventId: string;
  eventType: string;
  timestamp: Date;
  version: string;
  source: string;
  correlationId?: string;
  causationId?: string;
  userId?: string;
  sessionId?: string;
  traceId?: string;
  spanId?: string;
  environment?: string;
  region?: string;
}

export interface EventContext {
  userId?: string;
  sessionId?: string;
  correlationId?: string;
  causationId?: string;
  traceId?: string;
  ipAddress?: string;
  userAgent?: string;
  requestId?: string;
}

export class EventMetadataBuilder {
  private metadata: Partial<EventMetadata>;
  private readonly serviceName: string;
  private readonly serviceVersion: string;

  constructor(serviceName: string = 'auth-service', serviceVersion: string = '1.0.0') {
    this.serviceName = serviceName;
    this.serviceVersion = serviceVersion;
    this.metadata = {};
  }

  withEventType(eventType: string): this {
    this.metadata.eventType = eventType;
    return this;
  }

  withUserId(userId: string): this {
    this.metadata.userId = userId;
    return this;
  }

  withSessionId(sessionId: string): this {
    this.metadata.sessionId = sessionId;
    return this;
  }

  withCorrelationId(correlationId: string): this {
    this.metadata.correlationId = correlationId;
    return this;
  }

  withCausationId(causationId: string): this {
    this.metadata.causationId = causationId;
    return this;
  }

  withTraceId(traceId: string): this {
    this.metadata.traceId = traceId;
    return this;
  }

  withSpanId(spanId: string): this {
    this.metadata.spanId = spanId;
    return this;
  }

  withContext(context: EventContext): this {
    if (context.userId) this.withUserId(context.userId);
    if (context.sessionId) this.withSessionId(context.sessionId);
    if (context.correlationId) this.withCorrelationId(context.correlationId);
    if (context.causationId) this.withCausationId(context.causationId);
    if (context.traceId) this.withTraceId(context.traceId);
    return this;
  }

  build(): EventMetadata {
    if (!this.metadata.eventType) {
      throw new Error('Event type is required');
    }

    return {
      eventId: this.generateEventId(),
      eventType: this.metadata.eventType,
      timestamp: new Date(),
      version: this.serviceVersion,
      source: this.serviceName,
      correlationId: this.metadata.correlationId || this.generateCorrelationId(),
      causationId: this.metadata.causationId,
      userId: this.metadata.userId,
      sessionId: this.metadata.sessionId,
      traceId: this.metadata.traceId,
      spanId: this.metadata.spanId,
      environment: process.env['NODE_ENV'] || 'development',
      region: process.env['AWS_REGION'] || 'local',
    };
  }

  private generateEventId(): string {
    return `evt_${Date.now()}_${crypto.randomBytes(8).toString('hex')}`;
  }

  private generateCorrelationId(): string {
    return `cor_${Date.now()}_${crypto.randomBytes(8).toString('hex')}`;
  }
}

export function createEventMetadata(
  eventType: string,
  context?: EventContext
): EventMetadata {
  const builder = new EventMetadataBuilder();
  builder.withEventType(eventType);

  if (context) {
    builder.withContext(context);
  }

  return builder.build();
}

export function generateEventId(): string {
  return `evt_${Date.now()}_${crypto.randomBytes(8).toString('hex')}`;
}

export function generateCorrelationId(): string {
  return `cor_${Date.now()}_${crypto.randomBytes(8).toString('hex')}`;
}

export function generateTraceId(): string {
  return `trc_${Date.now()}_${crypto.randomBytes(16).toString('hex')}`;
}

export function generateSpanId(): string {
  return `spn_${crypto.randomBytes(8).toString('hex')}`;
}

export function extractEventMetadata(event: unknown): EventMetadata | null {
  if (!event || typeof event !== 'object') {
    return null;
  }

  if (!('metadata' in event)) {
    return null;
  }

  return (event as { metadata: EventMetadata }).metadata;
}

export function validateEventMetadata(metadata: unknown): boolean {
  if (!metadata || typeof metadata !== 'object') {
    return false;
  }

  const requiredFields = ['eventId', 'eventType', 'timestamp', 'version', 'source'];

  for (const field of requiredFields) {
    if (!(field in metadata) || !((metadata as Record<string, unknown>)[field])) {
      return false;
    }
  }

  return true;
}

export function enrichEventMetadata(
  metadata: EventMetadata,
  enrichment: Partial<EventMetadata>
): EventMetadata {
  return {
    ...metadata,
    ...enrichment,
  };
}

export function cloneEventMetadata(metadata: EventMetadata): EventMetadata {
  return {
    ...metadata,
    timestamp: new Date(metadata.timestamp),
  };
}

export function serializeEventMetadata(metadata: EventMetadata): string {
  return JSON.stringify(metadata);
}

export function deserializeEventMetadata(serialized: string): EventMetadata {
  const parsed = JSON.parse(serialized) as unknown as EventMetadata;
  return {
    ...parsed,
    timestamp: new Date(parsed.timestamp),
  };
}

export function getEventAge(metadata: EventMetadata): number {
  const now = new Date();
  const eventTime = new Date(metadata.timestamp);
  return now.getTime() - eventTime.getTime();
}

export function isEventExpired(
  metadata: EventMetadata,
  maxAgeMs: number
): boolean {
  return getEventAge(metadata) > maxAgeMs;
}

export function formatEventForLogging(metadata: EventMetadata): {
  eventId: string;
  eventType: string;
  timestamp: string;
  source: string;
  correlationId?: string;
  userId?: string;
} {
  return {
    eventId: metadata.eventId,
    eventType: metadata.eventType,
    timestamp: metadata.timestamp.toISOString(),
    source: metadata.source,
    correlationId: metadata.correlationId,
    userId: metadata.userId,
  };
}

export function createCausationChain(
  parentMetadata: EventMetadata,
  newEventType: string
): EventMetadata {
  return createEventMetadata(newEventType, {
    correlationId: parentMetadata.correlationId,
    causationId: parentMetadata.eventId,
    userId: parentMetadata.userId,
    sessionId: parentMetadata.sessionId,
    traceId: parentMetadata.traceId,
  });
}

export const EVENT_VERSION = '1.0.0';
export const MAX_EVENT_AGE_MS = 24 * 60 * 60 * 1000;
export const EVENT_RETENTION_DAYS = 30;