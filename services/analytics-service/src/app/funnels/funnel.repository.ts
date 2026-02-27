import { getPrismaClient } from '../../infrastructure/db/prisma.client';
import type {
  CreateFunnelInput,
  UpdateFunnelInput,
  FunnelListFilters,
  FunnelEntity,
  FunnelResultEntity,
  FunnelStepResult,
} from './funnel.types';

const db = getPrismaClient() as any;

export class FunnelRepository {
  async create(input: CreateFunnelInput): Promise<FunnelEntity> {
    return db.funnel.create({
      data: {
        name:        input.name,
        description: input.description,
        steps:       input.steps ?? [],
        createdBy:   input.createdBy,
      },
    });
  }

  async findById(id: string): Promise<FunnelEntity | null> {
    return db.funnel.findFirst({
      where: { id, deletedAt: null },
    });
  }

  async findAll(
    filters: FunnelListFilters,
  ): Promise<{ data: FunnelEntity[]; total: number }> {
    const { status, page = 1, limit = 20 } = filters;
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = {
      deletedAt: null,
      ...(status ? { status } : {}),
    };

    const [data, total] = await getPrismaClient().$transaction([
      db.funnel.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      db.funnel.count({ where }),
    ]);

    return { data, total };
  }

  async update(id: string, input: UpdateFunnelInput): Promise<FunnelEntity> {
    return db.funnel.update({
      where: { id },
      data: {
        name:        input.name,
        description: input.description,
        steps:       input.steps,
      },
    });
  }

  async updateStatus(id: string, status: string): Promise<FunnelEntity> {
    return db.funnel.update({
      where: { id },
      data:  { status },
    });
  }

  async softDelete(id: string): Promise<FunnelEntity> {
    return db.funnel.update({
      where: { id },
      data:  { deletedAt: new Date(), status: 'ARCHIVED' },
    });
  }

  async createResult(
    funnelId: string,
    periodStart: Date,
    periodEnd: Date,
    stepResults: FunnelStepResult[],
    totalEntries: number,
    totalCompletions: number,
    conversionRate: number,
  ): Promise<FunnelResultEntity> {
    return db.funnelResult.create({
      data: {
        funnelId,
        periodStart,
        periodEnd,
        stepResults,
        totalEntries,
        totalCompletions,
        conversionRate,
      },
    });
  }

  async findResults(
    funnelId: string,
    filters: { periodStart?: Date; periodEnd?: Date; limit?: number },
  ): Promise<FunnelResultEntity[]> {
    const { periodStart, periodEnd, limit = 10 } = filters;

    return db.funnelResult.findMany({
      where: {
        funnelId,
        ...(periodStart ? { periodStart: { gte: periodStart } } : {}),
        ...(periodEnd   ? { periodEnd:   { lte: periodEnd   } } : {}),
      },
      orderBy: { computedAt: 'desc' },
      take:    limit,
    });
  }

  async findLatestResult(funnelId: string): Promise<FunnelResultEntity | null> {
    return db.funnelResult.findFirst({
      where:   { funnelId },
      orderBy: { computedAt: 'desc' },
    });
  }

  async countEventsByTypeAndPage(
    eventType: string,
    page: string | undefined,
    periodStart: Date,
    periodEnd: Date,
  ): Promise<number> {
    return db.analyticsEvent.count({
      where: {
        eventType,
        ...(page ? { page } : {}),
        createdAt: { gte: periodStart, lte: periodEnd },
      },
    });
  }
}