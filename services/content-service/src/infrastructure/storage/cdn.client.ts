/**
 * content-service/src/infrastructure/storage/cdn.client.ts
 *
 * CDN client for the Content Service.
 * Handles:
 *   - CloudFront cache invalidations on content updates
 *   - Cloudflare purge (optional fallback)
 *   - Cache warming for critical content
 *   - URL transformations and optimization hints
 */

import {
  CloudFrontClient,
  CreateInvalidationCommand,
  GetInvalidationCommand,
  ListInvalidationsCommand,
  type CreateInvalidationCommandInput,
} from '@aws-sdk/client-cloudfront';
import { logger } from '../../config/logger';
import { envConfig } from '../../config/env';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
export interface InvalidationResult {
  id: string;
  status: 'InProgress' | 'Completed';
  createTime: Date;
  paths: string[];
}

export interface InvalidationOptions {
  paths: string[];
  callerReference?: string;
}

export interface CacheWarmOptions {
  urls: string[];
  priority?: 'high' | 'normal' | 'low';
}

export type CDNProvider = 'cloudfront' | 'cloudflare';

// ---------------------------------------------------------------------------
// CloudFront CDN Client
// ---------------------------------------------------------------------------
class CloudFrontCDNClient {
  private readonly client: CloudFrontClient;
  private readonly distributionId: string;
  private readonly enabled: boolean;

  constructor() {
    this.distributionId = envConfig.storage.cdnDistributionId ?? '';
    this.enabled = !!this.distributionId && envConfig.storage.cdnEnabled;

    if (this.enabled) {
      this.client = new CloudFrontClient({
        region: envConfig.storage.s3Region,
        credentials: {
          accessKeyId: envConfig.storage.s3AccessKeyId,
          secretAccessKey: envConfig.storage.s3SecretAccessKey,
        },
        maxAttempts: 3,
      });

      logger.info({
        context: 'CloudFrontCDNClient',
        distributionId: this.distributionId,
        enabled: true,
      });
    } else {
      logger.warn({
        context: 'CloudFrontCDNClient',
        message: 'CDN invalidation disabled (missing distribution ID)',
      });
    }
  }

  // -------------------------------------------------------------------------
  // Create invalidation for specific paths
  // -------------------------------------------------------------------------
  async invalidate(options: InvalidationOptions): Promise<InvalidationResult> {
    if (!this.enabled) {
      logger.warn({
        context: 'CDNInvalidate',
        message: 'CDN disabled - skipping invalidation',
        paths: options.paths,
      });
      return {
        id: 'disabled',
        status: 'Completed',
        createTime: new Date(),
        paths: options.paths,
      };
    }

    const callerReference =
      options.callerReference ?? `content-service-${Date.now()}`;

    const params: CreateInvalidationCommandInput = {
      DistributionId: this.distributionId,
      InvalidationBatch: {
        CallerReference: callerReference,
        Paths: {
          Quantity: options.paths.length,
          Items: options.paths,
        },
      },
    };

    try {
      const response = await this.client.send(
        new CreateInvalidationCommand(params),
      );

      const result: InvalidationResult = {
        id: response.Invalidation?.Id ?? 'unknown',
        status: response.Invalidation?.Status as 'InProgress' | 'Completed',
        createTime: response.Invalidation?.CreateTime ?? new Date(),
        paths: options.paths,
      };

      logger.info({
        context: 'CDNInvalidate',
        invalidationId: result.id,
        pathCount: options.paths.length,
        status: result.status,
      });

      return result;
    } catch (error) {
      logger.error({
        context: 'CDNInvalidate',
        error,
        paths: options.paths,
      });
      throw new Error(`CDN invalidation failed: ${(error as Error).message}`);
    }
  }

  // -------------------------------------------------------------------------
  // Invalidate single path (convenience)
  // -------------------------------------------------------------------------
  async invalidatePath(path: string): Promise<InvalidationResult> {
    return this.invalidate({ paths: [path] });
  }

  // -------------------------------------------------------------------------
  // Invalidate multiple paths (batch)
  // -------------------------------------------------------------------------
  async invalidatePaths(paths: string[]): Promise<InvalidationResult> {
    return this.invalidate({ paths });
  }

  // -------------------------------------------------------------------------
  // Invalidate entire distribution (wildcard)
  // -------------------------------------------------------------------------
  async invalidateAll(): Promise<InvalidationResult> {
    return this.invalidate({ paths: ['/*'] });
  }

  // -------------------------------------------------------------------------
  // Get invalidation status
  // -------------------------------------------------------------------------
  async getInvalidationStatus(invalidationId: string): Promise<string> {
    if (!this.enabled) {
      return 'Completed';
    }

    try {
      const response = await this.client.send(
        new GetInvalidationCommand({
          DistributionId: this.distributionId,
          Id: invalidationId,
        }),
      );

      const status = response.Invalidation?.Status ?? 'Unknown';

      logger.debug({
        context: 'CDNInvalidationStatus',
        invalidationId,
        status,
      });

      return status;
    } catch (error) {
      logger.error({
        context: 'CDNInvalidationStatus',
        error,
        invalidationId,
      });
      throw new Error(`Failed to get invalidation status: ${(error as Error).message}`);
    }
  }

  // -------------------------------------------------------------------------
  // List recent invalidations
  // -------------------------------------------------------------------------
  async listInvalidations(maxItems = 10): Promise<InvalidationResult[]> {
    if (!this.enabled) {
      return [];
    }

    try {
      const response = await this.client.send(
        new ListInvalidationsCommand({
          DistributionId: this.distributionId,
          MaxItems: maxItems.toString(),
        }),
      );

      const items =
        response.InvalidationList?.Items?.map((item) => ({
          id: item.Id ?? 'unknown',
          status: item.Status as 'InProgress' | 'Completed',
          createTime: item.CreateTime ?? new Date(),
          paths: [], // Not included in list response
        })) ?? [];

      logger.debug({
        context: 'CDNListInvalidations',
        count: items.length,
      });

      return items;
    } catch (error) {
      logger.error({
        context: 'CDNListInvalidations',
        error,
      });
      throw new Error(`Failed to list invalidations: ${(error as Error).message}`);
    }
  }

  // -------------------------------------------------------------------------
  // Cache warming - preload critical content
  // -------------------------------------------------------------------------
  async warmCache(options: CacheWarmOptions): Promise<void> {
    if (!this.enabled) {
      logger.warn({
        context: 'CDNCacheWarm',
        message: 'CDN disabled - skipping cache warming',
      });
      return;
    }

    const { urls, priority = 'normal' } = options;

    logger.info({
      context: 'CDNCacheWarm',
      urlCount: urls.length,
      priority,
    });

    // Warm cache by making HEAD requests to each URL
    const requests = urls.map(async (url) => {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000);

        await fetch(url, {
          method: 'HEAD',
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        logger.debug({
          context: 'CDNCacheWarm',
          url,
          status: 'warmed',
        });
      } catch (error) {
        logger.warn({
          context: 'CDNCacheWarm',
          url,
          error: (error as Error).message,
        });
      }
    });

    await Promise.allSettled(requests);

    logger.info({
      context: 'CDNCacheWarm',
      message: 'Cache warming completed',
      urlCount: urls.length,
    });
  }

  // -------------------------------------------------------------------------
  // Health check
  // -------------------------------------------------------------------------
  async healthCheck(): Promise<boolean> {
    if (!this.enabled) {
      return true; // Not enabled, nothing to check
    }

    try {
      await this.listInvalidations(1);
      return true;
    } catch (error) {
      logger.error({ context: 'CDNHealthCheck', error });
      return false;
    }
  }
}

// ---------------------------------------------------------------------------
// Cloudflare CDN Client (alternative/fallback)
// ---------------------------------------------------------------------------
class CloudflareCDNClient {
  private readonly zoneId: string;
  private readonly apiToken: string;
  private readonly enabled: boolean;

  constructor() {
    this.zoneId = envConfig.storage.cloudflareZoneId ?? '';
    this.apiToken = envConfig.storage.cloudflareApiToken ?? '';
    this.enabled = !!this.zoneId && !!this.apiToken;

    if (this.enabled) {
      logger.info({
        context: 'CloudflareCDNClient',
        zoneId: this.zoneId,
        enabled: true,
      });
    } else {
      logger.warn({
        context: 'CloudflareCDNClient',
        message: 'Cloudflare CDN disabled (missing credentials)',
      });
    }
  }

  // -------------------------------------------------------------------------
  // Purge cache by URLs
  // -------------------------------------------------------------------------
  async purgeUrls(urls: string[]): Promise<void> {
    if (!this.enabled) {
      logger.warn({
        context: 'CloudflarePurge',
        message: 'Cloudflare disabled - skipping purge',
      });
      return;
    }

    try {
      const response = await fetch(
        `https://api.cloudflare.com/client/v4/zones/${this.zoneId}/purge_cache`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${this.apiToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ files: urls }),
        },
      );

      if (!response.ok) {
        throw new Error(`Cloudflare API error: ${response.statusText}`);
      }

      const data = await response.json();

      logger.info({
        context: 'CloudflarePurge',
        urlCount: urls.length,
        success: data.success,
      });
    } catch (error) {
      logger.error({
        context: 'CloudflarePurge',
        error,
        urls,
      });
      throw new Error(`Cloudflare purge failed: ${(error as Error).message}`);
    }
  }

  // -------------------------------------------------------------------------
  // Purge everything
  // -------------------------------------------------------------------------
  async purgeAll(): Promise<void> {
    if (!this.enabled) {
      logger.warn({
        context: 'CloudflarePurgeAll',
        message: 'Cloudflare disabled - skipping purge',
      });
      return;
    }

    try {
      const response = await fetch(
        `https://api.cloudflare.com/client/v4/zones/${this.zoneId}/purge_cache`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${this.apiToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ purge_everything: true }),
        },
      );

      if (!response.ok) {
        throw new Error(`Cloudflare API error: ${response.statusText}`);
      }

      logger.info({
        context: 'CloudflarePurgeAll',
        message: 'Full cache purge completed',
      });
    } catch (error) {
      logger.error({
        context: 'CloudflarePurgeAll',
        error,
      });
      throw new Error(`Cloudflare purge all failed: ${(error as Error).message}`);
    }
  }
}

// ---------------------------------------------------------------------------
// Unified CDN Client (auto-selects provider)
// ---------------------------------------------------------------------------
class UnifiedCDNClient {
  private readonly cloudfront: CloudFrontCDNClient;
  private readonly cloudflare: CloudflareCDNClient;
  private readonly provider: CDNProvider;

  constructor() {
    this.cloudfront = new CloudFrontCDNClient();
    this.cloudflare = new CloudflareCDNClient();
    this.provider = (envConfig.storage.cdnProvider ?? 'cloudfront') as CDNProvider;

    logger.info({
      context: 'UnifiedCDNClient',
      provider: this.provider,
    });
  }

  async invalidatePaths(paths: string[]): Promise<void> {
    if (this.provider === 'cloudfront') {
      await this.cloudfront.invalidatePaths(paths);
    } else {
      // Convert paths to full URLs for Cloudflare
      const baseUrl = envConfig.storage.cdnDomain ?? '';
      const urls = paths.map((path) => `${baseUrl}${path}`);
      await this.cloudflare.purgeUrls(urls);
    }
  }

  async invalidateAll(): Promise<void> {
    if (this.provider === 'cloudfront') {
      await this.cloudfront.invalidateAll();
    } else {
      await this.cloudflare.purgeAll();
    }
  }

  async warmCache(urls: string[]): Promise<void> {
    await this.cloudfront.warmCache({ urls });
  }

  async healthCheck(): Promise<boolean> {
    if (this.provider === 'cloudfront') {
      return this.cloudfront.healthCheck();
    }
    return true; // Cloudflare doesn't need health check
  }
}

// ---------------------------------------------------------------------------
// Export singleton instance
// ---------------------------------------------------------------------------
export const cdnClient = new UnifiedCDNClient();
export const cloudfrontClient = new CloudFrontCDNClient();
export const cloudflareClient = new CloudflareCDNClient();