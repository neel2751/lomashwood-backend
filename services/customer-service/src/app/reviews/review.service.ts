import { ReviewStatus } from '@prisma/client';
import { ReviewRepository } from './review.repository';
import { ProfileRepository } from '../profiles/profile.repository';
import { toReviewDto } from './review.mapper';
import { ReviewDto, CreateReviewInput, UpdateReviewInput, ModerateReviewInput } from './review.types';
import { NotFoundError, ConflictError, ForbiddenError } from '../../shared/errors';
import { publishEvent } from '../../infrastructure/messaging/event-producer';
import { CUSTOMER_TOPICS } from '../../infrastructure/messaging/event-topics';
import { createEventMetadata } from '../../infrastructure/messaging/event-metadata';
import { PaginationOptions, PaginatedResult } from '../../shared/types';
import { buildPaginationMeta } from '../../shared/utils';

export class ReviewService {
  constructor(
    private readonly reviewRepo: ReviewRepository,
    private readonly profileRepo: ProfileRepository,
  ) {}

  async createReview(userId: string, input: CreateReviewInput): Promise<ReviewDto> {
    const profile = await this.profileRepo.findByUserId(userId);
    if (!profile) throw new NotFoundError('Profile');

    const existing = await this.reviewRepo.findByProfileAndProduct(profile.id, input.productId);
    if (existing) throw new ConflictError('You have already reviewed this product');

    const review = await this.reviewRepo.create(profile.id, input);
    const dto = toReviewDto(review);

    await publishEvent(CUSTOMER_TOPICS.REVIEW_CREATED, review.id, {
      ...createEventMetadata(CUSTOMER_TOPICS.REVIEW_CREATED),
      reviewId: review.id,
      profileId: profile.id,
      productId: input.productId,
      rating: input.rating,
    });

    return dto;
  }

  async getReviewsByProduct(productId: string, options: PaginationOptions): Promise<PaginatedResult<ReviewDto>> {
    const { reviews, total } = await this.reviewRepo.findByProductId(productId, ReviewStatus.APPROVED, options);
    return buildPaginationMeta(reviews.map(toReviewDto), total, options);
  }

  async getMyReviews(userId: string, options: PaginationOptions): Promise<PaginatedResult<ReviewDto>> {
    const profile = await this.profileRepo.findByUserId(userId);
    if (!profile) throw new NotFoundError('Profile');

    const { reviews, total } = await this.reviewRepo.findByProfileId(profile.id, options);
    return buildPaginationMeta(reviews.map(toReviewDto), total, options);
  }

  async updateReview(userId: string, reviewId: string, input: UpdateReviewInput): Promise<ReviewDto> {
    const profile = await this.profileRepo.findByUserId(userId);
    if (!profile) throw new NotFoundError('Profile');

    const review = await this.reviewRepo.findById(reviewId);
    if (!review) throw new NotFoundError('Review');
    if (review.profileId !== profile.id) throw new ForbiddenError();

    const updated = await this.reviewRepo.update(reviewId, input);
    return toReviewDto(updated);
  }

  async deleteReview(userId: string, reviewId: string): Promise<void> {
    const profile = await this.profileRepo.findByUserId(userId);
    if (!profile) throw new NotFoundError('Profile');

    const review = await this.reviewRepo.findById(reviewId);
    if (!review) throw new NotFoundError('Review');
    if (review.profileId !== profile.id) throw new ForbiddenError();

    await this.reviewRepo.softDelete(reviewId);
  }

  async moderateReview(reviewId: string, input: ModerateReviewInput): Promise<ReviewDto> {
    const review = await this.reviewRepo.findById(reviewId);
    if (!review) throw new NotFoundError('Review');

    const updated = await this.reviewRepo.moderate(reviewId, input.status);

    if (input.status === ReviewStatus.APPROVED) {
      await publishEvent(CUSTOMER_TOPICS.REVIEW_APPROVED, reviewId, {
        ...createEventMetadata(CUSTOMER_TOPICS.REVIEW_APPROVED),
        reviewId,
        productId: review.productId,
        rating: review.rating,
      });
    }

    return toReviewDto(updated);
  }

  async markHelpful(reviewId: string): Promise<ReviewDto> {
    const review = await this.reviewRepo.findById(reviewId);
    if (!review) throw new NotFoundError('Review');

    const updated = await this.reviewRepo.incrementHelpful(reviewId);
    return toReviewDto(updated);
  }

  async getProductRating(productId: string): Promise<{ average: number; productId: string }> {
    const average = await this.reviewRepo.getAverageRating(productId);
    return { average: Math.round(average * 10) / 10, productId };
  }
}