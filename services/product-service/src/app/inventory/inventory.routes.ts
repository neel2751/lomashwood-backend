import { Router } from 'express';
import { InventoryController } from './inventory.controller';
import { authMiddleware } from '../../middleware/auth.middleware';
import { validateRequest } from '../../middleware/validation.middleware';
import { 
  createInventorySchema,
  updateInventorySchema,
  inventoryQuerySchema,
  reserveInventorySchema,
  adjustInventorySchema,
  inventoryIdSchema
} from './inventory.schemas';

export class InventoryRoutes {
  public router: Router;

  constructor(private readonly controller: InventoryController) {
    this.router = Router();
    this.initializeRoutes();
  }

  private initializeRoutes(): void {
    this.router.post(
      '/',
      authMiddleware.authenticate,
      authMiddleware.authorize(['ADMIN', 'INVENTORY_MANAGER']),
      validateRequest(createInventorySchema),
      this.controller.createInventory.bind(this.controller)
    );

    this.router.get(
      '/',
      authMiddleware.authenticate,
      validateRequest(inventoryQuerySchema, 'query'),
      this.controller.getAllInventory.bind(this.controller)
    );

    this.router.get(
      '/stats',
      authMiddleware.authenticate,
      authMiddleware.authorize(['ADMIN', 'INVENTORY_MANAGER']),
      this.controller.getInventoryStats.bind(this.controller)
    );

    this.router.get(
      '/low-stock',
      authMiddleware.authenticate,
      authMiddleware.authorize(['ADMIN', 'INVENTORY_MANAGER']),
      this.controller.getLowStockItems.bind(this.controller)
    );

    this.router.get(
      '/out-of-stock',
      authMiddleware.authenticate,
      authMiddleware.authorize(['ADMIN', 'INVENTORY_MANAGER']),
      this.controller.getOutOfStockItems.bind(this.controller)
    );

    this.router.get(
      '/reserved',
      authMiddleware.authenticate,
      authMiddleware.authorize(['ADMIN', 'INVENTORY_MANAGER']),
      this.controller.getReservedItems.bind(this.controller)
    );

    this.router.get(
      '/product/:productId',
      authMiddleware.authenticate,
      this.controller.getInventoryByProduct.bind(this.controller)
    );

    this.router.get(
      '/sku/:sku',
      authMiddleware.authenticate,
      this.controller.getInventoryBySku.bind(this.controller)
    );

    this.router.get(
      '/warehouse/:location',
      authMiddleware.authenticate,
      authMiddleware.authorize(['ADMIN', 'INVENTORY_MANAGER']),
      this.controller.getInventoryByWarehouse.bind(this.controller)
    );

    this.router.get(
      '/:id',
      authMiddleware.authenticate,
      validateRequest(inventoryIdSchema, 'params'),
      this.controller.getInventoryById.bind(this.controller)
    );

    this.router.patch(
      '/:id',
      authMiddleware.authenticate,
      authMiddleware.authorize(['ADMIN', 'INVENTORY_MANAGER']),
      validateRequest(inventoryIdSchema, 'params'),
      validateRequest(updateInventorySchema),
      this.controller.updateInventory.bind(this.controller)
    );

    this.router.post(
      '/reserve',
      authMiddleware.authenticate,
      validateRequest(reserveInventorySchema),
      this.controller.reserveInventory.bind(this.controller)
    );

    this.router.post(
      '/release',
      authMiddleware.authenticate,
      validateRequest(reserveInventorySchema),
      this.controller.releaseInventory.bind(this.controller)
    );

    this.router.post(
      '/increment',
      authMiddleware.authenticate,
      authMiddleware.authorize(['ADMIN', 'INVENTORY_MANAGER']),
      validateRequest(adjustInventorySchema),
      this.controller.incrementInventory.bind(this.controller)
    );

    this.router.post(
      '/decrement',
      authMiddleware.authenticate,
      authMiddleware.authorize(['ADMIN', 'INVENTORY_MANAGER']),
      validateRequest(adjustInventorySchema),
      this.controller.decrementInventory.bind(this.controller)
    );

    this.router.delete(
      '/:id',
      authMiddleware.authenticate,
      authMiddleware.authorize(['ADMIN']),
      validateRequest(inventoryIdSchema, 'params'),
      this.controller.deleteInventory.bind(this.controller)
    );
  }

  public getRouter(): Router {
    return this.router;
  }
}

export const createInventoryRouter = (
  controller: InventoryController
): Router => {
  const inventoryRoutes = new InventoryRoutes(controller);
  return inventoryRoutes.getRouter();
};