import { z } from 'zod';

// Appointment schema
export const AppointmentSchema = z.object({
  id: z.string(),
  customerId: z.string(),
  consultantId: z.string().optional(),
  showroomId: z.string().optional(),
  type: z.enum(['home', 'virtual', 'showroom']),
  serviceType: z.enum(['kitchen', 'bedroom', 'both']),
  status: z.enum(['pending', 'confirmed', 'in-progress', 'completed', 'cancelled']),
  customerDetails: z.object({
    name: z.string(),
    email: z.string().email(),
    phone: z.string(),
    postcode: z.string(),
    address: z.string().optional(),
  }),
  scheduledDate: z.string().datetime(),
  scheduledTime: z.string(),
  duration: z.number(),
  notes: z.string().optional(),
  reminderSent: z.boolean(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export type Appointment = z.infer<typeof AppointmentSchema>;

export const CreateAppointmentSchema = z.object({
  type: z.enum(['home', 'virtual', 'showroom']),
  serviceType: z.enum(['kitchen', 'bedroom', 'both']),
  showroomId: z.string().optional(),
  customerDetails: z.object({
    name: z.string(),
    email: z.string().email(),
    phone: z.string(),
    postcode: z.string(),
    address: z.string().optional(),
  }),
  scheduledDate: z.string().datetime(),
  scheduledTime: z.string(),
  notes: z.string().optional(),
});

export type CreateAppointmentRequest = z.infer<typeof CreateAppointmentSchema>;

export const UpdateAppointmentSchema = z.object({
  consultantId: z.string().optional(),
  status: z.enum(['pending', 'confirmed', 'in-progress', 'completed', 'cancelled']).optional(),
  scheduledDate: z.string().datetime().optional(),
  scheduledTime: z.string().optional(),
  notes: z.string().optional(),
  reminderSent: z.boolean().optional(),
});

export type UpdateAppointmentRequest = z.infer<typeof UpdateAppointmentSchema>;

export const FilterAppointmentSchema = z.object({
  customerId: z.string().optional(),
  consultantId: z.string().optional(),
  showroomId: z.string().optional(),
  type: z.enum(['home', 'virtual', 'showroom']).optional(),
  serviceType: z.enum(['kitchen', 'bedroom', 'both']).optional(),
  status: z.enum(['pending', 'confirmed', 'in-progress', 'completed', 'cancelled']).optional(),
  dateFrom: z.string().datetime().optional(),
  dateTo: z.string().datetime().optional(),
  page: z.number().optional(),
  limit: z.number().optional(),
});

export type FilterAppointmentRequest = z.infer<typeof FilterAppointmentSchema>;

// Availability schema
export const AvailabilitySchema = z.object({
  id: z.string(),
  consultantId: z.string(),
  date: z.string().datetime(),
  timeSlots: z.array(z.object({
    time: z.string(),
    available: z.boolean(),
    appointmentId: z.string().optional(),
  })),
  isWorkingDay: z.boolean(),
  startTime: z.string(),
  endTime: z.string(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export type Availability = z.infer<typeof AvailabilitySchema>;

export const CheckAvailabilitySchema = z.object({
  date: z.string().datetime(),
  appointmentType: z.enum(['showroom', 'home', 'virtual']),
  showroomId: z.string().optional(),
  serviceType: z.enum(['kitchen', 'bedroom', 'both']).optional(),
});

export type CheckAvailabilityRequest = z.infer<typeof CheckAvailabilitySchema>;

export const SetAvailabilitySchema = z.object({
  consultantId: z.string(),
  date: z.string().datetime(),
  timeSlots: z.array(z.object({
    time: z.string(),
    available: z.boolean(),
  })),
  isWorkingDay: z.boolean(),
  startTime: z.string(),
  endTime: z.string(),
});

export type SetAvailabilityRequest = z.infer<typeof SetAvailabilitySchema>;

// Time slot schema
export const TimeSlotSchema = z.object({
  id: z.string(),
  time: z.string(),
  label: z.string(),
  isActive: z.boolean(),
  sortOrder: z.number(),
});

export type TimeSlot = z.infer<typeof TimeSlotSchema>;

// Consultant schema
export const ConsultantSchema = z.object({
  id: z.string(),
  userId: z.string(),
  name: z.string(),
  email: z.string().email(),
  phone: z.string(),
  specializations: z.array(z.enum(['kitchen', 'bedroom', 'both'])),
  bio: z.string().optional(),
  avatar: z.string().optional(),
  isActive: z.boolean(),
  rating: z.number().optional(),
  reviewCount: z.number().optional(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export type Consultant = z.infer<typeof ConsultantSchema>;

export const CreateConsultantSchema = z.object({
  userId: z.string(),
  name: z.string(),
  email: z.string().email(),
  phone: z.string(),
  specializations: z.array(z.enum(['kitchen', 'bedroom', 'both'])),
  bio: z.string().optional(),
  avatar: z.string().optional(),
});

export type CreateConsultantRequest = z.infer<typeof CreateConsultantSchema>;

export const UpdateConsultantSchema = z.object({
  name: z.string().optional(),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  specializations: z.array(z.enum(['kitchen', 'bedroom', 'both'])).optional(),
  bio: z.string().optional(),
  avatar: z.string().optional(),
  isActive: z.boolean().optional(),
});

export type UpdateConsultantRequest = z.infer<typeof UpdateConsultantSchema>;

// Reminder schema
export const ReminderSchema = z.object({
  id: z.string(),
  appointmentId: z.string(),
  customerId: z.string(),
  type: z.enum(['email', 'sms', 'push']),
  scheduledAt: z.string().datetime(),
  sentAt: z.string().datetime().optional(),
  status: z.enum(['pending', 'sent', 'failed']),
  content: z.string(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export type Reminder = z.infer<typeof ReminderSchema>;

export const CreateReminderSchema = z.object({
  appointmentId: z.string(),
  type: z.enum(['email', 'sms', 'push']),
  scheduledAt: z.string().datetime(),
  content: z.string(),
});

export type CreateReminderRequest = z.infer<typeof CreateReminderSchema>;
