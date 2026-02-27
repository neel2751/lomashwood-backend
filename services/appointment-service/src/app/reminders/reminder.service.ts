import { ReminderRepository } from './reminder.repository';
import { ReminderMapper } from './reminder.mapper';
import { NotificationService } from '../../infrastructure/notifications/email.client';
import { EventProducer } from '../../infrastructure/messaging/event-producer';
import { BookingRepository } from '../bookings/booking.repository';
import {
  ReminderNotFoundError,
  BookingNotFoundError,
  ReminderAlreadySentError,
  ReminderCancelledError,
} from '../../shared/errors';
import {
  REMINDER_STATUS,
  REMINDER_TYPE,
  REMINDER_ERRORS,
  REMINDER_EVENTS,
} from './reminder.constants';
import {
  CreateReminderDto,
  UpdateReminderDto,
  ReminderQueryDto,
  ReminderResponse,
  PaginatedReminderResponse,
  ProcessRemindersResult,
} from './reminder.types';
import { PaginationMeta } from '../../shared/pagination';
import { logger } from '../../config/logger';

export class ReminderService {
  constructor(
    private readonly reminderRepository: ReminderRepository,
    private readonly bookingRepository: BookingRepository,
    private readonly notificationService: NotificationService,
    private readonly eventProducer: EventProducer,
    private readonly reminderMapper: ReminderMapper,
  ) {}

  async createReminder(dto: CreateReminderDto): Promise<ReminderResponse> {
    const booking = await this.bookingRepository.findById(dto.bookingId);
    if (!booking) {
      throw new BookingNotFoundError(dto.bookingId);
    }

    const reminder = await this.reminderRepository.create({
      ...dto,
      status: REMINDER_STATUS.PENDING,
    });

    await this.eventProducer.publish(REMINDER_EVENTS.CREATED, {
      reminderId: reminder.id,
      bookingId: dto.bookingId,
      type: dto.type,
      scheduledAt: dto.scheduledAt,
    });

    return this.reminderMapper.toResponse(reminder);
  }

  async getReminderById(id: string): Promise<ReminderResponse> {
    const reminder = await this.reminderRepository.findById(id);
    if (!reminder) {
      throw new ReminderNotFoundError(id);
    }
    return this.reminderMapper.toResponse(reminder);
  }

  async getAllReminders(query: ReminderQueryDto): Promise<PaginatedReminderResponse> {
    const { data, total } = await this.reminderRepository.findAll(query);
    const meta: PaginationMeta = {
      total,
      page: query.page ?? 1,
      limit: query.limit ?? 10,
      totalPages: Math.ceil(total / (query.limit ?? 10)),
    };

    return {
      data: data.map((r) => this.reminderMapper.toResponse(r)),
      meta,
    };
  }

  async getRemindersByBooking(bookingId: string): Promise<ReminderResponse[]> {
    const booking = await this.bookingRepository.findById(bookingId);
    if (!booking) {
      throw new BookingNotFoundError(bookingId);
    }

    const reminders = await this.reminderRepository.findByBookingId(bookingId);
    return reminders.map((r) => this.reminderMapper.toResponse(r));
  }

  async updateReminder(id: string, dto: UpdateReminderDto): Promise<ReminderResponse> {
    const reminder = await this.reminderRepository.findById(id);
    if (!reminder) {
      throw new ReminderNotFoundError(id);
    }

    if (reminder.status === REMINDER_STATUS.SENT) {
      throw new ReminderAlreadySentError(id);
    }

    if (reminder.status === REMINDER_STATUS.CANCELLED) {
      throw new ReminderCancelledError(id);
    }

    const updated = await this.reminderRepository.update(id, dto);
    return this.reminderMapper.toResponse(updated);
  }

  async deleteReminder(id: string): Promise<void> {
    const reminder = await this.reminderRepository.findById(id);
    if (!reminder) {
      throw new ReminderNotFoundError(id);
    }
    await this.reminderRepository.softDelete(id);
  }

  async sendReminder(id: string): Promise<ReminderResponse> {
    const reminder = await this.reminderRepository.findById(id);
    if (!reminder) {
      throw new ReminderNotFoundError(id);
    }

    if (reminder.status === REMINDER_STATUS.SENT) {
      throw new ReminderAlreadySentError(id);
    }

    if (reminder.status === REMINDER_STATUS.CANCELLED) {
      throw new ReminderCancelledError(id);
    }

    const booking = await this.bookingRepository.findById(reminder.bookingId);
    if (!booking) {
      throw new BookingNotFoundError(reminder.bookingId);
    }

    await this.notificationService.sendBookingReminder({
      to: booking.customerEmail,
      customerName: booking.customerName,
      bookingId: booking.id,
      appointmentType: booking.appointmentType,
      scheduledAt: booking.scheduledAt,
      reminderType: reminder.type,
    });

    const updated = await this.reminderRepository.update(id, {
      status: REMINDER_STATUS.SENT,
      sentAt: new Date(),
    });

    await this.bookingRepository.markReminderSent(booking.id);

    await this.eventProducer.publish(REMINDER_EVENTS.SENT, {
      reminderId: id,
      bookingId: booking.id,
      type: reminder.type,
      sentAt: new Date(),
    });

    return this.reminderMapper.toResponse(updated);
  }

  async cancelReminder(id: string): Promise<ReminderResponse> {
    const reminder = await this.reminderRepository.findById(id);
    if (!reminder) {
      throw new ReminderNotFoundError(id);
    }

    if (reminder.status === REMINDER_STATUS.SENT) {
      throw new ReminderAlreadySentError(id);
    }

    if (reminder.status === REMINDER_STATUS.CANCELLED) {
      throw new ReminderCancelledError(id);
    }

    const updated = await this.reminderRepository.update(id, {
      status: REMINDER_STATUS.CANCELLED,
    });

    await this.eventProducer.publish(REMINDER_EVENTS.CANCELLED, {
      reminderId: id,
      bookingId: reminder.bookingId,
    });

    return this.reminderMapper.toResponse(updated);
  }

  async rescheduleReminder(id: string, scheduledAt: Date): Promise<ReminderResponse> {
    const reminder = await this.reminderRepository.findById(id);
    if (!reminder) {
      throw new ReminderNotFoundError(id);
    }

    if (reminder.status === REMINDER_STATUS.SENT) {
      throw new ReminderAlreadySentError(id);
    }

    if (reminder.status === REMINDER_STATUS.CANCELLED) {
      throw new ReminderCancelledError(id);
    }

    const updated = await this.reminderRepository.update(id, {
      scheduledAt,
      status: REMINDER_STATUS.PENDING,
    });

    await this.eventProducer.publish(REMINDER_EVENTS.RESCHEDULED, {
      reminderId: id,
      bookingId: reminder.bookingId,
      newScheduledAt: scheduledAt,
    });

    return this.reminderMapper.toResponse(updated);
  }

  async getPendingReminders(): Promise<ReminderResponse[]> {
    const reminders = await this.reminderRepository.findPending();
    return reminders.map((r) => this.reminderMapper.toResponse(r));
  }

  async processReminders(): Promise<ProcessRemindersResult> {
    const now = new Date();
    const dueReminders = await this.reminderRepository.findDue(now);

    let sent = 0;
    let failed = 0;
    const errors: string[] = [];

    for (const reminder of dueReminders) {
      try {
        await this.sendReminder(reminder.id);
        sent++;
      } catch (error) {
        failed++;
        const message = error instanceof Error ? error.message : String(error);
        errors.push(`Reminder ${reminder.id}: ${message}`);
        logger.error({
          message: 'Failed to process reminder',
          reminderId: reminder.id,
          error: message,
        });

        await this.reminderRepository.update(reminder.id, {
          status: REMINDER_STATUS.FAILED,
          failureReason: message,
        });

        await this.eventProducer.publish(REMINDER_EVENTS.FAILED, {
          reminderId: reminder.id,
          bookingId: reminder.bookingId,
          error: message,
        });
      }
    }

    logger.info({
      message: 'Reminder processing complete',
      total: dueReminders.length,
      sent,
      failed,
    });

    return {
      total: dueReminders.length,
      sent,
      failed,
      errors,
    };
  }

  async scheduleBookingReminders(bookingId: string, scheduledAt: Date): Promise<void> {
    const booking = await this.bookingRepository.findById(bookingId);
    if (!booking) {
      throw new BookingNotFoundError(bookingId);
    }

    const twentyFourHoursBefore = new Date(scheduledAt.getTime() - 24 * 60 * 60 * 1000);
    const oneHourBefore = new Date(scheduledAt.getTime() - 60 * 60 * 1000);

    if (twentyFourHoursBefore > new Date()) {
      await this.reminderRepository.create({
        bookingId,
        type: REMINDER_TYPE.EMAIL_24H,
        scheduledAt: twentyFourHoursBefore,
        status: REMINDER_STATUS.PENDING,
      });
    }

    if (oneHourBefore > new Date()) {
      await this.reminderRepository.create({
        bookingId,
        type: REMINDER_TYPE.EMAIL_1H,
        scheduledAt: oneHourBefore,
        status: REMINDER_STATUS.PENDING,
      });
    }
  }
}