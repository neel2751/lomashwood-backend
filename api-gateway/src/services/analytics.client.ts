import axios, { AxiosInstance, AxiosError } from 'axios';
import { config } from '../config';
import { logger } from '../utils/logger';
import { ServiceError } from '../utils/errors';

interface TrackingEvent {
  id: string;
  eventName: string;
  eventType: 'PAGE_VIEW' | 'CLICK' | 'FORM_SUBMIT' | 'PURCHASE' | 'CUSTOM';
  userId?: string;
  sessionId: string;
  properties: Record<string, any>;
  timestamp: Date;
  userAgent?: string;
  ipAddress?: string;
  referrer?: string;
  url: string;
}

interface Session {
  id: string;
  sessionId: string;
  userId?: string;
  startTime: Date;
  endTime?: Date;
  duration?: number;
  pageViews: number;
  events: number;
  device: string;
  browser: string;
  os: string;
  country?: string;
  city?: string;
}

interface Funnel {
  id: string;
  name: string;
  steps: Array<{
    name: string;
    eventName: string;
    order: number;
  }>;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

interface FunnelAnalysis {
  funnelId: string;
  funnelName: string;
  totalUsers: number;
  steps: Array<{
    stepName: string;
    users: number;
    completionRate: number;
    dropoffRate: number;
    averageTime: number;
  }>;
  overallConversionRate: number;
  createdAt: Date;
}

interface Dashboard {
  id: string;
  name: string;
  description?: string;
  widgets: Array<{
    id: string;
    type: 'CHART' | 'TABLE' | 'METRIC' | 'FUNNEL';
    title: string;
    config: Record<string, any>;
    position: { x: number; y: number; w: number; h: number };
  }>;
  isDefault: boolean;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

interface MetricData {
  metric: string;
  value: number;
  change?: number;
  changePercentage?: number;
  trend?: 'UP' | 'DOWN' | 'STABLE';
  timestamp: Date;
}

interface ReportData {
  name: string;
  type: 'SUMMARY' | 'DETAILED' | 'COMPARISON';
  dateRange: {
    from: Date;
    to: Date;
  };
  data: Record<string, any>;
  charts?: Array<{
    type: string;
    title: string;
    data: any;
  }>;
  generatedAt: Date;
}

interface TrackEventDto {
  eventName: string;
  eventType: 'PAGE_VIEW' | 'CLICK' | 'FORM_SUBMIT' | 'PURCHASE' | 'CUSTOM';
  userId?: string;
  sessionId: string;
  properties?: Record<string, any>;
  url: string;
  referrer?: string;
  userAgent?: string;
  ipAddress?: string;
}

interface CreateFunnelDto {
  name: string;
  steps: Array<{
    name: string;
    eventName: string;
    order: number;
  }>;
  isActive?: boolean;
}

interface UpdateFunnelDto {
  name?: string;
  steps?: Array<{
    name: string;
    eventName: string;
    order: number;
  }>;
  isActive?: boolean;
}

interface CreateDashboardDto {
  name: string;
  description?: string;
  widgets: Array<{
    type: 'CHART' | 'TABLE' | 'METRIC' | 'FUNNEL';
    title: string;
    config: Record<string, any>;
    position: { x: number; y: number; w: number; h: number };
  }>;
  isDefault?: boolean;
}

interface UpdateDashboardDto {
  name?: string;
  description?: string;
  widgets?: Array<{
    id?: string;
    type: 'CHART' | 'TABLE' | 'METRIC' | 'FUNNEL';
    title: string;
    config: Record<string, any>;
    position: { x: number; y: number; w: number; h: number };
  }>;
  isDefault?: boolean;
}

interface AnalyticsQuery {
  startDate?: Date;
  endDate?: Date;
  groupBy?: 'hour' | 'day' | 'week' | 'month';
  filters?: Record<string, any>;
  metrics?: string[];
  dimensions?: string[];
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

interface ExportRequest {
  reportType: 'EVENTS' | 'SESSIONS' | 'FUNNEL' | 'CUSTOM';
  format: 'CSV' | 'JSON' | 'XLSX' | 'PDF';
  dateRange: {
    from: Date;
    to: Date;
  };
  filters?: Record<string, any>;
}

interface ExportResponse {
  id: string;
  status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
  downloadUrl?: string;
  expiresAt?: Date;
}

interface PageViewStats {
  totalPageViews: number;
  uniquePageViews: number;
  averageTimeOnPage: number;
  bounceRate: number;
  topPages: Array<{
    url: string;
    views: number;
    uniqueViews: number;
  }>;
}

interface UserJourney {
  userId: string;
  sessionId: string;
  steps: Array<{
    eventName: string;
    timestamp: Date;
    properties: Record<string, any>;
  }>;
  duration: number;
  converted: boolean;
}

// Cast config to any to safely access endpoints that may not be typed in AppConfig
const appConfig = config as any;

export class AnalyticsServiceClient {
  private client: AxiosInstance;
  private readonly baseURL: string;
  private readonly timeout: number;
  private readonly maxRetries: number;

  constructor() {
    this.baseURL = appConfig.endpoints?.analytics?.url || appConfig.analyticsServiceUrl || 'http://localhost:3001';
    this.timeout = appConfig.endpoints?.analytics?.timeout || appConfig.analyticsServiceTimeout || 30000;
    this.maxRetries = 3;

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
      (config) => {
        const requestId = Math.random().toString(36).substring(7);
        config.headers['X-Request-ID'] = requestId;

        logger.info('Analytics service request', {
          requestId,
          method: config.method?.toUpperCase(),
          url: config.url,
        });

        return config;
      },
      (error) => {
        logger.error('Analytics service request error', { error });
        return Promise.reject(error);
      }
    );

    this.client.interceptors.response.use(
      (response) => {
        logger.info('Analytics service response', {
          requestId: response.config.headers['X-Request-ID'],
          status: response.status,
        });
        return response;
      },
      async (error: AxiosError) => {
        const requestId = error.config?.headers['X-Request-ID'];

        logger.error('Analytics service response error', {
          requestId,
          status: error.response?.status,
          message: error.message,
        });

        if (this.shouldRetry(error)) {
          return this.retryRequest(error);
        }

        throw this.handleError(error);
      }
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
    await new Promise(resolve => setTimeout(resolve, delay));

    logger.info('Retrying analytics service request', {
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

    return new ServiceError(
      message,
      status,
      'ANALYTICS_SERVICE_ERROR'
    );
  }

  async trackEvent(data: TrackEventDto): Promise<TrackingEvent> {
    const response = await this.client.post<TrackingEvent>('/tracking/events', data);
    return response.data;
  }

  async trackPageView(url: string, sessionId: string, userId?: string, referrer?: string): Promise<TrackingEvent> {
    return this.trackEvent({
      eventName: 'page_view',
      eventType: 'PAGE_VIEW',
      sessionId,
      userId,
      url,
      referrer,
    });
  }

  async getEvents(params?: PaginationParams & AnalyticsQuery): Promise<PaginatedResponse<TrackingEvent>> {
    const response = await this.client.get<PaginatedResponse<TrackingEvent>>('/tracking/events', { params });
    return response.data;
  }

  async getEvent(eventId: string): Promise<TrackingEvent> {
    const response = await this.client.get<TrackingEvent>(`/tracking/events/${eventId}`);
    return response.data;
  }

  async getUserEvents(userId: string, params?: PaginationParams): Promise<PaginatedResponse<TrackingEvent>> {
    const response = await this.client.get<PaginatedResponse<TrackingEvent>>(`/tracking/users/${userId}/events`, { params });
    return response.data;
  }

  async getSessionEvents(sessionId: string, params?: PaginationParams): Promise<PaginatedResponse<TrackingEvent>> {
    const response = await this.client.get<PaginatedResponse<TrackingEvent>>(`/tracking/sessions/${sessionId}/events`, { params });
    return response.data;
  }

  async getSessions(params?: PaginationParams & AnalyticsQuery): Promise<PaginatedResponse<Session>> {
    const response = await this.client.get<PaginatedResponse<Session>>('/tracking/sessions', { params });
    return response.data;
  }

  async getSession(sessionId: string): Promise<Session> {
    const response = await this.client.get<Session>(`/tracking/sessions/${sessionId}`);
    return response.data;
  }

  async getUserSessions(userId: string, params?: PaginationParams): Promise<PaginatedResponse<Session>> {
    const response = await this.client.get<PaginatedResponse<Session>>(`/tracking/users/${userId}/sessions`, { params });
    return response.data;
  }

  async createFunnel(data: CreateFunnelDto): Promise<Funnel> {
    const response = await this.client.post<Funnel>('/funnels', data);
    return response.data;
  }

  async getFunnels(params?: PaginationParams & { isActive?: boolean }): Promise<PaginatedResponse<Funnel>> {
    const response = await this.client.get<PaginatedResponse<Funnel>>('/funnels', { params });
    return response.data;
  }

  async getFunnel(funnelId: string): Promise<Funnel> {
    const response = await this.client.get<Funnel>(`/funnels/${funnelId}`);
    return response.data;
  }

  async updateFunnel(funnelId: string, data: UpdateFunnelDto): Promise<Funnel> {
    const response = await this.client.patch<Funnel>(`/funnels/${funnelId}`, data);
    return response.data;
  }

  async deleteFunnel(funnelId: string): Promise<void> {
    await this.client.delete(`/funnels/${funnelId}`);
  }

  async analyzeFunnel(funnelId: string, query?: AnalyticsQuery): Promise<FunnelAnalysis> {
    const response = await this.client.post<FunnelAnalysis>(`/funnels/${funnelId}/analyze`, query);
    return response.data;
  }

  async createDashboard(data: CreateDashboardDto): Promise<Dashboard> {
    const response = await this.client.post<Dashboard>('/dashboards', data);
    return response.data;
  }

  async getDashboards(params?: PaginationParams): Promise<PaginatedResponse<Dashboard>> {
    const response = await this.client.get<PaginatedResponse<Dashboard>>('/dashboards', { params });
    return response.data;
  }

  async getDashboard(dashboardId: string): Promise<Dashboard> {
    const response = await this.client.get<Dashboard>(`/dashboards/${dashboardId}`);
    return response.data;
  }

  async getDefaultDashboard(): Promise<Dashboard> {
    const response = await this.client.get<Dashboard>('/dashboards/default');
    return response.data;
  }

  async updateDashboard(dashboardId: string, data: UpdateDashboardDto): Promise<Dashboard> {
    const response = await this.client.patch<Dashboard>(`/dashboards/${dashboardId}`, data);
    return response.data;
  }

  async deleteDashboard(dashboardId: string): Promise<void> {
    await this.client.delete(`/dashboards/${dashboardId}`);
  }

  async getMetrics(query: AnalyticsQuery): Promise<MetricData[]> {
    const response = await this.client.post<MetricData[]>('/metrics', query);
    return response.data;
  }

  async getMetric(metricName: string, query?: AnalyticsQuery): Promise<MetricData> {
    const response = await this.client.post<MetricData>(`/metrics/${metricName}`, query);
    return response.data;
  }

  async generateReport(query: AnalyticsQuery & { reportType: string }): Promise<ReportData> {
    const response = await this.client.post<ReportData>('/reports/generate', query);
    return response.data;
  }

  async exportData(request: ExportRequest): Promise<ExportResponse> {
    const response = await this.client.post<ExportResponse>('/exports', request);
    return response.data;
  }

  async getExportStatus(exportId: string): Promise<ExportResponse> {
    const response = await this.client.get<ExportResponse>(`/exports/${exportId}`);
    return response.data;
  }

  async getPageViewStats(query?: AnalyticsQuery): Promise<PageViewStats> {
    const response = await this.client.post<PageViewStats>('/stats/pageviews', query);
    return response.data;
  }

  async getUserJourney(userId: string, sessionId?: string): Promise<UserJourney> {
    const params = sessionId ? { sessionId } : undefined;
    const response = await this.client.get<UserJourney>(`/journey/${userId}`, { params });
    return response.data;
  }

  async getConversionRate(query: AnalyticsQuery): Promise<{ rate: number; total: number; converted: number }> {
    const response = await this.client.post<{ rate: number; total: number; converted: number }>('/stats/conversion', query);
    return response.data;
  }

  async getTopProducts(query?: AnalyticsQuery & { limit?: number }): Promise<Array<{ productId: string; views: number; clicks: number; conversions: number }>> {
    const response = await this.client.post<Array<{ productId: string; views: number; clicks: number; conversions: number }>>('/stats/top-products', query);
    return response.data;
  }

  async getTopPages(query?: AnalyticsQuery & { limit?: number }): Promise<Array<{ url: string; views: number; uniqueViews: number; avgTime: number }>> {
    const response = await this.client.post<Array<{ url: string; views: number; uniqueViews: number; avgTime: number }>>('/stats/top-pages', query);
    return response.data;
  }

  async getRealTimeStats(): Promise<{ activeUsers: number; currentPageViews: number; topPages: string[] }> {
    const response = await this.client.get<{ activeUsers: number; currentPageViews: number; topPages: string[] }>('/stats/realtime');
    return response.data;
  }

  async healthCheck(): Promise<{ status: string; timestamp: Date }> {
    const response = await this.client.get('/health');
    return response.data;
  }
}

export const analyticsServiceClient = new AnalyticsServiceClient();