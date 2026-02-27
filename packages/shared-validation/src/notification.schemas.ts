import { z } from "zod";

export const NotificationChannelEnum = z.enum(["EMAIL", "SMS", "PUSH"]);

export const NotificationStatusEnum = z.enum([
  "PENDING",
  "QUEUED",
  "SENT",
  "DELIVERED",
  "FAILED",
  "BOUNCED",
]);

export const NotificationTypeEnum = z.enum([
  "BOOKING_CONFIRMATION",
  "BOOKING_CANCELLATION",
  "BOOKING_REMINDER",
  "BOOKING_RESCHEDULED",
  "ORDER_CONFIRMATION",
  "ORDER_SHIPPED",
  "ORDER_DELIVERED",
  "ORDER_CANCELLED",
  "PAYMENT_SUCCESS",
  "PAYMENT_FAILED",
  "PAYMENT_REFUND",
  "BROCHURE_REQUEST",
  "BUSINESS_INQUIRY",
  "NEWSLETTER_WELCOME",
  "ACCOUNT_VERIFICATION",
  "PASSWORD_RESET",
  "ADMIN_ALERT",
  "CUSTOM",
]);

export const SendEmailSchema = z.object({
  to: z.union([z.string().email(), z.array(z.string().email()).min(1)]),
  cc: z
    .union([z.string().email(), z.array(z.string().email())])
    .optional(),
  bcc: z
    .union([z.string().email(), z.array(z.string().email())])
    .optional(),
  subject: z.string().min(1).max(998).trim(),
  templateId: z.string().uuid().optional(),
  templateData: z.record(z.unknown()).optional(),
  html: z.string().optional(),
  text: z.string().optional(),
  attachments: z
    .array(
      z.object({
        filename: z.string().min(1).max(255),
        url: z.string().url().optional(),
        content: z.string().optional(),
        contentType: z.string().optional(),
      })
    )
    .max(10)
    .optional()
    .default([]),
  notificationType: NotificationTypeEnum.optional().default("CUSTOM"),
  userId: z.string().uuid().optional(),
  metadata: z.record(z.unknown()).optional(),
});

export const SendSmsSchema = z.object({
  to: z.union([
    z.string().regex(/^\+[1-9]\d{7,14}$/),
    z.array(z.string().regex(/^\+[1-9]\d{7,14}$/)).min(1),
  ]),
  templateId: z.string().uuid().optional(),
  templateData: z.record(z.unknown()).optional(),
  message: z.string().min(1).max(1600).optional(),
  notificationType: NotificationTypeEnum.optional().default("CUSTOM"),
  userId: z.string().uuid().optional(),
  metadata: z.record(z.unknown()).optional(),
});

export const SendPushSchema = z.object({
  userId: z.union([z.string().uuid(), z.array(z.string().uuid()).min(1)]),
  title: z.string().min(1).max(100).trim(),
  body: z.string().min(1).max(500).trim(),
  icon: z.string().url().optional(),
  image: z.string().url().optional(),
  clickAction: z.string().url().optional(),
  data: z.record(z.string()).optional(),
  notificationType: NotificationTypeEnum.optional().default("CUSTOM"),
  metadata: z.record(z.unknown()).optional(),
});

export const TemplateSchema = z.object({
  name: z.string().min(2).max(255).trim(),
  channel: NotificationChannelEnum,
  notificationType: NotificationTypeEnum,
  subject: z.string().max(998).optional(),
  htmlContent: z.string().optional(),
  textContent: z.string().optional(),
  smsContent: z.string().max(1600).optional(),
  variables: z.array(z.string()).optional().default([]),
  isDefault: z.boolean().optional().default(false),
  isActive: z.boolean().optional().default(true),
  locale: z.string().length(2).toLowerCase().optional().default("en"),
});

export const TemplateUpdateSchema = TemplateSchema.partial();

export const NotificationFilterSchema = z.object({
  channel: NotificationChannelEnum.optional(),
  status: NotificationStatusEnum.optional(),
  notificationType: NotificationTypeEnum.optional(),
  userId: z.string().uuid().optional(),
  dateFrom: z.coerce.date().optional(),
  dateTo: z.coerce.date().optional(),
  search: z.string().max(255).optional(),
  page: z.coerce.number().int().positive().optional().default(1),
  limit: z.coerce.number().int().min(1).max(100).optional().default(20),
  sortBy: z.enum(["created_asc", "created_desc"]).optional().default("created_desc"),
});

export const NotificationPreferenceSchema = z.object({
  userId: z.string().uuid(),
  emailEnabled: z.boolean().optional().default(true),
  smsEnabled: z.boolean().optional().default(true),
  pushEnabled: z.boolean().optional().default(true),
  bookingReminders: z.boolean().optional().default(true),
  orderUpdates: z.boolean().optional().default(true),
  marketingEmails: z.boolean().optional().default(false),
  weeklyDigest: z.boolean().optional().default(false),
});

export const NotificationPreferenceUpdateSchema = NotificationPreferenceSchema.partial().omit({ userId: true });

export const BulkNotificationSchema = z.object({
  userIds: z.array(z.string().uuid()).min(1).max(10000),
  channels: z.array(NotificationChannelEnum).min(1),
  templateId: z.string().uuid(),
  templateData: z.record(z.unknown()).optional(),
  scheduledAt: z.coerce.date().optional(),
  notificationType: NotificationTypeEnum,
});

export type NotificationChannelEnumType = z.infer<typeof NotificationChannelEnum>;
export type NotificationStatusEnumType = z.infer<typeof NotificationStatusEnum>;
export type NotificationTypeEnumType = z.infer<typeof NotificationTypeEnum>;
export type SendEmailInput = z.infer<typeof SendEmailSchema>;
export type SendSmsInput = z.infer<typeof SendSmsSchema>;
export type SendPushInput = z.infer<typeof SendPushSchema>;
export type TemplateInput = z.infer<typeof TemplateSchema>;
export type TemplateUpdateInput = z.infer<typeof TemplateUpdateSchema>;
export type NotificationFilterInput = z.infer<typeof NotificationFilterSchema>;
export type NotificationPreferenceInput = z.infer<typeof NotificationPreferenceSchema>;
export type NotificationPreferenceUpdateInput = z.infer<typeof NotificationPreferenceUpdateSchema>;
export type BulkNotificationInput = z.infer<typeof BulkNotificationSchema>;