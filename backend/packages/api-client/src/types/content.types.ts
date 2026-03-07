import { z } from 'zod';

// Blog schema
export const BlogSchema = z.object({
  id: z.string(),
  title: z.string(),
  slug: z.string(),
  excerpt: z.string(),
  content: z.string(),
  featuredImage: z.string().optional(),
  images: z.array(z.string()).optional(),
  category: z.object({
    id: z.string(),
    name: z.string(),
    slug: z.string(),
  }),
  tags: z.array(z.string()).optional(),
  author: z.object({
    id: z.string(),
    name: z.string(),
    avatar: z.string().optional(),
  }),
  status: z.enum(['draft', 'published', 'archived']),
  publishedAt: z.string().datetime().optional(),
  seoTitle: z.string().optional(),
  seoDescription: z.string().optional(),
  readingTime: z.number().optional(),
  viewCount: z.number(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export type Blog = z.infer<typeof BlogSchema>;

export const BlogCategorySchema = z.object({
  id: z.string(),
  name: z.string(),
  slug: z.string(),
  description: z.string().optional(),
  image: z.string().optional(),
  isActive: z.boolean(),
  sortOrder: z.number(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export type BlogCategory = z.infer<typeof BlogCategorySchema>;

export const CreateBlogSchema = z.object({
  title: z.string(),
  excerpt: z.string(),
  content: z.string(),
  featuredImage: z.string().optional(),
  images: z.array(z.string()).optional(),
  categoryId: z.string(),
  tags: z.array(z.string()).optional(),
  status: z.enum(['draft', 'published', 'archived']),
  publishedAt: z.string().datetime().optional(),
  seoTitle: z.string().optional(),
  seoDescription: z.string().optional(),
});

export type CreateBlogRequest = z.infer<typeof CreateBlogSchema>;

export const UpdateBlogSchema = z.object({
  title: z.string().optional(),
  excerpt: z.string().optional(),
  content: z.string().optional(),
  featuredImage: z.string().optional(),
  images: z.array(z.string()).optional(),
  categoryId: z.string().optional(),
  tags: z.array(z.string()).optional(),
  status: z.enum(['draft', 'published', 'archived']).optional(),
  publishedAt: z.string().datetime().optional(),
  seoTitle: z.string().optional(),
  seoDescription: z.string().optional(),
});

export type UpdateBlogRequest = z.infer<typeof UpdateBlogSchema>;

// Media Wall schema
export const MediaItemSchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string().optional(),
  type: z.enum(['image', 'video']),
  url: z.string(),
  thumbnailUrl: z.string().optional(),
  category: z.string().optional(),
  tags: z.array(z.string()).optional(),
  sortOrder: z.number(),
  isActive: z.boolean(),
  metadata: z.record(z.any()).optional(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export type MediaItem = z.infer<typeof MediaItemSchema>;

export const CreateMediaItemSchema = z.object({
  title: z.string(),
  description: z.string().optional(),
  type: z.enum(['image', 'video']),
  url: z.string(),
  thumbnailUrl: z.string().optional(),
  category: z.string().optional(),
  tags: z.array(z.string()).optional(),
  sortOrder: z.number().optional(),
  isActive: z.boolean().default(true),
  metadata: z.record(z.any()).optional(),
});

export type CreateMediaItemRequest = z.infer<typeof CreateMediaItemSchema>;

export const UpdateMediaItemSchema = z.object({
  title: z.string().optional(),
  description: z.string().optional(),
  url: z.string().optional(),
  thumbnailUrl: z.string().optional(),
  category: z.string().optional(),
  tags: z.array(z.string()).optional(),
  sortOrder: z.number().optional(),
  isActive: z.boolean().optional(),
  metadata: z.record(z.any()).optional(),
});

export type UpdateMediaItemRequest = z.infer<typeof UpdateMediaItemSchema>;

// CMS Page schema
export const CmsPageSchema = z.object({
  id: z.string(),
  title: z.string(),
  slug: z.string(),
  content: z.string(),
  template: z.string().optional(),
  metaTitle: z.string().optional(),
  metaDescription: z.string().optional(),
  metaKeywords: z.array(z.string()).optional(),
  ogImage: z.string().optional(),
  isActive: z.boolean(),
  isHomePage: z.boolean(),
  sortOrder: z.number(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export type CmsPage = z.infer<typeof CmsPageSchema>;

export const CreateCmsPageSchema = z.object({
  title: z.string(),
  slug: z.string(),
  content: z.string(),
  template: z.string().optional(),
  metaTitle: z.string().optional(),
  metaDescription: z.string().optional(),
  metaKeywords: z.array(z.string()).optional(),
  ogImage: z.string().optional(),
  isActive: z.boolean().default(true),
  isHomePage: z.boolean().default(false),
  sortOrder: z.number().optional(),
});

export type CreateCmsPageRequest = z.infer<typeof CreateCmsPageSchema>;

export const UpdateCmsPageSchema = z.object({
  title: z.string().optional(),
  slug: z.string().optional(),
  content: z.string().optional(),
  template: z.string().optional(),
  metaTitle: z.string().optional(),
  metaDescription: z.string().optional(),
  metaKeywords: z.array(z.string()).optional(),
  ogImage: z.string().optional(),
  isActive: z.boolean().optional(),
  isHomePage: z.boolean().optional(),
  sortOrder: z.number().optional(),
});

export type UpdateCmsPageRequest = z.infer<typeof UpdateCmsPageSchema>;

// Showroom schema
export const ShowroomSchema = z.object({
  id: z.string(),
  name: z.string(),
  slug: z.string(),
  address: z.object({
    street: z.string(),
    city: z.string(),
    postcode: z.string(),
    country: z.string(),
  }),
  image: z.string().optional(),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  openingHours: z.record(z.object({
    open: z.string(),
    close: z.string(),
    closed: z.boolean(),
  })),
  mapUrl: z.string().optional(),
  coordinates: z.object({
    lat: z.number(),
    lng: z.number(),
  }).optional(),
  features: z.array(z.string()).optional(),
  isActive: z.boolean(),
  sortOrder: z.number(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export type Showroom = z.infer<typeof ShowroomSchema>;

export const CreateShowroomSchema = z.object({
  name: z.string(),
  slug: z.string(),
  address: z.object({
    street: z.string(),
    city: z.string(),
    postcode: z.string(),
    country: z.string(),
  }),
  image: z.string().optional(),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  openingHours: z.record(z.object({
    open: z.string(),
    close: z.string(),
    closed: z.boolean(),
  })),
  mapUrl: z.string().optional(),
  coordinates: z.object({
    lat: z.number(),
    lng: z.number(),
  }).optional(),
  features: z.array(z.string()).optional(),
  isActive: z.boolean().default(true),
  sortOrder: z.number().optional(),
});

export type CreateShowroomRequest = z.infer<typeof CreateShowroomSchema>;

export const UpdateShowroomSchema = z.object({
  name: z.string().optional(),
  slug: z.string().optional(),
  address: z.object({
    street: z.string(),
    city: z.string(),
    postcode: z.string(),
    country: z.string(),
  }).optional(),
  image: z.string().optional(),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  openingHours: z.record(z.object({
    open: z.string(),
    close: z.string(),
    closed: z.boolean(),
  })).optional(),
  mapUrl: z.string().optional(),
  coordinates: z.object({
    lat: z.number(),
    lng: z.number(),
  }).optional(),
  features: z.array(z.string()).optional(),
  isActive: z.boolean().optional(),
  sortOrder: z.number().optional(),
});

export type UpdateShowroomRequest = z.infer<typeof UpdateShowroomSchema>;

// SEO Meta schema
export const SeoMetaSchema = z.object({
  id: z.string(),
  entityType: z.string(),
  entityId: z.string(),
  metaTitle: z.string().optional(),
  metaDescription: z.string().optional(),
  metaKeywords: z.array(z.string()).optional(),
  ogTitle: z.string().optional(),
  ogDescription: z.string().optional(),
  ogImage: z.string().optional(),
  canonicalUrl: z.string().optional(),
  robots: z.string().optional(),
  structuredData: z.record(z.any()).optional(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export type SeoMeta = z.infer<typeof SeoMetaSchema>;

export const UpdateSeoSchema = z.object({
  metaTitle: z.string().optional(),
  metaDescription: z.string().optional(),
  metaKeywords: z.array(z.string()).optional(),
  ogTitle: z.string().optional(),
  ogDescription: z.string().optional(),
  ogImage: z.string().optional(),
  canonicalUrl: z.string().optional(),
  robots: z.string().optional(),
  structuredData: z.record(z.any()).optional(),
});

export type UpdateSeoRequest = z.infer<typeof UpdateSeoSchema>;

// Landing Page schema
export const LandingPageSchema = z.object({
  id: z.string(),
  name: z.string(),
  slug: z.string(),
  title: z.string(),
  description: z.string(),
  template: z.string(),
  content: z.record(z.any()),
  isActive: z.boolean(),
  publishedAt: z.string().datetime().optional(),
  seoTitle: z.string().optional(),
  seoDescription: z.string().optional(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export type LandingPage = z.infer<typeof LandingPageSchema>;

export const CreateLandingPageSchema = z.object({
  name: z.string(),
  slug: z.string(),
  title: z.string(),
  description: z.string(),
  template: z.string(),
  content: z.record(z.any()),
  isActive: z.boolean().default(true),
  publishedAt: z.string().datetime().optional(),
  seoTitle: z.string().optional(),
  seoDescription: z.string().optional(),
});

export type CreateLandingPageRequest = z.infer<typeof CreateLandingPageSchema>;

export const UpdateLandingPageSchema = z.object({
  name: z.string().optional(),
  slug: z.string().optional(),
  title: z.string().optional(),
  description: z.string().optional(),
  template: z.string().optional(),
  content: z.record(z.any()).optional(),
  isActive: z.boolean().optional(),
  publishedAt: z.string().datetime().optional(),
  seoTitle: z.string().optional(),
  seoDescription: z.string().optional(),
});

export type UpdateLandingPageRequest = z.infer<typeof UpdateLandingPageSchema>;
