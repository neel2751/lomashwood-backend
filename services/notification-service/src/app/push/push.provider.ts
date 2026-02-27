import { Logger } from 'winston';
import { PushPayload, PushProvider, PushSendResult, BulkPushSendResult } from './push.types';
import { PushMapper } from './push.mapper';
import { PUSH_CONSTANTS, PUSH_ERRORS } from './push.constants';

export interface IPushProvider {
  send(token: string, payload: PushPayload): Promise<PushSendResult>;
  sendBulk(tokens: string[], payload: PushPayload): Promise<BulkPushSendResult>;
  isHealthy(): Promise<boolean>;
}

export class FirebasePushProvider implements IPushProvider {
  private readonly admin: typeof import('firebase-admin');
  private initialized = false;

  constructor(
    private readonly serviceAccount: Record<string, unknown>,
    private readonly projectId: string,
    private readonly logger: Logger,
  ) {}

  private getApp(): import('firebase-admin').app.App {
    if (!this.initialized) {
      const admin = require('firebase-admin');
      if (!admin.apps.length) {
        admin.initializeApp({
          credential: admin.credential.cert(this.serviceAccount as import('firebase-admin').ServiceAccount),
          projectId: this.projectId,
        });
      }
      this.admin = admin;
      this.initialized = true;
    }
    return this.admin.app();
  }

  async send(token: string, payload: PushPayload): Promise<PushSendResult> {
    try {
      const app = this.getApp();
      const message = PushMapper.toFirebaseMessage(token, payload);
      const response = await app.messaging().send(message as import('firebase-admin').messaging.Message);
      return PushMapper.toPushSendResult({
        token,
        success: true,
        messageId: response,
      });
    } catch (err: unknown) {
      const error = err as { code?: string; message?: string };
      this.logger.error('Firebase push send failed', { token, error: error.message });
      return PushMapper.toPushSendResult({
        token,
        success: false,
        errorCode: error.code ?? PUSH_ERRORS.SEND_FAILED,
        errorMessage: error.message,
      });
    }
  }

  async sendBulk(tokens: string[], payload: PushPayload): Promise<BulkPushSendResult> {
    const chunks: string[][] = [];
    for (let i = 0; i < tokens.length; i += PUSH_CONSTANTS.MAX_BATCH_SIZE) {
      chunks.push(tokens.slice(i, i + PUSH_CONSTANTS.MAX_BATCH_SIZE));
    }

    const allResults: PushSendResult[] = [];

    for (const chunk of chunks) {
      try {
        const app = this.getApp();
        const baseMessage = PushMapper.toFirebaseMessage('', payload);
        const multicastMessage = {
          ...baseMessage,
          tokens: chunk,
          token: undefined,
        };

        const response = await app.messaging().sendEachForMulticast(
          multicastMessage as import('firebase-admin').messaging.MulticastMessage,
        );

        response.responses.forEach((res, idx) => {
          allResults.push(
            PushMapper.toPushSendResult({
              token: chunk[idx],
              success: res.success,
              messageId: res.messageId,
              errorCode: res.error?.code,
              errorMessage: res.error?.message,
            }),
          );
        });
      } catch (err: unknown) {
        const error = err as { message?: string };
        this.logger.error('Firebase bulk push failed for chunk', { error: error.message });
        chunk.forEach((token) => {
          allResults.push(
            PushMapper.toPushSendResult({
              token,
              success: false,
              errorCode: PUSH_ERRORS.SEND_FAILED,
              errorMessage: error.message,
            }),
          );
        });
      }
    }

    return PushMapper.toBulkPushSendResult(allResults);
  }

  async isHealthy(): Promise<boolean> {
    try {
      this.getApp();
      return true;
    } catch {
      return false;
    }
  }
}

export class WebPushProvider implements IPushProvider {
  private webpush: typeof import('web-push');

  constructor(
    private readonly vapidPublicKey: string,
    private readonly vapidPrivateKey: string,
    private readonly subject: string,
    private readonly logger: Logger,
  ) {
    this.webpush = require('web-push');
    this.webpush.setVapidDetails(this.subject, this.vapidPublicKey, this.vapidPrivateKey);
  }

  async send(token: string, payload: PushPayload): Promise<PushSendResult> {
    try {
      const subscription = JSON.parse(token) as import('web-push').PushSubscription;
      const options = PushMapper.toWebPushOptions(payload);
      const payloadStr = PushMapper.toWebPushPayload(payload);

      await this.webpush.sendNotification(subscription, payloadStr, options);

      return PushMapper.toPushSendResult({
        token,
        success: true,
        messageId: `webpush_${Date.now()}`,
      });
    } catch (err: unknown) {
      const error = err as { statusCode?: number; message?: string };
      this.logger.error('WebPush send failed', { error: error.message });
      return PushMapper.toPushSendResult({
        token,
        success: false,
        errorCode: error.statusCode === 410 ? PUSH_ERRORS.TOKEN_NOT_REGISTERED : PUSH_ERRORS.SEND_FAILED,
        errorMessage: error.message,
      });
    }
  }

  async sendBulk(tokens: string[], payload: PushPayload): Promise<BulkPushSendResult> {
    const results = await Promise.allSettled(
      tokens.map((token) => this.send(token, payload)),
    );

    const pushResults: PushSendResult[] = results.map((result, idx) => {
      if (result.status === 'fulfilled') {
        return result.value;
      }
      return PushMapper.toPushSendResult({
        token: tokens[idx],
        success: false,
        errorCode: PUSH_ERRORS.SEND_FAILED,
        errorMessage: (result.reason as Error)?.message,
      });
    });

    return PushMapper.toBulkPushSendResult(pushResults);
  }

  async isHealthy(): Promise<boolean> {
    return true; // VAPID keys set at init; no live-check endpoint
  }
}

export class PushProviderFactory {
  static create(provider: PushProvider, config: {
    firebase?: { serviceAccount: Record<string, unknown>; projectId: string };
    webpush?: { vapidPublicKey: string; vapidPrivateKey: string; subject: string };
  }, logger: Logger): IPushProvider {
    switch (provider) {
      case PushProvider.FIREBASE:
        if (!config.firebase) throw new Error('Firebase config is required');
        return new FirebasePushProvider(
          config.firebase.serviceAccount,
          config.firebase.projectId,
          logger,
        );
      case PushProvider.WEBPUSH:
        if (!config.webpush) throw new Error('WebPush config is required');
        return new WebPushProvider(
          config.webpush.vapidPublicKey,
          config.webpush.vapidPrivateKey,
          config.webpush.subject,
          logger,
        );
      default:
        throw new Error(`Unknown push provider: ${provider}`);
    }
  }
}