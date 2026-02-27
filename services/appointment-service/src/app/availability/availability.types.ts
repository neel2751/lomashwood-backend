import { DayOfWeek } from '@prisma/client';
import { PaginationMeta } from '../../shared/pagination';

export interface CreateAvailabilityDto {
  consultantId: string;
  dayOfWeek: DayOfWeek;
  startTime: string;
  endTime: string;
  isRecurring?: boolean;
  specificDate?: string;
  isBlocked?: boolean;
  blockReason?: string;
}

export interface UpdateAvailabilityDto {
  dayOfWeek?: DayOfWeek;
  startTime?: string;
  endTime?: string;
  isRecurring?: boolean;
  specificDate?: string;
  isBlocked?: boolean;
  blockReason?: string;
}

export interface AvailabilityQueryDto {
  page?: number;
  limit?: number;
  consultantId?: string;
  from?: string;
  to?: string;
  isAvailable?: boolean;
}

export interface CreateSlotDto {
  date: string;
  consultantId: string;
  showroomId?: string;
  startTime: string;
  endTime: string;
  duration?: number;
  maxBookings?: number;
}

export interface UpdateSlotDto {
  startTime?: string;
  endTime?: string;
  isAvailable?: boolean;
  isBlocked?: boolean;
  blockReason?: string;
  duration?: number;
  maxBookings?: number;
}

export interface SlotResponse {
  id: string;
  date: Date;
  consultantId: string | null;
  showroomId: string | null;
  startTime: string;
  endTime: string;
  isAvailable: boolean;
  isBlocked: boolean;
  blockReason: string | null;
  duration: number;
  maxBookings: number;
  currentBookings: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface ConsultantSummary {
  id: string;
  name: string;
  email: string;
  phone?: string;
}

export interface AvailabilityResponse {
  id: string;
  consultantId: string;
  dayOfWeek: DayOfWeek;
  startTime: string;
  endTime: string;
  isRecurring: boolean;
  specificDate: Date | null;
  isBlocked: boolean;
  blockReason: string | null;
  consultant?: ConsultantSummary;
  createdAt: Date;
  updatedAt: Date;
}

export interface PaginatedAvailabilityResponse {
  data: AvailabilityResponse[];
  meta: PaginationMeta;
}

export interface AvailabilityConflictPayload {
  consultantId: string;
  dayOfWeek: DayOfWeek;
  startTime: string;
  endTime: string;
}

export interface SlotGenerationPayload {
  consultantId: string;
  date: string;
  startTime: string;
  endTime: string;
  slotDurationMinutes: number;
}

export interface AvailabilityCreatedEvent {
  availabilityId: string;
  consultantId: string;
  dayOfWeek: DayOfWeek;
  startTime: string;
  endTime: string;
}

export interface AvailabilityUpdatedEvent {
  availabilityId: string;
  consultantId: string;
}

export interface SlotBookedEvent {
  slotId: string;
  consultantId: string | null;
  startTime: string;
  endTime: string;
}

export interface SlotReleasedEvent {
  slotId: string;
  consultantId: string | null;
  startTime: string;
  endTime: string;
}