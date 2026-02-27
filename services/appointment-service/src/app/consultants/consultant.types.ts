import { PaginationMeta } from '../../shared/pagination';

export interface CreateConsultantDto {
  name: string;
  email: string;
  phone?: string;
  bio?: string;
  avatar?: string;
  specializations?: string[];
  showroomId?: string;
}

export interface UpdateConsultantDto {
  name?: string;
  email?: string;
  phone?: string | null;
  bio?: string | null;
  avatar?: string | null;
  specializations?: string[];
  showroomId?: string | null;
  isActive?: boolean;
}

export interface ConsultantQueryDto {
  page?: number;
  limit?: number;
  isActive?: boolean;
  showroomId?: string;
  specialization?: string;
  status?: string;
  from?: string;
  to?: string;
  search?: string;
}

export interface ShowroomSummary {
  id: string;
  name: string;
  address: string;
  phone?: string;
  email?: string;
}

export interface ConsultantResponse {
  id: string;
  name: string;
  email: string;
  phone?: string;
  bio?: string;
  avatar?: string;
  specializations: string[];
  showroomId?: string;
  isActive: boolean;
  showroom?: ShowroomSummary;
  availability?: unknown;
  createdAt: Date;
  updatedAt: Date;
}

export interface PaginatedConsultantResponse {
  data: ConsultantResponse[];
  meta: PaginationMeta;
}

export interface ConsultantStatsResponse {
  consultantId: string;
  totalBookings: number;
  confirmedBookings: number;
  cancelledBookings: number;
  completedBookings: number;
  pendingBookings: number;
  totalSlots: number;
  availableSlots: number;
  bookedSlots: number;
  bookingRate: number;
}

export interface ConsultantCreatedEvent {
  consultantId: string;
  name: string;
  email: string;
}

export interface ConsultantUpdatedEvent {
  consultantId: string;
  changes: Partial<UpdateConsultantDto>;
}

export interface ConsultantDeletedEvent {
  consultantId: string;
}

export interface ConsultantActivatedEvent {
  consultantId: string;
}

export interface ConsultantDeactivatedEvent {
  consultantId: string;
}

export interface ConsultantWithStats extends ConsultantResponse {
  stats: ConsultantStatsResponse;
}