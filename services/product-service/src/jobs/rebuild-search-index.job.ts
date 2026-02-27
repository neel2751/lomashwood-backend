import cron from 'node-cron';
import { prismaClient } from '../infrastructure/db/prisma.client';
import { redisClient } from '../infrastructure/cache/redis.client';
import { logger } from '../config/logger';
import { config } from '../config';

interface RebuildIndexResult {
  totalProducts: number;
  indexed: number;
  skipped: number;
  errors: number;
  duration: number;
}

interface SearchDocument {
  id: string;
  title: string;
  description: string;
  category: string;
  categoryId: string;
  price: number;
  colours: string[];
  styles: string[];
  finishes: string[];
  ranges: string[];
  isActive: boolean;
  stockLevel: number;
  createdAt: string;
  updatedAt: string;
}

export class RebuildSearchIndexJob {
  private cronExpression: string = '0 4 * * *';
  private isRunning: boolean = false;
  private lastRun: Date | null = null;
  private task: cron.ScheduledTask | null = null;
  private batchSize: number = 100;

  constructor(cronExpression?: string, batchSize?: number) {
    if (cronExpression) {
      this.cronExpression = cronExpression;
    }
    if (batchSize) {
      this.batchSize = batchSize;
    }
  }

  public start(): void {
    if (this.task) {
      logger.warn('Rebuild search index job is already running');
      return;
    }

    this.task = cron.schedule(this.cronExpression, async () => {
      await this.execute();
    });

    logger.info('Rebuild search index job scheduled', {
      cronExpression: this.cronExpression,
      batchSize: this.batchSize,
    });
  }

  public stop(): void {
    if (this.task) {
      this.task.stop();
      this.task = null;
      logger.info('Rebuild search index job stopped');
    }
  }

  public async execute(): Promise<RebuildIndexResult> {
    if (this.isRunning) {
      logger.warn('Rebuild search index job is already running, skipping this execution');
      return this.createEmptyResult();
    }

    this.isRunning = true;
    const startTime = Date.now();

    logger.info('Starting rebuild search index job');

    try {
      const result = await this.rebuildSearchIndex();
      
      this.lastRun = new Date();
      const duration = Date.now() - startTime;

      logger.info('Rebuild search index job completed', {
        ...result,
        duration,
      });

      return { ...result, duration };
    } catch (error) {
      logger.error('Rebuild search index job failed', {
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
      });
      throw error;
    } finally {
      this.isRunning = false;
    }
  }

  private async rebuildSearchIndex(): Promise<Omit<RebuildIndexResult, 'duration'>> {
    const result: Omit<RebuildIndexResult, 'duration'> = {
      totalProducts: 0,
      indexed: 0,
      skipped: 0,
      errors: 0,
    };

    try {
      const totalCount = await prismaClient.product.count({
        where: { deletedAt: null },
      });

      result.totalProducts = totalCount;

      if (totalCount === 0) {
        logger.info('No products to index');
        return result;
      }

      await this.clearExistingIndex();

      const batchCount = Math.ceil(totalCount / this.batchSize);
      logger.info('Processing products in batches', {
        totalProducts: totalCount,
        batchSize: this.batchSize,
        batchCount,
      });

      for (let i = 0; i < batchCount; i++) {
        const skip = i * this.batchSize;
        await this.processBatch(skip, result);
      }

      await this.buildSearchMetadata();
      await this.generateIndexReport(result);

      return result;
    } catch (error) {
      logger.error('Failed to rebuild search index', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }

  private async clearExistingIndex(): Promise<void> {
    try {
      const pattern = 'search:product:*';
      const keys = await redisClient.keys(pattern);

      if (keys.length > 0) {
        await redisClient.del(keys);
        logger.info('Cleared existing search index', { keysDeleted: keys.length });
      }

      await redisClient.del('search:metadata');
      await redisClient.del('search:categories');
      await redisClient.del('search:colours');
      await redisClient.del('search:styles');
      await redisClient.del('search:finishes');
      await redisClient.del('search:ranges');
    } catch (error) {
      logger.error('Failed to clear existing index', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }

  private async processBatch(
    skip: number,
    result: Omit<RebuildIndexResult, 'duration'>
  ): Promise<void> {
    try {
      const products = await prismaClient.product.findMany({
        where: { deletedAt: null },
        include: {
          category: true,
          inventory: true,
          colours: {
            include: {
              colour: true,
            },
          },
          sizes: true,
        },
        skip,
        take: this.batchSize,
      });

      for (const product of products) {
        try {
          await this.indexProduct(product);
          result.indexed++;
        } catch (error) {
          result.errors++;
          logger.error('Failed to index product', {
            productId: product.id,
            error: error instanceof Error ? error.message : 'Unknown error',
          });
        }
      }

      logger.debug('Batch processed', {
        skip,
        count: products.length,
        indexed: result.indexed,
      });
    } catch (error) {
      logger.error('Failed to process batch', {
        skip,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }

  private async indexProduct(product: any): Promise<void> {
    const searchDoc: SearchDocument = {
      id: product.id,
      title: product.title,
      description: product.description || '',
      category: product.category?.name || 'Uncategorized',
      categoryId: product.categoryId || '',
      price: product.price,
      colours: product.colours?.map((pc: any) => pc.colour.name) || [],
      styles: product.styles || [],
      finishes: product.finishes || [],
      ranges: product.rangeName ? [product.rangeName] : [],
      isActive: product.isActive,
      stockLevel: product.inventory?.availableStock || 0,
      createdAt: product.createdAt.toISOString(),
      updatedAt: product.updatedAt.toISOString(),
    };

    await redisClient.setEx(
      `search:product:${product.id}`,
      7 * 24 * 60 * 60,
      JSON.stringify(searchDoc)
    );

    await this.indexProductTerms(product.id, searchDoc);
  }

  private async indexProductTerms(productId: string, doc: SearchDocument): Promise<void> {
    const terms = this.extractSearchTerms(doc);

    for (const term of terms) {
      const normalizedTerm = this.normalizeTerm(term);
      const key = `search:term:${normalizedTerm}`;

      await redisClient.sAdd(key, productId);
      await redisClient.expire(key, 7 * 24 * 60 * 60);
    }
  }

  private extractSearchTerms(doc: SearchDocument): string[] {
    const terms: Set<string> = new Set();

    const titleWords = doc.title.toLowerCase().split(/\s+/);
    titleWords.forEach(word => terms.add(word));

    const descWords = doc.description.toLowerCase().split(/\s+/);
    descWords.forEach(word => {
      if (word.length >= 3) {
        terms.add(word);
      }
    });

    terms.add(doc.category.toLowerCase());

    doc.colours.forEach(colour => terms.add(colour.toLowerCase()));
    doc.styles.forEach(style => terms.add(style.toLowerCase()));
    doc.finishes.forEach(finish => terms.add(finish.toLowerCase()));
    doc.ranges.forEach(range => terms.add(range.toLowerCase()));

    const priceRange = this.getPriceRange(doc.price);
    terms.add(priceRange);

    if (doc.stockLevel > 0) {
      terms.add('in-stock');
    } else {
      terms.add('out-of-stock');
    }

    return Array.from(terms).filter(term => term.length > 0);
  }

  private normalizeTerm(term: string): string {
    return term
      .toLowerCase()
      .replace(/[^a-z0-9-]/g, '')
      .trim();
  }

  private getPriceRange(price: number): string {
    if (price < 500) return 'budget';
    if (price < 1000) return 'mid-range';
    if (price < 2000) return 'premium';
    return 'luxury';
  }

  private async buildSearchMetadata(): Promise<void> {
    try {
      const [categories, colours, styles, finishes, ranges] = await Promise.all([
        this.getUniqueValues('category'),
        this.getUniqueValues('colours'),
        this.getUniqueValues('styles'),
        this.getUniqueValues('finishes'),
        this.getUniqueValues('ranges'),
      ]);

      const metadata = {
        totalProducts: await this.getTotalIndexedProducts(),
        lastRebuild: new Date().toISOString(),
        categories: categories.length,
        colours: colours.length,
        styles: styles.length,
        finishes: finishes.length,
        ranges: ranges.length,
      };

      await redisClient.setEx(
        'search:metadata',
        7 * 24 * 60 * 60,
        JSON.stringify(metadata)
      );

      await redisClient.setEx(
        'search:categories',
        7 * 24 * 60 * 60,
        JSON.stringify(categories)
      );

      await redisClient.setEx(
        'search:colours',
        7 * 24 * 60 * 60,
        JSON.stringify(colours)
      );

      await redisClient.setEx(
        'search:styles',
        7 * 24 * 60 * 60,
        JSON.stringify(styles)
      );

      await redisClient.setEx(
        'search:finishes',
        7 * 24 * 60 * 60,
        JSON.stringify(finishes)
      );

      await redisClient.setEx(
        'search:ranges',
        7 * 24 * 60 * 60,
        JSON.stringify(ranges)
      );

      logger.info('Search metadata built', metadata);
    } catch (error) {
      logger.error('Failed to build search metadata', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  private async getUniqueValues(field: string): Promise<string[]> {
    try {
      const pattern = 'search:product:*';
      const keys = await redisClient.keys(pattern);
      const values = new Set<string>();

      for (const key of keys) {
        const doc = await redisClient.get(key);
        if (doc) {
          const parsed = JSON.parse(doc);
          if (Array.isArray(parsed[field])) {
            parsed[field].forEach((v: string) => values.add(v));
          } else if (parsed[field]) {
            values.add(parsed[field]);
          }
        }
      }

      return Array.from(values).sort();
    } catch (error) {
      logger.error(`Failed to get unique values for ${field}`, {
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      return [];
    }
  }

  private async getTotalIndexedProducts(): Promise<number> {
    try {
      const pattern = 'search:product:*';
      const keys = await redisClient.keys(pattern);
      return keys.length;
    } catch (error) {
      logger.error('Failed to get total indexed products', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      return 0;
    }
  }

  private async generateIndexReport(result: Omit<RebuildIndexResult, 'duration'>): Promise<void> {
    try {
      const report = {
        timestamp: new Date().toISOString(),
        ...result,
        indexSize: await this.getTotalIndexedProducts(),
      };

      await redisClient.setEx(
        `search:rebuild-report:${Date.now()}`,
        30 * 24 * 60 * 60,
        JSON.stringify(report)
      );

      logger.info('Search index rebuild report generated', report);
    } catch (error) {
      logger.error('Failed to generate index report', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  private createEmptyResult(): RebuildIndexResult {
    return {
      totalProducts: 0,
      indexed: 0,
      skipped: 0,
      errors: 0,
      duration: 0,
    };
  }

  public getLastRun(): Date | null {
    return this.lastRun;
  }

  public isJobRunning(): boolean {
    return this.isRunning;
  }

  public getCronExpression(): string {
    return this.cronExpression;
  }

  public getBatchSize(): number {
    return this.batchSize;
  }

  public setBatchSize(size: number): void {
    this.batchSize = Math.max(10, Math.min(1000, size));
    logger.info('Search index batch size updated', { batchSize: this.batchSize });
  }
}

export const rebuildSearchIndexJob = new RebuildSearchIndexJob();

export function startRebuildSearchIndexJob(): void {
  if (config.features.elasticSearch) {
    rebuildSearchIndexJob.start();
    logger.info('Rebuild search index job started');
  } else {
    logger.info('Search indexing is disabled, job not started');
  }
}

export function stopRebuildSearchIndexJob(): void {
  rebuildSearchIndexJob.stop();
  logger.info('Rebuild search index job stopped');
}

export async function runRebuildSearchIndexJobNow(): Promise<RebuildIndexResult> {
  logger.info('Running rebuild search index job manually');
  return await rebuildSearchIndexJob.execute();
}