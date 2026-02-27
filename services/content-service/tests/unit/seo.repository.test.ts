import { mockDeep, DeepMockProxy } from 'jest-mock-extended';
import { PrismaClient } from '@prisma/client';

import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { SeoRepository } from '../../src/app/seo/seo.repository';
import { SeoRecord, SeoCreateInput, SeoUpdateInput } from '../../src/app/seo/seo.types';
import { ContentEntityType } from '../../src/shared/constants';


const db = mockDeep<PrismaClient>();


const T = new Date('2025-03-15T09:00:00.000Z');

function seoRecord(patch: Partial<SeoRecord> = {}): SeoRecord {
  return {
    id: 'seo-1',
    entityId: 'entity-1',
    entityType: 'BLOG',
    metaTitle: 'Kitchen Inspiration | Lomash Wood',
    metaDescription: 'Browse award-winning kitchen designs at Lomash Wood showrooms.',
    metaKeywords: ['kitchen', 'bedroom', 'lomash wood'],
    canonicalUrl: 'https://lomashwood.co.uk/kitchens',
    ogTitle: 'Kitchen Inspiration | Lomash Wood',
    ogDescription: 'Browse award-winning kitchen designs.',
    ogImage: 'https://cdn.lomashwood.co.uk/og/kitchens.jpg',
    twitterTitle: 'Kitchen Inspiration | Lomash Wood',
    twitterDescription: 'Browse award-winning kitchen designs.',
    twitterImage: 'https://cdn.lomashwood.co.uk/og/kitchens.jpg',
    structuredData: null,
    robotsDirective: 'index,follow',
    isActive: true,
    createdAt: T,
    updatedAt: T,
    deletedAt: null,
    ...patch,
  };
}

function createInput(patch: Partial<SeoCreateInput> = {}): SeoCreateInput {
  return {
    entityId: 'entity-1',
    entityType: 'BLOG',
    metaTitle: 'Kitchen Inspiration | Lomash Wood',
    metaDescription: 'Browse award-winning kitchen designs at Lomash Wood showrooms.',
    metaKeywords: ['kitchen', 'bedroom', 'lomash wood'],
    canonicalUrl: 'https://lomashwood.co.uk/kitchens',
    ogTitle: 'Kitchen Inspiration | Lomash Wood',
    ogDescription: 'Browse award-winning kitchen designs.',
    ogImage: 'https://cdn.lomashwood.co.uk/og/kitchens.jpg',
    robotsDirective: 'index,follow',
    ...patch,
  };
}


describe('SeoRepository', () => {
  let repo: SeoRepository;

  beforeEach(() => {
    jest.clearAllMocks();
    repo = new SeoRepository(db);
  });


  describe('findById', () => {
    it('calls db.seo.findFirst with { id, deletedAt: null }', async () => {
      db.seo.findFirst.mockResolvedValue(seoRecord() as any);

      await repo.findById('seo-1');

      expect(db.seo.findFirst).toHaveBeenCalledExactlyOnceWith({
        where: { id: 'seo-1', deletedAt: null },
      });
    });

    it('returns the record from prisma', async () => {
      const record = seoRecord();
      db.seo.findFirst.mockResolvedValue(record as any);

      expect(await repo.findById('seo-1')).toStrictEqual(record);
    });

    it('returns null when prisma returns null', async () => {
      db.seo.findFirst.mockResolvedValue(null);

      expect(await repo.findById('missing')).toBeNull();
    });
  });


  describe('findByEntity', () => {
    it('calls db.seo.findFirst with { entityId, entityType, deletedAt: null }', async () => {
      db.seo.findFirst.mockResolvedValue(seoRecord() as any);

      await repo.findByEntity('entity-1', 'BLOG');

      expect(db.seo.findFirst).toHaveBeenCalledExactlyOnceWith({
        where: { entityId: 'entity-1', entityType: 'BLOG', deletedAt: null },
      });
    });

    it('returns the matching record', async () => {
      const record = seoRecord({ entityType: 'PAGE' });
      db.seo.findFirst.mockResolvedValue(record as any);

      expect(await repo.findByEntity('entity-1', 'PAGE')).toStrictEqual(record);
    });

    it('returns null when no record matches', async () => {
      db.seo.findFirst.mockResolvedValue(null);

      expect(await repo.findByEntity('entity-1', 'MEDIA')).toBeNull();
    });

    it.each<ContentEntityType>([
      'BLOG', 'PAGE', 'LANDING_PAGE', 'MEDIA', 'PRODUCT', 'SHOWROOM',
    ])('passes entityType %s through to prisma unchanged', async (et) => {
      db.seo.findFirst.mockResolvedValue(null);

      await repo.findByEntity('eid', et);

      expect(db.seo.findFirst).toHaveBeenCalledWith(
        expect.objectContaining({ where: expect.objectContaining({ entityType: et }) }),
      );
    });
  });


  describe('create', () => {
    it('calls db.seo.create with every field individually expanded from the input', async () => {
      db.seo.create.mockResolvedValue(seoRecord() as any);
      const input = createInput();

      await repo.create(input);

      expect(db.seo.create).toHaveBeenCalledExactlyOnceWith({
        data: {
          entityId: input.entityId,
          entityType: input.entityType,
          metaTitle: input.metaTitle,
          metaDescription: input.metaDescription,
          metaKeywords: input.metaKeywords,
          canonicalUrl: input.canonicalUrl,
          ogTitle: input.ogTitle ?? null,
          ogDescription: input.ogDescription ?? null,
          ogImage: input.ogImage ?? null,
          twitterTitle: null,
          twitterDescription: null,
          twitterImage: null,
          structuredData: null,
          robotsDirective: 'index,follow',
          isActive: true,
        },
      });
    });

    it('returns the record from prisma', async () => {
      const record = seoRecord();
      db.seo.create.mockResolvedValue(record as any);

      expect(await repo.create(createInput())).toStrictEqual(record);
    });

    it('defaults metaKeywords to [] when omitted from input', async () => {
      db.seo.create.mockResolvedValue(seoRecord() as any);

      await repo.create(createInput({ metaKeywords: undefined }));

      const sent = (db.seo.create.mock.calls[0][0] as any).data;
      expect(sent.metaKeywords).toStrictEqual([]);
    });

    it('defaults robotsDirective to "index,follow" when omitted', async () => {
      db.seo.create.mockResolvedValue(seoRecord() as any);

      await repo.create(createInput({ robotsDirective: undefined }));

      const sent = (db.seo.create.mock.calls[0][0] as any).data;
      expect(sent.robotsDirective).toBe('index,follow');
    });

    it.each([
      'noindex,nofollow', 'index,nofollow', 'noindex,follow',
    ] as const)('persists explicit robotsDirective "%s"', async (directive) => {
      db.seo.create.mockResolvedValue(seoRecord() as any);

      await repo.create(createInput({ robotsDirective: directive }));

      expect((db.seo.create.mock.calls[0][0] as any).data.robotsDirective).toBe(directive);
    });

    it('sets all nullable OG/Twitter fields to null when absent', async () => {
      db.seo.create.mockResolvedValue(seoRecord() as any);

      await repo.create(createInput({
        ogTitle: undefined, ogDescription: undefined, ogImage: undefined,
        twitterTitle: undefined, twitterDescription: undefined, twitterImage: undefined,
      }));

      const sent = (db.seo.create.mock.calls[0][0] as any).data;
      expect(sent.ogTitle).toBeNull();
      expect(sent.ogDescription).toBeNull();
      expect(sent.ogImage).toBeNull();
      expect(sent.twitterTitle).toBeNull();
      expect(sent.twitterDescription).toBeNull();
      expect(sent.twitterImage).toBeNull();
    });

    it('persists provided Twitter fields', async () => {
      db.seo.create.mockResolvedValue(seoRecord() as any);

      await repo.create(createInput({
        twitterTitle: 'Lomash on Twitter',
        twitterDescription: 'Kitchen & bedroom design',
        twitterImage: 'https://cdn.lomashwood.co.uk/og/tw.jpg',
      }));

      const sent = (db.seo.create.mock.calls[0][0] as any).data;
      expect(sent.twitterTitle).toBe('Lomash on Twitter');
      expect(sent.twitterDescription).toBe('Kitchen & bedroom design');
      expect(sent.twitterImage).toBe('https://cdn.lomashwood.co.uk/og/tw.jpg');
    });

    it('stores structuredData when provided', async () => {
      db.seo.create.mockResolvedValue(seoRecord() as any);
      const sd = { '@context': 'https://schema.org', '@type': 'WebPage' };

      await repo.create(createInput({ structuredData: sd }));

      expect((db.seo.create.mock.calls[0][0] as any).data.structuredData).toStrictEqual(sd);
    });

    it('sets structuredData to null when absent', async () => {
      db.seo.create.mockResolvedValue(seoRecord() as any);

      await repo.create(createInput({ structuredData: undefined }));

      expect((db.seo.create.mock.calls[0][0] as any).data.structuredData).toBeNull();
    });

    it('always sets isActive: true', async () => {
      db.seo.create.mockResolvedValue(seoRecord() as any);

      await repo.create(createInput());

      expect((db.seo.create.mock.calls[0][0] as any).data.isActive).toBe(true);
    });
  });


  describe('update', () => {
    it('calls db.seo.update with where: { id } and spreads the patch plus updatedAt', async () => {
      const patch: SeoUpdateInput = { metaTitle: 'New Title', isActive: false };
      db.seo.update.mockResolvedValue(seoRecord(patch) as any);

      await repo.update('seo-1', patch);

      expect(db.seo.update).toHaveBeenCalledExactlyOnceWith({
        where: { id: 'seo-1' },
        data: {
          metaTitle: 'New Title',
          isActive: false,
          updatedAt: expect.any(Date),
        },
      });
    });

    it('returns the updated record from prisma', async () => {
      const updated = seoRecord({ metaTitle: 'Updated' });
      db.seo.update.mockResolvedValue(updated as any);

      expect(await repo.update('seo-1', { metaTitle: 'Updated' })).toStrictEqual(updated);
    });

    it('always injects a current updatedAt timestamp', async () => {
      db.seo.update.mockResolvedValue(seoRecord() as any);
      const before = Date.now();

      await repo.update('seo-1', { canonicalUrl: 'https://lomashwood.co.uk/new' });

      const sent = (db.seo.update.mock.calls[0][0] as any).data;
      expect(sent.updatedAt).toBeInstanceOf(Date);
      expect(sent.updatedAt.getTime()).toBeGreaterThanOrEqual(before);
      expect(sent.updatedAt.getTime()).toBeLessThanOrEqual(Date.now());
    });

    it('only sends caller-provided fields plus updatedAt — no extra keys injected', async () => {
      db.seo.update.mockResolvedValue(seoRecord() as any);

      await repo.update('seo-1', { canonicalUrl: 'https://lomashwood.co.uk/bedrooms' });

      const sentKeys = Object.keys((db.seo.update.mock.calls[0][0] as any).data).sort();
      expect(sentKeys).toStrictEqual(['canonicalUrl', 'updatedAt']);
    });

    it('passes the exact id to where', async () => {
      db.seo.update.mockResolvedValue(seoRecord() as any);

      await repo.update('seo-xyz-99', { metaTitle: 'Title' });

      expect(db.seo.update).toHaveBeenCalledWith(
        expect.objectContaining({ where: { id: 'seo-xyz-99' } }),
      );
    });
  });


  describe('upsert', () => {
    it('calls db.seo.upsert with the compound unique key entityId_entityType', async () => {
      db.seo.upsert.mockResolvedValue(seoRecord() as any);

      await repo.upsert('entity-1', 'BLOG', createInput());

      expect(db.seo.upsert).toHaveBeenCalledExactlyOnceWith(
        expect.objectContaining({
          where: { entityId_entityType: { entityId: 'entity-1', entityType: 'BLOG' } },
        }),
      );
    });

    it('returns the record from prisma', async () => {
      const record = seoRecord();
      db.seo.upsert.mockResolvedValue(record as any);

      expect(await repo.upsert('entity-1', 'BLOG', createInput())).toStrictEqual(record);
    });

    it('create block contains all input fields plus isActive: true', async () => {
      db.seo.upsert.mockResolvedValue(seoRecord() as any);
      const input = createInput();

      await repo.upsert('entity-1', 'BLOG', input);

      const { create } = (db.seo.upsert.mock.calls[0][0] as any);
      expect(create).toMatchObject({
        entityId: input.entityId,
        entityType: input.entityType,
        metaTitle: input.metaTitle,
        metaDescription: input.metaDescription,
        metaKeywords: input.metaKeywords,
        canonicalUrl: input.canonicalUrl,
        robotsDirective: 'index,follow',
        isActive: true,
      });
    });

    it('update block contains SEO fields and updatedAt, but NOT entityId, entityType, or isActive', async () => {
      db.seo.upsert.mockResolvedValue(seoRecord() as any);
      const input = createInput();

      await repo.upsert('entity-1', 'BLOG', input);

      const { update } = (db.seo.upsert.mock.calls[0][0] as any);
      expect(update).toMatchObject({
        metaTitle: input.metaTitle,
        metaDescription: input.metaDescription,
        metaKeywords: input.metaKeywords,
        canonicalUrl: input.canonicalUrl,
        robotsDirective: 'index,follow',
        updatedAt: expect.any(Date),
      });
      expect(update).not.toHaveProperty('isActive');
      expect(update).not.toHaveProperty('entityId');
      expect(update).not.toHaveProperty('entityType');
    });

    it('defaults metaKeywords to [] in both create and update when omitted', async () => {
      db.seo.upsert.mockResolvedValue(seoRecord() as any);

      await repo.upsert('entity-1', 'BLOG', createInput({ metaKeywords: undefined }));

      const { create, update } = (db.seo.upsert.mock.calls[0][0] as any);
      expect(create.metaKeywords).toStrictEqual([]);
      expect(update.metaKeywords).toStrictEqual([]);
    });

    it('defaults robotsDirective to "index,follow" in both create and update when omitted', async () => {
      db.seo.upsert.mockResolvedValue(seoRecord() as any);

      await repo.upsert('entity-1', 'BLOG', createInput({ robotsDirective: undefined }));

      const { create, update } = (db.seo.upsert.mock.calls[0][0] as any);
      expect(create.robotsDirective).toBe('index,follow');
      expect(update.robotsDirective).toBe('index,follow');
    });

    it('sets nullable OG/Twitter and structuredData to null in create when absent', async () => {
      db.seo.upsert.mockResolvedValue(seoRecord() as any);

      await repo.upsert('entity-1', 'BLOG', createInput({
        ogTitle: undefined, ogDescription: undefined, ogImage: undefined,
        twitterTitle: undefined, twitterDescription: undefined, twitterImage: undefined,
        structuredData: undefined,
      }));

      const { create } = (db.seo.upsert.mock.calls[0][0] as any);
      expect(create.ogTitle).toBeNull();
      expect(create.ogDescription).toBeNull();
      expect(create.ogImage).toBeNull();
      expect(create.twitterTitle).toBeNull();
      expect(create.twitterDescription).toBeNull();
      expect(create.twitterImage).toBeNull();
      expect(create.structuredData).toBeNull();
    });

    it('sets nullable OG/Twitter and structuredData to null in update when absent', async () => {
      db.seo.upsert.mockResolvedValue(seoRecord() as any);

      await repo.upsert('entity-1', 'BLOG', createInput({
        ogTitle: undefined, ogDescription: undefined, ogImage: undefined,
        twitterTitle: undefined, twitterDescription: undefined, twitterImage: undefined,
        structuredData: undefined,
      }));

      const { update } = (db.seo.upsert.mock.calls[0][0] as any);
      expect(update.ogTitle).toBeNull();
      expect(update.ogDescription).toBeNull();
      expect(update.ogImage).toBeNull();
      expect(update.twitterTitle).toBeNull();
      expect(update.twitterDescription).toBeNull();
      expect(update.twitterImage).toBeNull();
      expect(update.structuredData).toBeNull();
    });

    it('propagates structuredData to both blocks when provided', async () => {
      db.seo.upsert.mockResolvedValue(seoRecord() as any);
      const sd = { '@context': 'https://schema.org', '@type': 'LocalBusiness' };

      await repo.upsert('entity-1', 'BLOG', createInput({ structuredData: sd }));

      const { create, update } = (db.seo.upsert.mock.calls[0][0] as any);
      expect(create.structuredData).toStrictEqual(sd);
      expect(update.structuredData).toStrictEqual(sd);
    });

    it('uses the method-level entityId/entityType args for the where key', async () => {
      db.seo.upsert.mockResolvedValue(seoRecord() as any);

      await repo.upsert('page-99', 'PAGE', createInput({ entityId: 'page-99', entityType: 'PAGE' }));

      const { where } = (db.seo.upsert.mock.calls[0][0] as any);
      expect(where.entityId_entityType).toStrictEqual({ entityId: 'page-99', entityType: 'PAGE' });
    });
  });


  describe('softDelete', () => {
    it('calls db.seo.update with where: { id } and data: { deletedAt, isActive: false }', async () => {
      db.seo.update.mockResolvedValue(seoRecord({ deletedAt: T, isActive: false }) as any);

      await repo.softDelete('seo-1');

      expect(db.seo.update).toHaveBeenCalledExactlyOnceWith({
        where: { id: 'seo-1' },
        data: {
          deletedAt: expect.any(Date),
          isActive: false,
        },
      });
    });

    it('returns the deleted record from prisma', async () => {
      const deleted = seoRecord({ deletedAt: T, isActive: false });
      db.seo.update.mockResolvedValue(deleted as any);

      expect(await repo.softDelete('seo-1')).toStrictEqual(deleted);
    });

    it('data object contains exactly the keys deletedAt and isActive — nothing else', async () => {
      db.seo.update.mockResolvedValue(seoRecord({ deletedAt: T, isActive: false }) as any);

      await repo.softDelete('seo-1');

      const data = (db.seo.update.mock.calls[0][0] as any).data;
      expect(Object.keys(data).sort()).toStrictEqual(['deletedAt', 'isActive']);
    });

    it('deletedAt is a freshly created Date, not a fixed constant', async () => {
      db.seo.update.mockResolvedValue(seoRecord({ deletedAt: new Date(), isActive: false }) as any);
      const before = Date.now();

      await repo.softDelete('seo-1');

      const { deletedAt } = (db.seo.update.mock.calls[0][0] as any).data;
      expect(deletedAt).toBeInstanceOf(Date);
      expect(deletedAt.getTime()).toBeGreaterThanOrEqual(before);
      expect(deletedAt.getTime()).toBeLessThanOrEqual(Date.now());
    });

    it('passes the exact id to the where clause', async () => {
      db.seo.update.mockResolvedValue(seoRecord({ deletedAt: T, isActive: false }) as any);

      await repo.softDelete('seo-special-77');

      expect((db.seo.update.mock.calls[0][0] as any).where).toStrictEqual({ id: 'seo-special-77' });
    });
  });


  describe('findAll', () => {
    function seed(records: SeoRecord[], total: number): void {
      db.seo.findMany.mockResolvedValue(records as any);
      db.seo.count.mockResolvedValue(total);
    }


    it('calls findMany with { deletedAt: null }, correct skip/take and orderBy', async () => {
      seed([], 0);

      await repo.findAll({ page: 1, limit: 10 });

      expect(db.seo.findMany).toHaveBeenCalledExactlyOnceWith({
        where: { deletedAt: null },
        skip: 0,
        take: 10,
        orderBy: { createdAt: 'desc' },
      });
    });

    it('passes the same where object to both findMany and count', async () => {
      seed([], 0);

      await repo.findAll({ page: 1, limit: 10, entityType: 'PAGE' });

      const findManyWhere = (db.seo.findMany.mock.calls[0][0] as any).where;
      const countWhere = (db.seo.count.mock.calls[0][0] as any).where;
      expect(findManyWhere).toStrictEqual(countWhere);
    });

    it('calls findMany and count exactly once each', async () => {
      seed([], 0);

      await repo.findAll({ page: 1, limit: 10 });

      expect(db.seo.findMany).toHaveBeenCalledTimes(1);
      expect(db.seo.count).toHaveBeenCalledTimes(1);
    });


    it.each([
      { page: 1, limit: 10, skip: 0  },
      { page: 2, limit: 10, skip: 10 },
      { page: 3, limit: 10, skip: 20 },
      { page: 2, limit: 5,  skip: 5  },
      { page: 3, limit: 5,  skip: 10 },
      { page: 4, limit: 25, skip: 75 },
    ])('page=$page limit=$limit → skip=$skip', async ({ page, limit, skip }) => {
      seed([], 100);

      await repo.findAll({ page, limit });

      expect(db.seo.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ skip, take: limit }),
      );
    });


    it('returns a fully shaped PaginatedResult on a single-page result', async () => {
      const records = [seoRecord()];
      seed(records, 1);

      const result = await repo.findAll({ page: 1, limit: 10 });

      expect(result).toStrictEqual({
        data: records,
        total: 1,
        page: 1,
        limit: 10,
        totalPages: 1,
        hasNextPage: false,
        hasPrevPage: false,
      });
    });

    it('totalPages=0 when total is 0 (buildPaginationMeta special case)', async () => {
      seed([], 0);

      const result = await repo.findAll({ page: 1, limit: 10 });

      expect(result.totalPages).toBe(0);
      expect(result.hasNextPage).toBe(false);
      expect(result.hasPrevPage).toBe(false);
    });

    it.each([
      { total: 23, limit: 10, totalPages: 3 },
      { total: 20, limit: 10, totalPages: 2 },
      { total: 1,  limit: 10, totalPages: 1 },
      { total: 15, limit: 5,  totalPages: 3 },
      { total: 11, limit: 5,  totalPages: 3 },
    ])('ceil($total / $limit) = $totalPages', async ({ total, limit, totalPages }) => {
      seed([], total);

      const result = await repo.findAll({ page: 1, limit });

      expect(result.totalPages).toBe(totalPages);
    });

    it('hasNextPage=true when on a non-final page', async () => {
      seed([], 30); // totalPages=3

      expect((await repo.findAll({ page: 2, limit: 10 })).hasNextPage).toBe(true);
    });

    it('hasNextPage=false on the final page', async () => {
      seed([], 20); // totalPages=2

      expect((await repo.findAll({ page: 2, limit: 10 })).hasNextPage).toBe(false);
    });

    it('hasPrevPage=false on page 1', async () => {
      seed([], 30);

      expect((await repo.findAll({ page: 1, limit: 10 })).hasPrevPage).toBe(false);
    });

    it('hasPrevPage=true on page 2+', async () => {
      seed([], 30);

      expect((await repo.findAll({ page: 2, limit: 10 })).hasPrevPage).toBe(true);
    });


    it('adds entityType to where when provided', async () => {
      seed([], 0);

      await repo.findAll({ page: 1, limit: 10, entityType: 'BLOG' });

      const where = (db.seo.findMany.mock.calls[0][0] as any).where;
      expect(where).toStrictEqual({ deletedAt: null, entityType: 'BLOG' });
    });

    it('omits entityType key from where when not provided', async () => {
      seed([], 0);

      await repo.findAll({ page: 1, limit: 10 });

      const where = (db.seo.findMany.mock.calls[0][0] as any).where;
      expect(where).not.toHaveProperty('entityType');
    });

    it.each<ContentEntityType>([
      'BLOG', 'PAGE', 'LANDING_PAGE', 'MEDIA', 'PRODUCT', 'SHOWROOM',
    ])('filters by entityType "%s"', async (entityType) => {
      seed([], 0);

      await repo.findAll({ page: 1, limit: 10, entityType });

      expect(db.seo.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: expect.objectContaining({ entityType }) }),
      );
    });


    it('adds isActive: true to where when provided', async () => {
      seed([], 0);

      await repo.findAll({ page: 1, limit: 10, isActive: true });

      expect((db.seo.findMany.mock.calls[0][0] as any).where).toStrictEqual({
        deletedAt: null, isActive: true,
      });
    });

    it('adds isActive: false to where when provided', async () => {
      seed([], 0);

      await repo.findAll({ page: 1, limit: 10, isActive: false });

      expect((db.seo.findMany.mock.calls[0][0] as any).where).toStrictEqual({
        deletedAt: null, isActive: false,
      });
    });

    it('omits isActive key from where when not provided', async () => {
      seed([], 0);

      await repo.findAll({ page: 1, limit: 10 });

      expect((db.seo.findMany.mock.calls[0][0] as any).where).not.toHaveProperty('isActive');
    });


    it('applies both entityType and isActive when both provided', async () => {
      seed([], 0);

      await repo.findAll({ page: 1, limit: 10, entityType: 'LANDING_PAGE', isActive: false });

      expect((db.seo.findMany.mock.calls[0][0] as any).where).toStrictEqual({
        deletedAt: null, entityType: 'LANDING_PAGE', isActive: false,
      });
    });


    it('returns data exactly as provided by prisma', async () => {
      const records = [
        seoRecord({ id: 'seo-a', entityType: 'BLOG' }),
        seoRecord({ id: 'seo-b', entityType: 'PAGE' }),
      ];
      seed(records, 2);

      expect((await repo.findAll({ page: 1, limit: 10 })).data).toStrictEqual(records);
    });

    it('reflects page and limit in returned result', async () => {
      seed([], 0);

      const result = await repo.findAll({ page: 3, limit: 20 });

      expect(result.page).toBe(3);
      expect(result.limit).toBe(20);
    });
  });
});