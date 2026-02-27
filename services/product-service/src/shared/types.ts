import { z } from 'zod';

export type ProductCategory = 'KITCHEN' | 'BEDROOM';

export type InventoryChangeType = 'ADJUSTMENT' | 'SALE' | 'RESTOCK' | 'RETURN' | 'DAMAGE' | 'INITIAL';

export type PriceType = 'BASE' | 'SALE' | 'PROMOTIONAL' | 'SEASONAL' | 'CLEARANCE';

export type SortOrder = 'asc' | 'desc';

export type SortField = 'createdAt' | 'updatedAt' | 'title' | 'price' | 'popularity';

export interface PaginationParams {
  page: number;
  limit: number;
}

export interface PaginationMeta {
  currentPage: number;
  itemsPerPage: number;
  totalItems: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: PaginationMeta;
}

export interface SortParams {
  field: SortField;
  order: SortOrder;
}

export interface FilterParams {
  category?: ProductCategory;
  colours?: string[];
  sizes?: string[];
  priceMin?: number;
  priceMax?: number;
  rangeName?: string;
  isActive?: boolean;
  search?: string;
  styles?: string[];
  finishes?: string[];
}

export interface ProductImage {
  id: string;
  url: string;
  alt?: string;
  order: number;
  createdAt: Date;
}

export interface ProductColour {
  id: string;
  name: string;
  hexCode: string;
}

export interface ProductSize {
  id: string;
  title: string;
  description?: string;
  imageUrl?: string;
}

export interface ProductInventory {
  id: string;
  productId: string;
  sizeId?: string;
  colourId?: string;
  quantity: number;
  isInStock: boolean;
  lowStockThreshold: number;
  isLowStock: boolean;
  location?: string;
  lastRestockedAt?: Date;
  updatedAt: Date;
}

export interface ProductPricing {
  id: string;
  productId: string;
  price: number;
  currency: string;
  priceType: PriceType;
  effectiveFrom: Date;
  effectiveUntil?: Date;
  isActive: boolean;
  sizeId?: string;
  colourId?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Product {
  id: string;
  category: ProductCategory;
  title: string;
  description: string;
  rangeName?: string;
  images: ProductImage[];
  colours: ProductColour[];
  sizes?: ProductSize[];
  price?: number;
  isActive: boolean;
  createdBy: string;
  updatedBy?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateProductDTO {
  category: ProductCategory;
  title: string;
  description: string;
  rangeName?: string;
  images: Array<{
    url: string;
    alt?: string;
    order: number;
  }>;
  colourIds: string[];
  sizeIds?: string[];
  price?: number;
  isActive?: boolean;
}

export interface UpdateProductDTO {
  category?: ProductCategory;
  title?: string;
  description?: string;
  rangeName?: string;
  images?: Array<{
    url: string;
    alt?: string;
    order: number;
  }>;
  colourIds?: string[];
  sizeIds?: string[];
  price?: number;
  isActive?: boolean;
}

export interface Colour {
  id: string;
  name: string;
  hexCode: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateColourDTO {
  name: string;
  hexCode: string;
  isActive?: boolean;
}

export interface UpdateColourDTO {
  name?: string;
  hexCode?: string;
  isActive?: boolean;
}

export interface Size {
  id: string;
  title: string;
  description?: string;
  imageUrl?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateSizeDTO {
  title: string;
  description?: string;
  imageUrl?: string;
  isActive?: boolean;
}

export interface UpdateSizeDTO {
  title?: string;
  description?: string;
  imageUrl?: string;
  isActive?: boolean;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateCategoryDTO {
  name: string;
  slug: string;
  description?: string;
  isActive?: boolean;
}

export interface UpdateCategoryDTO {
  name?: string;
  slug?: string;
  description?: string;
  isActive?: boolean;
}

export interface UpdateInventoryDTO {
  quantity?: number;
  quantityChange?: number;
  changeType: InventoryChangeType;
  reason?: string;
  location?: string;
  lowStockThreshold?: number;
}

export interface CreatePricingDTO {
  productId: string;
  price: number;
  currency?: string;
  priceType: PriceType;
  effectiveFrom: Date;
  effectiveUntil?: Date;
  sizeId?: string;
  colourId?: string;
  isActive?: boolean;
}

export interface UpdatePricingDTO {
  price?: number;
  priceType?: PriceType;
  effectiveFrom?: Date;
  effectiveUntil?: Date;
  isActive?: boolean;
}

export interface ProductListQuery {
  page?: number;
  limit?: number;
  sortBy?: SortField;
  sortOrder?: SortOrder;
  category?: ProductCategory;
  colours?: string[];
  sizes?: string[];
  priceMin?: number;
  priceMax?: number;
  rangeName?: string;
  isActive?: boolean;
  search?: string;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
  meta?: any;
}

export interface ErrorDetails {
  code: string;
  message: string;
  statusCode: number;
  timestamp: string;
  path?: string;
  stack?: string;
}

export interface RequestContext {
  requestId: string;
  correlationId?: string;
  userId?: string;
  timestamp: Date;
  path: string;
  method: string;
  ip?: string;
  userAgent?: string;
}

export interface CacheOptions {
  ttl?: number;
  key?: string;
  tags?: string[];
}

export interface EventMetadata {
  source: string;
  correlationId?: string;
  userId?: string;
  timestamp: string;
}

export interface BaseEvent {
  eventId: string;
  eventType: string;
  timestamp: string;
  version: string;
  metadata: EventMetadata;
}

export interface ServiceHealth {
  status: 'healthy' | 'unhealthy' | 'degraded';
  timestamp: string;
  uptime: number;
  version: string;
  dependencies: {
    database: boolean;
    cache: boolean;
    messaging: boolean;
  };
}

export interface JobResult {
  success: boolean;
  processedCount: number;
  failedCount: number;
  errors: string[];
  duration: number;
  timestamp: string;
}

export interface PriceChange {
  amount: number;
  percentage: number;
}

export interface InventoryAlert {
  type: 'LOW_STOCK' | 'OUT_OF_STOCK' | 'RESTOCK_NEEDED';
  productId: string;
  currentQuantity: number;
  threshold?: number;
  message: string;
  severity: 'INFO' | 'WARNING' | 'CRITICAL';
}

export interface ProductSearchResult {
  id: string;
  title: string;
  description: string;
  category: ProductCategory;
  price?: number;
  imageUrl?: string;
  rangeName?: string;
  relevanceScore: number;
}

export interface BulkOperationResult<T = any> {
  successful: T[];
  failed: Array<{
    item: T;
    error: string;
  }>;
  totalProcessed: number;
  successCount: number;
  failureCount: number;
}

export interface AuditLog {
  id: string;
  entityType: string;
  entityId: string;
  action: string;
  userId: string;
  changes?: Record<string, any>;
  timestamp: Date;
  metadata?: Record<string, any>;
}

export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

export type Nullable<T> = T | null;

export type Optional<T> = T | undefined;

export type RequireAtLeastOne<T, Keys extends keyof T = keyof T> = 
  Pick<T, Exclude<keyof T, Keys>> & 
  {
    [K in Keys]-?: Required<Pick<T, K>> & Partial<Pick<T, Exclude<Keys, K>>>
  }[Keys];

export type RequireOnlyOne<T, Keys extends keyof T = keyof T> =
  Pick<T, Exclude<keyof T, Keys>> &
  {
    [K in Keys]-?: Required<Pick<T, K>> & Partial<Record<Exclude<Keys, K>, never>>
  }[Keys];