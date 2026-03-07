
import { apiClient } from "@/lib/api-client";
import axios from "@/lib/axios";

import type { ApiResponse } from "@/lib/api-client";

type AnalyticsDashboard = {
  id: string;
  title: string;
  widgets?: unknown[];
  isDefault?: boolean;
  createdAt?: string;
  updatedAt?: string;
};

export const dashboardService = {
  getAll: (params?: Record<string, unknown>) =>
    apiClient.dashboards.getAll(params),

  getById: (id: string) =>
    apiClient.dashboards.getById(id),

  create: (payload: Partial<AnalyticsDashboard>) =>
    apiClient.dashboards.create(payload),

  update: (id: string, payload: Partial<AnalyticsDashboard>) =>
    apiClient.dashboards.update(id, payload),

  remove: (id: string) =>
    apiClient.dashboards.delete(id),

  duplicate: (id: string): Promise<ApiResponse<AnalyticsDashboard>> =>
    axios
      .post<ApiResponse<AnalyticsDashboard>>(`/dashboards/${id}/duplicate`)
      .then((r) => r.data),

  updateWidgets: (id: string, widgets: unknown[]): Promise<ApiResponse<AnalyticsDashboard>> =>
    axios
      .patch<ApiResponse<AnalyticsDashboard>>(`/dashboards/${id}/widgets`, { widgets })
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
    axios
      .post<ApiResponse<AnalyticsDashboard>>(`/dashboards/${id}/widgets`, widget)
      .then((r) => r.data),

  removeWidget: (id: string, widgetId: string): Promise<ApiResponse<AnalyticsDashboard>> =>
    axios
      .delete<ApiResponse<AnalyticsDashboard>>(`/dashboards/${id}/widgets/${widgetId}`)
      .then((r) => r.data),

  setDefault: (id: string): Promise<ApiResponse<AnalyticsDashboard>> =>
    axios
      .patch<ApiResponse<AnalyticsDashboard>>(`/dashboards/${id}/set-default`)
      .then((r) => r.data),

  getDefault: (): Promise<ApiResponse<AnalyticsDashboard>> =>
    axios
      .get<ApiResponse<AnalyticsDashboard>>("/dashboards/default")
      .then((r) => r.data),
};