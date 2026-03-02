import { apiClient } from "@/lib/api-client";
import type { NotificationTemplate } from "@/lib/api-client";
import axios from "@/lib/axios";
import type { ApiResponse, PaginatedResponse } from "@/lib/api-client";
import type { NotificationChannel } from "@/lib/constants";

export const templateService = {
  getAll: (params?: Record<string, unknown>) =>
    apiClient.templates.getAll(params),

  getById: (id: string) => apiClient.templates.getById(id),

  create: (payload: Partial<NotificationTemplate>) =>
    apiClient.templates.create(payload),

  update: (id: string, payload: Partial<NotificationTemplate>) =>
    apiClient.templates.update(id, payload),

  patch: (id: string, payload: Partial<NotificationTemplate>) =>
    axios.patch(`/notifications/templates/${id}`, payload).then((r) => r.data),

  remove: (id: string) => apiClient.templates.delete(id),

  getByChannel: (
    channel: NotificationChannel,
    params?: Record<string, unknown>,
  ): Promise<PaginatedResponse<NotificationTemplate>> =>
    axios
      .get<PaginatedResponse<NotificationTemplate>>(
        `/notifications/templates/by-channel/${channel}`,
        { params },
      )
      .then((r) => r.data),

  preview: (
    id: string,
    variables: Record<string, string>,
  ): Promise<ApiResponse<{ subject?: string; body: string }>> =>
    axios
      .post<ApiResponse<{ subject?: string; body: string }>>(
        `/notifications/templates/${id}/preview`,
        { variables },
      )
      .then((r) => r.data),

  duplicate: (id: string): Promise<ApiResponse<NotificationTemplate>> =>
    axios
      .post<ApiResponse<NotificationTemplate>>(
        `/notifications/templates/${id}/duplicate`,
      )
      .then((r) => r.data),

  sendTest: (
    id: string,
    recipient: string,
  ): Promise<ApiResponse<void>> =>
    axios
      .post<ApiResponse<void>>(`/notifications/templates/${id}/send-test`, {
        recipient,
      })
      .then((r) => r.data),
};

