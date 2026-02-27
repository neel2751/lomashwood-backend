import { z } from 'zod';
import { ContentStatus } from './landing.types';

import {
  LANDING_TEMPLATES,
  LANDING_TITLE_MAX_LENGTH,
  LANDING_SLUG_MAX_LENGTH,
  LANDING_SUBTITLE_MAX_LENGTH,
  LANDING_DEFAULT_PAGE_SIZE,
  LANDING_MAX_PAGE_SIZE,
  LANDING_SORT_FIELDS,
  LANDING_SORT_ORDERS,
} from './landing.constants';

const slugSchema = z
  .string()
  .min(1, 'Slug is required')
  .max(LANDING_SLUG_MAX_LENGTH)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Slug must be lowercase alphanumeric with hyphens only')
  .trim();

const templateSchema = z.enum(LANDING_TEMPLATES, {
  errorMap: () => ({
    message: `template must be one of: ${LANDING_TEMPLATES.join(', ')}`,
  }),
});

const statusSchema = z.nativeEnum(ContentStatus);

export const createLandingSchema = z
  .object({
    slug:               slugSchema,
    title:              z.string().min(1, 'Title is required').max(LANDING_TITLE_MAX_LENGTH).trim(),
    headline:           z.string().min(1, 'Headline is required').max(300).trim(),
    subheadline:        z.string().max(LANDING_SUBTITLE_MAX_LENGTH).trim().optional(),
    template:           templateSchema.optional(),
    coverImageUrl:      z.string().url('Cover image must be a valid URL').optional(),
    backgroundImageUrl: z.string().url('Background image must be a valid URL').optional(),
    sections:           z.array(z.record(z.unknown())).default([]),
    status: z.nativeEnum(ContentStatus).default(ContentStatus.DRAFT),
    metaTitle:          z.string().max(60).trim().optional(),
    metaDescription:    z.string().max(160).trim().optional(),
    scheduledAt:        z.coerce.date().optional(),
  })
  .superRefine((data, ctx) => {
    if (data.scheduledAt && data.scheduledAt <= new Date()) {
      ctx.addIssue({
        code: 'custom',
        path: ['scheduledAt'],
        message: 'scheduledAt must be a future date',
      });
    }

    if (data.status === 'SCHEDULED' && !data.scheduledAt) {
      ctx.addIssue({
        code: 'custom',
        path: ['scheduledAt'],
        message: 'scheduledAt is required when status is SCHEDULED',
      });
    }
  });

export type CreateLandingInput = z.infer<typeof createLandingSchema>;

export const updateLandingSchema = z
  .object({
    slug:               slugSchema.optional(),
    title:              z.string().min(1).max(LANDING_TITLE_MAX_LENGTH).trim().optional(),
    headline:           z.string().min(1).max(300).trim().optional(),
    subheadline:        z.string().max(LANDING_SUBTITLE_MAX_LENGTH).trim().nullable().optional(),
    template:           templateSchema.optional(),
    coverImageUrl:      z.string().url().nullable().optional(),
    backgroundImageUrl: z.string().url().nullable().optional(),
    sections:           z.array(z.record(z.unknown())).optional(),
    status:             statusSchema.optional(),
    metaTitle:          z.string().max(60).trim().nullable().optional(),
    metaDescription:    z.string().max(160).trim().nullable().optional(),
    scheduledAt:        z.coerce.date().nullable().optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: 'At least one field must be provided for update',
  });

export type UpdateLandingInput = z.infer<typeof updateLandingSchema>;

export const landingListQuerySchema = z.object({
  page: z
    .string()
    .optional()
    .transform((v) => (v !== undefined ? parseInt(v, 10) : 1))
    .pipe(z.number().int().min(1)),
  limit: z
    .string()
    .optional()
    .transform((v) => (v !== undefined ? parseInt(v, 10) : LANDING_DEFAULT_PAGE_SIZE))
    .pipe(z.number().int().min(1).max(LANDING_MAX_PAGE_SIZE)),
  status:    statusSchema.optional(),
  template:  templateSchema.optional(),
  search:    z.string().trim().min(1).max(100).optional(),
  sortBy:    z.enum(LANDING_SORT_FIELDS).default('createdAt'),
  sortOrder: z.enum(LANDING_SORT_ORDERS).default('desc'),
});

export type LandingListQueryInput = z.infer<typeof landingListQuerySchema>;

export const landingIdParamSchema = z.object({
  id: z.string().uuid('Invalid landing page ID'),
});

export const landingSlugParamSchema = z.object({
  slug: slugSchema,
});

export const landingTemplateParamSchema = z.object({
  template: templateSchema,
});