import { z } from 'zod';

// ─── Enum Schemas (match Prisma schema exactly) ───────────────────────────────

export const ProductCategorySchema = z.enum(['KITCHEN', 'BEDROOM'], {
  errorMap: () => ({ message: 'Category must be KITCHEN or BEDROOM' }),
});

export const ProductStatusSchema = z.enum(['DRAFT', 'PUBLISHED', 'ARCHIVED'], {
  errorMap: () => ({ message: 'Status must be DRAFT, PUBLISHED, or ARCHIVED' }),
});

export const StyleTypeSchema = z.enum([
  'MODERN', 'TRADITIONAL', 'CONTEMPORARY', 'CLASSIC',
  'MINIMALIST', 'RUSTIC', 'SHAKER', 'HANDLELESS', 'INDUSTRIAL',
], {
  errorMap: () => ({ message: 'Invalid style type' }),
});

export const FinishTypeSchema = z.enum([
  'GLOSS', 'MATT', 'SATIN', 'TEXTURED', 'WOOD_GRAIN', 'METALLIC', 'LAMINATE',
], {
  errorMap: () => ({ message: 'Invalid finish type' }),
});

// ─── Nested Schemas ───────────────────────────────────────────────────────────

// Matches ProductImage model
export const ProductImageInputSchema = z.object({
  url: z.string().url('Invalid image URL'),
  altText: z.string().max(255).optional(),
  order: z.number().int().nonnegative().default(0),
});

// Matches ProductUnit model
export const ProductUnitSchema = z.object({
  image: z.string().url('Invalid unit image URL').optional(),
  title: z.string().min(1, 'Unit title is required').max(255),
  description: z.string().optional(),
  order: z.number().int().nonnegative().default(0),
});

// ─── Create Product Schema ────────────────────────────────────────────────────

export const CreateProductSchema = z.object({
  title: z.string().min(1, 'Title is required').max(255, 'Title is too long'),
  description: z.string().min(1, 'Description is required'),
  price: z.number().positive('Price must be positive').optional(),
  category: ProductCategorySchema,
  rangeName: z.string().max(100).optional(),
  status: ProductStatusSchema.default('DRAFT'),
  style: StyleTypeSchema.optional(),
  finish: FinishTypeSchema.optional(),
  slug: z.string().min(1, 'Slug is required').max(255)
    .regex(/^[a-z0-9-]+$/, 'Slug must be lowercase letters, numbers and hyphens only'),
  metaTitle: z.string().max(255).optional(),
  metaDescription: z.string().optional(),
  featured: z.boolean().default(false),
  sortOrder: z.number().int().nonnegative().default(0),
  // Relations
  images: z.array(ProductImageInputSchema).min(1, 'At least one image is required'),
  colourIds: z.array(z.string().uuid('Invalid colour ID')).min(1, 'At least one colour is required'),
  units: z.array(ProductUnitSchema).optional(),
  saleIds: z.array(z.string().uuid('Invalid sale ID')).optional(),
});

// ─── Update Product Schema ────────────────────────────────────────────────────

export const UpdateProductSchema = z.object({
  title: z.string().min(1).max(255).optional(),
  description: z.string().min(1).optional(),
  price: z.number().positive().optional().nullable(),
  category: ProductCategorySchema.optional(),
  rangeName: z.string().max(100).optional().nullable(),
  status: ProductStatusSchema.optional(),
  style: StyleTypeSchema.optional().nullable(),
  finish: FinishTypeSchema.optional().nullable(),
  slug: z.string().min(1).max(255)
    .regex(/^[a-z0-9-]+$/, 'Slug must be lowercase letters, numbers and hyphens only')
    .optional(),
  metaTitle: z.string().max(255).optional().nullable(),
  metaDescription: z.string().optional().nullable(),
  featured: z.boolean().optional(),
  sortOrder: z.number().int().nonnegative().optional(),
  // Relations
  images: z.array(ProductImageInputSchema).optional(),
  colourIds: z.array(z.string().uuid('Invalid colour ID')).optional(),
  units: z.array(ProductUnitSchema).optional(),
  saleIds: z.array(z.string().uuid('Invalid sale ID')).optional(),
});

// ─── Query Schema ─────────────────────────────────────────────────────────────

export const ProductQuerySchema = z.object({
  page: z.string().regex(/^\d+$/, 'Page must be a number').transform(Number).default('1'),
  limit: z.string().regex(/^\d+$/, 'Limit must be a number').transform(Number).default('20'),
  category: ProductCategorySchema.optional(),
  colours: z
    .string()
    .optional()
    .transform((val) => val?.split(',').filter(Boolean)),
  style: StyleTypeSchema.optional(),
  finish: FinishTypeSchema.optional(),
  range: z.string().optional(),
  sortBy: z
    .enum(['price_asc', 'price_desc', 'popularity', 'newest', 'title_asc', 'title_desc'])
    .optional(),
  search: z.string().min(1).max(255).optional(),
  featured: z
    .string()
    .optional()
    .transform((val) => (val !== undefined ? val === 'true' : undefined)),
  status: ProductStatusSchema.optional(),
  minPrice: z
    .string()
    .regex(/^\d+(\.\d{1,2})?$/, 'Invalid price format')
    .transform(Number)
    .optional(),
  maxPrice: z
    .string()
    .regex(/^\d+(\.\d{1,2})?$/, 'Invalid price format')
    .transform(Number)
    .optional(),
});

// ─── Param / Body Schemas ─────────────────────────────────────────────────────

export const ProductIdSchema = z.object({
  id: z.string().uuid('Invalid product ID'),
});

export const ProductSlugSchema = z.object({
  slug: z.string().min(1, 'Slug is required'),
});

export const BulkDeleteProductSchema = z.object({
  ids: z
    .array(z.string().uuid('Invalid product ID'))
    .min(1, 'At least one product ID is required'),
});

export const ProductStatusUpdateSchema = z.object({
  status: ProductStatusSchema,
});

export const ProductFeaturedToggleSchema = z.object({
  featured: z.boolean(),
});

// ─── Filter Schema ────────────────────────────────────────────────────────────

export const ProductFilterSchema = z.object({
  category: ProductCategorySchema.optional(),
  colourIds: z.array(z.string().uuid()).optional(),
  rangeNames: z.array(z.string()).optional(),
  minPrice: z.number().nonnegative().optional(),
  maxPrice: z.number().positive().optional(),
  featured: z.boolean().optional(),
  status: ProductStatusSchema.optional(),
  style: StyleTypeSchema.optional(),
  finish: FinishTypeSchema.optional(),
  saleIds: z.array(z.string().uuid()).optional(),
});

// ─── Response Schemas ─────────────────────────────────────────────────────────

export const ProductImageResponseSchema = z.object({
  id: z.string().uuid(),
  url: z.string().url(),
  altText: z.string().nullable(),
  order: z.number(),
});

export const ProductColourResponseSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  hexCode: z.string(),
});

export const ProductUnitResponseSchema = z.object({
  id: z.string().uuid(),
  image: z.string().url().nullable(),
  title: z.string(),
  description: z.string().nullable(),
  order: z.number(),
});

export const ProductResponseSchema = z.object({
  id: z.string().uuid(),
  title: z.string(),
  description: z.string(),
  price: z.number().nullable(),
  category: ProductCategorySchema,
  rangeName: z.string().nullable(),
  status: ProductStatusSchema,
  style: StyleTypeSchema.nullable(),
  finish: FinishTypeSchema.nullable(),
  slug: z.string(),
  metaTitle: z.string().nullable(),
  metaDescription: z.string().nullable(),
  featured: z.boolean(),
  viewCount: z.number(),
  sortOrder: z.number(),
  images: z.array(ProductImageResponseSchema),
  colours: z.array(ProductColourResponseSchema),
  units: z.array(ProductUnitResponseSchema),
  sales: z.array(
    z.object({
      id: z.string().uuid(),
      title: z.string(),
      description: z.string(),
      image: z.string().url(),
    })
  ),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export const PaginatedProductsResponseSchema = z.object({
  data: z.array(ProductResponseSchema),
  meta: z.object({
    total: z.number(),
    page: z.number(),
    limit: z.number(),
    totalPages: z.number(),
    hasNextPage: z.boolean(),
    hasPreviousPage: z.boolean(),
  }),
});

// ─── Utility Schemas ──────────────────────────────────────────────────────────

export const FeaturedProductsQuerySchema = z.object({
  limit: z.string().regex(/^\d+$/).transform(Number).default('8'),
  category: ProductCategorySchema.optional(),
});

export const ProductSearchSchema = z.object({
  query: z.string().min(1, 'Search query is required').max(255),
  category: ProductCategorySchema.optional(),
  limit: z.string().regex(/^\d+$/).transform(Number).default('20'),
});

export const RelatedProductsSchema = z.object({
  productId: z.string().uuid('Invalid product ID'),
  limit: z.string().regex(/^\d+$/).transform(Number).default('6'),
});

// ─── Inferred Types ───────────────────────────────────────────────────────────

export type CreateProduct = z.infer<typeof CreateProductSchema>;
export type UpdateProduct = z.infer<typeof UpdateProductSchema>;
export type ProductQuery = z.infer<typeof ProductQuerySchema>;
export type ProductId = z.infer<typeof ProductIdSchema>;
export type ProductSlug = z.infer<typeof ProductSlugSchema>;
export type BulkDeleteProduct = z.infer<typeof BulkDeleteProductSchema>;
export type ProductFilter = z.infer<typeof ProductFilterSchema>;
export type ProductResponse = z.infer<typeof ProductResponseSchema>;
export type PaginatedProductsResponse = z.infer<typeof PaginatedProductsResponseSchema>;
export type FeaturedProductsQuery = z.infer<typeof FeaturedProductsQuerySchema>;
export type ProductSearch = z.infer<typeof ProductSearchSchema>;
export type RelatedProducts = z.infer<typeof RelatedProductsSchema>;
export type ProductStatusUpdate = z.infer<typeof ProductStatusUpdateSchema>;
export type ProductFeaturedToggle = z.infer<typeof ProductFeaturedToggleSchema>;