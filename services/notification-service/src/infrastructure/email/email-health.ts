import { Logger } from 'winston';
import { NodemailerClient } from './nodemailer.client';
import { SESClient_ } from './ses.client';

export enum EmailProvider {
  NODEMAILER = 'nodemailer',
  SES = 'ses',
}

export interface EmailProviderHealth {
  provider: EmailProvider;
  healthy: boolean;
  latencyMs?: number;
  error?: string;
  checkedAt: Date;
}

export interface EmailHealthReport {
  overall: boolean;
  activeProvider: EmailProvider;
  providers: EmailProviderHealth[];
  checkedAt: Date;
}

export class EmailHealthChecker {
  constructor(
    private readonly logger: Logger,
    private readonly nodemailerClient?: NodemailerClient,
    private readonly sesClient?: SESClient_,
  ) {}

  async checkNodemailer(): Promise<EmailProviderHealth> {
    const start = Date.now();
    const result: EmailProviderHealth = {
      provider: EmailProvider.NODEMAILER,
      healthy: false,
      checkedAt: new Date(),
    };

    if (!this.nodemailerClient) {
      result.error = 'Nodemailer client not configured';
      return result;
    }

    try {
      const healthy = await this.nodemailerClient.verify();
      result.healthy = healthy;
      result.latencyMs = Date.now() - start;

      if (!healthy) {
        result.error = 'SMTP verification failed';
      }
    } catch (err: unknown) {
      result.healthy = false;
      result.latencyMs = Date.now() - start;
      result.error = (err as Error).message;
      this.logger.warn('Nodemailer health check threw', { error: result.error });
    }

    return result;
  }

  async checkSES(): Promise<EmailProviderHealth> {
    const start = Date.now();
    const result: EmailProviderHealth = {
      provider: EmailProvider.SES,
      healthy: false,
      checkedAt: new Date(),
    };

    if (!this.sesClient) {
      result.error = 'SES client not configured';
      return result;
    }

    try {
      const healthy = await this.sesClient.isHealthy();
      result.healthy = healthy;
      result.latencyMs = Date.now() - start;

      if (!healthy) {
        result.error = 'SES GetSendQuota failed';
      }
    } catch (err: unknown) {
      result.healthy = false;
      result.latencyMs = Date.now() - start;
      result.error = (err as Error).message;
      this.logger.warn('SES health check threw', { error: result.error });
    }

    return result;
  }

  async checkAll(activeProvider: EmailProvider): Promise<EmailHealthReport> {
    const checks = await Promise.all([
      this.checkNodemailer(),
      this.checkSES(),
    ]);

    const overall = checks.some(
      (c) => c.provider === activeProvider && c.healthy,
    );

    const report: EmailHealthReport = {
      overall,
      activeProvider,
      providers: checks,
      checkedAt: new Date(),
    };

    this.logger.info('Email health check completed', {
      overall,
      activeProvider,
      providers: checks.map((c) => ({
        provider: c.provider,
        healthy: c.healthy,
        latencyMs: c.latencyMs,
      })),
    });

    return report;
  }

  async isActiveProviderHealthy(activeProvider: EmailProvider): Promise<boolean> {
    try {
      if (activeProvider === EmailProvider.SES) {
        const result = await this.checkSES();
        return result.healthy;
      }
      const result = await this.checkNodemailer();
      return result.healthy;
    } catch {
      return false;
    }
  }
}