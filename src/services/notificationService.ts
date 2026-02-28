import { notificationClient } from "@/lib/api-client";
import type { Notification, EmailLog, SmsLog, PushLog } from "@/lib/api-client";
import { axiosInstance } from "@/lib/axios";
import type { ApiResponse, PaginatedResponse } from "@/lib/api-client";
import type { NotificationChannel } from "@/lib/constants";

export const notificationService = {
  getAll: (params?: Record<string, unknown>) =>
    notificationClient.notifications.getAll(params),

  getById: (id: string) => notificationClient.notifications.getById(id),

  remove: (id: string) => notificationClient.notifications.remove(id),

  getByChannel: (
    channel: NotificationChannel,
    params?: Record<string, unknown>,
  ): Promise<PaginatedResponse<EmailLog | SmsLog | PushLog>> =>
    axiosInstance
      .get<PaginatedResponse<EmailLog | SmsLog | PushLog>>(
        `/notifications/${channel}`,
        { params },
      )
      .then((r) => r.data),

  getEmailLogs: (params?: Record<string, unknown>) =>
    notificationClient.email.getAll(params),

  getEmailLogById: (id: string) => notificationClient.email.getById(id),

  getSmsLogs: (params?: Record<string, unknown>) =>
    notificationClient.sms.getAll(params),

  getSmsLogById: (id: string) => notificationClient.sms.getById(id),

  getPushLogs: (params?: Record<string, unknown>) =>
    notificationClient.push.getAll(params),

  getPushLogById: (id: string) => notificationClient.push.getById(id),

  resend: (
    id: string,
    channel: NotificationChannel,
  ): Promise<ApiResponse<Notification>> =>
    axiosInstance
      .post<ApiResponse<Notification>>(
        `/notifications/${channel}/${id}/resend`,
      )
      .then((r) => r.data),

  getStats: (params?: Record<string, unknown>): Promise<
    ApiResponse<{
      email: { sent: number; failed: number; opened: number };
      sms: { sent: number; failed: number };
      push: { sent: number; failed: number; clicked: number };
    }>
  > =>
    axiosInstance
      .get("/notifications/stats", { params })
      .then((r) => r.data),
};