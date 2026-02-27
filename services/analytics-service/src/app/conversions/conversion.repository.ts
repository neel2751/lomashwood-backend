// ─── Types ───────────────────────────────────────────────────────────────────

export interface Conversion {
  id: string;
  sessionId: string;
  userId: string | null;
  goal: string;
  value: number | null;
  currency: string | null;
  properties: Record<string, unknown>;
  createdAt: Date;
}

export interface CreateConversionInput {
  sessionId: string;
  userId?: string;
  goal: string;
  value?: number;
  currency?: string;
  properties?: Record<string, unknown>;
}

export interface FindManyConversionsInput {
  goal?: string;
  sessionId?: string;
  userId?: string;
  from?: Date;
  to?: Date;
  page: number;
  limit: number;
}

export interface CountByGoalInput {
  from?: Date;
  to?: Date;
  sessionId?: string;
  userId?: string;
}

export interface GoalCount {
  goal: string;
  count: number;
}

export interface ConversionRateInput {
  goal?: string;
  from?: Date;
  to?: Date;
}

// ─── Prisma shape (minimal — only what the repository touches) ────────────────

interface PrismaConversionRecord {
  id: string;
  sessionId: string;
  userId: string | null;
  goal: string;
  value: number | null;
  currency: string | null;
  properties: unknown;
  createdAt: Date;
}

interface PrismaClient {
  analyticsConversion: {
    create: (args: unknown) => Promise<PrismaConversionRecord>;
    findUnique: (args: unknown) => Promise<PrismaConversionRecord | null>;
    findMany: (args: unknown) => Promise<PrismaConversionRecord[]>;
    count: (args?: unknown) => Promise<number>;
    groupBy: (args: unknown) => Promise<{ goal: string; _count: { goal: number } }[]>;
    aggregate: (args: unknown) => Promise<unknown>;
  };
  analyticsSession: {
    count: (args?: unknown) => Promise<number>;
  };
}

// ─── Mapper ───────────────────────────────────────────────────────────────────

function mapConversion(raw: PrismaConversionRecord): Conversion {
  return {
    id: raw.id,
    sessionId: raw.sessionId,
    userId: raw.userId,
    goal: raw.goal,
    value: raw.value,
    currency: raw.currency,
    properties: (raw.properties as Record<string, unknown>) ?? {},
    createdAt: raw.createdAt,
  };
}

// ─── Repository ───────────────────────────────────────────────────────────────

export class ConversionRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async create(input: CreateConversionInput): Promise<Conversion> {
    const raw = await this.prisma.analyticsConversion.create({
      data: {
        sessionId: input.sessionId,
        userId: input.userId ?? null,
        goal: input.goal,
        value: input.value ?? null,
        currency: input.currency ?? null,
        properties: input.properties ?? {},
      },
    });
    return mapConversion(raw);
  }

  async findById(id: string): Promise<Conversion | null> {
    const raw = await this.prisma.analyticsConversion.findUnique({
      where: { id },
    });
    return raw ? mapConversion(raw) : null;
  }

  async findMany(input: FindManyConversionsInput): Promise<Conversion[]> {
    const where: Record<string, unknown> = {};

    if (input.goal) where.goal = input.goal;
    if (input.sessionId) where.sessionId = input.sessionId;
    if (input.userId) where.userId = input.userId;
    if (input.from ?? input.to) {
      where.createdAt = {
        ...(input.from ? { gte: input.from } : {}),
        ...(input.to ? { lte: input.to } : {}),
      };
    }

    const rows = await this.prisma.analyticsConversion.findMany({
      where,
      skip: (input.page - 1) * input.limit,
      take: input.limit,
      orderBy: { createdAt: 'desc' },
    });

    return rows.map(mapConversion);
  }

  async countByGoal(input: CountByGoalInput): Promise<GoalCount[]> {
    const where: Record<string, unknown> = {};

    if (input.from ?? input.to) {
      where.createdAt = {
        ...(input.from ? { gte: input.from } : {}),
        ...(input.to ? { lte: input.to } : {}),
      };
    }
    if (input.sessionId) where.sessionId = input.sessionId;
    if (input.userId) where.userId = input.userId;

    const rows = await this.prisma.analyticsConversion.groupBy({
      by: ['goal'],
      where,
      _count: { goal: true },
    });

    return rows.map((row) => ({ goal: row.goal, count: row._count.goal }));
  }

  async conversionRate(input: ConversionRateInput): Promise<number> {
    const where: Record<string, unknown> = {};

    if (input.goal) where.goal = input.goal;
    if (input.from ?? input.to) {
      where.createdAt = {
        ...(input.from ? { gte: input.from } : {}),
        ...(input.to ? { lte: input.to } : {}),
      };
    }

    const [conversions, sessions] = await Promise.all([
      this.prisma.analyticsConversion.count({ where }),
      this.prisma.analyticsSession.count(),
    ]);

    if (sessions === 0) return 0;
    return conversions / sessions;
  }
}