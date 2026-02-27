import { Router } from 'express';
import RoleController from './role.controller';
import MiddlewareFactory from '../../interfaces/http/middleware.factory';
import {
  createRoleSchema,
  updateRoleSchema,
  getRoleByIdSchema,
  getRoleByNameSchema,
  deleteRoleSchema,
  assignPermissionsSchema,
  removePermissionsSchema,
  getRolePermissionsSchema,
  checkPermissionSchema,
  getUsersByRoleSchema,
  getRoleStatsSchema,
  activateRoleSchema,
  deactivateRoleSchema,
  cloneRoleSchema,
  bulkAssignRoleSchema,
  exportRolesSchema,
} from './role.schemas';

export class RoleRoutes {
  public router: Router;
  private controller: InstanceType<typeof RoleController>;

  constructor(controller: InstanceType<typeof RoleController>) {
    this.router = Router();
    this.controller = controller;
    this.initializeRoutes();
  }

  private initializeRoutes(): void {
    this.router.post(
      '/',
      MiddlewareFactory.authenticate(),
      MiddlewareFactory.authorize('ADMIN', 'SUPER_ADMIN'),
      MiddlewareFactory.validateRequest(createRoleSchema),
      this.controller.createRole.bind(this.controller)
    );

    this.router.get(
      '/',
      MiddlewareFactory.authenticate(),
      MiddlewareFactory.authorize('ADMIN', 'SUPER_ADMIN'),
      this.controller.getAllRoles.bind(this.controller)
    );

    this.router.get(
      '/system',
      MiddlewareFactory.authenticate(),
      MiddlewareFactory.authorize('ADMIN', 'SUPER_ADMIN'),
      this.controller.getSystemRoles.bind(this.controller)
    );

    this.router.get(
      '/custom',
      MiddlewareFactory.authenticate(),
      MiddlewareFactory.authorize('ADMIN', 'SUPER_ADMIN'),
      this.controller.getCustomRoles.bind(this.controller)
    );

    this.router.get(
      '/permissions',
      MiddlewareFactory.authenticate(),
      MiddlewareFactory.authorize('ADMIN', 'SUPER_ADMIN'),
      this.controller.getAllPermissions.bind(this.controller)
    );

    this.router.post(
      '/bulk-assign',
      MiddlewareFactory.authenticate(),
      MiddlewareFactory.authorize('SUPER_ADMIN'),
      MiddlewareFactory.validateRequest(bulkAssignRoleSchema),
      this.controller.bulkAssignRole.bind(this.controller)
    );

    this.router.get(
      '/export',
      MiddlewareFactory.authenticate(),
      MiddlewareFactory.authorize('SUPER_ADMIN'),
      MiddlewareFactory.validateRequest(exportRolesSchema),
      this.controller.exportRoles.bind(this.controller)
    );

    this.router.get(
      '/:id',
      MiddlewareFactory.authenticate(),
      MiddlewareFactory.authorize('ADMIN', 'SUPER_ADMIN'),
      MiddlewareFactory.validateRequest(getRoleByIdSchema),
      this.controller.getRoleById.bind(this.controller)
    );

    this.router.get(
      '/name/:name',
      MiddlewareFactory.authenticate(),
      MiddlewareFactory.authorize('ADMIN', 'SUPER_ADMIN'),
      MiddlewareFactory.validateRequest(getRoleByNameSchema),
      this.controller.getRoleByName.bind(this.controller)
    );

    this.router.patch(
      '/:id',
      MiddlewareFactory.authenticate(),
      MiddlewareFactory.authorize('ADMIN', 'SUPER_ADMIN'),
      MiddlewareFactory.validateRequest(updateRoleSchema),
      this.controller.updateRole.bind(this.controller)
    );

    this.router.delete(
      '/:id',
      MiddlewareFactory.authenticate(),
      MiddlewareFactory.authorize('SUPER_ADMIN'),
      MiddlewareFactory.validateRequest(deleteRoleSchema),
      this.controller.deleteRole.bind(this.controller)
    );

    this.router.post(
      '/:id/permissions',
      MiddlewareFactory.authenticate(),
      MiddlewareFactory.authorize('ADMIN', 'SUPER_ADMIN'),
      MiddlewareFactory.validateRequest(assignPermissionsSchema),
      this.controller.assignPermissions.bind(this.controller)
    );

    this.router.delete(
      '/:id/permissions',
      MiddlewareFactory.authenticate(),
      MiddlewareFactory.authorize('ADMIN', 'SUPER_ADMIN'),
      MiddlewareFactory.validateRequest(removePermissionsSchema),
      this.controller.removePermissions.bind(this.controller)
    );

    this.router.get(
      '/:id/permissions',
      MiddlewareFactory.authenticate(),
      MiddlewareFactory.authorize('ADMIN', 'SUPER_ADMIN'),
      MiddlewareFactory.validateRequest(getRolePermissionsSchema),
      this.controller.getRolePermissions.bind(this.controller)
    );

    this.router.get(
      '/:id/permissions/check',
      MiddlewareFactory.authenticate(),
      MiddlewareFactory.authorize('ADMIN', 'SUPER_ADMIN'),
      MiddlewareFactory.validateRequest(checkPermissionSchema),
      this.controller.checkPermission.bind(this.controller)
    );

    this.router.get(
      '/:id/users',
      MiddlewareFactory.authenticate(),
      MiddlewareFactory.authorize('ADMIN', 'SUPER_ADMIN'),
      MiddlewareFactory.validateRequest(getUsersByRoleSchema),
      this.controller.getUsersByRole.bind(this.controller)
    );

    this.router.get(
      '/:id/stats',
      MiddlewareFactory.authenticate(),
      MiddlewareFactory.authorize('ADMIN', 'SUPER_ADMIN'),
      MiddlewareFactory.validateRequest(getRoleStatsSchema),
      this.controller.getRoleStats.bind(this.controller)
    );

    this.router.post(
      '/:id/activate',
      MiddlewareFactory.authenticate(),
      MiddlewareFactory.authorize('SUPER_ADMIN'),
      MiddlewareFactory.validateRequest(activateRoleSchema),
      this.controller.activateRole.bind(this.controller)
    );

    this.router.post(
      '/:id/deactivate',
      MiddlewareFactory.authenticate(),
      MiddlewareFactory.authorize('SUPER_ADMIN'),
      MiddlewareFactory.validateRequest(deactivateRoleSchema),
      this.controller.deactivateRole.bind(this.controller)
    );

    this.router.post(
      '/:id/clone',
      MiddlewareFactory.authenticate(),
      MiddlewareFactory.authorize('SUPER_ADMIN'),
      MiddlewareFactory.validateRequest(cloneRoleSchema),
      this.controller.cloneRole.bind(this.controller)
    );
  }

  public getRouter(): Router {
    return this.router;
  }
}

export function createRoleRouter(controller: InstanceType<typeof RoleController>): Router {
  const roleRoutes = new RoleRoutes(controller);
  return roleRoutes.getRouter();
}

export default RoleRoutes;