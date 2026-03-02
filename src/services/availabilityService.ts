import { apiClient } from "@/lib/api-client";
import type { ApiResponse } from "@/lib/api-client";
import axios from "@/lib/axios";

type Availability = {
  id: string;
  consultantId: string;
  date: string;
  startTime: string;
  endTime: string;
  available?: boolean;
};

export const availabilityService = {
  getAll: (params?: Record<string, unknown>) =>
    apiClient.availability.getAll(params),

  getById: (id: string) =>
    apiClient.availability.getById(id),

  create: (payload: Partial<Availability>) =>
    apiClient.availability.create(payload),

  update: (id: string, payload: Partial<Availability>) =>
    apiClient.availability.update(id, payload),

  remove: (id: string) =>
    apiClient.availability.delete(id),

  getByConsultant: (consultantId: string, params?: Record<string, unknown>) =>
    axios
      .get(`/availability/by-consultant/${consultantId}`, { params })
      .then((r) => r.data),

  setUnavailable: (consultantId: string, dates: string[]): Promise<ApiResponse<void>> =>
    axios
      .post<ApiResponse<void>>(`/availability/${consultantId}/block`, { dates })
      .then((r) => r.data),
};