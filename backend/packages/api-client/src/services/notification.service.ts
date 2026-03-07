import { HttpClient } from '../utils/http';
import { PaginatedResponse } from '../types/api.types';
import {
  Notification,
  SendNotificationRequest,
  EmailLog,
  SmsLog,
  PushLog,
  CreateTemplateRequest,
  UpdateTemplateRequest,
} from '../types/notification.types';

type CreateNotificationRequest = SendNotificationRequest;
type UpdateNotificationRequest = Partial<SendNotificationRequest>;
type CreateEmailRequest = SendNotificationRequest;
type CreateSmsRequest = SendNotificationRequest;
type CreatePushRequest = SendNotificationRequest;

type EmailTemplate = CreateTemplateRequest & { id: string };
type CreateEmailTemplateRequest = CreateTemplateRequest;
type UpdateEmailTemplateRequest = UpdateTemplateRequest;

type SmsTemplate = CreateTemplateRequest & { id: string };
type CreateSmsTemplateRequest = CreateTemplateRequest;
type UpdateSmsTemplateRequest = UpdateTemplateRequest;

type PushTemplate = CreateTemplateRequest & { id: string };
type CreatePushTemplateRequest = CreateTemplateRequest;
type UpdatePushTemplateRequest = UpdateTemplateRequest;

interface NotificationFilters {
  userId?: string;
  type?: string;
  status?: string;
  dateFrom?: string;
  dateTo?: string;
  read?: boolean;
}

export class NotificationService {
  constructor(private apiClient: HttpClient) {}

  async getNotifications(params?: NotificationFilters & {
    page?: number;
    limit?: number;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  }): Promise<PaginatedResponse<Notification[]>> {
    return this.apiClient.get<PaginatedResponse<Notification[]>>('/notifications', { params });
  }

  async getNotification(notificationId: string): Promise<Notification> {
    return this.apiClient.get<Notification>(`/notifications/${notificationId}`);
  }

  async createNotification(notificationData: CreateNotificationRequest): Promise<Notification> {
    return this.apiClient.post<Notification>('/notifications', notificationData);
  }

  async updateNotification(notificationId: string, updateData: UpdateNotificationRequest): Promise<Notification> {
    return this.apiClient.put<Notification>(`/notifications/${notificationId}`, updateData);
  }

  async deleteNotification(notificationId: string): Promise<void> {
    return this.apiClient.delete<void>(`/notifications/${notificationId}`);
  }

  async markNotificationAsRead(notificationId: string): Promise<Notification> {
    return this.apiClient.post<Notification>(`/notifications/${notificationId}/read`);
  }

  async markNotificationAsUnread(notificationId: string): Promise<Notification> {
    return this.apiClient.post<Notification>(`/notifications/${notificationId}/unread`);
  }

  async markAllNotificationsAsRead(userId?: string): Promise<void> {
    return this.apiClient.post<void>('/notifications/read-all', { userId });
  }

  async getUserNotifications(userId: string, params?: {
    page?: number;
    limit?: number;
    unreadOnly?: boolean;
    type?: string;
  }): Promise<PaginatedResponse<Notification[]>> {
    return this.apiClient.get<PaginatedResponse<Notification[]>>(`/users/${userId}/notifications`, { params });
  }

  async sendUserNotification(userId: string, notificationData: {
    title: string;
    message: string;
    type: 'INFO' | 'SUCCESS' | 'WARNING' | 'ERROR';
    data?: any;
    channels?: Array<'EMAIL' | 'SMS' | 'PUSH' | 'IN_APP'>;
  }): Promise<Notification> {
    return this.apiClient.post<Notification>(`/users/${userId}/notifications`, notificationData);
  }

  async getUserNotificationCount(userId: string, params?: {
    unreadOnly?: boolean;
  }): Promise<{
    total: number;
    unread: number;
    byType: Record<string, number>;
  }> {
    return this.apiClient.get<any>(`/users/${userId}/notifications/count`, { params });
  }

  async getEmailLogs(params?: {
    page?: number;
    limit?: number;
    status?: 'PENDING' | 'SENT' | 'FAILED' | 'BOUNCED';
    templateId?: string;
    startDate?: string;
    endDate?: string;
  }): Promise<PaginatedResponse<EmailLog[]>> {
    return this.apiClient.get<PaginatedResponse<EmailLog[]>>('/notifications/emails', { params });
  }

  async getEmailLog(emailId: string): Promise<EmailLog> {
    return this.apiClient.get<EmailLog>(`/notifications/emails/${emailId}`);
  }

  async sendEmail(emailData: CreateEmailRequest): Promise<EmailLog> {
    return this.apiClient.post<EmailLog>('/notifications/emails', emailData);
  }

  async resendEmail(emailId: string): Promise<EmailLog> {
    return this.apiClient.post<EmailLog>(`/notifications/emails/${emailId}/resend`);
  }

  async sendBulkEmail(emailData: {
    recipients: string[];
    subject: string;
    content: string;
    templateId?: string;
    variables?: Record<string, any>;
    scheduledAt?: string;
  }): Promise<Array<EmailLog>> {
    return this.apiClient.post<EmailLog[]>('/notifications/emails/bulk', emailData);
  }

  async getEmailTemplates(params?: {
    page?: number;
    limit?: number;
    category?: string;
    active?: boolean;
  }): Promise<PaginatedResponse<EmailTemplate[]>> {
    return this.apiClient.get<PaginatedResponse<EmailTemplate[]>>('/notifications/email-templates', { params });
  }

  async getEmailTemplate(templateId: string): Promise<EmailTemplate> {
    return this.apiClient.get<EmailTemplate>(`/notifications/email-templates/${templateId}`);
  }

  async createEmailTemplate(templateData: CreateEmailTemplateRequest): Promise<EmailTemplate> {
    return this.apiClient.post<EmailTemplate>('/notifications/email-templates', templateData);
  }

  async updateEmailTemplate(templateId: string, updateData: UpdateEmailTemplateRequest): Promise<EmailTemplate> {
    return this.apiClient.put<EmailTemplate>(`/notifications/email-templates/${templateId}`, updateData);
  }

  async deleteEmailTemplate(templateId: string): Promise<void> {
    return this.apiClient.delete<void>(`/notifications/email-templates/${templateId}`);
  }

  async previewEmailTemplate(templateId: string, variables?: Record<string, any>): Promise<{
    subject: string;
    html: string;
    text: string;
  }> {
    return this.apiClient.post<any>(`/notifications/email-templates/${templateId}/preview`, { variables });
  }

  async testEmailTemplate(templateId: string, testData: {
    to: string;
    variables?: Record<string, any>;
  }): Promise<EmailLog> {
    return this.apiClient.post<EmailLog>(`/notifications/email-templates/${templateId}/test`, testData);
  }

  async getSmsLogs(params?: {
    page?: number;
    limit?: number;
    status?: 'PENDING' | 'SENT' | 'FAILED' | 'DELIVERED';
    templateId?: string;
    startDate?: string;
    endDate?: string;
  }): Promise<PaginatedResponse<SmsLog[]>> {
    return this.apiClient.get<PaginatedResponse<SmsLog[]>>('/notifications/sms', { params });
  }

  async getSmsLog(smsId: string): Promise<SmsLog> {
    return this.apiClient.get<SmsLog>(`/notifications/sms/${smsId}`);
  }

  async sendSms(smsData: CreateSmsRequest): Promise<SmsLog> {
    return this.apiClient.post<SmsLog>('/notifications/sms', smsData);
  }

  async resendSms(smsId: string): Promise<SmsLog> {
    return this.apiClient.post<SmsLog>(`/notifications/sms/${smsId}/resend`);
  }

  async sendBulkSms(smsData: {
    recipients: string[];
    message: string;
    templateId?: string;
    variables?: Record<string, any>;
    scheduledAt?: string;
  }): Promise<Array<SmsLog>> {
    return this.apiClient.post<SmsLog[]>('/notifications/sms/bulk', smsData);
  }

  async getSmsTemplates(params?: {
    page?: number;
    limit?: number;
    category?: string;
    active?: boolean;
  }): Promise<PaginatedResponse<SmsTemplate[]>> {
    return this.apiClient.get<PaginatedResponse<SmsTemplate[]>>('/notifications/sms-templates', { params });
  }

  async getSmsTemplate(templateId: string): Promise<SmsTemplate> {
    return this.apiClient.get<SmsTemplate>(`/notifications/sms-templates/${templateId}`);
  }

  async createSmsTemplate(templateData: CreateSmsTemplateRequest): Promise<SmsTemplate> {
    return this.apiClient.post<SmsTemplate>('/notifications/sms-templates', templateData);
  }

  async updateSmsTemplate(templateId: string, updateData: UpdateSmsTemplateRequest): Promise<SmsTemplate> {
    return this.apiClient.put<SmsTemplate>(`/notifications/sms-templates/${templateId}`, updateData);
  }

  async deleteSmsTemplate(templateId: string): Promise<void> {
    return this.apiClient.delete<void>(`/notifications/sms-templates/${templateId}`);
  }

  async previewSmsTemplate(templateId: string, variables?: Record<string, any>): Promise<{
    message: string;
  }> {
    return this.apiClient.post<any>(`/notifications/sms-templates/${templateId}/preview`, { variables });
  }

  async testSmsTemplate(templateId: string, testData: {
    to: string;
    variables?: Record<string, any>;
  }): Promise<SmsLog> {
    return this.apiClient.post<SmsLog>(`/notifications/sms-templates/${templateId}/test`, testData);
  }

  async getPushLogs(params?: {
    page?: number;
    limit?: number;
    status?: 'PENDING' | 'SENT' | 'FAILED' | 'DELIVERED';
    templateId?: string;
    startDate?: string;
    endDate?: string;
  }): Promise<PaginatedResponse<PushLog[]>> {
    return this.apiClient.get<PaginatedResponse<PushLog[]>>('/notifications/push', { params });
  }

  async getPushLog(pushId: string): Promise<PushLog> {
    return this.apiClient.get<PushLog>(`/notifications/push/${pushId}`);
  }

  async sendPush(pushData: CreatePushRequest): Promise<PushLog> {
    return this.apiClient.post<PushLog>('/notifications/push', pushData);
  }

  async resendPush(pushId: string): Promise<PushLog> {
    return this.apiClient.post<PushLog>(`/notifications/push/${pushId}/resend`);
  }

  async sendBulkPush(pushData: {
    users: string[];
    title: string;
    message: string;
    data?: any;
    templateId?: string;
    variables?: Record<string, any>;
    scheduledAt?: string;
  }): Promise<Array<PushLog>> {
    return this.apiClient.post<PushLog[]>('/notifications/push/bulk', pushData);
  }

  async getPushTemplates(params?: {
    page?: number;
    limit?: number;
    category?: string;
    active?: boolean;
  }): Promise<PaginatedResponse<PushTemplate[]>> {
    return this.apiClient.get<PaginatedResponse<PushTemplate[]>>('/notifications/push-templates', { params });
  }

  async getPushTemplate(templateId: string): Promise<PushTemplate> {
    return this.apiClient.get<PushTemplate>(`/notifications/push-templates/${templateId}`);
  }

  async createPushTemplate(templateData: CreatePushTemplateRequest): Promise<PushTemplate> {
    return this.apiClient.post<PushTemplate>('/notifications/push-templates', templateData);
  }

  async updatePushTemplate(templateId: string, updateData: UpdatePushTemplateRequest): Promise<PushTemplate> {
    return this.apiClient.put<PushTemplate>(`/notifications/push-templates/${templateId}`, updateData);
  }

  async deletePushTemplate(templateId: string): Promise<void> {
    return this.apiClient.delete<void>(`/notifications/push-templates/${templateId}`);
  }

  async previewPushTemplate(templateId: string, variables?: Record<string, any>): Promise<{
    title: string;
    message: string;
    data?: any;
  }> {
    return this.apiClient.post<any>(`/notifications/push-templates/${templateId}/preview`, { variables });
  }

  async testPushTemplate(templateId: string, testData: {
    users: string[];
    variables?: Record<string, any>;
  }): Promise<Array<PushLog>> {
    return this.apiClient.post<PushLog[]>(`/notifications/push-templates/${templateId}/test`, testData);
  }

  async getUserNotificationPreferences(userId: string): Promise<{
    email: boolean;
    sms: boolean;
    push: boolean;
    inApp: boolean;
    categories: Record<string, boolean>;
    quietHours?: {
      enabled: boolean;
      start: string;
      end: string;
      timezone: string;
    };
  }> {
    return this.apiClient.get<any>(`/users/${userId}/notification-preferences`);
  }

  async updateUserNotificationPreferences(userId: string, preferences: {
    email?: boolean;
    sms?: boolean;
    push?: boolean;
    inApp?: boolean;
    categories?: Record<string, boolean>;
    quietHours?: {
      enabled: boolean;
      start: string;
      end: string;
      timezone: string;
    };
  }): Promise<any> {
    return this.apiClient.put<any>(`/users/${userId}/notification-preferences`, preferences);
  }

  async getNotificationAnalytics(params?: {
    startDate?: string;
    endDate?: string;
    type?: 'EMAIL' | 'SMS' | 'PUSH' | 'IN_APP';
  }): Promise<{
    totalSent: number;
    totalDelivered: number;
    totalFailed: number;
    deliveryRate: number;
    openRate?: number;
    clickRate?: number;
    byType: Record<string, {
      sent: number;
      delivered: number;
      failed: number;
      deliveryRate: number;
    }>;
    byDate: Array<{
      date: string;
      sent: number;
      delivered: number;
      failed: number;
    }>;
  }> {
    return this.apiClient.get<any>('/notifications/analytics', { params });
  }

  async getTemplateAnalytics(templateId: string, params?: {
    startDate?: string;
    endDate?: string;
  }): Promise<{
    usageCount: number;
    deliveryRate: number;
    openRate?: number;
    clickRate?: number;
    performance: Array<{
      date: string;
      sent: number;
      delivered: number;
      opened?: number;
      clicked?: number;
    }>;
  }> {
    return this.apiClient.get<any>(`/notifications/templates/${templateId}/analytics`, { params });
  }

  async scheduleNotification(notificationData: CreateNotificationRequest & {
    scheduledAt: string;
  }): Promise<Notification> {
    return this.apiClient.post<Notification>('/notifications/schedule', notificationData);
  }

  async getScheduledNotifications(params?: {
    page?: number;
    limit?: number;
    status?: 'PENDING' | 'SENT' | 'FAILED';
    startDate?: string;
    endDate?: string;
  }): Promise<PaginatedResponse<Notification[]>> {
    return this.apiClient.get<PaginatedResponse<Notification[]>>('/notifications/scheduled', { params });
  }

  async cancelScheduledNotification(notificationId: string): Promise<Notification> {
    return this.apiClient.post<Notification>(`/notifications/${notificationId}/cancel`);
  }

  async createCampaign(campaignData: {
    name: string;
    description?: string;
    type: 'EMAIL' | 'SMS' | 'PUSH' | 'MULTI';
    templateId?: string;
    recipients: {
      type: 'ALL' | 'SEGMENT' | 'USERS';
      value: string | string[];
    };
    content?: {
      subject?: string;
      message?: string;
      data?: any;
    };
    scheduledAt?: string;
  }): Promise<{
    id: string;
    name: string;
    status: 'DRAFT' | 'SCHEDULED' | 'RUNNING' | 'COMPLETED' | 'FAILED';
    createdAt: string;
  }> {
    return this.apiClient.post<any>('/notifications/campaigns', campaignData);
  }

  async getCampaigns(params?: {
    page?: number;
    limit?: number;
    status?: 'DRAFT' | 'SCHEDULED' | 'RUNNING' | 'COMPLETED' | 'FAILED';
  }): Promise<PaginatedResponse<Array<{
    id: string;
    name: string;
    description?: string;
    type: string;
    status: string;
    createdAt: string;
    scheduledAt?: string;
    completedAt?: string;
    stats: {
      totalRecipients: number;
      sent: number;
      delivered: number;
      failed: number;
    };
  }>>> {
    return this.apiClient.get<PaginatedResponse<any[]>>('/notifications/campaigns', { params });
  }

  async getCampaign(campaignId: string): Promise<{
    id: string;
    name: string;
    description?: string;
    type: string;
    status: string;
    recipients: any;
    content: any;
    scheduledAt?: string;
    completedAt?: string;
    stats: any;
    logs: any[];
  }> {
    return this.apiClient.get<any>(`/notifications/campaigns/${campaignId}`);
  }

  async launchCampaign(campaignId: string): Promise<any> {
    return this.apiClient.post<any>(`/notifications/campaigns/${campaignId}/launch`);
  }

  async pauseCampaign(campaignId: string): Promise<any> {
    return this.apiClient.post<any>(`/notifications/campaigns/${campaignId}/pause`);
  }

  async resumeCampaign(campaignId: string): Promise<any> {
    return this.apiClient.post<any>(`/notifications/campaigns/${campaignId}/resume`);
  }

  async cancelCampaign(campaignId: string): Promise<any> {
    return this.apiClient.post<any>(`/notifications/campaigns/${campaignId}/cancel`);
  }

  async getWebhooks(params?: {
    page?: number;
    limit?: number;
    active?: boolean;
  }): Promise<PaginatedResponse<Array<{
    id: string;
    url: string;
    events: string[];
    active: boolean;
    secret?: string;
    createdAt: string;
  }>>> {
    return this.apiClient.get<PaginatedResponse<any[]>>('/notifications/webhooks', { params });
  }

  async createWebhook(webhookData: {
    url: string;
    events: string[];
    secret?: string;
    active?: boolean;
  }): Promise<any> {
    return this.apiClient.post<any>('/notifications/webhooks', webhookData);
  }

  async updateWebhook(webhookId: string, updateData: {
    url?: string;
    events?: string[];
    secret?: string;
    active?: boolean;
  }): Promise<any> {
    return this.apiClient.put<any>(`/notifications/webhooks/${webhookId}`, updateData);
  }

  async deleteWebhook(webhookId: string): Promise<void> {
    return this.apiClient.delete<void>(`/notifications/webhooks/${webhookId}`);
  }

  async testWebhook(webhookId: string): Promise<{
    success: boolean;
    response?: any;
    error?: string;
  }> {
    return this.apiClient.post<any>(`/notifications/webhooks/${webhookId}/test`);
  }

  async exportNotifications(params?: {
    type?: 'EMAIL' | 'SMS' | 'PUSH' | 'IN_APP';
    format?: 'csv' | 'excel';
    startDate?: string;
    endDate?: string;
    status?: string;
  }): Promise<Blob> {
    return this.apiClient.get<Blob>('/notifications/export', {
      params,
      responseType: 'blob',
    });
  }

  async searchNotifications(query: string, params?: {
    page?: number;
    limit?: number;
    type?: string;
    userId?: string;
  }): Promise<PaginatedResponse<Notification[]>> {
    return this.apiClient.get<PaginatedResponse<Notification[]>>('/notifications/search', {
      params: { q: query, ...params },
    });
  }
}