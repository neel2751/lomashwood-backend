import { HttpClient } from '../utils/http';
import {
  PaginatedResponse,
  Size,
  CreateSizeRequest,
  UpdateSizeRequest,
  SizeFilters,
} from '../types/api.types';

export class SizeService {
  constructor(private HttpClient: HttpClient) {}

  // Size Management
  async getSizes(params?: SizeFilters & {
    page?: number;
    limit?: number;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  }): Promise<PaginatedResponse<Size[]>> {
    return this.HttpClient.get<PaginatedResponse<Size[]>>('/sizes', { params });
  }

  async getSize(sizeId: string): Promise<Size> {
    return this.HttpClient.get<Size>(`/sizes/${sizeId}`);
  }

  async getSizeBySlug(slug: string): Promise<Size> {
    return this.HttpClient.get<Size>(`/sizes/slug/${slug}`);
  }

  async createSize(sizeData: CreateSizeRequest): Promise<Size> {
    return this.HttpClient.post<Size>('/sizes', sizeData);
  }

  async updateSize(sizeId: string, updateData: UpdateSizeRequest): Promise<Size> {
    return this.HttpClient.put<Size>(`/sizes/${sizeId}`, updateData);
  }

  async deleteSize(sizeId: string): Promise<void> {
    return this.HttpClient.delete<void>(`/sizes/${sizeId}`);
  }

  // Size Categories
  async getSizeCategories(): Promise<Array<{
    id: string;
    name: string;
    slug: string;
    type: 'clothing' | 'furniture' | 'general';
    sizeCount: number;
    description?: string;
  }>> {
    return this.HttpClient.get<any[]>('/sizes/categories');
  }

  async getSizesByCategory(categoryId: string, params?: {
    page?: number;
    limit?: number;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  }): Promise<PaginatedResponse<Size[]>> {
    return this.HttpClient.get<PaginatedResponse<Size[]>>(`/sizes/categories/${categoryId}`, { params });
  }

  // Size Products
  async getSizeProducts(sizeId: string, params?: {
    page?: number;
    limit?: number;
    categoryId?: string;
    includeVariants?: boolean;
  }): Promise<PaginatedResponse<any[]>> {
    return this.HttpClient.get<PaginatedResponse<any[]>>(`/sizes/${sizeId}/products`, { params });
  }

  async getSizeProductCount(sizeId: string): Promise<{
    total: number;
    active: number;
    inactive: number;
    byCategory: Record<string, number>;
  }> {
    return this.HttpClient.get<any>(`/sizes/${sizeId}/products/count`);
  }

  // Size Analytics
  async getSizeAnalytics(sizeId: string, params?: {
    startDate?: string;
    endDate?: string;
  }): Promise<{
    views: number;
    clicks: number;
    conversions: number;
    revenue: number;
    averageOrderValue: number;
    topProducts: Array<{
      id: string;
      name: string;
      views: number;
      sales: number;
      revenue: number;
    }>;
    performance: Array<{
      date: string;
      views: number;
      clicks: number;
      conversions: number;
      revenue: number;
    }>;
  }> {
    return this.HttpClient.get<any>(`/sizes/${sizeId}/analytics`, { params });
  }

  // Size Search
  async searchSizes(query: string, params?: {
    page?: number;
    limit?: number;
    includeInactive?: boolean;
    category?: string;
  }): Promise<PaginatedResponse<Size[]>> {
    return this.HttpClient.get<PaginatedResponse<Size[]>>('/sizes/search', {
      params: { q: query, ...params },
    });
  }

  // Size Conversion
  async convertSize(size: string, fromSystem: string, toSystem: string, category?: string): Promise<{
    original: {
      size: string;
      system: string;
      category?: string;
    };
    converted: {
      size: string;
      system: string;
      category?: string;
    };
    alternatives: Array<{
      size: string;
      system: string;
      accuracy: number;
    }>;
  }> {
    return this.HttpClient.post<any>('/sizes/convert', {
      size,
      fromSystem,
      toSystem,
      category,
    });
  }

  // Size Charts
  async getSizeCharts(params?: {
    page?: number;
    limit?: number;
    category?: string;
    system?: string;
  }): Promise<PaginatedResponse<Array<{
    id: string;
    name: string;
    description?: string;
    category: string;
    system: string;
    measurements: Array<{
      name: string;
      unit: string;
      sizes: Array<{
        size: string;
        value: number;
        recommended?: boolean;
      }>;
    }>;
    isActive: boolean;
    createdAt: string;
  }>>> {
    return this.HttpClient.get<PaginatedResponse<any[]>>('/sizes/charts', { params });
  }

  async getSizeChart(chartId: string): Promise<{
    id: string;
    name: string;
    description?: string;
    category: string;
    system: string;
    measurements: Array<{
      name: string;
      unit: string;
      sizes: Array<{
        size: string;
        value: number;
        recommended?: boolean;
      }>;
    }>;
    isActive: boolean;
    createdAt: string;
    updatedAt: string;
  }> {
    return this.HttpClient.get<any>(`/sizes/charts/${chartId}`);
  }

  async createSizeChart(chartData: {
    name: string;
    description?: string;
    category: string;
    system: string;
    measurements: Array<{
      name: string;
      unit: string;
      sizes: Array<{
        size: string;
        value: number;
        recommended?: boolean;
      }>;
    }>;
  }): Promise<any> {
    return this.HttpClient.post<any>('/sizes/charts', chartData);
  }

  async updateSizeChart(chartId: string, updateData: {
    name?: string;
    description?: string;
    category?: string;
    system?: string;
    measurements?: Array<{
      name: string;
      unit: string;
      sizes: Array<{
        size: string;
        value: number;
        recommended?: boolean;
      }>;
    }>;
    isActive?: boolean;
  }): Promise<any> {
    return this.HttpClient.put<any>(`/sizes/charts/${chartId}`, updateData);
  }

  async deleteSizeChart(chartId: string): Promise<void> {
    return this.HttpClient.delete<void>(`/sizes/charts/${chartId}`);
  }

  // Size Recommendations
  async getSizeRecommendations(measurements: {
    height?: number;
    weight?: number;
    chest?: number;
    waist?: number;
    hips?: number;
    inseam?: number;
    [key: string]: number | undefined;
  }, category: string, system?: string): Promise<Array<{
    size: string;
    system: string;
    confidence: number;
    fit: 'tight' | 'regular' | 'loose';
    recommendations: string[];
  }>> {
    return this.HttpClient.post<any[]>('/sizes/recommend', {
      measurements,
      category,
      system,
    });
  }

  // Size Validation
  async validateSize(sizeData: CreateSizeRequest): Promise<{
    valid: boolean;
    errors?: string[];
    warnings?: string[];
    duplicates?: Array<{
      id: string;
      name: string;
      value: string;
      similarity: number;
    }>;
  }> {
    return this.HttpClient.post<any>('/sizes/validate', sizeData);
  }

  // Size Systems
  async getSizeSystems(): Promise<Array<{
    id: string;
    name: string;
    code: string;
    description?: string;
    category: string;
    isActive: boolean;
  }>> {
    return this.HttpClient.get<any[]>('/sizes/systems');
  }

  async getSizesBySystem(systemId: string, params?: {
    page?: number;
    limit?: number;
    category?: string;
  }): Promise<PaginatedResponse<Size[]>> {
    return this.HttpClient.get<PaginatedResponse<Size[]>>(`/sizes/systems/${systemId}`, { params });
  }

  // Size Bulk Operations
  async bulkUpdateSizes(updates: Array<{
    id: string;
    data: UpdateSizeRequest;
  }>): Promise<Size[]> {
    return this.HttpClient.put<Size[]>('/sizes/bulk', { updates });
  }

  async bulkDeleteSizes(sizeIds: string[]): Promise<void> {
    return this.HttpClient.post<void>('/sizes/bulk-delete', { sizeIds });
  }

  // Size Import/Export
  async exportSizes(params?: {
    format?: 'csv' | 'excel' | 'json';
    includeProducts?: boolean;
    includeAnalytics?: boolean;
    category?: string;
    system?: string;
  }): Promise<Blob> {
    return this.HttpClient.get<Blob>('/sizes/export', {
      params,
      responseType: 'blob',
    });
  }

  async importSizes(file: File, options?: {
    overwrite?: boolean;
    createMissing?: boolean;
    validateSizes?: boolean;
    category?: string;
    system?: string;
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

   
return this.HttpClient.upload<any>('/templates/import', formData);
  }

  // Size Reordering
  async reorderSizes(categoryId: string, sizeIds: string[]): Promise<void> {
    return this.HttpClient.post<void>(`/sizes/categories/${categoryId}/reorder`, { sizeIds });
  }

  // Size Templates
  async getSizeTemplates(params?: {
    page?: number;
    limit?: number;
    category?: string;
  }): Promise<PaginatedResponse<Array<{
    id: string;
    name: string;
    description?: string;
    category: string;
    sizes: Array<{
      name: string;
      value: string;
      order: number;
    }>;
    isDefault: boolean;
    createdAt: string;
  }>>> {
    return this.HttpClient.get<PaginatedResponse<any[]>>('/sizes/templates', { params });
  }

  async createSizeTemplate(templateData: {
    name: string;
    description?: string;
    category: string;
    sizes: Array<{
      name: string;
      value: string;
      order: number;
    }>;
    isDefault?: boolean;
  }): Promise<any> {
    return this.HttpClient.post<any>('/sizes/templates', templateData);
  }

  async applySizeTemplate(templateId: string, options?: {
    overwrite?: boolean;
    category?: string;
  }): Promise<{
    created: number;
    updated: number;
    skipped: number;
  }> {
    return this.HttpClient.post<any>(`/sizes/templates/${templateId}/apply`, options);
  }

  // Size Images
  async uploadSizeImage(sizeId: string, file: File, type: 'chart' | 'diagram'): Promise<{
    url: string;
    alt?: string;
    size: number;
    dimensions?: {
      width: number;
      height: number;
    };
  }> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('type', type);

    return this.HttpClient.upload<any>('/sizes/import', formData);
  }

  async deleteSizeImage(sizeId: string, type: 'chart' | 'diagram'): Promise<void> {
    return this.HttpClient.delete<void>(`/sizes/${sizeId}/images/${type}`);
  }

  // Size Settings
  async getSizeSettings(categoryId: string): Promise<{
    displayMode: 'dropdown' | 'radio' | 'swatch';
    showCharts: boolean;
    showRecommendations: boolean;
    defaultSystem: string;
    allowCustomSizes: boolean;
    sizeGuideUrl?: string;
  }> {
    return this.HttpClient.get<any>(`/sizes/categories/${categoryId}/settings`);
  }

  async updateSizeSettings(categoryId: string, settings: {
    displayMode?: 'dropdown' | 'radio' | 'swatch';
    showCharts?: boolean;
    showRecommendations?: boolean;
    defaultSystem?: string;
    allowCustomSizes?: boolean;
    sizeGuideUrl?: string;
  }): Promise<any> {
    return this.HttpClient.put<any>(`/sizes/categories/${categoryId}/settings`, settings);
  }
}