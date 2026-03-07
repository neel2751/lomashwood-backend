import { HttpClient } from '../utils/http';
import {
  PaginatedResponse,
  BaseEntity,
  FilterParams,
} from '../types/api.types';

// Category types
export interface Category extends BaseEntity {
  name: string;
  slug: string;
  description?: string;
  image?: string;
  parentId?: string;
  parent?: Category;
  children?: Category[];
  level: number;
  path: string;
  isActive: boolean;
  sortOrder: number;
  metadata?: Record<string, any>;
  seo?: {
    title?: string;
    description?: string;
    keywords?: string[];
    ogTitle?: string;
    ogDescription?: string;
    ogImage?: string;
    canonicalUrl?: string;
  };
  settings?: {
    allowProducts: boolean;
    allowSubcategories: boolean;
    maxDepth?: number;
    featured?: boolean;
  };
  stats?: {
    productCount: number;
    subcategoryCount: number;
    totalViews: number;
  };
}

export interface CreateCategoryRequest {
  name: string;
  slug?: string;
  description?: string;
  image?: string;
  parentId?: string;
  sortOrder?: number;
  isActive?: boolean;
  metadata?: Record<string, any>;
  seo?: {
    title?: string;
    description?: string;
    keywords?: string[];
    ogTitle?: string;
    ogDescription?: string;
    ogImage?: string;
    canonicalUrl?: string;
  };
  settings?: {
    allowProducts?: boolean;
    allowSubcategories?: boolean;
    maxDepth?: number;
    featured?: boolean;
  };
}

export interface UpdateCategoryRequest extends Partial<CreateCategoryRequest> {}

export interface CategoryFilters extends FilterParams {
  parentId?: string;
  level?: number;
  isActive?: boolean;
  featured?: boolean;
  hasProducts?: boolean;
  hasChildren?: boolean;
}

export interface CategoryTree {
  id: string;
  name: string;
  slug: string;
  level: number;
  children: CategoryTree[];
  productCount: number;
  isActive: boolean;
  sortOrder: number;
}

export class CategoryService {
  constructor(private apiClient: HttpClient) {}

  // Category Management
  async getCategories(params?: CategoryFilters & {
    page?: number;
    limit?: number;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
    includeInactive?: boolean;
  }): Promise<PaginatedResponse<Category[]>> {
    return this.apiClient.get<PaginatedResponse<Category[]>>('/categories', { params });
  }

  async getCategory(categoryId: string): Promise<Category> {
    return this.apiClient.get<Category>(`/categories/${categoryId}`);
  }

  async getCategoryBySlug(slug: string): Promise<Category> {
    return this.apiClient.get<Category>(`/categories/slug/${slug}`);
  }

  async createCategory(categoryData: CreateCategoryRequest): Promise<Category> {
    return this.apiClient.post<Category>('/categories', categoryData);
  }

  async updateCategory(categoryId: string, updateData: UpdateCategoryRequest): Promise<Category> {
    return this.apiClient.put<Category>(`/categories/${categoryId}`, updateData);
  }

  async deleteCategory(categoryId: string): Promise<void> {
    return this.apiClient.delete<void>(`/categories/${categoryId}`);
  }

  // Category Tree
  async getCategoryTree(params?: {
    rootOnly?: boolean;
    includeInactive?: boolean;
    maxDepth?: number;
    parentId?: string;
  }): Promise<CategoryTree[]> {
    return this.apiClient.get<CategoryTree[]>('/categories/tree', { params });
  }

  async getCategoryPath(categoryId: string): Promise<Category[]> {
    return this.apiClient.get<Category[]>(`/categories/${categoryId}/path`);
  }

  async getCategoryChildren(categoryId: string, params?: {
    includeInactive?: boolean;
    maxDepth?: number;
  }): Promise<Category[]> {
    return this.apiClient.get<Category[]>(`/categories/${categoryId}/children`, { params });
  }

  async getCategoryParents(categoryId: string): Promise<Category[]> {
    return this.apiClient.get<Category[]>(`/categories/${categoryId}/parents`);
  }

  // Category Bulk Operations
  async reorderCategories(categoryOrders: Array<{
    id: string;
    sortOrder: number;
    parentId?: string;
  }>): Promise<void> {
    return this.apiClient.post<void>('/categories/reorder', { categoryOrders });
  }

  async moveCategory(categoryId: string, newParentId?: string): Promise<Category> {
    return this.apiClient.post<Category>(`/categories/${categoryId}/move`, { newParentId });
  }

  async activateCategories(categoryIds: string[]): Promise<void> {
    return this.apiClient.post<void>('/categories/activate', { categoryIds });
  }

  async deactivateCategories(categoryIds: string[]): Promise<void> {
    return this.apiClient.post<void>('/categories/deactivate', { categoryIds });
  }

  // Category Search
  async searchCategories(query: string, params?: {
    page?: number;
    limit?: number;
    filters?: {
      level?: number;
      parentId?: string;
      isActive?: boolean;
    };
  }): Promise<PaginatedResponse<Category[]>> {
    return this.apiClient.get<PaginatedResponse<Category[]>>('/categories/search', { 
      params: { query, ...params } 
    });
  }

  // Category Analytics
  async getCategoryAnalytics(categoryId: string, params?: {
    startDate?: string;
    endDate?: string;
    metrics?: string[];
  }): Promise<{
    views: number;
    uniqueViews: number;
    productViews: number;
    conversions: number;
    revenue: number;
    avgOrderValue: number;
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
      productViews: number;
      conversions: number;
      revenue: number;
    }>;
  }> {
    return this.apiClient.get<any>(`/categories/${categoryId}/analytics`, { params });
  }

  async getCategoryStats(categoryId?: string): Promise<{
    totalCategories: number;
    activeCategories: number;
    rootCategories: number;
    maxDepth: number;
    avgDepth: number;
    totalProducts: number;
    categoriesWithoutProducts: number;
    featuredCategories: number;
  }> {
    const url = categoryId ? `/categories/${categoryId}/stats` : '/categories/stats';
    return this.apiClient.get<any>(url);
  }

  // Category SEO
  async getCategorySeo(categoryId: string): Promise<{
    title: string;
    description: string;
    keywords: string[];
    ogTitle?: string;
    ogDescription?: string;
    ogImage?: string;
    canonicalUrl?: string;
    metaRobots: string;
    structuredData: Record<string, any>;
    breadcrumbs: Array<{
      name: string;
      url: string;
    }>;
  }> {
    return this.apiClient.get<any>(`/categories/${categoryId}/seo`);
  }

  async updateCategorySeo(categoryId: string, seoData: {
    title?: string;
    description?: string;
    keywords?: string[];
    ogTitle?: string;
    ogDescription?: string;
    ogImage?: string;
    canonicalUrl?: string;
    metaRobots?: string;
    structuredData?: Record<string, any>;
  }): Promise<Category> {
    return this.apiClient.put<Category>(`/categories/${categoryId}/seo`, seoData);
  }

  // Category Export/Import
  async exportCategories(params?: {
    format?: 'json' | 'csv' | 'xlsx';
    includeTree?: boolean;
    includeProducts?: boolean;
    includeInactive?: boolean;
    filters?: {
      parentId?: string;
      level?: number;
      isActive?: boolean;
    };
  }): Promise<Blob> {
    return this.apiClient.getBlob('/categories/export', { params });
  }

  async importCategories(file: File, options?: {
    overwrite?: boolean;
    updateExisting?: boolean;
    createHierarchy?: boolean;
    validateOnly?: boolean;
    skipDuplicates?: boolean;
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
    return this.apiClient.post<any>('/categories/import', formData);
  }

  // Category Images
  async uploadCategoryImage(categoryId: string, file: File): Promise<{
    url: string;
    filename: string;
    size: number;
    mimetype: string;
  }> {
    const formData = new FormData();
    formData.append('image', file);
    return this.apiClient.post<any>(`/categories/${categoryId}/image`, formData);
  }

  async deleteCategoryImage(categoryId: string): Promise<void> {
    return this.apiClient.delete<void>(`/categories/${categoryId}/image`);
  }

  // Category Validation
  async validateCategorySlug(slug: string, excludeId?: string): Promise<{
    isValid: boolean;
    isAvailable: boolean;
    suggestions?: string[];
  }> {
    const params = excludeId ? { excludeId } : {};
    return this.apiClient.get<any>(`/categories/validate-slug/${slug}`, { params });
  }

  async validateCategoryHierarchy(categoryId: string, newParentId?: string): Promise<{
    isValid: boolean;
    wouldCreateCycle?: boolean;
    wouldExceedMaxDepth?: boolean;
    maxDepth?: number;
    currentDepth?: number;
    newDepth?: number;
  }> {
    return this.apiClient.post<any>(`/categories/${categoryId}/validate-hierarchy`, { newParentId });
  }
}
