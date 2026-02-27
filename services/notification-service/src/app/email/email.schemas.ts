import { z } from 'zod';
import { EMAIL_LIMITS } from './email.constants';

const emailRecipientSchema = z.object({
  name:  z.string().max(100).optional(),
  email: z.string().email('Invalid recipient email address.'),
});

const emailSenderSchema = z.object({
  name:    z.string().min(1).max(EMAIL_LIMITS.FROM_NAME_MAX_LENGTH),
  address: z.string().email('Invalid sender email address.'),
  replyTo: z.string().email().optional(),
});

const emailAttachmentSchema = z.object({
  filename:    z.string().min(1).max(255),
  url:         z.string().url().optional(),
  content:     z.string().optional(),
  contentType: z.string().min(1),
  encoding:    z.enum(['base64', 'utf-8']).optional(),
}).refine(
  (data) => data.url !== undefined || data.content !== undefined,
  { message: 'Attachment must have either a url or content field.' },
);

export const sendEmailSchema = z.object({
  to: emailRecipientSchema,
  from: emailSenderSchema.optional(),
  subject: z
    .string()
    .min(1, 'Subject is required.')
    .max(EMAIL_LIMITS.SUBJECT_MAX_LENGTH, `Subject must not exceed ${EMAIL_LIMITS.SUBJECT_MAX_LENGTH} characters.`),
  htmlBody:       z.string().optional(),
  textBody:       z.string().optional(),
  templateSlug:   z.string().min(1).max(255).optional(),
  templateVars:   z.record(z.unknown()).optional(),
  attachments:    z.array(emailAttachmentSchema).max(EMAIL_LIMITS.ATTACHMENT_MAX_COUNT).optional(),
  priority:       z.enum(['LOW', 'NORMAL', 'HIGH', 'CRITICAL']).default('NORMAL'),
  scheduledAt:    z.coerce.date().optional(),
  idempotencyKey: z.string().max(255).optional(),
  recipientId:    z.string().cuid().optional(),
  campaignId:     z.string().cuid().optional(),
  batchId:        z.string().max(255).optional(),
  metadata:       z.record(z.unknown()).optional(),
}).refine(
  (data) =>
    data.htmlBody !== undefined ||
    data.textBody !== undefined ||
    data.templateSlug !== undefined,
  {
    message: 'At least one of htmlBody, textBody, or templateSlug must be provided.',
  },
);

export const sendBulkEmailSchema = z.object({
  recipients: z
    .array(emailRecipientSchema)
    .min(1, 'At least one recipient is required.')
    .max(EMAIL_LIMITS.BULK_MAX_PER_BATCH, `Maximum ${EMAIL_LIMITS.BULK_MAX_PER_BATCH} recipients per bulk send.`),
  from:         emailSenderSchema.optional(),
  subject:      z.string().min(1).max(EMAIL_LIMITS.SUBJECT_MAX_LENGTH),
  templateSlug: z.string().min(1).max(255),
  templateVars: z.record(z.unknown()).optional(),
  priority:     z.enum(['LOW', 'NORMAL', 'HIGH', 'CRITICAL']).default('NORMAL'),
  campaignId:   z.string().cuid().optional(),
  batchId:      z.string().max(255).optional(),
});

export const emailIdParamSchema = z.object({
  id: z.string().cuid('Invalid notification ID.'),
});

export type SendEmailInput    = z.infer<typeof sendEmailSchema>;
export type SendBulkEmailInput = z.infer<typeof sendBulkEmailSchema>;
export type EmailIdParam      = z.infer<typeof emailIdParamSchema>;