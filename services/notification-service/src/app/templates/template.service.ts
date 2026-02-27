import { Logger } from 'winston';
import { TemplateRepository } from './template.repository';
import { TemplateMapper } from './template.mapper';
import {
  NotificationTemplate,
  TemplateFilter,
  TemplateListResponse,
  RenderTemplateRequest,
  RenderTemplateResponse,
  TemplateVersionRecord,
  TemplateStatus,
} from './template.types';
import { TEMPLATE_ERRORS, TEMPLATE_EVENTS, TEMPLATE_CACHE_KEYS, TEMPLATE_CACHE_TTL_SECONDS } from './template.constants';
import type { CreateTemplateDto, UpdateTemplateDto } from './template.schemas';
import type { IEventProducer } from '../../infrastructure/messaging/event-producer';
import type { RedisClientType } from 'redis';
import { AppError } from '../../shared/errors';

export class TemplateService {
  constructor(
    private readonly templateRepository: TemplateRepository,
    private readonly redis: RedisClientType,
    private readonly eventProducer: IEventProducer,
    private readonly logger: Logger,
  ) {}

  // ---------------------------------------------------------------------------
  // Cache helpers
  // ---------------------------------------------------------------------------

  private async cacheGet<T>(key: string): Promise<T | null> {
    try {
      const raw = await this.redis.get(key);
      return raw ? (JSON.parse(raw) as T) : null;
    } catch {
      return null;
    }
  }

  private async cacheSet(key: string, value: unknown, ttl: number): Promise<void> {
    try {
      await this.redis.setEx(key, ttl, JSON.stringify(value));
    } catch (err) {
      this.logger.warn('Cache set failed', { key, error: (err as Error).message });
    }
  }

  private async cacheDelete(...keys: string[]): Promise<void> {
    try {
      if (keys.length) await this.redis.del(keys);
    } catch {
      // non-critical
    }
  }

  // ---------------------------------------------------------------------------
  // CRUD
  // ---------------------------------------------------------------------------

  async create(dto: CreateTemplateDto, createdBy: string): Promise<NotificationTemplate> {
    const exists = await this.templateRepository.slugExists(dto.slug);
    if (exists) {
      throw new AppError(TEMPLATE_ERRORS.SLUG_CONFLICT, `Template slug "${dto.slug}" is already in use`, 409);
    }

    const template = await this.templateRepository.create(dto, createdBy);

    await this.eventProducer.publish(TEMPLATE_EVENTS.CREATED, {
      templateId: template.id,
      slug: template.slug,
      channel: template.channel,
      createdBy,
    });

    this.logger.info('Template created', { templateId: template.id, slug: template.slug });
    return template;
  }

  async update(id: string, dto: UpdateTemplateDto, updatedBy: string): Promise<NotificationTemplate> {
    const existing = await this.getById(id);

    if (existing.status === TemplateStatus.ARCHIVED) {
      throw new AppError(TEMPLATE_ERRORS.ARCHIVED, 'Cannot update an archived template. Restore it first.', 400);
    }

    const template = await this.templateRepository.update(id, dto, updatedBy);

    await this.cacheDelete(
      TEMPLATE_CACHE_KEYS.BY_ID(id),
      TEMPLATE_CACHE_KEYS.BY_SLUG_CHANNEL(existing.slug, existing.channel),
    );

    await this.eventProducer.publish(TEMPLATE_EVENTS.UPDATED, {
      templateId: template.id,
      slug: template.slug,
      channel: template.channel,
      version: template.version,
      updatedBy,
    });

    this.logger.info('Template updated', { templateId: id, version: template.version });
    return template;
  }

  async getById(id: string): Promise<NotificationTemplate> {
    const cached = await this.cacheGet<NotificationTemplate>(TEMPLATE_CACHE_KEYS.BY_ID(id));
    if (cached) return cached;

    const template = await this.templateRepository.findById(id);
    if (!template) {
      throw new AppError(TEMPLATE_ERRORS.NOT_FOUND, `Template with id "${id}" not found`, 404);
    }

    await this.cacheSet(TEMPLATE_CACHE_KEYS.BY_ID(id), template, TEMPLATE_CACHE_TTL_SECONDS.TEMPLATE);
    return template;
  }

  async getBySlug(slug: string, channel: string): Promise<NotificationTemplate> {
    const cacheKey = TEMPLATE_CACHE_KEYS.BY_SLUG_CHANNEL(slug, channel);
    const cached = await this.cacheGet<NotificationTemplate>(cacheKey);
    if (cached) return cached;

    const template = await this.templateRepository.findBySlugAndChannel(slug, channel);
    if (!template) {
      throw new AppError(TEMPLATE_ERRORS.NOT_FOUND, `Template "${slug}" not found for channel "${channel}"`, 404);
    }

    await this.cacheSet(cacheKey, template, TEMPLATE_CACHE_TTL_SECONDS.TEMPLATE);
    return template;
  }

  async list(filter: TemplateFilter): Promise<TemplateListResponse> {
    return this.templateRepository.list(filter);
  }

  async archive(id: string, updatedBy: string): Promise<NotificationTemplate> {
    const existing = await this.getById(id);

    if (existing.status === TemplateStatus.ARCHIVED) {
      throw new AppError(TEMPLATE_ERRORS.ARCHIVED, 'Template is already archived', 400);
    }

    const template = await this.templateRepository.archive(id, updatedBy);

    await this.cacheDelete(
      TEMPLATE_CACHE_KEYS.BY_ID(id),
      TEMPLATE_CACHE_KEYS.BY_SLUG_CHANNEL(existing.slug, existing.channel),
    );

    await this.eventProducer.publish(TEMPLATE_EVENTS.ARCHIVED, { templateId: id, updatedBy });
    this.logger.info('Template archived', { templateId: id });
    return template;
  }

  async restore(id: string, updatedBy: string): Promise<NotificationTemplate> {
    const existing = await this.getById(id);

    if (existing.status !== TemplateStatus.ARCHIVED) {
      throw new AppError(TEMPLATE_ERRORS.ARCHIVED, 'Template is not archived', 400);
    }

    const template = await this.templateRepository.restore(id, updatedBy);

    await this.cacheDelete(TEMPLATE_CACHE_KEYS.BY_ID(id));
    await this.eventProducer.publish(TEMPLATE_EVENTS.RESTORED, { templateId: id, updatedBy });
    this.logger.info('Template restored', { templateId: id });
    return template;
  }

  async delete(id: string): Promise<void> {
    const existing = await this.getById(id);

    await this.templateRepository.delete(id);

    await this.cacheDelete(
      TEMPLATE_CACHE_KEYS.BY_ID(id),
      TEMPLATE_CACHE_KEYS.BY_SLUG_CHANNEL(existing.slug, existing.channel),
    );

    await this.eventProducer.publish(TEMPLATE_EVENTS.DELETED, { templateId: id });
    this.logger.info('Template deleted', { templateId: id });
  }

  // ---------------------------------------------------------------------------
  // Rendering
  // ---------------------------------------------------------------------------

  async render(req: RenderTemplateRequest): Promise<RenderTemplateResponse> {
    const template = await this.getBySlug(req.slug, req.channel);

    // Validate required variables are provided
    const missingRequired = template.variables
      .filter((v) => v.required && !(req.variables[v.key] ?? v.defaultValue))
      .map((v) => v.key);

    if (missingRequired.length > 0) {
      throw new AppError(
        TEMPLATE_ERRORS.MISSING_VARIABLE,
        `Missing required template variables: ${missingRequired.join(', ')}`,
        400,
      );
    }

    const rendered = TemplateMapper.toRenderedResponse(template, req.variables);

    await this.eventProducer.publish(TEMPLATE_EVENTS.RENDERED, {
      templateId: template.id,
      slug: req.slug,
      channel: req.channel,
    });

    return rendered;
  }

  // ---------------------------------------------------------------------------
  // Versions
  // ---------------------------------------------------------------------------

  async listVersions(templateId: string): Promise<TemplateVersionRecord[]> {
    await this.getById(templateId); // ensures template exists
    return this.templateRepository.listVersions(templateId);
  }

  async getVersion(templateId: string, version: number): Promise<TemplateVersionRecord> {
    await this.getById(templateId);
    const record = await this.templateRepository.findVersion(templateId, version);
    if (!record) {
      throw new AppError(TEMPLATE_ERRORS.VERSION_NOT_FOUND, `Version ${version} not found for template "${templateId}"`, 404);
    }
    return record;
  }
}