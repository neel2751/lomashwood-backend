import { Router } from 'express';
import { ReviewController } from './review.controller';
import { ReviewService } from './review.service';
import { ReviewRepository } from './review.repository';
import { ProfileRepository } from '../profiles/profile.repository';

const reviewRepo = new ReviewRepository();
const profileRepo = new ProfileRepository();
const reviewService = new ReviewService(reviewRepo, profileRepo);
const reviewController = new ReviewController(reviewService);

export const reviewRouter = Router();
export default reviewRouter;

reviewRouter.get('/me', reviewController.getMyReviews);
reviewRouter.post('/', reviewController.createReview);
reviewRouter.get('/product/:productId', reviewController.getReviewsByProduct);
reviewRouter.get('/product/:productId/rating', reviewController.getProductRating);
reviewRouter.put('/:id', reviewController.updateReview);
reviewRouter.delete('/:id', reviewController.deleteReview);
reviewRouter.post('/:id/helpful', reviewController.markHelpful);
reviewRouter.patch('/:id/moderate', reviewController.moderateReview);