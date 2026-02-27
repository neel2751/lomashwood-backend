import { redis } from '../../infrastructure/cache/redis.client';

import {
  BLOG_CACHE_KEYS,
  BLOG_CACHE_TTL_SECONDS,
  BLOG_ALLOWED_STATUS_TRANSITIONS,
} from './blog.constants';
import { BlogRepositoryImpl } from './blog.repository';
import { BlogMapper } from './blog.mapper';
import { publishBlogPublishedEvent, IEventProducer } from '../../events/blog-published.event';
import { publishBlogUpdatedEvent, BlogUpdatedEventData, BlogUpdatedField } from '../../events/blog-updated.event';
import {
  BlogDetailDto,
  BlogListQuery,
  BlogRepository,
  BlogService,
  BlogSummaryDto,
  CreateBlogPayload,
  PaginatedBlogResult,
  UpdateBlogPayload,
} from './blog.types';
import { NotFoundError, ConflictError, ValidationError } from '../../shared/errors';
import { logger } from '../../config/logger';

// ─── Service ──────────────────────────────────────────────────────────────────

export class BlogServiceImpl implements BlogService {
  private readonly repository: BlogRepository;
  private readonly producer: IEventProducer;

  constructor(producer: IEventProducer) {
    this.repository = new BlogRepositoryImpl();
    this.producer = producer;
  }

  async listBlogs(query: BlogListQuery): Promise<PaginatedBlogResult> {
    const cacheKey = `${BLOG_CACHE_KEYS.LIST}:${JSON.stringify(query)}`;

    const cached = await redis.get(cacheKey).catch(() => null);
    if (cached) {
      return JSON.parse(cached) as PaginatedBlogResult;
    }

    const result = await this.repository.findAll(query);

    await redis
      .setex(cacheKey, BLOG_CACHE_TTL_SECONDS, JSON.stringify(result))
      .catch(() => {});

    return result;
  }

  async getBlogBySlug(slug: string): Promise<BlogDetailDto> {
    const cacheKey = BLOG_CACHE_KEYS.DETAIL(slug);

    const cached = await redis.get(cacheKey).catch(() => null);
    if (cached) {
      return JSON.parse(cached) as BlogDetailDto;
    }

    const blog = await this.repository.findBySlug(slug);

    if (!blog) {
      throw new NotFoundError(`Blog post '${slug}' not found`);
    }

    const dto = BlogMapper.toDetailDto(
      blog as Parameters<typeof BlogMapper.toDetailDto>[0],
    );

    await redis
      .setex(cacheKey, BLOG_CACHE_TTL_SECONDS, JSON.stringify(dto))
      .catch(() => {});

    return dto;
  }

  async getBlogById(id: string): Promise<BlogDetailDto> {
    const blog = await this.repository.findById(id);

    if (!blog) {
      throw new NotFoundError(`Blog post '${id}' not found`);
    }

    return BlogMapper.toDetailDto(blog as Parameters<typeof BlogMapper.toDetailDto>[0]);
  }

  async getFeaturedBlogs(limit = 6): Promise<BlogSummaryDto[]> {
    const cached = await redis.get(BLOG_CACHE_KEYS.FEATURED).catch(() => null);
    if (cached) {
      return JSON.parse(cached) as BlogSummaryDto[];
    }

    const blogs = await this.repository.findFeatured(limit);
    const dtos = BlogMapper.toSummaryDtoList(
      blogs as Parameters<typeof BlogMapper.toSummaryDtoList>[0],
    );

    await redis
      .setex(BLOG_CACHE_KEYS.FEATURED, BLOG_CACHE_TTL_SECONDS, JSON.stringify(dtos))
      .catch(() => {});

    return dtos;
  }

  async createBlog(payload: CreateBlogPayload): Promise<BlogDetailDto> {
    const slugTaken = await this.repository.slugExists(payload.slug);
    if (slugTaken) {
      throw new ConflictError(`Slug '${payload.slug}' is already in use`);
    }

    if (payload.status === 'PUBLISHED' && !payload.content?.trim()) {
      throw new ValidationError('A blog post must have content before it can be published');
    }

    const blog = await this.repository.create(payload);

    await this.invalidateListCache();

    if (blog.status === 'PUBLISHED') {
      const data = {
        blogId: blog.id,
        slug: blog.slug,
        title: blog.title,
        excerpt: blog.excerpt,
        heroImageUrl: blog.coverImage,
        authorId: blog.authorId,
        authorName: 'Unknown', // TODO: fetch from user service
        category: blog.category?.name || '',
        // FIX 1: BlogTag does not have nested .tag — use .name directly
        tags: blog.tags?.map(t => t.name) || [],
        publishedAt: blog.publishedAt?.toISOString() || new Date().toISOString(),
        readTimeMinutes: null, // TODO: calculate
      };
      await publishBlogPublishedEvent(this.producer, data).catch((err: unknown) =>
        logger.warn({ err }, 'Failed to publish blog.published event'),
      );
    }

    return BlogMapper.toDetailDto(blog as Parameters<typeof BlogMapper.toDetailDto>[0]);
  }

  async updateBlog(id: string, payload: UpdateBlogPayload): Promise<BlogDetailDto> {
    const existing = await this.repository.findById(id);
    if (!existing) {
      throw new NotFoundError(`Blog post '${id}' not found`);
    }

    if (payload.status !== undefined) {
      const allowed =
        BLOG_ALLOWED_STATUS_TRANSITIONS[
          existing.status as keyof typeof BLOG_ALLOWED_STATUS_TRANSITIONS
        ] ?? [];
      if (!allowed.includes(payload.status)) {
        throw new ValidationError(`Cannot transition blog from '${existing.status}' to '${payload.status}'`);
      }
    }

    if (payload.slug !== undefined && payload.slug !== existing.slug) {
      const slugTaken = await this.repository.slugExists(payload.slug, id);
      if (slugTaken) {
        throw new ConflictError(`Slug '${payload.slug}' is already in use`);
      }
    }

    const updated = await this.repository.update(id, payload);

    await Promise.all([
      this.invalidateListCache(),
      redis.del(BLOG_CACHE_KEYS.DETAIL(existing.slug)).catch(() => {}),
      updated.slug !== existing.slug
        ? redis.del(BLOG_CACHE_KEYS.DETAIL(updated.slug)).catch(() => {})
        : Promise.resolve(),
    ]);

    const isPublishing = payload.status === 'PUBLISHED' && existing.status !== 'PUBLISHED';
    const slugChanged = payload.slug !== undefined && payload.slug !== existing.slug;
    // FIX 2: Cast to BlogUpdatedField[] instead of (keyof UpdateBlogPayload)[]
    const updatedFields = Object.keys(payload) as BlogUpdatedField[];
    const seoImpacting = updatedFields.some(f => ['title', 'excerpt', 'slug'].includes(f));
    const mediaChanged = updatedFields.includes('coverImage' as BlogUpdatedField);

    if (isPublishing) {
      const data = {
        blogId: updated.id,
        slug: updated.slug,
        title: updated.title,
        excerpt: updated.excerpt,
        heroImageUrl: updated.coverImage,
        authorId: updated.authorId,
        authorName: 'Unknown', // TODO: fetch from user service
        category: updated.category?.name || '',
        // FIX 1: BlogTag does not have nested .tag — use .name directly
        tags: updated.tags?.map(t => t.name) || [],
        publishedAt: updated.publishedAt?.toISOString() || new Date().toISOString(),
        readTimeMinutes: null, // TODO: calculate
      };
      await publishBlogPublishedEvent(this.producer, data).catch((err: unknown) =>
        logger.warn({ err }, 'Failed to publish blog.published event'),
      );
    } else {
      const data: BlogUpdatedEventData = {
        blogId: updated.id,
        slug: updated.slug,
        title: updated.title,
        authorId: updated.authorId,
        // FIX 2: updatedFields is now correctly typed as BlogUpdatedField[]
        updatedFields,
        slugChanged,
        previousSlug: slugChanged ? existing.slug : null,
        seoImpacting,
        mediaChanged,
        updatedAt: updated.updatedAt.toISOString(),
        updatedBy: updated.authorId,
      };
      await publishBlogUpdatedEvent(this.producer, data).catch((err: unknown) =>
        logger.warn({ err }, 'Failed to publish blog.updated event'),
      );
    }

    return BlogMapper.toDetailDto(updated as Parameters<typeof BlogMapper.toDetailDto>[0]);
  }

  async deleteBlog(id: string): Promise<void> {
    const existing = await this.repository.findById(id);
    if (!existing) {
      throw new NotFoundError(`Blog post '${id}' not found`);
    }

    await this.repository.softDelete(id);

    await Promise.all([
      this.invalidateListCache(),
      redis.del(BLOG_CACHE_KEYS.DETAIL(existing.slug)).catch(() => {}),
      redis.del(BLOG_CACHE_KEYS.FEATURED).catch(() => {}),
    ]);

    // No delete event defined yet
  }

  // ─── Private Helpers ───────────────────────────────────────────────────────

  private async invalidateListCache(): Promise<void> {
    const keys = await redis
      .keys(`${BLOG_CACHE_KEYS.LIST}:*`)
      .catch(() => [] as string[]);

    if (keys.length > 0) {
      await redis.del(...keys).catch(() => {});
    }

    await redis.del(BLOG_CACHE_KEYS.FEATURED).catch(() => {});
  }
}