import { APPOINTMENT_TYPE, BOOKING_STATUS } from './booking.constants';
import { PaginationMeta } from '../../shared/pagination';

export interface CreateBookingDto {
  slotId: string;
  consultantId?: string;
  appointmentType: APPOINTMENT_TYPE;
  includesKitchen: boolean;
  includesBedroom: boolean;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  postcode: string;
  address: string;
  scheduledAt: Date;
  notes?: string;
}

export interface UpdateBookingDto {
  consultantId?: string;
  appointmentType?: APPOINTMENT_TYPE;
  includesKitchen?: boolean;
  includesBedroom?: boolean;
  customerName?: string;
  customerEmail?: string;
  customerPhone?: string;
  postcode?: string;
  address?: string;
  notes?: string;
  status?: BOOKING_STATUS;
  slotId?: string;
  scheduledAt?: Date;
}

export interface BookingQueryDto {
  page?: number;
  limit?: number;
  status?: BOOKING_STATUS;
  appointmentType?: APPOINTMENT_TYPE;
  consultantId?: string;
  from?: string;
  to?: string;
  search?: string;
}

export interface SlotResponse {
  id: string;
  startTime: Date;
  endTime: Date;
  isAvailable: boolean;
  consultantId: string;
}

export interface ConsultantSummary {
  id: string;
  name: string;
  email: string;
  phone?: string;
}

export interface BookingResponse {
  id: string;
  customerId: string;
  slotId: string;
  consultantId?: string;
  appointmentType: APPOINTMENT_TYPE;
  includesKitchen: boolean;
  includesBedroom: boolean;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  postcode: string;
  address: string;
  scheduledAt: Date;
  status: BOOKING_STATUS;
  notes?: string;
  reminderSentAt?: Date;
  slot?: SlotResponse;
  consultant?: ConsultantSummary;
  createdAt: Date;
  updatedAt: Date;
}

export interface PaginatedBookingResponse {
  data: BookingResponse[];
  meta: PaginationMeta;
}

export interface BookingConfirmationPayload {
  to: string;
  customerName: string;
  bookingId: string;
  appointmentType: APPOINTMENT_TYPE;
  scheduledAt: Date;
}

export interface InternalBookingAlertPayload {
  bookingId: string;
  customerName: string;
  appointmentType: APPOINTMENT_TYPE;
  includesKitchen: boolean;
  includesBedroom: boolean;
}

export interface BookingCreatedEvent {
  bookingId: string;
  customerId: string;
  appointmentType: APPOINTMENT_TYPE;
  scheduledAt: Date;
}

export interface BookingCancelledEvent {
  bookingId: string;
  customerId: string;
  scheduledAt: Date;
}

export interface BookingRescheduledEvent {
  bookingId: string;
  customerId: string;
  newSlotId: string;
  scheduledAt: Date;
}