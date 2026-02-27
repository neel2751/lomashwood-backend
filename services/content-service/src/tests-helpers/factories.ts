import { v4 as uuidv4 } from 'uuid';
import type {
  BlogDTO,
  BlogSummaryDTO,
  CmsPageDTO,
  MediaDTO,
  SeoMetaDTO,
  LandingPageDTO,
  AuthenticatedUser,
  ThumbnailDTO,
  CreateBlogInput,
  UpdateBlogInput,
  CreatePageInput,
  CreateSeoInput,
  CreateLandingInput,
} from '../shared/types';
import {
  BLOG,
  CMS_PAGE,
  MEDIA,
  SEO,
  LANDING,
} from '../shared/constants';

const id = () => uuidv4();
const now = () => new Date().toISOString();
const past = (daysAgo = 7) =>
  new Date(Date.now() - daysAgo * 86_400_000).toISOString();
const future = (daysAhead = 7) =>
  new Date(Date.now() + daysAhead * 86_400_000).toISOString();

let _slugCounter = 0;
const slug = (prefix = 'item') => `${prefix}-${++_slugCounter}-${Date.now()}`;

export function makeAdminUser(
  overrides: Partial<AuthenticatedUser> = {},
): AuthenticatedUser {
  return {
    id: id(),
    email: 'admin@lomashwood.com',
    role: 'ADMIN',
    firstName: 'Admin',
    lastName: 'User',
    ...overrides,
  };
}

export function makeEditorUser(
  overrides: Partial<AuthenticatedUser> = {},
): AuthenticatedUser {
  return {
    id: id(),
    email: 'editor@lomashwood.com',
    role: 'EDITOR',
    firstName: 'Editor',
    lastName: 'User',
    ...overrides,
  };
}

export function makeCustomerUser(
  overrides: Partial<AuthenticatedUser> = {},
): AuthenticatedUser {
  return {
    id: id(),
    email: 'customer@example.com',
    role: 'CUSTOMER',
    firstName: 'John',
    lastName: 'Doe',
    ...overrides,
  };
}

export function makeSeoMetaDTO(
  overrides: Partial<SeoMetaDTO> = {},
): SeoMetaDTO {
  const entityId = id();
  return {
    id: id(),
    entityType: 'BLOG',
    entityId,
    metaTitle: 'Test Meta Title | Lomash Wood',
    metaDescription: 'A short meta description for testing purposes only.',
    canonicalUrl: `https://lomashwood.com/inspiration/test-slug`,
    ogTitle: 'Test OG Title',
    ogDescription: 'Test OG description.',
    ogImageUrl: 'https://cdn.lomashwood.com/content/blog/test/hero.webp',
    twitterTitle: 'Test Twitter Title',
    twitterDescription: 'Test Twitter description.',
    twitterImageUrl: 'https://cdn.lomashwood.com/content/blog/test/hero.webp',
    structuredData: null,
    robotsDirective: SEO.ROBOTS.INDEX_FOLLOW,
    updatedAt: now(),
    ...overrides,
  };
}

export function makeCreateSeoInput(
  overrides: Partial<CreateSeoInput> = {},
): CreateSeoInput {
  return {
    entityType: 'BLOG',
    entityId: id(),
    metaTitle: 'Test SEO Title | Lomash Wood',
    metaDescription: 'A concise meta description for test purposes.',
    canonicalUrl: 'https://lomashwood.com/inspiration/test-post',
    ogTitle: 'Test OG Title',
    ogDescription: 'Test OG description.',
    ogImageUrl: 'https://cdn.lomashwood.com/test/og.webp',
    robotsDirective: SEO.ROBOTS.INDEX_FOLLOW,
    ...overrides,
  };
}

export function makeBlogDTO(overrides: Partial<BlogDTO> = {}): BlogDTO {
  const authorId = id();
  const blogSlug = slug('kitchen-design');
  const publishedAt = past(3);

  return {
    id: id(),
    slug: blogSlug,
    title: 'Top 10 Kitchen Design Trends for 2025',
    excerpt: 'Discover the latest kitchen design trends shaping modern homes.',
    heroImageUrl: `https://cdn.lomashwood.com/content/blog/${blogSlug}/hero.webp`,
    images: [
      `https://cdn.lomashwood.com/content/blog/${blogSlug}/image-1.webp`,
      `https://cdn.lomashwood.com/content/blog/${blogSlug}/image-2.webp`,
    ],
    content: '<p>This is the full blog post content for testing purposes.</p>',
    tags: ['kitchen', 'design', 'trends'],
    category: BLOG.CATEGORY.KITCHEN,
    status: BLOG.STATUS.PUBLISHED,
    readTimeMinutes: 5,
    authorId,
    authorName: 'Jane Smith',
    publishedAt,
    scheduledAt: null,
    seo: makeSeoMetaDTO({ entityType: 'BLOG' }),
    createdAt: past(10),
    updatedAt: past(3),
    ...overrides,
  };
}

export function makeBlogSummaryDTO(
  overrides: Partial<BlogSummaryDTO> = {},
): BlogSummaryDTO {
  const blogSlug = slug('blog-summary');
  return {
    id: id(),
    slug: blogSlug,
    title: 'Bedroom Design Inspiration for Modern Living',
    excerpt: 'Transform your bedroom with these expert-approved design ideas.',
    heroImageUrl: `https://cdn.lomashwood.com/content/blog/${blogSlug}/hero.webp`,
    tags: ['bedroom', 'design', 'inspiration'],
    category: BLOG.CATEGORY.BEDROOM,
    status: BLOG.STATUS.PUBLISHED,
    readTimeMinutes: 3,
    authorName: 'Jane Smith',
    publishedAt: past(5),
    createdAt: past(8),
    ...overrides,
  };
}

export function makeDraftBlogDTO(overrides: Partial<BlogDTO> = {}): BlogDTO {
  return makeBlogDTO({
    status: BLOG.STATUS.DRAFT,
    publishedAt: null,
    scheduledAt: null,
    ...overrides,
  });
}

export function makeScheduledBlogDTO(overrides: Partial<BlogDTO> = {}): BlogDTO {
  return makeBlogDTO({
    status: BLOG.STATUS.SCHEDULED,
    publishedAt: null,
    scheduledAt: future(2),
    ...overrides,
  });
}

export function makeCreateBlogInput(
  overrides: Partial<CreateBlogInput> = {},
): CreateBlogInput {
  return {
    title: 'A Brand New Kitchen Design Post',
    slug: slug('new-kitchen-post'),
    excerpt: 'Short excerpt for the new blog post.',
    content: '<p>Full content of the new blog post goes here.</p>',
    heroImageUrl: 'https://cdn.lomashwood.com/content/blog/new/hero.webp',
    images: [],
    tags: ['kitchen', 'new'],
    category: BLOG.CATEGORY.KITCHEN,
    status: BLOG.STATUS.DRAFT,
    ...overrides,
  };
}

export function makeUpdateBlogInput(
  overrides: Partial<UpdateBlogInput> = {},
): UpdateBlogInput {
  return {
    title: 'Updated Kitchen Design Post Title',
    excerpt: 'Updated excerpt content.',
    tags: ['kitchen', 'updated'],
    ...overrides,
  };
}

export function makeCmsPageDTO(
  overrides: Partial<CmsPageDTO> = {},
): CmsPageDTO {
  const pageSlug = slug('cms-page');
  return {
    id: id(),
    slug: pageSlug,
    title: 'Finance Options for Your New Kitchen',
    description: 'Explore flexible finance options available at Lomash Wood.',
    heroImageUrl: `https://cdn.lomashwood.com/content/page/${pageSlug}/hero.webp`,
    images: [],
    content: '<p>Finance page content for testing.</p>',
    pageType: CMS_PAGE.TYPE.FINANCE,
    status: CMS_PAGE.STATUS.PUBLISHED,
    isIndexable: true,
    seo: makeSeoMetaDTO({ entityType: 'PAGE' }),
    publishedAt: past(14),
    createdAt: past(30),
    updatedAt: past(14),
    ...overrides,
  };
}

export function makeCreatePageInput(
  overrides: Partial<CreatePageInput> = {},
): CreatePageInput {
  return {
    slug: slug('new-page'),
    title: 'New CMS Page Title',
    description: 'Brief description of the new page.',
    content: '<p>New page content goes here.</p>',
    pageType: CMS_PAGE.TYPE.CUSTOM,
    status: CMS_PAGE.STATUS.DRAFT,
    isIndexable: true,
    ...overrides,
  };
}

export function makeThumbnailDTO(
  overrides: Partial<ThumbnailDTO> = {},
): ThumbnailDTO {
  return {
    widthPx: 640,
    url: 'https://cdn.lomashwood.com/content/blog/test/hero-640.webp',
    ...overrides,
  };
}

export function makeMediaDTO(overrides: Partial<MediaDTO> = {}): MediaDTO {
  const mediaId = id();
  const entityId = id();
  return {
    id: mediaId,
    entityType: MEDIA.ENTITY_TYPE.BLOG,
    entityId,
    url: `https://cdn.lomashwood.com/content/blog/${entityId}/hero.webp`,
    s3Key: `content/blog/${entityId}/hero.webp`,
    filename: 'hero.webp',
    mimeType: 'image/webp',
    fileType: MEDIA.FILE_TYPE.IMAGE,
    sizeBytes: 250_000,
    widthPx: 1920,
    heightPx: 1080,
    durationSeconds: null,
    altText: 'Beautiful kitchen design showcase',
    thumbnails: [
      makeThumbnailDTO({ widthPx: 320, url: `https://cdn.lomashwood.com/content/blog/${entityId}/hero-320.webp` }),
      makeThumbnailDTO({ widthPx: 640, url: `https://cdn.lomashwood.com/content/blog/${entityId}/hero-640.webp` }),
      makeThumbnailDTO({ widthPx: 1024, url: `https://cdn.lomashwood.com/content/blog/${entityId}/hero-1024.webp` }),
    ],
    uploadedBy: id(),
    uploadedAt: past(1),
    createdAt: past(1),
    ...overrides,
  };
}

export function makeVideoMediaDTO(overrides: Partial<MediaDTO> = {}): MediaDTO {
  const entityId = id();
  return makeMediaDTO({
    entityType: MEDIA.ENTITY_TYPE.MEDIA_WALL,
    entityId,
    url: `https://cdn.lomashwood.com/content/media-wall/${entityId}/showcase.mp4`,
    s3Key: `content/media-wall/${entityId}/showcase.mp4`,
    filename: 'showcase.mp4',
    mimeType: 'video/mp4',
    fileType: MEDIA.FILE_TYPE.VIDEO,
    sizeBytes: 15_000_000,
    widthPx: 1920,
    heightPx: 1080,
    durationSeconds: 45,
    altText: null,
    thumbnails: [],
    ...overrides,
  });
}

export function makeLandingPageDTO(
  overrides: Partial<LandingPageDTO> = {},
): LandingPageDTO {
  const landingSlug = slug('landing');
  return {
    id: id(),
    slug: landingSlug,
    title: 'Kitchen Design Specialists — Lomash Wood',
    description: 'Expert kitchen and bedroom design tailored to your home.',
    heroImageUrl: `https://cdn.lomashwood.com/content/landing/${landingSlug}/hero.webp`,
    images: [],
    content: '<p>Landing page content for testing.</p>',
    status: LANDING.STATUS.PUBLISHED,
    isIndexable: true,
    seo: makeSeoMetaDTO({ entityType: 'LANDING' }),
    publishedAt: past(7),
    createdAt: past(20),
    updatedAt: past(7),
    ...overrides,
  };
}

export function makeCreateLandingInput(
  overrides: Partial<CreateLandingInput> = {},
): CreateLandingInput {
  return {
    slug: slug('new-landing'),
    title: 'New Landing Page',
    description: 'Brief description of the landing page.',
    content: '<p>Landing page content.</p>',
    status: LANDING.STATUS.DRAFT,
    isIndexable: true,
    ...overrides,
  };
}

export function makePrismaBlog(overrides: Record<string, unknown> = {}) {
  const blogId = id();
  const authorId = id();
  const blogSlug = slug('prisma-blog');
  return {
    id: blogId,
    slug: blogSlug,
    title: 'Prisma Test Blog Post',
    excerpt: 'Excerpt for Prisma test blog.',
    heroImageUrl: null,
    images: [],
    content: 'Raw blog content.',
    tags: ['test'],
    category: 'KITCHEN',
    status: 'PUBLISHED',
    readTimeMinutes: 2,
    authorId,
    publishedAt: new Date(Date.now() - 3 * 86_400_000),
    scheduledAt: null,
    publishFailReason: null,
    deletedAt: null,
    createdAt: new Date(Date.now() - 10 * 86_400_000),
    updatedAt: new Date(Date.now() - 3 * 86_400_000),
    ...overrides,
  };
}

export function makePrismaCmsPage(overrides: Record<string, unknown> = {}) {
  return {
    id: id(),
    slug: slug('prisma-page'),
    title: 'Prisma Test CMS Page',
    description: 'CMS page for Prisma testing.',
    heroImageUrl: null,
    images: [],
    content: 'Raw page content.',
    pageType: 'FINANCE',
    status: 'PUBLISHED',
    isIndexable: true,
    publishedAt: new Date(Date.now() - 14 * 86_400_000),
    deletedAt: null,
    createdAt: new Date(Date.now() - 30 * 86_400_000),
    updatedAt: new Date(Date.now() - 14 * 86_400_000),
    ...overrides,
  };
}

export function makePrismaMedia(overrides: Record<string, unknown> = {}) {
  const entityId = id();
  return {
    id: id(),
    entityType: 'BLOG',
    entityId,
    url: `https://cdn.lomashwood.com/content/blog/${entityId}/hero.webp`,
    s3Key: `content/blog/${entityId}/hero.webp`,
    filename: 'hero.webp',
    mimeType: 'image/webp',
    fileType: 'IMAGE',
    sizeBytes: 250000,
    widthPx: 1920,
    heightPx: 1080,
    durationSeconds: null,
    altText: null,
    uploadedBy: id(),
    uploadedAt: new Date(),
    deletedAt: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

export function makeBlogList(count = 5, overrides: Partial<BlogSummaryDTO> = {}): BlogSummaryDTO[] {
  return Array.from({ length: count }, () => makeBlogSummaryDTO(overrides));
}

export function makeMediaList(count = 3, overrides: Partial<MediaDTO> = {}): MediaDTO[] {
  return Array.from({ length: count }, () => makeMediaDTO(overrides));
}