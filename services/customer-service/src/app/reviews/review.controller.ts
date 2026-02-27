import { Request, Response, NextFunction } from 'express';
import { ReviewService } from './review.service';
import { createReviewSchema, updateReviewSchema, moderateReviewSchema } from './review.schemas';
import { parsePaginationOptions } from '../../shared/utils';

export class ReviewController {
  constructor(private readonly reviewService: ReviewService) {}

  createReview = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.headers['x-user-id'] as string;
      const input = createReviewSchema.parse(req.body);
      const review = await this.reviewService.createReview(userId, input);
      res.status(201).json({ success: true, data: review });
    } catch (err) {
      next(err);
    }
  };

  getReviewsByProduct = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const options = parsePaginationOptions(req.query as Record<string, unknown>);
      const result = await this.reviewService.getReviewsByProduct(req.params.productId!, options);
      res.status(200).json({ success: true, ...result });
    } catch (err) {
      next(err);
    }
  };

  getMyReviews = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.headers['x-user-id'] as string;
      const options = parsePaginationOptions(req.query as Record<string, unknown>);
      const result = await this.reviewService.getMyReviews(userId, options);
      res.status(200).json({ success: true, ...result });
    } catch (err) {
      next(err);
    }
  };

  updateReview = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.headers['x-user-id'] as string;
      const input = updateReviewSchema.parse(req.body);
      const review = await this.reviewService.updateReview(userId, req.params.id!, input);
      res.status(200).json({ success: true, data: review });
    } catch (err) {
      next(err);
    }
  };

  deleteReview = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.headers['x-user-id'] as string;
      await this.reviewService.deleteReview(userId, req.params.id!);
      res.status(204).send();
    } catch (err) {
      next(err);
    }
  };

  moderateReview = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const input = moderateReviewSchema.parse(req.body);
      const review = await this.reviewService.moderateReview(req.params.id!, input);
      res.status(200).json({ success: true, data: review });
    } catch (err) {
      next(err);
    }
  };

  markHelpful = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const review = await this.reviewService.markHelpful(req.params.id!);
      res.status(200).json({ success: true, data: review });
    } catch (err) {
      next(err);
    }
  };

  getProductRating = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const rating = await this.reviewService.getProductRating(req.params.productId!);
      res.status(200).json({ success: true, data: rating });
    } catch (err) {
      next(err);
    }
  };
}