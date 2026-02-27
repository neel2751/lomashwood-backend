import { getRedisClient } from '../../infrastructure/cache/redis.client';
import {
  PAGE_CACHE_KEYS,
  PAGE_CACHE_TTL_SECONDS,
  PAGE_ERROR_CODES,
  PAGE_ALLOWED_STATUS_TRANSITIONS,
  PAGE_EVENTS,
  PAGE_SYSTEM_SLUGS,
  SystemSlug,
} from './page.constants';
import { PageRepositoryImpl } from './page.repository';
import { PageMapper } from './page.mapper';
import { IEventProducer } from '../../events/page-published.event';
import {
  CmsPageDetailDto,
  CmsPageSummaryDto,
  CreatePagePayload,
  PageListQuery,
  PageService,
  PaginatedPageResult,
  UpdatePagePayload,
} from './page.types';
import { NotFoundError, ConflictError, ValidationError, AppError } from '../../shared/errors';
import { logger } from '../../config/logger';

export class PageServiceImpl implements PageService {
  private readonly repository: PageRepositoryImpl;
  private readonly producer: IEventProducer;

  constructor(producer: IEventProducer) {
    this.producer = producer;
    this.repository = new PageRepositoryImpl();
  }

  // ---------------------------------------------------------------------------
  // Private helpers
  // ---------------------------------------------------------------------------

  private get redis() {
    return getRedisClient();
  }

  private async invalidateListCache(): Promise<void> {
    const listKeys = await this.redis
      .keys(`${PAGE_CACHE_KEYS.LIST}:*`)
      .catch(() => [] as string[]);

    const keysToDelete = [PAGE_CACHE_KEYS.PUBLISHED, ...listKeys];

    if (keysToDelete.length > 0) {
      await this.redis.del(keysToDelete).catch(() => {});
    }
  }

  private isSystemSlug(slug: string): slug is SystemSlug {
    return (PAGE_SYSTEM_SLUGS as readonly string[]).includes(slug);
  }

  private async emitPageEvent(
    eventType: (typeof PAGE_EVENTS)[keyof typeof PAGE_EVENTS],
    payload: { pageId: string; slug: string },
  ): Promise<void> {
    await this.producer.publish(eventType, payload);
  }

  // ---------------------------------------------------------------------------
  // Queries
  // ---------------------------------------------------------------------------

  async listPages(query: PageListQuery): Promise<PaginatedPageResult> {
    const cacheKey = `${PAGE_CACHE_KEYS.LIST}:${JSON.stringify(query)}`;

    const cached = await this.redis.get(cacheKey).catch(() => null);
    if (cached) {
      return JSON.parse(cached) as PaginatedPageResult;
    }

    const result = await this.repository.findAll(query);

    await this.redis
      .setEx(cacheKey, PAGE_CACHE_TTL_SECONDS, JSON.stringify(result))
      .catch(() => {});

    return result;
  }

  async getPageBySlug(slug: string): Promise<CmsPageDetailDto> {
    const cacheKey = PAGE_CACHE_KEYS.DETAIL(slug);

    const cached = await this.redis.get(cacheKey).catch(() => null);
    if (cached) {
      return JSON.parse(cached) as CmsPageDetailDto;
    }

    const page = await this.repository.findBySlug(slug);

    if (!page) {
      throw new NotFoundError(`Page with slug '${slug}' not found`);
    }

    const dto = PageMapper.toDetailDto(page);

    await this.redis
      .setEx(cacheKey, PAGE_CACHE_TTL_SECONDS, JSON.stringify(dto))
      .catch(() => {});

    return dto;
  }

  async getPageById(id: string): Promise<CmsPageDetailDto> {
    const cacheKey = PAGE_CACHE_KEYS.BY_ID(id);

    const cached = await this.redis.get(cacheKey).catch(() => null);
    if (cached) {
      return JSON.parse(cached) as CmsPageDetailDto;
    }

    const page = await this.repository.findById(id);

    if (!page) {
      throw new NotFoundError(`Page '${id}' not found`);
    }

    const dto = PageMapper.toDetailDto(page);

    await this.redis
      .setEx(cacheKey, PAGE_CACHE_TTL_SECONDS, JSON.stringify(dto))
      .catch(() => {});

    return dto;
  }

  async getPublishedPages(): Promise<CmsPageSummaryDto[]> {
    const cached = await this.redis.get(PAGE_CACHE_KEYS.PUBLISHED).catch(() => null);
    if (cached) {
      return JSON.parse(cached) as CmsPageSummaryDto[];
    }

    const pages = await this.repository.findAllPublished();
    const dtos = PageMapper.toSummaryDtoList(pages);

    await this.redis
      .setEx(PAGE_CACHE_KEYS.PUBLISHED, PAGE_CACHE_TTL_SECONDS, JSON.stringify(dtos))
      .catch(() => {});

    return dtos;
  }

  async getSystemPage(slug: SystemSlug): Promise<CmsPageDetailDto> {
    const cacheKey = PAGE_CACHE_KEYS.DETAIL(slug);

    const cached = await this.redis.get(cacheKey).catch(() => null);
    if (cached) {
      return JSON.parse(cached) as CmsPageDetailDto;
    }

    const page = await this.repository.findBySystemSlug(slug);

    if (!page) {
      throw new NotFoundError(
        `System page '${slug}' not found. Ensure the database has been seeded.`,
      );
    }

    const dto = PageMapper.toDetailDto(page);

    await this.redis
      .setEx(cacheKey, PAGE_CACHE_TTL_SECONDS, JSON.stringify(dto))
      .catch(() => {});

    return dto;
  }

  // ---------------------------------------------------------------------------
  // Mutations
  // ---------------------------------------------------------------------------

  async createPage(payload: CreatePagePayload): Promise<CmsPageDetailDto> {
    if (payload.slug) {
      const slugTaken = await this.repository.slugExists(payload.slug);
      if (slugTaken) {
        throw new ConflictError(`Slug '${payload.slug}' is already in use`);
      }
    }

    if (payload.status === 'PUBLISHED' && !payload.content?.trim()) {
      throw new ValidationError('A page must have content before it can be published');
    }

    const page = await this.repository.create(payload);

    await this.invalidateListCache();

    if (page.status === 'PUBLISHED') {
      await this.emitPageEvent(PAGE_EVENTS.PUBLISHED, {
        pageId: page.id,
        slug: page.slug,
      }).catch((err: unknown) =>
        logger.warn({ err }, 'Failed to emit page.published event'),
      );
    }

    return PageMapper.toDetailDto(page);
  }

  async updatePage(id: string, payload: UpdatePagePayload): Promise<CmsPageDetailDto> {
    const existing = await this.repository.findById(id);
    if (!existing) {
      throw new AppError(PAGE_ERROR_CODES.NOT_FOUND, `Page '${id}' not found`, 404);
    }

    // System pages have immutable slugs
    if (
      payload.slug !== undefined &&
      payload.slug !== existing.slug &&
      existing.isSystem
    ) {
      throw new ValidationError(
        `The slug of the system page '${existing.slug}' cannot be changed`,
      );
    }

    // Validate status transition
    if (payload.status !== undefined) {
      const allowed: string[] = PAGE_ALLOWED_STATUS_TRANSITIONS[existing.status] ?? [];
      if (!allowed.includes(payload.status)) {
        throw new ValidationError(
          `Cannot transition page from '${existing.status}' to '${payload.status}'`,
        );
      }
    }

    // Slug uniqueness for non-system slug changes
    if (payload.slug !== undefined && payload.slug !== existing.slug) {
      const slugTaken = await this.repository.slugExists(payload.slug, id);
      if (slugTaken) {
        throw new ConflictError(`Slug '${payload.slug}' is already in use`);
      }
    }

    const updated = await this.repository.update(id, payload);

    await Promise.all([
      this.invalidateListCache(),
      this.redis.del(PAGE_CACHE_KEYS.DETAIL(existing.slug)).catch(() => {}),
      this.redis.del(PAGE_CACHE_KEYS.BY_ID(id)).catch(() => {}),
      updated.slug !== existing.slug
        ? this.redis.del(PAGE_CACHE_KEYS.DETAIL(updated.slug)).catch(() => {})
        : Promise.resolve(),
    ]);

    const eventType =
      payload.status === 'PUBLISHED' && existing.status !== 'PUBLISHED'
        ? PAGE_EVENTS.PUBLISHED
        : payload.status === 'DRAFT' && existing.status === 'PUBLISHED'
          ? PAGE_EVENTS.UNPUBLISHED
          : PAGE_EVENTS.UPDATED;

    await this.emitPageEvent(eventType, {
      pageId: updated.id,
      slug: updated.slug,
    }).catch((err: unknown) =>
      logger.warn({ err, eventType }, 'Failed to emit page event'),
    );

    return PageMapper.toDetailDto(updated);
  }

  async deletePage(id: string): Promise<void> {
    const existing = await this.repository.findById(id);
    if (!existing) {
      throw new NotFoundError(`Page '${id}' not found`);
    }

    // System pages are protected from deletion
    if (existing.isSystem) {
      throw new ValidationError(
        `System page '${existing.slug}' cannot be deleted. Use the CMS to update its content.`,
      );
    }

    await this.repository.softDelete(id);

    await Promise.all([
      this.invalidateListCache(),
      this.redis.del(PAGE_CACHE_KEYS.DETAIL(existing.slug)).catch(() => {}),
      this.redis.del(PAGE_CACHE_KEYS.BY_ID(id)).catch(() => {}),
    ]);

    await this.emitPageEvent(PAGE_EVENTS.DELETED, {
      pageId: id,
      slug: existing.slug,
    }).catch((err: unknown) =>
      logger.warn({ err }, 'Failed to emit page.deleted event'),
    );
  }
}