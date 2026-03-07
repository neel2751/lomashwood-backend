import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Review } from './entities/review.entity';
import { CreateReviewDto } from './dto/create-review.dto';
import { ModerateReviewDto } from './dto/moderate-review.dto';

@Injectable()
export class ReviewsService {
  constructor(
    @InjectRepository(Review)
    private reviewsRepository: Repository<Review>,
  ) {}

  async findAll(params: {
    page: number;
    limit: number;
    productId?: string;
    customerId?: string;
    rating?: number;
    status?: string;
  }): Promise<{ reviews: Review[]; total: number; page: number; limit: number }> {
    const { page, limit, productId, customerId, rating, status } = params;
    const skip = (page - 1) * limit;

    const query = this.reviewsRepository.createQueryBuilder('review')
      .leftJoinAndSelect('review.customer', 'customer')
      .leftJoinAndSelect('review.product', 'product');

    if (productId) {
      query.andWhere('review.productId = :productId', { productId });
    }

    if (customerId) {
      query.andWhere('review.customerId = :customerId', { customerId });
    }

    if (rating) {
      query.andWhere('review.rating = :rating', { rating });
    }

    if (status) {
      query.andWhere('review.status = :status', { status });
    }

    const [reviews, total] = await query
      .orderBy('review.createdAt', 'DESC')
      .skip(skip)
      .take(limit)
      .getManyAndCount();

    return {
      reviews,
      total,
      page,
      limit,
    };
  }

  async findById(id: string): Promise<Review | null> {
    return this.reviewsRepository.findOne({
      where: { id },
      relations: ['customer', 'product'],
    });
  }

  async create(createReviewDto: CreateReviewDto, user?: any): Promise<Review> {
    const review = this.reviewsRepository.create({
      ...createReviewDto,
      customerId: user?.id || createReviewDto.customerId,
      status: 'PENDING',
    });

    return this.reviewsRepository.save(review);
  }

  async update(id: string, updateData: any, user?: any): Promise<Review | null> {
    const review = await this.findById(id);
    if (!review) {
      return null;
    }

    // Check if user can update this review
    if (user?.role !== 'ADMIN' && user?.role !== 'STAFF' && review.customerId !== user?.id) {
      return null;
    }

    await this.reviewsRepository.update(id, {
      ...updateData,
      updatedAt: new Date(),
    });

    return this.findById(id);
  }

  async remove(id: string, user?: any): Promise<Review | null> {
    const review = await this.findById(id);
    if (!review) {
      return null;
    }

    // Check if user can delete this review
    if (user?.role !== 'ADMIN' && user?.role !== 'STAFF' && review.customerId !== user?.id) {
      return null;
    }

    await this.reviewsRepository.delete(id);
    return review;
  }

  async moderate(id: string, moderateReviewDto: ModerateReviewDto): Promise<Review | null> {
    const review = await this.findById(id);
    if (!review) {
      return null;
    }

    await this.reviewsRepository.update(id, {
      status: moderateReviewDto.status,
      moderationNotes: moderateReviewDto.notes,
      moderatedAt: new Date(),
      moderatedBy: moderateReviewDto.moderatedBy,
      updatedAt: new Date(),
    });

    return this.findById(id);
  }

  async findByProduct(productId: string, params: {
    page: number;
    limit: number;
    rating?: number;
    verified?: boolean;
  }): Promise<{ reviews: Review[]; total: number; page: number; limit: number }> {
    const { page, limit, rating, verified } = params;
    const skip = (page - 1) * limit;

    const query = this.reviewsRepository.createQueryBuilder('review')
      .leftJoinAndSelect('review.customer', 'customer')
      .where('review.productId = :productId', { productId });

    if (rating) {
      query.andWhere('review.rating = :rating', { rating });
    }

    if (verified !== undefined) {
      query.andWhere('review.isVerified = :verified', { verified });
    }

    const [reviews, total] = await query
      .orderBy('review.createdAt', 'DESC')
      .skip(skip)
      .take(limit)
      .getManyAndCount();

    return {
      reviews,
      total,
      page,
      limit,
    };
  }

  async findByCustomer(customerId: string, params: {
    page: number;
    limit: number;
    status?: string;
  }): Promise<{ reviews: Review[]; total: number; page: number; limit: number }> {
    const { page, limit, status } = params;
    const skip = (page - 1) * limit;

    const query = this.reviewsRepository.createQueryBuilder('review')
      .leftJoinAndSelect('review.product', 'product')
      .where('review.customerId = :customerId', { customerId });

    if (status) {
      query.andWhere('review.status = :status', { status });
    }

    const [reviews, total] = await query
      .orderBy('review.createdAt', 'DESC')
      .skip(skip)
      .take(limit)
      .getManyAndCount();

    return {
      reviews,
      total,
      page,
      limit,
    };
  }

  async getPending(params: { page: number; limit: number }): Promise<{ reviews: Review[]; total: number; page: number; limit: number }> {
    const { page, limit } = params;
    const skip = (page - 1) * limit;

    const [reviews, total] = await this.reviewsRepository.createQueryBuilder('review')
      .leftJoinAndSelect('review.customer', 'customer')
      .leftJoinAndSelect('review.product', 'product')
      .where('review.status = :status', { status: 'PENDING' })
      .orderBy('review.createdAt', 'ASC')
      .skip(skip)
      .take(limit)
      .getManyAndCount();

    return {
      reviews,
      total,
      page,
      limit,
    };
  }

  async getStats(
    startDate?: Date,
    endDate?: Date,
    productId?: string
  ): Promise<{
    totalReviews: number;
    averageRating: number;
    ratingBreakdown: Record<number, number>;
    statusBreakdown: Record<string, number>;
    pendingReviews: number;
  }> {
    const query = this.reviewsRepository.createQueryBuilder('review');

    if (startDate) {
      query.andWhere('review.createdAt >= :startDate', { startDate });
    }

    if (endDate) {
      query.andWhere('review.createdAt <= :endDate', { endDate });
    }

    if (productId) {
      query.andWhere('review.productId = :productId', { productId });
    }

    const reviews = await query.getMany();

    const totalReviews = reviews.length;
    const averageRating = totalReviews > 0
      ? reviews.reduce((sum, review) => sum + review.rating, 0) / totalReviews
      : 0;

    const ratingBreakdown = reviews.reduce((acc, review) => {
      acc[review.rating] = (acc[review.rating] || 0) + 1;
      return acc;
    }, {} as Record<number, number>);

    const statusBreakdown = reviews.reduce((acc, review) => {
      acc[review.status] = (acc[review.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const pendingReviews = reviews.filter(review => review.status === 'PENDING').length;

    return {
      totalReviews,
      averageRating,
      ratingBreakdown,
      statusBreakdown,
      pendingReviews,
    };
  }

  async bulkModerate(reviewIds: string[], status: string, notes?: string): Promise<{ updated: number; failed: number }> {
    let updated = 0;
    let failed = 0;

    for (const reviewId of reviewIds) {
      const review = await this.findById(reviewId);
      if (review) {
        await this.reviewsRepository.update(reviewId, {
          status,
          moderationNotes: notes,
          moderatedAt: new Date(),
          updatedAt: new Date(),
        });
        updated++;
      } else {
        failed++;
      }
    }

    return { updated, failed };
  }

  async getTopRatedProducts(limit: number = 10): Promise<any[]> {
    return this.reviewsRepository.createQueryBuilder('review')
      .leftJoinAndSelect('review.product', 'product')
      .select([
        'review.productId',
        'AVG(review.rating) as averageRating',
        'COUNT(review.id) as totalReviews',
      ])
      .where('review.status = :status', { status: 'APPROVED' })
      .groupBy('review.productId')
      .orderBy('averageRating', 'DESC')
      .take(limit)
      .getRawMany();
  }

  async getCustomerReviewHistory(customerId: string): Promise<Review[]> {
    return this.reviewsRepository.find({
      where: { customerId },
      relations: ['product'],
      order: { createdAt: 'DESC' },
    });
  }
}
