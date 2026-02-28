import type { PaginationParams } from "./api.types";

export type AppointmentType = "home" | "online" | "showroom";

export type AppointmentStatus =
  | "pending"
  | "confirmed"
  | "cancelled"
  | "completed"
  | "no_show";

export type Appointment = {
  id: string;
  type: AppointmentType;
  forKitchen: boolean;
  forBedroom: boolean;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  postcode: string;
  address: string;
  slot: string;
  status: AppointmentStatus;
  consultantId?: string;
  consultantName?: string;
  showroomId?: string;
  showroomName?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
};

export type TimeSlot = {
  id: string;
  time: string;
  date: string;
  available: boolean;
  consultantId?: string;
};

export type Availability = {
  id: string;
  consultantId: string;
  consultantName?: string;
  date: string;
  slots: string[];
  blockedDates: string[];
  createdAt: string;
  updatedAt: string;
};

export type Consultant = {
  id: string;
  name: string;
  email: string;
  phone?: string;
  speciality: "kitchen" | "bedroom" | "both";
  avatar?: string;
  showroomId?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

export type Reminder = {
  id: string;
  appointmentId: string;
  type: "email" | "sms";
  scheduledFor: string;
  sentAt?: string;
  status: "scheduled" | "sent" | "failed";
  createdAt: string;
  updatedAt: string;
};

export type CreateAppointmentPayload = {
  type: AppointmentType;
  forKitchen: boolean;
  forBedroom: boolean;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  postcode: string;
  address: string;
  slot: string;
  consultantId?: string;
  showroomId?: string;
  notes?: string;
};

export type UpdateAppointmentPayload = Partial<CreateAppointmentPayload> & {
  status?: AppointmentStatus;
};

export type CreateConsultantPayload = {
  name: string;
  email: string;
  phone?: string;
  speciality: "kitchen" | "bedroom" | "both";
  showroomId?: string;
  isActive?: boolean;
};

export type SetAvailabilityPayload = {
  consultantId: string;
  date: string;
  slots: string[];
};

export type BlockDatesPayload = {
  dates: string[];
};

export type AppointmentFilterParams = PaginationParams & {
  search?: string;
  type?: AppointmentType;
  status?: AppointmentStatus;
  consultantId?: string;
  forKitchen?: boolean;
  forBedroom?: boolean;
  startDate?: string;
  endDate?: string;
};

export type ConsultantFilterParams = PaginationParams & {
  search?: string;
  speciality?: "kitchen" | "bedroom" | "both";
  isActive?: boolean;
  showroomId?: string;
};