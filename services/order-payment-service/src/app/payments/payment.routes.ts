import { Router } from 'express';
import { PaymentController } from './payment.controller';
import { PaymentService } from './payment.service';
import { PaymentRepository } from './payment.repository';
import { authMiddleware } from '../../middleware/auth.middleware';
import { validateRequest } from '../../middleware/validation.middleware';
import { rateLimitMiddleware } from '../../middleware/rate-limit.middleware';
import { roleGuard } from '../../middleware/role-guard.middleware';
import {
  createPaymentIntentSchema,
  processPaymentSchema,
  verifyPaymentSchema,
  refundPaymentSchema,
  capturePaymentSchema,
  cancelPaymentSchema,
  savePaymentMethodSchema,
  retryPaymentSchema,
  reconcilePaymentsSchema,
  exportPaymentsSchema,
  paymentQuerySchema,
} from './payment.schemas';
import { prisma } from '../../infrastructure/db/prisma.client';
import { stripeClient } from '../../infrastructure/payments/stripe.client';
import { razorpayClient } from '../../infrastructure/payments/razorpay.client';
import { eventProducer } from '../../infrastructure/messaging/event-producer';
import { redisClient } from '../../infrastructure/cache/redis.client';
import { logger } from '../../config/logger';

const router = Router();

const paymentRepository = new PaymentRepository(prisma);
const paymentService = new PaymentService(
  paymentRepository,
  stripeClient,
  razorpayClient,
  eventProducer,
  redisClient,
  logger
);
const paymentController = new PaymentController(paymentService);

router.post(
  '/intent',
  authMiddleware,
  rateLimitMiddleware('payment:create', 10, 60),
  validateRequest(createPaymentIntentSchema),
  paymentController.createPaymentIntent.bind(paymentController)
);

router.post(
  '/process',
  authMiddleware,
  rateLimitMiddleware('payment:process', 20, 60),
  validateRequest(processPaymentSchema),
  paymentController.processPayment.bind(paymentController)
);

router.post(
  '/verify',
  authMiddleware,
  rateLimitMiddleware('payment:verify', 30, 60),
  validateRequest(verifyPaymentSchema),
  paymentController.verifyPayment.bind(paymentController)
);

router.get(
  '/',
  authMiddleware,
  roleGuard(['ADMIN', 'MANAGER']),
  validateRequest(paymentQuerySchema, 'query'),
  paymentController.getPayments.bind(paymentController)
);

router.get(
  '/statistics',
  authMiddleware,
  roleGuard(['ADMIN', 'MANAGER']),
  paymentController.getPaymentStatistics.bind(paymentController)
);

router.get(
  '/analytics',
  authMiddleware,
  roleGuard(['ADMIN', 'MANAGER']),
  paymentController.getPaymentAnalytics.bind(paymentController)
);

router.get(
  '/export',
  authMiddleware,
  roleGuard(['ADMIN', 'MANAGER']),
  validateRequest(exportPaymentsSchema, 'query'),
  paymentController.exportPayments.bind(paymentController)
);

router.post(
  '/reconcile',
  authMiddleware,
  roleGuard(['ADMIN']),
  validateRequest(reconcilePaymentsSchema),
  paymentController.reconcilePayments.bind(paymentController)
);

router.get(
  '/methods',
  authMiddleware,
  paymentController.getPaymentMethods.bind(paymentController)
);

router.post(
  '/methods',
  authMiddleware,
  validateRequest(savePaymentMethodSchema),
  paymentController.savePaymentMethod.bind(paymentController)
);

router.delete(
  '/methods/:paymentMethodId',
  authMiddleware,
  paymentController.deletePaymentMethod.bind(paymentController)
);

router.get(
  '/order/:orderId',
  authMiddleware,
  paymentController.getPaymentByOrderId.bind(paymentController)
);

router.get(
  '/transaction/:transactionId',
  authMiddleware,
  paymentController.getPaymentByTransactionId.bind(paymentController)
);

router.get(
  '/:id',
  authMiddleware,
  paymentController.getPaymentById.bind(paymentController)
);

router.get(
  '/:id/status',
  authMiddleware,
  paymentController.checkPaymentStatus.bind(paymentController)
);

router.get(
  '/:id/history',
  authMiddleware,
  roleGuard(['ADMIN', 'MANAGER']),
  paymentController.getPaymentHistory.bind(paymentController)
);

router.post(
  '/:id/refund',
  authMiddleware,
  roleGuard(['ADMIN', 'MANAGER']),
  rateLimitMiddleware('payment:refund', 5, 60),
  validateRequest(refundPaymentSchema),
  paymentController.refundPayment.bind(paymentController)
);

router.post(
  '/:id/capture',
  authMiddleware,
  roleGuard(['ADMIN', 'MANAGER']),
  validateRequest(capturePaymentSchema),
  paymentController.capturePayment.bind(paymentController)
);

router.post(
  '/:id/cancel',
  authMiddleware,
  roleGuard(['ADMIN', 'MANAGER']),
  validateRequest(cancelPaymentSchema),
  paymentController.cancelPayment.bind(paymentController)
);

router.post(
  '/:id/retry',
  authMiddleware,
  rateLimitMiddleware('payment:retry', 3, 60),
  validateRequest(retryPaymentSchema),
  paymentController.retryFailedPayment.bind(paymentController)
);

router.post(
  '/validate-amount',
  authMiddleware,
  paymentController.validatePaymentAmount.bind(paymentController)
);

router.get(
  '/refunds/:refundId',
  authMiddleware,
  roleGuard(['ADMIN', 'MANAGER']),
  paymentController.getRefundDetails.bind(paymentController)
);

router.get(
  '/:paymentId/refunds',
  authMiddleware,
  roleGuard(['ADMIN', 'MANAGER']),
  paymentController.getRefundsByPayment.bind(paymentController)
);

router.post(
  '/webhooks/stripe',
  paymentController.handleStripeWebhook.bind(paymentController)
);

router.post(
  '/webhooks/razorpay',
  paymentController.handleRazorpayWebhook.bind(paymentController)
);

export default router;