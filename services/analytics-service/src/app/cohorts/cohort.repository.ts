import { PrismaClient } from '@prisma/client';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface CohortCriteria {
  event: string;
  from: string;
  to: string;
  [key: string]: unknown;
}

export interface CohortRecord {
  id: string;
  name: string;
  description?: string | null;
  criteria: CohortCriteria;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateCohortInput {
  name: string;
  description?: string;
  criteria: CohortCriteria;
}

export interface UpdateCohortInput {
  name?: string;
  description?: string;
  criteria?: CohortCriteria;
}

export interface RetentionWeek {
  week: number;
  retained: number;
  retentionRate: number;
}

export interface RetentionResult {
  cohortSize: number;
  weeks: RetentionWeek[];
}

// ─── Repository ───────────────────────────────────────────────────────────────

export class CohortRepository {
  constructor(private readonly prisma: PrismaClient) {}

  // ── create ─────────────────────────────────────────────────────────────────
  /**
   * Creates a new cohort record and returns the mapped result.
   */
  async create(input: CreateCohortInput): Promise<CohortRecord> {
    const { name, description, criteria } = input;

    const record = await this.prisma.analyticsCohort.create({
      data: {
        name,
        description: description ?? null,
        criteria,
      },
    });

    return this.mapToRecord(record);
  }

  // ── findById ───────────────────────────────────────────────────────────────
  /**
   * Finds a cohort by its ID.
   * Returns null if not found.
   */
  async findById(id: string): Promise<CohortRecord | null> {
    const record = await this.prisma.analyticsCohort.findUnique({
      where: { id },
    });

    if (!record) return null;

    return this.mapToRecord(record);
  }

  // ── findAll ────────────────────────────────────────────────────────────────
  /**
   * Returns all cohort records ordered by creation date descending.
   */
  async findAll(): Promise<CohortRecord[]> {
    const records = await this.prisma.analyticsCohort.findMany({
      orderBy: { createdAt: 'desc' },
    });

    return records.map((r: any) => this.mapToRecord(r));
  }

  // ── update ─────────────────────────────────────────────────────────────────
  /**
   * Updates a cohort by ID and returns the updated mapped record.
   */
  async update(id: string, input: UpdateCohortInput): Promise<CohortRecord> {
    const record = await this.prisma.analyticsCohort.update({
      where: { id },
      data: {
        ...(input.name !== undefined && { name: input.name }),
        ...(input.description !== undefined && { description: input.description }),
        ...(input.criteria !== undefined && { criteria: input.criteria }),
        updatedAt: new Date(),
      },
    });

    return this.mapToRecord(record);
  }

  // ── delete ─────────────────────────────────────────────────────────────────
  /**
   * Deletes a cohort by ID.
   */
  async delete(id: string): Promise<void> {
    await this.prisma.analyticsCohort.delete({
      where: { id },
    });
  }

  // ── computeRetention ───────────────────────────────────────────────────────
  /**
   * Computes week-by-week retention for a given cohort.
   *
   * Algorithm:
   *  1. Find all users who triggered the cohort entry event in the criteria window (week 0)
   *  2. For each subsequent week (1..N), count how many of those users
   *     were active again (triggered any event)
   *  3. Return cohortSize + array of { week, retained, retentionRate }
   */
  async computeRetention(
    cohort: CohortRecord,
    options: { weeks: number },
  ): Promise<RetentionResult> {
    const { weeks } = options;
    const { criteria } = cohort;

    // ── Step 1: Get cohort users from entry window ───────────────────────────
    const cohortUsers: Array<{ userId: string }> =
      await this.prisma.analyticsEvent.findMany({
        where: {
          name: criteria.event,
          createdAt: {
            gte: new Date(criteria.from),
            lte: new Date(criteria.to),
          },
        },
        select: { userId: true },
        distinct: ['userId'],
      });

    const cohortSize = cohortUsers.length;

    // If no users in cohort, return early with empty weeks
    if (cohortSize === 0) {
      return {
        cohortSize: 0,
        weeks: [],
      };
    }

    const userIds = cohortUsers.map((u) => u.userId);

    // ── Step 2: Compute retention for week 0 through week N ─────────────────
    const cohortStart = new Date(criteria.from);
    const retentionWeeks: RetentionWeek[] = [];

    for (let week = 0; week <= weeks; week++) {
      // Window for this week: cohortStart + (week * 7 days)
      const windowStart = new Date(cohortStart);
      windowStart.setDate(windowStart.getDate() + week * 7);

      const windowEnd = new Date(windowStart);
      windowEnd.setDate(windowEnd.getDate() + 6);
      windowEnd.setHours(23, 59, 59, 999);

      // Count how many cohort users had any event in this week's window
      const retained = await this.prisma.analyticsEvent.count({
        where: {
          userId: { in: userIds },
          createdAt: {
            gte: windowStart,
            lte: windowEnd,
          },
        },
      });

      retentionWeeks.push({
        week,
        retained,
        retentionRate: cohortSize > 0 ? retained / cohortSize : 0,
      });
    }

    return {
      cohortSize,
      weeks: retentionWeeks,
    };
  }

  // ── Private: mapper ────────────────────────────────────────────────────────
  /**
   * Maps a raw Prisma record to the clean CohortRecord shape.
   */
  private mapToRecord(raw: any): CohortRecord {
    return {
      id: raw.id,
      name: raw.name,
      description: raw.description ?? null,
      criteria: raw.criteria as CohortCriteria,
      createdAt: raw.createdAt,
      updatedAt: raw.updatedAt,
    };
  }
}