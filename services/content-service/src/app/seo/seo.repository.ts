import { Prisma } from '@prisma/client';

import { prisma } from '../../infrastructure/db/prisma.client';
import {
  SeoMeta,
  SeoListQuery,
  SeoRepository,
  CreateSeoMetaPayload,
  UpdateSeoMetaPayload,
  PaginatedSeoResult,
} from './seo.types';
import { SEO_DEFAULT_PAGE_SIZE } from './seo.constants';
import { SeoMapper } from './seo.mapper';

export class SeoRepositoryImpl implements SeoRepository {
  async findAll(query: SeoListQuery): Promise<PaginatedSeoResult> {
    const { page = 1, limit = SEO_DEFAULT_PAGE_SIZE, search } = query;

    const skip = (page - 1) * limit;

    const where: Prisma.SeoMetaWhereInput = {
      ...(search !== undefined && {
        OR: [
          { title: { contains: search, mode: 'insensitive' } },
          { pagePath: { contains: search, mode: 'insensitive' } },
          { canonicalUrl: { contains: search, mode: 'insensitive' } },
        ],
      }),
    };

    const [records, total] = await Promise.all([
      prisma.seoMeta.findMany({
        where,
        skip,
        take: limit,
        orderBy: { updatedAt: 'desc' },
      }),
      prisma.seoMeta.count({ where }),
    ]);

    const totalPages = Math.ceil(total / limit);

    return {
      data: SeoMapper.toDtoList(records),
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

  async findById(id: string): Promise<SeoMeta | null> {
    return prisma.seoMeta.findUnique({ where: { id } }) as any;
  }

  async findByPagePath(pagePath: string): Promise<SeoMeta | null> {
    return prisma.seoMeta.findUnique({
      where: { pagePath },
    }) as any;
  }

  async upsert(payload: CreateSeoMetaPayload): Promise<SeoMeta> {
    return prisma.seoMeta.upsert({
      where: { pagePath: payload.pagePath },
      create: payload as any,
      update: {
        ...payload,
        pagePath: undefined,
      },
    }) as any;
  }

  async update(id: string, payload: UpdateSeoMetaPayload): Promise<SeoMeta> {
    return prisma.seoMeta.update({
      where: { id },
      data: payload as any,
    }) as any;
  }

  async delete(id: string): Promise<void> {
    await prisma.seoMeta.delete({ where: { id } });
  }

  async pagePathExists(pagePath: string, excludeId?: string): Promise<boolean> {
    const record = await prisma.seoMeta.findFirst({
      where: {
        entityType,
        entityId,
        ...(excludeId !== undefined && { id: { not: excludeId } }),
      },
      select: { id: true },
    });
    return record !== null;
  }
}