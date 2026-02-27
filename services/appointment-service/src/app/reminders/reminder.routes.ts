import { Router } from 'express';
import { ReminderController } from './reminder.controller';
import { ReminderService } from './reminder.service';
import { ReminderRepository } from './reminder.repository';
import { ReminderMapper } from './reminder.mapper';
import { BookingRepository } from '../bookings/booking.repository';
import { NotificationService } from '../../infrastructure/notifications/email.client';
import { EventProducer } from '../../infrastructure/messaging/event-producer';
import { prismaClient } from '../../infrastructure/db/prisma.client';
import { authMiddleware } from '../../interfaces/http/middleware.factory';
import { adminMiddleware } from '../../interfaces/http/middleware.factory';
import { validateRequest } from '../../interfaces/http/middleware.factory';
import {
  CreateReminderSchema,
  UpdateReminderSchema,
  ReminderQuerySchema,
  RescheduleReminderSchema,
} from './reminder.schemas';

const router = Router();

const reminderRepository = new ReminderRepository(prismaClient);
const bookingRepository = new BookingRepository(prismaClient);
const notificationService = new NotificationService();
const eventProducer = new EventProducer();
const reminderMapper = new ReminderMapper();

const reminderService = new ReminderService(
  reminderRepository,
  bookingRepository,
  notificationService,
  eventProducer,
  reminderMapper,
);

const reminderController = new ReminderController(reminderService);

router.get(
  '/',
  authMiddleware,
  adminMiddleware,
  validateRequest({ query: ReminderQuerySchema }),
  reminderController.getAllReminders.bind(reminderController),
);

router.get(
  '/pending',
  authMiddleware,
  adminMiddleware,
  reminderController.getPendingReminders.bind(reminderController),
);

router.get(
  '/booking/:bookingId',
  authMiddleware,
  adminMiddleware,
  reminderController.getRemindersByBooking.bind(reminderController),
);

router.get(
  '/:id',
  authMiddleware,
  adminMiddleware,
  reminderController.getReminderById.bind(reminderController),
);

router.post(
  '/',
  authMiddleware,
  adminMiddleware,
  validateRequest({ body: CreateReminderSchema }),
  reminderController.createReminder.bind(reminderController),
);

router.post(
  '/process',
  authMiddleware,
  adminMiddleware,
  reminderController.processReminders.bind(reminderController),
);

router.patch(
  '/:id',
  authMiddleware,
  adminMiddleware,
  validateRequest({ body: UpdateReminderSchema }),
  reminderController.updateReminder.bind(reminderController),
);

router.patch(
  '/:id/send',
  authMiddleware,
  adminMiddleware,
  reminderController.sendReminder.bind(reminderController),
);

router.patch(
  '/:id/cancel',
  authMiddleware,
  adminMiddleware,
  reminderController.cancelReminder.bind(reminderController),
);

router.patch(
  '/:id/reschedule',
  authMiddleware,
  adminMiddleware,
  validateRequest({ body: RescheduleReminderSchema }),
  reminderController.rescheduleReminder.bind(reminderController),
);

router.delete(
  '/:id',
  authMiddleware,
  adminMiddleware,
  reminderController.deleteReminder.bind(reminderController),
);

export { router as reminderRoutes };