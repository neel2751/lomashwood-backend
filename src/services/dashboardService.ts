import { analyticsClient } from "@/lib/api-client";
import type { AnalyticsDashboard } from "@/lib/api-client";
import { axiosInstance } from "@/lib/axios";
import type { ApiResponse } from "@/lib/api-client";

export const dashboardService = {
  getAll: (params?: Record<string, unknown>) =>
    analyticsClient.dashboards.getAll(params),

  getById: (id: string) => analyticsClient.dashboards.getById(id),

  create: (payload: Partial<AnalyticsDashboard>) =>
    analyticsClient.dashboards.create(payload),

  update: (id: string, payload: Partial<AnalyticsDashboard>) =>
    analyticsClient.dashboards.update(id, payload),

  patch: (id: string, payload: Partial<AnalyticsDashboard>) =>
    analyticsClient.dashboards.patch(id, payload),

  remove: (id: string) => analyticsClient.dashboards.remove(id),

  duplicate: (id: string): Promise<ApiResponse<AnalyticsDashboard>> =>
    axiosInstance
      .post<ApiResponse<AnalyticsDashboard>>(
        `/analytics/dashboards/${id}/duplicate`,
      )
      .then((r) => r.data),

  updateWidgets: (
    id: string,
    widgets: unknown[],
  ): Promise<ApiResponse<AnalyticsDashboard>> =>
    axiosInstance
      .patch<ApiResponse<AnalyticsDashboard>>(
        `/analytics/dashboards/${id}/widgets`,
        { widgets },
      )
      .then((r) => r.data),

  addWidget: (
    id: string,
    widget: {
      type: string;
      title: string;
      config: Record<string, unknown>;
      position: { x: number; y: number; w: number; h: number };
    },
  ): Promise<ApiResponse<AnalyticsDashboard>> =>
    axiosInstance
      .post<ApiResponse<AnalyticsDashboard>>(
        `/analytics/dashboards/${id}/widgets`,
        widget,
      )
      .then((r) => r.data),

  removeWidget: (
    id: string,
    widgetId: string,
  ): Promise<ApiResponse<AnalyticsDashboard>> =>
    axiosInstance
      .delete<ApiResponse<AnalyticsDashboard>>(
        `/analytics/dashboards/${id}/widgets/${widgetId}`,
      )
      .then((r) => r.data),

  setDefault: (id: string): Promise<ApiResponse<AnalyticsDashboard>> =>
    axiosInstance
      .patch<ApiResponse<AnalyticsDashboard>>(
        `/analytics/dashboards/${id}/set-default`,
      )
      .then((r) => r.data),

  getDefault: (): Promise<ApiResponse<AnalyticsDashboard>> =>
    axiosInstance
      .get<ApiResponse<AnalyticsDashboard>>("/analytics/dashboards/default")
      .then((r) => r.data),
};