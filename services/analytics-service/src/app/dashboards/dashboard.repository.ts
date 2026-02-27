import type { PrismaClient, Prisma } from '@prisma/client';

import { getPrismaClient } from '../../infrastructure/db/prisma.client';
import type {
  CreateDashboardInput,
  UpdateDashboardInput,
  CreateWidgetInput,
  UpdateWidgetInput,
  DashboardListFilters,
  DashboardEntity,
  DashboardWidgetEntity,
} from './dashboard.types';
import { DashboardType } from './dashboard.schemas';

export { DashboardType };




export class DashboardRepository {
  private readonly prisma: PrismaClient;

  constructor() {
    this.prisma = getPrismaClient();
  }

  async create(input: CreateDashboardInput): Promise<DashboardEntity> {
    return (this.prisma as any).dashboard.create({
      data: {
        name: input.name,
        description: input.description,
        type: input.type,
        isDefault: input.isDefault ?? false,
        createdBy: input.createdBy,
        config: (input.config ?? {}) as Prisma.InputJsonValue,
      },
    });
  }

  async findById(id: string): Promise<DashboardEntity | null> {
    return (this.prisma as any).dashboard.findFirst({
      where: { id, deletedAt: null },
    });
  }

  async findByIdWithWidgets(
    id: string,
  ): Promise<(DashboardEntity & { widgets: DashboardWidgetEntity[] }) | null> {
    return (this.prisma as any).dashboard.findFirst({
      where: { id, deletedAt: null },
      include: { widgets: { orderBy: [{ createdAt: 'asc' }] } },
    });
  }

  async findDefault(type?: DashboardType): Promise<DashboardEntity | null> {
    return (this.prisma as any).dashboard.findFirst({
      where: { isDefault: true, deletedAt: null, ...(type ? { type } : {}) },
    });
  }

  async findDefaultWithWidgets(
    type?: DashboardType,
  ): Promise<(DashboardEntity & { widgets: DashboardWidgetEntity[] }) | null> {
    return (this.prisma as any).dashboard.findFirst({
      where: { isDefault: true, deletedAt: null, ...(type ? { type } : {}) },
      include: { widgets: { orderBy: [{ createdAt: 'asc' }] } },
    });
  }

  async findAll(
    filters: DashboardListFilters,
  ): Promise<{ data: (DashboardEntity & { _count: { widgets: number } })[]; total: number }> {
    const { type, page = 1, limit = 20 } = filters;
    const skip = (page - 1) * limit;

    const where = {
      deletedAt: null,
      ...(type ? { type } : {}),
    };

    const [data, total] = await (this.prisma as any).$transaction([
      (this.prisma as any).dashboard.findMany({
        where,
        include: { _count: { select: { widgets: true } } },
        orderBy: [{ isDefault: 'desc' }, { createdAt: 'desc' }],
        skip,
        take: limit,
      }),
      (this.prisma as any).dashboard.count({ where }),
    ]);

    return { data, total };
  }

  async update(id: string, input: UpdateDashboardInput): Promise<DashboardEntity> {
    return (this.prisma as any).dashboard.update({
      where: { id },
      data: {
        name: input.name,
        description: input.description,
        config: input.config as Prisma.InputJsonValue | undefined,
      },
    });
  }

  async setDefault(id: string, type: DashboardType): Promise<DashboardEntity> {
    return (this.prisma as any).$transaction(async (tx: any) => {
      await tx.dashboard.updateMany({
        where: { type, isDefault: true, deletedAt: null, id: { not: id } },
        data: { isDefault: false },
      });

      return tx.dashboard.update({
        where: { id },
        data: { isDefault: true },
      });
    });
  }

  async softDelete(id: string): Promise<void> {
    await (this.prisma as any).dashboard.update({
      where: { id },
      data: { deletedAt: new Date(), isDefault: false },
    });
  }

  async createWidget(input: CreateWidgetInput): Promise<DashboardWidgetEntity> {
    return (this.prisma as any).dashboardWidget.create({
      data: {
        dashboardId: input.dashboardId,
        title: input.title,
        widgetType: input.widgetType,
        metricKey: input.metricKey,
        config: (input.config ?? {}) as Prisma.InputJsonValue,
        position: input.position as unknown as Prisma.InputJsonValue,
      },
    });
  }

  async findWidgetById(id: string): Promise<DashboardWidgetEntity | null> {
    return (this.prisma as any).dashboardWidget.findUnique({ where: { id } });
  }

  async findWidgetsByDashboardId(dashboardId: string): Promise<DashboardWidgetEntity[]> {
    return (this.prisma as any).dashboardWidget.findMany({
      where: { dashboardId },
      orderBy: { createdAt: 'asc' },
    });
  }

  async countWidgetsByDashboardId(dashboardId: string): Promise<number> {
    return (this.prisma as any).dashboardWidget.count({ where: { dashboardId } });
  }

  async updateWidget(id: string, input: UpdateWidgetInput): Promise<DashboardWidgetEntity> {
    return (this.prisma as any).dashboardWidget.update({
      where: { id },
      data: {
        title: input.title,
        widgetType: input.widgetType,
        metricKey: input.metricKey,
        config: input.config as Prisma.InputJsonValue | undefined,
        position: input.position as unknown as Prisma.InputJsonValue | undefined,
      },
    });
  }

  async deleteWidget(id: string): Promise<void> {
    await (this.prisma as any).dashboardWidget.delete({ where: { id } });
  }
}