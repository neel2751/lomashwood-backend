import { z } from 'zod';

export const CategoryBaseSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100, 'Name is too long'),
  slug: z
    .string()
    .min(1, 'Slug is required')
    .max(100, 'Slug is too long')
    .regex(/^[a-z0-9-]+$/, 'Slug must contain only lowercase letters, numbers, and hyphens'),
  description: z.string().optional(),
  type: z.enum(['KITCHEN', 'BEDROOM'], {
    errorMap: () => ({ message: 'Type must be either KITCHEN or BEDROOM' }),
  }),
  image: z.string().url('Invalid image URL').optional(),
  icon: z.string().url('Invalid icon URL').optional(),
  parentId: z.string().uuid('Invalid parent ID').optional().nullable(),
  order: z.number().int().nonnegative('Order must be a non-negative integer').optional(),
  isActive: z.boolean().default(true),
  isFeatured: z.boolean().default(false),
  metaTitle: z.string().max(200, 'Meta title is too long').optional(),
  metaDescription: z.string().max(500, 'Meta description is too long').optional(),
  metaKeywords: z.string().max(500, 'Meta keywords is too long').optional(),
});

export const CreateCategorySchema = CategoryBaseSchema;

export const UpdateCategorySchema = CategoryBaseSchema.partial();

export const CategoryQuerySchema = z.object({
  page: z.string().regex(/^\d+$/).transform(Number).default('1'),
  limit: z.string().regex(/^\d+$/).transform(Number).default('20'),
  type: z.enum(['KITCHEN', 'BEDROOM']).optional(),
  isActive: z
    .string()
    .transform((val) => val === 'true')
    .optional(),
  isFeatured: z
    .string()
    .transform((val) => val === 'true')
    .optional(),
  search: z.string().optional(),
  sortBy: z.enum(['name_asc', 'name_desc', 'order', 'newest', 'oldest']).optional(),
  parentId: z.string().uuid('Invalid parent ID').optional(),
});

export const CategoryIdSchema = z.object({
  id: z.string().uuid('Invalid category ID'),
});

export const CategorySlugSchema = z.object({
  slug: z.string().min(1, 'Slug is required'),
});

export const BulkDeleteCategorySchema = z.object({
  ids: z
    .array(z.string().uuid('Invalid category ID'))
    .min(1, 'At least one category ID is required')
    .max(100, 'Cannot delete more than 100 categories at once'),
});

export const CategoryTypeSchema = z.object({
  type: z.enum(['KITCHEN', 'BEDROOM']),
});

export const CategorySearchSchema = z.object({
  query: z.string().min(2, 'Search query must be at least 2 characters').max(100),
  limit: z.string().regex(/^\d+$/).transform(Number).default('20'),
});

export const CategoryReorderSchema = z.object({
  categoryOrders: z
    .array(
      z.object({
        id: z.string().uuid('Invalid category ID'),
        order: z.number().int().nonnegative('Order must be a non-negative integer'),
      })
    )
    .min(1, 'At least one category order is required'),
});

export const CategoryExportSchema = z.object({
  format: z.enum(['csv', 'json', 'xlsx']).default('csv'),
  includeInactive: z
    .string()
    .transform((val) => val === 'true')
    .optional(),
});

export const CategoryToggleSchema = z.object({
  field: z.enum(['isActive', 'isFeatured']),
  value: z.boolean(),
});

export const CategoryFilterSchema = z.object({
  types: z.array(z.enum(['KITCHEN', 'BEDROOM'])).optional(),
  isActive: z.boolean().optional(),
  isFeatured: z.boolean().optional(),
  hasProducts: z.boolean().optional(),
  parentId: z.string().uuid().optional().nullable(),
});

export const CategoryResponseSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  slug: z.string(),
  description: z.string().nullable(),
  type: z.enum(['KITCHEN', 'BEDROOM']),
  image: z.string().url().nullable(),
  icon: z.string().url().nullable(),
  parentId: z.string().uuid().nullable(),
  order: z.number(),
  isActive: z.boolean(),
  isFeatured: z.boolean(),
  metaTitle: z.string().nullable(),
  metaDescription: z.string().nullable(),
  metaKeywords: z.string().nullable(),
  parent: z
    .object({
      id: z.string().uuid(),
      name: z.string(),
      slug: z.string(),
    })
    .nullable()
    .optional(),
  children: z
    .array(
      z.object({
        id: z.string().uuid(),
        name: z.string(),
        slug: z.string(),
        order: z.number(),
      })
    )
    .optional(),
  productCount: z.number().optional(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export const PaginatedCategoriesResponseSchema = z.object({
  data: z.array(CategoryResponseSchema),
  meta: z.object({
    total: z.number(),
    page: z.number(),
    limit: z.number(),
    totalPages: z.number(),
    hasNextPage: z.boolean(),
    hasPreviousPage: z.boolean(),
  }),
});

export const CategoryHierarchySchema: z.ZodType<any> = z.lazy(() =>
  z.object({
    id: z.string().uuid(),
    name: z.string(),
    slug: z.string(),
    type: z.enum(['KITCHEN', 'BEDROOM']),
    image: z.string().url().nullable(),
    icon: z.string().url().nullable(),
    order: z.number(),
    productCount: z.number(),
    children: z.array(CategoryHierarchySchema).optional(),
  })
);

export const CategoryStatisticsSchema = z.object({
  totalCategories: z.number(),
  activeCategories: z.number(),
  featuredCategories: z.number(),
  kitchenCategories: z.number(),
  bedroomCategories: z.number(),
  categoriesWithProducts: z.number(),
});

export const CategoryWithProductsSchema = z.object({
  category: CategoryResponseSchema,
  products: z.array(z.any()),
  meta: z.object({
    total: z.number(),
    page: z.number(),
    limit: z.number(),
    totalPages: z.number(),
    hasNextPage: z.boolean(),
    hasPreviousPage: z.boolean(),
  }),
});

export const BulkDeleteResultSchema = z.object({
  successful: z.array(z.string().uuid()),
  failed: z.array(
    z.object({
      id: z.string().uuid(),
      error: z.string(),
    })
  ),
  total: z.number(),
  successCount: z.number(),
  failCount: z.number(),
});

export type CategoryBase = z.infer<typeof CategoryBaseSchema>;
export type CreateCategory = z.infer<typeof CreateCategorySchema>;
export type UpdateCategory = z.infer<typeof UpdateCategorySchema>;
export type CategoryQuery = z.infer<typeof CategoryQuerySchema>;
export type CategoryId = z.infer<typeof CategoryIdSchema>;
export type CategorySlug = z.infer<typeof CategorySlugSchema>;
export type BulkDeleteCategory = z.infer<typeof BulkDeleteCategorySchema>;
export type CategoryType = z.infer<typeof CategoryTypeSchema>;
export type CategorySearch = z.infer<typeof CategorySearchSchema>;
export type CategoryReorder = z.infer<typeof CategoryReorderSchema>;
export type CategoryExport = z.infer<typeof CategoryExportSchema>;
export type CategoryToggle = z.infer<typeof CategoryToggleSchema>;
export type CategoryFilter = z.infer<typeof CategoryFilterSchema>;
export type CategoryResponse = z.infer<typeof CategoryResponseSchema>;
export type PaginatedCategoriesResponse = z.infer<typeof PaginatedCategoriesResponseSchema>;
export type CategoryHierarchy = z.infer<typeof CategoryHierarchySchema>;
export type CategoryStatistics = z.infer<typeof CategoryStatisticsSchema>;
export type CategoryWithProducts = z.infer<typeof CategoryWithProductsSchema>;
export type BulkDeleteResult = z.infer<typeof BulkDeleteResultSchema>;