
import { apiClient } from "@/lib/api-client";
import axios from "@/lib/axios";

import type { ApiResponse } from "@/lib/api-client";

type Funnel = {
  id: string;
  name: string;
  steps?: { name: string; event: string; conditions?: Record<string, unknown> }[];
  createdAt?: string;
  updatedAt?: string;
};

export const funnelService = {
  getAll: (params?: Record<string, unknown>) =>
    apiClient.funnels.getAll(params),

  getById: (id: string) =>
    apiClient.funnels.getById(id),

  create: (payload: Partial<Funnel>) =>
    apiClient.funnels.create(payload),

  update: (id: string, payload: Partial<Funnel>) =>
    apiClient.funnels.update(id, payload),

  remove: (id: string) =>
    apiClient.funnels.delete(id),

  getResults: (
    id: string,
    params: { startDate: string; endDate: string },
  ): Promise<ApiResponse<{
    steps: {
      name: string;
      count: number;
      dropoffRate: number;
      conversionRate: number;
    }[];
    overallConversionRate: number;
  }>> =>
    axios
      .get(`/funnels/${id}/results`, { params })
      .then((r) => r.data),

  duplicate: (id: string): Promise<ApiResponse<Funnel>> =>
    axios
      .post<ApiResponse<Funnel>>(`/funnels/${id}/duplicate`)
      .then((r) => r.data),

  addStep: (
    id: string,
    step: { name: string; event: string; conditions?: Record<string, unknown> },
  ): Promise<ApiResponse<Funnel>> =>
    axios
      .post<ApiResponse<Funnel>>(`/funnels/${id}/steps`, step)
      .then((r) => r.data),

  removeStep: (id: string, stepIndex: number): Promise<ApiResponse<Funnel>> =>
    axios
      .delete<ApiResponse<Funnel>>(`/funnels/${id}/steps/${stepIndex}`)
      .then((r) => r.data),
};