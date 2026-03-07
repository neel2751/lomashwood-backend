import { HttpClient } from '../utils/http';
import {
  PaginatedResponse,
  CmsPage,
  CreateCmsPageRequest,
  UpdateCmsPageRequest,
  CmsPageFilters,
} from '../types/api.types';

export class CmsPageService {
  constructor(private apiClient: HttpClient) {}

  // CMS Page Management
  async getCmsPages(params?: CmsPageFilters & {
    page?: number;
    limit?: number;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  }): Promise<PaginatedResponse<CmsPage[]>> {
    return this.apiClient.get<PaginatedResponse<CmsPage[]>>('/cms/pages', { params });
  }

  async getCmsPage(pageId: string): Promise<CmsPage> {
    return this.apiClient.get<CmsPage>(`/cms/pages/${pageId}`);
  }

  async getCmsPageBySlug(slug: string): Promise<CmsPage> {
    return this.apiClient.get<CmsPage>(`/cms/pages/slug/${slug}`);
  }

  async createCmsPage(pageData: CreateCmsPageRequest): Promise<CmsPage> {
    return this.apiClient.post<CmsPage>('/cms/pages', pageData);
  }

  async updateCmsPage(pageId: string, updateData: UpdateCmsPageRequest): Promise<CmsPage> {
    return this.apiClient.put<CmsPage>(`/cms/pages/${pageId}`, updateData);
  }

  async deleteCmsPage(pageId: string): Promise<void> {
    return this.apiClient.delete<void>(`/cms/pages/${pageId}`);
  }

  // Page Templates
  async getCmsPageTemplates(): Promise<Array<{
    id: string;
    name: string;
    description?: string;
    thumbnail?: string;
    category: string;
    sections: Array<{
      type: string;
      name: string;
      config: Record<string, any>;
    }>;
  }>> {
    return this.apiClient.get<Array<any>>('/cms/pages/templates');
  }

  async createCmsPageFromTemplate(templateId: string, pageData: CreateCmsPageRequest): Promise<CmsPage> {
    return this.apiClient.post<CmsPage>(`/cms/pages/templates/${templateId}`, pageData);
  }

  // Page Publishing
  async publishCmsPage(pageId: string): Promise<CmsPage> {
    return this.apiClient.post<CmsPage>(`/cms/pages/${pageId}/publish`, {});
  }

  async unpublishCmsPage(pageId: string): Promise<CmsPage> {
    return this.apiClient.post<CmsPage>(`/cms/pages/${pageId}/unpublish`, {});
  }

  async scheduleCmsPagePublish(pageId: string, publishDate: string): Promise<CmsPage> {
    return this.apiClient.post<CmsPage>(`/cms/pages/${pageId}/schedule`, { publishDate });
  }

  // Page Versions
  async getCmsPageVersions(pageId: string): Promise<Array<{
    id: string;
    version: number;
    status: 'draft' | 'published' | 'archived';
    createdAt: string;
    updatedAt: string;
    author: {
      id: string;
      name: string;
      email: string;
    };
    changes?: string;
  }>> {
    return this.apiClient.get<Array<any>>(`/cms/pages/${pageId}/versions`);
  }

  async getCmsPageVersion(pageId: string, versionId: string): Promise<CmsPage> {
    return this.apiClient.get<CmsPage>(`/cms/pages/${pageId}/versions/${versionId}`);
  }

  async createCmsPageVersion(pageId: string, pageData: CreateCmsPageRequest): Promise<CmsPage> {
    return this.apiClient.post<CmsPage>(`/cms/pages/${pageId}/versions`, pageData);
  }

  async restoreCmsPageVersion(pageId: string, versionId: string): Promise<CmsPage> {
    return this.apiClient.post<CmsPage>(`/cms/pages/${pageId}/versions/${versionId}/restore`, {});
  }

  // Page Analytics
  async getCmsPageAnalytics(pageId: string, params?: {
    startDate?: string;
    endDate?: string;
    metrics?: string[];
  }): Promise<{
    views: number;
    uniqueViews: number;
    avgTimeOnPage: number;
    bounceRate: number;
    conversions: number;
    conversionRate: number;
    topTrafficSources: Array<{
      source: string;
      visits: number;
      percentage: number;
    }>;
    pageViews: Array<{
      date: string;
      views: number;
      uniqueViews: number;
    }>;
  }> {
    return this.apiClient.get<any>(`/cms/pages/${pageId}/analytics`, { params });
  }

  // Page SEO
  async getCmsPageSeo(pageId: string): Promise<{
    title: string;
    description: string;
    keywords: string[];
    ogTitle?: string;
    ogDescription?: string;
    ogImage?: string;
    canonicalUrl?: string;
    metaRobots: string;
    structuredData: Record<string, any>;
  }> {
    return this.apiClient.get<any>(`/cms/pages/${pageId}/seo`);
  }

  async updateCmsPageSeo(pageId: string, seoData: {
    title?: string;
    description?: string;
    keywords?: string[];
    ogTitle?: string;
    ogDescription?: string;
    ogImage?: string;
    canonicalUrl?: string;
    metaRobots?: string;
    structuredData?: Record<string, any>;
  }): Promise<CmsPage> {
    return this.apiClient.put<CmsPage>(`/cms/pages/${pageId}/seo`, seoData);
  }

  // Page Search
  async searchCmsPages(query: string, params?: {
    page?: number;
    limit?: number;
    filters?: {
      category?: string;
      status?: string;
      author?: string;
      tags?: string[];
    };
  }): Promise<PaginatedResponse<CmsPage[]>> {
    return this.apiClient.get<PaginatedResponse<CmsPage[]>>('/cms/pages/search', { 
      params: { query, ...params } 
    });
  }

  // Page Export/Import
  async exportCmsPages(params?: {
    format?: 'json' | 'csv' | 'xml';
    filters?: {
      category?: string;
      status?: string;
      author?: string;
      dateRange?: {
        startDate: string;
        endDate: string;
      };
    };
  }): Promise<Blob> {
    return this.apiClient.getBlob('/cms/pages/export', { params });
  }

  async importCmsPages(file: File, options?: {
    overwrite?: boolean;
    updateExisting?: boolean;
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
    return this.apiClient.post<any>('/cms/pages/import', formData);
  }
}
