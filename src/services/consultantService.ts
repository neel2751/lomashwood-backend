
import { apiClient } from "@/lib/api-client";
import axios from "@/lib/axios";

import type { PaginatedResponse } from "@/lib/api-client";

type Consultant = {
  id: string;
  name: string;
  email?: string;
  specialty?: string;
  active?: boolean;
  createdAt?: string;
  updatedAt?: string;
};

export const consultantService = {
  getAll: (params?: Record<string, unknown>) =>
    apiClient.consultants.getAll(params),

  getById: (id: string) =>
    apiClient.consultants.getById(id),

  create: (payload: Partial<Consultant>) =>
    apiClient.consultants.create(payload),

  update: (id: string, payload: Partial<Consultant>) =>
    apiClient.consultants.update(id, payload),

  remove: (id: string) =>
    apiClient.consultants.delete(id),

  getActive: (): Promise<PaginatedResponse<Consultant>> =>
    axios
      .get<PaginatedResponse<Consultant>>("/consultants/active")
      .then((r) => r.data),

  getBySpecialty: (specialty: string): Promise<PaginatedResponse<Consultant>> =>
    axios
      .get<PaginatedResponse<Consultant>>("/consultants/by-specialty", {
        params: { specialty },
      })
      .then((r) => r.data),
};