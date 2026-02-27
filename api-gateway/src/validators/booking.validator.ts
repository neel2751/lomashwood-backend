import { z } from 'zod';

export const createBookingSchema = z.object({
  body: z.object({
    appointmentType: z.enum(['HOME_MEASUREMENT', 'ONLINE', 'SHOWROOM'], {
      errorMap: () => ({ message: 'Invalid appointment type' }),
    }),
    serviceType: z.object({
      kitchen: z.boolean(),
      bedroom: z.boolean(),
    }).refine(data => data.kitchen || data.bedroom, {
      message: 'At least one service type (kitchen or bedroom) must be selected',
    }),
    customerDetails: z.object({
      name: z.string().min(2, 'Name must be at least 2 characters'),
      phone: z.string().regex(/^\+?[1-9]\d{1,14}$/, 'Invalid phone number format'),
      email: z.string().email('Invalid email format'),
      postcode: z.string().min(3, 'Postcode is required'),
      address: z.string().min(5, 'Address must be at least 5 characters'),
    }),
    slotBooking: z.object({
      date: z.string().datetime('Invalid date format'),
      timeSlot: z.string().min(1, 'Time slot is required'),
    }),
    showroomId: z.string().uuid('Invalid showroom ID').optional(),
    notes: z.string().max(500, 'Notes cannot exceed 500 characters').optional(),
    preferredConsultantId: z.string().uuid('Invalid consultant ID').optional(),
  }),
});

export const getBookingsSchema = z.object({
  query: z.object({
    status: z.enum(['PENDING', 'CONFIRMED', 'COMPLETED', 'CANCELLED', 'RESCHEDULED']).optional(),
    appointmentType: z.enum(['HOME_MEASUREMENT', 'ONLINE', 'SHOWROOM']).optional(),
    startDate: z.string().datetime().optional(),
    endDate: z.string().datetime().optional(),
    page: z.string().regex(/^\d+$/).transform(Number).optional(),
    limit: z.string().regex(/^\d+$/).transform(Number).optional(),
    search: z.string().optional(),
    showroomId: z.string().uuid('Invalid showroom ID').optional(),
    consultantId: z.string().uuid('Invalid consultant ID').optional(),
  }),
});

export const getBookingByIdSchema = z.object({
  params: z.object({
    id: z.string().uuid('Invalid booking ID'),
  }),
});

export const updateBookingStatusSchema = z.object({
  params: z.object({
    id: z.string().uuid('Invalid booking ID'),
  }),
  body: z.object({
    status: z.enum(['PENDING', 'CONFIRMED', 'COMPLETED', 'CANCELLED', 'RESCHEDULED']),
    notes: z.string().max(500, 'Notes cannot exceed 500 characters').optional(),
  }),
});

export const rescheduleBookingSchema = z.object({
  params: z.object({
    id: z.string().uuid('Invalid booking ID'),
  }),
  body: z.object({
    newDate: z.string().datetime('Invalid date format'),
    newTimeSlot: z.string().min(1, 'Time slot is required'),
    reason: z.string().min(10, 'Reason must be at least 10 characters').max(500, 'Reason cannot exceed 500 characters'),
  }),
});

export const cancelBookingSchema = z.object({
  params: z.object({
    id: z.string().uuid('Invalid booking ID'),
  }),
  body: z.object({
    reason: z.string().min(10, 'Cancellation reason must be at least 10 characters').max(500, 'Reason cannot exceed 500 characters'),
  }),
});

export const getAvailableSlotsSchema = z.object({
  query: z.object({
    appointmentType: z.enum(['HOME_MEASUREMENT', 'ONLINE', 'SHOWROOM']),
    date: z.string().datetime('Invalid date format'),
    showroomId: z.string().uuid('Invalid showroom ID').optional(),
    consultantId: z.string().uuid('Invalid consultant ID').optional(),
  }),
});

export const assignConsultantSchema = z.object({
  params: z.object({
    id: z.string().uuid('Invalid booking ID'),
  }),
  body: z.object({
    consultantId: z.string().uuid('Invalid consultant ID'),
    notes: z.string().max(500, 'Notes cannot exceed 500 characters').optional(),
  }),
});

export const addBookingNoteSchema = z.object({
  params: z.object({
    id: z.string().uuid('Invalid booking ID'),
  }),
  body: z.object({
    note: z.string().min(5, 'Note must be at least 5 characters').max(500, 'Note cannot exceed 500 characters'),
    isInternal: z.boolean().optional(),
  }),
});

export const sendBookingReminderSchema = z.object({
  params: z.object({
    id: z.string().uuid('Invalid booking ID'),
  }),
});

export const getBookingsByDateRangeSchema = z.object({
  query: z.object({
    startDate: z.string().datetime('Invalid start date format'),
    endDate: z.string().datetime('Invalid end date format'),
    appointmentType: z.enum(['HOME_MEASUREMENT', 'ONLINE', 'SHOWROOM']).optional(),
    showroomId: z.string().uuid('Invalid showroom ID').optional(),
  }),
});

export const bulkUpdateBookingsSchema = z.object({
  body: z.object({
    bookingIds: z.array(z.string().uuid('Invalid booking ID')).min(1, 'At least one booking ID is required'),
    updates: z.object({
      status: z.enum(['PENDING', 'CONFIRMED', 'COMPLETED', 'CANCELLED', 'RESCHEDULED']).optional(),
      consultantId: z.string().uuid('Invalid consultant ID').optional(),
    }),
  }),
});

export type CreateBookingInput = z.infer<typeof createBookingSchema>['body'];
export type GetBookingsInput = z.infer<typeof getBookingsSchema>['query'];
export type GetBookingByIdInput = z.infer<typeof getBookingByIdSchema>['params'];
export type UpdateBookingStatusInput = z.infer<typeof updateBookingStatusSchema>;
export type RescheduleBookingInput = z.infer<typeof rescheduleBookingSchema>;
export type CancelBookingInput = z.infer<typeof cancelBookingSchema>;
export type GetAvailableSlotsInput = z.infer<typeof getAvailableSlotsSchema>['query'];
export type AssignConsultantInput = z.infer<typeof assignConsultantSchema>;
export type AddBookingNoteInput = z.infer<typeof addBookingNoteSchema>;
export type SendBookingReminderInput = z.infer<typeof sendBookingReminderSchema>['params'];
export type GetBookingsByDateRangeInput = z.infer<typeof getBookingsByDateRangeSchema>['query'];
export type BulkUpdateBookingsInput = z.infer<typeof bulkUpdateBookingsSchema>['body'];