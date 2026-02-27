import { randomUUID } from 'crypto';

export interface EventMetadata {
  eventId: string;
  eventVersion: string;
  occurredAt: string;
  sourceService: string;
  correlationId?: string;
  causationId?: string;
  userId?: string;
  traceId?: string;
}

export function buildEventMetadata(
  sourceService: string,
  opts: {
    correlationId?: string;
    causationId?: string;
    userId?: string;
    traceId?: string;
  } = {},
): EventMetadata {
  return {
    eventId: randomUUID(),
    eventVersion: '1.0',
    occurredAt: new Date().toISOString(),
    sourceService,
    ...opts,
  };
}

export function parseEventMetadata(raw: unknown): EventMetadata {
  const obj = raw as Record<string, unknown>;

  if (!obj || typeof obj !== 'object') {
    throw new Error('Invalid event metadata: not an object');
  }

  if (typeof obj.eventId !== 'string') {
    throw new Error('Invalid event metadata: missing eventId');
  }

  if (typeof obj.occurredAt !== 'string') {
    throw new Error('Invalid event metadata: missing occurredAt');
  }

  if (typeof obj.sourceService !== 'string') {
    throw new Error('Invalid event metadata: missing sourceService');
  }

  return {
    eventId: obj.eventId,
    eventVersion: typeof obj.eventVersion === 'string' ? obj.eventVersion : '1.0',
    occurredAt: obj.occurredAt,
    sourceService: obj.sourceService,
    correlationId: typeof obj.correlationId === 'string' ? obj.correlationId : undefined,
    causationId: typeof obj.causationId === 'string' ? obj.causationId : undefined,
    userId: typeof obj.userId === 'string' ? obj.userId : undefined,
    traceId: typeof obj.traceId === 'string' ? obj.traceId : undefined,
  };
}

export function buildEventEnvelope<T>(
  payload: T,
  metadata: EventMetadata,
): { payload: T; metadata: EventMetadata } {
  return { payload, metadata };
}