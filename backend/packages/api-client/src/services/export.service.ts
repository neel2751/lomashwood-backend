import { HttpClient } from '../utils/http';
import { PaginatedResponse } from '../types/api.types';

// ── Missing types (move to api.types.ts and re-export from there if preferred) ──

export interface Export {
  id: string;
  name: string;
  description?: string;
  type: string;
  category?: string;
  dataSource: string;
  format: string;
  status: 'ACTIVE' | 'INACTIVE';
  config: {
    fields?: Array<{
      name: string;
      type: string;
      label: string;
      required: boolean;
      format?: string;
    }>;
    filters?: Record<string, any>;
    options?: Record<string, any>;
  };
  createdAt: string;
  updatedAt?: string;
}

export interface CreateExportRequest {
  name: string;
  description?: string;
  type: string;
  category?: string;
  dataSource: string;
  format: string;
  status?: 'ACTIVE' | 'INACTIVE';
  config?: {
    fields?: Array<{
      name: string;
      type: string;
      label: string;
      required: boolean;
      format?: string;
    }>;
    filters?: Record<string, any>;
    options?: Record<string, any>;
  };
}

export interface UpdateExportRequest {
  name?: string;
  description?: string;
  type?: string;
  category?: string;
  dataSource?: string;
  format?: string;
  status?: 'ACTIVE' | 'INACTIVE';
  config?: {
    fields?: Array<{
      name: string;
      type: string;
      label: string;
      required: boolean;
      format?: string;
    }>;
    filters?: Record<string, any>;
    options?: Record<string, any>;
  };
}

export interface ExportFilters {
  search?: string;
  type?: string;
  category?: string;
  status?: 'ACTIVE' | 'INACTIVE';
  startDate?: string;
  endDate?: string;
}

// ── Service ───────────────────────────────────────────────────────────────────

export class ExportService {
  constructor(private HttpClient: HttpClient) {}

  // ── Export Management ────────────────────────────────────────────────────────

  async getExports(params?: ExportFilters & {
    page?: number;
    limit?: number;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  }): Promise<PaginatedResponse<Export[]>> {
    return this.HttpClient.get<PaginatedResponse<Export[]>>('/exports', { params });
  }

  async getExport(exportId: string): Promise<Export> {
    return this.HttpClient.get<Export>(`/exports/${exportId}`);
  }

  async createExport(exportData: CreateExportRequest): Promise<Export> {
    return this.HttpClient.post<Export>('/exports', exportData);
  }

  async updateExport(exportId: string, updateData: UpdateExportRequest): Promise<Export> {
    return this.HttpClient.put<Export>(`/exports/${exportId}`, updateData);
  }

  async deleteExport(exportId: string): Promise<void> {
    return this.HttpClient.delete<void>(`/exports/${exportId}`);
  }

  // ── Export Execution ─────────────────────────────────────────────────────────

  async executeExport(exportId: string, executionData?: {
    filters?: Record<string, any>;
    dateRange?: {
      startDate: string;
      endDate: string;
    };
    format?: 'CSV' | 'EXCEL' | 'PDF' | 'JSON' | 'XML';
    options?: Record<string, any>;
  }): Promise<{
    exportId: string;
    executionId: string;
    status: 'PENDING' | 'RUNNING' | 'COMPLETED' | 'FAILED' | 'CANCELLED';
    startedAt: string;
    estimatedCompletion?: string;
  }> {
    return this.HttpClient.post<any>(`/exports/${exportId}/execute`, executionData);
  }

  async getExportExecution(exportId: string, executionId: string): Promise<{
    exportId: string;
    executionId: string;
    status: 'PENDING' | 'RUNNING' | 'COMPLETED' | 'FAILED' | 'CANCELLED';
    progress?: number;
    startedAt: string;
    completedAt?: string;
    estimatedCompletion?: string;
    result?: {
      fileUrl: string;
      fileName: string;
      fileSize: number;
      recordCount: number;
      downloadUrl: string;
      expiresAt: string;
    };
    error?: string;
    logs: Array<{
      timestamp: string;
      level: 'INFO' | 'WARNING' | 'ERROR';
      message: string;
    }>;
  }> {
    return this.HttpClient.get<any>(`/exports/${exportId}/executions/${executionId}`);
  }

  async cancelExportExecution(exportId: string, executionId: string): Promise<any> {
    return this.HttpClient.post<any>(`/exports/${exportId}/executions/${executionId}/cancel`);
  }

  async retryExportExecution(exportId: string, executionId: string): Promise<any> {
    return this.HttpClient.post<any>(`/exports/${exportId}/executions/${executionId}/retry`);
  }

  // ── Export Templates ─────────────────────────────────────────────────────────

  async getExportTemplates(params?: {
    page?: number;
    limit?: number;
    type?: string;
    category?: string;
  }): Promise<PaginatedResponse<Array<{
    id: string;
    name: string;
    description?: string;
    type: string;
    category: string;
    config: {
      dataSource: string;
      fields: Array<{
        name: string;
        type: string;
        label: string;
        required: boolean;
        format?: string;
      }>;
      filters: Array<{
        name: string;
        type: string;
        label: string;
        defaultValue?: any;
      }>;
      format: string;
      options: Record<string, any>;
    };
    isActive: boolean;
    uses: number;
    createdAt: string;
  }>>> {
    return this.HttpClient.get<PaginatedResponse<any[]>>('/exports/templates', { params });
  }

  async getExportTemplate(templateId: string): Promise<{
    id: string;
    name: string;
    description?: string;
    type: string;
    category: string;
    config: {
      dataSource: string;
      fields: Array<{
        name: string;
        type: string;
        label: string;
        required: boolean;
        format?: string;
      }>;
      filters: Array<{
        name: string;
        type: string;
        label: string;
        defaultValue?: any;
      }>;
      format: string;
      options: Record<string, any>;
    };
    isActive: boolean;
    uses: number;
    createdAt: string;
  }> {
    return this.HttpClient.get<any>(`/exports/templates/${templateId}`);
  }

  async createExportTemplate(templateData: {
    name: string;
    description?: string;
    type: string;
    category: string;
    config: {
      dataSource: string;
      fields: Array<{
        name: string;
        type: string;
        label: string;
        required: boolean;
        format?: string;
      }>;
      filters: Array<{
        name: string;
        type: string;
        label: string;
        defaultValue?: any;
      }>;
      format: string;
      options: Record<string, any>;
    };
    isActive?: boolean;
  }): Promise<any> {
    return this.HttpClient.post<any>('/exports/templates', templateData);
  }

  async updateExportTemplate(templateId: string, updateData: {
    name?: string;
    description?: string;
    type?: string;
    category?: string;
    config?: {
      dataSource?: string;
      fields?: Array<{
        name: string;
        type: string;
        label: string;
        required: boolean;
        format?: string;
      }>;
      filters?: Array<{
        name: string;
        type: string;
        label: string;
        defaultValue?: any;
      }>;
      format?: string;
      options?: Record<string, any>;
    };
    isActive?: boolean;
  }): Promise<any> {
    return this.HttpClient.put<any>(`/exports/templates/${templateId}`, updateData);
  }

  async deleteExportTemplate(templateId: string): Promise<void> {
    return this.HttpClient.delete<void>(`/exports/templates/${templateId}`);
  }

  async executeExportTemplate(templateId: string, executionData: {
    filters?: Record<string, any>;
    dateRange?: {
      startDate: string;
      endDate: string;
    };
    format?: string;
    options?: Record<string, any>;
  }): Promise<{
    templateId: string;
    exportId: string;
    executionId: string;
    status: 'PENDING' | 'RUNNING' | 'COMPLETED' | 'FAILED' | 'CANCELLED';
    startedAt: string;
    estimatedCompletion?: string;
  }> {
    return this.HttpClient.post<any>(`/exports/templates/${templateId}/execute`, executionData);
  }

  // ── Export Scheduling ────────────────────────────────────────────────────────

  async getExportSchedules(params?: {
    page?: number;
    limit?: number;
    status?: 'ACTIVE' | 'INACTIVE' | 'PAUSED';
  }): Promise<PaginatedResponse<Array<{
    id: string;
    exportId: string;
    exportName: string;
    name: string;
    description?: string;
    schedule: {
      frequency: 'HOURLY' | 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'YEARLY' | 'CUSTOM';
      cronExpression?: string;
      timezone: string;
      nextRun: string;
    };
    config: {
      filters?: Record<string, any>;
      format?: string;
      options?: Record<string, any>;
      recipients: Array<{
        type: 'EMAIL' | 'WEBHOOK' | 'FTP';
        address: string;
        options?: Record<string, any>;
      }>;
    };
    status: 'ACTIVE' | 'INACTIVE' | 'PAUSED';
    lastRun?: string;
    nextRun?: string;
    createdAt: string;
  }>>> {
    return this.HttpClient.get<PaginatedResponse<any[]>>('/exports/schedules', { params });
  }

  async createExportSchedule(scheduleData: {
    exportId: string;
    name: string;
    description?: string;
    schedule: {
      frequency: 'HOURLY' | 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'YEARLY' | 'CUSTOM';
      cronExpression?: string;
      timezone: string;
    };
    config: {
      filters?: Record<string, any>;
      format?: string;
      options?: Record<string, any>;
      recipients: Array<{
        type: 'EMAIL' | 'WEBHOOK' | 'FTP';
        address: string;
        options?: Record<string, any>;
      }>;
    };
    isActive?: boolean;
  }): Promise<any> {
    return this.HttpClient.post<any>('/exports/schedules', scheduleData);
  }

  async updateExportSchedule(scheduleId: string, updateData: {
    name?: string;
    description?: string;
    schedule?: {
      frequency: 'HOURLY' | 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'YEARLY' | 'CUSTOM';
      cronExpression?: string;
      timezone: string;
    };
    config?: {
      filters?: Record<string, any>;
      format?: string;
      options?: Record<string, any>;
      recipients?: Array<{
        type: 'EMAIL' | 'WEBHOOK' | 'FTP';
        address: string;
        options?: Record<string, any>;
      }>;
    };
    status?: 'ACTIVE' | 'INACTIVE' | 'PAUSED';
  }): Promise<any> {
    return this.HttpClient.put<any>(`/exports/schedules/${scheduleId}`, updateData);
  }

  async deleteExportSchedule(scheduleId: string): Promise<void> {
    return this.HttpClient.delete<void>(`/exports/schedules/${scheduleId}`);
  }

  async pauseExportSchedule(scheduleId: string): Promise<any> {
    return this.HttpClient.post<any>(`/exports/schedules/${scheduleId}/pause`);
  }

  async resumeExportSchedule(scheduleId: string): Promise<any> {
    return this.HttpClient.post<any>(`/exports/schedules/${scheduleId}/resume`);
  }

  async runExportScheduleNow(scheduleId: string): Promise<any> {
    return this.HttpClient.post<any>(`/exports/schedules/${scheduleId}/run`);
  }

  // ── Export History ───────────────────────────────────────────────────────────

  async getExportHistory(params?: {
    page?: number;
    limit?: number;
    exportId?: string;
    status?: string;
    startDate?: string;
    endDate?: string;
  }): Promise<PaginatedResponse<Array<{
    id: string;
    exportId: string;
    exportName: string;
    executionId: string;
    status: 'PENDING' | 'RUNNING' | 'COMPLETED' | 'FAILED' | 'CANCELLED';
    startedAt: string;
    completedAt?: string;
    duration?: number;
    recordCount?: number;
    fileSize?: number;
    format?: string;
    downloadUrl?: string;
    expiresAt?: string;
    error?: string;
    triggeredBy: string;
    triggerType: 'MANUAL' | 'SCHEDULED' | 'API';
  }>>> {
    return this.HttpClient.get<PaginatedResponse<any[]>>('/exports/history', { params });
  }

  async getExportHistoryDetails(historyId: string): Promise<{
    id: string;
    exportId: string;
    exportName: string;
    executionId: string;
    status: 'PENDING' | 'RUNNING' | 'COMPLETED' | 'FAILED' | 'CANCELLED';
    startedAt: string;
    completedAt?: string;
    duration?: number;
    recordCount?: number;
    fileSize?: number;
    format?: string;
    downloadUrl?: string;
    expiresAt?: string;
    error?: string;
    triggeredBy: string;
    triggerType: 'MANUAL' | 'SCHEDULED' | 'API';
    config: {
      filters?: Record<string, any>;
      format?: string;
      options?: Record<string, any>;
    };
    logs: Array<{
      timestamp: string;
      level: 'INFO' | 'WARNING' | 'ERROR';
      message: string;
    }>;
    metrics: {
      recordsProcessed: number;
      recordsExported: number;
      recordsSkipped: number;
      processingTime: number;
      fileSize: number;
      compressionRatio?: number;
    };
  }> {
    return this.HttpClient.get<any>(`/exports/history/${historyId}`);
  }

  // ── Export Download ──────────────────────────────────────────────────────────

  async downloadExport(exportId: string, executionId: string): Promise<Blob> {
    return this.HttpClient.get<Blob>(`/exports/${exportId}/executions/${executionId}/download`, {
      responseType: 'blob',
    });
  }

  async getExportDownloadUrl(exportId: string, executionId: string): Promise<{
    url: string;
    expiresAt: string;
    fileName: string;
    fileSize: number;
  }> {
    return this.HttpClient.get<any>(`/exports/${exportId}/executions/${executionId}/download-url`);
  }

  // ── Export Analytics ─────────────────────────────────────────────────────────

  async getExportAnalytics(params?: {
    startDate?: string;
    endDate?: string;
    exportId?: string;
  }): Promise<{
    overview: {
      totalExports: number;
      successfulExports: number;
      failedExports: number;
      averageExecutionTime: number;
      totalRecordsExported: number;
      totalFileSize: number;
    };
    exportsByType: Record<string, {
      count: number;
      successRate: number;
      averageRecords: number;
      averageSize: number;
    }>;
    exportsByFormat: Record<string, {
      count: number;
      successRate: number;
      averageSize: number;
    }>;
    timeSeries: Array<{
      date: string;
      exports: number;
      successful: number;
      failed: number;
      records: number;
      size: number;
    }>;
    topExports: Array<{
      exportId: string;
      exportName: string;
      executions: number;
      successRate: number;
      totalRecords: number;
      averageSize: number;
    }>;
    errors: Array<{
      type: string;
      count: number;
      message: string;
      lastOccurred: string;
    }>;
    performance: {
      averageExecutionTime: number;
      fastestExecution: number;
      slowestExecution: number;
      executionTimeDistribution: Array<{
        range: string;
        count: number;
      }>;
    };
  }> {
    return this.HttpClient.get<any>('/exports/analytics', { params });
  }

  // ── Export Validation ────────────────────────────────────────────────────────

  async validateExportConfig(config: {
    dataSource: string;
    fields: Array<{
      name: string;
      type: string;
      label: string;
      required: boolean;
      format?: string;
    }>;
    filters?: Record<string, any>;
    format: string;
    options?: Record<string, any>;
  }): Promise<{
    valid: boolean;
    errors?: Array<{
      field: string;
      message: string;
      type: 'ERROR' | 'WARNING';
    }>;
    warnings?: Array<{
      field: string;
      message: string;
      type: 'ERROR' | 'WARNING';
    }>;
    suggestions?: Array<{
      field: string;
      message: string;
      improvement: string;
    }>;
    estimatedRecords?: number;
    estimatedSize?: number;
    estimatedTime?: number;
  }> {
    return this.HttpClient.post<any>('/exports/validate', config);
  }

  // ── Export Settings ──────────────────────────────────────────────────────────

  async getExportSettings(): Promise<{
    general: {
      maxConcurrentExports: number;
      maxExecutionTime: number;
      maxFileSize: number;
      defaultRetentionDays: number;
      enableCompression: boolean;
    };
    formats: {
      allowedFormats: string[];
      defaultFormat: string;
      csvDelimiter: string;
      excelTemplate?: string;
      pdfTemplate?: string;
    };
    scheduling: {
      enableScheduling: boolean;
      maxSchedulesPerExport: number;
      defaultTimezone: string;
      enableRetry: boolean;
      maxRetries: number;
    };
    notifications: {
      enableEmailNotifications: boolean;
      enableWebhookNotifications: boolean;
      notifyOnSuccess: boolean;
      notifyOnFailure: boolean;
      defaultRecipients: string[];
    };
    security: {
      requireAuthentication: boolean;
      allowedRoles: string[];
      encryptFiles: boolean;
      passwordProtected: boolean;
    };
  }> {
    return this.HttpClient.get<any>('/exports/settings');
  }

  async updateExportSettings(settings: {
    general?: {
      maxConcurrentExports?: number;
      maxExecutionTime?: number;
      maxFileSize?: number;
      defaultRetentionDays?: number;
      enableCompression?: boolean;
    };
    formats?: {
      allowedFormats?: string[];
      defaultFormat?: string;
      csvDelimiter?: string;
      excelTemplate?: string;
      pdfTemplate?: string;
    };
    scheduling?: {
      enableScheduling?: boolean;
      maxSchedulesPerExport?: number;
      defaultTimezone?: string;
      enableRetry?: boolean;
      maxRetries?: number;
    };
    notifications?: {
      enableEmailNotifications?: boolean;
      enableWebhookNotifications?: boolean;
      notifyOnSuccess?: boolean;
      notifyOnFailure?: boolean;
      defaultRecipients?: string[];
    };
    security?: {
      requireAuthentication?: boolean;
      allowedRoles?: string[];
      encryptFiles?: boolean;
      passwordProtected?: boolean;
    };
  }): Promise<any> {
    return this.HttpClient.put<any>('/exports/settings', settings);
  }

  // ── Export Search ────────────────────────────────────────────────────────────

  async searchExports(query: string, params?: {
    page?: number;
    limit?: number;
    type?: string;
    status?: string;
  }): Promise<PaginatedResponse<Export[]>> {
    return this.HttpClient.get<PaginatedResponse<Export[]>>('/exports/search', {
      params: { q: query, ...params },
    });
  }

  // ── Export Config Import / Export ────────────────────────────────────────────

  async exportExportConfigs(params?: {
    format?: 'JSON' | 'YAML';
    exportIds?: string[];
    includeTemplates?: boolean;
    includeSchedules?: boolean;
  }): Promise<Blob> {
    return this.HttpClient.get<Blob>('/exports/export-configs', {
      params,
      responseType: 'blob',
    });
  }

  async importExportConfigs(file: File, options?: {
    overwrite?: boolean;
    createMissing?: boolean;
    validateConfigs?: boolean;
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

    // Content-Type set automatically when passing FormData
    return this.HttpClient.post<any>('/exports/import-configs', formData);
  }
}