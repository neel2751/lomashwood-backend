import { notificationClient } from "@/lib/api-client";
import type { NotificationTemplate } from "@/lib/api-client";
import { axiosInstance } from "@/lib/axios";
import type { ApiResponse, PaginatedResponse } from "@/lib/api-client";
import type { NotificationChannel } from "@/lib/constants";

export const templateService = {
  getAll: (params?: Record<string, unknown>) =>
    notificationClient.templates.getAll(params),

  getById: (id: string) => notificationClient.templates.getById(id),

  create: (payload: Partial<NotificationTemplate>) =>
    notificationClient.templates.create(payload),

  update: (id: string, payload: Partial<NotificationTemplate>) =>
    notificationClient.templates.update(id, payload),

  patch: (id: string, payload: Partial<NotificationTemplate>) =>
    notificationClient.templates.patch(id, payload),

  remove: (id: string) => notificationClient.templates.remove(id),

  getByChannel: (
    channel: NotificationChannel,
    params?: Record<string, unknown>,
  ): Promise<PaginatedResponse<NotificationTemplate>> =>
    axiosInstance
      .get<PaginatedResponse<NotificationTemplate>>(
        `/notifications/templates/by-channel/${channel}`,
        { params },
      )
      .then((r) => r.data),

  preview: (
    id: string,
    variables: Record<string, string>,
  ): Promise<ApiResponse<{ subject?: string; body: string }>> =>
    axiosInstance
      .post<ApiResponse<{ subject?: string; body: string }>>(
        `/notifications/templates/${id}/preview`,
        { variables },
      )
      .then((r) => r.data),

  duplicate: (id: string): Promise<ApiResponse<NotificationTemplate>> =>
    axiosInstance
      .post<ApiResponse<NotificationTemplate>>(
        `/notifications/templates/${id}/duplicate`,
      )
      .then((r) => r.data),

  sendTest: (
    id: string,
    recipient: string,
  ): Promise<ApiResponse<void>> =>
    axiosInstance
      .post<ApiResponse<void>>(`/notifications/templates/${id}/send-test`, {
        recipient,
      })
      .then((r) => r.data),
};