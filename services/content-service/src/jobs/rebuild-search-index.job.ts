import { CronJob } from 'cron';
import { PrismaClient } from '@prisma/client';
import { createLogger } from '../config/logger';

const log = createLogger('RebuildSearchIndexJob');



interface IndexableDocument {
  id: string;
  type: 'blog' | 'product' | 'page' | 'landing' | 'showroom';
  title: string;
  slug: string;
  description: string | null;
  content: string | null;
  tags: string[];
  category: string | null;
  isActive: boolean;
  publishedAt: Date | null;
  updatedAt: Date;
}


interface RebuildResult {
  indexedCount: number;
  removedCount: number;
  failedCount: number;
  durationMs: number;
  rebuiltAt: string;
}



interface BlogRow {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  content: string | null;
  tags: unknown;
  category: string | null;
  status: string;
  publishedAt: Date | null;
  updatedAt: Date;
}

interface ColourRow {
  name: string;
}

interface ProductRow {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  category: string | null;
  rangeName: string | null;
  isActive: boolean;
  updatedAt: Date;
  colours: ColourRow[];
}

interface CmsPageRow {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  content: string | null;
  pageType: string;
  status: string;
  updatedAt: Date;
}

interface ShowroomRow {
  id: string;
  name: string;
  slug: string;
  address: string | null;
  isActive: boolean;
  updatedAt: Date;
}


export interface ISearchIndexClient {
  upsertDocuments(indexName: string, documents: IndexableDocument[]): Promise<void>;
  deleteDocuments(indexName: string, ids: string[]): Promise<void>;
  clearIndex(indexName: string): Promise<void>;
  getIndexedIds(indexName: string): Promise<string[]>;
}



export const SEARCH_INDEXES = {
  BLOGS: 'lomash_blogs',
  PRODUCTS: 'lomash_products',
  PAGES: 'lomash_pages',
  SHOWROOMS: 'lomash_showrooms',
} as const;



export class RebuildSearchIndexJob {
  /** Run at 04:00 UTC every day. */
  private readonly cronExpression = '0 4 * * *';
  private job: CronJob | null = null;
  private isRunning = false;

  /** Documents per DB page fetch. */
  private readonly batchSize = 200;

  constructor(
    private readonly prisma: PrismaClient,
    private readonly searchClient: ISearchIndexClient,
  ) {}


  start(): void {
    this.job = new CronJob(
      this.cronExpression,
      () => void this.run(),
      null,
      true,
      'UTC',
    );

    log.info({ cron: this.cronExpression }, '[RebuildSearchIndexJob] Scheduled');
  }

  stop(): void {
    this.job?.stop();
    log.info('[RebuildSearchIndexJob] Stopped');
  }

  

  async run(fullRebuild = false): Promise<RebuildResult> {
    if (this.isRunning) {
      log.warn('[RebuildSearchIndexJob] Already running — skipping this tick');
      return this.emptyResult();
    }

    this.isRunning = true;
    const startedAt = Date.now();

    log.info({ fullRebuild }, '[RebuildSearchIndexJob] Starting search index rebuild');

    let indexedCount = 0;
    let removedCount = 0;
    let failedCount = 0;

    try {
      if (fullRebuild) {
        await this.clearAllIndexes();
      }

      
      const blogResult = await this.indexBlogs(fullRebuild);
      indexedCount += blogResult.indexed;
      removedCount += blogResult.removed;
      failedCount += blogResult.failed;

      
      const productResult = await this.indexProducts(fullRebuild);
      indexedCount += productResult.indexed;
      removedCount += productResult.removed;
      failedCount += productResult.failed;

      
      const pageResult = await this.indexPages(fullRebuild);
      indexedCount += pageResult.indexed;
      removedCount += pageResult.removed;
      failedCount += pageResult.failed;

      
      const showroomResult = await this.indexShowrooms(fullRebuild);
      indexedCount += showroomResult.indexed;
      removedCount += showroomResult.removed;
      failedCount += showroomResult.failed;

      const result: RebuildResult = {
        indexedCount,
        removedCount,
        failedCount,
        durationMs: Date.now() - startedAt,
        rebuiltAt: new Date().toISOString(),
      };

      log.info(result, '[RebuildSearchIndexJob] Rebuild completed');
      return result;
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      log.error({ error: message, durationMs: Date.now() - startedAt }, '[RebuildSearchIndexJob] Job failed');
      throw err;
    } finally {
      this.isRunning = false;
    }
  }


  private async indexBlogs(
    fullRebuild: boolean,
  ): Promise<{ indexed: number; removed: number; failed: number }> {
    log.debug('[RebuildSearchIndexJob] Indexing blogs');

    let indexed = 0;
    let removed = 0;
    let failed = 0;
    let cursor: string | undefined;

    try {
      do {
    
        const blogs: BlogRow[] = await (this.prisma as any).blog.findMany({
          where: { deletedAt: null },
          select: {
            id: true,
            title: true,
            slug: true,
            excerpt: true,
            content: true,
            tags: true,
            category: true,
            status: true,
            publishedAt: true,
            updatedAt: true,
          },
          take: this.batchSize,
          skip: cursor ? 1 : 0,
          cursor: cursor ? { id: cursor } : undefined,
          orderBy: { id: 'asc' },
        });

        if (blogs.length === 0) break;

        
        const active = blogs.filter((b: BlogRow) => b.status === 'PUBLISHED');
        const inactive = blogs.filter((b: BlogRow) => b.status !== 'PUBLISHED');

        if (active.length > 0) {
          const docs: IndexableDocument[] = active.map((b: BlogRow) => ({
            id: b.id,
            type: 'blog' as const,
            title: b.title,
            slug: b.slug,
            description: b.excerpt,
            content: this.stripHtml(b.content ?? ''),
            tags: b.tags as string[],
            category: b.category,
            isActive: true,
            publishedAt: b.publishedAt,
            updatedAt: b.updatedAt,
          }));

          await this.searchClient.upsertDocuments(SEARCH_INDEXES.BLOGS, docs);
          indexed += docs.length;
        }

        if (!fullRebuild && inactive.length > 0) {
          await this.searchClient.deleteDocuments(
            SEARCH_INDEXES.BLOGS,
            inactive.map((b: BlogRow) => b.id),
          );
          removed += inactive.length;
        }

        cursor = blogs[blogs.length - 1].id;
        if (blogs.length < this.batchSize) break;
      } while (true);

      log.info({ indexed, removed }, '[RebuildSearchIndexJob] Blogs indexed');
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      log.error({ error: message }, '[RebuildSearchIndexJob] Blog indexing failed');
      failed++;
    }

    return { indexed, removed, failed };
  }

  

  private async indexProducts(
    fullRebuild: boolean,
  ): Promise<{ indexed: number; removed: number; failed: number }> {
    log.debug('[RebuildSearchIndexJob] Indexing products');

    let indexed = 0;
    let removed = 0;
    let failed = 0;
    let cursor: string | undefined;

    try {
      do {
        
        const products: ProductRow[] = await (this.prisma as any).product.findMany({
          where: { deletedAt: null },
          select: {
            id: true,
            title: true,
            slug: true,
            description: true,
            category: true,
            rangeName: true,
            isActive: true,
            updatedAt: true,
            colours: { select: { name: true } },
          },
          take: this.batchSize,
          skip: cursor ? 1 : 0,
          cursor: cursor ? { id: cursor } : undefined,
          orderBy: { id: 'asc' },
        });

        if (products.length === 0) break;

        
        const active = products.filter((p: ProductRow) => p.isActive);
        const inactive = products.filter((p: ProductRow) => !p.isActive);

        if (active.length > 0) {
          const docs: IndexableDocument[] = active.map((p: ProductRow) => ({
            id: p.id,
            type: 'product' as const,
            title: p.title,
            slug: p.slug,
            description: p.description,
            content: null,
            
            tags: [p.rangeName ?? '', ...p.colours.map((c: ColourRow) => c.name)].filter(Boolean),
            category: p.category,
            isActive: true,
            publishedAt: null,
            updatedAt: p.updatedAt,
          }));

          await this.searchClient.upsertDocuments(SEARCH_INDEXES.PRODUCTS, docs);
          indexed += docs.length;
        }

        if (!fullRebuild && inactive.length > 0) {
          await this.searchClient.deleteDocuments(
            SEARCH_INDEXES.PRODUCTS,
            inactive.map((p: ProductRow) => p.id),
          );
          removed += inactive.length;
        }

        cursor = products[products.length - 1].id;
        if (products.length < this.batchSize) break;
      } while (true);

      log.info({ indexed, removed }, '[RebuildSearchIndexJob] Products indexed');
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      log.error({ error: message }, '[RebuildSearchIndexJob] Product indexing failed');
      failed++;
    }

    return { indexed, removed, failed };
  }

  

  private async indexPages(
    fullRebuild: boolean,
  ): Promise<{ indexed: number; removed: number; failed: number }> {
    log.debug('[RebuildSearchIndexJob] Indexing CMS pages');

    let indexed = 0;
    let removed = 0;
    let failed = 0;

    try {
      
      const pages: CmsPageRow[] = await (this.prisma as any).cmsPage.findMany({
        where: { deletedAt: null, isIndexable: true },
        select: {
          id: true,
          title: true,
          slug: true,
          description: true,
          content: true,
          pageType: true,
          status: true,
          updatedAt: true,
        },
      });

      const active = pages.filter((p: CmsPageRow) => p.status === 'PUBLISHED');
      const inactive = pages.filter((p: CmsPageRow) => p.status !== 'PUBLISHED');

      if (active.length > 0) {
        const docs: IndexableDocument[] = active.map((p: CmsPageRow) => ({
          id: p.id,
          type: 'page' as const,
          title: p.title,
          slug: p.slug,
          description: p.description,
          content: this.stripHtml(p.content ?? ''),
          tags: [p.pageType],
          category: p.pageType,
          isActive: true,
          publishedAt: null,
          updatedAt: p.updatedAt,
        }));

        await this.searchClient.upsertDocuments(SEARCH_INDEXES.PAGES, docs);
        indexed += docs.length;
      }

      if (!fullRebuild && inactive.length > 0) {
        await this.searchClient.deleteDocuments(
          SEARCH_INDEXES.PAGES,
          inactive.map((p: CmsPageRow) => p.id),
        );
        removed += inactive.length;
      }

      log.info({ indexed, removed }, '[RebuildSearchIndexJob] Pages indexed');
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      log.error({ error: message }, '[RebuildSearchIndexJob] Page indexing failed');
      failed++;
    }

    return { indexed, removed, failed };
  }

  

  private async indexShowrooms(
    _fullRebuild: boolean,
  ): Promise<{ indexed: number; removed: number; failed: number }> {
    log.debug('[RebuildSearchIndexJob] Indexing showrooms');

    let indexed = 0;
    let removed = 0;
    let failed = 0;

    try {
      
      const showrooms: ShowroomRow[] = await (this.prisma as any).showroom.findMany({
        where: { deletedAt: null },
        select: {
          id: true,
          name: true,
          slug: true,
          address: true,
          isActive: true,
          updatedAt: true,
        },
      });

      
      const active = showrooms.filter((s: ShowroomRow) => s.isActive);
      const inactive = showrooms.filter((s: ShowroomRow) => !s.isActive);

      if (active.length > 0) {
        const docs: IndexableDocument[] = active.map((s: ShowroomRow) => ({
          id: s.id,
          type: 'showroom' as const,
          title: s.name,
          slug: s.slug,
          description: s.address,
          content: null,
          tags: ['showroom'],
          category: 'showroom',
          isActive: true,
          publishedAt: null,
          updatedAt: s.updatedAt,
        }));

        await this.searchClient.upsertDocuments(SEARCH_INDEXES.SHOWROOMS, docs);
        indexed += docs.length;
      }

      if (inactive.length > 0) {
        await this.searchClient.deleteDocuments(
          SEARCH_INDEXES.SHOWROOMS,
          inactive.map((s: ShowroomRow) => s.id),
        );
        removed += inactive.length;
      }

      log.info({ indexed, removed }, '[RebuildSearchIndexJob] Showrooms indexed');
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      log.error({ error: message }, '[RebuildSearchIndexJob] Showroom indexing failed');
      failed++;
    }

    return { indexed, removed, failed };
  }

  

  private async clearAllIndexes(): Promise<void> {
    log.warn('[RebuildSearchIndexJob] Full rebuild — clearing all search indexes');
    await Promise.all(
      Object.values(SEARCH_INDEXES).map((index) =>
        this.searchClient.clearIndex(index),
      ),
    );
  }

  private stripHtml(html: string): string {
    return html
      .replace(/<[^>]*>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  private emptyResult(): RebuildResult {
    return {
      indexedCount: 0,
      removedCount: 0,
      failedCount: 0,
      durationMs: 0,
      rebuiltAt: new Date().toISOString(),
    };
  }
}