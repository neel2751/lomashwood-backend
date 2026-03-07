import { z } from 'zod';

// Common validation schemas
export const uuidSchema = z.string().uuid('Invalid UUID format');

export const emailSchema = z.string().email('Invalid email format');

export const passwordSchema = z.string()
  .min(8, 'Password must be at least 8 characters long')
  .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/, 
    'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character');

export const phoneSchema = z.string()
  .regex(/^\+?[1-9]\d{1,14}$/, 'Invalid phone number format');

export const paginationSchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
});

export const sortingSchema = z.object({
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

export const dateRangeSchema = z.object({
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
}).refine((data) => {
  if (data.startDate && data.endDate) {
    return new Date(data.startDate) <= new Date(data.endDate);
  }
  return true;
}, 'End date must be after start date');

// User validation schemas
export const userRegistrationSchema = z.object({
  firstName: z.string().min(1, 'First name is required').max(50, 'First name must be less than 50 characters'),
  lastName: z.string().min(1, 'Last name is required').max(50, 'Last name must be less than 50 characters'),
  email: emailSchema,
  password: passwordSchema,
  phone: phoneSchema.optional(),
  dateOfBirth: z.string().datetime().optional(),
  gender: z.enum(['MALE', 'FEMALE', 'OTHER']).optional(),
});

export const userLoginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, 'Password is required'),
});

export const userUpdateSchema = z.object({
  firstName: z.string().min(1).max(50).optional(),
  lastName: z.string().min(1).max(50).optional(),
  phone: phoneSchema.optional(),
  dateOfBirth: z.string().datetime().optional(),
  gender: z.enum(['MALE', 'FEMALE', 'OTHER']).optional(),
  preferences: z.record(z.any()).optional(),
});

// Product validation schemas
export const productCreateSchema = z.object({
  name: z.string().min(1, 'Product name is required').max(200, 'Product name must be less than 200 characters'),
  slug: z.string().min(1, 'Product slug is required').max(200, 'Product slug must be less than 200 characters'),
  description: z.string().min(1, 'Product description is required'),
  shortDescription: z.string().max(500, 'Short description must be less than 500 characters').optional(),
  price: z.number().min(0, 'Price must be non-negative'),
  compareAtPrice: z.number().min(0, 'Compare at price must be non-negative').optional(),
  cost: z.number().min(0, 'Cost must be non-negative').optional(),
  images: z.array(z.string().url()).min(1, 'At least one product image is required'),
  categoryId: uuidSchema,
  sku: z.string().min(1, 'SKU is required').max(50, 'SKU must be less than 50 characters'),
  weight: z.number().min(0, 'Weight must be non-negative').optional(),
  dimensions: z.object({
    length: z.number().min(0),
    width: z.number().min(0),
    height: z.number().min(0),
    unit: z.enum(['cm', 'in', 'mm']),
  }).optional(),
  specifications: z.record(z.any()).optional(),
  seoTitle: z.string().max(60, 'SEO title must be less than 60 characters').optional(),
  seoDescription: z.string().max(160, 'SEO description must be less than 160 characters').optional(),
  seoKeywords: z.string().max(255, 'SEO keywords must be less than 255 characters').optional(),
});

export const productUpdateSchema = productCreateSchema.partial();

export const productFilterSchema = z.object({
  search: z.string().optional(),
  category: uuidSchema.optional(),
  colour: uuidSchema.optional(),
  size: uuidSchema.optional(),
  minPrice: z.number().min(0).optional(),
  maxPrice: z.number().min(0).optional(),
  featured: z.coerce.boolean().optional(),
  status: z.enum(['ACTIVE', 'INACTIVE', 'DRAFT']).optional(),
  ...paginationSchema.shape,
  ...sortingSchema.shape,
});

// Order validation schemas
export const orderCreateSchema = z.object({
  customerId: uuidSchema,
  items: z.array(z.object({
    productId: uuidSchema,
    quantity: z.number().min(1, 'Quantity must be at least 1'),
    unitPrice: z.number().min(0, 'Unit price must be non-negative'),
  })).min(1, 'Order must have at least one item'),
  shippingAddress: z.object({
    street: z.string().min(1, 'Street is required'),
    city: z.string().min(1, 'City is required'),
    postalCode: z.string().min(1, 'Postal code is required'),
    country: z.string().min(1, 'Country is required'),
  }),
  billingAddress: z.object({
    street: z.string().min(1, 'Street is required'),
    city: z.string().min(1, 'City is required'),
    postalCode: z.string().min(1, 'Postal code is required'),
    country: z.string().min(1, 'Country is required'),
  }),
  notes: z.string().max(1000, 'Notes must be less than 1000 characters').optional(),
});

export const orderUpdateSchema = z.object({
  status: z.enum(['PENDING', 'CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED', 'REFUNDED']).optional(),
  trackingNumber: z.string().optional(),
  notes: z.string().max(1000).optional(),
});

// Appointment validation schemas
export const appointmentCreateSchema = z.object({
  customerId: uuidSchema,
  consultantId: uuidSchema.optional(),
  showroomId: uuidSchema.optional(),
  type: z.enum(['HOME', 'VIRTUAL', 'SHOWROOM']),
  serviceType: z.enum(['KITCHEN', 'BEDROOM', 'BOTH']),
  scheduledDate: z.string().datetime(),
  scheduledTime: z.string().regex(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid time format (HH:MM)'),
  duration: z.number().min(15, 'Duration must be at least 15 minutes').max(240, 'Duration must be less than 240 minutes'),
  customerDetails: z.object({
    name: z.string().min(1, 'Customer name is required'),
    email: emailSchema,
    phone: phoneSchema,
  }),
  notes: z.string().max(1000, 'Notes must be less than 1000 characters').optional(),
});

export const appointmentUpdateSchema = z.object({
  status: z.enum(['PENDING', 'CONFIRMED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED']).optional(),
  scheduledDate: z.string().datetime().optional(),
  scheduledTime: z.string().regex(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/).optional(),
  notes: z.string().max(1000).optional(),
});

// Customer validation schemas
export const customerCreateSchema = z.object({
  userId: uuidSchema,
  firstName: z.string().min(1).max(50),
  lastName: z.string().min(1).max(50),
  phone: phoneSchema.optional(),
  dateOfBirth: z.string().datetime().optional(),
  gender: z.enum(['MALE', 'FEMALE', 'OTHER']).optional(),
  preferences: z.record(z.any()).optional(),
  addresses: z.array(z.object({
    type: z.enum(['HOME', 'WORK', 'BILLING', 'SHIPPING']),
    street: z.string().min(1),
    city: z.string().min(1),
    postalCode: z.string().min(1),
    country: z.string().min(1),
    isDefault: z.boolean().default(false),
  })).optional(),
});

// Review validation schemas
export const reviewCreateSchema = z.object({
  customerId: uuidSchema,
  productId: uuidSchema,
  rating: z.number().min(1, 'Rating must be at least 1').max(5, 'Rating must be at most 5'),
  title: z.string().min(1, 'Review title is required').max(200, 'Title must be less than 200 characters'),
  content: z.string().min(1, 'Review content is required').max(2000, 'Content must be less than 2000 characters'),
  images: z.array(z.string().url()).max(5, 'Maximum 5 images allowed').optional(),
});

// Content validation schemas
export const blogCreateSchema = z.object({
  title: z.string().min(1, 'Blog title is required').max(200, 'Title must be less than 200 characters'),
  slug: z.string().min(1, 'Blog slug is required').max(200, 'Slug must be less than 200 characters'),
  excerpt: z.string().max(500, 'Excerpt must be less than 500 characters').optional(),
  content: z.string().min(1, 'Blog content is required'),
  featuredImage: z.string().url().optional(),
  category: z.string().min(1, 'Category is required'),
  tags: z.array(z.string()).max(10, 'Maximum 10 tags allowed').optional(),
  author: z.string().min(1, 'Author is required'),
  authorId: uuidSchema,
  status: z.enum(['DRAFT', 'PUBLISHED', 'ARCHIVED']).default('DRAFT'),
  featured: z.boolean().default(false),
  seoTitle: z.string().max(60).optional(),
  seoDescription: z.string().max(160).optional(),
  seoKeywords: z.string().max(255).optional(),
});

// Notification validation schemas
export const notificationCreateSchema = z.object({
  userId: uuidSchema,
  type: z.enum(['EMAIL', 'SMS', 'PUSH', 'IN_APP']),
  title: z.string().min(1, 'Notification title is required').max(200),
  message: z.string().min(1, 'Notification message is required').max(1000),
  data: z.record(z.any()).optional(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).default('MEDIUM'),
  scheduledAt: z.string().datetime().optional(),
});

// File upload validation schemas
export const fileUploadSchema = z.object({
  file: z.any().refine((file) => file, 'File is required'),
  category: z.string().optional(),
  alt: z.string().max(200, 'Alt text must be less than 200 characters').optional(),
  caption: z.string().max(500, 'Caption must be less than 500 characters').optional(),
  tags: z.array(z.string()).max(10, 'Maximum 10 tags allowed').optional(),
});

// Validation helper functions
export const validateSchema = <T>(schema: z.ZodSchema<T>, data: unknown): { success: true; data: T } | { success: false; error: string } => {
  const result = schema.safeParse(data);
  
  if (result.success) {
    return { success: true, data: result.data };
  } else {
    const errorMessages = result.error.errors.map(err => err.message).join(', ');
    return { success: false, error: errorMessages };
  }
};

export const validateAndThrow = <T>(schema: z.ZodSchema<T>, data: unknown): T => {
  const result = schema.parse(data);
  return result;
};

// Express middleware for validation
export const validateBody = (schema: z.ZodSchema<any>) => {
  return (req: any, res: any, next: any) => {
    const result = schema.safeParse(req.body);
    
    if (!result.success) {
      const errorMessages = result.error.errors.map(err => ({
        field: err.path.join('.'),
        message: err.message,
      }));
      
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errorMessages,
      });
    }
    
    req.body = result.data;
    next();
  };
};

export const validateQuery = (schema: z.ZodSchema<any>) => {
  return (req: any, res: any, next: any) => {
    const result = schema.safeParse(req.query);
    
    if (!result.success) {
      const errorMessages = result.error.errors.map(err => ({
        field: err.path.join('.'),
        message: err.message,
      }));
      
      return res.status(400).json({
        success: false,
        message: 'Query validation failed',
        errors: errorMessages,
      });
    }
    
    req.query = result.data;
    next();
  };
};

export const validateParams = (schema: z.ZodSchema<any>) => {
  return (req: any, res: any, next: any) => {
    const result = schema.safeParse(req.params);
    
    if (!result.success) {
      const errorMessages = result.error.errors.map(err => ({
        field: err.path.join('.'),
        message: err.message,
      }));
      
      return res.status(400).json({
        success: false,
        message: 'Parameter validation failed',
        errors: errorMessages,
      });
    }
    
    req.params = result.data;
    next();
  };
};
