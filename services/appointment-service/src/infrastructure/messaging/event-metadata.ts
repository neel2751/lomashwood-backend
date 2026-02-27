import { v4 as uuidv4 } from 'uuid';

export interface EventMetadata {
  eventId: string;
  eventType: string;
  service: string;
  version: string;
  timestamp: string;
  correlationId?: string;
  causationId?: string;
  userId?: string;
  sessionId?: string;
  traceId?: string;
  spanId?: string;
  environment: string;
  retryCount: number;
  maxRetries: number;
}

export interface EnrichedEvent<T = Record<string, unknown>> {
  metadata: EventMetadata;
  data: T;
}

export interface EventContext {
  correlationId?: string;
  causationId?: string;
  userId?: string;
  sessionId?: string;
  traceId?: string;
  spanId?: string;
}

const SERVICE_NAME = 'appointment-service';
const SERVICE_VERSION = '1.0.0';

export function createEventMetadata(
  eventType: string,
  context: EventContext = {},
  retryCount: number = 0,
  maxRetries: number = 3,
): EventMetadata {
  return {
    eventId: uuidv4(),
    eventType,
    service: SERVICE_NAME,
    version: SERVICE_VERSION,
    timestamp: new Date().toISOString(),
    correlationId: context.correlationId ?? uuidv4(),
    causationId: context.causationId,
    userId: context.userId,
    sessionId: context.sessionId,
    traceId: context.traceId,
    spanId: context.spanId,
    environment: process.env.NODE_ENV ?? 'development',
    retryCount,
    maxRetries,
  };
}

export function createEnrichedEvent<T = Record<string, unknown>>(
  eventType: string,
  data: T,
  context: EventContext = {},
  retryCount: number = 0,
  maxRetries: number = 3,
): EnrichedEvent<T> {
  return {
    metadata: createEventMetadata(eventType, context, retryCount, maxRetries),
    data,
  };
}

export function enrichEventWithContext<T = Record<string, unknown>>(
  event: EnrichedEvent<T>,
  context: Partial<EventContext>,
): EnrichedEvent<T> {
  return {
    ...event,
    metadata: {
      ...event.metadata,
      ...context,
    },
  };
}

export function createRetryEvent<T = Record<string, unknown>>(
  originalEvent: EnrichedEvent<T>,
  error: string,
): EnrichedEvent<T & { retryError: string; originalTimestamp: string }> {
  return {
    metadata: {
      ...originalEvent.metadata,
      eventId: uuidv4(),
      timestamp: new Date().toISOString(),
      retryCount: originalEvent.metadata.retryCount + 1,
      causationId: originalEvent.metadata.eventId,
    },
    data: {
      ...originalEvent.data,
      retryError: error,
      originalTimestamp: originalEvent.metadata.timestamp,
    },
  };
}

export function createDeadLetterEvent<T = Record<string, unknown>>(
  originalEvent: EnrichedEvent<T>,
  error: string,
): EnrichedEvent<{
  originalEvent: EnrichedEvent<T>;
  error: string;
  deadLetteredAt: string;
  totalRetries: number;
}> {
  return {
    metadata: createEventMetadata(
      `${originalEvent.metadata.eventType}.dead_letter`,
      {
        correlationId: originalEvent.metadata.correlationId,
        causationId: originalEvent.metadata.eventId,
        userId: originalEvent.metadata.userId,
        traceId: originalEvent.metadata.traceId,
      },
    ),
    data: {
      originalEvent,
      error,
      deadLetteredAt: new Date().toISOString(),
      totalRetries: originalEvent.metadata.retryCount,
    },
  };
}

export function isRetryable(event: EnrichedEvent): boolean {
  return event.metadata.retryCount < event.metadata.maxRetries;
}

export function extractCorrelationId(event: EnrichedEvent): string {
  return event.metadata.correlationId ?? event.metadata.eventId;
}

export function validateEventMetadata(metadata: Partial<EventMetadata>): boolean {
  return !!(
    metadata.eventId &&
    metadata.eventType &&
    metadata.service &&
    metadata.version &&
    metadata.timestamp &&
    metadata.environment
  );
}

export function serializeEvent<T = Record<string, unknown>>(
  event: EnrichedEvent<T>,
): string {
  return JSON.stringify(event);
}

export function deserializeEvent<T = Record<string, unknown>>(
  raw: string,
): EnrichedEvent<T> {
  return JSON.parse(raw) as EnrichedEvent<T>;
}

export function getEventAge(event: EnrichedEvent): number {
  return Date.now() - new Date(event.metadata.timestamp).getTime();
}

export function isStaleEvent(
  event: EnrichedEvent,
  maxAgeMs: number = 5 * 60 * 1000,
): boolean {
  return getEventAge(event) > maxAgeMs;
}