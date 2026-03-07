import { HttpClient } from '../utils/http';
import {
  PaginatedResponse,
} from '../types/api.types';
import {
  Event,
  TrackEventRequest as CreateEventRequest,
  Funnel,
  CreateFunnelRequest,
  UpdateFunnelRequest,
  AnalyticsDashboard as Dashboard,
  CreateDashboardRequest,
  UpdateDashboardRequest,
  DashboardWidget as Widget,
} from '../types/analytics.types';

// Define missing filter types
interface EventFilters {
  eventType?: string;
  eventName?: string;
  userId?: string;
  sessionId?: string;
  dateFrom?: string;
  dateTo?: string;
  properties?: Record<string, any>;
}

interface DashboardFilters {
  name?: string;
  isPublic?: boolean;
  createdBy?: string;
  dateFrom?: string;
  dateTo?: string;
}

interface WidgetFilters {
  dashboardId?: string;
  type?: string;
  title?: string;
  dateFrom?: string;
  dateTo?: string;
}

interface FunnelFilters {
  name?: string;
  isActive?: boolean;
  createdBy?: string;
  dateFrom?: string;
  dateTo?: string;
}

// Define missing widget request types
interface CreateWidgetRequest {
  dashboardId: string;
  type: 'metric' | 'chart' | 'table' | 'funnel' | 'list';
  title: string;
  query: Record<string, any>;
  config?: Record<string, any>;
  position: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
}

interface UpdateWidgetRequest {
  type?: 'metric' | 'chart' | 'table' | 'funnel' | 'list';
  title?: string;
  query?: Record<string, any>;
  config?: Record<string, any>;
  position?: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
}

export class AnalyticsService {
  constructor(private apiClient: HttpClient) {}

  // Event Tracking
  async trackEvent(eventData: CreateEventRequest): Promise<Event> {
    return this.apiClient.post<Event>('/analytics/events', eventData);
  }

  async trackBatchEvents(events: CreateEventRequest[]): Promise<Event[]> {
    return this.apiClient.post<Event[]>('/analytics/events/batch', { events });
  }

  async getEvents(params?: EventFilters & {
    page?: number;
    limit?: number;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  }): Promise<PaginatedResponse<Event[]>> {
    return this.apiClient.get<PaginatedResponse<Event[]>>('/analytics/events', { params });
  }

  async getEvent(eventId: string): Promise<Event> {
    return this.apiClient.get<Event>(`/analytics/events/${eventId}`);
  }

  async deleteEvent(eventId: string): Promise<void> {
    return this.apiClient.delete<void>(`/analytics/events/${eventId}`);
  }

  // Real-time Analytics
  async getRealTimeStats(params?: {
    timeframe?: '1m' | '5m' | '15m' | '30m' | '1h';
    metrics?: string[];
  }): Promise<{
    timestamp: string;
    metrics: Record<string, number>;
    events: Array<{
      type: string;
      count: number;
      timestamp: string;
    }>;
  }> {
    return this.apiClient.get<any>('/analytics/realtime', { params });
  }

  async getLiveUsers(): Promise<{
    total: number;
    active: number;
    users: Array<{
      id: string;
      lastSeen: string;
      currentUrl?: string;
      userAgent?: string;
      location?: string;
    }>;
  }> {
    return this.apiClient.get<any>('/analytics/live-users');
  }

  // Overview Stats
  async getOverviewStats(params?: {
    startDate?: string;
    endDate?: string;
    compareWith?: 'previous_period' | 'last_year' | 'custom';
    customCompareStart?: string;
    customCompareEnd?: string;
  }): Promise<{
    visitors: {
      current: number;
      previous?: number;
      change?: number;
      changePercent?: number;
    };
    pageViews: {
      current: number;
      previous?: number;
      change?: number;
      changePercent?: number;
    };
    sessions: {
      current: number;
      previous?: number;
      change?: number;
      changePercent?: number;
    };
    bounceRate: {
      current: number;
      previous?: number;
      change?: number;
      changePercent?: number;
    };
    avgSessionDuration: {
      current: number;
      previous?: number;
      change?: number;
      changePercent?: number;
    };
    conversionRate: {
      current: number;
      previous?: number;
      change?: number;
      changePercent?: number;
    };
  }> {
    return this.apiClient.get<any>('/analytics/overview', { params });
  }

  // Traffic Analytics
  async getTrafficAnalytics(params?: {
    startDate?: string;
    endDate?: string;
    granularity?: 'hour' | 'day' | 'week' | 'month';
  }): Promise<{
    pageViews: Array<{
      timestamp: string;
      count: number;
      unique: number;
    }>;
    visitors: Array<{
      timestamp: string;
      count: number;
      new: number;
      returning: number;
    }>;
    sessions: Array<{
      timestamp: string;
      count: number;
      avgDuration: number;
    }>;
    bounceRate: Array<{
      timestamp: string;
      rate: number;
    }>;
  }> {
    return this.apiClient.get<any>('/analytics/traffic', { params });
  }

  async getTopPages(params?: {
    startDate?: string;
    endDate?: string;
    limit?: number;
  }): Promise<Array<{
    url: string;
    title?: string;
    pageViews: number;
    uniqueViews: number;
    avgTimeOnPage: number;
    bounceRate: number;
    exitRate: number;
  }>> {
    return this.apiClient.get<any[]>('/analytics/top-pages', { params });
  }

  async getTrafficSources(params?: {
    startDate?: string;
    endDate?: string;
    limit?: number;
  }): Promise<Array<{
    source: string;
    medium?: string;
    campaign?: string;
    visitors: number;
    pageViews: number;
    sessions: number;
    conversionRate: number;
  }>> {
    return this.apiClient.get<any[]>('/analytics/traffic-sources', { params });
  }

  async getDeviceAnalytics(params?: {
    startDate?: string;
    endDate?: string;
  }): Promise<{
    devices: Array<{
      type: 'desktop' | 'mobile' | 'tablet';
      count: number;
      percentage: number;
    }>;
    browsers: Array<{
      name: string;
      version: string;
      count: number;
      percentage: number;
    }>;
    operatingSystems: Array<{
      name: string;
      version: string;
      count: number;
      percentage: number;
    }>;
    screenResolutions: Array<{
      width: number;
      height: number;
      count: number;
      percentage: number;
    }>;
  }> {
    return this.apiClient.get<any>('/analytics/devices', { params });
  }

  async getGeographicAnalytics(params?: {
    startDate?: string;
    endDate?: string;
    level?: 'country' | 'region' | 'city';
  }): Promise<{
    countries: Array<{
      code: string;
      name: string;
      visitors: number;
      pageViews: number;
      percentage: number;
    }>;
    regions?: Array<{
      country: string;
      name: string;
      visitors: number;
      pageViews: number;
      percentage: number;
    }>;
    cities?: Array<{
      country: string;
      name: string;
      visitors: number;
      pageViews: number;
      percentage: number;
    }>;
  }> {
    return this.apiClient.get<any>('/analytics/geography', { params });
  }

  // Conversion Analytics
  async getConversionAnalytics(params?: {
    startDate?: string;
    endDate?: string;
    funnelId?: string;
  }): Promise<{
    overallConversionRate: number;
    totalConversions: number;
    totalVisitors: number;
    revenue: number;
    averageOrderValue: number;
    conversionBySource: Array<{
      source: string;
      visitors: number;
      conversions: number;
      conversionRate: number;
      revenue: number;
    }>;
    conversionByDevice: Array<{
      device: string;
      visitors: number;
      conversions: number;
      conversionRate: number;
      revenue: number;
    }>;
  }> {
    return this.apiClient.get<any>('/analytics/conversions', { params });
  }

  // Dashboard Management
  async getDashboards(params?: DashboardFilters & {
    page?: number;
    limit?: number;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  }): Promise<PaginatedResponse<Dashboard[]>> {
    return this.apiClient.get<any>('/analytics/dashboards', { params });
  }

  async getDashboard(dashboardId: string): Promise<Dashboard> {
    return this.apiClient.get<Dashboard>(`/analytics/dashboards/${dashboardId}`);
  }

  async createDashboard(dashboardData: CreateDashboardRequest): Promise<Dashboard> {
    return this.apiClient.post<Dashboard>('/analytics/dashboards', dashboardData);
  }

  async updateDashboard(dashboardId: string, updateData: UpdateDashboardRequest): Promise<Dashboard> {
    return this.apiClient.put<Dashboard>(`/analytics/dashboards/${dashboardId}`, updateData);
  }

  async deleteDashboard(dashboardId: string): Promise<void> {
    return this.apiClient.delete<void>(`/analytics/dashboards/${dashboardId}`);
  }

  async duplicateDashboard(dashboardId: string, newName?: string): Promise<Dashboard> {
    return this.apiClient.post<Dashboard>(`/analytics/dashboards/${dashboardId}/duplicate`, { name: newName });
  }

  async getDashboardData(dashboardId: string, params?: {
    startDate?: string;
    endDate?: string;
    refresh?: boolean;
  }): Promise<{
    widgets: Array<{
      id: string;
      type: string;
      data: any;
      lastUpdated: string;
    }>;
    metadata: {
      generatedAt: string;
      dataRange: {
        start: string;
        end: string;
      };
    };
  }> {
    return this.apiClient.get<any>(`/analytics/dashboards/${dashboardId}/data`, { params });
  }

  // Widget Management
  async getWidgets(params?: WidgetFilters & {
    page?: number;
    limit?: number;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  }): Promise<PaginatedResponse<Widget[]>> {
    return this.apiClient.get<any>('/analytics/widgets', { params });
  }

  async getWidget(widgetId: string): Promise<Widget> {
    return this.apiClient.get<Widget>(`/analytics/widgets/${widgetId}`);
  }

  async createWidget(widgetData: CreateWidgetRequest): Promise<Widget> {
    return this.apiClient.post<Widget>('/analytics/widgets', widgetData);
  }

  async updateWidget(widgetId: string, updateData: UpdateWidgetRequest): Promise<Widget> {
    return this.apiClient.put<Widget>(`/analytics/widgets/${widgetId}`, updateData);
  }

  async deleteWidget(widgetId: string): Promise<void> {
    return this.apiClient.delete<void>(`/analytics/widgets/${widgetId}`);
  }

  async getWidgetData(widgetId: string, params?: {
    startDate?: string;
    endDate?: string;
    filters?: Record<string, any>;
  }): Promise<{
    data: any;
    metadata: {
      generatedAt: string;
      dataRange: {
        start: string;
        end: string;
      };
    };
  }> {
    return this.apiClient.get<any>(`/analytics/widgets/${widgetId}/data`, { params });
  }

  // Funnel Management
  async getFunnels(params?: FunnelFilters & {
    page?: number;
    limit?: number;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  }): Promise<PaginatedResponse<Funnel[]>> {
    return this.apiClient.get<any>('/analytics/funnels', { params });
  }

  async getFunnel(funnelId: string): Promise<Funnel> {
    return this.apiClient.get<Funnel>(`/analytics/funnels/${funnelId}`);
  }

  async createFunnel(funnelData: CreateFunnelRequest): Promise<Funnel> {
    return this.apiClient.post<Funnel>('/analytics/funnels', funnelData);
  }

  async updateFunnel(funnelId: string, updateData: UpdateFunnelRequest): Promise<Funnel> {
    return this.apiClient.put<Funnel>(`/analytics/funnels/${funnelId}`, updateData);
  }

  async deleteFunnel(funnelId: string): Promise<void> {
    return this.apiClient.delete<void>(`/analytics/funnels/${funnelId}`);
  }

  async getFunnelData(funnelId: string, params?: {
    startDate?: string;
    endDate?: string;
    granularity?: 'hour' | 'day' | 'week' | 'month';
  }): Promise<{
    steps: Array<{
      name: string;
      count: number;
      conversionRate: number;
      dropoffRate: number;
      avgTime: number;
    }>;
    overallConversionRate: number;
    data: Array<{
      timestamp: string;
      steps: Array<{
        name: string;
        count: number;
        conversionRate: number;
      }>;
    }>;
  }> {
    return this.apiClient.get<any>(`/analytics/funnels/${funnelId}/data`, { params });
  }

  // Custom Reports
  async getReports(params?: {
    page?: number;
    limit?: number;
    category?: string;
  }): Promise<PaginatedResponse<Array<{
    id: string;
    name: string;
    description?: string;
    category: string;
    createdAt: string;
    updatedAt: string;
    schedule?: string;
    lastRun?: string;
  }>>> {
    return this.apiClient.get<any>('/analytics/reports', { params });
  }

  async getReport(reportId: string): Promise<{
    id: string;
    name: string;
    description?: string;
    category: string;
    config: any;
    schedule?: string;
    lastRun?: string;
    createdAt: string;
    updatedAt: string;
  }> {
    return this.apiClient.get<any>(`/analytics/reports/${reportId}`);
  }

  async createReport(reportData: {
    name: string;
    description?: string;
    category: string;
    config: any;
    schedule?: string;
  }): Promise<any> {
    return this.apiClient.post<any>('/analytics/reports', reportData);
  }

  async updateReport(reportId: string, updateData: {
    name?: string;
    description?: string;
    category?: string;
    config?: any;
    schedule?: string;
  }): Promise<any> {
    return this.apiClient.put<any>(`/analytics/reports/${reportId}`, updateData);
  }

  async deleteReport(reportId: string): Promise<void> {
    return this.apiClient.delete<void>(`/analytics/reports/${reportId}`);
  }

  async generateReport(reportId: string, params?: {
    startDate?: string;
    endDate?: string;
    format?: 'json' | 'csv' | 'excel' | 'pdf';
  }): Promise<any> {
    return this.apiClient.post<any>(`/analytics/reports/${reportId}/generate`, params);
  }

  async scheduleReport(reportId: string, scheduleData: {
    schedule: string;
    recipients: string[];
    format?: 'json' | 'csv' | 'excel' | 'pdf';
  }): Promise<any> {
    return this.apiClient.post<any>(`/analytics/reports/${reportId}/schedule`, scheduleData);
  }

  // Goals and KPIs
  async getGoals(params?: {
    page?: number;
    limit?: number;
    active?: boolean;
  }): Promise<PaginatedResponse<Array<{
    id: string;
    name: string;
    description?: string;
    type: 'visitors' | 'pageViews' | 'conversions' | 'revenue' | 'custom';
    target: number;
    current: number;
    progress: number;
    unit: string;
    active: boolean;
    createdAt: string;
    deadline?: string;
  }>>> {
    return this.apiClient.get<any>('/analytics/goals', { params });
  }

  async createGoal(goalData: {
    name: string;
    description?: string;
    type: 'visitors' | 'pageViews' | 'conversions' | 'revenue' | 'custom';
    target: number;
    unit: string;
    deadline?: string;
    active?: boolean;
  }): Promise<any> {
    return this.apiClient.post<any>('/analytics/goals', goalData);
  }

  async updateGoal(goalId: string, updateData: {
    name?: string;
    description?: string;
    target?: number;
    unit?: string;
    deadline?: string;
    active?: boolean;
  }): Promise<any> {
    return this.apiClient.put<any>(`/analytics/goals/${goalId}`, updateData);
  }

  async deleteGoal(goalId: string): Promise<void> {
    return this.apiClient.delete<void>(`/analytics/goals/${goalId}`);
  }

  // Data Export
  async exportAnalytics(params?: {
    type?: 'events' | 'traffic' | 'conversions' | 'custom';
    format?: 'csv' | 'excel' | 'json';
    startDate?: string;
    endDate?: string;
    filters?: Record<string, any>;
  }): Promise<Blob> {
    return this.apiClient.getBlob('/analytics/export', params);
  }

  // Analytics Settings
  async getAnalyticsSettings(): Promise<{
    trackingEnabled: boolean;
    dataRetentionDays: number;
    anonymizeIp: boolean;
    cookieConsentRequired: boolean;
    customEvents: Array<{
      name: string;
      description?: string;
      parameters: Array<{
        name: string;
        type: 'string' | 'number' | 'boolean' | 'object';
        required: boolean;
      }>;
    }>;
    excludedUrls: string[];
    excludedIps: string[];
  }> {
    return this.apiClient.get<any>('/analytics/settings');
  }

  async updateAnalyticsSettings(settings: {
    trackingEnabled?: boolean;
    dataRetentionDays?: number;
    anonymizeIp?: boolean;
    cookieConsentRequired?: boolean;
    excludedUrls?: string[];
    excludedIps?: string[];
  }): Promise<any> {
    return this.apiClient.put<any>('/analytics/settings', settings);
  }

  // Heatmap Analytics
  async getHeatmapData(url: string, params?: {
    startDate?: string;
    endDate?: string;
    type?: 'click' | 'scroll' | 'attention';
  }): Promise<{
    type: string;
    url: string;
    data: Array<{
      x: number;
      y: number;
      intensity: number;
      count: number;
    }>;
    metadata: {
      totalClicks?: number;
      totalScrolls?: number;
      avgScrollDepth?: number;
      avgAttentionTime?: number;
    };
  }> {
    return this.apiClient.get<any>('/analytics/heatmap', {
      params: { url, ...params },
    });
  }

  // Session Recording
  async getSessionRecordings(params?: {
    page?: number;
    limit?: number;
    startDate?: string;
    endDate?: string;
    quality?: 'low' | 'medium' | 'high';
  }): Promise<PaginatedResponse<Array<{
    id: string;
    url: string;
    duration: number;
    startTime: string;
    endTime: string;
    userAgent: string;
    device: string;
    location?: string;
    quality: string;
  }>>> {
    return this.apiClient.get<any>('/analytics/session-recordings', { params });
  }

  async getSessionRecording(recordingId: string): Promise<{
    id: string;
    url: string;
    events: Array<{
      type: string;
      timestamp: number;
      data: any;
    }>;
    metadata: {
      duration: number;
      userAgent: string;
      device: string;
      resolution: string;
    };
  }> {
    return this.apiClient.get<any>(`/analytics/session-recordings/${recordingId}`);
  }

  // A/B Testing Analytics
  async getAbTestResults(testId: string, params?: {
    startDate?: string;
    endDate?: string;
  }): Promise<{
    testName: string;
    status: 'running' | 'completed' | 'paused';
    variants: Array<{
      id: string;
      name: string;
      traffic: number;
      conversions: number;
      conversionRate: number;
      revenue: number;
      statisticalSignificance: boolean;
      confidence: number;
    }>;
    winner?: {
      variantId: string;
      confidence: number;
      improvement: number;
    };
    metadata: {
      startDate: string;
      endDate?: string;
      totalParticipants: number;
    };
  }> {
    return this.apiClient.get<any>(`/analytics/ab-tests/${testId}`, { params });
  }
}
