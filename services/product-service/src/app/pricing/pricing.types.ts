import { Prisma } from '@prisma/client';

export enum PricingType {
  FIXED = 'FIXED',
  RANGE = 'RANGE',
  ESTIMATED = 'ESTIMATED',
  STARTING_FROM = 'STARTING_FROM',
}

export enum PricingStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  SCHEDULED = 'SCHEDULED',
  EXPIRED = 'EXPIRED',
}

export enum PricingCurrency {
  GBP = 'GBP',
  EUR = 'EUR',
  USD = 'USD',
}

export enum DiscountType {
  PERCENTAGE = 'PERCENTAGE',
  FIXED_AMOUNT = 'FIXED_AMOUNT',
}

export interface PricingTier {
  id: string;
  label: string;
  minPrice: Prisma.Decimal;
  maxPrice: Prisma.Decimal | null;
  description: string | null;
}

export interface PricingDiscount {
  id: string;
  type: DiscountType;
  value: Prisma.Decimal;
  label: string | null;
  validFrom: Date | null;
  validUntil: Date | null;
  isActive: boolean;
}

export interface ProductPricingRecord {
  id: string;
  productId: string;
  sizeId: string | null;
  pricingType: PricingType;
  basePrice: Prisma.Decimal;
  minPrice: Prisma.Decimal | null;
  maxPrice: Prisma.Decimal | null;
  currency: PricingCurrency;
  status: PricingStatus;
  discount: PricingDiscount | null;
  effectiveFrom: Date;
  effectiveUntil: Date | null;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
}

export interface PricingWithRelations extends ProductPricingRecord {
  product: {
    id: string;
    title: string;
    categoryId: string;
  };
  size: {
    id: string;
    title: string;
  } | null;
}

export interface CreatePricingDto {
  productId: string;
  sizeId?: string;
  pricingType: PricingType;
  basePrice: number;
  minPrice?: number;
  maxPrice?: number;
  currency: PricingCurrency;
  status: PricingStatus;
  discountType?: DiscountType;
  discountValue?: number;
  discountLabel?: string;
  discountValidFrom?: Date;
  discountValidUntil?: Date;
  effectiveFrom: Date;
  effectiveUntil?: Date;
}

export interface UpdatePricingDto {
  pricingType?: PricingType;
  basePrice?: number;
  minPrice?: number;
  maxPrice?: number;
  currency?: PricingCurrency;
  status?: PricingStatus;
  discountType?: DiscountType;
  discountValue?: number;
  discountLabel?: string;
  discountValidFrom?: Date;
  discountValidUntil?: Date;
  effectiveFrom?: Date;
  effectiveUntil?: Date;
}

export interface PricingFilterDto {
  productId?: string;
  sizeId?: string;
  pricingType?: PricingType;
  status?: PricingStatus;
  currency?: PricingCurrency;
  minBasePrice?: number;
  maxBasePrice?: number;
  effectiveAt?: Date;
  includeDeleted?: boolean;
}

export interface PricingEstimateRequest {
  productId: string;
  sizeId?: string;
  quantity?: number;
  currency?: PricingCurrency;
}

export interface PricingEstimateResult {
  productId: string;
  sizeId: string | null;
  pricingType: PricingType;
  basePrice: Prisma.Decimal;
  finalPrice: Prisma.Decimal;
  minPrice: Prisma.Decimal | null;
  maxPrice: Prisma.Decimal | null;
  currency: PricingCurrency;
  discountApplied: boolean;
  discountAmount: Prisma.Decimal | null;
  discountLabel: string | null;
  displayLabel: string;
}

export interface PricingListResponse {
  data: PricingWithRelations[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface PricingResponse {
  id: string;
  productId: string;
  sizeId: string | null;
  pricingType: PricingType;
  basePrice: string;
  minPrice: string | null;
  maxPrice: string | null;
  currency: PricingCurrency;
  status: PricingStatus;
  discount: PricingDiscountResponse | null;
  effectiveFrom: Date;
  effectiveUntil: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface PricingDiscountResponse {
  id: string;
  type: DiscountType;
  value: string;
  label: string | null;
  validFrom: Date | null;
  validUntil: Date | null;
  isActive: boolean;
}

export interface BulkPricingUpdateDto {
  pricingIds: string[];
  status?: PricingStatus;
  discountType?: DiscountType;
  discountValue?: number;
  discountValidFrom?: Date;
  discountValidUntil?: Date;
}

export interface PricingQueryOptions {
  page?: number;
  limit?: number;
  sortBy?: 'basePrice' | 'createdAt' | 'effectiveFrom' | 'status';
  sortOrder?: 'asc' | 'desc';
  filters?: PricingFilterDto;
}

export interface ActivePricingForProduct {
  productId: string;
  pricings: PricingEstimateResult[];
  defaultPricing: PricingEstimateResult | null;
}

export type PricingCreateInput = Omit<ProductPricingRecord, 'id' | 'createdAt' | 'updatedAt' | 'deletedAt' | 'discount'> & {
  discount?: Omit<PricingDiscount, 'id'>;
};

export type PricingUpdateInput = Partial<PricingCreateInput>;

export interface IPricingRepository {
  findById(id: string): Promise<PricingWithRelations | null>;
  findByProductId(productId: string): Promise<PricingWithRelations[]>;
  findActive(productId: string, sizeId?: string): Promise<PricingWithRelations | null>;
  findMany(options: PricingQueryOptions): Promise<PricingListResponse>;
  create(data: PricingCreateInput): Promise<ProductPricingRecord>;
  update(id: string, data: PricingUpdateInput): Promise<ProductPricingRecord>;
  softDelete(id: string): Promise<ProductPricingRecord>;
  bulkUpdate(ids: string[], data: PricingUpdateInput): Promise<number>;
  findByIds(ids: string[]): Promise<PricingWithRelations[]>;
}

export interface IPricingService {
  getPricingById(id: string): Promise<PricingResponse>;
  getPricingsByProductId(productId: string): Promise<PricingResponse[]>;
  getActivePricingForProduct(request: PricingEstimateRequest): Promise<PricingEstimateResult>;
  listPricings(options: PricingQueryOptions): Promise<PricingListResponse>;
  createPricing(data: CreatePricingDto): Promise<PricingResponse>;
  updatePricing(id: string, data: UpdatePricingDto): Promise<PricingResponse>;
  deletePricing(id: string): Promise<void>;
  bulkUpdatePricings(data: BulkPricingUpdateDto): Promise<number>;
  estimatePrice(request: PricingEstimateRequest): Promise<PricingEstimateResult>;
}