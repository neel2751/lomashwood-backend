import { z } from 'zod';

import {
  SEO_ENTITY_TYPES,
  SEO_ROBOTS_VALUES,
  SEO_META_TITLE_MAX_LENGTH,
  SEO_META_DESCRIPTION_MAX_LENGTH,
  SEO_OG_TITLE_MAX_LENGTH,
  SEO_OG_DESCRIPTION_MAX_LENGTH,
  SEO_CANONICAL_URL_MAX_LENGTH,
  SEO_DEFAULT_PAGE_SIZE,
  SEO_MAX_PAGE_SIZE,
} from './seo.constants';



const entityTypeSchema = z.enum(SEO_ENTITY_TYPES, {
  errorMap: () => ({
    message: `entityType must be one of: ${SEO_ENTITY_TYPES.join(', ')}`,
  }),
});

const robotsSchema = z.enum(SEO_ROBOTS_VALUES, {
  errorMap: () => ({
    message: `robots must be one of: ${SEO_ROBOTS_VALUES.join(', ')}`,
  }),
});

const metaTitleSchema = z
  .string()
  .max(
    SEO_META_TITLE_MAX_LENGTH,
    `Meta title must not exceed ${SEO_META_TITLE_MAX_LENGTH} characters`,
  )
  .trim();

const metaDescriptionSchema = z
  .string()
  .max(
    SEO_META_DESCRIPTION_MAX_LENGTH,
    `Meta description must not exceed ${SEO_META_DESCRIPTION_MAX_LENGTH} characters`,
  )
  .trim();

const ogTitleSchema = z
  .string()
  .max(SEO_OG_TITLE_MAX_LENGTH, `OG title must not exceed ${SEO_OG_TITLE_MAX_LENGTH} characters`)
  .trim();

const ogDescriptionSchema = z
  .string()
  .max(
    SEO_OG_DESCRIPTION_MAX_LENGTH,
    `OG description must not exceed ${SEO_OG_DESCRIPTION_MAX_LENGTH} characters`,
  )
  .trim();

const canonicalUrlSchema = z
  .string()
  .url('Canonical URL must be a valid absolute URL')
  .max(SEO_CANONICAL_URL_MAX_LENGTH);



export const upsertSeoSchema = z.object({
  entityType: entityTypeSchema,
  entityId: z.string().min(1, 'entityId is required'),
  metaTitle: metaTitleSchema.optional(),
  metaDescription: metaDescriptionSchema.optional(),
  ogTitle: ogTitleSchema.optional(),
  ogDescription: ogDescriptionSchema.optional(),
  ogImage: z.string().url('OG image must be a valid URL').optional(),
  canonicalUrl: canonicalUrlSchema.optional(),
  robots: robotsSchema.optional(),
});

export type UpsertSeoInput = z.infer<typeof upsertSeoSchema>;



export const updateSeoSchema = z
  .object({
    metaTitle: metaTitleSchema.nullable().optional(),
    metaDescription: metaDescriptionSchema.nullable().optional(),
    ogTitle: ogTitleSchema.nullable().optional(),
    ogDescription: ogDescriptionSchema.nullable().optional(),
    ogImage: z.string().url().nullable().optional(),
    canonicalUrl: canonicalUrlSchema.nullable().optional(),
    robots: robotsSchema.optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: 'At least one field must be provided for update',
  });

export type UpdateSeoInput = z.infer<typeof updateSeoSchema>;



export const seoListQuerySchema = z.object({
  page: z
    .string()
    .optional()
    .transform((v) => (v !== undefined ? parseInt(v, 10) : 1))
    .pipe(z.number().int().min(1)),
  limit: z
    .string()
    .optional()
    .transform((v) => (v !== undefined ? parseInt(v, 10) : SEO_DEFAULT_PAGE_SIZE))
    .pipe(z.number().int().min(1).max(SEO_MAX_PAGE_SIZE)),
  entityType: entityTypeSchema.optional(),
  search: z.string().trim().min(1).max(100).optional(),
});

export type SeoListQueryInput = z.infer<typeof seoListQuerySchema>;



export const seoIdParamSchema = z.object({
  id: z.string().cuid('Invalid SEO meta ID'),
});

export const seoEntityParamSchema = z.object({
  entityType: entityTypeSchema,
  entityId: z.string().min(1, 'entityId is required'),
});