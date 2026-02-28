import type { PaginationParams } from "./api.types";

export type NotificationChannel = "email" | "sms" | "push";

export type NotificationStatus = "queued" | "sent" | "failed" | "cancelled";

export type Notification = {
  id: string;
  type: string;
  channel: NotificationChannel;
  recipient: string;
  subject?: string;
  body: string;
  status: NotificationStatus;
  templateId?: string;
  referenceId?: string;
  referenceType?: string;
  errorMessage?: string;
  sentAt?: string;
  createdAt: string;
  updatedAt: string;
};

export type EmailLog = {
  id: string;
  to: string;
  from?: string;
  subject: string;
  body: string;
  status: NotificationStatus;
  providerMessageId?: string;
  openedAt?: string;
  clickedAt?: string;
  bouncedAt?: string;
  sentAt?: string;
  createdAt: string;
};

export type SmsLog = {
  id: string;
  to: string;
  body: string;
  status: NotificationStatus;
  providerMessageId?: string;
  deliveredAt?: string;
  sentAt?: string;
  createdAt: string;
};

export type PushLog = {
  id: string;
  token: string;
  title: string;
  body: string;
  status: NotificationStatus;
  clickedAt?: string;
  sentAt?: string;
  createdAt: string;
};

export type NotificationTemplate = {
  id: string;
  name: string;
  channel: NotificationChannel;
  subject?: string;
  body: string;
  variables: string[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

export type TemplatePreviewPayload = {
  variables: Record<string, string>;
};

export type TemplatePreviewResult = {
  subject?: string;
  body: string;
};

export type NotificationStats = {
  email: {
    sent: number;
    failed: number;
    opened: number;
    clicked: number;
    bounced: number;
  };
  sms: {
    sent: number;
    failed: number;
    delivered: number;
  };
  push: {
    sent: number;
    failed: number;
    clicked: number;
  };
};

export type CreateTemplatePayload = {
  name: string;
  channel: NotificationChannel;
  subject?: string;
  body: string;
  isActive?: boolean;
};

export type UpdateTemplatePayload = Partial<CreateTemplatePayload>;

export type NotificationFilterParams = PaginationParams & {
  search?: string;
  channel?: NotificationChannel;
  status?: NotificationStatus;
  startDate?: string;
  endDate?: string;
};

export type TemplateFilterParams = PaginationParams & {
  search?: string;
  channel?: NotificationChannel;
  isActive?: boolean;
};