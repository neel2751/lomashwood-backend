import { Review, ReviewStatus, Prisma } from '@prisma/client';
import { prismaClient } from '../../infrastructure/db/prisma.client';
import { CreateReviewInput, UpdateReviewInput } from './review.types';
import { PaginationOptions } from '../../shared/types';
import { getPrismaSkipTake } from '../../shared/pagination';

export class ReviewRepository {
  async create(profileId: string, input: CreateReviewInput): Promise<Review> {
    return prismaClient.review.create({
      data: { profileId, ...input, images: input.images ?? [] },
    });
  }

  async findById(id: string): Promise<Review | null> {
    return prismaClient.review.findFirst({ where: { id, deletedAt: null } });
  }

  async findByProductId(productId: string, status: ReviewStatus, options: PaginationOptions): Promise<{ reviews: Review[]; total: number }> {
    const where: Prisma.ReviewWhereInput = { productId, status, deletedAt: null };
    const [reviews, total] = await prismaClient.$transaction([
      prismaClient.review.findMany({ where, ...getPrismaSkipTake(options), orderBy: { createdAt: 'desc' } }),
      prismaClient.review.count({ where }),
    ]);
    return { reviews, total };
  }

  async findByProfileId(profileId: string, options: PaginationOptions): Promise<{ reviews: Review[]; total: number }> {
    const where: Prisma.ReviewWhereInput = { profileId, deletedAt: null };
    const [reviews, total] = await prismaClient.$transaction([
      prismaClient.review.findMany({ where, ...getPrismaSkipTake(options), orderBy: { createdAt: 'desc' } }),
      prismaClient.review.count({ where }),
    ]);
    return { reviews, total };
  }

  async findByProfileAndProduct(profileId: string, productId: string): Promise<Review | null> {
    return prismaClient.review.findFirst({ where: { profileId, productId, deletedAt: null } });
  }

  async update(id: string, input: UpdateReviewInput): Promise<Review> {
    return prismaClient.review.update({ where: { id }, data: input });
  }

  async moderate(id: string, status: ReviewStatus): Promise<Review> {
    return prismaClient.review.update({ where: { id }, data: { status } });
  }

  async incrementHelpful(id: string): Promise<Review> {
    return prismaClient.review.update({ where: { id }, data: { helpfulCount: { increment: 1 } } });
  }

  async softDelete(id: string): Promise<void> {
    await prismaClient.review.update({ where: { id }, data: { deletedAt: new Date() } });
  }

  async getAverageRating(productId: string): Promise<number> {
    const result = await prismaClient.review.aggregate({
      where: { productId, status: ReviewStatus.APPROVED, deletedAt: null },
      _avg: { rating: true },
    });
    return result._avg.rating ?? 0;
  }
}