import { redisClient } from '../../infrastructure/cache/redis.client';
import {
  SEO_CACHE_KEYS,
  SEO_CACHE_TTL_SECONDS,
  SEO_ERROR_CODES,
  SEO_EVENTS,
  SeoEntityType,
} from './seo.constants';
import { SeoRepositoryImpl } from './seo.repository';
import { SeoMapper } from './seo.mapper';
import { emitSeoEvent } from '../../events/seo-updated.event';
import {
  SeoListQuery,
  SeoMetaDto,
  SeoService,
  PaginatedSeoResult,
  UpdateSeoMetaPayload,
  UpsertSeoMetaPayload,
} from './seo.types';
import { AppError } from '../../shared/errors';
import { logger } from '../../config/logger';

export class SeoServiceImpl implements SeoService {
  private readonly repository: SeoRepositoryImpl;

  constructor() {
    this.repository = new SeoRepositoryImpl();
  }

  async listSeoMeta(query: SeoListQuery): Promise<PaginatedSeoResult> {
    const cacheKey = `${SEO_CACHE_KEYS.LIST}:${JSON.stringify(query)}`;

    const cached = await redisClient.get(cacheKey).catch(() => null);
    if (cached) {
      return JSON.parse(cached) as PaginatedSeoResult;
    }

    const result = await this.repository.findAll(query);

    await redisClient
      .setEx(cacheKey, SEO_CACHE_TTL_SECONDS, JSON.stringify(result))
      .catch(() => {});

    return result;
  }

  async getSeoById(id: string): Promise<SeoMetaDto> {
    const meta = await this.repository.findById(id);

    if (!meta) {
      throw new AppError(SEO_ERROR_CODES.NOT_FOUND, `SEO meta record '${id}' not found`, 404);
    }

    return SeoMapper.toDto(meta);
  }

  async getSeoByEntity(entityType: SeoEntityType, entityId: string): Promise<SeoMetaDto> {
    const cacheKey = SEO_CACHE_KEYS.BY_ENTITY(entityType, entityId);

    const cached = await redisClient.get(cacheKey).catch(() => null);
    if (cached) {
      return JSON.parse(cached) as SeoMetaDto;
    }

    const meta = await this.repository.findByEntity(entityType, entityId);

    if (!meta) {
      throw new AppError(
        SEO_ERROR_CODES.NOT_FOUND,
        `No SEO meta found for ${entityType}/${entityId}`,
        404,
      );
    }

    const dto = SeoMapper.toDto(meta);

    await redisClient
      .setEx(cacheKey, SEO_CACHE_TTL_SECONDS, JSON.stringify(dto))
      .catch(() => {});

    return dto;
  }

  async upsertSeo(payload: UpsertSeoMetaPayload): Promise<SeoMetaDto> {
    const existing = await this.repository.findByEntity(payload.entityType, payload.entityId);

    const meta = await this.repository.upsert(payload);

    // Invalidate cached entry for this entity
    await this.invalidateEntityCache(payload.entityType, payload.entityId);

    const eventType = existing ? SEO_EVENTS.UPDATED : SEO_EVENTS.CREATED;

    await emitSeoEvent(eventType, {
      seoId: meta.id,
      entityType: meta.entityType as SeoEntityType,
      entityId: meta.entityId,
    }).catch((err) => logger.warn('Failed to emit seo event', { eventType, err }));

    return SeoMapper.toDto(meta);
  }

  async updateSeo(id: string, payload: UpdateSeoMetaPayload): Promise<SeoMetaDto> {
    const existing = await this.repository.findById(id);

    if (!existing) {
      throw new AppError(SEO_ERROR_CODES.NOT_FOUND, `SEO meta record '${id}' not found`, 404);
    }

    const updated = await this.repository.update(id, payload);

    await this.invalidateEntityCache(
      existing.entityType as SeoEntityType,
      existing.entityId,
    );

    await emitSeoEvent(SEO_EVENTS.UPDATED, {
      seoId: updated.id,
      entityType: updated.entityType as SeoEntityType,
      entityId: updated.entityId,
    }).catch((err) => logger.warn('Failed to emit seo.updated event', { err }));

    return SeoMapper.toDto(updated);
  }

  async deleteSeo(id: string): Promise<void> {
    const existing = await this.repository.findById(id);

    if (!existing) {
      throw new AppError(SEO_ERROR_CODES.NOT_FOUND, `SEO meta record '${id}' not found`, 404);
    }

    await this.repository.delete(id);

    await this.invalidateEntityCache(
      existing.entityType as SeoEntityType,
      existing.entityId,
    );

    // Invalidate list cache
    const listKeys = await redisClient
      .keys(`${SEO_CACHE_KEYS.LIST}:*`)
      .catch(() => [] as string[]);
    if (listKeys.length > 0) {
      await redisClient.del(listKeys).catch(() => {});
    }

    await emitSeoEvent(SEO_EVENTS.DELETED, {
      seoId: id,
      entityType: existing.entityType as SeoEntityType,
      entityId: existing.entityId,
    }).catch((err) => logger.warn('Failed to emit seo.deleted event', { err }));
  }

  private async invalidateEntityCache(
    entityType: SeoEntityType,
    entityId: string,
  ): Promise<void> {
    const keys = [
      SEO_CACHE_KEYS.BY_ENTITY(entityType, entityId),
      `${SEO_CACHE_KEYS.LIST}:*`,
    ];

    const listKeys = await redisClient
      .keys(`${SEO_CACHE_KEYS.LIST}:*`)
      .catch(() => [] as string[]);

    const toDelete = [SEO_CACHE_KEYS.BY_ENTITY(entityType, entityId), ...listKeys];

    if (toDelete.length > 0) {
      await redisClient.del(toDelete).catch(() => {});
    }
  }
}