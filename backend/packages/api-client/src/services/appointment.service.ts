import { createAppointmentService } from '../utils/http';
import {
  Appointment,
  Availability,
  TimeSlot,
  Consultant,
  Reminder,
  CreateAppointmentRequest,
  UpdateAppointmentRequest,
  FilterAppointmentRequest,
  CheckAvailabilityRequest,
  SetAvailabilityRequest,
  CreateConsultantRequest,
  UpdateConsultantRequest,
  CreateReminderRequest,
} from '../types/appointment.types';
import { PaginatedResponse } from '../types/api.types';

class AppointmentService {
  private client = createAppointmentService();

  // Appointment endpoints
  async getAppointments(params?: FilterAppointmentRequest): Promise<PaginatedResponse<Appointment>> {
    return this.client.get<PaginatedResponse<Appointment>>('/appointments', params);
  }

  async getAppointmentById(id: string): Promise<Appointment> {
    return this.client.get<Appointment>(`/appointments/${id}`);
  }

  async createAppointment(appointmentData: CreateAppointmentRequest): Promise<Appointment> {
    return this.client.post<Appointment>('/appointments', appointmentData);
  }

  async updateAppointment(id: string, appointmentData: UpdateAppointmentRequest): Promise<Appointment> {
    return this.client.put<Appointment>(`/appointments/${id}`, appointmentData);
  }

  async deleteAppointment(id: string): Promise<void> {
    return this.client.delete<void>(`/appointments/${id}`);
  }

  async confirmAppointment(id: string): Promise<Appointment> {
    return this.client.patch<Appointment>(`/appointments/${id}/confirm`);
  }

  async cancelAppointment(id: string, reason?: string): Promise<Appointment> {
    return this.client.patch<Appointment>(`/appointments/${id}/cancel`, { reason });
  }

  async rescheduleAppointment(id: string, date: string, time: string): Promise<Appointment> {
    return this.client.patch<Appointment>(`/appointments/${id}/reschedule`, { date, time });
  }

  async getCustomerAppointments(customerId: string): Promise<Appointment[]> {
    return this.client.get<Appointment[]>(`/appointments/customer/${customerId}`);
  }

  async getConsultantAppointments(consultantId: string): Promise<Appointment[]> {
    return this.client.get<Appointment[]>(`/appointments/consultant/${consultantId}`);
  }

  // Availability endpoints
  async checkAvailability(request: CheckAvailabilityRequest): Promise<{
    date: string;
    available: boolean;
    slots: Array<{ time: string; label: string; available: boolean }>;
    operatingHours?: { open: string; close: string };
    nextAvailableDate?: string;
  }> {
    return this.client.post<any>('/availability/check', request);
  }

  async getAvailability(consultantId: string, dateFrom: string, dateTo: string): Promise<Availability[]> {
    return this.client.get<Availability[]>('/availability', {
      consultantId,
      dateFrom,
      dateTo,
    });
  }

  async setAvailability(request: SetAvailabilityRequest): Promise<Availability> {
    return this.client.post<Availability>('/availability', request);
  }

  async updateAvailability(id: string, availability: Partial<SetAvailabilityRequest>): Promise<Availability> {
    return this.client.put<Availability>(`/availability/${id}`, availability);
  }

  async deleteAvailability(id: string): Promise<void> {
    return this.client.delete<void>(`/availability/${id}`);
  }

  async getBulkAvailability(request: { dates: string[]; appointmentType: string; showroomId?: string }): Promise<Array<{
    date: string;
    available: boolean;
    slots: number;
  }>> {
    return this.client.post<any[]>('/availability/bulk', request);
  }

  // Time slot endpoints
  async getTimeSlots(): Promise<TimeSlot[]> {
    return this.client.get<TimeSlot[]>('/time-slots');
  }

  async createTimeSlot(slotData: { time: string; label: string }): Promise<TimeSlot> {
    return this.client.post<TimeSlot>('/time-slots', slotData);
  }

  async updateTimeSlot(id: string, slotData: Partial<TimeSlot>): Promise<TimeSlot> {
    return this.client.put<TimeSlot>(`/time-slots/${id}`, slotData);
  }

  async deleteTimeSlot(id: string): Promise<void> {
    return this.client.delete<void>(`/time-slots/${id}`);
  }

  // Consultant endpoints
  async getConsultants(params?: {
    specializations?: string[];
    isActive?: boolean;
  }): Promise<Consultant[]> {
    return this.client.get<Consultant[]>('/consultants', params);
  }

  async getConsultantById(id: string): Promise<Consultant> {
    return this.client.get<Consultant>(`/consultants/${id}`);
  }

  async createConsultant(consultantData: CreateConsultantRequest): Promise<Consultant> {
    return this.client.post<Consultant>('/consultants', consultantData);
  }

  async updateConsultant(id: string, consultantData: UpdateConsultantRequest): Promise<Consultant> {
    return this.client.put<Consultant>(`/consultants/${id}`, consultantData);
  }

  async deleteConsultant(id: string): Promise<void> {
    return this.client.delete<void>(`/consultants/${id}`);
  }

  async toggleConsultantStatus(id: string): Promise<Consultant> {
    return this.client.patch<Consultant>(`/consultants/${id}/toggle-status`);
  }

  async getAvailableConsultants(date: string, time: string): Promise<Consultant[]> {
    return this.client.get<Consultant[]>('/consultants/available', { date, time });
  }

  // Reminder endpoints
  async getReminders(params?: {
    appointmentId?: string;
    customerId?: string;
    type?: string;
    status?: string;
  }): Promise<Reminder[]> {
    return this.client.get<Reminder[]>('/reminders', params);
  }

  async getReminderById(id: string): Promise<Reminder> {
    return this.client.get<Reminder>(`/reminders/${id}`);
  }

  async createReminder(reminderData: CreateReminderRequest): Promise<Reminder> {
    return this.client.post<Reminder>('/reminders', reminderData);
  }

  async sendReminder(id: string): Promise<Reminder> {
    return this.client.post<Reminder>(`/reminders/${id}/send`);
  }

  async cancelReminder(id: string): Promise<Reminder> {
    return this.client.patch<Reminder>(`/reminders/${id}/cancel`);
  }

  // Calendar integration
  async getCalendarEvents(consultantId: string, dateFrom: string, dateTo: string): Promise<Array<{
    id: string;
    title: string;
    start: string;
    end: string;
    type: 'appointment' | 'blocker';
    status: string;
  }>> {
    return this.client.get<any[]>(`/calendar/${consultantId}`, { dateFrom, dateTo });
  }

  async syncCalendar(consultantId: string, provider: 'google' | 'outlook'): Promise<{ syncId: string }> {
    return this.client.post<any>(`/calendar/${consultantId}/sync`, { provider });
  }

  // Analytics
  async getAppointmentStats(params?: {
    dateFrom?: string;
    dateTo?: string;
    consultantId?: string;
    showroomId?: string;
  }): Promise<{
    total: number;
    confirmed: number;
    cancelled: number;
    completed: number;
    noShow: number;
    conversionRate: number;
    averageRating: number;
  }> {
    return this.client.get<any>('/appointments/stats', params);
  }
}

export const appointmentService = new AppointmentService();
