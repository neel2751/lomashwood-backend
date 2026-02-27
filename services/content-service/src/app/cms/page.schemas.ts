import { z } from 'zod';
import { PageStatus } from '@prisma/client';

import {
  PAGE_TITLE_MAX_LENGTH,
  PAGE_SLUG_MAX_LENGTH,
  PAGE_DEFAULT_PAGE_SIZE,
  PAGE_MAX_PAGE_SIZE,
  PAGE_SORT_FIELDS,
  PAGE_SORT_ORDERS,
  PAGE_SYSTEM_SLUGS,
} from './page.constants';

// ── Reusable field schemas ────────────────────────────────────────────────────

const slugSchema = z
  .string()
  .min(1, 'Slug is required')
  .max(PAGE_SLUG_MAX_LENGTH)
  .regex(
    /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
    'Slug must be lowercase alphanumeric with hyphens only',
  )
  .trim();

const titleSchema = z
  .string()
  .min(1, 'Title is required')
  .max(PAGE_TITLE_MAX_LENGTH)
  .trim();

const pageStatusSchema = z.nativeEnum(PageStatus);

// ── Create page ───────────────────────────────────────────────────────────────

export const createPageSchema = z.object({
  slug: slugSchema,
  title: titleSchema,
  content: z.string().min(1, 'Content is required'),
  status: pageStatusSchema.default('DRAFT'),
  isSystem: z.boolean().default(false),
});

export type CreatePageInput = z.infer<typeof createPageSchema>;

// ── Update page ───────────────────────────────────────────────────────────────

export const updatePageSchema = z
  .object({
    title: titleSchema.optional(),
    slug: slugSchema.optional(),
    content: z.string().min(1).optional(),
    status: pageStatusSchema.optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: 'At least one field must be provided for update',
  });

export type UpdatePageInput = z.infer<typeof updatePageSchema>;

// ── Query params ──────────────────────────────────────────────────────────────

export const pageListQuerySchema = z.object({
  page: z
    .string()
    .optional()
    .transform((v) => (v !== undefined ? parseInt(v, 10) : 1))
    .pipe(z.number().int().min(1)),
  limit: z
    .string()
    .optional()
    .transform((v) => (v !== undefined ? parseInt(v, 10) : PAGE_DEFAULT_PAGE_SIZE))
    .pipe(z.number().int().min(1).max(PAGE_MAX_PAGE_SIZE)),
  status: pageStatusSchema.optional(),
  isSystem: z
    .string()
    .optional()
    .transform((v) => (v === 'true' ? true : v === 'false' ? false : undefined)),
  search: z.string().trim().min(1).max(100).optional(),
  sortBy: z.enum(PAGE_SORT_FIELDS).default('title'),
  sortOrder: z.enum(PAGE_SORT_ORDERS).default('asc'),
});

export type PageListQueryInput = z.infer<typeof pageListQuerySchema>;

// ── Path params ───────────────────────────────────────────────────────────────

export const pageIdParamSchema = z.object({
  id: z.string().cuid('Invalid page ID'),
});

export const pageSlugParamSchema = z.object({
  slug: slugSchema,
});

export const systemSlugParamSchema = z.object({
  slug: z.enum(PAGE_SYSTEM_SLUGS, {
    errorMap: () => ({
      message: `Slug must be one of: ${PAGE_SYSTEM_SLUGS.join(', ')}`,
    }),
  }),
});