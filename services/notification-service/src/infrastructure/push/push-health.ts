import { Logger } from 'winston';
import { FirebaseClient } from './firebase.client';
import { WebPushClient } from './webpush.client';

export enum PushInfraProvider {
  FIREBASE = 'firebase',
  WEBPUSH = 'webpush',
}

export interface PushProviderHealth {
  provider: PushInfraProvider;
  healthy: boolean;
  latencyMs?: number;
  error?: string;
  checkedAt: Date;
}

export interface PushHealthReport {
  overall: boolean;
  activeProvider: PushInfraProvider;
  providers: PushProviderHealth[];
  checkedAt: Date;
}

export class PushHealthChecker {
  constructor(
    private readonly logger: Logger,
    private readonly firebaseClient?: FirebaseClient,
    private readonly webPushClient?: WebPushClient,
  ) {}

  async checkFirebase(): Promise<PushProviderHealth> {
    const start = Date.now();
    const result: PushProviderHealth = {
      provider: PushInfraProvider.FIREBASE,
      healthy: false,
      checkedAt: new Date(),
    };

    if (!this.firebaseClient) {
      result.error = 'Firebase client not configured';
      return result;
    }

    try {
      result.healthy = await this.firebaseClient.isHealthy();
      result.latencyMs = Date.now() - start;

      if (!result.healthy) {
        result.error = 'Firebase FCM unreachable or credentials invalid';
      }
    } catch (err: unknown) {
      result.healthy = false;
      result.latencyMs = Date.now() - start;
      result.error = (err as Error).message;
      this.logger.warn('Firebase health check threw', { error: result.error });
    }

    return result;
  }

  async checkWebPush(): Promise<PushProviderHealth> {
    const start = Date.now();
    const result: PushProviderHealth = {
      provider: PushInfraProvider.WEBPUSH,
      healthy: false,
      checkedAt: new Date(),
    };

    if (!this.webPushClient) {
      result.error = 'WebPush client not configured';
      return result;
    }

    try {
      result.healthy = await this.webPushClient.isHealthy();
      result.latencyMs = Date.now() - start;

      if (!result.healthy) {
        result.error = 'VAPID key validation failed';
      }
    } catch (err: unknown) {
      result.healthy = false;
      result.latencyMs = Date.now() - start;
      result.error = (err as Error).message;
      this.logger.warn('WebPush health check threw', { error: result.error });
    }

    return result;
  }

  async checkAll(activeProvider: PushInfraProvider): Promise<PushHealthReport> {
    const [firebaseHealth, webPushHealth] = await Promise.all([
      this.checkFirebase(),
      this.checkWebPush(),
    ]);

    const providers = [firebaseHealth, webPushHealth];

    const overall = providers.some(
      (p) => p.provider === activeProvider && p.healthy,
    );

    const report: PushHealthReport = {
      overall,
      activeProvider,
      providers,
      checkedAt: new Date(),
    };

    this.logger.info('Push health check completed', {
      overall,
      activeProvider,
      providers: providers.map((p) => ({
        provider: p.provider,
        healthy: p.healthy,
        latencyMs: p.latencyMs,
      })),
    });

    return report;
  }

  async isActiveProviderHealthy(activeProvider: PushInfraProvider): Promise<boolean> {
    try {
      if (activeProvider === PushInfraProvider.WEBPUSH) {
        const result = await this.checkWebPush();
        return result.healthy;
      }
      const result = await this.checkFirebase();
      return result.healthy;
    } catch {
      return false;
    }
  }
}