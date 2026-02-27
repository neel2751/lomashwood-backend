import { z } from 'zod';

export const createProfileSchema = z.object({
  userId: z.string().min(1),
  firstName: z.string().min(1).max(100),
  lastName: z.string().min(1).max(100),
  email: z.string().email(),
  phone: z.string().regex(/^\+?[0-9\s\-()]{7,20}$/).optional(),
});

export const updateProfileSchema = z.object({
  firstName: z.string().min(1).max(100).optional(),
  lastName: z.string().min(1).max(100).optional(),
  phone: z.string().regex(/^\+?[0-9\s\-()]{7,20}$/).optional(),
  avatarUrl: z.string().url().optional(),
  dateOfBirth: z.string().date().optional(),
  preferredLocale: z.string().min(2).max(10).optional(),
});

export const createAddressSchema = z.object({
  label: z.string().min(1).max(50).optional().default('Home'),
  line1: z.string().min(1).max(200),
  line2: z.string().max(200).optional(),
  city: z.string().min(1).max(100),
  county: z.string().max(100).optional(),
  postcode: z.string().min(3).max(10),
  country: z.string().length(2).optional().default('GB'),
  isDefault: z.boolean().optional().default(false),
});

export const updateAddressSchema = createAddressSchema.partial();

export type CreateProfileSchema = z.infer<typeof createProfileSchema>;
export type UpdateProfileSchema = z.infer<typeof updateProfileSchema>;
export type CreateAddressSchema = z.infer<typeof createAddressSchema>;
export type UpdateAddressSchema = z.infer<typeof updateAddressSchema>;