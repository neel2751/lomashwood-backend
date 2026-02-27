import { z } from 'zod';

export const getProductsSchema = z.object({
  query: z.object({
    category: z.enum(['KITCHEN', 'BEDROOM']).optional(),
    colours: z.string().optional(),
    style: z.string().optional(),
    finish: z.string().optional(),
    range: z.string().optional(),
    sortBy: z.enum(['price_asc', 'price_desc', 'newest', 'popular', 'name_asc', 'name_desc']).optional(),
    page: z.string().regex(/^\d+$/).transform(Number).optional(),
    limit: z.string().regex(/^\d+$/).transform(Number).optional(),
    search: z.string().optional(),
  }),
});

export const getProductByIdSchema = z.object({
  params: z.object({
    id: z.string().uuid('Invalid product ID format'),
  }),
});

export const getProductBySlugSchema = z.object({
  params: z.object({
    slug: z.string().min(1, 'Slug is required'),
  }),
});

export const createProductSchema = z.object({
  body: z.object({
    title: z.string().min(3, 'Title must be at least 3 characters'),
    description: z.string().min(10, 'Description must be at least 10 characters'),
    category: z.enum(['KITCHEN', 'BEDROOM']),
    rangeName: z.string().min(2, 'Range name is required'),
    price: z.number().positive('Price must be positive').optional(),
    images: z.array(z.string().url('Invalid image URL')).min(1, 'At least one image is required'),
    colourIds: z.array(z.string().uuid('Invalid colour ID')).min(1, 'At least one colour is required'),
    units: z.array(z.object({
      image: z.string().url('Invalid unit image URL'),
      title: z.string().min(2, 'Unit title is required'),
      description: z.string().min(5, 'Unit description is required'),
    })).optional(),
    style: z.string().optional(),
    finish: z.string().optional(),
    isActive: z.boolean().optional(),
    isFeatured: z.boolean().optional(),
  }),
});

export const updateProductSchema = z.object({
  params: z.object({
    id: z.string().uuid('Invalid product ID format'),
  }),
  body: z.object({
    title: z.string().min(3, 'Title must be at least 3 characters').optional(),
    description: z.string().min(10, 'Description must be at least 10 characters').optional(),
    category: z.enum(['KITCHEN', 'BEDROOM']).optional(),
    rangeName: z.string().min(2, 'Range name is required').optional(),
    price: z.number().positive('Price must be positive').optional(),
    images: z.array(z.string().url('Invalid image URL')).optional(),
    colourIds: z.array(z.string().uuid('Invalid colour ID')).optional(),
    units: z.array(z.object({
      image: z.string().url('Invalid unit image URL'),
      title: z.string().min(2, 'Unit title is required'),
      description: z.string().min(5, 'Unit description is required'),
    })).optional(),
    style: z.string().optional(),
    finish: z.string().optional(),
    isActive: z.boolean().optional(),
    isFeatured: z.boolean().optional(),
  }),
});

export const deleteProductSchema = z.object({
  params: z.object({
    id: z.string().uuid('Invalid product ID format'),
  }),
});

export const getProductsByRangeSchema = z.object({
  query: z.object({
    rangeName: z.string().min(1, 'Range name is required'),
    category: z.enum(['KITCHEN', 'BEDROOM']).optional(),
  }),
});

export const getProductsByCategorySchema = z.object({
  params: z.object({
    category: z.enum(['KITCHEN', 'BEDROOM']),
  }),
  query: z.object({
    page: z.string().regex(/^\d+$/).transform(Number).optional(),
    limit: z.string().regex(/^\d+$/).transform(Number).optional(),
  }),
});

export const bulkUpdateProductsSchema = z.object({
  body: z.object({
    productIds: z.array(z.string().uuid('Invalid product ID')).min(1, 'At least one product ID is required'),
    updates: z.object({
      isActive: z.boolean().optional(),
      isFeatured: z.boolean().optional(),
      price: z.number().positive('Price must be positive').optional(),
    }),
  }),
});

export type GetProductsInput = z.infer<typeof getProductsSchema>['query'];
export type GetProductByIdInput = z.infer<typeof getProductByIdSchema>['params'];
export type GetProductBySlugInput = z.infer<typeof getProductBySlugSchema>['params'];
export type CreateProductInput = z.infer<typeof createProductSchema>['body'];
export type UpdateProductInput = z.infer<typeof updateProductSchema>;
export type DeleteProductInput = z.infer<typeof deleteProductSchema>['params'];
export type GetProductsByRangeInput = z.infer<typeof getProductsByRangeSchema>['query'];
export type GetProductsByCategoryInput = z.infer<typeof getProductsByCategorySchema>;
export type BulkUpdateProductsInput = z.infer<typeof bulkUpdateProductsSchema>['body'];