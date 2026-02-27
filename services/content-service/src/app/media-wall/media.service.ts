import { redisClient } from '../../infrastructure/cache/redis.client';
import {
  MEDIA_CACHE_KEYS,
  MEDIA_CACHE_TTL_SECONDS,
  MEDIA_ERROR_CODES,
  MEDIA_EVENTS,
} from './media.constants';
import { MediaWallRepositoryImpl } from './media.repository';
import { MediaMapper } from './media.mapper';
import { emitMediaEvent } from '../../events/media-uploaded.event';
import {
  CreateMediaWallPayload,
  MediaWallDto,
  MediaWallListQuery,
  MediaWallService,
  PaginatedMediaWallResult,
  ReorderMediaWallPayload,
  UpdateMediaWallPayload,
} from './media.types';
import { NotFoundError, ConflictError } from '../../shared/errors';
import { logger } from '../../config/logger';

export class MediaWallServiceImpl implements MediaWallService {
  private readonly repository: MediaWallRepositoryImpl;

  constructor() {
    this.repository = new MediaWallRepositoryImpl();
  }

  async listMedia(query: MediaWallListQuery): Promise<PaginatedMediaWallResult> {
    const cacheKey = `${MEDIA_CACHE_KEYS.LIST}:${JSON.stringify(query)}`;

    const cached = await redisClient.get(cacheKey).catch(() => null);
    if (cached) {
      return JSON.parse(cached) as PaginatedMediaWallResult;
    }

    const result = await this.repository.findAll(query);

    await redisClient
      .setex(cacheKey, MEDIA_CACHE_TTL_SECONDS, JSON.stringify(result))
      .catch(() => {});

    return result;
  }

  async getMediaById(id: string): Promise<MediaWallDto> {
    const cacheKey = MEDIA_CACHE_KEYS.DETAIL(id);

    const cached = await redisClient.get(cacheKey).catch(() => null);
    if (cached) {
      return JSON.parse(cached) as MediaWallDto;
    }

    const media = await this.repository.findById(id);

    if (!media) {
      throw new NotFoundError('Media wall entry', id);
    }

    const dto = MediaMapper.toDto(media);

    await redisClient
      .setex(cacheKey, MEDIA_CACHE_TTL_SECONDS, JSON.stringify(dto))
      .catch(() => {});

    return dto;
  }

  async getActiveMedia(): Promise<MediaWallDto[]> {
    const cached = await redisClient.get(MEDIA_CACHE_KEYS.ACTIVE).catch(() => null);
    if (cached) {
      return JSON.parse(cached) as MediaWallDto[];
    }

    const records = await this.repository.findActive();
    const dtos = MediaMapper.toDtoList(records);

    await redisClient
      .setex(MEDIA_CACHE_KEYS.ACTIVE, MEDIA_CACHE_TTL_SECONDS, JSON.stringify(dtos))
      .catch(() => {});

    return dtos;
  }

  async createMedia(payload: CreateMediaWallPayload): Promise<MediaWallDto> {
    const sortOrder = payload.sortOrder ?? 0;
    const sortOrderTaken = await this.repository.sortOrderExists(sortOrder);
    if (sortOrderTaken) {
      throw new ConflictError(
        `Sort order ${sortOrder} is already in use. Choose a different position or reorder existing items first.`,
        { code: MEDIA_ERROR_CODES.DUPLICATE_SORT_ORDER },
      );
    }

    const media = await this.repository.create(payload);

    await this.invalidateAllCache();

    await emitMediaEvent(MEDIA_EVENTS.CREATED, { mediaId: media.id }).catch((err: unknown) => {
      const msg = err instanceof Error ? err.message : String(err);
      logger.warn(`Failed to emit media.created event: ${msg}`);
    });

    return MediaMapper.toDto(media);
  }

  async updateMedia(id: string, payload: UpdateMediaWallPayload): Promise<MediaWallDto> {
    const existing = await this.repository.findById(id);
    if (!existing) {
      throw new NotFoundError('Media wall entry', id);
    }

    if (payload.sortOrder !== undefined && payload.sortOrder !== existing.sortOrder) {
      const sortOrderTaken = await this.repository.sortOrderExists(payload.sortOrder, id);
      if (sortOrderTaken) {
        throw new ConflictError(
          `Sort order ${payload.sortOrder} is already in use.`,
          { code: MEDIA_ERROR_CODES.DUPLICATE_SORT_ORDER },
        );
      }
    }

    const updated = await this.repository.update(id, payload);

    await this.invalidateAllCache(id);

    await emitMediaEvent(MEDIA_EVENTS.UPDATED, { mediaId: updated.id }).catch((err: unknown) => {
      const msg = err instanceof Error ? err.message : String(err);
      logger.warn(`Failed to emit media.updated event: ${msg}`);
    });

    return MediaMapper.toDto(updated);
  }

  async reorderMedia(payload: ReorderMediaWallPayload): Promise<void> {
    const { items } = payload;

    // Verify all referenced IDs exist before applying any change
    const existingChecks = await Promise.all(
      items.map(({ id }) => this.repository.findById(id)),
    );

    const missing = items
      .filter((_, idx) => existingChecks[idx] === null)
      .map(({ id }) => id);

    if (missing.length > 0) {
      throw new NotFoundError(
        'Media wall entries',
        missing.join(', '),
      );
    }

    await this.repository.reorder(items);

    await this.invalidateAllCache();

    await emitMediaEvent(MEDIA_EVENTS.REORDERED, {
      itemCount: items.length,
    }).catch((err: unknown) => {
      const msg = err instanceof Error ? err.message : String(err);
      logger.warn(`Failed to emit media.reordered event: ${msg}`);
    });
  }

  async deleteMedia(id: string): Promise<void> {
    const existing = await this.repository.findById(id);
    if (!existing) {
      throw new NotFoundError('Media wall entry', id);
    }

    await this.repository.softDelete(id);

    await this.invalidateAllCache(id);

    await emitMediaEvent(MEDIA_EVENTS.DELETED, { mediaId: id }).catch((err: unknown) => {
      const msg = err instanceof Error ? err.message : String(err);
      logger.warn(`Failed to emit media.deleted event: ${msg}`);
    });
  }

  private async invalidateAllCache(id?: string): Promise<void> {
    const listKeys = await redisClient
      .keys(`${MEDIA_CACHE_KEYS.LIST}:*`)
      .catch(() => [] as string[]);

    const keysToDelete: string[] = [MEDIA_CACHE_KEYS.ACTIVE, ...listKeys];

    if (id) {
      keysToDelete.push(MEDIA_CACHE_KEYS.DETAIL(id));
    }

    if (keysToDelete.length > 0) {
      await redisClient.del(keysToDelete).catch(() => {});
    }
  }
}