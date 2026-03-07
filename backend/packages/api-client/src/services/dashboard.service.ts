import { HttpClient } from '../utils/http';
import { PaginatedResponse } from '../types/api.types';

// ── Missing types (move to api.types.ts and re-export from there if preferred) ──

export interface Dashboard {
  id: string;
  name: string;
  description?: string;
  category?: string;
  tags?: string[];
  layout: {
    columns: number;
    rows: number;
    gap: number;
  };
  theme?: 'LIGHT' | 'DARK' | 'AUTO';
  isPublic?: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt?: string;
}

export interface CreateDashboardRequest {
  name: string;
  description?: string;
  category?: string;
  tags?: string[];
  layout?: {
    columns?: number;
    rows?: number;
    gap?: number;
  };
  theme?: 'LIGHT' | 'DARK' | 'AUTO';
  isPublic?: boolean;
}

export interface UpdateDashboardRequest {
  name?: string;
  description?: string;
  category?: string;
  tags?: string[];
  layout?: {
    columns?: number;
    rows?: number;
    gap?: number;
  };
  theme?: 'LIGHT' | 'DARK' | 'AUTO';
  isPublic?: boolean;
  isActive?: boolean;
}

export interface DashboardFilters {
  search?: string;
  category?: string;
  tags?: string[];
  isPublic?: boolean;
  isActive?: boolean;
  startDate?: string;
  endDate?: string;
}

// ── Service ───────────────────────────────────────────────────────────────────

export class DashboardService {
  constructor(private HttpClient: HttpClient) {}

  // ── Dashboard Management ─────────────────────────────────────────────────────

  async getDashboards(params?: DashboardFilters & {
    page?: number;
    limit?: number;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  }): Promise<PaginatedResponse<Dashboard[]>> {
    return this.HttpClient.get<PaginatedResponse<Dashboard[]>>('/dashboards', { params });
  }

  async getDashboard(dashboardId: string): Promise<Dashboard> {
    return this.HttpClient.get<Dashboard>(`/dashboards/${dashboardId}`);
  }

  async createDashboard(dashboardData: CreateDashboardRequest): Promise<Dashboard> {
    return this.HttpClient.post<Dashboard>('/dashboards', dashboardData);
  }

  async updateDashboard(dashboardId: string, updateData: UpdateDashboardRequest): Promise<Dashboard> {
    return this.HttpClient.put<Dashboard>(`/dashboards/${dashboardId}`, updateData);
  }

  async deleteDashboard(dashboardId: string): Promise<void> {
    return this.HttpClient.delete<void>(`/dashboards/${dashboardId}`);
  }

  async duplicateDashboard(dashboardId: string, duplicationData: {
    name: string;
    copyWidgets?: boolean;
    copyLayout?: boolean;
  }): Promise<Dashboard> {
    return this.HttpClient.post<Dashboard>(`/dashboards/${dashboardId}/duplicate`, duplicationData);
  }

  // ── Dashboard Widgets ────────────────────────────────────────────────────────

  async getDashboardWidgets(dashboardId: string): Promise<Array<{
    id: string;
    dashboardId: string;
    type: 'CHART' | 'METRIC' | 'TABLE' | 'LIST' | 'TEXT' | 'IMAGE' | 'IFRAME';
    title: string;
    description?: string;
    config: any;
    position: {
      x: number;
      y: number;
      width: number;
      height: number;
    };
    dataSource: {
      type: string;
      query?: string;
      endpoint?: string;
      refreshInterval?: number;
    };
    permissions: {
      canView: boolean;
      canEdit: boolean;
      canDelete: boolean;
    };
    createdAt: string;
    updatedAt: string;
  }>> {
    return this.HttpClient.get<any[]>(`/dashboards/${dashboardId}/widgets`);
  }

  async addDashboardWidget(dashboardId: string, widgetData: {
    type: 'CHART' | 'METRIC' | 'TABLE' | 'LIST' | 'TEXT' | 'IMAGE' | 'IFRAME';
    title: string;
    description?: string;
    config: any;
    position: {
      x: number;
      y: number;
      width: number;
      height: number;
    };
    dataSource: {
      type: string;
      query?: string;
      endpoint?: string;
      refreshInterval?: number;
    };
  }): Promise<any> {
    return this.HttpClient.post<any>(`/dashboards/${dashboardId}/widgets`, widgetData);
  }

  async updateDashboardWidget(dashboardId: string, widgetId: string, updateData: {
    type?: 'CHART' | 'METRIC' | 'TABLE' | 'LIST' | 'TEXT' | 'IMAGE' | 'IFRAME';
    title?: string;
    description?: string;
    config?: any;
    position?: {
      x: number;
      y: number;
      width: number;
      height: number;
    };
    dataSource?: {
      type: string;
      query?: string;
      endpoint?: string;
      refreshInterval?: number;
    };
  }): Promise<any> {
    return this.HttpClient.put<any>(`/dashboards/${dashboardId}/widgets/${widgetId}`, updateData);
  }

  async deleteDashboardWidget(dashboardId: string, widgetId: string): Promise<void> {
    return this.HttpClient.delete<void>(`/dashboards/${dashboardId}/widgets/${widgetId}`);
  }

  async reorderDashboardWidgets(dashboardId: string, widgetOrder: Array<{
    id: string;
    position: {
      x: number;
      y: number;
      width: number;
      height: number;
    };
  }>): Promise<void> {
    return this.HttpClient.post<void>(`/dashboards/${dashboardId}/widgets/reorder`, { widgetOrder });
  }

  // ── Dashboard Data ───────────────────────────────────────────────────────────

  async getDashboardData(dashboardId: string, params?: {
    startDate?: string;
    endDate?: string;
    refresh?: boolean;
  }): Promise<{
    dashboardId: string;
    data: Record<string, any>;
    lastRefreshed: string;
    refreshInterval: number;
  }> {
    return this.HttpClient.get<any>(`/dashboards/${dashboardId}/data`, { params });
  }

  async getWidgetData(dashboardId: string, widgetId: string, params?: {
    startDate?: string;
    endDate?: string;
    filters?: Record<string, any>;
  }): Promise<{
    widgetId: string;
    data: any;
    metadata: {
      lastRefreshed: string;
      refreshInterval: number;
      dataSource: string;
    };
  }> {
    return this.HttpClient.get<any>(`/dashboards/${dashboardId}/widgets/${widgetId}/data`, { params });
  }

  async refreshDashboardData(dashboardId: string): Promise<{
    dashboardId: string;
    status: 'REFRESHING' | 'COMPLETED' | 'FAILED';
    refreshedAt?: string;
    error?: string;
  }> {
    return this.HttpClient.post<any>(`/dashboards/${dashboardId}/refresh`);
  }

  async refreshWidgetData(dashboardId: string, widgetId: string): Promise<{
    widgetId: string;
    status: 'REFRESHING' | 'COMPLETED' | 'FAILED';
    refreshedAt?: string;
    error?: string;
  }> {
    return this.HttpClient.post<any>(`/dashboards/${dashboardId}/widgets/${widgetId}/refresh`);
  }

  // ── Dashboard Templates ──────────────────────────────────────────────────────

  async getDashboardTemplates(params?: {
    page?: number;
    limit?: number;
    category?: string;
    industry?: string;
  }): Promise<PaginatedResponse<Array<{
    id: string;
    name: string;
    description?: string;
    category: string;
    industry: string;
    thumbnail?: string;
    widgets: Array<{
      type: string;
      title: string;
      config: any;
      position: any;
    }>;
    layout: {
      columns: number;
      rows: number;
      gap: number;
    };
    uses: number;
    isActive: boolean;
    createdAt: string;
  }>>> {
    return this.HttpClient.get<PaginatedResponse<any[]>>('/dashboards/templates', { params });
  }

  async createDashboardFromTemplate(templateId: string, dashboardData: {
    name: string;
    description?: string;
    variables?: Record<string, any>;
  }): Promise<Dashboard> {
    return this.HttpClient.post<Dashboard>(`/dashboards/templates/${templateId}/create`, dashboardData);
  }

  // ── Dashboard Sharing ────────────────────────────────────────────────────────

  async getDashboardShares(dashboardId: string): Promise<Array<{
    id: string;
    dashboardId: string;
    type: 'USER' | 'ROLE' | 'PUBLIC' | 'EMBED';
    recipient: string;
    recipientName?: string;
    permissions: {
      canView: boolean;
      canEdit: boolean;
      canShare: boolean;
      canExport: boolean;
    };
    expiresAt?: string;
    createdAt: string;
  }>> {
    return this.HttpClient.get<any[]>(`/dashboards/${dashboardId}/shares`);
  }

  async shareDashboard(dashboardId: string, shareData: {
    type: 'USER' | 'ROLE' | 'PUBLIC' | 'EMBED';
    recipient: string;
    permissions: {
      canView: boolean;
      canEdit: boolean;
      canShare: boolean;
      canExport: boolean;
    };
    expiresAt?: string;
  }): Promise<any> {
    return this.HttpClient.post<any>(`/dashboards/${dashboardId}/shares`, shareData);
  }

  async updateDashboardShare(dashboardId: string, shareId: string, updateData: {
    permissions?: {
      canView: boolean;
      canEdit: boolean;
      canShare: boolean;
      canExport: boolean;
    };
    expiresAt?: string;
  }): Promise<any> {
    return this.HttpClient.put<any>(`/dashboards/${dashboardId}/shares/${shareId}`, updateData);
  }

  async deleteDashboardShare(dashboardId: string, shareId: string): Promise<void> {
    return this.HttpClient.delete<void>(`/dashboards/${dashboardId}/shares/${shareId}`);
  }

  async getSharedDashboard(shareToken: string): Promise<{
    dashboard: Dashboard;
    widgets: Array<{
      id: string;
      type: string;
      title: string;
      config: any;
      position: any;
      data: any;
    }>;
    permissions: {
      canView: boolean;
      canEdit: boolean;
      canShare: boolean;
      canExport: boolean;
    };
    shareInfo: {
      sharedBy: string;
      sharedAt: string;
      expiresAt?: string;
    };
  }> {
    return this.HttpClient.get<any>(`/dashboards/shared/${shareToken}`);
  }

  // ── Dashboard Export ─────────────────────────────────────────────────────────

  async exportDashboard(dashboardId: string, exportData: {
    format: 'PDF' | 'PNG' | 'CSV' | 'EXCEL' | 'JSON';
    includeData?: boolean;
    dateRange?: {
      startDate: string;
      endDate: string;
    };
    widgets?: string[];
  }): Promise<Blob> {
    // responseType: 'blob' must be handled by the HttpClient interceptor;
    // pass only 2 args to stay within the HttpClient.post signature
    return this.HttpClient.post<Blob>(`/dashboards/${dashboardId}/export`, exportData);
  }

  async exportWidget(dashboardId: string, widgetId: string, exportData: {
    format: 'PDF' | 'PNG' | 'CSV' | 'EXCEL' | 'JSON';
    dateRange?: {
      startDate: string;
      endDate: string;
    };
  }): Promise<Blob> {
    return this.HttpClient.post<Blob>(`/dashboards/${dashboardId}/widgets/${widgetId}/export`, exportData);
  }

  // ── Dashboard Analytics ──────────────────────────────────────────────────────

  async getDashboardAnalytics(dashboardId: string, params?: {
    startDate?: string;
    endDate?: string;
  }): Promise<{
    dashboardId: string;
    views: number;
    uniqueViews: number;
    averageViewTime: number;
    interactions: number;
    shares: number;
    exports: number;
    topWidgets: Array<{
      widgetId: string;
      widgetName: string;
      views: number;
      interactions: number;
      averageViewTime: number;
    }>;
    timeSeries: Array<{
      date: string;
      views: number;
      uniqueViews: number;
      averageViewTime: number;
      interactions: number;
    }>;
    userSegments: Array<{
      segment: string;
      views: number;
      uniqueViews: number;
      averageViewTime: number;
    }>;
    deviceBreakdown: Array<{
      device: string;
      views: number;
      percentage: number;
    }>;
  }> {
    return this.HttpClient.get<any>(`/dashboards/${dashboardId}/analytics`, { params });
  }

  // ── Dashboard Subscriptions ──────────────────────────────────────────────────

  async getDashboardSubscriptions(dashboardId: string): Promise<Array<{
    id: string;
    dashboardId: string;
    userId: string;
    frequency: 'DAILY' | 'WEEKLY' | 'MONTHLY';
    format: 'PDF' | 'PNG' | 'CSV';
    recipients: string[];
    isActive: boolean;
    lastSent?: string;
    nextSend?: string;
    createdAt: string;
  }>> {
    return this.HttpClient.get<any[]>(`/dashboards/${dashboardId}/subscriptions`);
  }

  async createDashboardSubscription(dashboardId: string, subscriptionData: {
    frequency: 'DAILY' | 'WEEKLY' | 'MONTHLY';
    format: 'PDF' | 'PNG' | 'CSV';
    recipients: string[];
    isActive?: boolean;
  }): Promise<any> {
    return this.HttpClient.post<any>(`/dashboards/${dashboardId}/subscriptions`, subscriptionData);
  }

  async updateDashboardSubscription(dashboardId: string, subscriptionId: string, updateData: {
    frequency?: 'DAILY' | 'WEEKLY' | 'MONTHLY';
    format?: 'PDF' | 'PNG' | 'CSV';
    recipients?: string[];
    isActive?: boolean;
  }): Promise<any> {
    return this.HttpClient.put<any>(`/dashboards/${dashboardId}/subscriptions/${subscriptionId}`, updateData);
  }

  async deleteDashboardSubscription(dashboardId: string, subscriptionId: string): Promise<void> {
    return this.HttpClient.delete<void>(`/dashboards/${dashboardId}/subscriptions/${subscriptionId}`);
  }

  // ── Dashboard Alerts ─────────────────────────────────────────────────────────

  async getDashboardAlerts(dashboardId: string): Promise<Array<{
    id: string;
    dashboardId: string;
    widgetId: string;
    name: string;
    description?: string;
    condition: {
      metric: string;
      operator: 'GREATER_THAN' | 'LESS_THAN' | 'EQUALS' | 'NOT_EQUALS';
      value: number;
    };
    actions: Array<{
      type: 'EMAIL' | 'WEBHOOK' | 'SMS';
      config: any;
    }>;
    isActive: boolean;
    lastTriggered?: string;
    createdAt: string;
  }>> {
    return this.HttpClient.get<any[]>(`/dashboards/${dashboardId}/alerts`);
  }

  async createDashboardAlert(dashboardId: string, alertData: {
    widgetId: string;
    name: string;
    description?: string;
    condition: {
      metric: string;
      operator: 'GREATER_THAN' | 'LESS_THAN' | 'EQUALS' | 'NOT_EQUALS';
      value: number;
    };
    actions: Array<{
      type: 'EMAIL' | 'WEBHOOK' | 'SMS';
      config: any;
    }>;
    isActive?: boolean;
  }): Promise<any> {
    return this.HttpClient.post<any>(`/dashboards/${dashboardId}/alerts`, alertData);
  }

  async updateDashboardAlert(dashboardId: string, alertId: string, updateData: {
    name?: string;
    description?: string;
    condition?: {
      metric: string;
      operator: 'GREATER_THAN' | 'LESS_THAN' | 'EQUALS' | 'NOT_EQUALS';
      value: number;
    };
    actions?: Array<{
      type: 'EMAIL' | 'WEBHOOK' | 'SMS';
      config: any;
    }>;
    isActive?: boolean;
  }): Promise<any> {
    return this.HttpClient.put<any>(`/dashboards/${dashboardId}/alerts/${alertId}`, updateData);
  }

  async deleteDashboardAlert(dashboardId: string, alertId: string): Promise<void> {
    return this.HttpClient.delete<void>(`/dashboards/${dashboardId}/alerts/${alertId}`);
  }

  async testDashboardAlert(dashboardId: string, alertId: string): Promise<{
    alertId: string;
    status: 'TRIGGERED' | 'NOT_TRIGGERED';
    triggeredAt?: string;
    results?: Array<{
      action: string;
      success: boolean;
      result?: any;
      error?: string;
    }>;
  }> {
    return this.HttpClient.post<any>(`/dashboards/${dashboardId}/alerts/${alertId}/test`);
  }

  // ── Dashboard Search ─────────────────────────────────────────────────────────

  async searchDashboards(query: string, params?: {
    page?: number;
    limit?: number;
    category?: string;
    tags?: string[];
  }): Promise<PaginatedResponse<Dashboard[]>> {
    return this.HttpClient.get<PaginatedResponse<Dashboard[]>>('/dashboards/search', {
      params: { q: query, ...params },
    });
  }

  // ── Dashboard Favorites ──────────────────────────────────────────────────────

  async getDashboardFavorites(): Promise<Array<{
    id: string;
    dashboardId: string;
    dashboardName: string;
    addedAt: string;
  }>> {
    return this.HttpClient.get<any[]>('/dashboards/favorites');
  }

  async addToFavorites(dashboardId: string): Promise<void> {
    return this.HttpClient.post<void>(`/dashboards/${dashboardId}/favorites`);
  }

  async removeFromFavorites(dashboardId: string): Promise<void> {
    return this.HttpClient.delete<void>(`/dashboards/${dashboardId}/favorites`);
  }

  // ── Dashboard Settings ───────────────────────────────────────────────────────

  async getDashboardSettings(): Promise<{
    general: {
      defaultTheme: 'LIGHT' | 'DARK' | 'AUTO';
      defaultLayout: 'GRID' | 'MASONRY' | 'FREE';
      autoRefresh: boolean;
      refreshInterval: number;
    };
    sharing: {
      allowPublicSharing: boolean;
      allowEmbedding: boolean;
      defaultPermissions: {
        canView: boolean;
        canEdit: boolean;
        canShare: boolean;
        canExport: boolean;
      };
    };
    export: {
      allowedFormats: string[];
      maxExportSize: number;
      includeDataByDefault: boolean;
    };
    alerts: {
      enableEmailAlerts: boolean;
      enableWebhookAlerts: boolean;
      maxAlertsPerDashboard: number;
    };
    analytics: {
      enableViewTracking: boolean;
      enableInteractionTracking: boolean;
      dataRetentionDays: number;
    };
  }> {
    return this.HttpClient.get<any>('/dashboards/settings');
  }

  async updateDashboardSettings(settings: {
    general?: {
      defaultTheme?: 'LIGHT' | 'DARK' | 'AUTO';
      defaultLayout?: 'GRID' | 'MASONRY' | 'FREE';
      autoRefresh?: boolean;
      refreshInterval?: number;
    };
    sharing?: {
      allowPublicSharing?: boolean;
      allowEmbedding?: boolean;
      defaultPermissions?: {
        canView?: boolean;
        canEdit?: boolean;
        canShare?: boolean;
        canExport?: boolean;
      };
    };
    export?: {
      allowedFormats?: string[];
      maxExportSize?: number;
      includeDataByDefault?: boolean;
    };
    alerts?: {
      enableEmailAlerts?: boolean;
      enableWebhookAlerts?: boolean;
      maxAlertsPerDashboard?: number;
    };
    analytics?: {
      enableViewTracking?: boolean;
      enableInteractionTracking?: boolean;
      dataRetentionDays?: number;
    };
  }): Promise<any> {
    return this.HttpClient.put<any>('/dashboards/settings', settings);
  }

  // ── Dashboard Import / Export ────────────────────────────────────────────────

  async exportDashboards(params?: {
    dashboardIds?: string[];
    format?: 'JSON' | 'ZIP';
    includeData?: boolean;
    includeWidgets?: boolean;
  }): Promise<Blob> {
    return this.HttpClient.get<Blob>('/dashboards/export', {
      params,
      responseType: 'blob',
    });
  }

  async importDashboards(file: File, options?: {
    overwrite?: boolean;
    createMissing?: boolean;
    validateWidgets?: boolean;
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
    return this.HttpClient.post<any>('/dashboards/import', formData);
  }
}