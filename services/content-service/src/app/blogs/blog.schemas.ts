import { z } from 'zod';

import {
  BLOG_TITLE_MAX_LENGTH,
  BLOG_SLUG_MAX_LENGTH,
  BLOG_EXCERPT_MAX_LENGTH,
  BLOG_DEFAULT_PAGE_SIZE,
  BLOG_MAX_PAGE_SIZE,
  BLOG_SORT_FIELDS,
  BLOG_SORT_ORDERS,
} from './blog.constants';

const BlogStatus = {
  DRAFT: 'DRAFT',
  PUBLISHED: 'PUBLISHED',
  ARCHIVED: 'ARCHIVED',
} as const;

const slugSchema = z
  .string()
  .min(1, 'Slug is required')
  .max(BLOG_SLUG_MAX_LENGTH)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Slug must be lowercase alphanumeric with hyphens only')
  .trim();

const titleSchema = z
  .string()
  .min(1, 'Title is required')
  .max(BLOG_TITLE_MAX_LENGTH)
  .trim();

const blogStatusSchema = z.nativeEnum(BlogStatus);

export const createBlogSchema = z.object({
  title: titleSchema,
  slug: slugSchema,
  excerpt: z.string().max(BLOG_EXCERPT_MAX_LENGTH).trim().optional(),
  content: z.string().min(1, 'Content is required'),
  coverImage: z.string().url('Cover image must be a valid URL').optional(),
  status: blogStatusSchema.default('DRAFT'),
  categoryId: z.string().cuid('Invalid category ID').optional(),
  tagIds: z.array(z.string().cuid('Invalid tag ID')).max(10).default([]),
  isFeatured: z.boolean().default(false),
});

export type CreateBlogInput = z.infer<typeof createBlogSchema>;

export const updateBlogSchema = z
  .object({
    title: titleSchema.optional(),
    slug: slugSchema.optional(),
    excerpt: z.string().max(BLOG_EXCERPT_MAX_LENGTH).trim().nullable().optional(),
    content: z.string().min(1).optional(),
    coverImage: z.string().url().nullable().optional(),
    status: blogStatusSchema.optional(),
    categoryId: z.string().cuid().nullable().optional(),
    tagIds: z.array(z.string().cuid()).max(10).optional(),
    isFeatured: z.boolean().optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: 'At least one field must be provided for update',
  });

export type UpdateBlogInput = z.infer<typeof updateBlogSchema>;

export const blogListQuerySchema = z.object({
  page: z
    .string()
    .optional()
    .transform((v) => (v !== undefined ? parseInt(v, 10) : 1))
    .pipe(z.number().int().min(1)),
  limit: z
    .string()
    .optional()
    .transform((v) => (v !== undefined ? parseInt(v, 10) : BLOG_DEFAULT_PAGE_SIZE))
    .pipe(z.number().int().min(1).max(BLOG_MAX_PAGE_SIZE)),
  status: blogStatusSchema.optional(),
  categoryId: z.string().cuid().optional(),
  tagId: z.string().cuid().optional(),
  isFeatured: z
    .string()
    .optional()
    .transform((v) => (v === 'true' ? true : v === 'false' ? false : undefined)),
  search: z.string().trim().min(1).max(100).optional(),
  sortBy: z.enum(BLOG_SORT_FIELDS).default('publishedAt'),
  sortOrder: z.enum(BLOG_SORT_ORDERS).default('desc'),
});

export type BlogListQueryInput = z.infer<typeof blogListQuerySchema>;

export const blogIdParamSchema = z.object({
  id: z.string().cuid('Invalid blog ID'),
});

export const blogSlugParamSchema = z.object({
  slug: slugSchema,
});