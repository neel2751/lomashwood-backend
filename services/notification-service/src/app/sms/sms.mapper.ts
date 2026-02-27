import type { Notification } from '@prisma/client';
import type { ISendSmsDto, ISmsResponse, ISmsJobPayload } from './sms.types';
import { SMS_DEFAULTS } from './sms.constants';

export function mapSendDtoToJobPayload(
  notificationId: string,
  dto:            ISendSmsDto,
  retryCount:     number = 0,
): ISmsJobPayload {
  return {
    notificationId,
    to:         dto.to.phone,
    from:       dto.from ?? SMS_DEFAULTS.FROM,
    body:       dto.body,
    retryCount,
    metadata:   dto.metadata,
  };
}

export function mapNotificationToResponse(
  notification: Notification,
  jobId?:       string,
): ISmsResponse {
  return {
    notificationId:  notification.id,
    status:          notification.status,
    jobId,
    queuedAt:        notification.createdAt,
    scheduledAt:     notification.scheduledAt ?? undefined,
    idempotencyKey:  notification.idempotencyKey ?? undefined,
  };
}

export function mapNotificationToJobPayload(
  notification: Notification,
): ISmsJobPayload {
  return {
    notificationId: notification.id,
    to:             notification.recipientPhone ?? '',
    from:           notification.fromAddress   ?? SMS_DEFAULTS.FROM,
    body:           notification.body          ?? '',
    retryCount:     notification.retryCount,
    metadata:       (notification.metadata as Record<string, unknown> | undefined) ?? undefined,
  };
}