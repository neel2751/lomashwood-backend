import { Router } from 'express';
import { PushController } from './push.controller';
import { PushService } from './push.service';
import { authMiddleware, requireRole } from '../../infrastructure/http/middleware.factory';
import { PUSH_ROUTES } from './push.constants';
import type { PrismaClient } from '@prisma/client';
import type { RedisClientType } from 'redis';
import type { IEventProducer } from '../../infrastructure/messaging/event-producer';
import type { Logger } from 'winston';

export function createPushRouter(deps: {
  prisma: PrismaClient;
  redis: RedisClientType;
  eventProducer: IEventProducer;
  logger: Logger;
  config: {
    firebase?: { serviceAccount: Record<string, unknown>; projectId: string };
    webpush?: { vapidPublicKey: string; vapidPrivateKey: string; subject: string };
  };
}): Router {
  const router = Router();

  const service = new PushService(
    deps.prisma,
    deps.redis,
    deps.eventProducer,
    deps.logger,
    deps.config,
  );

  const controller = new PushController(service);

  
  router.get('/health', authMiddleware, requireRole('admin'), controller.health);

  
  router.post(PUSH_ROUTES.SEND, authMiddleware, requireRole('admin'), controller.send);

  
  router.post(PUSH_ROUTES.SEND_BULK, authMiddleware, requireRole('admin'), controller.sendBulk);

  
  router.post(
    `/send/user/:userId`,
    authMiddleware,
    requireRole('admin'),
    controller.sendToUser,
  );

  
  router.post(PUSH_ROUTES.REGISTER_TOKEN, authMiddleware, controller.registerToken);

  
  router.delete(
    `/tokens/:token`,
    authMiddleware,
    controller.unregisterToken,
  );

  
  router.get(PUSH_ROUTES.LIST, authMiddleware, requireRole('admin'), controller.list);

  
  router.get(PUSH_ROUTES.GET_BY_ID, authMiddleware, requireRole('admin'), controller.getById);

  return router;
}