import { z } from 'zod';

export const addToWishlistSchema = z.object({
  productId: z.string().min(1),
  productName: z.string().min(1).max(200),
  productSlug: z.string().min(1).max(200),
  notes: z.string().max(500).optional(),
});

export type AddToWishlistSchema = z.infer<typeof addToWishlistSchema>;