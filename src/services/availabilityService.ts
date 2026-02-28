import { appointmentClient } from "@/lib/api-client";
import type { Availability } from "@/lib/api-client";
import { axiosInstance } from "@/lib/axios";
import type { ApiResponse } from "@/lib/api-client";

export const availabilityService = {
  getAll: (params?: Record<string, unknown>) =>
    appointmentClient.availability.getAll(params),

  getById: (id: string) => appointmentClient.availability.getById(id),

  create: (payload: Partial<Availability>) =>
    appointmentClient.availability.create(payload),

  update: (id: string, payload: Partial<Availability>) =>
    appointmentClient.availability.update(id, payload),

  patch: (id: string, payload: Partial<Availability>) =>
    appointmentClient.availability.patch(id, payload),

  remove: (id: string) => appointmentClient.availability.remove(id),

  getByConsultant: (
    consultantId: string,
    params?: Record<string, unknown>,
  ) =>
    axiosInstance
      .get(`/appointments/availability/by-consultant/${consultantId}`, {
        params,
      })
      .then((r) => r.data),

  setUnavailable: (
    consultantId: string,
    dates: string[],
  ): Promise<ApiResponse<void>> =>
    axiosInstance
      .post<ApiResponse<void>>(
        `/appointments/availability/${consultantId}/block`,
        { dates },
      )
      .then((r) => r.data),
};