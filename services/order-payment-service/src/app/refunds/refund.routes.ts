import { Router } from 'express';
import { RefundController } from './refund.controller';
import { authenticate, authorize } from '../../interfaces/http/middleware.factory';
import { validateRequest } from '../../interfaces/http/middleware.factory';
import { rateLimiter } from '../../config/rate-limit';
import {
  CreateRefundSchema,
  CancelRefundSchema,
  RetryRefundSchema,
  GetRefundSchema,
  ListRefundsSchema,
  GetRefundsByOrderSchema,
  GetRefundSummarySchema,
  BulkRefundSchema,
  CheckEligibilitySchema,
} from './refund.schemas';
import { UserRole } from '../../shared/types';



export function buildRefundRouter(controller: RefundController): Router {
  const router = Router();


  router.get(
    '/',
    authenticate,
    authorize(UserRole.ADMIN, UserRole.STAFF),
    rateLimiter('refundRead'),
    validateRequest({ query: ListRefundsSchema }),
    controller.listRefunds,
  );

 
  router.get(
    '/status-breakdown',
    authenticate,
    authorize(UserRole.ADMIN, UserRole.STAFF),
    rateLimiter('refundRead'),
    controller.getStatusBreakdown,
  );


  router.get(
    '/:refundId',
    authenticate,
    rateLimiter('refundRead'),
    validateRequest({ params: GetRefundSchema }),
    controller.getRefundById,
  );

  router.post(
    '/',
    authenticate,
    authorize(UserRole.ADMIN, UserRole.STAFF),
    rateLimiter('refundCreate'),
    validateRequest({ body: CreateRefundSchema }),
    controller.createRefund,
  );

  router.post(
    '/bulk',
    authenticate,
    authorize(UserRole.ADMIN),
    rateLimiter('refundCreate'),
    validateRequest({ body: BulkRefundSchema }),
    controller.processBulkRefunds,
  );

 
  router.post(
    '/:refundId/cancel',
    authenticate,
    authorize(UserRole.ADMIN, UserRole.STAFF),
    rateLimiter('refundCreate'),
    validateRequest({ params: CancelRefundSchema }),
    controller.cancelRefund,
  );


  router.post(
    '/:refundId/retry',
    authenticate,
    authorize(UserRole.ADMIN),
    rateLimiter('refundCreate'),
    validateRequest({ params: RetryRefundSchema }),
    controller.retryFailedRefund,
  );

  router.get(
    '/by-order/:orderId',
    authenticate,
    rateLimiter('refundRead'),
    validateRequest({ params: GetRefundsByOrderSchema }),
    controller.getRefundsByOrder,
  );

  router.get(
    '/by-order/:orderId/summary',
    authenticate,
    rateLimiter('refundRead'),
    validateRequest({ params: GetRefundSummarySchema }),
    controller.getRefundSummaryForOrder,
  );


  router.get(
    '/by-order/:orderId/eligibility',
    authenticate,
    rateLimiter('refundRead'),
    validateRequest({ params: CheckEligibilitySchema }),
    controller.checkRefundEligibility,
  );

  return router;
}