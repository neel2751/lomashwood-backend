export interface EventMetadata {
  eventId: string;
  timestamp: string;
  version: string;
  source: string;
  correlationId?: string;
  causationId?: string;
  userId?: string;
  traceId?: string;
  spanId?: string;
  sessionId?: string;
  requestId?: string;
  ipAddress?: string;
  userAgent?: string;
  locale?: string;
  environment?: string;
  retryCount?: number;
  priority?: EventPriority;
  expiresAt?: string;
  metadata?: Record<string, any>;
}

export enum EventPriority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical',
}

export interface EventContext {
  userId?: string;
  sessionId?: string;
  requestId?: string;
  correlationId?: string;
  causationId?: string;
  traceId?: string;
  spanId?: string;
  ipAddress?: string;
  userAgent?: string;
  locale?: string;
}

export interface EventHeaders {
  'content-type'?: string;
  'x-event-id': string;
  'x-event-type': string;
  'x-event-timestamp': string;
  'x-event-version': string;
  'x-event-source': string;
  'x-correlation-id'?: string;
  'x-causation-id'?: string;
  'x-user-id'?: string;
  'x-trace-id'?: string;
  'x-span-id'?: string;
  'x-retry-count'?: string;
  'x-priority'?: string;
}

export class EventMetadataBuilder {
  private metadata: Partial<EventMetadata>;

  constructor() {
    this.metadata = {
      timestamp: new Date().toISOString(),
      version: '1.0',
      source: 'lomash-wood-backend',
      environment: process.env.NODE_ENV || 'development',
    };
  }

  withEventId(eventId: string): this {
    this.metadata.eventId = eventId;
    return this;
  }

  withTimestamp(timestamp: string): this {
    this.metadata.timestamp = timestamp;
    return this;
  }

  withVersion(version: string): this {
    this.metadata.version = version;
    return this;
  }

  withSource(source: string): this {
    this.metadata.source = source;
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

  withUserId(userId: string): this {
    this.metadata.userId = userId;
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

  withSessionId(sessionId: string): this {
    this.metadata.sessionId = sessionId;
    return this;
  }

  withRequestId(requestId: string): this {
    this.metadata.requestId = requestId;
    return this;
  }

  withIpAddress(ipAddress: string): this {
    this.metadata.ipAddress = ipAddress;
    return this;
  }

  withUserAgent(userAgent: string): this {
    this.metadata.userAgent = userAgent;
    return this;
  }

  withLocale(locale: string): this {
    this.metadata.locale = locale;
    return this;
  }

  withEnvironment(environment: string): this {
    this.metadata.environment = environment;
    return this;
  }

  withRetryCount(retryCount: number): this {
    this.metadata.retryCount = retryCount;
    return this;
  }

  withPriority(priority: EventPriority): this {
    this.metadata.priority = priority;
    return this;
  }

  withExpiresAt(expiresAt: string | Date): this {
    this.metadata.expiresAt = typeof expiresAt === 'string' 
      ? expiresAt 
      : expiresAt.toISOString();
    return this;
  }

  withCustomMetadata(key: string, value: any): this {
    if (!this.metadata.metadata) {
      this.metadata.metadata = {};
    }
    this.metadata.metadata[key] = value;
    return this;
  }

  withContext(context: EventContext): this {
    if (context.userId) this.withUserId(context.userId);
    if (context.sessionId) this.withSessionId(context.sessionId);
    if (context.requestId) this.withRequestId(context.requestId);
    if (context.correlationId) this.withCorrelationId(context.correlationId);
    if (context.causationId) this.withCausationId(context.causationId);
    if (context.traceId) this.withTraceId(context.traceId);
    if (context.spanId) this.withSpanId(context.spanId);
    if (context.ipAddress) this.withIpAddress(context.ipAddress);
    if (context.userAgent) this.withUserAgent(context.userAgent);
    if (context.locale) this.withLocale(context.locale);
    return this;
  }

  build(): EventMetadata {
    if (!this.metadata.eventId) {
      this.metadata.eventId = this.generateEventId();
    }

    return this.metadata as EventMetadata;
  }

  private generateEventId(): string {
    return `evt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

export const createEventMetadata = (
  context?: EventContext,
  options?: Partial<EventMetadata>
): EventMetadata => {
  const builder = new EventMetadataBuilder();

  if (context) {
    builder.withContext(context);
  }

  if (options) {
    if (options.eventId) builder.withEventId(options.eventId);
    if (options.timestamp) builder.withTimestamp(options.timestamp);
    if (options.version) builder.withVersion(options.version);
    if (options.source) builder.withSource(options.source);
    if (options.correlationId) builder.withCorrelationId(options.correlationId);
    if (options.causationId) builder.withCausationId(options.causationId);
    if (options.userId) builder.withUserId(options.userId);
    if (options.traceId) builder.withTraceId(options.traceId);
    if (options.spanId) builder.withSpanId(options.spanId);
    if (options.sessionId) builder.withSessionId(options.sessionId);
    if (options.requestId) builder.withRequestId(options.requestId);
    if (options.ipAddress) builder.withIpAddress(options.ipAddress);
    if (options.userAgent) builder.withUserAgent(options.userAgent);
    if (options.locale) builder.withLocale(options.locale);
    if (options.environment) builder.withEnvironment(options.environment);
    if (options.retryCount !== undefined) builder.withRetryCount(options.retryCount);
    if (options.priority) builder.withPriority(options.priority);
    if (options.expiresAt) builder.withExpiresAt(options.expiresAt);
    if (options.metadata) {
      Object.entries(options.metadata).forEach(([key, value]) => {
        builder.withCustomMetadata(key, value);
      });
    }
  }

  return builder.build();
};

export const toEventHeaders = (metadata: EventMetadata, eventType: string): EventHeaders => {
  const headers: EventHeaders = {
    'content-type': 'application/json',
    'x-event-id': metadata.eventId,
    'x-event-type': eventType,
    'x-event-timestamp': metadata.timestamp,
    'x-event-version': metadata.version,
    'x-event-source': metadata.source,
  };

  if (metadata.correlationId) {
    headers['x-correlation-id'] = metadata.correlationId;
  }

  if (metadata.causationId) {
    headers['x-causation-id'] = metadata.causationId;
  }

  if (metadata.userId) {
    headers['x-user-id'] = metadata.userId;
  }

  if (metadata.traceId) {
    headers['x-trace-id'] = metadata.traceId;
  }

  if (metadata.spanId) {
    headers['x-span-id'] = metadata.spanId;
  }

  if (metadata.retryCount !== undefined) {
    headers['x-retry-count'] = metadata.retryCount.toString();
  }

  if (metadata.priority) {
    headers['x-priority'] = metadata.priority;
  }

  return headers;
};

export const fromEventHeaders = (headers: Record<string, string>): Partial<EventMetadata> => {
  return {
    eventId: headers['x-event-id'],
    timestamp: headers['x-event-timestamp'],
    version: headers['x-event-version'],
    source: headers['x-event-source'],
    correlationId: headers['x-correlation-id'],
    causationId: headers['x-causation-id'],
    userId: headers['x-user-id'],
    traceId: headers['x-trace-id'],
    spanId: headers['x-span-id'],
    retryCount: headers['x-retry-count'] ? parseInt(headers['x-retry-count'], 10) : undefined,
    priority: headers['x-priority'] as EventPriority | undefined,
  };
};

export const enrichMetadata = (
  metadata: EventMetadata,
  enrichment: Partial<EventMetadata>
): EventMetadata => {
  return {
    ...metadata,
    ...enrichment,
    metadata: {
      ...metadata.metadata,
      ...enrichment.metadata,
    },
  };
};

export const isExpired = (metadata: EventMetadata): boolean => {
  if (!metadata.expiresAt) {
    return false;
  }

  const expiryTime = new Date(metadata.expiresAt).getTime();
  const currentTime = Date.now();

  return currentTime > expiryTime;
};

export const shouldRetry = (metadata: EventMetadata, maxRetries: number = 3): boolean => {
  const retryCount = metadata.retryCount || 0;
  return retryCount < maxRetries && !isExpired(metadata);
};

export const incrementRetryCount = (metadata: EventMetadata): EventMetadata => {
  return {
    ...metadata,
    retryCount: (metadata.retryCount || 0) + 1,
  };
};

export const cloneMetadataWithNewEventId = (metadata: EventMetadata): EventMetadata => {
  return {
    ...metadata,
    eventId: `evt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    timestamp: new Date().toISOString(),
    causationId: metadata.eventId,
  };
};