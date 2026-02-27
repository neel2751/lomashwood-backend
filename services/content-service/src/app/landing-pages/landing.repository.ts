import { Prisma } from '@prisma/client';

import { prismaClient } from '../../infrastructure/db/prisma.client';

const db: any = prismaClient;
import {
  LandingPage,
  LandingListQuery,
  LandingRepository,
  CreateLandingPagePayload,
  PaginatedLandingResult,
  UpdateLandingPagePayload,
} from './landing.types';
import { LANDING_DEFAULT_PAGE_SIZE } from './landing.constants';
import { LandingMapper } from './landing.mapper';

export class LandingRepositoryImpl implements LandingRepository {
  async findAll(query: LandingListQuery): Promise<PaginatedLandingResult> {
    const {
      page = 1,
      limit = LANDING_DEFAULT_PAGE_SIZE,
      status,
      search,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = query;

    const skip = (page - 1) * limit;

    const where: Prisma.LandingPageWhereInput = {
      deletedAt: null,
      ...(status !== undefined && { status }),
      ...(search !== undefined && {
        OR: [
          { title: { contains: search, mode: 'insensitive' } },
          { slug: { contains: search, mode: 'insensitive' } },
          { headline: { contains: search, mode: 'insensitive' } },
        ],
      }),
    };

    const orderBy: Prisma.LandingPageOrderByWithRelationInput = {
      [sortBy]: sortOrder,
    };

    const [records, total] = await Promise.all([
      db.landingPage.findMany({ where, skip, take: limit, orderBy }),
      db.landingPage.count({ where }),
    ]);

    const totalPages = Math.ceil(total / limit);

    return {
      data: LandingMapper.toSummaryDtoList(records),
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

  async findById(id: string): Promise<LandingPage | null> {
    return db.landingPage.findFirst({
      where: { id, deletedAt: null },
    });
  }

  async findBySlug(slug: string): Promise<LandingPage | null> {
    return db.landingPage.findFirst({
      where: { slug, deletedAt: null },
    });
  }

  async findActive(): Promise<LandingPage[]> {
    return db.landingPage.findMany({
      where: {
        status: 'PUBLISHED',
        deletedAt: null,
      },
      orderBy: { publishedAt: 'desc' },
    });
  }

  async create(payload: CreateLandingPagePayload): Promise<LandingPage> {
    const { sections, ...rest } = payload;

    return db.landingPage.create({
      data: {
        ...rest,
        sections: sections as Prisma.InputJsonValue ?? Prisma.JsonNull,
        publishedAt: rest.status === 'PUBLISHED' ? new Date() : null,
      },
    });
  }

  async update(id: string, payload: UpdateLandingPagePayload): Promise<LandingPage> {
    const current = await db.landingPage.findUniqueOrThrow({ where: { id } });

    const { sections, ...rest } = payload;

    const publishedAt =
      rest.status === 'PUBLISHED' && current.status !== 'PUBLISHED'
        ? new Date()
        : rest.status !== undefined && rest.status !== 'PUBLISHED'
          ? null
          : undefined;

    return db.landingPage.update({
      where: { id },
      data: {
        ...rest,
        ...(sections !== undefined && {
          sections: sections as Prisma.InputJsonValue,
        }),
        ...(publishedAt !== undefined && { publishedAt }),
      },
    });
  }

  async softDelete(id: string): Promise<void> {
    await db.landingPage.update({
      where: { id },
      data: {
        deletedAt: new Date(),
        status: 'ARCHIVED',
      },
    });
  }

  async slugExists(slug: string, excludeId?: string): Promise<boolean> {
    const record = await db.landingPage.findFirst({
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