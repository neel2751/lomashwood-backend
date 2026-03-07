import { apiClient } from "@/lib/api-client";
import axios from "@/lib/axios";

import type { ApiResponse, PaginatedResponse } from "@/lib/api-client";
import type { NotificationChannel } from "@/lib/constants";


type Notification = {
  id: string;
  channel: string;
  status: string;
  recipient?: string;
  subject?: string;
  body?: string;
  createdAt?: string;
};

type EmailLog = {
  id: string;
  to: string;
  subject: string;
  status: string;
  openedAt?: string;
  createdAt?: string;
};

type SmsLog = {
  id: string;
  to: string;
  message: string;
  status: string;
  createdAt?: string;
};

type PushLog = {
  id: string;
  title: string;
  body: string;
  status: string;
  clickedAt?: string;
  createdAt?: string;
};

export const notificationService = {
  getAll: (params?: Record<string, unknown>) =>
    apiClient.notifications.getAll(params),

  getById: (id: string) =>
    apiClient.notifications.getById(id),

  remove: (id: string) =>
    apiClient.notifications.delete(id),

  getByChannel: (
    channel: NotificationChannel,
    params?: Record<string, unknown>,
  ): Promise<PaginatedResponse<EmailLog | SmsLog | PushLog>> =>
    apiClient.notifications.getByChannel(channel, params),

  getEmailLogs: (params?: Record<string, unknown>) =>
    axios.get("/notifications/email", { params }).then((r) => r.data),

  getEmailLogById: (id: string) =>
    axios.get(`/notifications/email/${id}`).then((r) => r.data),

  getSmsLogs: (params?: Record<string, unknown>) =>
    axios.get("/notifications/sms", { params }).then((r) => r.data),

  getSmsLogById: (id: string) =>
    axios.get(`/notifications/sms/${id}`).then((r) => r.data),

  getPushLogs: (params?: Record<string, unknown>) =>
    axios.get("/notifications/push", { params }).then((r) => r.data),

  getPushLogById: (id: string) =>
    axios.get(`/notifications/push/${id}`).then((r) => r.data),

  resend: (id: string, channel: NotificationChannel): Promise<ApiResponse<Notification>> =>
    axios
      .post<ApiResponse<Notification>>(`/notifications/${channel}/${id}/resend`)
      .then((r) => r.data),

  getStats: (params?: Record<string, unknown>): Promise<ApiResponse<{
    email: { sent: number; failed: number; opened: number };
    sms: { sent: number; failed: number };
    push: { sent: number; failed: number; clicked: number };
  }>> =>
    axios
      .get("/notifications/stats", { params })
      .then((r) => r.data),
};