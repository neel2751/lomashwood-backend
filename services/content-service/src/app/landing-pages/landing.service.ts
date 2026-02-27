import {
  LANDING_ERROR_CODES,
  LANDING_EVENTS,
  LANDING_ALLOWED_STATUS_TRANSITIONS,
} from './landing.constants';
import { LandingRepositoryImpl } from './landing.repository';
import { LandingMapper } from './landing.mapper';
import { publishPagePublishedEvent, IEventProducer } from '../../events/page-published.event';
import {
  CreateLandingPagePayload,
  LandingListQuery,
  LandingPageDetailDto,
  LandingPageSummaryDto,
  LandingService,
  PaginatedLandingResult,
  UpdateLandingPagePayload,
} from './landing.types';
import {
  LandingPageNotFoundError,
  ConflictError,
  ValidationError,
} from '../../shared/errors';
import { logger } from '../../config/logger';

export class LandingServiceImpl implements LandingService {
  private readonly repository: LandingRepositoryImpl;
  private readonly producer: IEventProducer;

  constructor(producer: IEventProducer) {
    this.repository = new LandingRepositoryImpl();
    this.producer = producer;
  }

  async listLandingPages(query: LandingListQuery): Promise<PaginatedLandingResult> {
    return this.repository.findAll(query);
  }

  async getLandingBySlug(slug: string): Promise<LandingPageDetailDto> {
    const page = await this.repository.findBySlug(slug);
    if (!page) throw new LandingPageNotFoundError(slug);
    return LandingMapper.toDetailDto(page);
  }

  async getLandingById(id: string): Promise<LandingPageDetailDto> {
    const page = await this.repository.findById(id);
    if (!page) throw new LandingPageNotFoundError(id);
    return LandingMapper.toDetailDto(page);
  }

  async getActiveLandingPages(): Promise<LandingPageSummaryDto[]> {
    const pages = await this.repository.findActive();
    return LandingMapper.toSummaryDtoList(pages);
  }

  async createLandingPage(payload: CreateLandingPagePayload): Promise<LandingPageDetailDto> {
    const slugTaken = await this.repository.slugExists(payload.slug);
    if (slugTaken) {
      throw new ConflictError(
        `Slug '${payload.slug}' is already in use`,
        { code: LANDING_ERROR_CODES.SLUG_CONFLICT, slug: payload.slug },
      );
    }

    const page = await this.repository.create(payload);

    if (page.status === 'PUBLISHED') {
      await publishPagePublishedEvent(this.producer, {
        pageId: page.id,
        slug: page.slug,
        title: page.title,
        pageType: 'LANDING',
        heroImageUrl: page.coverImageUrl,
        isRepublish: false,
        slugChanged: false,
        previousSlug: null,
        isIndexable: true,
        publishedBy: 'system',
        publishedAt: page.publishedAt?.toISOString() ?? new Date().toISOString(),
      }).catch((err: unknown) => {
        logger.warn(
          { event: LANDING_EVENTS.PUBLISHED, err },
          'Failed to emit landing event on create',
        );
      });
    }

    return LandingMapper.toDetailDto(page);
  }

  async updateLandingPage(
    id: string,
    payload: UpdateLandingPagePayload,
  ): Promise<LandingPageDetailDto> {
    const existing = await this.repository.findById(id);
    if (!existing) throw new LandingPageNotFoundError(id);

    if (payload.status !== undefined) {
      const allowed = LANDING_ALLOWED_STATUS_TRANSITIONS[existing.status] ?? [];
      if (!allowed.includes(payload.status)) {
        throw new ValidationError(
          `Cannot transition landing page from '${existing.status}' to '${payload.status}'`,
          [{ field: 'status', message: `Invalid status transition: ${existing.status} to ${payload.status}` }],
          { code: LANDING_ERROR_CODES.INVALID_STATUS_TRANSITION },
        );
      }
    }

    if (payload.slug !== undefined && payload.slug !== existing.slug) {
      const slugTaken = await this.repository.slugExists(payload.slug, id);
      if (slugTaken) {
        throw new ConflictError(
          `Slug '${payload.slug}' is already in use`,
          { code: LANDING_ERROR_CODES.SLUG_CONFLICT, slug: payload.slug },
        );
      }
    }

    const updated = await this.repository.update(id, payload);
    const isNowPublished = payload.status === 'PUBLISHED' && existing.status !== 'PUBLISHED';
    const slugChanged = updated.slug !== existing.slug;

    if (isNowPublished) {
      await publishPagePublishedEvent(this.producer, {
        pageId: updated.id,
        slug: updated.slug,
        title: updated.title,
        pageType: 'LANDING',
        heroImageUrl: updated.coverImageUrl,
        isRepublish: existing.publishedAt !== null,
        slugChanged,
        previousSlug: slugChanged ? existing.slug : null,
        isIndexable: true,
        publishedBy: 'system',
        publishedAt: updated.publishedAt?.toISOString() ?? new Date().toISOString(),
      }).catch((err: unknown) => {
        logger.warn(
          { event: LANDING_EVENTS.PUBLISHED, err },
          'Failed to emit landing event on update',
        );
      });
    }

    return LandingMapper.toDetailDto(updated);
  }

  async deleteLandingPage(id: string): Promise<void> {
    const existing = await this.repository.findById(id);
    if (!existing) throw new LandingPageNotFoundError(id);

    await this.repository.softDelete(id);

    await publishPagePublishedEvent(this.producer, {
      pageId: id,
      slug: existing.slug,
      title: existing.title,
      pageType: 'LANDING',
      heroImageUrl: existing.coverImageUrl,
      isRepublish: false,
      slugChanged: false,
      previousSlug: null,
      isIndexable: false,
      publishedBy: 'system',
      publishedAt: new Date().toISOString(),
    }).catch((err: unknown) => {
      logger.warn({ event: LANDING_EVENTS.DELETED, err }, 'Failed to emit landing.deleted event');
    });
  }
}