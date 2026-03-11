import { apiClient } from "@/lib/api-client";
import axios from "@/lib/axios";

import type { ApiResponse } from "@/lib/api-client";

type Availability = {
  id: string;
  consultantId?: string;
  date: string;
  slots: string[];
  isBlocked?: boolean;
};

type WeeklyPatternPayload = {
  consultantId?: string;
  patterns: Array<{
    weekday: number;
    isEnabled: boolean;
    startTime: string;
    endTime: string;
    slotDuration: number;
  }>;
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

  getSlots: (params: { date: string; consultantId?: string }) =>
    axios.get("/availability/slots", { params }).then((r) => r.data),

  getWeeklyPattern: (params?: { consultantId?: string }) =>
    axios.get("/availability/weekly", { params }).then((r) => r.data),

  saveWeeklyPattern: (payload: WeeklyPatternPayload) =>
    axios.post("/availability/weekly", payload).then((r) => r.data),

  getByConsultant: (consultantId: string, params?: Record<string, unknown>) =>
    axios
      .get(`/availability/by-consultant/${consultantId}`, { params })
      .then((r) => r.data),

  setUnavailable: (consultantId: string, dates: string[]): Promise<ApiResponse<void>> =>
    axios
      .post<ApiResponse<void>>(`/availability/${consultantId}/block`, { dates })
      .then((r) => r.data),
};