import { z } from "zod";

export const AppointmentTypeEnum = z.enum([
  "HOME_MEASUREMENT",
  "ONLINE",
  "SHOWROOM",
]);

export const AppointmentStatusEnum = z.enum([
  "PENDING",
  "CONFIRMED",
  "CANCELLED",
  "COMPLETED",
  "NO_SHOW",
]);

export const BookingStep1Schema = z.object({
  appointmentType: AppointmentTypeEnum,
  showroomId: z.string().uuid().optional(),
});

export const BookingStep2Schema = z.object({
  forKitchen: z.boolean(),
  forBedroom: z.boolean(),
}).refine(
  (data) => data.forKitchen || data.forBedroom,
  { message: "At least one of Kitchen or Bedroom must be selected" }
);

export const CustomerDetailsSchema = z.object({
  firstName: z.string().min(2).max(50).trim(),
  lastName: z.string().min(2).max(50).trim(),
  email: z.string().email().toLowerCase().trim(),
  phone: z.string().regex(/^\+?[1-9]\d{7,14}$/),
  postcode: z.string().min(3).max(10).trim().toUpperCase(),
  addressLine1: z.string().min(5).max(255).trim(),
  addressLine2: z.string().max(255).trim().optional(),
  city: z.string().min(2).max(100).trim(),
  county: z.string().max(100).trim().optional(),
});

export const SlotBookingSchema = z.object({
  date: z.coerce.date().refine((d) => d > new Date(), {
    message: "Appointment date must be in the future",
  }),
  timeSlotId: z.string().uuid(),
  consultantId: z.string().uuid().optional(),
});

export const CreateBookingSchema = BookingStep1Schema
  .merge(BookingStep2Schema as any)
  .merge(CustomerDetailsSchema)
  .merge(SlotBookingSchema)
  .extend({
    notes: z.string().max(1000).optional(),
  });

export const UpdateBookingSchema = z.object({
  status: AppointmentStatusEnum.optional(),
  date: z.coerce.date().optional(),
  timeSlotId: z.string().uuid().optional(),
  consultantId: z.string().uuid().optional(),
  notes: z.string().max(1000).optional(),
  cancellationReason: z.string().max(500).optional(),
});

export const BookingFilterSchema = z.object({
  status: AppointmentStatusEnum.optional(),
  appointmentType: AppointmentTypeEnum.optional(),
  consultantId: z.string().uuid().optional(),
  showroomId: z.string().uuid().optional(),
  forKitchen: z.coerce.boolean().optional(),
  forBedroom: z.coerce.boolean().optional(),
  dateFrom: z.coerce.date().optional(),
  dateTo: z.coerce.date().optional(),
  search: z.string().max(255).optional(),
  page: z.coerce.number().int().positive().optional().default(1),
  limit: z.coerce.number().int().min(1).max(100).optional().default(20),
  sortBy: z
    .enum(["date_asc", "date_desc", "created_asc", "created_desc"])
    .optional()
    .default("date_asc"),
});

export const ConsultantSchema = z.object({
  firstName: z.string().min(2).max(50).trim(),
  lastName: z.string().min(2).max(50).trim(),
  email: z.string().email().toLowerCase().trim(),
  phone: z.string().regex(/^\+?[1-9]\d{7,14}$/).optional(),
  showroomId: z.string().uuid().optional().nullable(),
  specializations: z
    .array(z.enum(["KITCHEN", "BEDROOM", "BOTH"]))
    .optional()
    .default(["BOTH"]),
  isActive: z.boolean().optional().default(true),
  avatar: z.string().url().optional().nullable(),
  bio: z.string().max(1000).optional(),
});

export const ConsultantUpdateSchema = ConsultantSchema.partial();

export const AvailabilitySchema = z.object({
  consultantId: z.string().uuid(),
  dayOfWeek: z.number().int().min(0).max(6),
  startTime: z
    .string()
    .regex(/^([01]\d|2[0-3]):([0-5]\d)$/, "Time must be HH:MM format"),
  endTime: z
    .string()
    .regex(/^([01]\d|2[0-3]):([0-5]\d)$/, "Time must be HH:MM format"),
  slotDurationMinutes: z.number().int().min(15).max(240).default(60),
  isActive: z.boolean().optional().default(true),
});

export const AvailabilityQuerySchema = z.object({
  consultantId: z.string().uuid().optional(),
  showroomId: z.string().uuid().optional(),
  date: z.coerce.date(),
  appointmentType: AppointmentTypeEnum.optional(),
});

export const ReminderSchema = z.object({
  bookingId: z.string().uuid(),
  reminderType: z.enum(["EMAIL", "SMS", "PUSH"]),
  scheduledAt: z.coerce.date(),
  message: z.string().max(1000).optional(),
});

export type AppointmentTypeEnumType = z.infer<typeof AppointmentTypeEnum>;
export type AppointmentStatusEnumType = z.infer<typeof AppointmentStatusEnum>;
export type BookingStep1Input = z.infer<typeof BookingStep1Schema>;
export type BookingStep2Input = z.infer<typeof BookingStep2Schema>;
export type CustomerDetailsInput = z.infer<typeof CustomerDetailsSchema>;
export type SlotBookingInput = z.infer<typeof SlotBookingSchema>;
export type CreateBookingInput = z.infer<typeof CreateBookingSchema>;
export type UpdateBookingInput = z.infer<typeof UpdateBookingSchema>;
export type BookingFilterInput = z.infer<typeof BookingFilterSchema>;
export type ConsultantInput = z.infer<typeof ConsultantSchema>;
export type ConsultantUpdateInput = z.infer<typeof ConsultantUpdateSchema>;
export type AvailabilityInput = z.infer<typeof AvailabilitySchema>;
export type AvailabilityQueryInput = z.infer<typeof AvailabilityQuerySchema>;
export type ReminderInput = z.infer<typeof ReminderSchema>;