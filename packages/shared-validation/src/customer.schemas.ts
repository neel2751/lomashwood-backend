import { z } from "zod";

export const BrochureRequestSchema = z.object({
  firstName: z.string().min(2).max(50).trim(),
  lastName: z.string().min(2).max(50).trim(),
  email: z.string().email().toLowerCase().trim(),
  phone: z.string().regex(/^\+?[1-9]\d{7,14}$/),
  postcode: z.string().min(3).max(10).trim().toUpperCase(),
  addressLine1: z.string().min(5).max(255).trim(),
  addressLine2: z.string().max(255).trim().optional(),
  city: z.string().min(2).max(100).trim(),
  interests: z
    .array(z.enum(["KITCHEN", "BEDROOM", "BOTH"]))
    .optional()
    .default(["BOTH"]),
  marketingConsent: z.boolean().optional().default(false),
});

export const BusinessInquirySchema = z.object({
  name: z.string().min(2).max(100).trim(),
  email: z.string().email().toLowerCase().trim(),
  phone: z.string().regex(/^\+?[1-9]\d{7,14}$/),
  businessType: z.enum([
    "ARCHITECT",
    "INTERIOR_DESIGNER",
    "PROPERTY_DEVELOPER",
    "CONTRACTOR",
    "ESTATE_AGENT",
    "OTHER",
  ]),
  companyName: z.string().max(255).trim().optional(),
  website: z.string().url().optional(),
  message: z.string().min(20).max(2000).trim(),
  marketingConsent: z.boolean().optional().default(false),
});

export const ContactFormSchema = z.object({
  firstName: z.string().min(2).max(50).trim(),
  lastName: z.string().min(2).max(50).trim(),
  email: z.string().email().toLowerCase().trim(),
  phone: z.string().regex(/^\+?[1-9]\d{7,14}$/).optional(),
  subject: z.string().min(5).max(200).trim(),
  message: z.string().min(20).max(2000).trim(),
  enquiryType: z
    .enum([
      "GENERAL",
      "PRODUCT",
      "BOOKING",
      "COMPLAINT",
      "FEEDBACK",
      "OTHER",
    ])
    .optional()
    .default("GENERAL"),
});

export const NewsletterSubscriptionSchema = z.object({
  email: z.string().email().toLowerCase().trim(),
  firstName: z.string().min(2).max(50).trim().optional(),
  preferences: z
    .array(z.enum(["KITCHEN", "BEDROOM", "OFFERS", "BLOG", "NEWS"]))
    .optional()
    .default(["KITCHEN", "BEDROOM", "OFFERS"]),
});

export const CustomerReviewSchema = z.object({
  name: z.string().min(2).max(100).trim(),
  description: z.string().min(20).max(2000).trim(),
  rating: z.number().int().min(1).max(5),
  images: z.array(z.string().url()).max(10).optional().default([]),
  videoUrl: z.string().url().optional(),
  productId: z.string().uuid().optional(),
  isVerified: z.boolean().optional().default(false),
  isPublished: z.boolean().optional().default(false),
});

export const CustomerReviewUpdateSchema = CustomerReviewSchema.partial();

export const CustomerReviewFilterSchema = z.object({
  rating: z.coerce.number().int().min(1).max(5).optional(),
  productId: z.string().uuid().optional(),
  isVerified: z.coerce.boolean().optional(),
  isPublished: z.coerce.boolean().optional(),
  search: z.string().max(255).optional(),
  page: z.coerce.number().int().positive().optional().default(1),
  limit: z.coerce.number().int().min(1).max(100).optional().default(20),
  sortBy: z
    .enum(["created_desc", "rating_asc", "rating_desc", "helpful_desc"])
    .optional()
    .default("created_desc"),
});

export const WishlistItemSchema = z.object({
  productId: z.string().uuid(),
  colourId: z.string().uuid().optional(),
  sizeId: z.string().uuid().optional(),
  notes: z.string().max(500).optional(),
});

export const CustomerProfileSchema = z.object({
  firstName: z.string().min(2).max(50).trim(),
  lastName: z.string().min(2).max(50).trim(),
  phone: z.string().regex(/^\+?[1-9]\d{7,14}$/).optional().nullable(),
  avatar: z.string().url().optional().nullable(),
  dateOfBirth: z.coerce.date().optional().nullable(),
  marketingConsent: z.boolean().optional(),
  smsConsent: z.boolean().optional(),
});

export const CustomerAddressSchema = z.object({
  label: z.string().max(50).optional().default("Home"),
  firstName: z.string().min(2).max(50).trim(),
  lastName: z.string().min(2).max(50).trim(),
  addressLine1: z.string().min(5).max(255).trim(),
  addressLine2: z.string().max(255).trim().optional(),
  city: z.string().min(2).max(100).trim(),
  county: z.string().max(100).trim().optional(),
  postcode: z.string().min(3).max(10).trim().toUpperCase(),
  country: z.string().length(2).toUpperCase().default("GB"),
  phone: z.string().regex(/^\+?[1-9]\d{7,14}$/).optional(),
  isDefault: z.boolean().optional().default(false),
});

export const SupportTicketSchema = z.object({
  subject: z.string().min(5).max(200).trim(),
  description: z.string().min(20).max(5000).trim(),
  category: z.enum([
    "ORDER",
    "BOOKING",
    "PRODUCT",
    "BILLING",
    "TECHNICAL",
    "OTHER",
  ]),
  priority: z.enum(["LOW", "MEDIUM", "HIGH", "URGENT"]).optional().default("MEDIUM"),
  orderId: z.string().uuid().optional(),
  bookingId: z.string().uuid().optional(),
  attachments: z.array(z.string().url()).max(5).optional().default([]),
});

export const SupportTicketUpdateSchema = z.object({
  status: z
    .enum(["OPEN", "IN_PROGRESS", "WAITING", "RESOLVED", "CLOSED"])
    .optional(),
  priority: z.enum(["LOW", "MEDIUM", "HIGH", "URGENT"]).optional(),
  assignedToId: z.string().uuid().optional().nullable(),
  resolution: z.string().max(2000).optional(),
});

export const BrochureFilterSchema = z.object({
  search: z.string().max(255).optional(),
  dateFrom: z.coerce.date().optional(),
  dateTo: z.coerce.date().optional(),
  page: z.coerce.number().int().positive().optional().default(1),
  limit: z.coerce.number().int().min(1).max(100).optional().default(20),
});

export const BusinessInquiryFilterSchema = z.object({
  businessType: z.string().optional(),
  search: z.string().max(255).optional(),
  dateFrom: z.coerce.date().optional(),
  dateTo: z.coerce.date().optional(),
  page: z.coerce.number().int().positive().optional().default(1),
  limit: z.coerce.number().int().min(1).max(100).optional().default(20),
});

export type BrochureRequestInput = z.infer<typeof BrochureRequestSchema>;
export type BusinessInquiryInput = z.infer<typeof BusinessInquirySchema>;
export type ContactFormInput = z.infer<typeof ContactFormSchema>;
export type NewsletterSubscriptionInput = z.infer<typeof NewsletterSubscriptionSchema>;
export type CustomerReviewInput = z.infer<typeof CustomerReviewSchema>;
export type CustomerReviewUpdateInput = z.infer<typeof CustomerReviewUpdateSchema>;
export type CustomerReviewFilterInput = z.infer<typeof CustomerReviewFilterSchema>;
export type WishlistItemInput = z.infer<typeof WishlistItemSchema>;
export type CustomerProfileInput = z.infer<typeof CustomerProfileSchema>;
export type CustomerAddressInput = z.infer<typeof CustomerAddressSchema>;
export type SupportTicketInput = z.infer<typeof SupportTicketSchema>;
export type SupportTicketUpdateInput = z.infer<typeof SupportTicketUpdateSchema>;
export type BrochureFilterInput = z.infer<typeof BrochureFilterSchema>;
export type BusinessInquiryFilterInput = z.infer<typeof BusinessInquiryFilterSchema>;