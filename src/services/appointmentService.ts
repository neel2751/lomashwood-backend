import { appointmentClient, apiClient } from "@/lib/api-client";
import type { Appointment, TimeSlot } from "@/lib/api-client";
import axios from "@/lib/axios";
import type { ApiResponse } from "@/lib/api-client";

export const appointmentService = {
  getAll: (params?: Record<string, unknown>) =>
    appointmentClient.getAll(params),

  getById: (id: string) => appointmentClient.getById(id),

  create: (payload: Partial<Appointment>) =>
    appointmentClient.create(payload),

  update: (id: string, payload: Partial<Appointment>) =>
    appointmentClient.update(id, payload),

  // `makeService` exposes `delete`, not `remove`
  remove: (id: string) => appointmentClient.delete(id),

  // `getSlots` is not on appointmentClient — use the availability service instead
  getSlots: (params: { date: string; consultantId?: string }): Promise<TimeSlot[]> =>
    apiClient.availability.getAll(params),

  updateStatus: (
    id: string,
    status: string,
  ): Promise<ApiResponse<Appointment>> =>
    axios
      .patch<ApiResponse<Appointment>>(`/appointments/${id}/status`, { status })
      .then((r) => r.data),

  reschedule: (
    id: string,
    slot: string,
  ): Promise<ApiResponse<Appointment>> =>
    axios
      .patch<ApiResponse<Appointment>>(`/appointments/${id}/reschedule`, { slot })
      .then((r) => r.data),

  getByCustomer: (customerId: string, params?: Record<string, unknown>) =>
    axios
      .get(`/appointments/by-customer/${customerId}`, { params })
      .then((r) => r.data),

  sendConfirmation: (id: string): Promise<void> =>
    axios
      .post(`/appointments/${id}/send-confirmation`)
      .then(() => undefined),
};