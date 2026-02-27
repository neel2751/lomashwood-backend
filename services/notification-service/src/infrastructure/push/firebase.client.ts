import * as admin from 'firebase-admin';
import { Logger } from 'winston';

export interface FirebaseConfig {
  serviceAccount: admin.ServiceAccount;
  projectId: string;
  appName?: string;
}

export interface FirebaseSendRequest {
  token: string;
  title: string;
  body: string;
  imageUrl?: string;
  icon?: string;
  clickAction?: string;
  data?: Record<string, string>;
  priority?: 'high' | 'normal';
  ttlSeconds?: number;
  collapseKey?: string;
  badge?: number;
  sound?: string;
}

export interface FirebaseSendResult {
  success: boolean;
  messageId?: string;
  token: string;
  errorCode?: string;
  errorMessage?: string;
}

export interface FirebaseBulkSendResult {
  successCount: number;
  failureCount: number;
  results: FirebaseSendResult[];
}

export class FirebaseClient {
  private readonly app: admin.app.App;
  private readonly messaging: admin.messaging.Messaging;

  constructor(
    private readonly config: FirebaseConfig,
    private readonly logger: Logger,
  ) {
    const appName = config.appName ?? 'lomash-notification';

    // Reuse existing app if already initialised (e.g. in test environments)
    this.app =
      admin.apps.find((a) => a?.name === appName) ??
      admin.initializeApp(
        {
          credential: admin.credential.cert(config.serviceAccount),
          projectId: config.projectId,
        },
        appName,
      );

    this.messaging = this.app.messaging();
  }

  // ---------------------------------------------------------------------------
  // Internal message builder
  // ---------------------------------------------------------------------------

  private buildMessage(req: FirebaseSendRequest): admin.messaging.Message {
    return {
      token: req.token,
      notification: {
        title: req.title,
        body: req.body,
        ...(req.imageUrl && { imageUrl: req.imageUrl }),
      },
      android: {
        priority: req.priority === 'high' ? 'high' : 'normal',
        ttl: req.ttlSeconds ? req.ttlSeconds * 1000 : 86_400_000,
        ...(req.collapseKey && { collapseKey: req.collapseKey }),
        notification: {
          sound: req.sound ?? 'default',
          ...(req.icon && { icon: req.icon }),
          ...(req.clickAction && { clickAction: req.clickAction }),
        },
      },
      apns: {
        headers: {
          'apns-priority': req.priority === 'high' ? '10' : '5',
          ...(req.ttlSeconds && {
            'apns-expiration': String(
              Math.floor(Date.now() / 1000) + req.ttlSeconds,
            ),
          }),
          ...(req.collapseKey && { 'apns-collapse-id': req.collapseKey }),
        },
        payload: {
          aps: {
            sound: req.sound ?? 'default',
            ...(req.badge !== undefined && { badge: req.badge }),
            ...(req.clickAction && { category: req.clickAction }),
          },
        },
      },
      webpush: {
        notification: {
          title: req.title,
          body: req.body,
          ...(req.icon && { icon: req.icon }),
          ...(req.imageUrl && { image: req.imageUrl }),
          ...(req.badge !== undefined && { badge: String(req.badge) }),
        },
        ...(req.clickAction && { fcmOptions: { link: req.clickAction } }),
      },
      ...(req.data && { data: req.data }),
    };
  }

  // ---------------------------------------------------------------------------
  // Public API
  // ---------------------------------------------------------------------------

  async send(req: FirebaseSendRequest): Promise<FirebaseSendResult> {
    try {
      const message = this.buildMessage(req);
      const messageId = await this.messaging.send(message);

      this.logger.info('Firebase push sent', {
        messageId,
        token: req.token.slice(-8),
      });

      return { success: true, messageId, token: req.token };
    } catch (err: unknown) {
      const error = err as { code?: string; message?: string };

      this.logger.error('Firebase push send failed', {
        error: error.message,
        code: error.code,
        token: req.token.slice(-8),
      });

      return {
        success: false,
        token: req.token,
        errorCode: error.code,
        errorMessage: error.message,
      };
    }
  }

  async sendBulk(requests: FirebaseSendRequest[]): Promise<FirebaseBulkSendResult> {
    const BATCH_SIZE = 500; // FCM multicast limit
    const results: FirebaseSendResult[] = [];

    for (let i = 0; i < requests.length; i += BATCH_SIZE) {
      const chunk = requests.slice(i, i + BATCH_SIZE);

      // Build a multicast message from the first request's common fields,
      // then map tokens — all messages in a bulk call share the same payload.
      const tokens = chunk.map((r) => r.token);
      const sample = chunk[0];

      const multicast: admin.messaging.MulticastMessage = {
        tokens,
        notification: {
          title: sample.title,
          body: sample.body,
          ...(sample.imageUrl && { imageUrl: sample.imageUrl }),
        },
        android: {
          priority: sample.priority === 'high' ? 'high' : 'normal',
          ttl: sample.ttlSeconds ? sample.ttlSeconds * 1000 : 86_400_000,
          ...(sample.collapseKey && { collapseKey: sample.collapseKey }),
        },
        apns: {
          headers: {
            'apns-priority': sample.priority === 'high' ? '10' : '5',
          },
        },
        ...(sample.data && { data: sample.data }),
      };

      try {
        const response = await this.messaging.sendEachForMulticast(multicast);

        response.responses.forEach((res, idx) => {
          results.push({
            token: chunk[idx].token,
            success: res.success,
            messageId: res.messageId,
            errorCode: res.error?.code,
            errorMessage: res.error?.message,
          });
        });

        this.logger.info('Firebase bulk send chunk complete', {
          successCount: response.successCount,
          failureCount: response.failureCount,
          chunkStart: i,
        });
      } catch (err: unknown) {
        const error = err as { message?: string };
        this.logger.error('Firebase bulk send chunk failed', {
          error: error.message,
          chunkStart: i,
        });

        chunk.forEach((req) => {
          results.push({
            token: req.token,
            success: false,
            errorCode: 'BATCH_FAILED',
            errorMessage: error.message,
          });
        });
      }
    }

    return {
      successCount: results.filter((r) => r.success).length,
      failureCount: results.filter((r) => !r.success).length,
      results,
    };
  }

  async isHealthy(): Promise<boolean> {
    try {
      // Sending to an intentionally invalid token returns a known
      // messaging/invalid-argument error — NOT a connectivity failure.
      // If the SDK call itself throws a network error the catch returns false.
      await this.messaging.send(
        { token: 'health-check-invalid-token', notification: { title: 'ping', body: 'ping' } },
        /* dryRun */ true,
      );
      return true;
    } catch (err: unknown) {
      const error = err as { code?: string };
      // A recognised FCM error code means FCM is reachable
      const fcmReachable =
        typeof error.code === 'string' && error.code.startsWith('messaging/');
      return fcmReachable;
    }
  }
}