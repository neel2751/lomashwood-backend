import { Router } from 'express';
import { AvailabilityController } from './availability.controller';
import { AvailabilityService } from './availability.service';
import { AvailabilityRepository } from './availability.repository';
import { AvailabilityMapper } from './availability.mapper';
import { prismaClient } from '../../infrastructure/db/prisma.client';
import { redisClient } from '../../infrastructure/cache/redis.client';
import { MiddlewareFactory } from '../../interfaces/http/middleware.factory';
import {
  CreateAvailabilitySchema,
  UpdateAvailabilitySchema,
  AvailabilityQuerySchema,
  CreateSlotSchema,
  UpdateSlotSchema,
} from './availability.schemas';

const router = Router();

const authMiddleware = MiddlewareFactory.requireAuth();
const adminMiddleware = MiddlewareFactory.requireRole('ADMIN');
const validateRequest = (schema: any) => MiddlewareFactory.asyncWrapper(async (req, _res, next) => {
  if (schema.body) schema.body.parse(req.body);
  if (schema.query) schema.query.parse(req.query);
  next();
});

const availabilityRepository = new AvailabilityRepository(prismaClient);
const availabilityMapper = new AvailabilityMapper();
const availabilityService = new AvailabilityService(
  availabilityRepository,
  redisClient,
  availabilityMapper,
);
const availabilityController = new AvailabilityController(availabilityService);

router.get(
  '/',
  validateRequest({ query: AvailabilityQuerySchema }),
  availabilityController.getAllAvailabilities.bind(availabilityController),
);

router.get(
  '/slots',
  validateRequest({ query: AvailabilityQuerySchema }),
  availabilityController.getAvailableSlots.bind(availabilityController),
);

router.get(
  '/consultant/:consultantId',
  validateRequest({ query: AvailabilityQuerySchema }),
  availabilityController.getAvailabilityByConsultant.bind(availabilityController),
);

router.get(
  '/consultant/:consultantId/slots',
  validateRequest({ query: AvailabilityQuerySchema }),
  availabilityController.getSlotsByConsultant.bind(availabilityController),
);

router.get(
  '/:id',
  authMiddleware,
  availabilityController.getAvailabilityById.bind(availabilityController),
);

router.get(
  '/slots/:id',
  authMiddleware,
  availabilityController.getSlotById.bind(availabilityController),
);

router.post(
  '/',
  authMiddleware,
  adminMiddleware,
  validateRequest({ body: CreateAvailabilitySchema }),
  availabilityController.createAvailability.bind(availabilityController),
);

router.post(
  '/slots',
  authMiddleware,
  adminMiddleware,
  validateRequest({ body: CreateSlotSchema }),
  availabilityController.createSlot.bind(availabilityController),
);

router.patch(
  '/:id',
  authMiddleware,
  adminMiddleware,
  validateRequest({ body: UpdateAvailabilitySchema }),
  availabilityController.updateAvailability.bind(availabilityController),
);

router.patch(
  '/slots/:id',
  authMiddleware,
  adminMiddleware,
  validateRequest({ body: UpdateSlotSchema }),
  availabilityController.updateSlot.bind(availabilityController),
);

router.patch(
  '/slots/:id/book',
  authMiddleware,
  adminMiddleware,
  availabilityController.markSlotAsBooked.bind(availabilityController),
);

router.patch(
  '/slots/:id/release',
  authMiddleware,
  adminMiddleware,
  availabilityController.markSlotAsAvailable.bind(availabilityController),
);

router.delete(
  '/:id',
  authMiddleware,
  adminMiddleware,
  availabilityController.deleteAvailability.bind(availabilityController),
);

router.delete(
  '/slots/:id',
  authMiddleware,
  adminMiddleware,
  availabilityController.deleteSlot.bind(availabilityController),
);

export { router as availabilityRoutes };