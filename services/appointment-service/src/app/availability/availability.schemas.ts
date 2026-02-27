import { z } from 'zod';
import { DayOfWeek } from '@prisma/client';

export const CreateAvailabilitySchema = z.object({
  consultantId: z.string().uuid({ message: 'Invalid consultant ID' }),
  dayOfWeek: z.nativeEnum(DayOfWeek),
  startTime: z.string().datetime({ message: 'Invalid start time format' }),
  endTime: z.string().datetime({ message: 'Invalid end time format' }),
  isRecurring: z.boolean().optional(),
  specificDate: z.string().datetime().optional(),
  isBlocked: z.boolean().optional(),
  blockReason: z.string().optional(),
}).refine(
  (data) => new Date(data.startTime) < new Date(data.endTime),
  {
    message: 'Start time must be before end time',
    path: ['startTime'],
  },
);

export const UpdateAvailabilitySchema = z.object({
  dayOfWeek: z.nativeEnum(DayOfWeek).optional(),
  startTime: z.string().datetime({ message: 'Invalid start time format' }).optional(),
  endTime: z.string().datetime({ message: 'Invalid end time format' }).optional(),
  isRecurring: z.boolean().optional(),
  specificDate: z.string().datetime().optional(),
  isBlocked: z.boolean().optional(),
  blockReason: z.string().optional(),
}).refine(
  (data) => Object.keys(data).length > 0,
  { message: 'At least one field must be provided for update' },
).refine(
  (data) => {
    if (data.startTime && data.endTime) {
      return new Date(data.startTime) < new Date(data.endTime);
    }
    return true;
  },
  {
    message: 'Start time must be before end time',
    path: ['startTime'],
  },
);

export const CreateSlotSchema = z.object({
  date: z.string().datetime({ message: 'Invalid date format' }),
  consultantId: z.string().uuid({ message: 'Invalid consultant ID' }),
  showroomId: z.string().uuid({ message: 'Invalid showroom ID' }).optional(),
  startTime: z.string().datetime({ message: 'Invalid start time format' }),
  endTime: z.string().datetime({ message: 'Invalid end time format' }),
  duration: z.number().int().min(15).max(480).optional(),
  maxBookings: z.number().int().min(1).optional(),
}).refine(
  (data) => new Date(data.startTime) < new Date(data.endTime),
  {
    message: 'Start time must be before end time',
    path: ['startTime'],
  },
);

export const UpdateSlotSchema = z.object({
  startTime: z.string().datetime({ message: 'Invalid start time format' }).optional(),
  endTime: z.string().datetime({ message: 'Invalid end time format' }).optional(),
  isAvailable: z.boolean().optional(),
  isBlocked: z.boolean().optional(),
  blockReason: z.string().optional(),
  duration: z.number().int().min(15).max(480).optional(),
  maxBookings: z.number().int().min(1).optional(),
}).refine(
  (data) => Object.keys(data).length > 0,
  { message: 'At least one field must be provided for update' },
).refine(
  (data) => {
    if (data.startTime && data.endTime) {
      return new Date(data.startTime) < new Date(data.endTime);
    }
    return true;
  },
  {
    message: 'Start time must be before end time',
    path: ['startTime'],
  },
);

export const AvailabilityQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),
  consultantId: z.string().uuid({ message: 'Invalid consultant ID' }).optional(),
  from: z.string().datetime({ message: 'Invalid from date format' }).optional(),
  to: z.string().datetime({ message: 'Invalid to date format' }).optional(),
  isAvailable: z.coerce.boolean().optional(),
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