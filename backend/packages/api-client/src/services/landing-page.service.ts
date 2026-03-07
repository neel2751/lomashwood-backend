import { HttpClient } from '../utils/http';
import { PaginatedResponse } from '../types/api.types';

// ── Missing types (move to api.types.ts and re-export from there if preferred) ──

export interface LandingPage {
  id: string;
  title: string;
  slug: string;
  content: any;
  status: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
  campaign?: string;
  templateId?: string;
  featuredImage?: string;
  customDomain?: string;
  seo?: {
    title?: string;
    description?: string;
    keywords?: string[];
    ogTitle?: string;
    ogDescription?: string;
    ogImage?: string;
    canonicalUrl?: string;
    metaRobots?: string;
  };
  publishedAt?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface CreateLandingPageRequest {
  title: string;
  slug?: string;
  content?: any;
  status?: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
  campaign?: string;
  templateId?: string;
  featuredImage?: string;
  seo?: {
    title?: string;
    description?: string;
    keywords?: string[];
    ogTitle?: string;
    ogDescription?: string;
    ogImage?: string;
    canonicalUrl?: string;
    metaRobots?: string;
  };
}

export interface UpdateLandingPageRequest {
  title?: string;
  slug?: string;
  content?: any;
  status?: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
  campaign?: string;
  featuredImage?: string;
  seo?: {
    title?: string;
    description?: string;
    keywords?: string[];
    ogTitle?: string;
    ogDescription?: string;
    ogImage?: string;
    canonicalUrl?: string;
    metaRobots?: string;
  };
}

export interface LandingPageFilters {
  status?: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
  campaign?: string;
  templateId?: string;
  search?: string;
  startDate?: string;
  endDate?: string;
}

// ── Service ───────────────────────────────────────────────────────────────────

export class LandingPageService {
  constructor(private HttpClient: HttpClient) {}

  // ── Landing Page Management ──────────────────────────────────────────────────

  async getLandingPages(params?: LandingPageFilters & {
    page?: number;
    limit?: number;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  }): Promise<PaginatedResponse<LandingPage[]>> {
    return this.HttpClient.get<PaginatedResponse<LandingPage[]>>('/landing-pages', { params });
  }

  async getLandingPage(pageId: string): Promise<LandingPage> {
    return this.HttpClient.get<LandingPage>(`/landing-pages/${pageId}`);
  }

  async getLandingPageBySlug(slug: string): Promise<LandingPage> {
    return this.HttpClient.get<LandingPage>(`/landing-pages/slug/${slug}`);
  }

  async createLandingPage(pageData: CreateLandingPageRequest): Promise<LandingPage> {
    return this.HttpClient.post<LandingPage>('/landing-pages', pageData);
  }

  async updateLandingPage(pageId: string, updateData: UpdateLandingPageRequest): Promise<LandingPage> {
    return this.HttpClient.put<LandingPage>(`/landing-pages/${pageId}`, updateData);
  }

  async deleteLandingPage(pageId: string): Promise<void> {
    return this.HttpClient.delete<void>(`/landing-pages/${pageId}`);
  }

  async duplicateLandingPage(pageId: string, duplicationData: {
    title: string;
    slug: string;
    copyContent?: boolean;
    copySettings?: boolean;
  }): Promise<LandingPage> {
    return this.HttpClient.post<LandingPage>(`/landing-pages/${pageId}/duplicate`, duplicationData);
  }

  // ── Landing Page Templates ───────────────────────────────────────────────────

  async getLandingPageTemplates(params?: {
    page?: number;
    limit?: number;
    category?: string;
    industry?: string;
    purpose?: 'LEAD_GENERATION' | 'SALES' | 'EVENT' | 'PRODUCT_LAUNCH' | 'WEBINAR';
  }): Promise<PaginatedResponse<Array<{
    id: string;
    name: string;
    description?: string;
    category: string;
    industry: string;
    purpose: 'LEAD_GENERATION' | 'SALES' | 'EVENT' | 'PRODUCT_LAUNCH' | 'WEBINAR';
    thumbnail?: string;
    preview?: string;
    sections: Array<{ type: string; name: string; config: any }>;
    variables: Array<{ name: string; type: string; defaultValue?: any; required: boolean }>;
    conversionRate?: number;
    uses: number;
    isActive: boolean;
    createdAt: string;
  }>>> {
    return this.HttpClient.get<PaginatedResponse<any[]>>('/landing-pages/templates', { params });
  }

  async getLandingPageTemplate(templateId: string): Promise<{
    id: string;
    name: string;
    description?: string;
    category: string;
    industry: string;
    purpose: 'LEAD_GENERATION' | 'SALES' | 'EVENT' | 'PRODUCT_LAUNCH' | 'WEBINAR';
    thumbnail?: string;
    preview?: string;
    sections: Array<{ type: string; name: string; config: any }>;
    variables: Array<{ name: string; type: string; defaultValue?: any; required: boolean }>;
    conversionRate?: number;
    uses: number;
    isActive: boolean;
    createdAt: string;
  }> {
    return this.HttpClient.get<any>(`/landing-pages/templates/${templateId}`);
  }

  async createLandingPageFromTemplate(templateId: string, pageData: {
    title: string;
    slug: string;
    variables: Record<string, any>;
  }): Promise<LandingPage> {
    return this.HttpClient.post<LandingPage>(`/landing-pages/templates/${templateId}/create`, pageData);
  }

  // ── Landing Page Sections ────────────────────────────────────────────────────

  async getLandingPageSections(pageId: string): Promise<Array<{
    id: string;
    pageId: string;
    type: string;
    name: string;
    order: number;
    config: any;
    content: any;
    isActive: boolean;
    createdAt: string;
  }>> {
    return this.HttpClient.get<any[]>(`/landing-pages/${pageId}/sections`);
  }

  async addLandingPageSection(pageId: string, sectionData: {
    type: string;
    name: string;
    config: any;
    content: any;
    order?: number;
  }): Promise<any> {
    return this.HttpClient.post<any>(`/landing-pages/${pageId}/sections`, sectionData);
  }

  async updateLandingPageSection(pageId: string, sectionId: string, updateData: {
    type?: string;
    name?: string;
    config?: any;
    content?: any;
    order?: number;
    isActive?: boolean;
  }): Promise<any> {
    return this.HttpClient.put<any>(`/landing-pages/${pageId}/sections/${sectionId}`, updateData);
  }

  async deleteLandingPageSection(pageId: string, sectionId: string): Promise<void> {
    return this.HttpClient.delete<void>(`/landing-pages/${pageId}/sections/${sectionId}`);
  }

  async reorderLandingPageSections(pageId: string, sectionIds: string[]): Promise<void> {
    return this.HttpClient.post<void>(`/landing-pages/${pageId}/sections/reorder`, { sectionIds });
  }

  // ── Landing Page Components ──────────────────────────────────────────────────

  async getLandingPageComponents(): Promise<Array<{
    id: string;
    name: string;
    type: string;
    category: string;
    description?: string;
    icon?: string;
    configSchema: any;
    defaultConfig: any;
    isActive: boolean;
    createdAt: string;
  }>> {
    return this.HttpClient.get<any[]>('/landing-pages/components');
  }

  async getLandingPageComponent(componentId: string): Promise<{
    id: string;
    name: string;
    type: string;
    category: string;
    description?: string;
    icon?: string;
    configSchema: any;
    defaultConfig: any;
    isActive: boolean;
    createdAt: string;
  }> {
    return this.HttpClient.get<any>(`/landing-pages/components/${componentId}`);
  }

  // ── Landing Page Publishing ──────────────────────────────────────────────────

  async publishLandingPage(pageId: string, publishData?: {
    publishAt?: string;
    customDomain?: string;
    enableAnalytics?: boolean;
    enableAdblocking?: boolean;
  }): Promise<{
    pageId: string;
    status: 'PUBLISHED';
    publishedAt: string;
    url: string;
    customDomain?: string;
    analyticsEnabled: boolean;
  }> {
    return this.HttpClient.post<any>(`/landing-pages/${pageId}/publish`, publishData);
  }

  async unpublishLandingPage(pageId: string): Promise<LandingPage> {
    return this.HttpClient.post<LandingPage>(`/landing-pages/${pageId}/unpublish`);
  }

  async getLandingPageUrl(pageId: string, options?: {
    customDomain?: string;
    utmParams?: Record<string, string>;
  }): Promise<{
    url: string;
    previewUrl?: string;
    qrCode?: string;
  }> {
    return this.HttpClient.get<any>(`/landing-pages/${pageId}/url`, { params: options });
  }

  // ── Landing Page Analytics ───────────────────────────────────────────────────

  async getLandingPageAnalytics(pageId: string, params?: {
    startDate?: string;
    endDate?: string;
    granularity?: 'HOUR' | 'DAY' | 'WEEK' | 'MONTH';
  }): Promise<{
    pageId: string;
    title: string;
    overview: {
      visits: number;
      uniqueVisitors: number;
      conversions: number;
      conversionRate: number;
      bounceRate: number;
      averageTimeOnPage: number;
      averageSessionDuration: number;
    };
    traffic: {
      sources: Array<{ source: string; visits: number; conversions: number; conversionRate: number }>;
      devices: Array<{ device: string; visits: number; conversions: number; conversionRate: number }>;
      browsers: Array<{ browser: string; visits: number; conversions: number; conversionRate: number }>;
      locations: Array<{ country: string; visits: number; conversions: number; conversionRate: number }>;
    };
    conversions: {
      total: number;
      rate: number;
      value: number;
      bySource: Record<string, { count: number; rate: number; value: number }>;
      funnel: Array<{ step: string; visitors: number; dropOff: number; conversionRate: number }>;
    };
    performance: {
      loadTime: number;
      firstContentfulPaint: number;
      largestContentfulPaint: number;
      cumulativeLayoutShift: number;
      firstInputDelay: number;
    };
    timeSeries: Array<{
      date: string;
      visits: number;
      uniqueVisitors: number;
      conversions: number;
      conversionRate: number;
      bounceRate: number;
    }>;
    goals: Array<{
      id: string;
      name: string;
      type: 'FORM_SUBMISSION' | 'CLICK' | 'PAGE_VIEW' | 'SCROLL';
      conversions: number;
      conversionRate: number;
      value: number;
    }>;
  }> {
    return this.HttpClient.get<any>(`/landing-pages/${pageId}/analytics`, { params });
  }

  async getLandingPageHeatmap(pageId: string, params?: {
    startDate?: string;
    endDate?: string;
    type?: 'CLICKS' | 'MOVEMENTS' | 'SCROLLS';
  }): Promise<{
    pageId: string;
    type: string;
    heatmapData: Array<{ x: number; y: number; intensity: number }>;
    clicks?: Array<{ x: number; y: number; element?: string; timestamp: string }>;
    scrollDepth: Array<{ depth: number; percentage: number }>;
    generatedAt: string;
  }> {
    return this.HttpClient.get<any>(`/landing-pages/${pageId}/heatmap`, { params });
  }

  // ── Landing Page Forms ───────────────────────────────────────────────────────

  async getLandingPageForms(pageId: string): Promise<Array<{
    id: string;
    pageId: string;
    name: string;
    type: 'CONTACT' | 'LEAD' | 'SURVEY' | 'REGISTRATION';
    config: any;
    fields: Array<{
      name: string;
      type: string;
      label: string;
      required: boolean;
      options?: string[];
    }>;
    isActive: boolean;
    createdAt: string;
  }>> {
    return this.HttpClient.get<any[]>(`/landing-pages/${pageId}/forms`);
  }

  async addLandingPageForm(pageId: string, formData: {
    name: string;
    type: 'CONTACT' | 'LEAD' | 'SURVEY' | 'REGISTRATION';
    config: any;
    fields: Array<{
      name: string;
      type: string;
      label: string;
      required: boolean;
      options?: string[];
    }>;
  }): Promise<any> {
    return this.HttpClient.post<any>(`/landing-pages/${pageId}/forms`, formData);
  }

  async getFormSubmissions(pageId: string, formId: string, params?: {
    page?: number;
    limit?: number;
    startDate?: string;
    endDate?: string;
  }): Promise<PaginatedResponse<Array<{
    id: string;
    formId: string;
    pageId: string;
    data: Record<string, any>;
    userAgent?: string;
    ip?: string;
    referrer?: string;
    utmParams?: Record<string, string>;
    submittedAt: string;
  }>>> {
    return this.HttpClient.get<PaginatedResponse<any[]>>(`/landing-pages/${pageId}/forms/${formId}/submissions`, { params });
  }

  // ── Landing Page A/B Testing ─────────────────────────────────────────────────

  async getLandingPageTests(pageId: string): Promise<Array<{
    id: string;
    pageId: string;
    name: string;
    description?: string;
    status: 'DRAFT' | 'RUNNING' | 'COMPLETED' | 'PAUSED';
    variants: Array<{
      id: string;
      name: string;
      traffic: number;
      conversions: number;
      conversionRate: number;
      isControl: boolean;
    }>;
    startDate?: string;
    endDate?: string;
    confidence: number;
    winner?: string;
    createdAt: string;
  }>> {
    return this.HttpClient.get<any[]>(`/landing-pages/${pageId}/tests`);
  }

  async createLandingPageTest(pageId: string, testData: {
    name: string;
    description?: string;
    variants: Array<{ name: string; changes: any }>;
    traffic: number;
    duration?: number;
    confidence: number;
  }): Promise<any> {
    return this.HttpClient.post<any>(`/landing-pages/${pageId}/tests`, testData);
  }

  async startLandingPageTest(pageId: string, testId: string): Promise<any> {
    return this.HttpClient.post<any>(`/landing-pages/${pageId}/tests/${testId}/start`);
  }

  async pauseLandingPageTest(pageId: string, testId: string): Promise<any> {
    return this.HttpClient.post<any>(`/landing-pages/${pageId}/tests/${testId}/pause`);
  }

  async stopLandingPageTest(pageId: string, testId: string): Promise<any> {
    return this.HttpClient.post<any>(`/landing-pages/${pageId}/tests/${testId}/stop`);
  }

  // ── Landing Page SEO ─────────────────────────────────────────────────────────

  async getLandingPageSeo(pageId: string): Promise<{
    pageId: string;
    title: string;
    description: string;
    keywords: string[];
    ogTitle?: string;
    ogDescription?: string;
    ogImage?: string;
    canonicalUrl?: string;
    metaRobots: string;
    structuredData: any;
    readabilityScore: number;
    seoScore: number;
    recommendations: Array<{
      type: 'ERROR' | 'WARNING' | 'INFO';
      message: string;
      suggestion: string;
    }>;
  }> {
    return this.HttpClient.get<any>(`/landing-pages/${pageId}/seo`);
  }

  async updateLandingPageSeo(pageId: string, seoData: {
    title?: string;
    description?: string;
    keywords?: string[];
    ogTitle?: string;
    ogDescription?: string;
    ogImage?: string;
    canonicalUrl?: string;
    metaRobots?: string;
  }): Promise<any> {
    return this.HttpClient.put<any>(`/landing-pages/${pageId}/seo`, seoData);
  }

  // ── Landing Page Integrations ────────────────────────────────────────────────

  async getLandingPageIntegrations(pageId: string): Promise<Array<{
    id: string;
    type: 'GOOGLE_ANALYTICS' | 'FACEBOOK_PIXEL' | 'GOOGLE_ADS' | 'EMAIL_MARKETING' | 'CRM';
    name: string;
    config: any;
    isActive: boolean;
    lastSync?: string;
  }>> {
    return this.HttpClient.get<any[]>(`/landing-pages/${pageId}/integrations`);
  }

  async addLandingPageIntegration(pageId: string, integrationData: {
    type: 'GOOGLE_ANALYTICS' | 'FACEBOOK_PIXEL' | 'GOOGLE_ADS' | 'EMAIL_MARKETING' | 'CRM';
    name: string;
    config: any;
  }): Promise<any> {
    return this.HttpClient.post<any>(`/landing-pages/${pageId}/integrations`, integrationData);
  }

  async updateLandingPageIntegration(pageId: string, integrationId: string, updateData: {
    name?: string;
    config?: any;
    isActive?: boolean;
  }): Promise<any> {
    return this.HttpClient.put<any>(`/landing-pages/${pageId}/integrations/${integrationId}`, updateData);
  }

  async deleteLandingPageIntegration(pageId: string, integrationId: string): Promise<void> {
    return this.HttpClient.delete<void>(`/landing-pages/${pageId}/integrations/${integrationId}`);
  }

  // ── Landing Page Preview ─────────────────────────────────────────────────────

  async previewLandingPage(pageId: string, previewData?: {
    content?: any;
    device?: 'DESKTOP' | 'TABLET' | 'MOBILE';
  }): Promise<{
    html: string;
    css?: string;
    js?: string;
    previewUrl?: string;
    expiresAt?: string;
  }> {
    return this.HttpClient.post<any>(`/landing-pages/${pageId}/preview`, previewData);
  }

  async getPreviewUrl(pageId: string, options?: {
    expires?: number;
    password?: string;
    device?: 'DESKTOP' | 'TABLET' | 'MOBILE';
  }): Promise<{
    url: string;
    expiresAt?: string;
    password?: string;
  }> {
    return this.HttpClient.get<any>(`/landing-pages/${pageId}/preview-url`, { params: options });
  }

  // ── Landing Page Search ──────────────────────────────────────────────────────

  async searchLandingPages(query: string, params?: {
    page?: number;
    limit?: number;
    status?: string;
    templateId?: string;
  }): Promise<PaginatedResponse<LandingPage[]>> {
    return this.HttpClient.get<PaginatedResponse<LandingPage[]>>('/landing-pages/search', {
      params: { q: query, ...params },
    });
  }

  // ── Landing Page Import / Export ─────────────────────────────────────────────

  async exportLandingPages(params?: {
    format?: 'JSON' | 'HTML' | 'ZIP';
    pageIds?: string[];
    includeContent?: boolean;
    includeAnalytics?: boolean;
  }): Promise<Blob> {
    return this.HttpClient.get<Blob>('/landing-pages/export', {
      params,
      responseType: 'blob',
    });
  }

  async importLandingPage(file: File, options?: {
    overwrite?: boolean;
    createMissing?: boolean;
    validateComponents?: boolean;
    publishImmediately?: boolean;
  }): Promise<{
    imported: number;
    updated: number;
    skipped: number;
    errors: Array<{ row: number; error: string; data: any }>;
  }> {
    const formData = new FormData();
    formData.append('file', file);

    if (options) {
      Object.entries(options).forEach(([key, value]) => {
        formData.append(key, value.toString());
      });
    }

    // Content-Type set automatically when passing FormData
    return this.HttpClient.post<any>('/landing-pages/import', formData);
  }

  // ── Landing Page Settings ────────────────────────────────────────────────────

  async getLandingPageSettings(): Promise<{
    general: {
      defaultTemplate?: string;
      allowComments: boolean;
      moderateComments: boolean;
      requireApproval: boolean;
      enableAnalytics: boolean;
    };
    seo: {
      defaultMetaDescription: string;
      defaultMetaKeywords: string[];
      autoGenerateSlugs: boolean;
      enableStructuredData: boolean;
    };
    publishing: {
      requireApproval: boolean;
      autoPublish: boolean;
      defaultDomain?: string;
    };
    security: {
      accessControl: boolean;
      ipWhitelist: string[];
      allowedRoles: string[];
    };
    performance: {
      enableCaching: boolean;
      cacheTimeout: number;
      enableCompression: boolean;
      enableMinification: boolean;
    };
  }> {
    return this.HttpClient.get<any>('/landing-pages/settings');
  }

  async updateLandingPageSettings(settings: {
    general?: {
      defaultTemplate?: string;
      allowComments?: boolean;
      moderateComments?: boolean;
      requireApproval?: boolean;
      enableAnalytics?: boolean;
    };
    seo?: {
      defaultMetaDescription?: string;
      defaultMetaKeywords?: string[];
      autoGenerateSlugs?: boolean;
      enableStructuredData?: boolean;
    };
    publishing?: {
      requireApproval?: boolean;
      autoPublish?: boolean;
      defaultDomain?: string;
    };
    security?: {
      accessControl?: boolean;
      ipWhitelist?: string[];
      allowedRoles?: string[];
    };
    performance?: {
      enableCaching?: boolean;
      cacheTimeout?: number;
      enableCompression?: boolean;
      enableMinification?: boolean;
    };
  }): Promise<any> {
    return this.HttpClient.put<any>('/landing-pages/settings', settings);
  }
}