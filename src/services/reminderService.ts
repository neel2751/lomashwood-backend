import { appointmentClient } from "@/lib/api-client";
import type { Reminder } from "@/lib/api-client";
import { axiosInstance } from "@/lib/axios";
import type { ApiResponse, PaginatedResponse } from "@/lib/api-client";

export const reminderService = {
  getAll: (params?: Record<string, unknown>) =>
    appointmentClient.reminders.getAll(params),

  getById: (id: string) => appointmentClient.reminders.getById(id),

  create: (payload: Partial<Reminder>) =>
    appointmentClient.reminders.create(payload),

  update: (id: string, payload: Partial<Reminder>) =>
    appointmentClient.reminders.update(id, payload),

  patch: (id: string, payload: Partial<Reminder>) =>
    appointmentClient.reminders.patch(id, payload),

  remove: (id: string) => appointmentClient.reminders.remove(id),

  getByAppointment: (
    appointmentId: string,
  ): Promise<PaginatedResponse<Reminder>> =>
    axiosInstance
      .get<PaginatedResponse<Reminder>>(
        `/appointments/reminders/by-appointment/${appointmentId}`,
      )
      .then((r) => r.data),

  sendNow: (id: string): Promise<ApiResponse<Reminder>> =>
    axiosInstance
      .post<ApiResponse<Reminder>>(`/appointments/reminders/${id}/send`)
      .then((r) => r.data),
};