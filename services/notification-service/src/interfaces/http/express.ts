import express, { Express } from 'express';
import helmet from 'helmet';
import compression from 'compression';
import { Logger } from 'winston';
import { createMiddlewareFactory } from './middleware.factory';
import { createRouterFactory } from './router.factory';
import type { PrismaClient } from '@prisma/client';
import type { RedisClientType } from 'redis';
import type { IEventProducer } from '../../infrastructure/messaging/event-producer';
import type { EmailHealthChecker } from '../../infrastructure/email/email-health';
import type { SmsHealthChecker } from '../../infrastructure/sms/sms-health';
import type { PushHealthChecker } from '../../infrastructure/push/push-health';
import type { EventConsumer } from '../../infrastructure/messaging/event-consumer';
import type { EmailProvider } from '../../infrastructure/email/email-health';
import type { SmsProvider } from '../../infrastructure/sms/sms-health';
import type { PushInfraProvider } from '../../infrastructure/push/push-health';

export interface AppDependencies {
  prisma: PrismaClient;
  redis: RedisClientType;
  eventProducer: IEventProducer;
  eventConsumer: EventConsumer;
  emailHealthChecker: EmailHealthChecker;
  smsHealthChecker: SmsHealthChecker;
  pushHealthChecker: PushHealthChecker;
  activeEmailProvider: EmailProvider;
  activeSmsProvider: SmsProvider;
  activePushProvider: PushInfraProvider;
  logger: Logger;
  config: {
    corsOrigins: string[];
    rateLimit: { windowMs: number; max: number };
    firebase?: { serviceAccount: Record<string, unknown>; projectId: string };
    webpush?: { vapidPublicKey: string; vapidPrivateKey: string; subject: string };
  };
}

export function createApp(deps: AppDependencies): Express {
  const app = express();

  
  app.set('trust proxy', 1);

 
  app.use(helmet());

  
  app.use(compression());

 
  app.use(express.json({ limit: '1mb' }));
  app.use(express.urlencoded({ extended: true, limit: '1mb' }));

  
  const middlewareFactory = createMiddlewareFactory(deps);
  app.use(middlewareFactory.cors());
  app.use(middlewareFactory.rateLimit());
  app.use(middlewareFactory.requestLogger());

  
  const routerFactory = createRouterFactory(deps);
  app.use(routerFactory.mount());

 
  app.use(middlewareFactory.errorHandler());

  return app;
}