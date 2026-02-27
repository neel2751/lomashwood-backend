import { jest } from '@jest/globals';
import type { PrismaClient } from '@prisma/client';
import type { PaginatedResult } from '../shared/types';
import type { IEventProducer } from '../events/blog-published.event';
import type { ISearchIndexClient } from '../jobs/rebuild-search-index.job';
import {
  makeBlogDTO,
  makeBlogSummaryDTO,
  makeCmsPageDTO,
  makeMediaDTO,
  makeSeoMetaDTO,
  makeLandingPageDTO,
  makePrismaBlog,
  makePrismaCmsPage,
  makePrismaMedia,
} from './factories';

const j: any = jest;

type DeepMockProxy<T> = {
  [K in keyof T]: T[K] extends (...args: infer A) => infer R
    ? jest.MockedFunction<(...args: A) => R>
    : T[K] extends object
    ? DeepMockProxy<T[K]>
    : T[K];
};

export function createPrismaMock(): DeepMockProxy<PrismaClient> {
  const prismaMock: any = {
    blog: {
      findMany: j.fn().mockResolvedValue([makePrismaBlog()]),
      findFirst: j.fn().mockResolvedValue(makePrismaBlog()),
      findUnique: j.fn().mockResolvedValue(makePrismaBlog()),
      create: j.fn().mockResolvedValue(makePrismaBlog()),
      update: j.fn().mockResolvedValue(makePrismaBlog()),
      updateMany: j.fn().mockResolvedValue({ count: 1 }),
      delete: j.fn().mockResolvedValue(makePrismaBlog()),
      deleteMany: j.fn().mockResolvedValue({ count: 1 }),
      count: j.fn().mockResolvedValue(10),
    },
    cmsPage: {
      findMany: j.fn().mockResolvedValue([makePrismaCmsPage()]),
      findFirst: j.fn().mockResolvedValue(makePrismaCmsPage()),
      findUnique: j.fn().mockResolvedValue(makePrismaCmsPage()),
      create: j.fn().mockResolvedValue(makePrismaCmsPage()),
      update: j.fn().mockResolvedValue(makePrismaCmsPage()),
      updateMany: j.fn().mockResolvedValue({ count: 1 }),
      delete: j.fn().mockResolvedValue(makePrismaCmsPage()),
      deleteMany: j.fn().mockResolvedValue({ count: 1 }),
      count: j.fn().mockResolvedValue(5),
    },
    media: {
      findMany: j.fn().mockResolvedValue([makePrismaMedia()]),
      findFirst: j.fn().mockResolvedValue(makePrismaMedia()),
      findUnique: j.fn().mockResolvedValue(makePrismaMedia()),
      create: j.fn().mockResolvedValue(makePrismaMedia()),
      update: j.fn().mockResolvedValue(makePrismaMedia()),
      updateMany: j.fn().mockResolvedValue({ count: 1 }),
      delete: j.fn().mockResolvedValue(makePrismaMedia()),
      deleteMany: j.fn().mockResolvedValue({ count: 1 }),
      count: j.fn().mockResolvedValue(8),
    },
    seoMeta: {
      findFirst: j.fn().mockResolvedValue(null),
      findUnique: j.fn().mockResolvedValue(null),
      create: j.fn().mockResolvedValue({}),
      update: j.fn().mockResolvedValue({}),
      upsert: j.fn().mockResolvedValue({}),
      delete: j.fn().mockResolvedValue({}),
    },
    landingPage: {
      findMany: j.fn().mockResolvedValue([]),
      findFirst: j.fn().mockResolvedValue(null),
      findUnique: j.fn().mockResolvedValue(null),
      create: j.fn().mockResolvedValue({}),
      update: j.fn().mockResolvedValue({}),
      delete: j.fn().mockResolvedValue({}),
      count: j.fn().mockResolvedValue(0),
    },
    product: {
      findMany: j.fn().mockResolvedValue([]),
      count: j.fn().mockResolvedValue(0),
    },
    showroom: {
      findMany: j.fn().mockResolvedValue([]),
      count: j.fn().mockResolvedValue(0),
    },
    $transaction: j.fn().mockImplementation(async (fn: (tx: unknown) => Promise<unknown>) => fn(prismaMock)),
    $queryRaw: j.fn().mockResolvedValue([{ 1: 1 }]),
    $connect: j.fn().mockResolvedValue(undefined),
    $disconnect: j.fn().mockResolvedValue(undefined),
    $on: j.fn(),
  } as unknown as DeepMockProxy<PrismaClient>;

  return prismaMock;
}

export function createEventProducerMock(): jest.Mocked<IEventProducer> {
  return {
    publish: j.fn().mockResolvedValue(undefined),
  } as unknown as jest.Mocked<IEventProducer>;
}

export function createSearchClientMock(): jest.Mocked<ISearchIndexClient> {
  return {
    upsertDocuments: j.fn().mockResolvedValue(undefined),
    deleteDocuments: j.fn().mockResolvedValue(undefined),
    clearIndex:      j.fn().mockResolvedValue(undefined),
    getIndexedIds:   j.fn().mockResolvedValue([]),
  } as unknown as jest.Mocked<ISearchIndexClient>;
}

export function createRedisMock() {
  const store = new Map<string, string>();

  return {
    get:    j.fn().mockImplementation(async (key: string) => store.get(key) ?? null),
    set:    j.fn().mockImplementation(async (key: string, value: string) => { store.set(key, value); return 'OK'; }),
    setex:  j.fn().mockImplementation(async (key: string, _ttl: number, value: string) => { store.set(key, value); return 'OK'; }),
    del:    j.fn().mockImplementation(async (key: string) => { store.delete(key); return 1; }),
    exists: j.fn().mockImplementation(async (key: string) => (store.has(key) ? 1 : 0)),
    keys:   j.fn().mockImplementation(async (pattern: string) => {
      const prefix = pattern.replace('*', '');
      return [...store.keys()].filter((k) => k.startsWith(prefix));
    }),
    flushall: j.fn().mockImplementation(async () => { store.clear(); return 'OK'; }),
    ping:     j.fn().mockResolvedValue('PONG'),
    quit:     j.fn().mockResolvedValue('OK'),
    connect:  j.fn().mockResolvedValue(undefined),
    _store:   store,
  };
}

export function createS3Mock() {
  return {
    send: j.fn().mockResolvedValue({
      ETag: '"abc123"',
      Location: 'https://bucket.s3.amazonaws.com/content/test/file.webp',
      $metadata: { httpStatusCode: 200 },
      Contents: [],
      IsTruncated: false,
      Deleted: [{ Key: 'content/test/file.webp' }],
      Errors: [],
    }),
  };
}

export function createCloudFrontMock() {
  return {
    send: j.fn().mockResolvedValue({
      Invalidation: {
        Id: 'INVALIDATION123',
        Status: 'InProgress',
        CreateTime: new Date(),
        InvalidationBatch: {
          Paths: { Quantity: 1, Items: ['/sitemap.xml'] },
          CallerReference: 'test-ref',
        },
      },
      $metadata: { httpStatusCode: 201 },
    }),
  };
}

export function createBlogServiceMock() {
  const blogs = [makeBlogDTO(), makeBlogDTO()];
  const paginatedBlogs: PaginatedResult<ReturnType<typeof makeBlogSummaryDTO>> = {
    data: [makeBlogSummaryDTO(), makeBlogSummaryDTO()],
    pagination: {
      page: 1, limit: 20, total: 2,
      totalPages: 1, hasNextPage: false, hasPreviousPage: false,
    },
  };

  return {
    listBlogs:                      j.fn().mockResolvedValue(paginatedBlogs),
    getBlogBySlug:                  j.fn().mockResolvedValue(makeBlogDTO()),
    getBlogById:                    j.fn().mockResolvedValue(makeBlogDTO()),
    createBlog:                     j.fn().mockResolvedValue(makeBlogDTO()),
    updateBlog:                     j.fn().mockResolvedValue(makeBlogDTO()),
    publishBlog:                    j.fn().mockResolvedValue(makeBlogDTO({ status: 'PUBLISHED' })),
    softDeleteBlog:                 j.fn().mockResolvedValue(undefined),
    invalidateBlogCache:            j.fn().mockResolvedValue(undefined),
    invalidateCategoryCache:        j.fn().mockResolvedValue(undefined),
    invalidateProductCache:         j.fn().mockResolvedValue(undefined),
    getInspirationPostsForCategory: j.fn().mockResolvedValue(blogs),
  };
}

export function createPageServiceMock() {
  return {
    listPages:              j.fn().mockResolvedValue({ data: [makeCmsPageDTO()], pagination: {} }),
    getPageBySlug:          j.fn().mockResolvedValue(makeCmsPageDTO()),
    getPageById:            j.fn().mockResolvedValue(makeCmsPageDTO()),
    createPage:             j.fn().mockResolvedValue(makeCmsPageDTO()),
    updatePage:             j.fn().mockResolvedValue(makeCmsPageDTO()),
    publishPage:            j.fn().mockResolvedValue(makeCmsPageDTO({ status: 'PUBLISHED' })),
    softDeletePage:         j.fn().mockResolvedValue(undefined),
    scheduleSitemapRebuild: j.fn().mockResolvedValue(undefined),
    rebuildSitemap:         j.fn().mockResolvedValue(undefined),
  };
}

export function createMediaServiceMock() {
  return {
    listMedia:         j.fn().mockResolvedValue({ data: [makeMediaDTO()], pagination: {} }),
    getMediaById:      j.fn().mockResolvedValue(makeMediaDTO()),
    uploadMedia:       j.fn().mockResolvedValue(makeMediaDTO()),
    updateMedia:       j.fn().mockResolvedValue(makeMediaDTO()),
    softDeleteMedia:   j.fn().mockResolvedValue(undefined),
    processUpload:     j.fn().mockResolvedValue(makeMediaDTO()),
    generateSignedUrl: j.fn().mockResolvedValue('https://s3.amazonaws.com/signed-url'),
  };
}

export function createSeoServiceMock() {
  return {
    getSeoForEntity:     j.fn().mockResolvedValue(makeSeoMetaDTO()),
    createSeo:           j.fn().mockResolvedValue(makeSeoMetaDTO()),
    updateSeo:           j.fn().mockResolvedValue(makeSeoMetaDTO()),
    deleteSeo:           j.fn().mockResolvedValue(undefined),
    generateMetaForBlog: j.fn().mockResolvedValue(makeSeoMetaDTO()),
    generateMetaForPage: j.fn().mockResolvedValue(makeSeoMetaDTO()),
    refreshMetaForBlog:  j.fn().mockResolvedValue(makeSeoMetaDTO()),
    invalidateCache:     j.fn().mockResolvedValue(undefined),
  };
}

export function createLandingServiceMock() {
  return {
    listLandingPages:   j.fn().mockResolvedValue({ data: [makeLandingPageDTO()], pagination: {} }),
    getLandingBySlug:   j.fn().mockResolvedValue(makeLandingPageDTO()),
    getLandingById:     j.fn().mockResolvedValue(makeLandingPageDTO()),
    createLandingPage:  j.fn().mockResolvedValue(makeLandingPageDTO()),
    updateLandingPage:  j.fn().mockResolvedValue(makeLandingPageDTO()),
    publishLandingPage: j.fn().mockResolvedValue(makeLandingPageDTO({ status: 'PUBLISHED' })),
    softDeleteLanding:  j.fn().mockResolvedValue(undefined),
  };
}

export function createMockRequest(overrides: Record<string, unknown> = {}) {
  return {
    body: {},
    params: {},
    query: {},
    headers: {},
    user: undefined,
    requestId: 'test-request-id-123',
    startTime: Date.now(),
    ip: '127.0.0.1',
    method: 'GET',
    originalUrl: '/api/v1/blogs',
    ...overrides,
  };
}

export function createMockResponse() {
  return {
    status: j.fn().mockReturnThis(),
    json:   j.fn().mockReturnThis(),
    send:   j.fn().mockReturnThis(),
    set:    j.fn().mockReturnThis(),
    end:    j.fn().mockReturnThis(),
  };
}

export function createMockNext() {
  return j.fn();
}