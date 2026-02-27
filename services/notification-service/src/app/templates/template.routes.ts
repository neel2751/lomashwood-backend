import { Router } from 'express';
import { TemplateController } from './template.controller';
import { TemplateService } from './template.service';
import { TemplateRepository } from './template.repository';
import { authMiddleware, requireRole } from '../../infrastructure/http/middleware.factory';
import { TEMPLATE_ROUTES } from './template.constants';
import type { PrismaClient } from '@prisma/client';
import type { RedisClientType } from 'redis';
import type { IEventProducer } from '../../infrastructure/messaging/event-producer';
import type { Logger } from 'winston';

export function createTemplateRouter(deps: {
  prisma: PrismaClient;
  redis: RedisClientType;
  eventProducer: IEventProducer;
  logger: Logger;
}): Router {
  const router = Router();

  const repository = new TemplateRepository(deps.prisma);
  const service = new TemplateService(repository, deps.redis, deps.eventProducer, deps.logger);
  const controller = new TemplateController(service);

  // ─── Public / internal-service render endpoint ────────────────────────────
  // Used by email-service, sms-service, push-service to render templates at
  // send time. Protected by service-level auth (bearer token or mTLS in prod).
  router.post(TEMPLATE_ROUTES.RENDER, authMiddleware, controller.render);

  // ─── Read endpoints (admin) ───────────────────────────────────────────────
  router.get(TEMPLATE_ROUTES.LIST, authMiddleware, requireRole('admin'), controller.list);

  router.get(
    TEMPLATE_ROUTES.GET_BY_SLUG,
    authMiddleware,
    requireRole('admin'),
    controller.getBySlug,
  );

  router.get(
    TEMPLATE_ROUTES.VERSIONS,
    authMiddleware,
    requireRole('admin'),
    controller.listVersions,
  );

  router.get(
    `/:id/versions/:version`,
    authMiddleware,
    requireRole('admin'),
    controller.getVersion,
  );

  // GET /:id must come after specific named routes to avoid conflicts
  router.get(TEMPLATE_ROUTES.GET_BY_ID, authMiddleware, requireRole('admin'), controller.getById);

  // ─── Write endpoints (admin) ──────────────────────────────────────────────
  router.post(TEMPLATE_ROUTES.CREATE, authMiddleware, requireRole('admin'), controller.create);

  router.patch(TEMPLATE_ROUTES.UPDATE, authMiddleware, requireRole('admin'), controller.update);

  router.patch(
    TEMPLATE_ROUTES.ARCHIVE,
    authMiddleware,
    requireRole('admin'),
    controller.archive,
  );

  router.patch(
    TEMPLATE_ROUTES.RESTORE,
    authMiddleware,
    requireRole('admin'),
    controller.restore,
  );

  router.delete(
    TEMPLATE_ROUTES.DELETE,
    authMiddleware,
    requireRole('admin'),
    controller.delete,
  );

  return router;
}