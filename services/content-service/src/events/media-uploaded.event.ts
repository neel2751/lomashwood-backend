import { v4 as uuidv4 } from 'uuid';
import { createLogger } from '../config/logger';
import { buildTopicName } from '../config/messaging';
import { isImageMimeType, isVideoMimeType } from '../config/storage';
import { PublishResult } from '../infrastructure/messaging/event-producer';

const log = createLogger('MediaUploadedEvent');

// ─── Event Payload ────────────────────────────────────────────────────────────

export type MediaEntityType =
  | 'BLOG'
  | 'PAGE'
  | 'PRODUCT'
  | 'MEDIA_WALL'
  | 'SHOWROOM'
  | 'LANDING'
  | 'HOME_SLIDER'
  | 'BROCHURE';

export type MediaFileType = 'IMAGE' | 'VIDEO' | 'DOCUMENT' | 'OTHER';

export interface MediaUploadedEventData {
  mediaId: string;
  entityType: MediaEntityType;
  entityId: string;
  /** Full CDN/S3 URL of the uploaded file. */
  url: string;
  /** S3 object key. */
  s3Key: string;
  filename: string;
  mimeType: string;
  fileType: MediaFileType;
  /** File size in bytes. */
  sizeBytes: number;
  /** Image/video width in pixels (null for non-visual media). */
  widthPx: number | null;
  /** Image/video height in pixels. */
  heightPx: number | null;
  /** Video duration in seconds (null for images). */
  durationSeconds: number | null;
  /** Alt text for accessibility. */
  altText: string | null;
  uploadedBy: string;
  uploadedAt: string;
}

export interface MediaUploadedEvent {
  eventId: string;
  occurredAt: string;
  source: 'content-service';
  schemaVersion: '1.0';
  type: 'content.media.uploaded';
  data: MediaUploadedEventData;
}

// ─── Topic ────────────────────────────────────────────────────────────────────

export const MEDIA_UPLOADED_TOPIC = buildTopicName('content.media.uploaded');

// ─── File Type Resolver ───────────────────────────────────────────────────────

export function resolveFileType(mimeType: string): MediaFileType {
  if (isImageMimeType(mimeType)) return 'IMAGE';
  if (isVideoMimeType(mimeType)) return 'VIDEO';
  if (mimeType === 'application/pdf') return 'DOCUMENT';
  return 'OTHER';
}

// ─── Factory ──────────────────────────────────────────────────────────────────

export function createMediaUploadedEvent(
  data: MediaUploadedEventData,
): MediaUploadedEvent {
  return {
    eventId: uuidv4(),
    occurredAt: new Date().toISOString(),
    source: 'content-service',
    schemaVersion: '1.0',
    type: 'content.media.uploaded',
    data,
  };
}

// ─── Publisher ────────────────────────────────────────────────────────────────

export interface IEventProducer {
  publish(topic: string, payload: unknown): Promise<PublishResult>;
}

export async function publishMediaUploadedEvent(
  producer: IEventProducer,
  data: MediaUploadedEventData,
): Promise<void> {
  const event = createMediaUploadedEvent(data);

  try {
    const result = await producer.publish(MEDIA_UPLOADED_TOPIC, event);
    if (!result.success) {
      throw result.error || new Error('Failed to publish media uploaded event');
    }

    log.info(
      {
        eventId: event.eventId,
        mediaId: data.mediaId,
        entityType: data.entityType,
        entityId: data.entityId,
        fileType: data.fileType,
        sizeBytes: data.sizeBytes,
        topic: MEDIA_UPLOADED_TOPIC,
      },
      '[MediaUploadedEvent] Event published',
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    log.error(
      {
        eventId: event.eventId,
        mediaId: data.mediaId,
        topic: MEDIA_UPLOADED_TOPIC,
        error: message,
      },
      '[MediaUploadedEvent] Failed to publish event',
    );
    throw err;
  }
}

// ─── Thumbnail Processing Request ─────────────────────────────────────────────

/**
 * Determines whether a media upload should trigger thumbnail generation.
 * Images above 100KB attached to public-facing entities always get thumbnails.
 */
export function shouldGenerateThumbnail(data: MediaUploadedEventData): boolean {
  const PUBLIC_ENTITY_TYPES: MediaEntityType[] = [
    'BLOG', 'PAGE', 'MEDIA_WALL', 'LANDING', 'HOME_SLIDER',
  ];

  return (
    data.fileType === 'IMAGE' &&
    data.sizeBytes > 100 * 1024 &&
    PUBLIC_ENTITY_TYPES.includes(data.entityType)
  );
}

// ─── Consumers ────────────────────────────────────────────────────────────────

/**
 * Downstream services that subscribe to this event:
 *
 * - content-service self → associates media with entity, triggers thumbnail gen
 * - product-service      → updates product image gallery if entityType=PRODUCT
 * - analytics-service    → records media_uploaded analytics event
 */
export const MEDIA_UPLOADED_CONSUMERS = [
  'content-service',
  'product-service',
  'analytics-service',
] as const;

// ─── Generic Media Event Emitter ──────────────────────────────────────────────

export async function emitMediaEvent(
  eventType: string,
  data: Record<string, unknown>,
): Promise<void> {
  try {
    log.debug({ eventType, data }, 'Emitting media event');
  } catch (err: unknown) {
    log.warn('Failed to emit media event', err instanceof Error ? err.message : String(err));
  }
}