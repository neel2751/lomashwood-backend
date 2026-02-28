import { appointmentClient } from "@/lib/api-client";
import type { Consultant } from "@/lib/api-client";
import { axiosInstance } from "@/lib/axios";
import type { PaginatedResponse } from "@/lib/api-client";

export const consultantService = {
  getAll: (params?: Record<string, unknown>) =>
    appointmentClient.consultants.getAll(params),

  getById: (id: string) => appointmentClient.consultants.getById(id),

  create: (payload: Partial<Consultant>) =>
    appointmentClient.consultants.create(payload),

  update: (id: string, payload: Partial<Consultant>) =>
    appointmentClient.consultants.update(id, payload),

  patch: (id: string, payload: Partial<Consultant>) =>
    appointmentClient.consultants.patch(id, payload),

  remove: (id: string) => appointmentClient.consultants.remove(id),

  getActive: (): Promise<PaginatedResponse<Consultant>> =>
    axiosInstance
      .get<PaginatedResponse<Consultant>>("/appointments/consultants/active")
      .then((r) => r.data),

  getBySpeciality: (
    speciality: string,
  ): Promise<PaginatedResponse<Consultant>> =>
    axiosInstance
      .get<PaginatedResponse<Consultant>>(
        "/appointments/consultants/by-speciality",
        { params: { speciality } },
      )
      .then((r) => r.data),
};