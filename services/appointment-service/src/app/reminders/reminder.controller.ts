import { Request, Response, NextFunction } from 'express';
import { ReminderService } from './reminder.service';
import {
  CreateReminderSchema,
  UpdateReminderSchema,
  ReminderQuerySchema,
} from './reminder.schemas';
import { successResponse, paginatedResponse } from '../../shared/utils';
import { HTTP_STATUS } from '../../shared/constants';

export class ReminderController {
  constructor(private readonly reminderService: ReminderService) {}

  async createReminder(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const validated = CreateReminderSchema.parse(req.body);
      const reminder = await this.reminderService.createReminder(validated);
      res.status(HTTP_STATUS.CREATED).json(successResponse(reminder, 'Reminder created successfully'));
    } catch (error) {
      next(error);
    }
  }

  async getReminderById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const reminder = await this.reminderService.getReminderById(req.params.id);
      res.status(HTTP_STATUS.OK).json(successResponse(reminder));
    } catch (error) {
      next(error);
    }
  }

  async getAllReminders(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const query = ReminderQuerySchema.parse(req.query);
      const result = await this.reminderService.getAllReminders(query);
      res.status(HTTP_STATUS.OK).json(paginatedResponse(result.data, result.meta));
    } catch (error) {
      next(error);
    }
  }

  async getRemindersByBooking(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const reminders = await this.reminderService.getRemindersByBooking(req.params.bookingId);
      res.status(HTTP_STATUS.OK).json(successResponse(reminders));
    } catch (error) {
      next(error);
    }
  }

  async updateReminder(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const validated = UpdateReminderSchema.parse(req.body);
      const reminder = await this.reminderService.updateReminder(req.params.id, validated);
      res.status(HTTP_STATUS.OK).json(successResponse(reminder, 'Reminder updated successfully'));
    } catch (error) {
      next(error);
    }
  }

  async deleteReminder(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      await this.reminderService.deleteReminder(req.params.id);
      res.status(HTTP_STATUS.NO_CONTENT).send();
    } catch (error) {
      next(error);
    }
  }

  async sendReminder(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const reminder = await this.reminderService.sendReminder(req.params.id);
      res.status(HTTP_STATUS.OK).json(successResponse(reminder, 'Reminder sent successfully'));
    } catch (error) {
      next(error);
    }
  }

  async cancelReminder(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const reminder = await this.reminderService.cancelReminder(req.params.id);
      res.status(HTTP_STATUS.OK).json(successResponse(reminder, 'Reminder cancelled successfully'));
    } catch (error) {
      next(error);
    }
  }

  async rescheduleReminder(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { scheduledAt } = req.body;
      const reminder = await this.reminderService.rescheduleReminder(req.params.id, new Date(scheduledAt));
      res.status(HTTP_STATUS.OK).json(successResponse(reminder, 'Reminder rescheduled successfully'));
    } catch (error) {
      next(error);
    }
  }

  async getPendingReminders(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const reminders = await this.reminderService.getPendingReminders();
      res.status(HTTP_STATUS.OK).json(successResponse(reminders));
    } catch (error) {
      next(error);
    }
  }

  async processReminders(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await this.reminderService.processReminders();
      res.status(HTTP_STATUS.OK).json(successResponse(result, 'Reminders processed successfully'));
    } catch (error) {
      next(error);
    }
  }
}