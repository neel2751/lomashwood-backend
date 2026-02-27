import { z } from 'zod';
import { TemplateChannel, TemplateCategory, TemplateStatus } from './template.types';
import { TEMPLATE_CONSTANTS } from './template.constants';

const ChannelEnum = z.nativeEnum(TemplateChannel);
const CategoryEnum = z.nativeEnum(TemplateCategory);
const StatusEnum = z.nativeEnum(TemplateStatus);

export const TemplateVariableSchema = z.object({
  key: z.string().min(1).max(50).regex(/^[a-zA-Z_][a-zA-Z0-9_]*$/, 'Variable key must be alphanumeric with underscores'),
  description: z.string().min(1).max(200),
  required: z.boolean(),
  defaultValue: z.string().optional(),
});

export const CreateTemplateSchema = z
  .object({
    name: z.string().min(1).max(TEMPLATE_CONSTANTS.MAX_NAME_LENGTH),
    slug: z
      .string()
      .min(1)
      .max(TEMPLATE_CONSTANTS.MAX_SLUG_LENGTH)
      .regex(TEMPLATE_CONSTANTS.SLUG_REGEX, 'Slug must be lowercase alphanumeric with hyphens'),
    channel: ChannelEnum,
    category: CategoryEnum,
    subject: z.string().min(1).max(TEMPLATE_CONSTANTS.MAX_SUBJECT_LENGTH).optional(),
    htmlBody: z.string().optional(),
    textBody: z.string().min(1),
    title: z.string().max(TEMPLATE_CONSTANTS.MAX_PUSH_TITLE_LENGTH).optional(),
    variables: z.array(TemplateVariableSchema).optional().default([]),
    metadata: z.record(z.unknown()).optional(),
  })
  .superRefine((data, ctx) => {
    if (data.channel === TemplateChannel.EMAIL) {
      if (!data.subject) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'subject is required for EMAIL templates', path: ['subject'] });
      }
      if (!data.htmlBody) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'htmlBody is required for EMAIL templates', path: ['htmlBody'] });
      }
    }
    if (data.channel === TemplateChannel.SMS && data.textBody.length > TEMPLATE_CONSTANTS.MAX_SMS_BODY_LENGTH) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: `SMS body must not exceed ${TEMPLATE_CONSTANTS.MAX_SMS_BODY_LENGTH} characters`, path: ['textBody'] });
    }
    if (data.channel === TemplateChannel.PUSH) {
      if (!data.title) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'title is required for PUSH templates', path: ['title'] });
      }
      if (data.textBody.length > TEMPLATE_CONSTANTS.MAX_PUSH_BODY_LENGTH) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: `Push body must not exceed ${TEMPLATE_CONSTANTS.MAX_PUSH_BODY_LENGTH} characters`, path: ['textBody'] });
      }
    }
  });

export const UpdateTemplateSchema = z
  .object({
    name: z.string().min(1).max(TEMPLATE_CONSTANTS.MAX_NAME_LENGTH).optional(),
    channel: ChannelEnum.optional(),
    category: CategoryEnum.optional(),
    status: StatusEnum.optional(),
    subject: z.string().min(1).max(TEMPLATE_CONSTANTS.MAX_SUBJECT_LENGTH).optional(),
    htmlBody: z.string().optional(),
    textBody: z.string().min(1).optional(),
    title: z.string().max(TEMPLATE_CONSTANTS.MAX_PUSH_TITLE_LENGTH).optional(),
    variables: z.array(TemplateVariableSchema).optional(),
    metadata: z.record(z.unknown()).optional(),
  })
  .refine((data) => Object.keys(data).length > 0, { message: 'At least one field must be provided for update' });

export const RenderTemplateSchema = z.object({
  slug: z.string().min(1).max(TEMPLATE_CONSTANTS.MAX_SLUG_LENGTH),
  channel: ChannelEnum,
  variables: z.record(z.string(), z.string()).default({}),
});

export const TemplateFilterSchema = z.object({
  channel: ChannelEnum.optional(),
  category: CategoryEnum.optional(),
  status: StatusEnum.optional(),
  search: z.string().max(100).optional(),
  page: z.coerce.number().int().min(1).optional().default(1),
  limit: z.coerce.number().int().min(1).max(TEMPLATE_CONSTANTS.MAX_PAGE_SIZE).optional().default(TEMPLATE_CONSTANTS.DEFAULT_PAGE_SIZE),
});

export type CreateTemplateDto = z.infer<typeof CreateTemplateSchema>;
export type UpdateTemplateDto = z.infer<typeof UpdateTemplateSchema>;
export type RenderTemplateDto = z.infer<typeof RenderTemplateSchema>;
export type TemplateFilterDto = z.infer<typeof TemplateFilterSchema>;
export type TemplateVariableDto = z.infer<typeof TemplateVariableSchema>;