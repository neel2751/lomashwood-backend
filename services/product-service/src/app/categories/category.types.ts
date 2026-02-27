import { Prisma } from '@prisma/client';

export enum CategoryType {
  KITCHEN = 'KITCHEN',
  BEDROOM = 'BEDROOM',
}

export enum CategorySortBy {
  NAME_ASC = 'name_asc',
  NAME_DESC = 'name_desc',
  ORDER = 'order',
  NEWEST = 'newest',
  OLDEST = 'oldest',
}

export interface CategoryBase {
  name: string;
  slug: string;
  description?: string;
  type: CategoryType;
  image?: string;
  icon?: string;
  parentId?: string | null;
  order?: number;
  isActive: boolean;
  isFeatured: boolean;
  metaTitle?: string;
  metaDescription?: string;
  metaKeywords?: string;
}

export interface CreateCategoryDTO {
  name: string;
  slug: string;
  description?: string;
  type: CategoryType;
  image?: string;
  icon?: string;
  parentId?: string | null;
  order?: number;
  isActive?: boolean;
  isFeatured?: boolean;
  metaTitle?: string;
  metaDescription?: string;
  metaKeywords?: string;
}

export interface UpdateCategoryDTO {
  name?: string;
  slug?: string;
  description?: string;
  type?: CategoryType;
  image?: string;
  icon?: string;
  parentId?: string | null;
  order?: number;
  isActive?: boolean;
  isFeatured?: boolean;
  metaTitle?: string;
  metaDescription?: string;
  metaKeywords?: string;
}

export interface CategoryQueryDTO {
  page: number;
  limit: number;
  type?: CategoryType;
  isActive?: boolean;
  isFeatured?: boolean;
  search?: string;
  sortBy?: CategorySortBy;
  parentId?: string;
}

export interface CategoryFilterDTO {
  types?: CategoryType[];
  isActive?: boolean;
  isFeatured?: boolean;
  hasProducts?: boolean;
  parentId?: string | null;
}

export interface CategoryParent {
  id: string;
  name: string;
  slug: string;
}

export interface CategoryChild {
  id: string;
  name: string;
  slug: string;
  order: number;
}

export interface CategoryResponseDTO {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  type: CategoryType;
  image: string | null;
  icon: string | null;
  parentId: string | null;
  order: number;
  isActive: boolean;
  isFeatured: boolean;
  metaTitle: string | null;
  metaDescription: string | null;
  metaKeywords: string | null;
  parent?: CategoryParent | null;
  children?: CategoryChild[];
  productCount?: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface PaginationMetaDTO {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

export interface PaginatedCategoriesResponseDTO {
  data: CategoryResponseDTO[];
  meta: PaginationMetaDTO;
}

export interface CategoryHierarchy {
  id: string;
  name: string;
  slug: string;
  type: CategoryType;
  image: string | null;
  icon: string | null;
  order: number;
  productCount: number;
  children?: CategoryHierarchy[];
}

export interface CategoryWithProductsDTO {
  category: CategoryResponseDTO;
  products: unknown[];
  meta: PaginationMetaDTO;
}

export interface CategoryStatistics {
  totalCategories: number;
  activeCategories: number;
  featuredCategories: number;
  kitchenCategories: number;
  bedroomCategories: number;
  categoriesWithProducts: number;
}

export interface BulkDeleteCategoryResult {
  successful: string[];
  failed: Array<{
    id: string;
    error: string;
  }>;
  total: number;
  successCount: number;
  failCount: number;
}

export interface CategoryWithRelations {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  type: string;
  image: string | null;
  icon: string | null;
  parentId: string | null;
  order: number;
  isActive: boolean;
  isFeatured: boolean;
  metaTitle: string | null;
  metaDescription: string | null;
  metaKeywords: string | null;
  parent?: {
    id: string;
    name: string;
    slug: string;
  } | null;
  children?: Array<{
    id: string;
    name: string;
    slug: string;
    order: number;
  }>;
  products?: unknown[];
  _count?: {
    products: number;
  };
  createdAt: Date;
  updatedAt: Date;
}

export interface CategoryReorderItem {
  id: string;
  order: number;
}

export interface CategoryExportDTO {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  type: string;
  image: string | null;
  icon: string | null;
  parentId: string | null;
  parentName: string | null;
  order: number;
  isActive: boolean;
  isFeatured: boolean;
  productCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface CategoryImportDTO {
  name: string;
  slug: string;
  description?: string;
  type: CategoryType;
  image?: string;
  icon?: string;
  parentSlug?: string;
  order?: number;
  isActive: boolean;
  isFeatured: boolean;
}

export interface CategoryPath {
  id: string;
  name: string;
  slug: string;
  level: number;
}

export interface CategoryTreeNode {
  id: string;
  name: string;
  slug: string;
  type: CategoryType;
  image: string | null;
  icon: string | null;
  order: number;
  isActive: boolean;
  isFeatured: boolean;
  productCount: number;
  depth: number;
  children: CategoryTreeNode[];
}

export interface CategoryBreadcrumb {
  id: string;
  name: string;
  slug: string;
  url: string;
}

export interface CategorySearchResult {
  id: string;
  name: string;
  slug: string;
  type: CategoryType;
  image: string | null;
  productCount: number;
  path: string[];
}

export interface CategoryValidationError {
  field: string;
  message: string;
  value?: unknown;
}

export interface CategoryEvent {
  type: 'created' | 'updated' | 'deleted' | 'reordered' | 'toggled';
  categoryId: string;
  timestamp: Date;
  metadata?: Record<string, unknown>;
}

export interface CategoryAuditLog {
  categoryId: string;
  action: 'create' | 'update' | 'delete' | 'reorder' | 'toggle';
  userId?: string;
  changes?: Record<string, { old: unknown; new: unknown }>;
  timestamp: Date;
}

export interface CategoryCacheKey {
  type: 'category' | 'categories' | 'hierarchy' | 'featured' | 'search';
  id?: string;
  params?: Record<string, unknown>;
}

export type CategoryInclude = Prisma.CategoryInclude;

export type CategoryWhereInput = Prisma.CategoryWhereInput;

export type CategoryOrderByInput = Prisma.CategoryOrderByWithRelationInput;

export type CategorySelect = Prisma.CategorySelect;

export interface CategoryRepositoryOptions {
  include?: CategoryInclude;
  select?: CategorySelect;
  skip?: number;
  take?: number;
  orderBy?: CategoryOrderByInput | CategoryOrderByInput[];
  where?: CategoryWhereInput;
}

export interface CategoryProductCount {
  categoryId: string;
  categoryName: string;
  productCount: number;
}

export interface CategoryTypeCount {
  type: CategoryType;
  count: number;
}

export interface CategoryDepthInfo {
  id: string;
  name: string;
  depth: number;
  hasChildren: boolean;
}

export interface CategoryRelationship {
  parentId: string;
  childId: string;
  depth: number;
}

export interface CategoryMetadata {
  id: string;
  name: string;
  slug: string;
  type: CategoryType;
  isActive: boolean;
  isFeatured: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface CategorySEOData {
  title: string;
  description: string;
  keywords: string;
  canonical: string;
  image: string | null;
}

export interface CategoryAnalytics {
  categoryId: string;
  views: number;
  clicks: number;
  conversions: number;
  revenue: number;
  period: string;
}

export interface CategoryPerformance {
  categoryId: string;
  categoryName: string;
  totalProducts: number;
  activeProducts: number;
  totalViews: number;
  conversionRate: number;
}