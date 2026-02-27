import { Router } from 'express';
import { PricingController } from './pricing.controller';
import { authMiddleware } from '../../middleware/auth.middleware';
import { validateRequest } from '../../middleware/validation.middleware';
import { 
  createPricingSchema,
  updatePricingSchema,
  pricingQuerySchema,
  bulkUpdatePricingSchema,
  calculatePriceSchema,
  applyDiscountSchema,
  pricingIdSchema,
  duplicatePricingSchema,
  exportPricingSchema
} from './pricing.schemas';

export class PricingRoutes {
  public router: Router;

  constructor(private readonly controller: PricingController) {
    this.router = Router();
    this.initializeRoutes();
  }

  private initializeRoutes(): void {
    this.router.post(
      '/',
      authMiddleware.authenticate,
      authMiddleware.authorize(['ADMIN', 'PRICING_MANAGER']),
      validateRequest(createPricingSchema),
      this.controller.createPricing.bind(this.controller)
    );

    this.router.get(
      '/',
      authMiddleware.authenticate,
      validateRequest(pricingQuerySchema, 'query'),
      this.controller.getAllPricing.bind(this.controller)
    );

    this.router.get(
      '/stats',
      authMiddleware.authenticate,
      authMiddleware.authorize(['ADMIN', 'PRICING_MANAGER']),
      this.controller.getPricingStats.bind(this.controller)
    );

    this.router.get(
      '/active-sales',
      authMiddleware.authenticate,
      this.controller.getActiveSales.bind(this.controller)
    );

    this.router.get(
      '/export',
      authMiddleware.authenticate,
      authMiddleware.authorize(['ADMIN', 'PRICING_MANAGER']),
      validateRequest(exportPricingSchema, 'query'),
      this.controller.exportPricing.bind(this.controller)
    );

    this.router.get(
      '/product/:productId',
      authMiddleware.authenticate,
      this.controller.getPricingByProduct.bind(this.controller)
    );

    this.router.get(
      '/product/:productId/comparison',
      authMiddleware.authenticate,
      this.controller.getPriceComparison.bind(this.controller)
    );

    this.router.get(
      '/variant/:variantId',
      authMiddleware.authenticate,
      this.controller.getPricingByVariant.bind(this.controller)
    );

    this.router.get(
      '/:id',
      authMiddleware.authenticate,
      validateRequest(pricingIdSchema, 'params'),
      this.controller.getPricingById.bind(this.controller)
    );

    this.router.get(
      '/:id/history',
      authMiddleware.authenticate,
      authMiddleware.authorize(['ADMIN', 'PRICING_MANAGER']),
      validateRequest(pricingIdSchema, 'params'),
      this.controller.getPricingHistory.bind(this.controller)
    );

    this.router.patch(
      '/:id',
      authMiddleware.authenticate,
      authMiddleware.authorize(['ADMIN', 'PRICING_MANAGER']),
      validateRequest(pricingIdSchema, 'params'),
      validateRequest(updatePricingSchema),
      this.controller.updatePricing.bind(this.controller)
    );

    this.router.post(
      '/calculate',
      authMiddleware.authenticate,
      validateRequest(calculatePriceSchema),
      this.controller.calculatePrice.bind(this.controller)
    );

    this.router.post(
      '/bulk-update',
      authMiddleware.authenticate,
      authMiddleware.authorize(['ADMIN', 'PRICING_MANAGER']),
      validateRequest(bulkUpdatePricingSchema),
      this.controller.bulkUpdatePricing.bind(this.controller)
    );

    this.router.post(
      '/:id/apply-discount',
      authMiddleware.authenticate,
      authMiddleware.authorize(['ADMIN', 'PRICING_MANAGER']),
      validateRequest(pricingIdSchema, 'params'),
      validateRequest(applyDiscountSchema),
      this.controller.applyDiscount.bind(this.controller)
    );

    this.router.post(
      '/:id/remove-discount',
      authMiddleware.authenticate,
      authMiddleware.authorize(['ADMIN', 'PRICING_MANAGER']),
      validateRequest(pricingIdSchema, 'params'),
      this.controller.removeDiscount.bind(this.controller)
    );

    this.router.post(
      '/:id/duplicate',
      authMiddleware.authenticate,
      authMiddleware.authorize(['ADMIN', 'PRICING_MANAGER']),
      validateRequest(pricingIdSchema, 'params'),
      validateRequest(duplicatePricingSchema),
      this.controller.duplicatePricing.bind(this.controller)
    );

    this.router.delete(
      '/:id',
      authMiddleware.authenticate,
      authMiddleware.authorize(['ADMIN']),
      validateRequest(pricingIdSchema, 'params'),
      this.controller.deletePricing.bind(this.controller)
    );
  }

  public getRouter(): Router {
    return this.router;
  }
}

export const createPricingRouter = (
  controller: PricingController
): Router => {
  const pricingRoutes = new PricingRoutes(controller);
  return pricingRoutes.getRouter();
};