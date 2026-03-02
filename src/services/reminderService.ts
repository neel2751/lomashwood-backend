import { apiClient } from "@/lib/api-client";
import type { Reminder } from "@/lib/api-client";
import axios from "@/lib/axios";
import type { ApiResponse, PaginatedResponse } from "@/lib/api-client";

export const reminderService = {
  getAll: (params?: Record<string, unknown>) =>
    apiClient.reminders.getAll(params),

  getById: (id: string) => apiClient.reminders.getById(id),

  create: (payload: Partial<Reminder>) =>
    apiClient.reminders.create(payload),

  update: (id: string, payload: Partial<Reminder>) =>
    apiClient.reminders.update(id, payload),

  patch: (id: string, payload: Partial<Reminder>) =>
    axios.patch(`/appointments/reminders/${id}`, payload).then((r) => r.data),

  remove: (id: string) => apiClient.reminders.delete(id),

  getByAppointment: (
    appointmentId: string,
  ): Promise<PaginatedResponse<Reminder>> =>
    axios
      .get<PaginatedResponse<Reminder>>(
        `/appointments/reminders/by-appointment/${appointmentId}`,
      )
      .then((r) => r.data),

  sendNow: (id: string): Promise<ApiResponse<Reminder>> =>
    axios
      .post<ApiResponse<Reminder>>(`/appointments/reminders/${id}/send`)
      .then((r) => r.data),
};