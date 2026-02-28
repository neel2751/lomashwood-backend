import type { PaginationParams } from "./api.types";

export type BlogPost = {
  id: string;
  title: string;
  slug: string;
  excerpt?: string;
  content: string;
  image?: string;
  author?: string;
  tags?: string[];
  isPublished: boolean;
  publishedAt?: string;
  createdAt: string;
  updatedAt: string;
};

export type MediaWallItem = {
  id: string;
  title: string;
  description?: string;
  mediaUrl: string;
  backgroundImage?: string;
  type: "image" | "video";
  order: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

export type CmsPage = {
  id: string;
  slug: string;
  title: string;
  content: string;
  isPublished: boolean;
  createdAt: string;
  updatedAt: string;
};

export type SeoMeta = {
  id: string;
  pageSlug: string;
  title: string;
  description: string;
  keywords?: string[];
  ogImage?: string;
  canonicalUrl?: string;
  createdAt: string;
  updatedAt: string;
};

export type LandingPageSection = {
  id: string;
  type: string;
  order: number;
  data: Record<string, unknown>;
};

export type LandingPage = {
  id: string;
  slug: string;
  title: string;
  sections: LandingPageSection[];
  isPublished: boolean;
  publishedAt?: string;
  createdAt: string;
  updatedAt: string;
};

export type HomeSliderItem = {
  id: string;
  title: string;
  description?: string;
  image: string;
  buttonName: string;
  buttonLink?: string;
  order: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

export type FinancePage = {
  id: string;
  title: string;
  description: string;
  content: string;
  updatedAt: string;
};

export type FaqItem = {
  id: string;
  question: string;
  answer: string;
  order: number;
  isPublished: boolean;
  createdAt: string;
  updatedAt: string;
};

export type Logo = {
  id: string;
  name: string;
  imageUrl: string;
  order: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

export type Accreditation = {
  id: string;
  name: string;
  imageUrl: string;
  link?: string;
  order: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

export type NewsletterSubscriber = {
  id: string;
  email: string;
  name?: string;
  isActive: boolean;
  subscribedAt: string;
};

export type CreateBlogPostPayload = {
  title: string;
  slug: string;
  excerpt?: string;
  content: string;
  image?: string;
  author?: string;
  tags?: string[];
  isPublished?: boolean;
  publishedAt?: string;
};

export type UpdateBlogPostPayload = Partial<CreateBlogPostPayload>;

export type CreateCmsPagePayload = {
  slug: string;
  title: string;
  content: string;
  isPublished?: boolean;
};

export type UpsertSeoPayload = {
  title: string;
  description: string;
  keywords?: string[];
  ogImage?: string;
  canonicalUrl?: string;
};

export type CreateLandingPagePayload = {
  slug: string;
  title: string;
  sections?: LandingPageSection[];
  isPublished?: boolean;
};

export type CreateMediaWallItemPayload = {
  title: string;
  description?: string;
  type: "image" | "video";
};

export type BlogFilterParams = PaginationParams & {
  search?: string;
  isPublished?: boolean;
  tag?: string;
  author?: string;
  startDate?: string;
  endDate?: string;
};

export type LandingPageFilterParams = PaginationParams & {
  search?: string;
  isPublished?: boolean;
};