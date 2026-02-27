import { z } from 'zod';

const hexColorRegex = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/;

export const ColourSchemas = {
  create: z.object({
    body: z.object({
      name: z.string()
        .min(1, 'Colour name is required')
        .max(100, 'Colour name must not exceed 100 characters')
        .trim(),
      hexCode: z.string()
        .regex(hexColorRegex, 'Invalid hex color code format. Use #RRGGBB or #RGB')
        .transform(val => val.toUpperCase()),
      description: z.string()
        .max(500, 'Description must not exceed 500 characters')
        .optional(),
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
      id: z.string().uuid('Invalid colour ID format')
    }),
    body: z.object({
      name: z.string()
        .min(1, 'Colour name is required')
        .max(100, 'Colour name must not exceed 100 characters')
        .trim()
        .optional(),
      hexCode: z.string()
        .regex(hexColorRegex, 'Invalid hex color code format. Use #RRGGBB or #RGB')
        .transform(val => val.toUpperCase())
        .optional(),
      description: z.string()
        .max(500, 'Description must not exceed 500 characters')
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
      id: z.string().uuid('Invalid colour ID format')
    })
  }),

  delete: z.object({
    params: z.object({
      id: z.string().uuid('Invalid colour ID format')
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
      sortBy: z.enum(['name', 'createdAt', 'sortOrder', 'updatedAt'])
        .optional()
        .default('sortOrder'),
      sortOrder: z.enum(['asc', 'desc'])
        .optional()
        .default('asc')
    })
  }),

  getByHex: z.object({
    params: z.object({
      hexCode: z.string()
        .regex(/^[A-Fa-f0-9]{6}$|^[A-Fa-f0-9]{3}$/, 'Invalid hex code format. Use RRGGBB or RGB without #')
        .transform(val => `#${val.toUpperCase()}`)
    })
  }),

  updateStatus: z.object({
    params: z.object({
      id: z.string().uuid('Invalid colour ID format')
    }),
    body: z.object({
      isActive: z.boolean()
    })
  }),

  bulkCreate: z.object({
    body: z.object({
      colours: z.array(
        z.object({
          name: z.string()
            .min(1, 'Colour name is required')
            .max(100, 'Colour name must not exceed 100 characters')
            .trim(),
          hexCode: z.string()
            .regex(hexColorRegex, 'Invalid hex color code format. Use #RRGGBB or #RGB')
            .transform(val => val.toUpperCase()),
          description: z.string()
            .max(500, 'Description must not exceed 500 characters')
            .optional(),
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
      .min(1, 'At least one colour must be provided')
      .max(50, 'Cannot create more than 50 colours at once')
    })
  }),

  bulkDelete: z.object({
    body: z.object({
      ids: z.array(z.string().uuid('Invalid colour ID format'))
        .min(1, 'At least one colour ID must be provided')
        .max(50, 'Cannot delete more than 50 colours at once')
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

export type CreateColourInput = z.infer<typeof ColourSchemas.create>['body'];
export type UpdateColourInput = z.infer<typeof ColourSchemas.update>['body'];
export type SearchColourInput = z.infer<typeof ColourSchemas.search>['query'];
export type BulkCreateColourInput = z.infer<typeof ColourSchemas.bulkCreate>['body'];
export type BulkDeleteColourInput = z.infer<typeof ColourSchemas.bulkDelete>['body'];