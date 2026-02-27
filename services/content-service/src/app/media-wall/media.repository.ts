import { prisma } from '../../infrastructure/db/prisma.client';
import { withTransaction } from '../../infrastructure/db/transaction.helper';
import {
  MediaWall,
  MediaWallListQuery,
  MediaWallRepository,
  CreateMediaWallPayload,
  PaginatedMediaWallResult,
  UpdateMediaWallPayload,
} from './media.types';
import { MediaMapper } from './media.mapper';
import { MEDIA_DEFAULT_PAGE_SIZE } from './media.constants';

export class MediaWallRepositoryImpl implements MediaWallRepository {
  async findAll(query: MediaWallListQuery): Promise<PaginatedMediaWallResult> {
    const {
      page = 1,
      limit = MEDIA_DEFAULT_PAGE_SIZE,
      sortBy = 'sortOrder',
      sortOrder = 'asc',
    } = query;

    const skip = (page - 1) * limit;

    const where = {
      deletedAt: null,
    };

    const orderBy = {
      [sortBy]: sortOrder,
    };

    const [records, total] = await Promise.all([
      (prisma as any).mediaWallContent.findMany({ where, skip, take: limit, orderBy }),
      (prisma as any).mediaWallContent.count({ where }),
    ]);

    const totalPages = Math.ceil(total / limit);

    return {
      data: MediaMapper.toDtoList(records),
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

  async findById(id: string): Promise<MediaWall | null> {
    return (prisma as any).mediaWallContent.findFirst({
      where: { id, deletedAt: null },
      include: { items: true },
    }) as any;
  }

  async findActive(): Promise<MediaWall[]> {
    return (prisma as any).mediaWallContent.findMany({
      where: { status: 'PUBLISHED', deletedAt: null },
      orderBy: { sortOrder: 'asc' },
      include: { items: true },
    }) as any;
  }

  async create(payload: CreateMediaWallPayload): Promise<MediaWall> {
    return (prisma as any).mediaWallContent.create({ data: payload as any, include: { items: true } }) as any;
  }

  async update(id: string, payload: UpdateMediaWallPayload): Promise<MediaWall> {
    return (prisma as any).mediaWallContent.update({
      where: { id },
      data: payload as any,
      include: { items: true },
    }) as any;
  }

  async reorder(items: Array<{ id: string; sortOrder: number }>): Promise<void> {
    await withTransaction(async (tx) => {
      await Promise.all(
        items.map(({ id, sortOrder }) =>
          (tx as any).mediaWallContent.update({
            where: { id },
            data: { sortOrder },
          }),
        ),
      );
    });
  }

  async softDelete(id: string): Promise<void> {
    await (prisma as any).mediaWallContent.update({
      where: { id },
      data: { deletedAt: new Date(), status: 'ARCHIVED' },
    });
  }

  async sortOrderExists(sortOrder: number, excludeId?: string): Promise<boolean> {
    const record = await (prisma as any).mediaWallContent.findFirst({
      where: {
        sortOrder,
        deletedAt: null,
        ...(excludeId !== undefined && { id: { not: excludeId } }),
      },
      select: { id: true },
    });
    return record !== null;
  }
}