import { z } from 'zod';
import { APPOINTMENT_TYPE, BOOKING_STATUS } from './booking.constants';

export const CreateBookingSchema = z.object({
  slotId: z.string().uuid({ message: 'Invalid slot ID' }),
  consultantId: z.string().uuid({ message: 'Invalid consultant ID' }).optional(),
  appointmentType: z.nativeEnum(APPOINTMENT_TYPE, {
    errorMap: () => ({ message: 'Invalid appointment type' }),
  }),
  includesKitchen: z.boolean({ required_error: 'includesKitchen is required' }),
  includesBedroom: z.boolean({ required_error: 'includesBedroom is required' }),
  customerName: z
    .string()
    .min(2, { message: 'Customer name must be at least 2 characters' })
    .max(100, { message: 'Customer name must not exceed 100 characters' }),
  customerEmail: z
    .string()
    .email({ message: 'Invalid email address' })
    .max(255, { message: 'Email must not exceed 255 characters' }),
  customerPhone: z
    .string()
    .min(7, { message: 'Phone number must be at least 7 characters' })
    .max(20, { message: 'Phone number must not exceed 20 characters' }),
  postcode: z
    .string()
    .min(3, { message: 'Postcode must be at least 3 characters' })
    .max(10, { message: 'Postcode must not exceed 10 characters' }),
  address: z
    .string()
    .min(5, { message: 'Address must be at least 5 characters' })
    .max(500, { message: 'Address must not exceed 500 characters' }),
  scheduledAt: z.coerce.date({ required_error: 'Scheduled date is required' }),
  notes: z.string().max(1000, { message: 'Notes must not exceed 1000 characters' }).optional(),
}).refine(
  (data) => data.includesKitchen || data.includesBedroom,
  {
    message: 'Booking must include at least kitchen or bedroom',
    path: ['includesKitchen'],
  },
);

export const UpdateBookingSchema = z.object({
  consultantId: z.string().uuid({ message: 'Invalid consultant ID' }).optional(),
  appointmentType: z.nativeEnum(APPOINTMENT_TYPE, {
    errorMap: () => ({ message: 'Invalid appointment type' }),
  }).optional(),
  includesKitchen: z.boolean().optional(),
  includesBedroom: z.boolean().optional(),
  customerName: z
    .string()
    .min(2, { message: 'Customer name must be at least 2 characters' })
    .max(100, { message: 'Customer name must not exceed 100 characters' })
    .optional(),
  customerEmail: z
    .string()
    .email({ message: 'Invalid email address' })
    .max(255, { message: 'Email must not exceed 255 characters' })
    .optional(),
  customerPhone: z
    .string()
    .min(7, { message: 'Phone number must be at least 7 characters' })
    .max(20, { message: 'Phone number must not exceed 20 characters' })
    .optional(),
  postcode: z
    .string()
    .min(3, { message: 'Postcode must be at least 3 characters' })
    .max(10, { message: 'Postcode must not exceed 10 characters' })
    .optional(),
  address: z
    .string()
    .min(5, { message: 'Address must be at least 5 characters' })
    .max(500, { message: 'Address must not exceed 500 characters' })
    .optional(),
  notes: z.string().max(1000, { message: 'Notes must not exceed 1000 characters' }).optional(),
}).refine(
  (data) => Object.keys(data).length > 0,
  { message: 'At least one field must be provided for update' },
);

export const RescheduleBookingSchema = z.object({
  slotId: z.string().uuid({ message: 'Invalid slot ID' }),
});

export const BookingQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),
  status: z.nativeEnum(BOOKING_STATUS).optional(),
  appointmentType: z.nativeEnum(APPOINTMENT_TYPE).optional(),
  consultantId: z.string().uuid().optional(),
  from: z.string().datetime().optional(),
  to: z.string().datetime().optional(),
  search: z.string().max(100).optional(),
});

export type CreateBookingDto = z.infer<typeof CreateBookingSchema>;
export type UpdateBookingDto = z.infer<typeof UpdateBookingSchema>;
export type RescheduleBookingDto = z.infer<typeof RescheduleBookingSchema>;
export type BookingQueryDto = z.infer<typeof BookingQuerySchema>;