import { ReviewStatus } from '@prisma/client';

export interface ReviewDto {
  id: string;
  profileId: string;
  productId: string;
  orderId: string | null;
  rating: number;
  title: string;
  body: string;
  images: string[];
  status: ReviewStatus;
  isVerified: boolean;
  helpfulCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateReviewInput {
  productId: string;
  orderId?: string;
  rating: number;
  title: string;
  body: string;
  images?: string[];
}

export interface UpdateReviewInput {
  rating?: number;
  title?: string;
  body?: string;
  images?: string[];
}

export interface ModerateReviewInput {
  status: ReviewStatus;
}