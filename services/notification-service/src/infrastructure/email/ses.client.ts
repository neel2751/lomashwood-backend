import {
  SESClient,
  SendEmailCommand,
  SendEmailCommandInput,
  SendBulkTemplatedEmailCommand,
  GetSendQuotaCommand,
  GetSendStatisticsCommand,
} from '@aws-sdk/client-ses';
import { Logger } from 'winston';
import { EmailSendRequest, EmailSendResult } from './email.types';

export interface SESConfig {
  region: string;
  accessKeyId: string;
  secretAccessKey: string;
  from: string;
  configurationSetName?: string;
  maxSendRate?: number;
}

export interface SESSendQuota {
  max24HourSend: number;
  maxSendRate: number;
  sentLast24Hours: number;
}

export class SESClient_ {
  private readonly client: SESClient;
  private readonly from: string;
  private readonly configurationSetName?: string;

  constructor(
    private readonly config: SESConfig,
    private readonly logger: Logger,
  ) {
    this.from = config.from;
    this.configurationSetName = config.configurationSetName;

    this.client = new SESClient({
      region: config.region,
      credentials: {
        accessKeyId: config.accessKeyId,
        secretAccessKey: config.secretAccessKey,
      },
    });
  }

  async send(req: EmailSendRequest): Promise<EmailSendResult> {
    const toAddresses = Array.isArray(req.to) ? req.to : [req.to];
    const ccAddresses = req.cc ? (Array.isArray(req.cc) ? req.cc : [req.cc]) : undefined;
    const bccAddresses = req.bcc ? (Array.isArray(req.bcc) ? req.bcc : [req.bcc]) : undefined;

    const input: SendEmailCommandInput = {
      Source: req.from ?? this.from,
      Destination: {
        ToAddresses: toAddresses,
        ...(ccAddresses?.length && { CcAddresses: ccAddresses }),
        ...(bccAddresses?.length && { BccAddresses: bccAddresses }),
      },
      Message: {
        Subject: {
          Data: req.subject,
          Charset: 'UTF-8',
        },
        Body: {
          ...(req.htmlBody && {
            Html: { Data: req.htmlBody, Charset: 'UTF-8' },
          }),
          ...(req.textBody && {
            Text: { Data: req.textBody, Charset: 'UTF-8' },
          }),
        },
      },
      ...(req.replyTo && { ReplyToAddresses: [req.replyTo] }),
      ...(this.configurationSetName && {
        ConfigurationSetName: this.configurationSetName,
      }),
    };

    try {
      const command = new SendEmailCommand(input);
      const response = await this.client.send(command);

      this.logger.info('SES email sent', {
        messageId: response.MessageId,
        to: req.to,
        subject: req.subject,
      });

      return {
        success: true,
        messageId: response.MessageId,
        provider: 'ses',
      };
    } catch (err: unknown) {
      const error = err as { name?: string; message?: string; $fault?: string };
      this.logger.error('SES send failed', {
        error: error.message,
        fault: error.$fault,
        name: error.name,
        to: req.to,
        subject: req.subject,
      });

      return {
        success: false,
        provider: 'ses',
        errorCode: error.name,
        errorMessage: error.message,
      };
    }
  }

  async sendBulk(requests: EmailSendRequest[]): Promise<EmailSendResult[]> {
    // SES supports up to 50 destinations per call via SendBulkTemplatedEmail,
    // but for arbitrary HTML/text we fan-out individually with concurrency cap.
    const CONCURRENCY = 10;
    const results: EmailSendResult[] = [];

    for (let i = 0; i < requests.length; i += CONCURRENCY) {
      const chunk = requests.slice(i, i + CONCURRENCY);
      const chunkResults = await Promise.all(chunk.map((req) => this.send(req)));
      results.push(...chunkResults);
    }

    return results;
  }

  async getSendQuota(): Promise<SESSendQuota> {
    const command = new GetSendQuotaCommand({});
    const response = await this.client.send(command);

    return {
      max24HourSend: response.Max24HourSend ?? 0,
      maxSendRate: response.MaxSendRate ?? 0,
      sentLast24Hours: response.SentLast24Hours ?? 0,
    };
  }

  async getSendStatistics(): Promise<{ timestamp: Date; deliveryAttempts: number; bounces: number; complaints: number; rejects: number }[]> {
    const command = new GetSendStatisticsCommand({});
    const response = await this.client.send(command);

    return (response.SendDataPoints ?? []).map((dp) => ({
      timestamp: dp.Timestamp ?? new Date(),
      deliveryAttempts: dp.DeliveryAttempts ?? 0,
      bounces: dp.Bounces ?? 0,
      complaints: dp.Complaints ?? 0,
      rejects: dp.Rejects ?? 0,
    }));
  }

  async isHealthy(): Promise<boolean> {
    try {
      await this.getSendQuota();
      return true;
    } catch (err: unknown) {
      this.logger.warn('SES health check failed', { error: (err as Error).message });
      return false;
    }
  }
}