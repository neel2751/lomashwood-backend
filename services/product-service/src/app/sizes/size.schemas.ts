import { z } from 'zod';

export const SizeSchemas = {
  create: z.object({
    body: z.object({
      name: z.string()
        .min(1, 'Size name is required')
        .max(100, 'Size name must not exceed 100 characters')
        .trim(),
      title: z.string()
        .min(1, 'Size title is required')
        .max(200, 'Size title must not exceed 200 characters')
        .trim()
        .optional(),
      description: z.string()
        .max(1000, 'Description must not exceed 1000 characters')
        .optional(),
      image: z.string()
        .url('Invalid image URL')
        .optional(),
      width: z.number()
        .positive('Width must be a positive number')
        .optional(),
      height: z.number()
        .positive('Height must be a positive number')
        .optional(),
      depth: z.number()
        .positive('Depth must be a positive number')
        .optional(),
      unit: z.enum(['mm', 'cm', 'inch', 'feet'])
        .optional()
        .default('mm'),
      category: z.enum(['KITCHEN', 'BEDROOM', 'BOTH'])
        .optional()
        .default('BOTH'),
      isActive: z.boolean()
        .optional()
        .default(true),
      sortOrder: z.number()
        .int()
        .min(0)
        .optional(),
      metadata: z.record(z.any())
        .optional()
    })
  }),

  update: z.object({
    params: z.object({
      id: z.string().uuid('Invalid size ID format')
    }),
    body: z.object({
      name: z.string()
        .min(1, 'Size name is required')
        .max(100, 'Size name must not exceed 100 characters')
        .trim()
        .optional(),
      title: z.string()
        .min(1, 'Size title is required')
        .max(200, 'Size title must not exceed 200 characters')
        .trim()
        .optional(),
      description: z.string()
        .max(1000, 'Description must not exceed 1000 characters')
        .optional(),
      image: z.string()
        .url('Invalid image URL')
        .optional(),
      width: z.number()
        .positive('Width must be a positive number')
        .optional(),
      height: z.number()
        .positive('Height must be a positive number')
        .optional(),
      depth: z.number()
        .positive('Depth must be a positive number')
        .optional(),
      unit: z.enum(['mm', 'cm', 'inch', 'feet'])
        .optional(),
      category: z.enum(['KITCHEN', 'BEDROOM', 'BOTH'])
        .optional(),
      isActive: z.boolean()
        .optional(),
      sortOrder: z.number()
        .int()
        .min(0)
        .optional(),
      metadata: z.record(z.any())
        .optional()
    }).refine(
      data => Object.keys(data).length > 0,
      { message: 'At least one field must be provided for update' }
    )
  }),

  getById: z.object({
    params: z.object({
      id: z.string().uuid('Invalid size ID format')
    })
  }),

  delete: z.object({
    params: z.object({
      id: z.string().uuid('Invalid size ID format')
    })
  }),

  search: z.object({
    query: z.object({
      q: z.string()
        .min(1, 'Search query must not be empty')
        .max(100)
        .optional(),
      category: z.enum(['KITCHEN', 'BEDROOM', 'BOTH'])
        .optional(),
      isActive: z.string()
        .transform(val => val === 'true')
        .optional(),
      page: z.string()
        .transform(val => parseInt(val, 10))
        .refine(val => !isNaN(val) && val > 0, 'Page must be a positive number')
        .optional()
        .default('1'),
      limit: z.string()
        .transform(val => parseInt(val, 10))
        .refine(val => !isNaN(val) && val > 0 && val <= 100, 'Limit must be between 1 and 100')
        .optional()
        .default('20'),
      sortBy: z.enum(['name', 'title', 'createdAt', 'sortOrder', 'updatedAt'])
        .optional()
        .default('sortOrder'),
      sortOrder: z.enum(['asc', 'desc'])
        .optional()
        .default('asc')
    })
  }),

  updateStatus: z.object({
    params: z.object({
      id: z.string().uuid('Invalid size ID format')
    }),
    body: z.object({
      isActive: z.boolean()
    })
  }),

  bulkCreate: z.object({
    body: z.object({
      sizes: z.array(
        z.object({
          name: z.string()
            .min(1, 'Size name is required')
            .max(100, 'Size name must not exceed 100 characters')
            .trim(),
          title: z.string()
            .min(1, 'Size title is required')
            .max(200, 'Size title must not exceed 200 characters')
            .trim()
            .optional(),
          description: z.string()
            .max(1000, 'Description must not exceed 1000 characters')
            .optional(),
          image: z.string()
            .url('Invalid image URL')
            .optional(),
          width: z.number()
            .positive('Width must be a positive number')
            .optional(),
          height: z.number()
            .positive('Height must be a positive number')
            .optional(),
          depth: z.number()
            .positive('Depth must be a positive number')
            .optional(),
          unit: z.enum(['mm', 'cm', 'inch', 'feet'])
            .optional()
            .default('mm'),
          category: z.enum(['KITCHEN', 'BEDROOM', 'BOTH'])
            .optional()
            .default('BOTH'),
          isActive: z.boolean()
            .optional()
            .default(true),
          sortOrder: z.number()
            .int()
            .min(0)
            .optional()
        })
      )
      .min(1, 'At least one size must be provided')
      .max(50, 'Cannot create more than 50 sizes at once')
    })
  }),

  bulkDelete: z.object({
    body: z.object({
      ids: z.array(z.string().uuid('Invalid size ID format'))
        .min(1, 'At least one size ID must be provided')
        .max(50, 'Cannot delete more than 50 sizes at once')
    })
  }),

  getByCategory: z.object({
    params: z.object({
      category: z.enum(['KITCHEN', 'BEDROOM', 'BOTH'])
    }),
    query: z.object({
      isActive: z.string()
        .transform(val => val === 'true')
        .optional(),
      page: z.string()
        .transform(val => parseInt(val, 10))
        .refine(val => !isNaN(val) && val > 0, 'Page must be a positive number')
        .optional()
        .default('1'),
      limit: z.string()
        .transform(val => parseInt(val, 10))
        .refine(val => !isNaN(val) && val > 0 && val <= 100, 'Limit must be between 1 and 100')
        .optional()
        .default('20')
    })
  })
};

export type CreateSizeInput = z.infer<typeof SizeSchemas.create>['body'];
export type UpdateSizeInput = z.infer<typeof SizeSchemas.update>['body'];
export type SearchSizeInput = z.infer<typeof SizeSchemas.search>['query'];
export type BulkCreateSizeInput = z.infer<typeof SizeSchemas.bulkCreate>['body'];
export type BulkDeleteSizeInput = z.infer<typeof SizeSchemas.bulkDelete>['body'];