import {
  AppointmentType,
  BookingStatus,
  ConsultantSpecialisation,
  ReminderChannel,
  ReminderStatus,
  ReminderType,
  SlotStatus,
} from './constants';

export interface BaseEntity {
  id: string;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
}

export interface CustomerDetails {
  customerId: string;
  name: string;
  email: string;
  phone: string;
  postcode: string;
  address: string;
}

export interface BookingEntity extends BaseEntity {
  customerId: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  customerPostcode: string;
  customerAddress: string;
  appointmentType: AppointmentType;
  isKitchen: boolean;
  isBedroom: boolean;
  slotId: string;
  slotDate: Date;
  slotStartTime: string;
  slotEndTime: string;
  consultantId: string | null;
  showroomId: string | null;
  status: BookingStatus;
  cancellationReason: string | null;
  rescheduledFromId: string | null;
  notes: string | null;
  confirmationEmailSentAt: Date | null;
  internalNotificationSentAt: Date | null;
}

export interface ConsultantEntity extends BaseEntity {
  name: string;
  email: string;
  phone: string;
  specialisation: ConsultantSpecialisation;
  showroomId: string | null;
  isActive: boolean;
  bio: string | null;
  avatarUrl: string | null;
}

export interface AvailabilityEntity extends BaseEntity {
  consultantId: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  isActive: boolean;
}

export interface SlotEntity extends BaseEntity {
  consultantId: string;
  date: Date;
  startTime: string;
  endTime: string;
  status: SlotStatus;
  bookingId: string | null;
  showroomId: string | null;
}

export interface ReminderEntity extends BaseEntity {
  bookingId: string;
  customerId: string;
  reminderType: ReminderType;
  channel: ReminderChannel;
  status: ReminderStatus;
  scheduledAt: Date;
  sentAt: Date | null;
  deliveredAt: Date | null;
  failedAt: Date | null;
  failureReason: string | null;
  retryCount: number;
}

export interface ShowroomEntity extends BaseEntity {
  name: string;
  address: string;
  imageUrl: string | null;
  email: string;
  phone: string;
  openingHours: string;
  mapLink: string;
  isActive: boolean;
}

export interface BookingFilters {
  customerId?: string;
  consultantId?: string;
  showroomId?: string;
  appointmentType?: AppointmentType;
  status?: BookingStatus;
  isKitchen?: boolean;
  isBedroom?: boolean;
  dateFrom?: Date;
  dateTo?: Date;
}

export interface ConsultantFilters {
  specialisation?: ConsultantSpecialisation;
  showroomId?: string;
  isActive?: boolean;
}

export interface SlotFilters {
  consultantId?: string;
  showroomId?: string;
  status?: SlotStatus;
  dateFrom?: Date;
  dateTo?: Date;
}

export interface ReminderFilters {
  bookingId?: string;
  customerId?: string;
  reminderType?: ReminderType;
  channel?: ReminderChannel;
  status?: ReminderStatus;
  scheduledFrom?: Date;
  scheduledTo?: Date;
}

export interface CreateBookingInput {
  customerId: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  customerPostcode: string;
  customerAddress: string;
  appointmentType: AppointmentType;
  isKitchen: boolean;
  isBedroom: boolean;
  slotId: string;
  consultantId?: string;
  showroomId?: string;
  notes?: string;
}

export interface UpdateBookingInput {
  status?: BookingStatus;
  cancellationReason?: string;
  notes?: string;
  slotId?: string;
  consultantId?: string;
}

export interface CreateConsultantInput {
  name: string;
  email: string;
  phone: string;
  specialisation: ConsultantSpecialisation;
  showroomId?: string;
  bio?: string;
  avatarUrl?: string;
}

export interface UpdateConsultantInput {
  name?: string;
  email?: string;
  phone?: string;
  specialisation?: ConsultantSpecialisation;
  showroomId?: string | null;
  isActive?: boolean;
  bio?: string;
  avatarUrl?: string;
}

export interface CreateAvailabilityInput {
  consultantId: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
}

export interface CreateSlotInput {
  consultantId: string;
  date: Date;
  startTime: string;
  endTime: string;
  showroomId?: string;
}

export interface CreateReminderInput {
  bookingId: string;
  customerId: string;
  reminderType: ReminderType;
  channel: ReminderChannel;
  scheduledAt: Date;
}

export interface ServiceResponse<T> {
  data: T;
  message: string;
  success: boolean;
}

export interface AuthenticatedRequest {
  userId: string;
  email: string;
  role: string;
}