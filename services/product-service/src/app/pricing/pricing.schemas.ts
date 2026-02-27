import { z } from 'zod';

export const createPricingSchema = z.object({
  productId: z.string().uuid({
    message: 'Product ID must be a valid UUID'
  }),
  variantId: z.string().uuid({
    message: 'Variant ID must be a valid UUID'
  }),
  basePrice: z.number().positive({
    message: 'Base price must be a positive number'
  }),
  salePrice: z.number().positive({
    message: 'Sale price must be a positive number'
  }).optional(),
  costPrice: z.number().positive({
    message: 'Cost price must be a positive number'
  }).optional(),
  currency: z.string().length(3, {
    message: 'Currency must be a 3-letter code'
  }).optional(),
  taxRate: z.number().min(0).max(100, {
    message: 'Tax rate must be between 0 and 100'
  }).optional(),
  minOrderQuantity: z.number().int().positive({
    message: 'Minimum order quantity must be a positive integer'
  }).optional(),
  maxOrderQuantity: z.number().int().positive({
    message: 'Maximum order quantity must be a positive integer'
  }).optional(),
  saleStartDate: z.string().datetime({
    message: 'Sale start date must be a valid ISO datetime'
  }).transform(str => new Date(str)).optional(),
  saleEndDate: z.string().datetime({
    message: 'Sale end date must be a valid ISO datetime'
  }).transform(str => new Date(str)).optional()
}).refine(
  data => !data.salePrice || data.salePrice < data.basePrice,
  {
    message: 'Sale price must be less than base price',
    path: ['salePrice']
  }
).refine(
  data => !data.maxOrderQuantity || !data.minOrderQuantity || data.maxOrderQuantity >= data.minOrderQuantity,
  {
    message: 'Maximum order quantity must be greater than or equal to minimum order quantity',
    path: ['maxOrderQuantity']
  }
).refine(
  data => !data.saleEndDate || !data.saleStartDate || new Date(data.saleEndDate) > new Date(data.saleStartDate),
  {
    message: 'Sale end date must be after sale start date',
    path: ['saleEndDate']
  }
);

export const updatePricingSchema = z.object({
  basePrice: z.number().positive({
    message: 'Base price must be a positive number'
  }).optional(),
  salePrice: z.number().positive({
    message: 'Sale price must be a positive number'
  }).nullable().optional(),
  costPrice: z.number().positive({
    message: 'Cost price must be a positive number'
  }).optional(),
  currency: z.string().length(3, {
    message: 'Currency must be a 3-letter code'
  }).optional(),
  taxRate: z.number().min(0).max(100, {
    message: 'Tax rate must be between 0 and 100'
  }).optional(),
  minOrderQuantity: z.number().int().positive({
    message: 'Minimum order quantity must be a positive integer'
  }).optional(),
  maxOrderQuantity: z.number().int().positive({
    message: 'Maximum order quantity must be a positive integer'
  }).nullable().optional(),
  saleStartDate: z.string().datetime({
    message: 'Sale start date must be a valid ISO datetime'
  }).transform(str => new Date(str)).nullable().optional(),
  saleEndDate: z.string().datetime({
    message: 'Sale end date must be a valid ISO datetime'
  }).transform(str => new Date(str)).nullable().optional()
}).refine(data => Object.keys(data).length > 0, {
  message: 'At least one field must be provided for update'
});

export const pricingQuerySchema = z.object({
  page: z.string().regex(/^\d+$/, {
    message: 'Page must be a positive integer'
  }).transform(Number).optional(),
  limit: z.string().regex(/^\d+$/, {
    message: 'Limit must be a positive integer'
  }).transform(Number).optional(),
  productId: z.string().uuid({
    message: 'Product ID must be a valid UUID'
  }).optional(),
  variantId: z.string().uuid({
    message: 'Variant ID must be a valid UUID'
  }).optional(),
  category: z.enum(['KITCHEN', 'BEDROOM'], {
    message: 'Category must be KITCHEN or BEDROOM'
  }).optional(),
  minPrice: z.string().regex(/^\d+\.?\d*$/, {
    message: 'Minimum price must be a valid number'
  }).transform(Number).optional(),
  maxPrice: z.string().regex(/^\d+\.?\d*$/, {
    message: 'Maximum price must be a valid number'
  }).transform(Number).optional(),
  isOnSale: z.string().transform(val => val === 'true').optional(),
  search: z.string().min(1, {
    message: 'Search query cannot be empty'
  }).optional(),
  sortBy: z.enum([
    'basePrice',
    'salePrice',
    'finalPrice',
    'discountPercentage',
    'createdAt',
    'updatedAt'
  ], {
    message: 'Invalid sort field'
  }).optional(),
  sortOrder: z.enum(['asc', 'desc'], {
    message: 'Sort order must be asc or desc'
  }).optional()
});

export const calculatePriceSchema = z.object({
  productId: z.string().uuid({
    message: 'Product ID must be a valid UUID'
  }),
  variantId: z.string().uuid({
    message: 'Variant ID must be a valid UUID'
  }),
  quantity: z.number().int().positive({
    message: 'Quantity must be a positive integer'
  }).optional()
});

export const bulkUpdatePricingSchema = z.object({
  updates: z.array(z.object({
    id: z.string().uuid({
      message: 'Pricing ID must be a valid UUID'
    }),
    basePrice: z.number().positive({
      message: 'Base price must be a positive number'
    }).optional(),
    salePrice: z.number().positive({
      message: 'Sale price must be a positive number'
    }).nullable().optional()
  })).min(1, {
    message: 'At least one pricing update is required'
  }).max(100, {
    message: 'Cannot update more than 100 pricings at once'
  })
});

export const applyDiscountSchema = z.object({
  discountPercentage: z.number().min(0).max(100, {
    message: 'Discount percentage must be between 0 and 100'
  }).optional(),
  discountAmount: z.number().positive({
    message: 'Discount amount must be a positive number'
  }).optional(),
  startDate: z.string().datetime({
    message: 'Start date must be a valid ISO datetime'
  }).transform(str => new Date(str)).optional(),
  endDate: z.string().datetime({
    message: 'End date must be a valid ISO datetime'
  }).transform(str => new Date(str)).optional()
}).refine(
  data => data.discountPercentage !== undefined || data.discountAmount !== undefined,
  {
    message: 'Either discount percentage or discount amount must be provided',
    path: ['discountPercentage']
  }
).refine(
  data => !data.endDate || !data.startDate || new Date(data.endDate) > new Date(data.startDate),
  {
    message: 'End date must be after start date',
    path: ['endDate']
  }
);

export const pricingIdSchema = z.object({
  id: z.string().uuid({
    message: 'Pricing ID must be a valid UUID'
  })
});

export const duplicatePricingSchema = z.object({
  targetProductId: z.string().uuid({
    message: 'Target product ID must be a valid UUID'
  }),
  targetVariantId: z.string().uuid({
    message: 'Target variant ID must be a valid UUID'
  })
});

export const exportPricingSchema = z.object({
  format: z.enum(['JSON', 'CSV', 'EXCEL'], {
    message: 'Format must be JSON, CSV, or EXCEL'
  }).optional(),
  category: z.enum(['KITCHEN', 'BEDROOM'], {
    message: 'Category must be KITCHEN or BEDROOM'
  }).optional(),
  productId: z.string().uuid({
    message: 'Product ID must be a valid UUID'
  }).optional(),
  isOnSale: z.string().transform(val => val === 'true').optional()
});

export const priceRangeSchema = z.object({
  minPrice: z.number().min(0, {
    message: 'Minimum price must be non-negative'
  }),
  maxPrice: z.number().positive({
    message: 'Maximum price must be positive'
  })
}).refine(
  data => data.maxPrice > data.minPrice,
  {
    message: 'Maximum price must be greater than minimum price',
    path: ['maxPrice']
  }
);

export type CreatePricingInput = z.infer<typeof createPricingSchema>;
export type UpdatePricingInput = z.infer<typeof updatePricingSchema>;
export type PricingQueryInput = z.infer<typeof pricingQuerySchema>;
export type CalculatePriceInput = z.infer<typeof calculatePriceSchema>;
export type BulkUpdatePricingInput = z.infer<typeof bulkUpdatePricingSchema>;
export type ApplyDiscountInput = z.infer<typeof applyDiscountSchema>;
export type PricingIdInput = z.infer<typeof pricingIdSchema>;
export type DuplicatePricingInput = z.infer<typeof duplicatePricingSchema>;
export type ExportPricingInput = z.infer<typeof exportPricingSchema>;
export type PriceRangeInput = z.infer<typeof priceRangeSchema>;