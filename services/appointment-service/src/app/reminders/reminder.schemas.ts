import { z } from 'zod';
import { REMINDER_TYPE, REMINDER_STATUS, REMINDER_CHANNEL } from './reminder.constants';

export const CreateReminderSchema = z.object({
  bookingId: z.string().uuid({ message: 'Invalid booking ID' }),
  type: z.nativeEnum(REMINDER_TYPE, {
    errorMap: () => ({ message: 'Invalid reminder type' }),
  }),
  scheduledAt: z.coerce.date({ required_error: 'Scheduled date is required' }).refine(
    (date) => date > new Date(),
    { message: 'Scheduled date must be in the future' },
  ),
  channel: z.nativeEnum(REMINDER_CHANNEL, {
    errorMap: () => ({ message: 'Invalid reminder channel' }),
  }).default(REMINDER_CHANNEL.EMAIL),
  message: z
    .string()
    .max(1000, { message: 'Message must not exceed 1000 characters' })
    .optional(),
});

export const UpdateReminderSchema = z.object({
  type: z.nativeEnum(REMINDER_TYPE, {
    errorMap: () => ({ message: 'Invalid reminder type' }),
  }).optional(),
  scheduledAt: z.coerce.date().refine(
    (date) => date > new Date(),
    { message: 'Scheduled date must be in the future' },
  ).optional(),
  channel: z.nativeEnum(REMINDER_CHANNEL, {
    errorMap: () => ({ message: 'Invalid reminder channel' }),
  }).optional(),
  message: z
    .string()
    .max(1000, { message: 'Message must not exceed 1000 characters' })
    .nullable()
    .optional(),
}).refine(
  (data) => Object.keys(data).length > 0,
  { message: 'At least one field must be provided for update' },
);

export const RescheduleReminderSchema = z.object({
  scheduledAt: z.coerce.date({ required_error: 'Scheduled date is required' }).refine(
    (date) => date > new Date(),
    { message: 'Scheduled date must be in the future' },
  ),
});

export const ReminderQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),
  status: z.nativeEnum(REMINDER_STATUS, {
    errorMap: () => ({ message: 'Invalid reminder status' }),
  }).optional(),
  type: z.nativeEnum(REMINDER_TYPE, {
    errorMap: () => ({ message: 'Invalid reminder type' }),
  }).optional(),
  channel: z.nativeEnum(REMINDER_CHANNEL, {
    errorMap: () => ({ message: 'Invalid reminder channel' }),
  }).optional(),
  bookingId: z.string().uuid({ message: 'Invalid booking ID' }).optional(),
  from: z.string().datetime({ message: 'Invalid from date format' }).optional(),
  to: z.string().datetime({ message: 'Invalid to date format' }).optional(),
}).refine(
  (data) => {
    if (data.from && data.to) {
      return new Date(data.from) <= new Date(data.to);
    }
    return true;
  },
  {
    message: 'From date must be before or equal to to date',
    path: ['from'],
  },
);

export type CreateReminderDto = z.infer<typeof CreateReminderSchema>;
export type UpdateReminderDto = z.infer<typeof UpdateReminderSchema>;
export type RescheduleReminderDto = z.infer<typeof RescheduleReminderSchema>;
export type ReminderQueryDto = z.infer<typeof ReminderQuerySchema>;