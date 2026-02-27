import { Router } from 'express';
import { SizeController } from './size.controller';
import { authMiddleware } from '../../middlewares/auth.middleware';
import { roleGuard } from '../../middlewares/role.middleware';
import { validateRequest } from '../../middlewares/validation.middleware';
import { SizeSchemas } from './size.schemas';

export class SizeRoutes {
  public router: Router;

  constructor(private readonly sizeController: SizeController) {
    this.router = Router();
    this.initializeRoutes();
  }

  private initializeRoutes(): void {
    this.router.get(
      '/',
      this.sizeController.getAllSizes.bind(this.sizeController)
    );

    this.router.get(
      '/search/query',
      validateRequest(SizeSchemas.search),
      this.sizeController.searchSizes.bind(this.sizeController)
    );

    this.router.get(
      '/category/:category',
      validateRequest(SizeSchemas.getByCategory),
      this.sizeController.getSizesByCategory.bind(this.sizeController)
    );

    this.router.get(
      '/dimensions',
      this.sizeController.getSizesByDimensions.bind(this.sizeController)
    );

    this.router.get(
      '/:id',
      validateRequest(SizeSchemas.getById),
      this.sizeController.getSizeById.bind(this.sizeController)
    );

    this.router.get(
      '/:id/products',
      validateRequest(SizeSchemas.getById),
      this.sizeController.getSizeWithProducts.bind(this.sizeController)
    );

    this.router.post(
      '/',
      authMiddleware,
      roleGuard(['ADMIN', 'MANAGER']),
      validateRequest(SizeSchemas.create),
      this.sizeController.createSize.bind(this.sizeController)
    );

    this.router.post(
      '/bulk',
      authMiddleware,
      roleGuard(['ADMIN', 'MANAGER']),
      validateRequest(SizeSchemas.bulkCreate),
      this.sizeController.bulkCreateSizes.bind(this.sizeController)
    );

    this.router.patch(
      '/:id',
      authMiddleware,
      roleGuard(['ADMIN', 'MANAGER']),
      validateRequest(SizeSchemas.update),
      this.sizeController.updateSize.bind(this.sizeController)
    );

    this.router.patch(
      '/:id/status',
      authMiddleware,
      roleGuard(['ADMIN', 'MANAGER']),
      validateRequest(SizeSchemas.updateStatus),
      this.sizeController.updateSizeStatus.bind(this.sizeController)
    );

    this.router.delete(
      '/:id',
      authMiddleware,
      roleGuard(['ADMIN', 'MANAGER']),
      validateRequest(SizeSchemas.delete),
      this.sizeController.deleteSize.bind(this.sizeController)
    );

    this.router.post(
      '/bulk/delete',
      authMiddleware,
      roleGuard(['ADMIN', 'MANAGER']),
      validateRequest(SizeSchemas.bulkDelete),
      this.sizeController.bulkDeleteSizes.bind(this.sizeController)
    );
  }
}

export const createSizeRouter = (sizeController: SizeController): Router => {
  const sizeRoutes = new SizeRoutes(sizeController);
  return sizeRoutes.router;
};