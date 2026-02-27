import { Router } from 'express';
import { LoyaltyController } from './loyalty.controller';
import { LoyaltyService } from './loyalty.service';
import { LoyaltyRepository } from './loyalty.repository';
import { prisma } from '../../infrastructure/db/prisma.client';
import { authenticate } from '../../infrastructure/http/middleware/auth.middleware';
import { requireAdmin } from '../../infrastructure/http/middleware/role.middleware';
import { validateRequest } from '../../infrastructure/http/middleware/validate.middleware';
import {
  EarnPointsSchema,
  RedeemPointsSchema,
  AdjustPointsSchema,
  LoyaltyTransactionQuerySchema,
} from './loyalty.schemas';

const router = Router();

const loyaltyRepository = new LoyaltyRepository(prisma);
const loyaltyService = new LoyaltyService(loyaltyRepository);
const loyaltyController = new LoyaltyController(loyaltyService);

router.use(authenticate);

router.get(
  '/my/account',
  loyaltyController.getMyAccount,
);

router.get(
  '/my/transactions',
  validateRequest({ query: LoyaltyTransactionQuerySchema }),
  loyaltyController.getMyTransactions,
);

router.post(
  '/my/redeem',
  validateRequest({ body: RedeemPointsSchema }),
  loyaltyController.redeemPoints,
);

router.post(
  '/admin/earn',
  requireAdmin,
  validateRequest({ body: EarnPointsSchema }),
  loyaltyController.earnPoints,
);

router.post(
  '/admin/adjust',
  requireAdmin,
  validateRequest({ body: AdjustPointsSchema }),
  loyaltyController.adjustPoints,
);

router.get(
  '/admin/customers/:customerId/account',
  requireAdmin,
  loyaltyController.getAccountByCustomerId,
);

router.get(
  '/admin/customers/:customerId/transactions',
  requireAdmin,
  validateRequest({ query: LoyaltyTransactionQuerySchema }),
  loyaltyController.getTransactionsByCustomerId,
);

export { router as loyaltyRoutes };