import { Router } from 'express';
import { ColourController } from './colour.controller';
import { authMiddleware } from '../../infrastructure/http/middleware/auth.middleware';
import { validateRequest } from '../../infrastructure/http/middleware/validation.middleware';
import { ColourSchemas } from './colour.schemas';
import { roleGuard } from '../../infrastructure/http/middleware/role.middleware';

export class ColourRoutes {
  private router: Router;
  private controller: ColourController;

  constructor(controller: ColourController) {
    this.router = Router();
    this.controller = controller;
    this.initializeRoutes();
  }

  private initializeRoutes(): void {
    this.router.get(
      '/',
      this.controller.getAllColours.bind(this.controller)
    );

    this.router.get(
      '/:id',
      validateRequest(ColourSchemas.getById),
      this.controller.getColourById.bind(this.controller)
    );

    this.router.post(
      '/',
      authMiddleware,
      roleGuard(['ADMIN', 'MANAGER']),
      validateRequest(ColourSchemas.create),
      this.controller.createColour.bind(this.controller)
    );

    this.router.patch(
      '/:id',
      authMiddleware,
      roleGuard(['ADMIN', 'MANAGER']),
      validateRequest(ColourSchemas.update),
      this.controller.updateColour.bind(this.controller)
    );

    this.router.delete(
      '/:id',
      authMiddleware,
      roleGuard(['ADMIN']),
      validateRequest(ColourSchemas.delete),
      this.controller.deleteColour.bind(this.controller)
    );

    this.router.get(
      '/search/query',
      validateRequest(ColourSchemas.search),
      this.controller.searchColours.bind(this.controller)
    );

    this.router.get(
      '/hex/:hexCode',
      validateRequest(ColourSchemas.getByHex),
      this.controller.getColourByHex.bind(this.controller)
    );

    this.router.patch(
      '/:id/status',
      authMiddleware,
      roleGuard(['ADMIN', 'MANAGER']),
      validateRequest(ColourSchemas.updateStatus),
      this.controller.updateColourStatus.bind(this.controller)
    );

    this.router.post(
      '/bulk',
      authMiddleware,
      roleGuard(['ADMIN']),
      validateRequest(ColourSchemas.bulkCreate),
      this.controller.bulkCreateColours.bind(this.controller)
    );

    this.router.delete(
      '/bulk/delete',
      authMiddleware,
      roleGuard(['ADMIN']),
      validateRequest(ColourSchemas.bulkDelete),
      this.controller.bulkDeleteColours.bind(this.controller)
    );

    this.router.get(
      '/category/:category',
      validateRequest(ColourSchemas.getByCategory),
      this.controller.getColoursByCategory.bind(this.controller)
    );
  }

  public getRouter(): Router {
    return this.router;
  }
}

export const createColourRouter = (controller: ColourController): Router => {
  const colourRoutes = new ColourRoutes(controller);
  return colourRoutes.getRouter();
};