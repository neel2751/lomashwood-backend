import { Prisma } from '@prisma/client';

// ─── Enums (mirror Prisma schema exactly) ────────────────────────────────────

export enum ProductCategory {
  KITCHEN = 'KITCHEN',
  BEDROOM = 'BEDROOM',
}

export enum ProductStatus {
  DRAFT = 'DRAFT',
  PUBLISHED = 'PUBLISHED',
  ARCHIVED = 'ARCHIVED',
}

export enum StyleType {
  MODERN = 'MODERN',
  TRADITIONAL = 'TRADITIONAL',
  CONTEMPORARY = 'CONTEMPORARY',
  CLASSIC = 'CLASSIC',
  MINIMALIST = 'MINIMALIST',
  RUSTIC = 'RUSTIC',
  SHAKER = 'SHAKER',
  HANDLELESS = 'HANDLELESS',
  INDUSTRIAL = 'INDUSTRIAL',
}

export enum FinishType {
  GLOSS = 'GLOSS',
  MATT = 'MATT',
  SATIN = 'SATIN',
  TEXTURED = 'TEXTURED',
  WOOD_GRAIN = 'WOOD_GRAIN',
  METALLIC = 'METALLIC',
  LAMINATE = 'LAMINATE',
}

export enum ProductSortBy {
  PRICE_ASC = 'price_asc',
  PRICE_DESC = 'price_desc',
  POPULARITY = 'popularity',
  NEWEST = 'newest',
  TITLE_ASC = 'title_asc',
  TITLE_DESC = 'title_desc',
}

// ─── Relation shapes (matching Prisma relations) ──────────────────────────────

export interface ProductImageDTO {
  id: string;
  url: string;
  altText: string | null;
  order: number;
}

export interface ProductColourDTO {
  id: string;
  name: string;
  hexCode: string;
}

// ProductUnit in schema = "sizes" conceptually
export interface ProductUnitDTO {
  id: string;
  image: string | null;
  title: string;
  description: string | null;
  order: number;
}

export interface ProductSaleDTO {
  id: string;
  title: string;
  description: string;
  image: string;
}

// ─── DTOs ─────────────────────────────────────────────────────────────────────

export interface CreateProductDTO {
  title: string;
  description: string;
  price?: number;
  category: ProductCategory;
  rangeName?: string;
  status?: ProductStatus;
  style?: StyleType;
  finish?: FinishType;
  slug: string;
  metaTitle?: string;
  metaDescription?: string;
  featured?: boolean;
  sortOrder?: number;
  // Relations
  images?: Array<{ url: string; altText?: string; order?: number }>;
  colourIds?: string[];
  units?: Array<{ image?: string; title: string; description?: string; order?: number }>;
  saleIds?: string[];
}

export interface UpdateProductDTO {
  title?: string;
  description?: string;
  price?: number;
  category?: ProductCategory;
  rangeName?: string;
  status?: ProductStatus;
  style?: StyleType;
  finish?: FinishType;
  slug?: string;
  metaTitle?: string;
  metaDescription?: string;
  featured?: boolean;
  sortOrder?: number;
  // Relations
  images?: Array<{ url: string; altText?: string; order?: number }>;
  colourIds?: string[];
  units?: Array<{ image?: string; title: string; description?: string; order?: number }>;
  saleIds?: string[];
}

export interface ProductFilterDTO {
  category?: ProductCategory;
  colourIds?: string[];
  rangeNames?: string[];
  minPrice?: number;
  maxPrice?: number;
  featured?: boolean;
  status?: ProductStatus;
  style?: StyleType;
  finish?: FinishType;
  search?: string;
  saleIds?: string[];
}

export interface ProductQueryDTO {
  page: number;
  limit: number;
  category?: ProductCategory;
  colours?: string[];
  style?: StyleType;
  finish?: FinishType;
  range?: string;
  sortBy?: ProductSortBy;
  search?: string;
  featured?: boolean;
  status?: ProductStatus;
  minPrice?: number;
  maxPrice?: number;
}

export interface ProductResponseDTO {
  id: string;
  title: string;
  description: string;
  price: number | null;
  category: ProductCategory;
  rangeName: string | null;
  status: ProductStatus;
  style: StyleType | null;
  finish: FinishType | null;
  slug: string;
  metaTitle: string | null;
  metaDescription: string | null;
  featured: boolean;
  viewCount: number;
  sortOrder: number;
  images: ProductImageDTO[];
  colours: ProductColourDTO[];
  units: ProductUnitDTO[];
  sales: ProductSaleDTO[];
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

export interface PaginatedProductsResponseDTO {
  data: ProductResponseDTO[];
  meta: PaginationMetaDTO;
}

export interface ProductSearchDTO {
  query: string;
  category?: ProductCategory;
  limit: number;
}

export interface FeaturedProductsQueryDTO {
  limit: number;
  category?: ProductCategory;
}

export interface RelatedProductsQueryDTO {
  productId: string;
  limit: number;
}

export interface ProductToggleDTO {
  field: 'featured';
  value: boolean;
}

export interface ProductStatusUpdateDTO {
  status: ProductStatus;
}

export interface BulkDeleteProductDTO {
  ids: string[];
}

// ─── Repository types ─────────────────────────────────────────────────────────

export type ProductInclude = Prisma.ProductInclude;
export type ProductWhereInput = Prisma.ProductWhereInput;
export type ProductOrderByInput = Prisma.ProductOrderByWithRelationInput;
export type ProductSelect = Prisma.ProductSelect;

export interface ProductRepositoryOptions {
  include?: ProductInclude;
  select?: ProductSelect;
  skip?: number;
  take?: number;
  orderBy?: ProductOrderByInput | ProductOrderByInput[];
  where?: ProductWhereInput;
}

// ─── Full product with all relations (from Prisma include) ────────────────────

export interface ProductWithRelations {
  id: string;
  category: ProductCategory;
  title: string;
  description: string;
  price: number | null; // Decimal serialized to number
  rangeName: string | null;
  status: ProductStatus;
  style: StyleType | null;
  finish: FinishType | null;
  slug: string;
  metaTitle: string | null;
  metaDescription: string | null;
  featured: boolean;
  viewCount: number;
  sortOrder: number;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
  createdBy: string | null;
  updatedBy: string | null;
  images: ProductImageDTO[];
  colours: Array<{
    colour: ProductColourDTO;
  }>;
  units: ProductUnitDTO[];
  sales: Array<{
    sale: ProductSaleDTO;
  }>;
}

// ─── Analytics / Stats ────────────────────────────────────────────────────────

export interface ProductStatistics {
  totalProducts: number;
  publishedProducts: number;
  draftProducts: number;
  archivedProducts: number;
  featuredProducts: number;
  kitchenProducts: number;
  bedroomProducts: number;
  averagePrice: number | null;
  productsInSales: number;
}

export interface ProductPriceRange {
  minPrice: number;
  maxPrice: number;
  averagePrice: number;
}

export interface ProductsByCategory {
  kitchen: ProductResponseDTO[];
  bedroom: ProductResponseDTO[];
}

// ─── Bulk operations ──────────────────────────────────────────────────────────

export interface ProductBulkOperationResult {
  successful: string[];
  failed: Array<{ id: string; error: string }>;
  total: number;
  successCount: number;
  failCount: number;
}

// ─── Import / Export ──────────────────────────────────────────────────────────

export interface ProductExportDTO {
  id: string;
  title: string;
  description: string;
  price: number | null;
  category: string;
  rangeName: string | null;
  status: string;
  style: string | null;
  finish: string | null;
  slug: string;
  featured: boolean;
  imageCount: number;
  colourCount: number;
  unitCount: number;
  saleCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface ProductImportDTO {
  title: string;
  description: string;
  price?: number;
  category: ProductCategory;
  rangeName?: string;
  status: ProductStatus;
  style?: StyleType;
  finish?: FinishType;
  slug: string;
  featured: boolean;
  imageUrls: string[];
  colourNames: string[];
}

// ─── Events / Audit ───────────────────────────────────────────────────────────

export interface ProductValidationError {
  field: string;
  message: string;
  value?: unknown;
}

export interface ProductCacheKey {
  type: 'product' | 'products' | 'featured' | 'search' | 'related';
  id?: string;
  params?: Record<string, unknown>;
}

export interface ProductEvent {
  type: 'created' | 'updated' | 'deleted' | 'status_changed' | 'featured_toggled';
  productId: string;
  timestamp: Date;
  metadata?: Record<string, unknown>;
}

export interface ProductAuditLog {
  productId: string;
  action: 'create' | 'update' | 'delete' | 'status_change';
  userId?: string;
  changes?: Record<string, { old: unknown; new: unknown }>;
  timestamp: Date;
}