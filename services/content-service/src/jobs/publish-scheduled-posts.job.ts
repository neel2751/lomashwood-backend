import { CronJob } from 'cron';
import { PrismaClient } from '@prisma/client';
import { createLogger } from '../config/logger';
import { buildTopicName } from '../config/messaging';
import { v4 as uuidv4 } from 'uuid';
import { PublishResult } from '../infrastructure/messaging/event-producer';

const log = createLogger('PublishScheduledPostsJob');



interface PublishResult {
  publishedCount: number;
  failedCount: number;
  skippedCount: number;
  processedAt: string;
  durationMs: number;
}

interface ScheduledPost {
  id: string;
  title: string;
  slug: string;
  scheduledAt: Date;
  authorId: string;
  category: string;
  tags: string[];
}



interface IEventProducer {
  publish(topic: string, payload: unknown): Promise<PublishResult>;
}





const BlogStatus = {
  DRAFT: 'DRAFT',
  SCHEDULED: 'SCHEDULED',
  PUBLISHED: 'PUBLISHED',
  ARCHIVED: 'ARCHIVED',
} as const;

type BlogStatus = (typeof BlogStatus)[keyof typeof BlogStatus];



export class PublishScheduledPostsJob {
  private readonly cronExpression = '*/5 * * * *'; 
  private job: CronJob | null = null;
  private isRunning = false;

  constructor(
    private readonly prisma: PrismaClient,
    private readonly eventProducer: IEventProducer,
  ) {}

  

  start(): void {
    this.job = new CronJob(
      this.cronExpression,
      () => void this.run(),
      null,
      true,
      'UTC',
    );

    log.info({ cron: this.cronExpression }, '[PublishScheduledPostsJob] Scheduled');
  }

  stop(): void {
    this.job?.stop();
    log.info('[PublishScheduledPostsJob] Stopped');
  }

  

  async run(): Promise<PublishResult> {
    if (this.isRunning) {
      log.warn('[PublishScheduledPostsJob] Already running — skipping this tick');
      return {
        publishedCount: 0,
        failedCount: 0,
        skippedCount: 0,
        processedAt: new Date().toISOString(),
        durationMs: 0,
      };
    }

    this.isRunning = true;
    const startedAt = Date.now();
    const now = new Date();

    log.info({ at: now.toISOString() }, '[PublishScheduledPostsJob] Starting scheduled post check');

    let publishedCount = 0;
    let failedCount = 0;
    let skippedCount = 0;

    try {
      const duePosts = await this.fetchDuePosts(now);

      if (duePosts.length === 0) {
        log.debug('[PublishScheduledPostsJob] No scheduled posts due — exiting');
        return {
          publishedCount: 0,
          failedCount: 0,
          skippedCount: 0,
          processedAt: now.toISOString(),
          durationMs: Date.now() - startedAt,
        };
      }

      log.info({ count: duePosts.length }, '[PublishScheduledPostsJob] Posts due for publishing');

      for (const post of duePosts) {
        try {
          await this.publishPost(post, now);
          publishedCount++;
        } catch (err) {
          const message = err instanceof Error ? err.message : String(err);
          log.error(
            { blogId: post.id, slug: post.slug, error: message },
            '[PublishScheduledPostsJob] Failed to publish post',
          );
          await this.markAsFailed(post.id, message);
          failedCount++;
        }
      }

      const result: PublishResult = {
        publishedCount,
        failedCount,
        skippedCount,
        processedAt: now.toISOString(),
        durationMs: Date.now() - startedAt,
      };

      log.info(result, '[PublishScheduledPostsJob] Completed');
      return result;
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      log.error({ error: message }, '[PublishScheduledPostsJob] Job run failed');
      throw err;
    } finally {
      this.isRunning = false;
    }
  }

  

  
  
  
  

  private async fetchDuePosts(now: Date): Promise<ScheduledPost[]> {
    return (this.prisma as any).blog.findMany({
      where: {
        status: BlogStatus.SCHEDULED,
        scheduledAt: { lte: now },
        deletedAt: null,
      },
      select: {
        id: true,
        title: true,
        slug: true,
        scheduledAt: true,
        authorId: true,
        category: true,
        tags: true,
      },
      orderBy: { scheduledAt: 'asc' },
      
      take: 50,
    });
  }

  private async publishPost(post: ScheduledPost, publishedAt: Date): Promise<void> {
    
    await (this.prisma as any).$transaction(async (tx: any) => {
      const updated = await tx.blog.updateMany({
        where: {
          id: post.id,
          
          status: BlogStatus.SCHEDULED,
          deletedAt: null,
        },
        data: {
          status: BlogStatus.PUBLISHED,
          publishedAt,
          scheduledAt: null,
          updatedAt: publishedAt,
        },
      });

      if (updated.count === 0) {
        
        log.warn({ blogId: post.id }, '[PublishScheduledPostsJob] Post already published by another instance');
        return;
      }

      log.info(
        { blogId: post.id, slug: post.slug, title: post.title },
        '[PublishScheduledPostsJob] Blog post published',
      );
    });

    
    await this.eventProducer.publish(
      buildTopicName('content.blog.published'),
      {
        eventId: uuidv4(),
        occurredAt: publishedAt.toISOString(),
        source: 'content-service',
        schemaVersion: '1.0',
        data: {
          blogId: post.id,
          slug: post.slug,
          title: post.title,
          authorId: post.authorId,
          publishedAt: publishedAt.toISOString(),
          tags: post.tags,
          category: post.category,
        },
      },
    );
  }

  private async markAsFailed(blogId: string, reason: string): Promise<void> {
    try {
      await (this.prisma as any).blog.update({
        where: { id: blogId },
        data: {
          status: BlogStatus.DRAFT,
          scheduledAt: null,
          publishFailReason: reason,
          updatedAt: new Date(),
        },
      });
    } catch (err) {
      log.error(
        { blogId, error: err instanceof Error ? err.message : String(err) },
        '[PublishScheduledPostsJob] Could not mark post as failed — manual review needed',
      );
    }
  }
}