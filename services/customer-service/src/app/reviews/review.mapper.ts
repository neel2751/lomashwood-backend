import { Review } from '@prisma/client';
import { ReviewDto } from './review.types';

export function toReviewDto(review: Review): ReviewDto {
  return {
    id: review.id,
    profileId: review.profileId,
    productId: review.productId,
    orderId: review.orderId,
    rating: review.rating,
    title: review.title,
    body: review.body,
    images: review.images,
    status: review.status,
    isVerified: review.isVerified,
    helpfulCount: review.helpfulCount,
    createdAt: review.createdAt.toISOString(),
    updatedAt: review.updatedAt.toISOString(),
  };
}