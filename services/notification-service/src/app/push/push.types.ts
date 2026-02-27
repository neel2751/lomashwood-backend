export enum PushProvider {
  FIREBASE = 'FIREBASE',
  WEBPUSH = 'WEBPUSH',
}

export enum PushStatus {
  PENDING = 'PENDING',
  SENT = 'SENT',
  DELIVERED = 'DELIVERED',
  FAILED = 'FAILED',
}

export enum PushPriority {
  HIGH = 'HIGH',
  NORMAL = 'NORMAL',
  LOW = 'LOW',
}

export interface PushToken {
  token: string;
  provider: PushProvider;
  deviceId?: string;
  deviceType?: string;
  userId: string;
}

export interface PushPayload {
  title: string;
  body: string;
  imageUrl?: string;
  icon?: string;
  badge?: string;
  sound?: string;
  clickAction?: string;
  data?: Record<string, string>;
  priority?: PushPriority;
  ttl?: number;
  collapseKey?: string;
}

export interface SendPushRequest {
  token: string;
  provider: PushProvider;
  payload: PushPayload;
  notificationId?: string;
  userId?: string;
}

export interface BulkSendPushRequest {
  tokens: string[];
  provider: PushProvider;
  payload: PushPayload;
  userId?: string;
}

export interface SendPushToUserRequest {
  userId: string;
  payload: PushPayload;
}

export interface PushNotificationRecord {
  id: string;
  userId?: string;
  token: string;
  provider: PushProvider;
  title: string;
  body: string;
  data?: Record<string, string>;
  status: PushStatus;
  priority: PushPriority;
  providerId?: string;
  errorMessage?: string;
  sentAt?: Date;
  deliveredAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface PushSendResult {
  success: boolean;
  messageId?: string;
  errorCode?: string;
  errorMessage?: string;
  token: string;
}

export interface BulkPushSendResult {
  successCount: number;
  failureCount: number;
  results: PushSendResult[];
}

export interface RegisterTokenRequest {
  token: string;
  provider: PushProvider;
  deviceId?: string;
  deviceType?: string;
}

export interface PushNotificationFilter {
  userId?: string;
  status?: PushStatus;
  provider?: PushProvider;
  page?: number;
  limit?: number;
}

export interface PushNotificationListResponse {
  data: PushNotificationRecord[];
  total: number;
  page: number;
  limit: number;
}

export interface PushProviderConfig {
  firebase?: {
    serviceAccount: Record<string, unknown>;
    projectId: string;
  };
  webpush?: {
    vapidPublicKey: string;
    vapidPrivateKey: string;
    subject: string;
  };
}