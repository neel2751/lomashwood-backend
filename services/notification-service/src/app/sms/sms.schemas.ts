import { z } from 'zod';
import { SMS_LIMITS } from './sms.constants';

const smsRecipientSchema = z.object({
  phone: z
    .string()
    .min(7, 'Phone number is too short.')
    .max(SMS_LIMITS.TO_NUMBER_MAX_LENGTH, 'Phone number is too long.')
    .regex(/^\+[1-9]\d{1,14}$/, 'Phone number must be in E.164 format (e.g. +441234567890).'),
  name: z.string().max(100).optional(),
});

export const sendSmsSchema = z.object({
  to:             smsRecipientSchema,
  from:           z
                    .string()
                    .regex(/^\+[1-9]\d{1,14}$/, 'Sender must be in E.164 format.')
                    .optional(),
  body:           z
                    .string()
                    .min(1, 'SMS body is required.')
                    .max(SMS_LIMITS.BODY_MAX_LENGTH, `SMS body must not exceed ${SMS_LIMITS.BODY_MAX_LENGTH} characters.`),
  templateSlug:   z.string().min(1).max(255).optional(),
  templateVars:   z.record(z.unknown()).optional(),
  priority:       z.enum(['LOW', 'NORMAL', 'HIGH', 'CRITICAL']).default('NORMAL'),
  scheduledAt:    z.coerce.date().optional(),
  idempotencyKey: z.string().max(255).optional(),
  recipientId:    z.string().cuid().optional(),
  campaignId:     z.string().cuid().optional(),
  batchId:        z.string().max(255).optional(),
  metadata:       z.record(z.unknown()).optional(),
});

export const sendBulkSmsSchema = z.object({
  recipients: z
    .array(smsRecipientSchema)
    .min(1, 'At least one recipient is required.')
    .max(SMS_LIMITS.BULK_MAX_PER_BATCH, `Maximum ${SMS_LIMITS.BULK_MAX_PER_BATCH} recipients per bulk send.`),
  from:         z.string().regex(/^\+[1-9]\d{1,14}$/).optional(),
  body:         z.string().min(1).max(SMS_LIMITS.BODY_MAX_LENGTH),
  templateSlug: z.string().min(1).max(255).optional(),
  templateVars: z.record(z.unknown()).optional(),
  priority:     z.enum(['LOW', 'NORMAL', 'HIGH', 'CRITICAL']).default('NORMAL'),
  campaignId:   z.string().cuid().optional(),
  batchId:      z.string().max(255).optional(),
});

export const smsIdParamSchema = z.object({
  id: z.string().cuid('Invalid notification ID.'),
});

export type SendSmsInput     = z.infer<typeof sendSmsSchema>;
export type SendBulkSmsInput = z.infer<typeof sendBulkSmsSchema>;
export type SmsIdParam       = z.infer<typeof smsIdParamSchema>;