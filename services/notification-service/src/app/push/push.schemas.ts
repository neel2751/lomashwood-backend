import { z } from 'zod';
import { PushProvider, PushPriority, PushStatus } from './push.types';

const PushProviderEnum = z.nativeEnum(PushProvider);
const PushPriorityEnum = z.nativeEnum(PushPriority);
const PushStatusEnum = z.nativeEnum(PushStatus);

export const PushPayloadSchema = z.object({
  title: z.string().min(1).max(100),
  body: z.string().min(1).max(500),
  imageUrl: z.string().url().optional(),
  icon: z.string().url().optional(),
  badge: z.string().url().optional(),
  sound: z.string().optional(),
  clickAction: z.string().optional(),
  data: z.record(z.string(), z.string()).optional(),
  priority: PushPriorityEnum.optional().default(PushPriority.NORMAL),
  ttl: z.number().int().min(0).max(2419200).optional(),
  collapseKey: z.string().max(100).optional(),
});

export const SendPushSchema = z.object({
  token: z.string().min(1),
  provider: PushProviderEnum,
  payload: PushPayloadSchema,
  notificationId: z.string().uuid().optional(),
  userId: z.string().uuid().optional(),
});

export const BulkSendPushSchema = z.object({
  tokens: z.array(z.string().min(1)).min(1).max(500),
  provider: PushProviderEnum,
  payload: PushPayloadSchema,
  userId: z.string().uuid().optional(),
});

export const SendPushToUserSchema = z.object({
  payload: PushPayloadSchema,
});

export const RegisterTokenSchema = z.object({
  token: z.string().min(1),
  provider: PushProviderEnum,
  deviceId: z.string().optional(),
  deviceType: z.string().optional(),
});

export const UnregisterTokenSchema = z.object({
  token: z.string().min(1),
});

export const PushNotificationFilterSchema = z.object({
  userId: z.string().uuid().optional(),
  status: PushStatusEnum.optional(),
  provider: PushProviderEnum.optional(),
  page: z.coerce.number().int().min(1).optional().default(1),
  limit: z.coerce.number().int().min(1).max(100).optional().default(20),
});

export type SendPushDto = z.infer<typeof SendPushSchema>;
export type BulkSendPushDto = z.infer<typeof BulkSendPushSchema>;
export type SendPushToUserDto = z.infer<typeof SendPushToUserSchema>;
export type RegisterTokenDto = z.infer<typeof RegisterTokenSchema>;
export type PushPayloadDto = z.infer<typeof PushPayloadSchema>;
export type PushNotificationFilterDto = z.infer<typeof PushNotificationFilterSchema>;