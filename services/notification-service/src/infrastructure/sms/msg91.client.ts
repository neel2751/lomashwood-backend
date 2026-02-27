import https from 'https';
import { Logger } from 'winston';

export interface Msg91Config {
  authKey: string;
  senderId: string;
  defaultCountry?: string;
  baseUrl?: string;
  maxRetries?: number;
  timeoutMs?: number;
}

export interface Msg91SmsSendRequest {
  to: string;
  body: string;
  senderId?: string;
  templateId?: string;
  variables?: Record<string, string>;
  scheduledAt?: Date;
}

export interface Msg91SmsSendResult {
  success: boolean;
  messageId?: string;
  provider: 'msg91';
  requestId?: string;
  errorCode?: string;
  errorMessage?: string;
}

export interface Msg91SmsBulkSendResult {
  successCount: number;
  failureCount: number;
  results: Msg91SmsSendResult[];
}

interface Msg91SendOtpResponse {
  type: 'success' | 'error';
  message?: string;
  request_id?: string;
}

interface Msg91FlowResponse {
  type: 'success' | 'error';
  message?: string;
  request_id?: string;
}

interface Msg91BulkPayload {
  flow_id?: string;
  sender: string;
  mobiles: string;
  message?: string;
  [key: string]: string | undefined;
}

export class Msg91Client {
  private readonly authKey: string;
  private readonly senderId: string;
  private readonly baseUrl: string;
  private readonly maxRetries: number;
  private readonly timeoutMs: number;

  constructor(
    private readonly config: Msg91Config,
    private readonly logger: Logger,
  ) {
    this.authKey = config.authKey;
    this.senderId = config.senderId;
    this.baseUrl = config.baseUrl ?? 'api.msg91.com';
    this.maxRetries = config.maxRetries ?? 2;
    this.timeoutMs = config.timeoutMs ?? 10_000;
  }

  // ---------------------------------------------------------------------------
  // HTTP helper
  // ---------------------------------------------------------------------------

  private request<T>(
    path: string,
    method: 'GET' | 'POST',
    body?: Record<string, unknown>,
  ): Promise<T> {
    return new Promise((resolve, reject) => {
      const payload = body ? JSON.stringify(body) : undefined;

      const options: https.RequestOptions = {
        hostname: this.baseUrl,
        path,
        method,
        headers: {
          authkey: this.authKey,
          'Content-Type': 'application/json',
          Accept: 'application/json',
          ...(payload && { 'Content-Length': Buffer.byteLength(payload) }),
        },
        timeout: this.timeoutMs,
      };

      const req = https.request(options, (res) => {
        let data = '';
        res.on('data', (chunk: Buffer) => { data += chunk.toString(); });
        res.on('end', () => {
          try {
            resolve(JSON.parse(data) as T);
          } catch {
            reject(new Error(`MSG91 non-JSON response: ${data}`));
          }
        });
      });

      req.on('timeout', () => {
        req.destroy();
        reject(new Error('MSG91 request timed out'));
      });

      req.on('error', reject);

      if (payload) req.write(payload);
      req.end();
    });
  }

  // ---------------------------------------------------------------------------
  // Send via Flow (template-based – preferred for DLT compliance in India)
  // ---------------------------------------------------------------------------

  private async sendViaFlow(req: Msg91SmsSendRequest): Promise<Msg91SmsSendResult> {
    if (!req.templateId) {
      return {
        success: false,
        provider: 'msg91',
        errorCode: 'NO_TEMPLATE_ID',
        errorMessage: 'templateId is required for flow-based sending',
      };
    }

    const payload: Record<string, unknown> = {
      flow_id: req.templateId,
      sender: req.senderId ?? this.senderId,
      mobiles: req.to,
      ...req.variables,
    };

    if (req.scheduledAt) {
      payload.scheduledTime = req.scheduledAt.toISOString();
    }

    try {
      const response = await this.request<Msg91FlowResponse>(
        '/api/v5/flow/',
        'POST',
        payload,
      );

      if (response.type === 'success') {
        this.logger.info('MSG91 flow SMS sent', {
          requestId: response.request_id,
          to: req.to,
          templateId: req.templateId,
        });

        return {
          success: true,
          provider: 'msg91',
          requestId: response.request_id,
          messageId: response.request_id,
        };
      }

      this.logger.warn('MSG91 flow SMS rejected', {
        message: response.message,
        to: req.to,
      });

      return {
        success: false,
        provider: 'msg91',
        errorCode: 'FLOW_REJECTED',
        errorMessage: response.message,
      };
    } catch (err: unknown) {
      return {
        success: false,
        provider: 'msg91',
        errorCode: 'REQUEST_FAILED',
        errorMessage: (err as Error).message,
      };
    }
  }

  // ---------------------------------------------------------------------------
  // Send plain SMS (non-template fallback)
  // ---------------------------------------------------------------------------

  private async sendPlain(req: Msg91SmsSendRequest): Promise<Msg91SmsSendResult> {
    const params = new URLSearchParams({
      authkey: this.authKey,
      mobiles: req.to,
      message: req.body,
      sender: req.senderId ?? this.senderId,
      route: '4',
      country: this.config.defaultCountry ?? '91',
    });

    try {
      const response = await this.request<Msg91SendOtpResponse>(
        `/api/sendhttp.php?${params.toString()}`,
        'GET',
      );

      if (response.type === 'success') {
        this.logger.info('MSG91 plain SMS sent', {
          requestId: response.request_id,
          to: req.to,
        });

        return {
          success: true,
          provider: 'msg91',
          messageId: response.request_id,
          requestId: response.request_id,
        };
      }

      return {
        success: false,
        provider: 'msg91',
        errorCode: 'SEND_REJECTED',
        errorMessage: response.message,
      };
    } catch (err: unknown) {
      return {
        success: false,
        provider: 'msg91',
        errorCode: 'REQUEST_FAILED',
        errorMessage: (err as Error).message,
      };
    }
  }

  // ---------------------------------------------------------------------------
  // Public API
  // ---------------------------------------------------------------------------

  async send(req: Msg91SmsSendRequest, attempt = 0): Promise<Msg91SmsSendResult> {
    const result = req.templateId
      ? await this.sendViaFlow(req)
      : await this.sendPlain(req);

    if (!result.success && attempt < this.maxRetries) {
      const retryable =
        result.errorCode === 'REQUEST_FAILED' ||
        result.errorCode === 'TIMEOUT';

      if (retryable) {
        const delay = Math.pow(2, attempt) * 500;
        this.logger.warn('MSG91 retry', { attempt: attempt + 1, to: req.to });
        await new Promise((resolve) => setTimeout(resolve, delay));
        return this.send(req, attempt + 1);
      }
    }

    if (!result.success) {
      this.logger.error('MSG91 SMS send failed', {
        errorCode: result.errorCode,
        errorMessage: result.errorMessage,
        to: req.to,
        attempt,
      });
    }

    return result;
  }

  async sendBulk(requests: Msg91SmsSendRequest[]): Promise<Msg91SmsBulkSendResult> {
    const CONCURRENCY = 5;
    const results: Msg91SmsSendResult[] = [];

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
      // MSG91 does not expose a dedicated ping/health endpoint.
      // We validate credentials by calling the balance endpoint.
      const params = new URLSearchParams({ authkey: this.authKey });
      const response = await this.request<{ type: string }>(
        `/api/balance.php?${params.toString()}`,
        'GET',
      );
      return response.type === 'success';
    } catch (err: unknown) {
      this.logger.warn('MSG91 health check failed', {
        error: (err as Error).message,
      });
      return false;
    }
  }
}