import { z } from 'zod';

import {
  MEDIA_TITLE_MAX_LENGTH,
  MEDIA_DESCRIPTION_MAX_LENGTH,
  MEDIA_CTA_TEXT_MAX_LENGTH,
  MEDIA_DEFAULT_PAGE_SIZE,
  MEDIA_MAX_PAGE_SIZE,
  MEDIA_SORT_ORDER_MIN,
  MEDIA_SORT_ORDER_MAX,
  MEDIA_SORT_FIELDS,
  MEDIA_SORT_ORDERS,
} from './media.constants';

// ── Reusable field schemas ────────────────────────────────────────────────────

const layoutSchema = z.enum(['FULL_WIDTH', 'GRID_2', 'GRID_3', 'MASONRY']).optional().default('GRID_3');

const titlesSchema = z
  .string()
  .min(1, 'Title is required')
  .max(MEDIA_TITLE_MAX_LENGTH)
  .trim();

const sortOrderSchema = z
  .number()
  .int('Sort order must be an integer')
  .min(MEDIA_SORT_ORDER_MIN, `Sort order must be at least ${MEDIA_SORT_ORDER_MIN}`)
  .max(MEDIA_SORT_ORDER_MAX, `Sort order must not exceed ${MEDIA_SORT_ORDER_MAX}`);

// ── Create media ──────────────────────────────────────────────────────────────

export const createMediaSchema = z
  .object({
    title: titlesSchema,
    description: z
      .string()
      .max(MEDIA_DESCRIPTION_MAX_LENGTH)
      .trim()
      .optional(),
    backgroundImageUrl: z.string().url('Background image URL must be valid').optional(),
    backgroundImageKey: z.string().optional(),
    backgroundVideoUrl: z.string().url('Background video URL must be valid').optional(),
    backgroundVideoKey: z.string().optional(),
    layout: layoutSchema,
    ctaText: z
      .string()
      .max(MEDIA_CTA_TEXT_MAX_LENGTH)
      .trim()
      .optional(),
    ctaUrl: z.string().url('CTA URL must be a valid URL').optional(),
    sortOrder: sortOrderSchema,
    isActive: z.boolean().default(true),
  })
  .refine(
    (data) => {
      if (data.ctaText && !data.ctaUrl) return false;
      return true;
    },
    { message: 'ctaUrl is required when ctaText is provided', path: ['ctaUrl'] },
  )
  .refine(
    (data) => {
      if (data.ctaUrl && !data.ctaText) return false;
      return true;
    },
    { message: 'ctaText is required when ctaUrl is provided', path: ['ctaText'] },
  );

export type CreateMediaInput = z.infer<typeof createMediaSchema>;

// ── Update media ──────────────────────────────────────────────────────────────

export const updateMediaSchema = z
  .object({
    title: z.string().min(1).max(MEDIA_TITLE_MAX_LENGTH).trim().optional(),
    description: z
      .string()
      .max(MEDIA_DESCRIPTION_MAX_LENGTH)
      .trim()
      .nullable()
      .optional(),
    backgroundImageUrl: z.string().url('Background image URL must be valid').nullable().optional(),
    backgroundImageKey: z.string().nullable().optional(),
    backgroundVideoUrl: z.string().url('Background video URL must be valid').nullable().optional(),
    backgroundVideoKey: z.string().nullable().optional(),
    ctaText: z
      .string()
      .max(MEDIA_CTA_TEXT_MAX_LENGTH)
      .trim()
      .nullable()
      .optional(),
    ctaUrl: z.string().url().nullable().optional(),
    sortOrder: sortOrderSchema.optional(),
    isActive: z.boolean().optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: 'At least one field must be provided for update',
  });

export type UpdateMediaInput = z.infer<typeof updateMediaSchema>;

// ── Reorder media ─────────────────────────────────────────────────────────────

export const reorderMediaSchema = z.object({
  items: z
    .array(
      z.object({
        id: z.string().cuid('Invalid media ID'),
        sortOrder: sortOrderSchema,
      }),
    )
    .min(1, 'At least one item is required')
    .max(100, 'Cannot reorder more than 100 items at once')
    .refine(
      (items) => {
        const orders = items.map((i) => i.sortOrder);
        return new Set(orders).size === orders.length;
      },
      { message: 'Duplicate sortOrder values are not permitted within the same reorder operation' },
    ),
});

export type ReorderMediaInput = z.infer<typeof reorderMediaSchema>;

// ── Query params ──────────────────────────────────────────────────────────────

export const mediaListQuerySchema = z.object({
  page: z
    .string()
    .optional()
    .transform((v) => (v !== undefined ? parseInt(v, 10) : 1))
    .pipe(z.number().int().min(1)),
  limit: z
    .string()
    .optional()
    .transform((v) => (v !== undefined ? parseInt(v, 10) : MEDIA_DEFAULT_PAGE_SIZE))
    .pipe(z.number().int().min(1).max(MEDIA_MAX_PAGE_SIZE)),
  isActive: z
    .string()
    .optional()
    .transform((v) => (v === 'true' ? true : v === 'false' ? false : undefined)),
  sortBy: z.enum(MEDIA_SORT_FIELDS).default('sortOrder'),
  sortOrder: z.enum(MEDIA_SORT_ORDERS).default('asc'),
});

export type MediaListQueryInput = z.infer<typeof mediaListQuerySchema>;

// ── Path params ───────────────────────────────────────────────────────────────

export const mediaIdParamSchema = z.object({
  id: z.string().cuid('Invalid media wall entry ID'),
});