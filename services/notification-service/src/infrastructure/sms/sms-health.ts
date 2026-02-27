import { Logger } from 'winston';
import { TwilioClient } from './twilio.client';
import { Msg91Client } from './msg91.client';

export enum SmsProvider {
  TWILIO = 'twilio',
  MSG91 = 'msg91',
}

export interface SmsProviderHealth {
  provider: SmsProvider;
  healthy: boolean;
  latencyMs?: number;
  error?: string;
  checkedAt: Date;
}

export interface SmsHealthReport {
  overall: boolean;
  activeProvider: SmsProvider;
  providers: SmsProviderHealth[];
  checkedAt: Date;
}

export class SmsHealthChecker {
  constructor(
    private readonly logger: Logger,
    private readonly twilioClient?: TwilioClient,
    private readonly msg91Client?: Msg91Client,
  ) {}

  async checkTwilio(): Promise<SmsProviderHealth> {
    const start = Date.now();
    const result: SmsProviderHealth = {
      provider: SmsProvider.TWILIO,
      healthy: false,
      checkedAt: new Date(),
    };

    if (!this.twilioClient) {
      result.error = 'Twilio client not configured';
      return result;
    }

    try {
      result.healthy = await this.twilioClient.isHealthy();
      result.latencyMs = Date.now() - start;

      if (!result.healthy) {
        result.error = 'Twilio account inactive or unreachable';
      }
    } catch (err: unknown) {
      result.healthy = false;
      result.latencyMs = Date.now() - start;
      result.error = (err as Error).message;
      this.logger.warn('Twilio health check threw', { error: result.error });
    }

    return result;
  }

  async checkMsg91(): Promise<SmsProviderHealth> {
    const start = Date.now();
    const result: SmsProviderHealth = {
      provider: SmsProvider.MSG91,
      healthy: false,
      checkedAt: new Date(),
    };

    if (!this.msg91Client) {
      result.error = 'MSG91 client not configured';
      return result;
    }

    try {
      result.healthy = await this.msg91Client.isHealthy();
      result.latencyMs = Date.now() - start;

      if (!result.healthy) {
        result.error = 'MSG91 balance endpoint returned non-success';
      }
    } catch (err: unknown) {
      result.healthy = false;
      result.latencyMs = Date.now() - start;
      result.error = (err as Error).message;
      this.logger.warn('MSG91 health check threw', { error: result.error });
    }

    return result;
  }

  async checkAll(activeProvider: SmsProvider): Promise<SmsHealthReport> {
    const [twilioHealth, msg91Health] = await Promise.all([
      this.checkTwilio(),
      this.checkMsg91(),
    ]);

    const providers = [twilioHealth, msg91Health];

    const overall = providers.some(
      (p) => p.provider === activeProvider && p.healthy,
    );

    const report: SmsHealthReport = {
      overall,
      activeProvider,
      providers,
      checkedAt: new Date(),
    };

    this.logger.info('SMS health check completed', {
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

  async isActiveProviderHealthy(activeProvider: SmsProvider): Promise<boolean> {
    try {
      if (activeProvider === SmsProvider.MSG91) {
        const result = await this.checkMsg91();
        return result.healthy;
      }
      const result = await this.checkTwilio();
      return result.healthy;
    } catch {
      return false;
    }
  }
}