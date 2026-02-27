import { Router } from 'express';
import { SessionController } from './session.controller';
import MiddlewareFactory from '../../interfaces/http/middleware.factory';
import {
  createSessionSchema,
  updateSessionSchema,
  getSessionByIdSchema,
  deleteSessionSchema,
  getSessionsByUserIdSchema,
  revokeAllUserSessionsSchema,
} from './session.schemas';

export class SessionRoutes {
  public router: Router;
  private controller: SessionController;

  constructor(controller: SessionController) {
    this.router = Router();
    this.controller = controller;
    this.initializeRoutes();
  }

  private initializeRoutes(): void {
    this.router.post(
      '/',
      MiddlewareFactory.validateRequest(createSessionSchema),
      this.controller.getSessions.bind(this.controller)
    );

    this.router.get(
      '/current',
      MiddlewareFactory.authenticate(),
      this.controller.getCurrentSession.bind(this.controller)
    );

    this.router.get(
      '/stats',
      MiddlewareFactory.authenticate(),
      this.controller.getSessionStats.bind(this.controller)
    );

    this.router.get(
      '/devices',
      MiddlewareFactory.authenticate(),
      this.controller.getActiveDevices.bind(this.controller)
    );

    this.router.post(
      '/extend',
      MiddlewareFactory.authenticate(),
      this.controller.extendSession.bind(this.controller)
    );

    this.router.post(
      '/verify',
      MiddlewareFactory.authenticate(),
      this.controller.verifySession.bind(this.controller)
    );

    this.router.post(
      '/revoke-all',
      MiddlewareFactory.authenticate(),
      MiddlewareFactory.validateRequest(revokeAllUserSessionsSchema),
      this.controller.revokeAllSessions.bind(this.controller)
    );

    this.router.post(
      '/cleanup',
      MiddlewareFactory.authenticate(),
      this.controller.cleanupExpiredSessions.bind(this.controller)
    );

    this.router.get(
      '/user/:userId',
      MiddlewareFactory.authenticate(),
      MiddlewareFactory.validateRequest(getSessionsByUserIdSchema),
      this.controller.getSessions.bind(this.controller)
    );

    this.router.get(
      '/:id',
      MiddlewareFactory.authenticate(),
      MiddlewareFactory.validateRequest(getSessionByIdSchema),
      this.controller.getSessionById.bind(this.controller)
    );

    this.router.patch(
      '/:id',
      MiddlewareFactory.authenticate(),
      MiddlewareFactory.validateRequest(updateSessionSchema),
      this.controller.updateSession.bind(this.controller)
    );

    this.router.delete(
      '/:id',
      MiddlewareFactory.authenticate(),
      MiddlewareFactory.validateRequest(deleteSessionSchema),
      this.controller.revokeSession.bind(this.controller)
    );
  }

  public getRouter(): Router {
    return this.router;
  }
}

export function createSessionRouter(controller: SessionController): Router {
  const sessionRoutes = new SessionRoutes(controller);
  return sessionRoutes.getRouter();
}

export default SessionRoutes;