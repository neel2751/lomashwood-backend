import { analyticsClient } from "@/lib/api-client";
import type { Funnel } from "@/lib/api-client";
import { axiosInstance } from "@/lib/axios";
import type { ApiResponse } from "@/lib/api-client";

export const funnelService = {
  getAll: (params?: Record<string, unknown>) =>
    analyticsClient.funnels.getAll(params),

  getById: (id: string) => analyticsClient.funnels.getById(id),

  create: (payload: Partial<Funnel>) =>
    analyticsClient.funnels.create(payload),

  update: (id: string, payload: Partial<Funnel>) =>
    analyticsClient.funnels.update(id, payload),

  patch: (id: string, payload: Partial<Funnel>) =>
    analyticsClient.funnels.patch(id, payload),

  remove: (id: string) => analyticsClient.funnels.remove(id),

  getResults: (
    id: string,
    params: { startDate: string; endDate: string },
  ): Promise<
    ApiResponse<{
      steps: {
        name: string;
        count: number;
        dropoffRate: number;
        conversionRate: number;
      }[];
      overallConversionRate: number;
    }>
  > =>
    axiosInstance
      .get(`/analytics/funnels/${id}/results`, { params })
      .then((r) => r.data),

  duplicate: (id: string): Promise<ApiResponse<Funnel>> =>
    axiosInstance
      .post<ApiResponse<Funnel>>(`/analytics/funnels/${id}/duplicate`)
      .then((r) => r.data),

  addStep: (
    id: string,
    step: { name: string; event: string; conditions?: Record<string, unknown> },
  ): Promise<ApiResponse<Funnel>> =>
    axiosInstance
      .post<ApiResponse<Funnel>>(`/analytics/funnels/${id}/steps`, step)
      .then((r) => r.data),

  removeStep: (
    id: string,
    stepIndex: number,
  ): Promise<ApiResponse<Funnel>> =>
    axiosInstance
      .delete<ApiResponse<Funnel>>(`/analytics/funnels/${id}/steps/${stepIndex}`)
      .then((r) => r.data),
};