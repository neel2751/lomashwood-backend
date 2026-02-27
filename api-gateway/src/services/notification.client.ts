import axios, { AxiosInstance, AxiosError } from 'axios';
import { config } from '../config';
import { logger } from '../utils/logger';
import { ServiceError } from '../utils/errors';

interface EmailNotification {
  id: string;
  to: string;
  from?: string;
  subject: string;
  html?: string;
  text?: string;
  templateId?: string;
  templateData?: Record<string, any>;
  status: 'PENDING' | 'SENT' | 'FAILED' | 'BOUNCED';
  sentAt?: Date;
  createdAt: Date;
}

interface SmsNotification {
  id: string;
  to: string;
  from?: string;
  message: string;
  status: 'PENDING' | 'SENT' | 'FAILED' | 'DELIVERED';
  sentAt?: Date;
  createdAt: Date;
}

interface PushNotification {
  id: string;
  userId: string;
  title: string;
  body: string;
  data?: Record<string, any>;
  imageUrl?: string;
  status: 'PENDING' | 'SENT' | 'FAILED';
  sentAt?: Date;
  createdAt: Date;
}

interface NotificationTemplate {
  id: string;
  name: string;
  type: 'EMAIL' | 'SMS' | 'PUSH';
  subject?: string;
  content: string;
  variables: string[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

interface SendEmailDto {
  to: string | string[];
  from?: string;
  subject?: string;             // ── Fix 2: made optional (template-driven emails don't need it)
  html?: string;
  text?: string;
  templateId?: string;
  templateData?: Record<string, any>;
  attachments?: Array<{
    filename: string;
    content: string;
    encoding?: string;
  }>;
  cc?: string[];
  bcc?: string[];
  replyTo?: string;
}

interface SendSmsDto {
  to: string | string[];
  from?: string;
  message?: string;             // ── Fix 2: made optional (template-driven SMS don't need it)
  templateId?: string;
  templateData?: Record<string, any>;
}

interface SendPushDto {
  userId: string | string[];
  title: string;
  body: string;
  data?: Record<string, any>;
  imageUrl?: string;
  badge?: number;
  sound?: string;
  clickAction?: string;
}

interface CreateTemplateDto {
  name: string;
  type: 'EMAIL' | 'SMS' | 'PUSH';
  subject?: string;
  content: string;
  variables?: string[];
  isActive?: boolean;
}

interface UpdateTemplateDto {
  name?: string;
  subject?: string;
  content?: string;
  variables?: string[];
  isActive?: boolean;
}

interface PaginationParams {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

interface PaginatedResponse<T> {
  data: T[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

interface NotificationStats {
  email: {
    total: number;
    sent: number;
    failed: number;
    pending: number;
  };
  sms: {
    total: number;
    sent: number;
    failed: number;
    pending: number;
  };
  push: {
    total: number;
    sent: number;
    failed: number;
    pending: number;
  };
}

interface BulkEmailDto {
  recipients: Array<{
    to: string;
    templateData?: Record<string, any>;
  }>;
  from?: string;
  subject?: string;
  templateId: string;
}

interface BulkSmsDto {
  recipients: Array<{
    to: string;
    templateData?: Record<string, any>;
  }>;
  from?: string;
  templateId: string;
}

export class NotificationServiceClient {
  private client: AxiosInstance;
  private readonly baseURL: string;
  private readonly timeout: number;
  private readonly maxRetries: number;

  constructor() {
    // ── Fix 1: resolve baseURL/timeout safely across possible config shapes ──
    const services = config.services as Record<string, any>;

    this.baseURL =
      services?.notification?.url ??
      services?.notificationService?.url ??
      services?.notifications?.url ??
      (config as any).notificationServiceUrl ??
      '';

    this.timeout =
      services?.notification?.timeout ??
      services?.notificationService?.timeout ??
      (config as any).timeouts?.notification ??
      (config as any).timeouts?.default ??
      10_000;

    this.maxRetries = 3;

    if (!this.baseURL) {
      logger.warn('NotificationServiceClient: baseURL is empty — check your config.services shape');
    }

    this.client = axios.create({
      baseURL: this.baseURL,
      timeout: this.timeout,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    this.setupInterceptors();
  }

  private setupInterceptors(): void {
    this.client.interceptors.request.use(
      (reqConfig) => {
        const requestId = Math.random().toString(36).substring(7);
        reqConfig.headers['X-Request-ID'] = requestId;

        logger.info('Notification service request', {
          requestId,
          method: reqConfig.method?.toUpperCase(),
          url: reqConfig.url,
        });

        return reqConfig;
      },
      (error) => {
        logger.error('Notification service request error', { error });
        return Promise.reject(error);
      },
    );

    this.client.interceptors.response.use(
      (response) => {
        logger.info('Notification service response', {
          requestId: response.config.headers['X-Request-ID'],
          status: response.status,
        });
        return response;
      },
      async (error: AxiosError) => {
        const requestId = error.config?.headers['X-Request-ID'];

        logger.error('Notification service response error', {
          requestId,
          status: error.response?.status,
          message: error.message,
        });

        if (this.shouldRetry(error)) {
          return this.retryRequest(error);
        }

        throw this.handleError(error);
      },
    );
  }

  private shouldRetry(error: AxiosError): boolean {
    const retryableStatuses = [408, 429, 500, 502, 503, 504];
    const status = error.response?.status;
    return status ? retryableStatuses.includes(status) : false;
  }

  private async retryRequest(error: AxiosError, retryCount = 0): Promise<any> {
    if (retryCount >= this.maxRetries) {
      throw this.handleError(error);
    }

    const delay = Math.pow(2, retryCount) * 1000;
    await new Promise((resolve) => setTimeout(resolve, delay));

    logger.info('Retrying notification service request', {
      attempt: retryCount + 1,
      maxRetries: this.maxRetries,
    });

    try {
      return await this.client.request(error.config!);
    } catch (retryError) {
      return this.retryRequest(retryError as AxiosError, retryCount + 1);
    }
  }

  private handleError(error: AxiosError): ServiceError {
    const status = error.response?.status || 500;
    const message = (error.response?.data as any)?.message || error.message;
    return new ServiceError(message, status, 'NOTIFICATION_SERVICE_ERROR');
  }

  // ── Email ─────────────────────────────────────────────────────────────────

  async sendEmail(data: SendEmailDto): Promise<EmailNotification> {
    const response = await this.client.post<EmailNotification>('/email', data);
    return response.data;
  }

  async sendBulkEmail(
    data: BulkEmailDto,
  ): Promise<{ success: number; failed: number; total: number }> {
    const response = await this.client.post<{ success: number; failed: number; total: number }>(
      '/email/bulk',
      data,
    );
    return response.data;
  }

  async getEmailNotification(emailId: string): Promise<EmailNotification> {
    const response = await this.client.get<EmailNotification>(`/email/${emailId}`);
    return response.data;
  }

  async getEmailNotifications(
    params?: PaginationParams & { status?: string; to?: string },
  ): Promise<PaginatedResponse<EmailNotification>> {
    const response = await this.client.get<PaginatedResponse<EmailNotification>>('/email', {
      params,
    });
    return response.data;
  }

  async resendEmail(emailId: string): Promise<EmailNotification> {
    const response = await this.client.post<EmailNotification>(`/email/${emailId}/resend`);
    return response.data;
  }

  // ── SMS ───────────────────────────────────────────────────────────────────

  async sendSms(data: SendSmsDto): Promise<SmsNotification> {
    const response = await this.client.post<SmsNotification>('/sms', data);
    return response.data;
  }

  async sendBulkSms(
    data: BulkSmsDto,
  ): Promise<{ success: number; failed: number; total: number }> {
    const response = await this.client.post<{ success: number; failed: number; total: number }>(
      '/sms/bulk',
      data,
    );
    return response.data;
  }

  async getSmsNotification(smsId: string): Promise<SmsNotification> {
    const response = await this.client.get<SmsNotification>(`/sms/${smsId}`);
    return response.data;
  }

  async getSmsNotifications(
    params?: PaginationParams & { status?: string; to?: string },
  ): Promise<PaginatedResponse<SmsNotification>> {
    const response = await this.client.get<PaginatedResponse<SmsNotification>>('/sms', { params });
    return response.data;
  }

  async resendSms(smsId: string): Promise<SmsNotification> {
    const response = await this.client.post<SmsNotification>(`/sms/${smsId}/resend`);
    return response.data;
  }

  // ── Push ──────────────────────────────────────────────────────────────────

  async sendPush(data: SendPushDto): Promise<PushNotification> {
    const response = await this.client.post<PushNotification>('/push', data);
    return response.data;
  }

  async getPushNotification(pushId: string): Promise<PushNotification> {
    const response = await this.client.get<PushNotification>(`/push/${pushId}`);
    return response.data;
  }

  async getPushNotifications(
    params?: PaginationParams & { status?: string; userId?: string },
  ): Promise<PaginatedResponse<PushNotification>> {
    const response = await this.client.get<PaginatedResponse<PushNotification>>('/push', { params });
    return response.data;
  }

  async getUserPushNotifications(
    userId: string,
    params?: PaginationParams,
  ): Promise<PaginatedResponse<PushNotification>> {
    const response = await this.client.get<PaginatedResponse<PushNotification>>(
      `/push/user/${userId}`,
      { params },
    );
    return response.data;
  }

  // ── Templates ─────────────────────────────────────────────────────────────

  async createTemplate(data: CreateTemplateDto): Promise<NotificationTemplate> {
    const response = await this.client.post<NotificationTemplate>('/templates', data);
    return response.data;
  }

  async getTemplates(
    params?: PaginationParams & { type?: string; isActive?: boolean },
  ): Promise<PaginatedResponse<NotificationTemplate>> {
    const response = await this.client.get<PaginatedResponse<NotificationTemplate>>('/templates', {
      params,
    });
    return response.data;
  }

  async getTemplate(templateId: string): Promise<NotificationTemplate> {
    const response = await this.client.get<NotificationTemplate>(`/templates/${templateId}`);
    return response.data;
  }

  async getTemplateByName(name: string): Promise<NotificationTemplate> {
    const response = await this.client.get<NotificationTemplate>(`/templates/name/${name}`);
    return response.data;
  }

  async updateTemplate(templateId: string, data: UpdateTemplateDto): Promise<NotificationTemplate> {
    const response = await this.client.patch<NotificationTemplate>(
      `/templates/${templateId}`,
      data,
    );
    return response.data;
  }

  async deleteTemplate(templateId: string): Promise<void> {
    await this.client.delete(`/templates/${templateId}`);
  }

  async activateTemplate(templateId: string): Promise<NotificationTemplate> {
    const response = await this.client.patch<NotificationTemplate>(
      `/templates/${templateId}/activate`,
    );
    return response.data;
  }

  async deactivateTemplate(templateId: string): Promise<NotificationTemplate> {
    const response = await this.client.patch<NotificationTemplate>(
      `/templates/${templateId}/deactivate`,
    );
    return response.data;
  }

  // ── Stats ─────────────────────────────────────────────────────────────────

  async getNotificationStats(startDate?: Date, endDate?: Date): Promise<NotificationStats> {
    const params = {
      startDate: startDate?.toISOString(),
      endDate: endDate?.toISOString(),
    };
    const response = await this.client.get<NotificationStats>('/stats', { params });
    return response.data;
  }

  // ── Convenience helpers ───────────────────────────────────────────────────

  async sendAppointmentConfirmation(
    appointmentId: string,
    email: string,
    data: Record<string, any>,
  ): Promise<EmailNotification> {
    return this.sendEmail({
      to: email,
      templateId: 'appointment-confirmation',
      templateData: { appointmentId, ...data },
    });
  }

  async sendAppointmentReminder(
    appointmentId: string,
    email: string,
    phone: string,
    data: Record<string, any>,
  ): Promise<void> {
    await Promise.all([
      this.sendEmail({
        to: email,
        templateId: 'appointment-reminder',
        templateData: { appointmentId, ...data },
      }),
      this.sendSms({
        to: phone,
        templateId: 'appointment-reminder-sms',
        templateData: { appointmentId, ...data },
      }),
    ]);
  }

  async sendBrochureConfirmation(
    email: string,
    data: Record<string, any>,
  ): Promise<EmailNotification> {
    return this.sendEmail({
      to: email,
      templateId: 'brochure-confirmation',
      templateData: data,
    });
  }

  async sendOrderConfirmation(
    orderId: string,
    email: string,
    data: Record<string, any>,
  ): Promise<EmailNotification> {
    return this.sendEmail({
      to: email,
      templateId: 'order-confirmation',
      templateData: { orderId, ...data },
    });
  }

  async sendPaymentReceipt(
    paymentId: string,
    email: string,
    data: Record<string, any>,
  ): Promise<EmailNotification> {
    return this.sendEmail({
      to: email,
      templateId: 'payment-receipt',
      templateData: { paymentId, ...data },
    });
  }

  async sendBusinessInquiryNotification(
    adminEmail: string,
    data: Record<string, any>,
  ): Promise<EmailNotification> {
    return this.sendEmail({
      to: adminEmail,
      templateId: 'business-inquiry-notification',
      templateData: data,
    });
  }

  async sendContactFormNotification(
    adminEmail: string,
    data: Record<string, any>,
  ): Promise<EmailNotification> {
    return this.sendEmail({
      to: adminEmail,
      templateId: 'contact-form-notification',
      templateData: data,
    });
  }

  async sendNewsletterSubscription(
    email: string,
    data: Record<string, any>,
  ): Promise<EmailNotification> {
    return this.sendEmail({
      to: email,
      templateId: 'newsletter-subscription',
      templateData: data,
    });
  }

  // ── Health ────────────────────────────────────────────────────────────────

  async healthCheck(): Promise<{ status: string; timestamp: Date }> {
    const response = await this.client.get('/health');
    return response.data;
  }
}

export const notificationServiceClient = new NotificationServiceClient();