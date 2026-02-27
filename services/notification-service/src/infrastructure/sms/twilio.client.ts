import Twilio from 'twilio';
import { Logger } from 'winston';

export interface TwilioConfig {
  accountSid: string;
  authToken: string;
  from: string;
  statusCallbackUrl?: string;
  maxRetries?: number;
  messagingServiceSid?: string;
}

export interface TwilioSmsSendRequest {
  to: string;
  body: string;
  from?: string;
  callbackUrl?: string;
  scheduledAt?: Date;
}

export interface TwilioSmsSendResult {
  success: boolean;
  messageId?: string;
  provider: 'twilio';
  status?: string;
  errorCode?: string;
  errorMessage?: string;
}

export interface TwilioSmsBulkSendResult {
  successCount: number;
  failureCount: number;
  results: TwilioSmsSendResult[];
}

export class TwilioClient {
  private readonly client: Twilio.Twilio;
  private readonly from: string;
  private readonly messagingServiceSid?: string;
  private readonly statusCallbackUrl?: string;
  private readonly maxRetries: number;

  constructor(
    private readonly config: TwilioConfig,
    private readonly logger: Logger,
  ) {
    this.client = Twilio(config.accountSid, config.authToken);
    this.from = config.from;
    this.messagingServiceSid = config.messagingServiceSid;
    this.statusCallbackUrl = config.statusCallbackUrl;
    this.maxRetries = config.maxRetries ?? 2;
  }

  async send(req: TwilioSmsSendRequest, attempt = 0): Promise<TwilioSmsSendResult> {
    try {
      const message = await this.client.messages.create({
        to: req.to,
        body: req.body,
        ...(this.messagingServiceSid
          ? { messagingServiceSid: this.messagingServiceSid }
          : { from: req.from ?? this.from }),
        ...(this.statusCallbackUrl && {
          statusCallback: req.callbackUrl ?? this.statusCallbackUrl,
        }),
        ...(req.scheduledAt && {
          scheduleType: 'fixed',
          sendAt: req.scheduledAt.toISOString(),
        }),
      });

      this.logger.info('Twilio SMS sent', {
        messageId: message.sid,
        to: req.to,
        status: message.status,
      });

      return {
        success: true,
        messageId: message.sid,
        provider: 'twilio',
        status: message.status,
      };
    } catch (err: unknown) {
      const error = err as { code?: number; message?: string; status?: number };

      const isRetryable =
        attempt < this.maxRetries &&
        error.status !== undefined &&
        error.status >= 500;

      if (isRetryable) {
        const delay = Math.pow(2, attempt) * 500;
        await new Promise((resolve) => setTimeout(resolve, delay));
        return this.send(req, attempt + 1);
      }

      this.logger.error('Twilio SMS send failed', {
        error: error.message,
        code: error.code,
        to: req.to,
        attempt,
      });

      return {
        success: false,
        provider: 'twilio',
        errorCode: String(error.code ?? 'UNKNOWN'),
        errorMessage: error.message,
      };
    }
  }

  async sendBulk(requests: TwilioSmsSendRequest[]): Promise<TwilioSmsBulkSendResult> {
    const CONCURRENCY = 5;
    const results: TwilioSmsSendResult[] = [];

    for (let i = 0; i < requests.length; i += CONCURRENCY) {
      const chunk = requests.slice(i, i + CONCURRENCY);
      const chunkResults = await Promise.all(chunk.map((req) => this.send(req)));
      results.push(...chunkResults);
    }

    return {
      successCount: results.filter((r) => r.success).length,
      failureCount: results.filter((r) => !r.success).length,
      results,
    };
  }

  async isHealthy(): Promise<boolean> {
    try {
      const account = await this.client.api
        .accounts(this.config.accountSid)
        .fetch();
      return account.status === 'active';
    } catch (err: unknown) {
      this.logger.warn('Twilio health check failed', {
        error: (err as Error).message,
      });
      return false;
    }
  }

  async getMessageStatus(messageSid: string): Promise<string | null> {
    try {
      const message = await this.client.messages(messageSid).fetch();
      return message.status;
    } catch (err: unknown) {
      this.logger.warn('Twilio fetch message status failed', {
        messageSid,
        error: (err as Error).message,
      });
      return null;
    }
  }
}