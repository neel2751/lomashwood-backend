import { z } from 'zod';
import { ReviewStatus } from '@prisma/client';
import { MIN_REVIEW_RATING, MAX_REVIEW_RATING, REVIEW_TITLE_MAX_LENGTH, REVIEW_BODY_MAX_LENGTH } from '../../shared/constants';

export const createReviewSchema = z.object({
  productId: z.string().min(1),
  orderId: z.string().optional(),
  rating: z.number().int().min(MIN_REVIEW_RATING).max(MAX_REVIEW_RATING),
  title: z.string().min(1).max(REVIEW_TITLE_MAX_LENGTH),
  body: z.string().min(10).max(REVIEW_BODY_MAX_LENGTH),
  images: z.array(z.string().url()).max(10).optional().default([]),
});

export const updateReviewSchema = createReviewSchema.partial().omit({ productId: true, orderId: true });

export const moderateReviewSchema = z.object({
  status: z.nativeEnum(ReviewStatus),
});

export type CreateReviewSchema = z.infer<typeof createReviewSchema>;
export type UpdateReviewSchema = z.infer<typeof updateReviewSchema>;
export type ModerateReviewSchema = z.infer<typeof moderateReviewSchema>;