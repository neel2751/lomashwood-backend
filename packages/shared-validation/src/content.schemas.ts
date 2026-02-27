import { z } from "zod";

export const BlogStatusEnum = z.enum(["DRAFT", "PUBLISHED", "ARCHIVED"]);

export const BlogSchema = z.object({
  title: z.string().min(5).max(255).trim(),
  slug: z
    .string()
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)
    .max(255)
    .optional(),
  excerpt: z.string().min(20).max(500).trim(),
  content: z.string().min(50),
  featuredImage: z.string().url(),
  images: z.array(z.string().url()).optional().default([]),
  status: BlogStatusEnum.optional().default("DRAFT"),
  publishedAt: z.coerce.date().optional().nullable(),
  tags: z.array(z.string().max(50)).optional().default([]),
  metaTitle: z.string().max(160).optional(),
  metaDescription: z.string().max(320).optional(),
  authorId: z.string().uuid().optional(),
});

export const BlogUpdateSchema = BlogSchema.partial();

export const BlogFilterSchema = z.object({
  status: BlogStatusEnum.optional(),
  tag: z.string().optional(),
  authorId: z.string().uuid().optional(),
  search: z.string().max(255).optional(),
  dateFrom: z.coerce.date().optional(),
  dateTo: z.coerce.date().optional(),
  page: z.coerce.number().int().positive().optional().default(1),
  limit: z.coerce.number().int().min(1).max(100).optional().default(10),
  sortBy: z
    .enum(["published_asc", "published_desc", "created_desc", "views_desc"])
    .optional()
    .default("published_desc"),
});

export const MediaSchema = z.object({
  title: z.string().min(2).max(255).trim(),
  description: z.string().max(2000).trim().optional(),
  mediaType: z.enum(["IMAGE", "VIDEO"]),
  url: z.string().url(),
  thumbnailUrl: z.string().url().optional(),
  altText: z.string().max(255).optional(),
  isActive: z.boolean().optional().default(true),
  order: z.number().int().min(0).optional().default(0),
  tags: z.array(z.string().max(50)).optional().default([]),
});

export const MediaUpdateSchema = MediaSchema.partial();

export const MediaWallSchema = z.object({
  title: z.string().min(2).max(255).trim(),
  description: z.string().max(2000).trim().optional(),
  backgroundImage: z.string().url().optional(),
  ctaText: z.string().max(100).optional(),
  ctaUrl: z.string().max(500).optional(),
  mediaItems: z.array(z.string().uuid()).optional().default([]),
  isActive: z.boolean().optional().default(true),
});

export const PageStatusEnum = z.enum(["DRAFT", "PUBLISHED", "ARCHIVED"]);

export const CmsPageSchema = z.object({
  title: z.string().min(2).max(255).trim(),
  slug: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/).max(255),
  content: z.string().optional(),
  status: PageStatusEnum.optional().default("DRAFT"),
  template: z.string().max(100).optional(),
  metaTitle: z.string().max(160).optional(),
  metaDescription: z.string().max(320).optional(),
  isHomePage: z.boolean().optional().default(false),
});

export const CmsPageUpdateSchema = CmsPageSchema.partial();

export const SeoSchema = z.object({
  entityType: z.enum(["PRODUCT", "BLOG", "PAGE", "CATEGORY"]),
  entityId: z.string().uuid(),
  metaTitle: z.string().max(160).trim(),
  metaDescription: z.string().max(320).trim(),
  canonicalUrl: z.string().url().optional(),
  ogTitle: z.string().max(160).optional(),
  ogDescription: z.string().max(320).optional(),
  ogImage: z.string().url().optional(),
  structuredData: z.record(z.unknown()).optional(),
  noIndex: z.boolean().optional().default(false),
  noFollow: z.boolean().optional().default(false),
});

export const SeoUpdateSchema = SeoSchema.partial().omit({
  entityType: true,
  entityId: true,
});

export const HomeSliderSchema = z.object({
  image: z.string().url(),
  title: z.string().min(2).max(255).trim(),
  description: z.string().max(1000).trim().optional(),
  buttonName: z.string().max(100).trim().optional(),
  buttonUrl: z.string().max(500).optional(),
  order: z.number().int().min(0).optional().default(0),
  isActive: z.boolean().optional().default(true),
});

export const HomeSliderUpdateSchema = HomeSliderSchema.partial();

export const FinanceContentSchema = z.object({
  title: z.string().min(2).max(255).trim(),
  description: z.string().max(2000).trim(),
  content: z.string().min(10),
  isActive: z.boolean().optional().default(true),
  metaTitle: z.string().max(160).optional(),
  metaDescription: z.string().max(320).optional(),
});

export const FinanceContentUpdateSchema = FinanceContentSchema.partial();

export const ShowroomSchema = z.object({
  name: z.string().min(2).max(255).trim(),
  addressLine1: z.string().min(5).max(255).trim(),
  addressLine2: z.string().max(255).trim().optional(),
  city: z.string().min(2).max(100).trim(),
  county: z.string().max(100).trim().optional(),
  postcode: z.string().min(3).max(10).trim().toUpperCase(),
  image: z.string().url(),
  email: z.string().email().toLowerCase().trim(),
  phone: z.string().regex(/^\+?[1-9]\d{7,14}$/),
  openingHours: z.record(
    z.enum(["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"]),
    z.string().max(100)
  ),
  mapLink: z.string().url(),
  latitude: z.number().min(-90).max(90).optional(),
  longitude: z.number().min(-180).max(180).optional(),
  isActive: z.boolean().optional().default(true),
  metaTitle: z.string().max(160).optional(),
  metaDescription: z.string().max(320).optional(),
});

export const ShowroomUpdateSchema = ShowroomSchema.partial();

export const ShowroomFilterSchema = z.object({
  search: z.string().max(255).optional(),
  city: z.string().optional(),
  county: z.string().optional(),
  isActive: z.coerce.boolean().optional(),
  page: z.coerce.number().int().positive().optional().default(1),
  limit: z.coerce.number().int().min(1).max(100).optional().default(20),
});

export const LandingPageSchema = z.object({
  title: z.string().min(2).max(255).trim(),
  slug: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/).max(255),
  content: z.record(z.unknown()),
  isActive: z.boolean().optional().default(true),
  metaTitle: z.string().max(160).optional(),
  metaDescription: z.string().max(320).optional(),
});

export const LandingPageUpdateSchema = LandingPageSchema.partial();

export type BlogStatusEnumType = z.infer<typeof BlogStatusEnum>;
export type BlogInput = z.infer<typeof BlogSchema>;
export type BlogUpdateInput = z.infer<typeof BlogUpdateSchema>;
export type BlogFilterInput = z.infer<typeof BlogFilterSchema>;
export type MediaInput = z.infer<typeof MediaSchema>;
export type MediaUpdateInput = z.infer<typeof MediaUpdateSchema>;
export type MediaWallInput = z.infer<typeof MediaWallSchema>;
export type CmsPageInput = z.infer<typeof CmsPageSchema>;
export type CmsPageUpdateInput = z.infer<typeof CmsPageUpdateSchema>;
export type SeoInput = z.infer<typeof SeoSchema>;
export type SeoUpdateInput = z.infer<typeof SeoUpdateSchema>;
export type HomeSliderInput = z.infer<typeof HomeSliderSchema>;
export type HomeSliderUpdateInput = z.infer<typeof HomeSliderUpdateSchema>;
export type FinanceContentInput = z.infer<typeof FinanceContentSchema>;
export type FinanceContentUpdateInput = z.infer<typeof FinanceContentUpdateSchema>;
export type ShowroomInput = z.infer<typeof ShowroomSchema>;
export type ShowroomUpdateInput = z.infer<typeof ShowroomUpdateSchema>;
export type ShowroomFilterInput = z.infer<typeof ShowroomFilterSchema>;
export type LandingPageInput = z.infer<typeof LandingPageSchema>;
export type LandingPageUpdateInput = z.infer<typeof LandingPageUpdateSchema>;