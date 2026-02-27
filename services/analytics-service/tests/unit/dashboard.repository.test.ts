import type { PrismaClient } from '@prisma/client';
import type {
  Dashboard,
  DashboardWithMetrics,
  CreateDashboardInput,
  UpdateDashboardInput,
  FindAllDashboardsQuery,
  PaginatedDashboards,
  DateRangeFilter,
  AdminSummary,
  BookingSummaryRow,
  SalesSummaryRow,
  CustomerActivitySummary,
  DashboardTypeCount,
  DashboardType,
} from './dashboard.types';


export class DashboardRepository {
  constructor(private readonly prisma: PrismaClient) {}


  async create(data: CreateDashboardInput): Promise<Dashboard> {
    return this.prisma.dashboard.create({ data } as never) as Promise<Dashboard>;
  }

  async findById(id: string): Promise<Dashboard | null> {
    return this.prisma.dashboard.findUnique({
      where: { id },
    } as never) as Promise<Dashboard | null>;
  }

  async findAll(query: FindAllDashboardsQuery): Promise<PaginatedDashboards> {
    const { page, limit, type } = query;
    const skip = (page - 1) * limit;

    const where = type ? { type } : {};

    const [data, total] = await Promise.all([
      this.prisma.dashboard.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      } as never),
      this.prisma.dashboard.count({ where } as never),
    ]);

    return {
      data: data as Dashboard[],
      total,
      page,
      limit,
    };
  }

  async update(id: string, data: UpdateDashboardInput): Promise<Dashboard> {
    return this.prisma.dashboard.update({
      where: { id },
      data,
    } as never) as Promise<Dashboard>;
  }

  async delete(id: string): Promise<Dashboard> {
    return this.prisma.dashboard.delete({
      where: { id },
    } as never) as Promise<Dashboard>;
  }

  async upsert(
    where: Partial<Dashboard>,
    create: CreateDashboardInput,
    update: UpdateDashboardInput,
  ): Promise<Dashboard> {
    return this.prisma.dashboard.upsert({
      where,
      create,
      update,
    } as never) as Promise<Dashboard>;
  }


  async findWithMetrics(id: string): Promise<DashboardWithMetrics | null> {
    return this.prisma.dashboard.findUnique({
      where: { id },
      include: { metrics: true },
    } as never) as Promise<DashboardWithMetrics | null>;
  }


  async getAdminSummary(): Promise<AdminSummary> {
    const rows = await this.prisma.$queryRaw<AdminSummary[]>`
      SELECT
        (SELECT COUNT(*) FROM "Appointment")::int                        AS "totalBookings",
        (SELECT COUNT(*) FROM "Sale"  WHERE "isActive" = TRUE)::int      AS "totalSales",
        (SELECT COUNT(*) FROM "Customer" WHERE "isActive" = TRUE)::int   AS "activeCustomers"
    `;
    return rows[0];
  }

  async getBookingSummary(range: DateRangeFilter): Promise<BookingSummaryRow[]> {
    return this.prisma.$queryRaw<BookingSummaryRow[]>`
      SELECT
        "appointmentType"                         AS "type",
        COUNT(*)::int                             AS "count",
        SUM(CASE WHEN "isKitchen" = TRUE THEN 1 ELSE 0 END)::int  AS "kitchen",
        SUM(CASE WHEN "isBedroom" = TRUE THEN 1 ELSE 0 END)::int  AS "bedroom"
      FROM "Appointment"
      WHERE "createdAt" BETWEEN ${range.from} AND ${range.to}
      GROUP BY "appointmentType"
    `;
  }

  async getSalesSummary(range: DateRangeFilter): Promise<SalesSummaryRow[]> {
    return this.prisma.$queryRaw<SalesSummaryRow[]>`
      SELECT
        c."name"                  AS "category",
        COUNT(DISTINCT s."id")::int AS "totalSales",
        COUNT(sp."productId")::int  AS "productCount"
      FROM "Sale" s
      JOIN "SaleCategory" sc ON sc."saleId" = s."id"
      JOIN "Category"      c  ON c."id" = sc."categoryId"
      LEFT JOIN "SaleProduct" sp ON sp."saleId" = s."id"
      WHERE s."createdAt" BETWEEN ${range.from} AND ${range.to}
      GROUP BY c."name"
    `;
  }

  
  async getCustomerActivitySummary(): Promise<CustomerActivitySummary> {
    const rows = await this.prisma.$queryRaw<CustomerActivitySummary[]>`
      SELECT
        (SELECT COUNT(*) FROM "Customer"
          WHERE "createdAt" > NOW() - INTERVAL '30 days')::int           AS "newCustomers",
        (SELECT COUNT(*) FROM "Customer"
          WHERE "createdAt" <= NOW() - INTERVAL '30 days'
            AND "lastActiveAt" > NOW() - INTERVAL '30 days')::int        AS "returningCustomers",
        (SELECT COUNT(*) FROM "BrochureRequest")::int                    AS "brochureRequests",
        (SELECT COUNT(*) FROM "BusinessInquiry")::int                    AS "businessInquiries"
    `;
    return rows[0];
  }


  /** Returns a row-count per DashboardType (ADMIN | CLIENT). */
  async countByType(): Promise<DashboardTypeCount[]> {
    return this.prisma.dashboard.groupBy({
      by: ['type'],
      _count: { id: true },
    } as never) as Promise<DashboardTypeCount[]>;
  }



  async refreshDashboard(id: string): Promise<Dashboard> {
    return this.prisma.dashboard.update({
      where: { id },
      data: { lastRefreshedAt: new Date() },
    } as never) as Promise<Dashboard>;
  }
}