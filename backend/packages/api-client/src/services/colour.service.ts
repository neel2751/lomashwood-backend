import { HttpClient } from '../utils/http';
import { PaginatedResponse } from '../types/api.types';

// ── Missing types (add to api.types.ts and re-export from there if preferred) ──

export interface Colour {
  id: string;
  name: string;
  slug: string;
  hex: string;
  rgb: string;
  hsl: string;
  cmyk?: string;
  description?: string;
  category?: string;
  isActive: boolean;
  tags?: string[];
  createdAt: string;
  updatedAt?: string;
}

export interface CreateColourRequest {
  name: string;
  slug?: string;
  hex: string;
  rgb?: string;
  hsl?: string;
  cmyk?: string;
  description?: string;
  category?: string;
  isActive?: boolean;
  tags?: string[];
}

export interface UpdateColourRequest {
  name?: string;
  slug?: string;
  hex?: string;
  rgb?: string;
  hsl?: string;
  cmyk?: string;
  description?: string;
  category?: string;
  isActive?: boolean;
  tags?: string[];
}

export interface ColourFilters {
  search?: string;
  category?: string;
  isActive?: boolean;
  tags?: string[];
  startDate?: string;
  endDate?: string;
}

// ── Internal sub-types ────────────────────────────────────────────────────────

interface ColourProductCount {
  total: number;
  active: number;
  inactive: number;
  byCategory: Record<string, number>;
}

interface ColourAnalytics {
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
}

interface ColourPalette {
  id: string;
  name: string;
  description?: string;
  colours: Array<{
    id: string;
    name: string;
    hex: string;
    rgb: string;
    hsl: string;
  }>;
  category?: string;
  isPublic: boolean;
  createdAt: string;
  updatedAt?: string;
}

interface ColourCombination {
  id: string;
  name: string;
  type: string;
  colours: Array<{
    id: string;
    name: string;
    hex: string;
    rgb: string;
    hsl: string;
  }>;
  harmony: number;
}

interface ColourTrend {
  id: string;
  name: string;
  hex: string;
  trend: 'rising' | 'falling' | 'stable';
  change: number;
  rank: number;
  previousRank: number;
  category?: string;
}

interface ColourTrendDetail {
  trend: 'rising' | 'falling' | 'stable';
  change: number;
  rank: number;
  previousRank: number;
  history: Array<{
    date: string;
    rank: number;
    usage: number;
  }>;
}

interface ColourValidation {
  valid: boolean;
  errors?: string[];
  warnings?: string[];
  duplicates?: Array<{
    id: string;
    name: string;
    hex: string;
    similarity: number;
  }>;
}

interface ColourConversion {
  original: {
    format: string;
    value: string;
  };
  converted: {
    format: string;
    value: string;
  };
  additionalFormats: Record<string, string>;
}

interface ExtractedColour {
  hex: string;
  rgb: string;
  hsl: string;
  percentage: number;
  name?: string;
}

interface ColourAccessibility {
  contrastRatio: number;
  wcagAA: {
    normal: boolean;
    large: boolean;
  };
  wcagAAA: {
    normal: boolean;
    large: boolean;
  };
  recommendations: Array<{
    type: 'foreground' | 'background';
    suggested: string;
    reason: string;
  }>;
}

interface ImportResult {
  imported: number;
  updated: number;
  skipped: number;
  errors: Array<{
    row: number;
    error: string;
    data: any;
  }>;
}

interface ImageUploadResponse {
  url: string;
  alt?: string;
  size: number;
  dimensions?: {
    width: number;
    height: number;
  };
}

interface ColourCategory {
  id: string;
  name: string;
  slug: string;
  colourCount: number;
  description?: string;
}

// ── Service ───────────────────────────────────────────────────────────────────

export class ColourService {
  constructor(private httpClient: HttpClient) {}

  async getColours(params?: ColourFilters & {
    page?: number;
    limit?: number;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  }): Promise<PaginatedResponse<Colour[]>> {
    return this.httpClient.get<PaginatedResponse<Colour[]>>('/colours', { params });
  }

  async getColour(colourId: string): Promise<Colour> {
    return this.httpClient.get<Colour>(`/colours/${colourId}`);
  }

  async getColourBySlug(slug: string): Promise<Colour> {
    return this.httpClient.get<Colour>(`/colours/slug/${slug}`);
  }

  async createColour(colourData: CreateColourRequest): Promise<Colour> {
    return this.httpClient.post<Colour>('/colours', colourData);
  }

  async updateColour(colourId: string, updateData: UpdateColourRequest): Promise<Colour> {
    return this.httpClient.put<Colour>(`/colours/${colourId}`, updateData);
  }

  async deleteColour(colourId: string): Promise<void> {
    return this.httpClient.delete<void>(`/colours/${colourId}`);
  }

  async getColourProducts(
    colourId: string,
    params?: {
      page?: number;
      limit?: number;
      categoryId?: string;
      includeVariants?: boolean;
    }
  ): Promise<PaginatedResponse<any[]>> {
    return this.httpClient.get<PaginatedResponse<any[]>>(`/colours/${colourId}/products`, { params });
  }

  async getColourProductCount(colourId: string): Promise<ColourProductCount> {
    return this.httpClient.get<ColourProductCount>(`/colours/${colourId}/products/count`);
  }

  async getColourAnalytics(
    colourId: string,
    params?: {
      startDate?: string;
      endDate?: string;
    }
  ): Promise<ColourAnalytics> {
    return this.httpClient.get<ColourAnalytics>(`/colours/${colourId}/analytics`, { params });
  }

  async searchColours(
    query: string,
    params?: {
      page?: number;
      limit?: number;
      includeInactive?: boolean;
    }
  ): Promise<PaginatedResponse<Colour[]>> {
    return this.httpClient.get<PaginatedResponse<Colour[]>>('/colours/search', {
      params: { q: query, ...params },
    });
  }

  async getColourPalettes(params?: {
    page?: number;
    limit?: number;
    category?: string;
  }): Promise<PaginatedResponse<ColourPalette[]>> {
    return this.httpClient.get<PaginatedResponse<ColourPalette[]>>('/colours/palettes', { params });
  }

  async getColourPalette(paletteId: string): Promise<ColourPalette> {
    return this.httpClient.get<ColourPalette>(`/colours/palettes/${paletteId}`);
  }

  async createColourPalette(paletteData: {
    name: string;
    description?: string;
    colours: string[];
    category?: string;
    isPublic?: boolean;
  }): Promise<ColourPalette> {
    return this.httpClient.post<ColourPalette>('/colours/palettes', paletteData);
  }

  async updateColourPalette(
    paletteId: string,
    updateData: {
      name?: string;
      description?: string;
      colours?: string[];
      category?: string;
      isPublic?: boolean;
    }
  ): Promise<ColourPalette> {
    return this.httpClient.put<ColourPalette>(`/colours/palettes/${paletteId}`, updateData);
  }

  async deleteColourPalette(paletteId: string): Promise<void> {
    return this.httpClient.delete<void>(`/colours/palettes/${paletteId}`);
  }

  async getColourCombinations(
    colourId: string,
    params?: {
      page?: number;
      limit?: number;
      type?: 'complementary' | 'analogous' | 'triadic' | 'split-complementary';
    }
  ): Promise<PaginatedResponse<ColourCombination[]>> {
    return this.httpClient.get<PaginatedResponse<ColourCombination[]>>(
      `/colours/${colourId}/combinations`,
      { params }
    );
  }

  async generateColourCombinations(
    colourId: string,
    type: 'complementary' | 'analogous' | 'triadic' | 'split-complementary'
  ): Promise<ColourCombination[]> {
    return this.httpClient.post<ColourCombination[]>(`/colours/${colourId}/combinations/generate`, {
      type,
    });
  }

  async getColourTrends(params?: {
    page?: number;
    limit?: number;
    period?: 'week' | 'month' | 'quarter' | 'year';
    category?: string;
  }): Promise<PaginatedResponse<ColourTrend[]>> {
    return this.httpClient.get<PaginatedResponse<ColourTrend[]>>('/colours/trends', { params });
  }

  async getColourTrend(
    colourId: string,
    params?: {
      period?: 'week' | 'month' | 'quarter' | 'year';
    }
  ): Promise<ColourTrendDetail> {
    return this.httpClient.get<ColourTrendDetail>(`/colours/${colourId}/trend`, { params });
  }

  async validateColour(colourData: CreateColourRequest): Promise<ColourValidation> {
    return this.httpClient.post<ColourValidation>('/colours/validate', colourData);
  }

  async convertColour(
    value: string,
    fromFormat: 'hex' | 'rgb' | 'hsl' | 'cmyk',
    toFormat: 'hex' | 'rgb' | 'hsl' | 'cmyk'
  ): Promise<ColourConversion> {
    return this.httpClient.post<ColourConversion>('/colours/convert', {
      value,
      fromFormat,
      toFormat,
    });
  }

  async extractColoursFromImage(
    imageUrl: string,
    options?: {
      count?: number;
      algorithm?: 'kmeans' | 'median-cut' | 'dominant';
      format?: 'hex' | 'rgb' | 'hsl';
    }
  ): Promise<ExtractedColour[]> {
    return this.httpClient.post<ExtractedColour[]>('/colours/extract', {
      imageUrl,
      ...options,
    });
  }

  async checkColourAccessibility(
    foreground: string,
    background: string
  ): Promise<ColourAccessibility> {
    return this.httpClient.post<ColourAccessibility>('/colours/accessibility', {
      foreground,
      background,
    });
  }

  async bulkUpdateColours(
    updates: Array<{
      id: string;
      data: UpdateColourRequest;
    }>
  ): Promise<Colour[]> {
    return this.httpClient.put<Colour[]>('/colours/bulk', { updates });
  }

  async bulkDeleteColours(colourIds: string[]): Promise<void> {
    return this.httpClient.post<void>('/colours/bulk-delete', { colourIds });
  }

  async exportColours(params?: {
    format?: 'csv' | 'excel' | 'json';
    includeProducts?: boolean;
    includeAnalytics?: boolean;
  }): Promise<Blob> {
    return this.httpClient.get<Blob>('/colours/export', {
      params,
      responseType: 'blob',
    });
  }

  async importColours(
    file: File,
    options?: {
      overwrite?: boolean;
      createMissing?: boolean;
      validateColors?: boolean;
    }
  ): Promise<ImportResult> {
    const formData = new FormData();
    formData.append('file', file);

    if (options) {
      Object.entries(options).forEach(([key, value]) => {
        formData.append(key, value.toString());
      });
    }

    return this.httpClient.post<ImportResult>('/colours/import', formData);
  }

  async uploadColourImage(colourId: string, file: File): Promise<ImageUploadResponse> {
    const formData = new FormData();
    formData.append('file', file);

    return this.httpClient.post<ImageUploadResponse>(`/colours/${colourId}/image`, formData);
  }

  async deleteColourImage(colourId: string): Promise<void> {
    return this.httpClient.delete<void>(`/colours/${colourId}/image`);
  }

  async getColourCategories(): Promise<ColourCategory[]> {
    return this.httpClient.get<ColourCategory[]>('/colours/categories');
  }

  async createColourCategory(categoryData: {
    name: string;
    slug: string;
    description?: string;
  }): Promise<ColourCategory> {
    return this.httpClient.post<ColourCategory>('/colours/categories', categoryData);
  }

  async updateColourCategory(
    categoryId: string,
    updateData: {
      name?: string;
      slug?: string;
      description?: string;
    }
  ): Promise<ColourCategory> {
    return this.httpClient.put<ColourCategory>(`/colours/categories/${categoryId}`, updateData);
  }

  async deleteColourCategory(categoryId: string): Promise<void> {
    return this.httpClient.delete<void>(`/colours/categories/${categoryId}`);
  }
}