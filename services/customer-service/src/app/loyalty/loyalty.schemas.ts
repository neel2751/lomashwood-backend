import { z } from 'zod';
import { LoyaltyTransactionType } from '@prisma/client';

export const EarnPointsSchema = z.object({
  customerId: z.string().min(1),
  points: z.number().int().positive(),
  description: z.string().min(1).max(255),
  reference: z.string().optional(),
  expiresAt: z.coerce.date().optional(),
});

export const RedeemPointsSchema = z.object({
  points: z.number().int().positive(),
  description: z.string().min(1).max(255),
  reference: z.string().optional(),
});

export const AdjustPointsSchema = z.object({
  customerId: z.string().min(1),
  points: z.number().int(),
  description: z.string().min(1).max(255),
  reference: z.string().optional(),
});

export const LoyaltyTransactionQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  type: z.nativeEnum(LoyaltyTransactionType).optional(),
  from: z.string().datetime().optional(),
  to: z.string().datetime().optional(),
});

export type EarnPointsInput = z.infer<typeof EarnPointsSchema>;
export type RedeemPointsInput = z.infer<typeof RedeemPointsSchema>;
export type AdjustPointsInput = z.infer<typeof AdjustPointsSchema>;
export type LoyaltyTransactionQuery = z.infer<typeof LoyaltyTransactionQuerySchema>;