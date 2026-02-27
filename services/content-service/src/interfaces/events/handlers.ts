import { logger } from '../../config/logger';
import { BlogService } from '../../app/blogs/blog.service';
import { MediaService } from '../../app/media-wall/media.service';
import { PageService } from '../../app/cms/page.service';
import { SeoService } from '../../app/seo/seo.service';
import {
  ContentEventPayload,
  ProductCreatedPayload,
  ProductUpdatedPayload,
  OrderCreatedPayload,
  BlogPublishedPayload,
  BlogUpdatedPayload,
  MediaUploadedPayload,
  PagePublishedPayload,
  SeoUpdatedPayload,
  SitemapRegeneratePayload,
} from './payload.types';
import { CONTENT_EVENT_TOPICS } from './subscriptions';


type EventHandler<T extends ContentEventPayload> = (payload: T) => Promise<void>;

interface HandlerRegistry {
  [topic: string]: EventHandler<ContentEventPayload>;
}

export class ContentEventHandlers {
  private readonly registry: HandlerRegistry;

  constructor(
    private readonly blogService: BlogService,
    private readonly mediaService: MediaService,
    private readonly pageService: PageService,
    private readonly seoService: SeoService,
  ) {
    this.registry = this.buildRegistry();
  }


  async dispatch(topic: string, payload: ContentEventPayload): Promise<void> {
    const handler = this.registry[topic];

    if (!handler) {
      logger.warn({ topic }, '[ContentEventHandlers] No handler registered for topic');
      return;
    }

    try {
      logger.info({ topic, eventId: payload.eventId }, '[ContentEventHandlers] Dispatching event');
      await handler(payload);
      logger.info({ topic, eventId: payload.eventId }, '[ContentEventHandlers] Event handled successfully');
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      logger.error({ topic, eventId: payload.eventId, error: message }, '[ContentEventHandlers] Handler threw an error');
      throw err;
    }
  }


  private buildRegistry(): HandlerRegistry {
    return {
      // ── Inbound: product events that may affect content cross-links ──────────
      [CONTENT_EVENT_TOPICS.PRODUCT_CREATED]: this.handleProductCreated.bind(this) as EventHandler<ContentEventPayload>,
      [CONTENT_EVENT_TOPICS.PRODUCT_UPDATED]: this.handleProductUpdated.bind(this) as EventHandler<ContentEventPayload>,

      [CONTENT_EVENT_TOPICS.ORDER_CREATED]: this.handleOrderCreated.bind(this) as EventHandler<ContentEventPayload>,

      [CONTENT_EVENT_TOPICS.BLOG_PUBLISHED]: this.handleBlogPublished.bind(this) as EventHandler<ContentEventPayload>,
      [CONTENT_EVENT_TOPICS.BLOG_UPDATED]: this.handleBlogUpdated.bind(this) as EventHandler<ContentEventPayload>,
      [CONTENT_EVENT_TOPICS.MEDIA_UPLOADED]: this.handleMediaUploaded.bind(this) as EventHandler<ContentEventPayload>,
      [CONTENT_EVENT_TOPICS.PAGE_PUBLISHED]: this.handlePagePublished.bind(this) as EventHandler<ContentEventPayload>,
      [CONTENT_EVENT_TOPICS.SEO_UPDATED]: this.handleSeoUpdated.bind(this) as EventHandler<ContentEventPayload>,
      [CONTENT_EVENT_TOPICS.SITEMAP_REGENERATE]: this.handleSitemapRegenerate.bind(this) as EventHandler<ContentEventPayload>,
    };
  }

  private async handleProductCreated(payload: ContentEventPayload): Promise<void> {
    const p = payload as ProductCreatedPayload;

    logger.info(
      { productId: p.data.productId, category: p.data.category },
      '[ContentEventHandlers] Product created — checking for auto-tag opportunities',
    );

    await this.blogService.invalidateCategoryCache(p.data.category);
  }

  private async handleProductUpdated(payload: ContentEventPayload): Promise<void> {
    const p = payload as ProductUpdatedPayload;

    logger.info(
      { productId: p.data.productId },
      '[ContentEventHandlers] Product updated — invalidating related content cache',
    );

    await this.blogService.invalidateProductCache(p.data.productId);
  }

 
  private async handleOrderCreated(payload: ContentEventPayload): Promise<void> {
    const p = payload as OrderCreatedPayload;

    logger.info(
      { orderId: p.data.orderId, customerId: p.data.customerId },
      '[ContentEventHandlers] Order created — post-purchase content flow triggered',
    );

    await this.blogService.getInspirationPostsForCategory(p.data.category);
  }


  private async handleBlogPublished(payload: ContentEventPayload): Promise<void> {
    const p = payload as BlogPublishedPayload;

    logger.info(
      { blogId: p.data.blogId, slug: p.data.slug },
      '[ContentEventHandlers] Blog published — queuing sitemap regeneration',
    );

    await this.seoService.generateMetaForBlog(p.data.blogId);
    await this.pageService.scheduleSitemapRebuild();
  }


  private async handleBlogUpdated(payload: ContentEventPayload): Promise<void> {
    const p = payload as BlogUpdatedPayload;

    logger.info(
      { blogId: p.data.blogId },
      '[ContentEventHandlers] Blog updated — refreshing SEO and cache',
    );

    await this.seoService.refreshMetaForBlog(p.data.blogId);
    await this.blogService.invalidateBlogCache(p.data.blogId);
  }

  
  private async handleMediaUploaded(payload: ContentEventPayload): Promise<void> {
    const p = payload as MediaUploadedPayload;

    logger.info(
      { mediaId: p.data.mediaId, entityType: p.data.entityType, entityId: p.data.entityId },
      '[ContentEventHandlers] Media uploaded — processing associations',
    );

    await this.mediaService.processUpload({
      mediaId: p.data.mediaId,
      entityType: p.data.entityType,
      entityId: p.data.entityId,
      url: p.data.url,
      mimeType: p.data.mimeType,
    });
  }

  private async handlePagePublished(payload: ContentEventPayload): Promise<void> {
    const p = payload as PagePublishedPayload;

    logger.info(
      { pageId: p.data.pageId, slug: p.data.slug },
      '[ContentEventHandlers] Page published — rebuilding sitemap',
    );

    await this.seoService.generateMetaForPage(p.data.pageId);
    await this.pageService.scheduleSitemapRebuild();
  }

 
  private async handleSeoUpdated(payload: ContentEventPayload): Promise<void> {
    const p = payload as SeoUpdatedPayload;

    logger.info(
      { seoId: p.data.seoId, entityType: p.data.entityType, entityId: p.data.entityId },
      '[ContentEventHandlers] SEO updated — invalidating cache',
    );

    await this.seoService.invalidateCache(p.data.entityType, p.data.entityId);
  }

  private async handleSitemapRegenerate(payload: ContentEventPayload): Promise<void> {
    const p = payload as SitemapRegeneratePayload;

    logger.info(
      { triggeredBy: p.data.triggeredBy },
      '[ContentEventHandlers] Sitemap regeneration requested',
    );

    await this.pageService.rebuildSitemap();
  }
}