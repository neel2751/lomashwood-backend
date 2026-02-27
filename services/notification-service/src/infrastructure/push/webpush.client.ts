import webpush, { PushSubscription, SendResult } from 'web-push';
import { Logger } from 'winston';

export interface WebPushConfig {
  vapidPublicKey: string;
  vapidPrivateKey: string;
  subject: string;
  defaultTtl?: number;
}

export interface WebPushSubscription {
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
}

export interface WebPushSendRequest {
  subscription: WebPushSubscription;
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  imageUrl?: string;
  clickAction?: string;
  data?: Record<string, string>;
  ttl?: number;
  urgency?: 'very-low' | 'low' | 'normal' | 'high';
  topic?: string;
}

export interface WebPushSendResult {
  success: boolean;
  endpoint: string;
  statusCode?: number;
  errorCode?: string;
  errorMessage?: string;
}

export interface WebPushBulkSendResult {
  successCount: number;
  failureCount: number;
  expiredEndpoints: string[];
  results: WebPushSendResult[];
}

export class WebPushClient {
  private readonly defaultTtl: number;

  constructor(
    private readonly config: WebPushConfig,
    private readonly logger: Logger,
  ) {
    this.defaultTtl = config.defaultTtl ?? 86_400;

    webpush.setVapidDetails(
      config.subject,
      config.vapidPublicKey,
      config.vapidPrivateKey,
    );
  }

  // ---------------------------------------------------------------------------
  // Internal helpers
  // ---------------------------------------------------------------------------

  private buildPayload(req: WebPushSendRequest): string {
    return JSON.stringify({
      title: req.title,
      body: req.body,
      ...(req.icon && { icon: req.icon }),
      ...(req.badge && { badge: req.badge }),
      ...(req.imageUrl && { image: req.imageUrl }),
      data: {
        ...req.data,
        ...(req.clickAction && { url: req.clickAction }),
      },
    });
  }

  private buildOptions(req: WebPushSendRequest): webpush.RequestOptions {
    return {
      TTL: req.ttl ?? this.defaultTtl,
      urgency: req.urgency ?? 'normal',
      ...(req.topic && { topic: req.topic }),
    };
  }

  private isExpiredSubscription(statusCode: number): boolean {
    // 404 = endpoint gone, 410 = subscription explicitly unsubscribed
    return statusCode === 404 || statusCode === 410;
  }

  // ---------------------------------------------------------------------------
  // Public API
  // ---------------------------------------------------------------------------

  async send(req: WebPushSendRequest): Promise<WebPushSendResult> {
    const subscription: PushSubscription = {
      endpoint: req.subscription.endpoint,
      keys: {
        p256dh: req.subscription.keys.p256dh,
        auth: req.subscription.keys.auth,
      },
    };

    try {
      const result: SendResult = await webpush.sendNotification(
        subscription,
        this.buildPayload(req),
        this.buildOptions(req),
      );

      this.logger.info('WebPush sent', {
        endpoint: req.subscription.endpoint.slice(-20),
        statusCode: result.statusCode,
      });

      return {
        success: true,
        endpoint: req.subscription.endpoint,
        statusCode: result.statusCode,
      };
    } catch (err: unknown) {
      const error = err as { statusCode?: number; message?: string; body?: string };

      const expired = this.isExpiredSubscription(error.statusCode ?? 0);

      this.logger.warn('WebPush send failed', {
        endpoint: req.subscription.endpoint.slice(-20),
        statusCode: error.statusCode,
        expired,
        error: error.message,
      });

      return {
        success: false,
        endpoint: req.subscription.endpoint,
        statusCode: error.statusCode,
        errorCode: expired ? 'SUBSCRIPTION_EXPIRED' : 'SEND_FAILED',
        errorMessage: error.message,
      };
    }
  }

  async sendBulk(requests: WebPushSendRequest[]): Promise<WebPushBulkSendResult> {
    const CONCURRENCY = 10;
    const results: WebPushSendResult[] = [];

    for (let i = 0; i < requests.length; i += CONCURRENCY) {
      const chunk = requests.slice(i, i + CONCURRENCY);
      const chunkResults = await Promise.all(chunk.map((req) => this.send(req)));
      results.push(...chunkResults);
    }

    const expiredEndpoints = results
      .filter((r) => r.errorCode === 'SUBSCRIPTION_EXPIRED')
      .map((r) => r.endpoint);

    return {
      successCount: results.filter((r) => r.success).length,
      failureCount: results.filter((r) => !r.success).length,
      expiredEndpoints,
      results,
    };
  }

  getPublicKey(): string {
    return this.config.vapidPublicKey;
  }

  async isHealthy(): Promise<boolean> {
  
    try {
      const keys = webpush.generateVAPIDKeys();
      return typeof keys.publicKey === 'string';
    } catch {
      return false;
    }
  }
}