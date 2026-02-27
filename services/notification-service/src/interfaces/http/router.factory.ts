import { Router } from 'express';
import { createEmailRouter } from '../../app/email/email.routes';
import { createSmsRouter } from '../../app/sms/sms.routes';
import { createPushRouter } from '../../app/push/push.routes';
import { createTemplateRouter } from '../../app/templates/template.routes';
import { createHealthRouter } from '../../infrastructure/http/health.routes';
import type { AppDependencies } from './express';

const API_V1 = '/api/v1';

export function createRouterFactory(deps: AppDependencies) {
  function mount(): Router {
    const root = Router();

   
    root.use(
      '/health',
      createHealthRouter({
        prisma: deps.prisma,
        redis: deps.redis,
        emailHealthChecker: deps.emailHealthChecker,
        smsHealthChecker: deps.smsHealthChecker,
        pushHealthChecker: deps.pushHealthChecker,
        eventConsumer: deps.eventConsumer,
        activeEmailProvider: deps.activeEmailProvider,
        activeSmsProvider: deps.activeSmsProvider,
        activePushProvider: deps.activePushProvider,
      }),
    );

    
    root.use(
      `${API_V1}/notifications/email`,
      createEmailRouter({
        prisma: deps.prisma,
        redis: deps.redis,
        eventProducer: deps.eventProducer,
        logger: deps.logger,
      }),
    );

    root.use(
      `${API_V1}/notifications/sms`,
      createSmsRouter({
        prisma: deps.prisma,
        redis: deps.redis,
        eventProducer: deps.eventProducer,
        logger: deps.logger,
      }),
    );

    root.use(
      `${API_V1}/notifications/push`,
      createPushRouter({
        prisma: deps.prisma,
        redis: deps.redis,
        eventProducer: deps.eventProducer,
        logger: deps.logger,
        config: {
          firebase: deps.config.firebase,
          webpush: deps.config.webpush,
        },
      }),
    );

   
    root.use(
      `${API_V1}/notifications/templates`,
      createTemplateRouter({
        prisma: deps.prisma,
        redis: deps.redis,
        eventProducer: deps.eventProducer,
        logger: deps.logger,
      }),
    );

    
    root.use((_req, res) => {
      res.status(404).json({
        success: false,
        statusCode: 404,
        message: 'Route not found',
        timestamp: new Date().toISOString(),
      });
    });

    return root;
  }

  return { mount };
}