import { appointmentClient } from "@/lib/api-client";
import type { Appointment, TimeSlot } from "@/lib/api-client";
import { axiosInstance } from "@/lib/axios";
import type { ApiResponse } from "@/lib/api-client";

export const appointmentService = {
  getAll: (params?: Record<string, unknown>) =>
    appointmentClient.appointments.getAll(params),

  getById: (id: string) => appointmentClient.appointments.getById(id),

  create: (payload: Partial<Appointment>) =>
    appointmentClient.appointments.create(payload),

  update: (id: string, payload: Partial<Appointment>) =>
    appointmentClient.appointments.update(id, payload),

  patch: (id: string, payload: Partial<Appointment>) =>
    appointmentClient.appointments.patch(id, payload),

  remove: (id: string) => appointmentClient.appointments.remove(id),

  getSlots: (params: { date: string; consultantId?: string }) =>
    appointmentClient.getSlots(params),

  updateStatus: (
    id: string,
    status: string,
  ): Promise<ApiResponse<Appointment>> =>
    axiosInstance
      .patch<ApiResponse<Appointment>>(`/appointments/${id}/status`, { status })
      .then((r) => r.data),

  reschedule: (
    id: string,
    slot: string,
  ): Promise<ApiResponse<Appointment>> =>
    axiosInstance
      .patch<ApiResponse<Appointment>>(`/appointments/${id}/reschedule`, {
        slot,
      })
      .then((r) => r.data),

  getByCustomer: (customerId: string, params?: Record<string, unknown>) =>
    axiosInstance
      .get(`/appointments/by-customer/${customerId}`, { params })
      .then((r) => r.data),

  sendConfirmation: (id: string): Promise<void> =>
    axiosInstance
      .post(`/appointments/${id}/send-confirmation`)
      .then(() => undefined),
};