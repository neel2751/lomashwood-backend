// NotificationStatus and NotificationPriority are Prisma-generated enums.
// They are only available as named exports AFTER `prisma generate` has run.
// Defining them locally as string-literal unions is the safest approach and
// avoids the "Module has no exported member" error entirely.

export type NotificationStatus =
  | 'PENDING'
  | 'QUEUED'
  | 'PROCESSING'
  | 'SENT'
  | 'DELIVERED'
  | 'FAILED'
  | 'CANCELLED'
  | 'SCHEDULED';

export type NotificationPriority = 'LOW' | 'NORMAL' | 'HIGH' | 'CRITICAL';

export interface IEmailAttachment {
  filename:    string;
  url?:        string;
  content?:    string;
  contentType: string;
  encoding?:   'base64' | 'utf-8';
}

export interface IEmailRecipient {
  name?:  string;
  email:  string;
}

export interface IEmailSender {
  name:     string;
  address:  string;
  replyTo?: string;
}

export interface ISendEmailDto {
  to:              IEmailRecipient;
  from?:           IEmailSender;
  subject:         string;
  htmlBody?:       string;
  textBody?:       string;
  templateSlug?:   string;
  templateVars?:   Record<string, unknown>;
  attachments?:    IEmailAttachment[];
  priority?:       NotificationPriority;
  scheduledAt?:    Date;
  idempotencyKey?: string;
  recipientId?:    string;
  campaignId?:     string;
  batchId?:        string;
  metadata?:       Record<string, unknown>;
}

export interface ISendBulkEmailDto {
  recipients:    IEmailRecipient[];
  from?:         IEmailSender;
  subject:       string;
  templateSlug:  string;
  templateVars?: Record<string, unknown>;
  priority?:     NotificationPriority;
  campaignId?:   string;
  batchId?:      string;
}

export interface IEmailJobPayload {
  notificationId:  string;
  to:              IEmailRecipient;
  from:            IEmailSender;
  subject:         string;
  htmlBody?:       string;
  textBody?:       string;
  attachments?:    IEmailAttachment[];
  providerId?:     string;
  retryCount:      number;
  metadata?:       Record<string, unknown>;
}

export interface IEmailProviderResult {
  providerMessageId: string;
  providerResponse:  Record<string, unknown>;
  sentAt:            Date;
}

export interface IEmailResponse {
  notificationId:  string;
  status:          NotificationStatus;
  jobId?:          string;
  queuedAt:        Date;
  scheduledAt?:    Date;
  idempotencyKey?: string;
}

export interface IBulkEmailResponse {
  batchId:         string;
  totalQueued:     number;
  totalFailed:     number;
  notificationIds: string[];
  queuedAt:        Date;
}

export interface IEmailLog {
  notificationId: string;
  event:          string;
  status:         string;
  message?:       string;
  metadata?:      Record<string, unknown>;
  occurredAt:     Date;
}

export interface IEmailProviderConfig {
  host?:        string;
  port?:        number;
  secure?:      boolean;
  user?:        string;
  pass?:        string;
  region?:      string;
  configSet?:   string;
  fromAddress?: string;
}