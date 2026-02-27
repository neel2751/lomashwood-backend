import {
  PushNotificationRecord,
  PushPayload,
  PushProvider,
  PushStatus,
  PushSendResult,
  BulkPushSendResult,
} from './push.types';

export class PushMapper {
  static toPushNotificationRecord(raw: {
    id: string;
    userId?: string | null;
    token: string;
    provider: string;
    title: string;
    body: string;
    data?: Record<string, string> | null;
    status: string;
    priority: string;
    providerId?: string | null;
    errorMessage?: string | null;
    sentAt?: Date | null;
    deliveredAt?: Date | null;
    createdAt: Date;
    updatedAt: Date;
  }): PushNotificationRecord {
    return {
      id: raw.id,
      userId: raw.userId ?? undefined,
      token: raw.token,
      provider: raw.provider as PushProvider,
      title: raw.title,
      body: raw.body,
      data: raw.data ?? undefined,
      status: raw.status as PushStatus,
      priority: raw.priority as PushNotificationRecord['priority'],
      providerId: raw.providerId ?? undefined,
      errorMessage: raw.errorMessage ?? undefined,
      sentAt: raw.sentAt ?? undefined,
      deliveredAt: raw.deliveredAt ?? undefined,
      createdAt: raw.createdAt,
      updatedAt: raw.updatedAt,
    };
  }

  static toFirebaseMessage(
    token: string,
    payload: PushPayload,
  ): Record<string, unknown> {
    return {
      token,
      notification: {
        title: payload.title,
        body: payload.body,
        ...(payload.imageUrl && { imageUrl: payload.imageUrl }),
      },
      android: {
        priority: payload.priority === 'HIGH' ? 'high' : 'normal',
        ttl: payload.ttl ? `${payload.ttl}s` : '86400s',
        ...(payload.collapseKey && { collapseKey: payload.collapseKey }),
        notification: {
          sound: payload.sound ?? 'default',
          ...(payload.icon && { icon: payload.icon }),
          ...(payload.badge && { badge: payload.badge }),
          ...(payload.clickAction && { clickAction: payload.clickAction }),
        },
      },
      apns: {
        headers: {
          'apns-priority': payload.priority === 'HIGH' ? '10' : '5',
          ...(payload.ttl && { 'apns-expiration': String(Math.floor(Date.now() / 1000) + payload.ttl) }),
          ...(payload.collapseKey && { 'apns-collapse-id': payload.collapseKey }),
        },
        payload: {
          aps: {
            sound: payload.sound ?? 'default',
            ...(payload.badge && { badge: Number(payload.badge) }),
            ...(payload.clickAction && { category: payload.clickAction }),
          },
        },
      },
      webpush: {
        notification: {
          title: payload.title,
          body: payload.body,
          ...(payload.icon && { icon: payload.icon }),
          ...(payload.badge && { badge: payload.badge }),
          ...(payload.imageUrl && { image: payload.imageUrl }),
        },
        fcmOptions: {
          ...(payload.clickAction && { link: payload.clickAction }),
        },
      },
      data: payload.data,
    };
  }

  static toWebPushOptions(payload: PushPayload): Record<string, unknown> {
    return {
      TTL: payload.ttl ?? 86400,
      urgency: payload.priority === 'HIGH' ? 'high' : payload.priority === 'LOW' ? 'low' : 'normal',
      ...(payload.collapseKey && { topic: payload.collapseKey }),
    };
  }

  static toWebPushPayload(payload: PushPayload): string {
    return JSON.stringify({
      title: payload.title,
      body: payload.body,
      icon: payload.icon,
      badge: payload.badge,
      image: payload.imageUrl,
      data: {
        ...payload.data,
        ...(payload.clickAction && { url: payload.clickAction }),
      },
    });
  }

  static toPushSendResult(params: {
    token: string;
    success: boolean;
    messageId?: string;
    errorCode?: string;
    errorMessage?: string;
  }): PushSendResult {
    return {
      token: params.token,
      success: params.success,
      messageId: params.messageId,
      errorCode: params.errorCode,
      errorMessage: params.errorMessage,
    };
  }

  static toBulkPushSendResult(results: PushSendResult[]): BulkPushSendResult {
    const successCount = results.filter((r) => r.success).length;
    return {
      successCount,
      failureCount: results.length - successCount,
      results,
    };
  }
}