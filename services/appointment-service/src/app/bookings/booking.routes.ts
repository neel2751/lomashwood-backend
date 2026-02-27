import { Router } from 'express';
import { BookingController } from './booking.controller';
import { BookingService } from './booking.service';
import { BookingRepository } from './booking.repository';
import { AvailabilityService } from '../availability/availability.service';
import { AvailabilityRepository } from '../availability/availability.repository';
import { NotificationService } from '../../infrastructure/notifications/email.client';
import { EventProducer } from '../../infrastructure/messaging/event-producer';
import { BookingMapper } from './booking.mapper';
import { prismaClient } from '../../infrastructure/db/prisma.client';
import { redisClient } from '../../infrastructure/cache/redis.client';
import { authMiddleware } from '../../interfaces/http/middleware.factory';
import { adminMiddleware } from '../../interfaces/http/middleware.factory';
import { validateRequest } from '../../interfaces/http/middleware.factory';
import { CreateBookingSchema, UpdateBookingSchema, BookingQuerySchema } from './booking.schemas';

const router = Router();

const bookingRepository = new BookingRepository(prismaClient);
const availabilityRepository = new AvailabilityRepository(prismaClient);
const availabilityService = new AvailabilityService(availabilityRepository, redisClient);
const notificationService = new NotificationService();
const eventProducer = new EventProducer();
const bookingMapper = new BookingMapper();

const bookingService = new BookingService(
  bookingRepository,
  availabilityService,
  notificationService,
  eventProducer,
  bookingMapper,
);

const bookingController = new BookingController(bookingService);

router.get(
  '/',
  authMiddleware,
  adminMiddleware,
  validateRequest({ query: BookingQuerySchema }),
  bookingController.getAllBookings.bind(bookingController),
);

router.get(
  '/my',
  authMiddleware,
  validateRequest({ query: BookingQuerySchema }),
  bookingController.getMyBookings.bind(bookingController),
);

router.get(
  '/:id',
  authMiddleware,
  bookingController.getBookingById.bind(bookingController),
);

router.post(
  '/',
  authMiddleware,
  validateRequest({ body: CreateBookingSchema }),
  bookingController.createBooking.bind(bookingController),
);

router.patch(
  '/:id',
  authMiddleware,
  validateRequest({ body: UpdateBookingSchema }),
  bookingController.updateBooking.bind(bookingController),
);

router.patch(
  '/:id/cancel',
  authMiddleware,
  bookingController.cancelBooking.bind(bookingController),
);

router.patch(
  '/:id/reschedule',
  authMiddleware,
  bookingController.rescheduleBooking.bind(bookingController),
);

router.patch(
  '/:id/confirm',
  authMiddleware,
  adminMiddleware,
  bookingController.confirmBooking.bind(bookingController),
);

router.delete(
  '/:id',
  authMiddleware,
  adminMiddleware,
  bookingController.deleteBooking.bind(bookingController),
);

export { router as bookingRoutes };