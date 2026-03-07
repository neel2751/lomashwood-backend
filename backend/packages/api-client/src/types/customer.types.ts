import { z } from 'zod';

// Customer schema
export const CustomerSchema = z.object({
  id: z.string(),
  userId: z.string(),
  firstName: z.string(),
  lastName: z.string(),
  email: z.string().email(),
  phone: z.string().optional(),
  dateOfBirth: z.string().datetime().optional(),
  address: z.object({
    street: z.string(),
    city: z.string(),
    postcode: z.string(),
    country: z.string(),
  }).optional(),
  preferences: z.object({
    kitchen: z.boolean(),
    bedroom: z.boolean(),
    newsletter: z.boolean(),
    sms: z.boolean(),
  }).optional(),
  tags: z.array(z.string()).optional(),
  notes: z.string().optional(),
  isActive: z.boolean(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export type Customer = z.infer<typeof CustomerSchema>;

export const CreateCustomerSchema = z.object({
  userId: z.string(),
  firstName: z.string(),
  lastName: z.string(),
  email: z.string().email(),
  phone: z.string().optional(),
  dateOfBirth: z.string().datetime().optional(),
  address: z.object({
    street: z.string(),
    city: z.string(),
    postcode: z.string(),
    country: z.string(),
  }).optional(),
  preferences: z.object({
    kitchen: z.boolean(),
    bedroom: z.boolean(),
    newsletter: z.boolean(),
    sms: z.boolean(),
  }).optional(),
  tags: z.array(z.string()).optional(),
  notes: z.string().optional(),
});

export type CreateCustomerRequest = z.infer<typeof CreateCustomerSchema>;

export const UpdateCustomerSchema = z.object({
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  phone: z.string().optional(),
  dateOfBirth: z.string().datetime().optional(),
  address: z.object({
    street: z.string(),
    city: z.string(),
    postcode: z.string(),
    country: z.string(),
  }).optional(),
  preferences: z.object({
    kitchen: z.boolean(),
    bedroom: z.boolean(),
    newsletter: z.boolean(),
    sms: z.boolean(),
  }).optional(),
  tags: z.array(z.string()).optional(),
  notes: z.string().optional(),
  isActive: z.boolean().optional(),
});

export type UpdateCustomerRequest = z.infer<typeof UpdateCustomerSchema>;

// Review schema
export const ReviewSchema = z.object({
  id: z.string(),
  customerId: z.string(),
  productId: z.string().optional(),
  appointmentId: z.string().optional(),
  rating: z.number().min(1).max(5),
  title: z.string(),
  content: z.string(),
  images: z.array(z.string()).optional(),
  status: z.enum(['pending', 'approved', 'rejected']),
  response: z.string().optional(),
  helpfulCount: z.number(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export type Review = z.infer<typeof ReviewSchema>;

export const CreateReviewSchema = z.object({
  productId: z.string().optional(),
  appointmentId: z.string().optional(),
  rating: z.number().min(1).max(5),
  title: z.string(),
  content: z.string(),
  images: z.array(z.string()).optional(),
});

export type CreateReviewRequest = z.infer<typeof CreateReviewSchema>;

export const ModerateReviewSchema = z.object({
  status: z.enum(['pending', 'approved', 'rejected']),
  response: z.string().optional(),
});

export type ModerateReviewRequest = z.infer<typeof ModerateReviewSchema>;

// Support ticket schema
export const SupportTicketSchema = z.object({
  id: z.string(),
  customerId: z.string(),
  subject: z.string(),
  description: z.string(),
  category: z.enum(['general', 'technical', 'billing', 'appointment', 'product']),
  priority: z.enum(['low', 'medium', 'high', 'urgent']),
  status: z.enum(['open', 'in-progress', 'waiting-customer', 'resolved', 'closed']),
  assignedTo: z.string().optional(),
  messages: z.array(z.object({
    id: z.string(),
    senderId: z.string(),
    senderType: z.enum(['customer', 'staff']),
    content: z.string(),
    attachments: z.array(z.string()).optional(),
    createdAt: z.string().datetime(),
  })),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export type SupportTicket = z.infer<typeof SupportTicketSchema>;

export const CreateTicketSchema = z.object({
  subject: z.string(),
  description: z.string(),
  category: z.enum(['general', 'technical', 'billing', 'appointment', 'product']),
  priority: z.enum(['low', 'medium', 'high', 'urgent']),
});

export type CreateTicketRequest = z.infer<typeof CreateTicketSchema>;

export const UpdateTicketSchema = z.object({
  status: z.enum(['open', 'in-progress', 'waiting-customer', 'resolved', 'closed']).optional(),
  assignedTo: z.string().optional(),
});

export type UpdateTicketRequest = z.infer<typeof UpdateTicketSchema>;

export const AddTicketMessageSchema = z.object({
  content: z.string(),
  attachments: z.array(z.string()).optional(),
});

export type AddTicketMessageRequest = z.infer<typeof AddTicketMessageSchema>;

// Loyalty account schema
export const LoyaltyAccountSchema = z.object({
  id: z.string(),
  customerId: z.string(),
  points: z.number(),
  tier: z.enum(['bronze', 'silver', 'gold', 'platinum']),
  totalSpent: z.number(),
  totalOrders: z.number(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export type LoyaltyAccount = z.infer<typeof LoyaltyAccountSchema>;

export const LoyaltyTransactionSchema = z.object({
  id: z.string(),
  accountId: z.string(),
  type: z.enum(['earned', 'redeemed', 'expired']),
  points: z.number(),
  description: z.string(),
  referenceId: z.string().optional(),
  referenceType: z.string().optional(),
  expiresAt: z.string().datetime().optional(),
  createdAt: z.string().datetime(),
});

export type LoyaltyTransaction = z.infer<typeof LoyaltyTransactionSchema>;

export const AdjustLoyaltySchema = z.object({
  points: z.number(),
  description: z.string(),
  referenceId: z.string().optional(),
  referenceType: z.string().optional(),
  expiresAt: z.string().datetime().optional(),
});

export type AdjustLoyaltyRequest = z.infer<typeof AdjustLoyaltySchema>;

// Wishlist schema
export const WishlistSchema = z.object({
  id: z.string(),
  customerId: z.string(),
  items: z.array(z.object({
    productId: z.string(),
    addedAt: z.string().datetime(),
  })),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export type Wishlist = z.infer<typeof WishlistSchema>;

export const AddToWishlistSchema = z.object({
  productId: z.string(),
});

export type AddToWishlistRequest = z.infer<typeof AddToWishlistSchema>;

// Saved design schema
export const SavedDesignSchema = z.object({
  id: z.string(),
  customerId: z.string(),
  name: z.string(),
  description: z.string().optional(),
  category: z.enum(['kitchen', 'bedroom']),
  configuration: z.record(z.any()),
  images: z.array(z.string()),
  shared: z.boolean(),
  shareToken: z.string().optional(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export type SavedDesign = z.infer<typeof SavedDesignSchema>;

export const CreateSavedDesignSchema = z.object({
  name: z.string(),
  description: z.string().optional(),
  category: z.enum(['kitchen', 'bedroom']),
  configuration: z.record(z.any()),
  images: z.array(z.string()),
  shared: z.boolean().default(false),
});

export type CreateSavedDesignRequest = z.infer<typeof CreateSavedDesignSchema>;

export const UpdateSavedDesignSchema = z.object({
  name: z.string().optional(),
  description: z.string().optional(),
  configuration: z.record(z.any()).optional(),
  images: z.array(z.string()).optional(),
  shared: z.boolean().optional(),
});

export type UpdateSavedDesignRequest = z.infer<typeof UpdateSavedDesignSchema>;
