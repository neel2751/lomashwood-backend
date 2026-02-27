import { z } from 'zod';

export const createProfileSchema = z.object({
  body: z.object({
    firstName: z.string().min(1).max(100),
    lastName: z.string().min(1).max(100),
    phone: z.string().regex(/^\+?[1-9]\d{1,14}$/),
    dateOfBirth: z.string().datetime().optional(),
    avatar: z.string().url().optional()
  })
});

export const updateProfileSchema = z.object({
  body: z.object({
    firstName: z.string().min(1).max(100).optional(),
    lastName: z.string().min(1).max(100).optional(),
    phone: z.string().regex(/^\+?[1-9]\d{1,14}$/).optional(),
    dateOfBirth: z.string().datetime().optional(),
    avatar: z.string().url().optional()
  })
});

export const addToWishlistSchema = z.object({
  body: z.object({
    productId: z.string().uuid()
  })
});

export const createReviewSchema = z.object({
  body: z.object({
    productId: z.string().uuid(),
    rating: z.number().int().min(1).max(5),
    title: z.string().min(1).max(200),
    comment: z.string().min(10).max(2000),
    images: z.array(z.string().url()).max(5).optional()
  })
});

export const createSupportTicketSchema = z.object({
  body: z.object({
    subject: z.string().min(1).max(200),
    category: z.enum([
      'PRODUCT_INQUIRY',
      'ORDER_ISSUE',
      'APPOINTMENT',
      'TECHNICAL',
      'BILLING',
      'GENERAL'
    ]),
    priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).default('MEDIUM'),
    message: z.string().min(10).max(5000),
    attachments: z.array(z.string().url()).max(5).optional()
  })
});

export const updateSupportTicketSchema = z.object({
  body: z.object({
    status: z.enum(['OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED']).optional(),
    message: z.string().min(1).max(5000).optional()
  })
});

export type CreateProfileInput = z.infer<typeof createProfileSchema>;
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
export type AddToWishlistInput = z.infer<typeof addToWishlistSchema>;
export type CreateReviewInput = z.infer<typeof createReviewSchema>;
export type CreateSupportTicketInput = z.infer<typeof createSupportTicketSchema>;
export type UpdateSupportTicketInput = z.infer<typeof updateSupportTicketSchema>;