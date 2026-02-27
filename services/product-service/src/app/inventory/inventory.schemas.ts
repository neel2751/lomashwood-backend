import { z } from 'zod';

export const createInventorySchema = z.object({
  productId: z.string().uuid({
    message: 'Product ID must be a valid UUID'
  }),
  variantId: z.string().uuid({
    message: 'Variant ID must be a valid UUID'
  }),
  quantity: z.number().int().min(0, {
    message: 'Quantity must be a non-negative integer'
  }),
  lowStockThreshold: z.number().int().min(0, {
    message: 'Low stock threshold must be a non-negative integer'
  }).optional(),
  warehouseLocation: z.string().min(1, {
    message: 'Warehouse location is required'
  }).max(255, {
    message: 'Warehouse location must not exceed 255 characters'
  }).optional(),
  sku: z.string().min(1, {
    message: 'SKU is required'
  }).max(100, {
    message: 'SKU must not exceed 100 characters'
  }).optional()
});

export const updateInventorySchema = z.object({
  quantity: z.number().int().min(0, {
    message: 'Quantity must be a non-negative integer'
  }).optional(),
  lowStockThreshold: z.number().int().min(0, {
    message: 'Low stock threshold must be a non-negative integer'
  }).optional(),
  warehouseLocation: z.string().min(1, {
    message: 'Warehouse location cannot be empty'
  }).max(255, {
    message: 'Warehouse location must not exceed 255 characters'
  }).optional(),
  sku: z.string().min(1, {
    message: 'SKU cannot be empty'
  }).max(100, {
    message: 'SKU must not exceed 100 characters'
  }).optional()
}).refine(data => Object.keys(data).length > 0, {
  message: 'At least one field must be provided for update'
});

export const inventoryQuerySchema = z.object({
  page: z.string().regex(/^\d+$/, {
    message: 'Page must be a positive integer'
  }).transform(Number).optional(),
  limit: z.string().regex(/^\d+$/, {
    message: 'Limit must be a positive integer'
  }).transform(Number).optional(),
  status: z.enum(['IN_STOCK', 'LOW_STOCK', 'OUT_OF_STOCK'], {
    message: 'Status must be IN_STOCK, LOW_STOCK, or OUT_OF_STOCK'
  }).optional(),
  productId: z.string().uuid({
    message: 'Product ID must be a valid UUID'
  }).optional(),
  warehouseLocation: z.string().min(1, {
    message: 'Warehouse location cannot be empty'
  }).optional(),
  search: z.string().min(1, {
    message: 'Search query cannot be empty'
  }).optional(),
  sortBy: z.enum([
    'quantity',
    'reservedQuantity',
    'lowStockThreshold',
    'status',
    'createdAt',
    'updatedAt'
  ], {
    message: 'Invalid sort field'
  }).optional(),
  sortOrder: z.enum(['asc', 'desc'], {
    message: 'Sort order must be asc or desc'
  }).optional()
});

export const reserveInventorySchema = z.object({
  productId: z.string().uuid({
    message: 'Product ID must be a valid UUID'
  }),
  variantId: z.string().uuid({
    message: 'Variant ID must be a valid UUID'
  }),
  quantity: z.number().int().min(1, {
    message: 'Quantity must be a positive integer'
  }),
  orderId: z.string().uuid({
    message: 'Order ID must be a valid UUID'
  }).optional()
});

export const adjustInventorySchema = z.object({
  productId: z.string().uuid({
    message: 'Product ID must be a valid UUID'
  }),
  variantId: z.string().uuid({
    message: 'Variant ID must be a valid UUID'
  }),
  quantity: z.number().int().min(1, {
    message: 'Quantity must be a positive integer'
  }),
  reason: z.string().min(1, {
    message: 'Reason is required'
  }).max(500, {
    message: 'Reason must not exceed 500 characters'
  }).optional()
});

export const inventoryIdSchema = z.object({
  id: z.string().uuid({
    message: 'Inventory ID must be a valid UUID'
  })
});

export const bulkCreateInventorySchema = z.object({
  items: z.array(createInventorySchema).min(1, {
    message: 'At least one inventory item is required'
  }).max(100, {
    message: 'Cannot create more than 100 inventory items at once'
  })
});

export const checkAvailabilitySchema = z.object({
  productId: z.string().uuid({
    message: 'Product ID must be a valid UUID'
  }),
  variantId: z.string().uuid({
    message: 'Variant ID must be a valid UUID'
  }),
  quantity: z.number().int().min(1, {
    message: 'Quantity must be a positive integer'
  })
});

export type CreateInventoryInput = z.infer<typeof createInventorySchema>;
export type UpdateInventoryInput = z.infer<typeof updateInventorySchema>;
export type InventoryQueryInput = z.infer<typeof inventoryQuerySchema>;
export type ReserveInventoryInput = z.infer<typeof reserveInventorySchema>;
export type AdjustInventoryInput = z.infer<typeof adjustInventorySchema>;
export type InventoryIdInput = z.infer<typeof inventoryIdSchema>;
export type BulkCreateInventoryInput = z.infer<typeof bulkCreateInventorySchema>;
export type CheckAvailabilityInput = z.infer<typeof checkAvailabilitySchema>;