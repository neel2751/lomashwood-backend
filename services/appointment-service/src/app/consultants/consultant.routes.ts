import { Router } from 'express';
import { ConsultantController } from './consultant.controller';
import { ConsultantService } from './consultant.service';
import { ConsultantRepository } from './consultant.repository';
import { ConsultantMapper } from './consultant.mapper';
import { EventProducer } from '../../infrastructure/messaging/event-producer';
import { prismaClient } from '../../infrastructure/db/prisma.client';
import { redisClient } from '../../infrastructure/cache/redis.client';
import { authMiddleware, adminMiddleware, validateRequest } from '../../interfaces/http/middleware.factory';
import {
  CreateConsultantSchema,
  UpdateConsultantSchema,
  ConsultantQuerySchema,
} from './consultant.schemas';

const router = Router();

const consultantRepository = new ConsultantRepository(prismaClient);
const consultantMapper = new ConsultantMapper();
const eventProducer = new EventProducer();

const consultantService = new ConsultantService(
  consultantRepository,
  redisClient,
  eventProducer,
  consultantMapper,
);

const consultantController = new ConsultantController(consultantService);

router.get(
  '/',
  validateRequest({ query: ConsultantQuerySchema }),
  consultantController.getAllConsultants.bind(consultantController),
);

router.get(
  '/:id',
  consultantController.getConsultantById.bind(consultantController),
);

router.get(
  '/:id/availability',
  validateRequest({ query: ConsultantQuerySchema }),
  consultantController.getConsultantAvailability.bind(consultantController),
);

router.get(
  '/:id/bookings',
  authMiddleware,
  adminMiddleware,
  validateRequest({ query: ConsultantQuerySchema }),
  consultantController.getConsultantBookings.bind(consultantController),
);

router.get(
  '/:id/stats',
  authMiddleware,
  adminMiddleware,
  consultantController.getConsultantStats.bind(consultantController),
);

router.post(
  '/',
  authMiddleware,
  adminMiddleware,
  validateRequest({ body: CreateConsultantSchema }),
  consultantController.createConsultant.bind(consultantController),
);

router.patch(
  '/:id',
  authMiddleware,
  adminMiddleware,
  validateRequest({ body: UpdateConsultantSchema }),
  consultantController.updateConsultant.bind(consultantController),
);

router.patch(
  '/:id/activate',
  authMiddleware,
  adminMiddleware,
  consultantController.activateConsultant.bind(consultantController),
);

router.patch(
  '/:id/deactivate',
  authMiddleware,
  adminMiddleware,
  consultantController.deactivateConsultant.bind(consultantController),
);

router.delete(
  '/:id',
  authMiddleware,
  adminMiddleware,
  consultantController.deleteConsultant.bind(consultantController),
);

export { router as consultantRoutes };