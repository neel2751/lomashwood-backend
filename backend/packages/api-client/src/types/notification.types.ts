import { z } from 'zod';

// Notification schema
export const NotificationSchema = z.object({
  id: z.string(),
  userId: z.string(),
  type: z.enum(['info', 'success', 'warning', 'error']),
  title: z.string(),
  message: z.string(),
  data: z.record(z.any()).optional(),
  read: z.boolean(),
  createdAt: z.string().datetime(),
  readAt: z.string().datetime().optional(),
});

export type Notification = z.infer<typeof NotificationSchema>;

export const SendNotificationSchema = z.object({
  userId: z.string(),
  type: z.enum(['info', 'success', 'warning', 'error']),
  title: z.string(),
  message: z.string(),
  data: z.record(z.any()).optional(),
  channels: z.array(z.enum(['email', 'sms', 'push', 'in_app'])).optional(),
});

export type SendNotificationRequest = z.infer<typeof SendNotificationSchema>;

// Email log schema
export const EmailLogSchema = z.object({
  id: z.string(),
  to: z.string().email(),
  cc: z.array(z.string().email()).optional(),
  bcc: z.array(z.string().email()).optional(),
  subject: z.string(),
  template: z.string(),
  data: z.record(z.any()).optional(),
  status: z.enum(['pending', 'sent', 'delivered', 'failed', 'bounced']),
  provider: z.string(),
  providerId: z.string().optional(),
  error: z.string().optional(),
  sentAt: z.string().datetime().optional(),
  deliveredAt: z.string().datetime().optional(),
  createdAt: z.string().datetime(),
});

export type EmailLog = z.infer<typeof EmailLogSchema>;

export const SendEmailSchema = z.object({
  to: z.string().email(),
  cc: z.array(z.string().email()).optional(),
  bcc: z.array(z.string().email()).optional(),
  subject: z.string(),
  template: z.string(),
  data: z.record(z.any()).optional(),
  sendAt: z.string().datetime().optional(),
});

export type SendEmailRequest = z.infer<typeof SendEmailSchema>;

// SMS log schema
export const SmsLogSchema = z.object({
  id: z.string(),
  to: z.string(),
  message: z.string(),
  template: z.string().optional(),
  data: z.record(z.any()).optional(),
  status: z.enum(['pending', 'sent', 'delivered', 'failed']),
  provider: z.string(),
  providerId: z.string().optional(),
  error: z.string().optional(),
  sentAt: z.string().datetime().optional(),
  deliveredAt: z.string().datetime().optional(),
  createdAt: z.string().datetime(),
});

export type SmsLog = z.infer<typeof SmsLogSchema>;

export const SendSmsSchema = z.object({
  to: z.string(),
  message: z.string(),
  template: z.string().optional(),
  data: z.record(z.any()).optional(),
  sendAt: z.string().datetime().optional(),
});

export type SendSmsRequest = z.infer<typeof SendSmsSchema>;

// Push notification log schema
export const PushLogSchema = z.object({
  id: z.string(),
  userId: z.string(),
  deviceToken: z.string(),
  title: z.string(),
  message: z.string(),
  data: z.record(z.any()).optional(),
  status: z.enum(['pending', 'sent', 'delivered', 'failed']),
  provider: z.string(),
  providerId: z.string().optional(),
  error: z.string().optional(),
  sentAt: z.string().datetime().optional(),
  deliveredAt: z.string().datetime().optional(),
  createdAt: z.string().datetime(),
});

export type PushLog = z.infer<typeof PushLogSchema>;

export const SendPushSchema = z.object({
  userId: z.string(),
  deviceToken: z.string().optional(),
  title: z.string(),
  message: z.string(),
  data: z.record(z.any()).optional(),
  sendAt: z.string().datetime().optional(),
});

export type SendPushRequest = z.infer<typeof SendPushSchema>;

// Notification template schema
export const NotificationTemplateSchema = z.object({
  id: z.string(),
  name: z.string(),
  type: z.enum(['email', 'sms', 'push']),
  subject: z.string().optional(),
  content: z.string(),
  variables: z.array(z.string()).optional(),
  isActive: z.boolean(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export type NotificationTemplate = z.infer<typeof NotificationTemplateSchema>;

export const CreateTemplateSchema = z.object({
  name: z.string(),
  type: z.enum(['email', 'sms', 'push']),
  subject: z.string().optional(),
  content: z.string(),
  variables: z.array(z.string()).optional(),
  isActive: z.boolean().default(true),
});

export type CreateTemplateRequest = z.infer<typeof CreateTemplateSchema>;

export const UpdateTemplateSchema = z.object({
  name: z.string().optional(),
  type: z.enum(['email', 'sms', 'push']).optional(),
  subject: z.string().optional(),
  content: z.string().optional(),
  variables: z.array(z.string()).optional(),
  isActive: z.boolean().optional(),
});

export type UpdateTemplateRequest = z.infer<typeof UpdateTemplateSchema>;
