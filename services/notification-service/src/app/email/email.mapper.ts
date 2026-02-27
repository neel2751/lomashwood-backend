import type {
  ISendEmailDto,
  IEmailResponse,
  IEmailJobPayload,
  NotificationStatus,
} from './email.types';
import { EMAIL_DEFAULTS } from './email.constants';

// Local Notification shape mirrors the Prisma model fields used here.
// Using a local interface (instead of importing the generated Prisma type)
// avoids coupling to the generated client and keeps this file independently
// testable.
interface Notification {
  id:              string;
  status:          string;   // Prisma returns string at runtime; cast below
  createdAt:       Date;
  scheduledAt?:    Date | null;
  idempotencyKey?: string | null;
  recipientEmail?: string | null;
  fromName?:       string | null;
  fromAddress?:    string | null;
  replyTo?:        string | null;
  subject?:        string | null;
  htmlBody?:       string | null;
  body?:           string | null;
  retryCount:      number;
  metadata?:       unknown;
}

export function mapSendDtoToJobPayload(
  notificationId: string,
  dto: ISendEmailDto,
  retryCount: number = 0,
): IEmailJobPayload {
  return {
    notificationId,
    to: dto.to,
    from: {
      name:    dto.from?.name    ?? EMAIL_DEFAULTS.FROM_NAME,
      address: dto.from?.address ?? EMAIL_DEFAULTS.FROM_ADDRESS,
      replyTo: dto.from?.replyTo ?? EMAIL_DEFAULTS.REPLY_TO,
    },
    subject:     dto.subject,
    htmlBody:    dto.htmlBody,
    textBody:    dto.textBody,
    attachments: dto.attachments,
    retryCount,
    metadata:    dto.metadata,
  };
}

export function mapNotificationToResponse(
  notification: Notification,
  jobId?: string,
): IEmailResponse {
  return {
    notificationId:  notification.id,
    // Cast: Prisma stores status as a string at the DB level; we assert it
    // matches our NotificationStatus union which mirrors the Prisma enum values.
    status:          notification.status as NotificationStatus,
    jobId,
    queuedAt:        notification.createdAt,
    scheduledAt:     notification.scheduledAt ?? undefined,
    idempotencyKey:  notification.idempotencyKey ?? undefined,
  };
}

export function mapNotificationToJobPayload(
  notification: Notification,
): IEmailJobPayload {
  const metadata = notification.metadata as Record<string, unknown> | null;

  return {
    notificationId: notification.id,
    to: {
      email: notification.recipientEmail ?? '',
      name:  (metadata?.['recipientName'] as string | undefined),
    },
    from: {
      name:    notification.fromName    ?? EMAIL_DEFAULTS.FROM_NAME,
      address: notification.fromAddress ?? EMAIL_DEFAULTS.FROM_ADDRESS,
      replyTo: notification.replyTo     ?? EMAIL_DEFAULTS.REPLY_TO,
    },
    subject:    notification.subject  ?? '',
    htmlBody:   notification.htmlBody ?? undefined,
    textBody:   notification.body     ?? undefined,
    retryCount: notification.retryCount,
    metadata:   (notification.metadata as Record<string, unknown> | undefined) ?? undefined,
  };
}