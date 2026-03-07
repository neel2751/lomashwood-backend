import { HttpClient } from '../utils/http';
import { PaginatedResponse } from '../types/api.types';


export interface Reminder {
  id: string;
  type: 'EMAIL' | 'SMS' | 'PUSH' | 'IN_APP';
  recipient: string;
  title?: string;
  message: string;
  scheduledAt: string;
  sentAt?: string;
  status: 'PENDING' | 'SENT' | 'FAILED' | 'CANCELLED';
  template?: string;
  metadata?: any;
  createdAt: string;
  updatedAt: string;
}

export interface CreateReminderRequest {
  type: 'EMAIL' | 'SMS' | 'PUSH' | 'IN_APP';
  recipient: string;
  title?: string;
  message: string;
  scheduledAt: string;
  template?: string;
  variables?: Record<string, any>;
  metadata?: any;
}

export interface UpdateReminderRequest {
  type?: 'EMAIL' | 'SMS' | 'PUSH' | 'IN_APP';
  recipient?: string;
  title?: string;
  message?: string;
  scheduledAt?: string;
  template?: string;
  variables?: Record<string, any>;
  metadata?: any;
}

export interface ReminderFilters {
  search?: string;
  type?: 'EMAIL' | 'SMS' | 'PUSH' | 'IN_APP';
  status?: 'PENDING' | 'SENT' | 'FAILED' | 'CANCELLED';
  dateFrom?: string;
  dateTo?: string;
  recipient?: string;
}

export class ReminderService {
  constructor(private HttpClient: HttpClient) {}

  
  async getReminders(params?: ReminderFilters & {
    page?: number;
    limit?: number;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  }): Promise<PaginatedResponse<Reminder>> {
    return this.HttpClient.get<PaginatedResponse<Reminder>>('/reminders', { params });
  }

  async getReminder(reminderId: string): Promise<Reminder> {
    return this.HttpClient.get<Reminder>(`/reminders/${reminderId}`);
  }

  async createReminder(reminderData: CreateReminderRequest): Promise<Reminder> {
    return this.HttpClient.post<Reminder>('/reminders', reminderData);
  }

  async updateReminder(reminderId: string, updateData: UpdateReminderRequest): Promise<Reminder> {
    return this.HttpClient.put<Reminder>(`/reminders/${reminderId}`, updateData);
  }

  async deleteReminder(reminderId: string): Promise<void> {
    return this.HttpClient.delete<void>(`/reminders/${reminderId}`);
  }

  
  async getAppointmentReminders(appointmentId: string): Promise<Array<{
    id: string;
    appointmentId: string;
    type: 'EMAIL' | 'SMS' | 'PUSH' | 'IN_APP';
    scheduledAt: string;
    sentAt?: string;
    status: 'PENDING' | 'SENT' | 'FAILED' | 'CANCELLED';
    template: string;
    recipient: string;
    content: string;
    metadata?: any;
  }>> {
    return this.HttpClient.get<any[]>(`/reminders/appointment/${appointmentId}`);
  }

  async createAppointmentReminder(appointmentId: string, reminderData: {
    type: 'EMAIL' | 'SMS' | 'PUSH' | 'IN_APP';
    scheduledAt: string;
    template?: string;
    customMessage?: string;
    recipient?: string;
    metadata?: any;
  }): Promise<any> {
    return this.HttpClient.post<any>(`/reminders/appointment/${appointmentId}`, reminderData);
  }

  async sendAppointmentReminder(appointmentId: string, reminderData: {
    type: 'EMAIL' | 'SMS' | 'PUSH' | 'IN_APP';
    template?: string;
    customMessage?: string;
    recipient?: string;
    sendImmediately?: boolean;
  }): Promise<{
    reminderId: string;
    status: 'SENT' | 'FAILED';
    sentAt?: string;
    error?: string;
  }> {
    return this.HttpClient.post<any>(`/reminders/appointment/${appointmentId}/send`, reminderData);
  }

  
  async getCustomerReminders(customerId: string, params?: {
    page?: number;
    limit?: number;
    type?: string;
    status?: string;
  }): Promise<PaginatedResponse<{
    id: string;
    customerId: string;
    type: string;
    title: string;
    message: string;
    scheduledAt: string;
    sentAt?: string;
    status: string;
    metadata?: any;
  }>> {
    return this.HttpClient.get<PaginatedResponse<any>>(`/reminders/customer/${customerId}`, { params });
  }

  async createCustomerReminder(customerId: string, reminderData: {
    type: 'EMAIL' | 'SMS' | 'PUSH' | 'IN_APP';
    title: string;
    message: string;
    scheduledAt: string;
    template?: string;
    metadata?: any;
  }): Promise<any> {
    return this.HttpClient.post<any>(`/reminders/customer/${customerId}`, reminderData);
  }

  
  async getReminderTemplates(params?: {
    page?: number;
    limit?: number;
    type?: 'APPOINTMENT' | 'PAYMENT' | 'FOLLOW_UP' | 'PROMOTION' | 'GENERAL';
    channel?: 'EMAIL' | 'SMS' | 'PUSH' | 'IN_APP';
    isActive?: boolean;
  }): Promise<PaginatedResponse<{
    id: string;
    name: string;
    description?: string;
    type: 'APPOINTMENT' | 'PAYMENT' | 'FOLLOW_UP' | 'PROMOTION' | 'GENERAL';
    channel: 'EMAIL' | 'SMS' | 'PUSH' | 'IN_APP';
    subject?: string;
    content: string;
    variables: Array<{
      name: string;
      type: string;
      description: string;
      required: boolean;
      defaultValue?: string;
    }>;
    isActive: boolean;
    isDefault: boolean;
    createdAt: string;
  }>> {
    return this.HttpClient.get<PaginatedResponse<any>>('/reminders/templates', { params });
  }

  async getReminderTemplate(templateId: string): Promise<{
    id: string;
    name: string;
    description?: string;
    type: 'APPOINTMENT' | 'PAYMENT' | 'FOLLOW_UP' | 'PROMOTION' | 'GENERAL';
    channel: 'EMAIL' | 'SMS' | 'PUSH' | 'IN_APP';
    subject?: string;
    content: string;
    variables: Array<{
      name: string;
      type: string;
      description: string;
      required: boolean;
      defaultValue?: string;
    }>;
    isActive: boolean;
    isDefault: boolean;
    createdAt: string;
    updatedAt: string;
  }> {
    return this.HttpClient.get<any>(`/reminders/templates/${templateId}`);
  }

  async createReminderTemplate(templateData: {
    name: string;
    description?: string;
    type: 'APPOINTMENT' | 'PAYMENT' | 'FOLLOW_UP' | 'PROMOTION' | 'GENERAL';
    channel: 'EMAIL' | 'SMS' | 'PUSH' | 'IN_APP';
    subject?: string;
    content: string;
    variables?: Array<{
      name: string;
      type: string;
      description: string;
      required: boolean;
      defaultValue?: string;
    }>;
    isActive?: boolean;
  }): Promise<any> {
    return this.HttpClient.post<any>('/reminders/templates', templateData);
  }

  async updateReminderTemplate(templateId: string, updateData: {
    name?: string;
    description?: string;
    subject?: string;
    content?: string;
    variables?: Array<{
      name: string;
      type: string;
      description: string;
      required: boolean;
      defaultValue?: string;
    }>;
    isActive?: boolean;
  }): Promise<any> {
    return this.HttpClient.put<any>(`/reminders/templates/${templateId}`, updateData);
  }

  async deleteReminderTemplate(templateId: string): Promise<void> {
    return this.HttpClient.delete<void>(`/reminders/templates/${templateId}`);
  }

  async previewReminderTemplate(templateId: string, variables?: Record<string, any>): Promise<{
    subject?: string;
    content: string;
    renderedContent: string;
    variables: Record<string, any>;
  }> {
    return this.HttpClient.post<any>(`/reminders/templates/${templateId}/preview`, { variables });
  }

  async testReminderTemplate(templateId: string, testData: {
    recipient: string;
    variables?: Record<string, any>;
  }): Promise<{
    reminderId: string;
    status: 'SENT' | 'FAILED';
    sentAt?: string;
    error?: string;
  }> {
    return this.HttpClient.post<any>(`/reminders/templates/${templateId}/test`, testData);
  }

  
  async scheduleReminder(reminderData: {
    type: 'EMAIL' | 'SMS' | 'PUSH' | 'IN_APP';
    recipient: string;
    title?: string;
    message: string;
    scheduledAt: string;
    template?: string;
    variables?: Record<string, any>;
    metadata?: any;
    recurring?: {
      frequency: 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'YEARLY';
      interval: number;
      endDate?: string;
      daysOfWeek?: number[];
    };
  }): Promise<Reminder> {
    return this.HttpClient.post<Reminder>('/reminders/schedule', reminderData);
  }

  async getRecurringReminders(params?: {
    page?: number;
    limit?: number;
    status?: 'ACTIVE' | 'PAUSED' | 'COMPLETED';
  }): Promise<PaginatedResponse<{
    id: string;
    type: string;
    recipient: string;
    title?: string;
    message: string;
    recurring: {
      frequency: string;
      interval: number;
      endDate?: string;
      nextOccurrence: string;
      occurrences: number;
    };
    status: 'ACTIVE' | 'PAUSED' | 'COMPLETED';
    createdAt: string;
  }>> {
    return this.HttpClient.get<PaginatedResponse<any>>('/reminders/recurring', { params });
  }

  async pauseRecurringReminder(reminderId: string): Promise<void> {
    return this.HttpClient.post<void>(`/reminders/${reminderId}/pause`);
  }

  async resumeRecurringReminder(reminderId: string): Promise<void> {
    return this.HttpClient.post<void>(`/reminders/${reminderId}/resume`);
  }

  async cancelRecurringReminder(reminderId: string): Promise<void> {
    return this.HttpClient.post<void>(`/reminders/${reminderId}/cancel`);
  }

  
  async getReminderDelivery(reminderId: string): Promise<Array<{
    id: string;
    reminderId: string;
    attempt: number;
    status: 'PENDING' | 'SENT' | 'FAILED' | 'DELIVERED';
    channel: string;
    recipient: string;
    sentAt?: string;
    deliveredAt?: string;
    error?: string;
    response?: any;
  }>> {
    return this.HttpClient.get<any[]>(`/reminders/${reminderId}/delivery`);
  }

  async retryReminder(reminderId: string): Promise<{
    reminderId: string;
    status: 'SENT' | 'FAILED';
    sentAt?: string;
    error?: string;
  }> {
    return this.HttpClient.post<any>(`/reminders/${reminderId}/retry`);
  }

  
  async getReminderAnalytics(params?: {
    startDate?: string;
    endDate?: string;
    type?: string;
    channel?: string;
    status?: string;
  }): Promise<{
    totalReminders: number;
    sentReminders: number;
    failedReminders: number;
    pendingReminders: number;
    deliveryRate: number;
    openRate?: number;
    clickRate?: number;
    remindersByType: Record<string, {
      total: number;
      sent: number;
      failed: number;
      deliveryRate: number;
    }>;
    remindersByChannel: Record<string, {
      total: number;
      sent: number;
      failed: number;
      deliveryRate: number;
    }>;
    remindersByStatus: Record<string, {
      count: number;
      percentage: number;
    }>;
    dailyStats: Array<{
      date: string;
      total: number;
      sent: number;
      failed: number;
      deliveryRate: number;
    }>;
    topTemplates: Array<{
      templateId: string;
      templateName: string;
      usage: number;
      deliveryRate: number;
    }>;
  }> {
    return this.HttpClient.get<any>('/reminders/analytics', { params });
  }

  async getTemplateAnalytics(templateId: string, params?: {
    startDate?: string;
    endDate?: string;
  }): Promise<{
    templateId: string;
    templateName: string;
    totalUsage: number;
    sentCount: number;
    failedCount: number;
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
    return this.HttpClient.get<any>(`/reminders/templates/${templateId}/analytics`, { params });
  }

  
  async getAutomationRules(params?: {
    page?: number;
    limit?: number;
    isActive?: boolean;
  }): Promise<PaginatedResponse<{
    id: string;
    name: string;
    description?: string;
    trigger: {
      event: string;
      conditions: Array<{
        field: string;
        operator: string;
        value: any;
      }>;
    };
    actions: Array<{
      type: 'SEND_REMINDER' | 'CREATE_TASK' | 'UPDATE_STATUS';
      config: any;
    }>;
    isActive: boolean;
    priority: number;
    createdAt: string;
  }>> {
    return this.HttpClient.get<PaginatedResponse<any>>('/reminders/automation/rules', { params });
  }

  async createAutomationRule(ruleData: {
    name: string;
    description?: string;
    trigger: {
      event: string;
      conditions: Array<{
        field: string;
        operator: string;
        value: any;
      }>;
    };
    actions: Array<{
      type: 'SEND_REMINDER' | 'CREATE_TASK' | 'UPDATE_STATUS';
      config: any;
    }>;
    priority?: number;
    isActive?: boolean;
  }): Promise<any> {
    return this.HttpClient.post<any>('/reminders/automation/rules', ruleData);
  }

  async updateAutomationRule(ruleId: string, updateData: {
    name?: string;
    description?: string;
    trigger?: {
      event: string;
      conditions: Array<{
        field: string;
        operator: string;
        value: any;
      }>;
    };
    actions?: Array<{
      type: 'SEND_REMINDER' | 'CREATE_TASK' | 'UPDATE_STATUS';
      config: any;
    }>;
    priority?: number;
    isActive?: boolean;
  }): Promise<any> {
    return this.HttpClient.put<any>(`/reminders/automation/rules/${ruleId}`, updateData);
  }

  async deleteAutomationRule(ruleId: string): Promise<void> {
    return this.HttpClient.delete<void>(`/reminders/automation/rules/${ruleId}`);
  }

  async testAutomationRule(ruleId: string, testData?: any): Promise<{
    ruleId: string;
    testResult: 'TRIGGERED' | 'NOT_TRIGGERED';
    executedActions: Array<{
      type: string;
      success: boolean;
      result?: any;
      error?: string;
    }>;
    executionTime: number;
  }> {
    return this.HttpClient.post<any>(`/reminders/automation/rules/${ruleId}/test`, { testData });
  }

  
  async searchReminders(query: string, params?: {
    page?: number;
    limit?: number;
    type?: string;
    channel?: string;
    status?: string;
  }): Promise<PaginatedResponse<Reminder>> {
    return this.HttpClient.get<PaginatedResponse<Reminder>>('/reminders/search', {
      params: { q: query, ...params },
    });
  }

  
  async getReminderSettings(): Promise<{
    defaultChannel: 'EMAIL' | 'SMS' | 'PUSH' | 'IN_APP';
    defaultTemplate?: string;
    retryPolicy: {
      maxRetries: number;
      retryDelay: number;
      backoffMultiplier: number;
    };
    rateLimiting: {
      maxPerMinute: number;
      maxPerHour: number;
      maxPerDay: number;
    };
    scheduling: {
      timeZone: string;
      businessHours: {
        start: string;
        end: string;
        daysOfWeek: number[];
      };
      respectBusinessHours: boolean;
    };
    compliance: {
      requireConsent: boolean;
      consentMessage?: string;
      unsubscribeLink: boolean;
    };
  }> {
    return this.HttpClient.get<any>('/reminders/settings');
  }

  async updateReminderSettings(settings: {
    defaultChannel?: 'EMAIL' | 'SMS' | 'PUSH' | 'IN_APP';
    defaultTemplate?: string;
    retryPolicy?: {
      maxRetries?: number;
      retryDelay?: number;
      backoffMultiplier?: number;
    };
    rateLimiting?: {
      maxPerMinute?: number;
      maxPerHour?: number;
      maxPerDay?: number;
    };
    scheduling?: {
      timeZone?: string;
      businessHours?: {
        start: string;
        end: string;
        daysOfWeek: number[];
      };
      respectBusinessHours?: boolean;
    };
    compliance?: {
      requireConsent?: boolean;
      consentMessage?: string;
      unsubscribeLink?: boolean;
    };
  }): Promise<any> {
    return this.HttpClient.put<any>('/reminders/settings', settings);
  }

  
  async exportReminders(params?: {
    format?: 'csv' | 'excel' | 'json';
    startDate?: string;
    endDate?: string;
    type?: string;
    status?: string;
  }): Promise<Blob> {
   
    return this.HttpClient.getBlob('/reminders/export', params);
  }

  async importReminders(file: File, options?: {
    overwrite?: boolean;
    createMissing?: boolean;
    validateRecipients?: boolean;
    validateTemplates?: boolean;
  }): Promise<{
    imported: number;
    updated: number;
    skipped: number;
    errors: Array<{
      row: number;
      error: string;
      data: any;
    }>;
  }> {
    const formData = new FormData();
    formData.append('file', file);

    if (options) {
      Object.entries(options).forEach(([key, value]) => {
        formData.append(key, value.toString());
      });
    }

  
    return this.HttpClient.upload<any>('/reminders/import', formData);
  }
}