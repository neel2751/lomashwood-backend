import { PricingType, PricingStatus, PricingCurrency, DiscountType } from './pricing.types';

export const PRICING_DEFAULTS = {
  CURRENCY: PricingCurrency.GBP,
  STATUS: PricingStatus.ACTIVE,
  PRICING_TYPE: PricingType.FIXED,
  PAGE: 1,
  LIMIT: 20,
  MAX_LIMIT: 100,
  QUANTITY: 1,
} as const;

export const PRICING_SORT_FIELDS = [
  'basePrice',
  'createdAt',
  'effectiveFrom',
  'status',
] as const;

export const PRICING_SORT_ORDERS = ['asc', 'desc'] as const;

export const PRICING_CACHE_KEYS = {
  byId: (id: string) => `pricing:id:${id}`,
  byProductId: (productId: string) => `pricing:product:${productId}`,
  activeByProductId: (productId: string, sizeId?: string) =>
    sizeId
      ? `pricing:active:${productId}:size:${sizeId}`
      : `pricing:active:${productId}`,
  list: (page: number, limit: number, filters: string) =>
    `pricing:list:${page}:${limit}:${filters}`,
} as const;

export const PRICING_CACHE_TTL = {
  SHORT: 60,
  MEDIUM: 300,
  LONG: 3600,
} as const;

export const PRICING_ERRORS = {
  NOT_FOUND: 'Pricing record not found',
  PRODUCT_NOT_FOUND: 'Product not found for the given pricing',
  SIZE_NOT_FOUND: 'Size not found for the given pricing',
  INVALID_PRICE_RANGE: 'minPrice must be less than or equal to maxPrice',
  INVALID_EFFECTIVE_RANGE: 'effectiveFrom must be before effectiveUntil',
  INVALID_DISCOUNT_RANGE: 'discountValidFrom must be before discountValidUntil',
  INVALID_DISCOUNT_PERCENTAGE: 'Discount percentage must be between 0 and 100',
  INVALID_DISCOUNT_AMOUNT: 'Discount fixed amount must be greater than 0',
  DUPLICATE_ACTIVE_PRICING: 'An active pricing already exists for this product and size combination',
  BULK_UPDATE_FAILED: 'Bulk pricing update failed',
  ESTIMATE_FAILED: 'Unable to compute price estimate for the given product',
  INVALID_QUANTITY: 'Quantity must be a positive integer',
} as const;

export const PRICING_VALIDATION = {
  BASE_PRICE: {
    MIN: 0,
    MAX: 9_999_999.99,
  },
  DISCOUNT_PERCENTAGE: {
    MIN: 0.01,
    MAX: 100,
  },
  DISCOUNT_AMOUNT: {
    MIN: 0.01,
    MAX: 9_999_999.99,
  },
  QUANTITY: {
    MIN: 1,
    MAX: 10_000,
  },
  BULK_UPDATE: {
    MAX_IDS: 500,
  },
} as const;

export const PRICING_DISPLAY_LABELS = {
  [PricingType.FIXED]: 'Fixed Price',
  [PricingType.RANGE]: 'Price Range',
  [PricingType.ESTIMATED]: 'Estimated Price',
  [PricingType.STARTING_FROM]: 'Starting From',
} as const;

export const PRICING_STATUS_LABELS = {
  [PricingStatus.ACTIVE]: 'Active',
  [PricingStatus.INACTIVE]: 'Inactive',
  [PricingStatus.SCHEDULED]: 'Scheduled',
  [PricingStatus.EXPIRED]: 'Expired',
} as const;

export const PRICING_CURRENCY_LABELS = {
  [PricingCurrency.GBP]: 'British Pound (£)',
  [PricingCurrency.EUR]: 'Euro (€)',
  [PricingCurrency.USD]: 'US Dollar ($)',
} as const;

export const PRICING_CURRENCY_SYMBOLS = {
  [PricingCurrency.GBP]: '£',
  [PricingCurrency.EUR]: '€',
  [PricingCurrency.USD]: '$',
} as const;

export const DISCOUNT_TYPE_LABELS = {
  [DiscountType.PERCENTAGE]: 'Percentage (%)',
  [DiscountType.FIXED_AMOUNT]: 'Fixed Amount',
} as const;

export const PRICING_EVENTS = {
  CREATED: 'pricing.created',
  UPDATED: 'pricing.updated',
  DELETED: 'pricing.deleted',
  BULK_UPDATED: 'pricing.bulk_updated',
  DISCOUNT_APPLIED: 'pricing.discount_applied',
  DISCOUNT_EXPIRED: 'pricing.discount_expired',
  STATUS_CHANGED: 'pricing.status_changed',
} as const;

export const PRICING_DECIMAL_PLACES = 2 as const;

export const PRICING_ROUTES = {
  BASE: '/pricing',
  BY_ID: '/pricing/:id',
  BY_PRODUCT: '/pricing/product/:productId',
  ESTIMATE: '/pricing/estimate',
  BULK_UPDATE: '/pricing/bulk',
} as const;