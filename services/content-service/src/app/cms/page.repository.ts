import { prisma } from '../../infrastructure/db/prisma.client';
import {
  CmsPage,
  CreatePagePayload,
  PageListQuery,
  PageRepository,
  PaginatedPageResult,
  UpdatePagePayload,
} from './page.types';
import { SystemSlug } from './page.constants';
import { PageMapper } from './page.mapper';
import { PAGE_DEFAULT_PAGE_SIZE } from './page.constants';

export class PageRepositoryImpl implements PageRepository {
  async findAll(query: PageListQuery): Promise<PaginatedPageResult> {
    const {
      page = 1,
      limit = PAGE_DEFAULT_PAGE_SIZE,
      status,
      search,
      sortBy = 'title',
      sortOrder = 'asc',
    } = query;

    const skip = (page - 1) * limit;

    const where = {
      deletedAt: null,
      ...(status !== undefined && { status }),
      ...(search !== undefined && {
        OR: [
          { title: { contains: search, mode: 'insensitive' } },
          { slug: { contains: search, mode: 'insensitive' } },
        ],
      }),
    };

    const orderBy = {
      [sortBy]: sortOrder,
    };

    const [records, total] = await Promise.all([
      (prisma as any).cmsPage.findMany({ where, skip, take: limit, orderBy }),
      (prisma as any).cmsPage.count({ where }),
    ]);

    const totalPages = Math.ceil(total / limit);

    return {
      data: PageMapper.toSummaryDtoList(records),
      meta: {
        page,
        limit,
        total,
        totalPages,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
      },
    };
  }

  async findById(id: string): Promise<CmsPage | null> {
    return (prisma as any).cmsPage.findFirst({
      where: { id, deletedAt: null },
    });
  }

  async findBySlug(slug: string): Promise<CmsPage | null> {
    return (prisma as any).cmsPage.findFirst({
      where: { slug, deletedAt: null },
    });
  }

  async findAllPublished(): Promise<CmsPage[]> {
    return (prisma as any).cmsPage.findMany({
      where: { status: 'PUBLISHED', deletedAt: null },
      orderBy: { title: 'asc' },
    });
  }

  async findBySystemSlug(slug: SystemSlug): Promise<CmsPage | null> {
    return (prisma as any).cmsPage.findFirst({
      where: { slug, deletedAt: null },
    });
  }

  async create(payload: CreatePagePayload): Promise<CmsPage> {
    return (prisma as any).cmsPage.create({
      data: {
        ...payload,
        publishedAt: payload.status === 'PUBLISHED' ? new Date() : null,
      },
    });
  }

  async update(id: string, payload: UpdatePagePayload): Promise<CmsPage> {
    const current = await (prisma as any).cmsPage.findUniqueOrThrow({ where: { id } });

    const publishedAt =
      payload.status === 'PUBLISHED' && current.status !== 'PUBLISHED'
        ? new Date()
        : payload.status === 'DRAFT' && current.status === 'PUBLISHED'
          ? null
          : undefined;

    return (prisma as any).cmsPage.update({
      where: { id },
      data: {
        ...payload,
        ...(publishedAt !== undefined && { publishedAt }),
      },
    });
  }

  async softDelete(id: string): Promise<void> {
    await (prisma as any).cmsPage.update({
      where: { id },
      data: { deletedAt: new Date(), status: 'DRAFT' },
    });
  }

  async slugExists(slug: string, excludeId?: string): Promise<boolean> {
    const record = await (prisma as any).cmsPage.findFirst({
      where: {
        slug,
        deletedAt: null,
        ...(excludeId !== undefined && { id: { not: excludeId } }),
      },
      select: { id: true },
    });
    return record !== null;
  }
}