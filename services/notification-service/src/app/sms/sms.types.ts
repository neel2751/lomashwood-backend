import type { NotificationStatus, NotificationPriority } from '@prisma/client';

export interface ISmsRecipient {
  phone: string;
  name?: string;
}

export interface ISendSmsDto {
  to:              ISmsRecipient;
  from?:           string;
  body:            string;
  templateSlug?:   string;
  templateVars?:   Record<string, unknown>;
  priority?:       NotificationPriority;
  scheduledAt?:    Date;
  idempotencyKey?: string;
  recipientId?:    string;
  campaignId?:     string;
  batchId?:        string;
  metadata?:       Record<string, unknown>;
}

export interface ISendBulkSmsDto {
  recipients:    ISmsRecipient[];
  from?:         string;
  body:          string;
  templateSlug?: string;
  templateVars?: Record<string, unknown>;
  priority?:     NotificationPriority;
  campaignId?:   string;
  batchId?:      string;
}

export interface ISmsJobPayload {
  notificationId: string;
  to:             string;
  from:           string;
  body:           string;
  providerId?:    string;
  retryCount:     number;
  metadata?:      Record<string, unknown>;
}

export interface ISmsProviderResult {
  providerMessageId: string;
  providerResponse:  Record<string, unknown>;
  sentAt:            Date;
  segments?:         number;
}

export interface ISmsResponse {
  notificationId:  string;
  status:          NotificationStatus;
  jobId?:          string;
  queuedAt:        Date;
  scheduledAt?:    Date;
  idempotencyKey?: string;
}

export interface IBulkSmsResponse {
  batchId:         string;
  totalQueued:     number;
  totalFailed:     number;
  notificationIds: string[];
  queuedAt:        Date;
}