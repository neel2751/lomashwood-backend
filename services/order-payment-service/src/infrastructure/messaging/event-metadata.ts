import { randomUUID } from 'crypto';
import { AnyTopic } from './event-topics';

const SERVICE_SOURCE  = 'order-payment-service' as const;
const DEFAULT_VERSION = '1.0' as const;

export type EventMetadata = {
  eventId:       string;
  eventType:     string;
  source:        string;
  version:       string;
  timestamp:     string;
  correlationId: string;
  causationId:   string | null;
  schemaVersion: number;
};

export type EventMetadataOptions = {
  correlationId?: string;
  causationId?:   string;
  version?:       string;
  schemaVersion?: number;
};

export type EventEnvelope<T = unknown> = {
  metadata: EventMetadata;
  payload:  T;
};

export type InboundEventMetadata = {
  eventId:       string;
  eventType:     string;
  source:        string;
  version:       string;
  timestamp:     string;
  correlationId: string | null;
  causationId:   string | null;
  schemaVersion: number;
  receivedAt:    string;
};

export function buildMetadata(
  eventType: AnyTopic | string,
  options: EventMetadataOptions = {},
): EventMetadata {
  return {
    eventId:       randomUUID(),
    eventType,
    source:        SERVICE_SOURCE,
    version:       options.version       ?? DEFAULT_VERSION,
    timestamp:     new Date().toISOString(),
    correlationId: options.correlationId ?? randomUUID(),
    causationId:   options.causationId   ?? null,
    schemaVersion: options.schemaVersion ?? 1,
  };
}

export function buildEnvelope<T>(
  eventType: AnyTopic | string,
  payload: T,
  options: EventMetadataOptions = {},
): EventEnvelope<T> {
  return {
    metadata: buildMetadata(eventType, options),
    payload,
  };
}

export function parseInboundMetadata(
  raw: Record<string, unknown>,
): InboundEventMetadata {
  return {
    eventId:       String(raw['eventId']       ?? raw['event_id']       ?? randomUUID()),
    eventType:     String(raw['eventType']      ?? raw['event_type']     ?? 'unknown'),
    source:        String(raw['source']         ?? 'unknown'),
    version:       String(raw['version']        ?? DEFAULT_VERSION),
    timestamp:     String(raw['timestamp']      ?? new Date().toISOString()),
    correlationId: raw['correlationId'] != null  ? String(raw['correlationId']) : null,
    causationId:   raw['causationId']   != null  ? String(raw['causationId'])   : null,
    schemaVersion: typeof raw['schemaVersion'] === 'number' ? raw['schemaVersion'] : 1,
    receivedAt:    new Date().toISOString(),
  };
}

export function propagateMetadata(
  inbound: InboundEventMetadata,
  newEventType: AnyTopic | string,
  options: Omit<EventMetadataOptions, 'correlationId' | 'causationId'> = {},
): EventMetadata {
  return buildMetadata(newEventType, {
    ...options,
    correlationId: inbound.correlationId ?? randomUUID(),
    causationId:   inbound.eventId,
  });
}

export function isValidMetadata(raw: unknown): raw is EventMetadata {
  if (typeof raw !== 'object' || raw === null) return false;

  const m = raw as Record<string, unknown>;

  return (
    typeof m['eventId']       === 'string' &&
    typeof m['eventType']     === 'string' &&
    typeof m['source']        === 'string' &&
    typeof m['version']       === 'string' &&
    typeof m['timestamp']     === 'string' &&
    typeof m['correlationId'] === 'string' &&
    typeof m['schemaVersion'] === 'number'
  );
}

export function redactMetadata(
  metadata: EventMetadata,
): Omit<EventMetadata, 'correlationId'> & { correlationId: string } {
  return { ...metadata };
}

export const MetadataFields = {
  EVENT_ID:       'eventId',
  EVENT_TYPE:     'eventType',
  SOURCE:         'source',
  VERSION:        'version',
  TIMESTAMP:      'timestamp',
  CORRELATION_ID: 'correlationId',
  CAUSATION_ID:   'causationId',
  SCHEMA_VERSION: 'schemaVersion',
} as const;