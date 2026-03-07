import { HttpClient } from '../utils/http';
import {
  PaginatedResponse,
  BaseEntity,
  FilterParams,
} from '../types/api.types';

// Funnel types
export interface Funnel extends BaseEntity {
  name: string;
  description?: string;
  status: 'active' | 'inactive' | 'archived';
  type: 'lead' | 'sales' | 'onboarding' | 'conversion';
  steps: FunnelStep[];
  settings: FunnelSettings;
  analytics: FunnelAnalytics;
  createdBy: {
    id: string;
    name: string;
    email: string;
  };
  tags: Array<{
    id: string;
    name: string;
  }>;
  category?: string;
  priority: number;
  isTemplate: boolean;
  templateId?: string;
}

export interface FunnelStep extends BaseEntity {
  name: string;
  description?: string;
  type: 'landing' | 'form' | 'checkout' | 'thankyou' | 'redirect';
  order: number;
  config: FunnelStepConfig;
  conditions: FunnelStepCondition[];
  actions: FunnelStepAction[];
  analytics: FunnelStepAnalytics;
  isActive: boolean;
}

export interface FunnelStepConfig {
  url?: string;
  title?: string;
  content?: string;
  fields?: Array<{
    name: string;
    type: string;
    required: boolean;
    label?: string;
    placeholder?: string;
    options?: string[];
    validation?: {
      pattern?: string;
      minLength?: number;
      maxLength?: number;
      min?: number;
      max?: number;
    };
  }>;
  redirectUrl?: string;
  delay?: number;
  showProgress?: boolean;
  allowSkip?: boolean;
  customCss?: string;
  customJs?: string;
  metadata?: Record<string, any>;
}

export interface FunnelStepCondition {
  field: string;
  operator: 'equals' | 'not_equals' | 'contains' | 'not_contains' | 'greater_than' | 'less_than' | 'exists' | 'not_exists';
  value: any;
  logic?: 'and' | 'or';
}

export interface FunnelStepAction {
  type: 'redirect' | 'email' | 'webhook' | 'tag' | 'custom';
  config: {
    url?: string;
    email?: string;
    templateId?: string;
    webhookUrl?: string;
    tagIds?: string[];
    customCode?: string;
    delay?: number;
  };
}

export interface FunnelStepAnalytics {
  views: number;
  completions: number;
  dropoffs: number;
  avgTime: number;
  conversionRate: number;
  bounceRate: number;
  exitRate: number;
}

export interface FunnelSettings {
  tracking: {
    enableAnalytics: boolean;
    trackConversions: boolean;
    trackEvents: boolean;
    customEvents: string[];
  };
  appearance: {
    theme: string;
    colors: {
      primary: string;
      secondary: string;
      accent: string;
      background: string;
      text: string;
    };
    fonts: {
      primary: string;
      secondary: string;
    };
    layout: 'full_width' | 'centered' | 'split';
  };
  behavior: {
    allowBackward: boolean;
    allowSkip: boolean;
    showProgress: boolean;
    autoSave: boolean;
    sessionTimeout: number;
  };
  integrations: {
    emailProvider?: string;
    crm?: string;
    analytics?: string;
    webhooks: Array<{
      url: string;
      events: string[];
      headers?: Record<string, string>;
    }>;
  };
}

export interface FunnelAnalytics {
  totalViews: number;
  uniqueViews: number;
  totalConversions: number;
  conversionRate: number;
  avgTimeToComplete: number;
  dropoffRate: number;
  stepAnalytics: Array<{
    stepId: string;
    stepName: string;
    views: number;
    completions: number;
    dropoffs: number;
    avgTime: number;
    conversionRate: number;
  }>;
  trafficSources: Array<{
    source: string;
    visits: number;
    conversions: number;
    conversionRate: number;
  }>;
  deviceAnalytics: Array<{
    device: string;
    visits: number;
    conversions: number;
    conversionRate: number;
  }>;
  locationAnalytics: Array<{
    country: string;
    visits: number;
    conversions: number;
    conversionRate: number;
  }>;
  timeAnalytics: Array<{
    date: string;
    views: number;
    conversions: number;
    conversionRate: number;
  }>;
}

export interface CreateFunnelRequest {
  name: string;
  description?: string;
  type: 'lead' | 'sales' | 'onboarding' | 'conversion';
  steps?: Omit<FunnelStep, 'id' | 'createdAt' | 'updatedAt' | 'analytics'>[];
  settings?: Partial<FunnelSettings>;
  tagIds?: string[];
  category?: string;
  priority?: number;
  templateId?: string;
}

export interface UpdateFunnelRequest extends Partial<CreateFunnelRequest> {}

export interface FunnelFilters extends FilterParams {
  type?: string;
  status?: string;
  category?: string;
  createdBy?: string;
  tags?: string[];
  isTemplate?: boolean;
  priority?: number;
}

export interface FunnelSegment {
  id: string;
  name: string;
  description?: string;
  conditions: FunnelStepCondition[];
  userCount: number;
  conversionRate: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateFunnelSegmentRequest {
  name: string;
  description?: string;
  conditions: FunnelStepCondition[];
}

export interface UpdateFunnelSegmentRequest extends Partial<CreateFunnelSegmentRequest> {}

export interface UserJourney {
  id: string;
  userId?: string;
  sessionId: string;
  funnelId: string;
  funnelName: string;
  steps: Array<{
    stepId: string;
    stepName: string;
    enteredAt: string;
    exitedAt?: string;
    timeSpent: number;
    completed: boolean;
    data?: Record<string, any>;
  }>;
  converted: boolean;
  conversionAt?: string;
  totalTime: number;
  device: string;
  browser: string;
  os: string;
  location: {
    country?: string;
    city?: string;
    timezone?: string;
  };
  source: {
    utmSource?: string;
    utmMedium?: string;
    utmCampaign?: string;
    utmTerm?: string;
    utmContent?: string;
    referrer?: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface FunnelReport {
  id: string;
  funnelId: string;
  funnelName: string;
  type: 'performance' | 'conversion' | 'traffic' | 'custom';
  period: {
    startDate: string;
    endDate: string;
  };
  data: {
    summary: {
      totalViews: number;
      totalConversions: number;
      conversionRate: number;
      revenue?: number;
      avgTimeToComplete: number;
    };
    charts: Array<{
      type: 'line' | 'bar' | 'pie' | 'area';
      title: string;
      data: any;
    }>;
    tables: Array<{
      title: string;
      headers: string[];
      rows: any[][];
    }>;
  };
  generatedAt: string;
}

export class FunnelService {
  constructor(private apiClient: HttpClient) {}

  // Funnel Management
  async getFunnels(params?: FunnelFilters & {
    page?: number;
    limit?: number;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  }): Promise<PaginatedResponse<Funnel[]>> {
    return this.apiClient.get<PaginatedResponse<Funnel[]>>('/funnels', { params });
  }

  async getFunnel(funnelId: string): Promise<Funnel> {
    return this.apiClient.get<Funnel>(`/funnels/${funnelId}`);
  }

  async createFunnel(funnelData: CreateFunnelRequest): Promise<Funnel> {
    return this.apiClient.post<Funnel>('/funnels', funnelData);
  }

  async updateFunnel(funnelId: string, updateData: UpdateFunnelRequest): Promise<Funnel> {
    return this.apiClient.put<Funnel>(`/funnels/${funnelId}`, updateData);
  }

  async deleteFunnel(funnelId: string): Promise<void> {
    return this.apiClient.delete<void>(`/funnels/${funnelId}`);
  }

  async duplicateFunnel(funnelId: string, duplicationData: {
    name: string;
    description?: string;
    copyAnalytics?: boolean;
    copySettings?: boolean;
  }): Promise<Funnel> {
    return this.apiClient.post<Funnel>(`/funnels/${funnelId}/duplicate`, duplicationData);
  }

  // Funnel Steps
  async getFunnelSteps(funnelId: string): Promise<FunnelStep[]> {
    return this.apiClient.get<FunnelStep[]>(`/funnels/${funnelId}/steps`);
  }

  async addFunnelStep(funnelId: string, stepData: Omit<FunnelStep, 'id' | 'createdAt' | 'updatedAt' | 'analytics'>): Promise<FunnelStep> {
    return this.apiClient.post<FunnelStep>(`/funnels/${funnelId}/steps`, stepData);
  }

  async updateFunnelStep(funnelId: string, stepId: string, updateData: Partial<Omit<FunnelStep, 'id' | 'createdAt' | 'updatedAt' | 'analytics'>>): Promise<FunnelStep> {
    return this.apiClient.put<FunnelStep>(`/funnels/${funnelId}/steps/${stepId}`, updateData);
  }

  async deleteFunnelStep(funnelId: string, stepId: string): Promise<void> {
    return this.apiClient.delete<void>(`/funnels/${funnelId}/steps/${stepId}`);
  }

  async reorderFunnelSteps(funnelId: string, stepIds: string[]): Promise<void> {
    return this.apiClient.post<void>(`/funnels/${funnelId}/steps/reorder`, { stepIds });
  }

  // Funnel Analytics
  async getFunnelAnalytics(funnelId: string, params?: {
    startDate?: string;
    endDate?: string;
    granularity?: 'hour' | 'day' | 'week' | 'month';
    metrics?: string[];
  }): Promise<FunnelAnalytics> {
    return this.apiClient.get<FunnelAnalytics>(`/funnels/${funnelId}/analytics`, { params });
  }

  async getFunnelPerformance(funnelId: string, params?: {
    startDate?: string;
    endDate?: string;
    compareWith?: {
      startDate: string;
      endDate: string;
    };
  }): Promise<{
    current: {
      views: number;
      conversions: number;
      conversionRate: number;
      revenue?: number;
      avgTimeToComplete: number;
    };
    previous?: {
      views: number;
      conversions: number;
      conversionRate: number;
      revenue?: number;
      avgTimeToComplete: number;
    };
    change: {
      views: number;
      conversions: number;
      conversionRate: number;
      revenue?: number;
      avgTimeToComplete: number;
    };
  }> {
    return this.apiClient.get<any>(`/funnels/${funnelId}/performance`, { params });
  }

  // Funnel Segments
  async getFunnelSegments(funnelId: string): Promise<FunnelSegment[]> {
    return this.apiClient.get<FunnelSegment[]>(`/funnels/${funnelId}/segments`);
  }

  async createFunnelSegment(funnelId: string, segmentData: CreateFunnelSegmentRequest): Promise<FunnelSegment> {
    return this.apiClient.post<FunnelSegment>(`/funnels/${funnelId}/segments`, segmentData);
  }

  async updateFunnelSegment(funnelId: string, segmentId: string, updateData: UpdateFunnelSegmentRequest): Promise<FunnelSegment> {
    return this.apiClient.put<FunnelSegment>(`/funnels/${funnelId}/segments/${segmentId}`, updateData);
  }

  async deleteFunnelSegment(funnelId: string, segmentId: string): Promise<void> {
    return this.apiClient.delete<void>(`/funnels/${funnelId}/segments/${segmentId}`);
  }

  // User Journeys
  async getUserJourneys(funnelId: string, params?: {
    page?: number;
    limit?: number;
    startDate?: string;
    endDate?: string;
    status?: 'active' | 'completed' | 'dropped';
    device?: string;
    location?: string;
    source?: string;
  }): Promise<PaginatedResponse<UserJourney[]>> {
    return this.apiClient.get<PaginatedResponse<UserJourney[]>>(`/funnels/${funnelId}/journeys`, { params });
  }

  async getUserJourney(journeyId: string): Promise<UserJourney> {
    return this.apiClient.get<UserJourney>(`/journeys/${journeyId}`);
  }

  // Funnel Reports
  async generateFunnelReport(funnelId: string, params: {
    type: 'performance' | 'conversion' | 'traffic' | 'custom';
    period: {
      startDate: string;
      endDate: string;
    };
    format?: 'json' | 'pdf' | 'excel';
    includeCharts?: boolean;
    includeTables?: boolean;
    customMetrics?: string[];
  }): Promise<FunnelReport | Blob> {
    if (params.format === 'json') {
      return this.apiClient.get<FunnelReport>(`/funnels/${funnelId}/reports`, { params });
    } else {
      return this.apiClient.getBlob(`/funnels/${funnelId}/reports`, { params });
    }
  }

  // Funnel Search
  async searchFunnels(query: string, params?: {
    page?: number;
    limit?: number;
    filters?: {
      type?: string;
      status?: string;
      category?: string;
      tags?: string[];
    };
  }): Promise<PaginatedResponse<Funnel[]>> {
    return this.apiClient.get<PaginatedResponse<Funnel[]>>('/funnels/search', { 
      params: { query, ...params } 
    });
  }

  // Funnel Export/Import
  async exportFunnels(params?: {
    format?: 'json' | 'csv' | 'xlsx';
    filters?: {
      type?: string;
      status?: string;
      category?: string;
      tags?: string[];
      dateRange?: {
        startDate: string;
        endDate: string;
      };
    };
    includeAnalytics?: boolean;
    includeSettings?: boolean;
  }): Promise<Blob> {
    return this.apiClient.getBlob('/funnels/export', { params });
  }

  async importFunnel(file: File, options?: {
    overwrite?: boolean;
    updateExisting?: boolean;
    validateOnly?: boolean;
    createCategories?: boolean;
  }): Promise<{
    imported: number;
    updated: number;
    failed: number;
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
        formData.append(key, String(value));
      });
    }
    return this.apiClient.post<any>('/funnels/import', formData);
  }

  // Funnel Settings
  async getFunnelSettings(funnelId: string): Promise<FunnelSettings> {
    return this.apiClient.get<FunnelSettings>(`/funnels/${funnelId}/settings`);
  }

  async updateFunnelSettings(funnelId: string, settings: Partial<FunnelSettings>): Promise<FunnelSettings> {
    return this.apiClient.put<FunnelSettings>(`/funnels/${funnelId}/settings`, settings);
  }

  // Funnel Templates
  async getFunnelTemplates(params?: {
    page?: number;
    limit?: number;
    category?: string;
    type?: string;
    search?: string;
  }): Promise<PaginatedResponse<Funnel[]>> {
    return this.apiClient.get<PaginatedResponse<Funnel[]>>('/funnels/templates', { params });
  }

  async createFunnelFromTemplate(templateId: string, funnelData: CreateFunnelRequest): Promise<Funnel> {
    return this.apiClient.post<Funnel>(`/funnels/templates/${templateId}/create`, funnelData);
  }
}
