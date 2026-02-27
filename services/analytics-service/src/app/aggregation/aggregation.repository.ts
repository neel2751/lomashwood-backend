import { PrismaClient } from '@prisma/client';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface AggregationRecord {
  id: string;
  period: string;
  date: Date;
  sessions: number;
  pageviews: number;
  conversions: number;
  conversionRate: number;
  avgSessionDuration: number;
  bounceRate: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface GetAggregatedMetricsInput {
  period: string;
  from: Date;
  to: Date;
}

export interface UpsertAggregationInput {
  period: string;
  date: Date;
  sessions: number;
  pageviews: number;
  conversions: number;
  conversionRate: number;
  avgSessionDuration: number;
  bounceRate: number;
}

// ─── Repository ───────────────────────────────────────────────────────────────

export class AggregationRepository {
  constructor(private readonly prisma: PrismaClient) {}

  // ── runDailyAggregation ────────────────────────────────────────────────────
  /**
   * Gathers raw metrics for the given date, computes aggregated values,
   * and upserts the result into analyticsAggregation.
   */
  async runDailyAggregation(date: Date): Promise<AggregationRecord> {
    // Build start/end boundaries for the target day
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    const dateFilter = {
      gte: startOfDay,
      lte: endOfDay,
    };

    // ── Fetch raw counts in parallel ────────────────────────────────────────
    const [sessions, pageviews, conversions, sessionAgg, sessionList] =
      await Promise.all([
        // Total sessions for the day
        this.prisma.analyticsSession.count({
          where: { createdAt: dateFilter },
        }),

        // Total pageviews for the day
        this.prisma.analyticsPageview.count({
          where: { createdAt: dateFilter },
        }),

        // Total conversions for the day
        this.prisma.analyticsConversion.count({
          where: { createdAt: dateFilter },
        }),

        // Average session duration
        this.prisma.analyticsSession.aggregate({
          _avg: { duration: true },
          where: { createdAt: dateFilter },
        }),

        // Session list needed for bounce-rate calculation
        // A "bounce" = session with only 1 pageview
        this.prisma.analyticsSession.findMany({
          where: { createdAt: dateFilter },
          select: { id: true, bounced: true },
        }),
      ]);

    // ── Derived metrics ──────────────────────────────────────────────────────

    // Conversion rate: avoid division by zero
    const conversionRate = sessions > 0 ? conversions / sessions : 0;

    // Average session duration (fall back to 0 if null)
    const avgSessionDuration = sessionAgg._avg?.duration ?? 0;

    // Bounce rate: sessions marked as bounced / total sessions
    const bouncedCount = sessionList.filter(
      (s: { id: string; bounced?: boolean }) => s.bounced === true,
    ).length;
    const bounceRate = sessions > 0 ? bouncedCount / sessions : 0;

    // ── Upsert aggregated record ─────────────────────────────────────────────
    return this.upsertAggregation({
      period: 'day',
      date: startOfDay,
      sessions,
      pageviews,
      conversions,
      conversionRate,
      avgSessionDuration,
      bounceRate,
    });
  }

  // ── getAggregatedMetrics ───────────────────────────────────────────────────
  /**
   * Returns aggregation records filtered by period and date range.
   */
  async getAggregatedMetrics(
    input: GetAggregatedMetricsInput,
  ): Promise<AggregationRecord[]> {
    const { period, from, to } = input;

    return this.prisma.analyticsAggregation.findMany({
      where: {
        period,
        date: {
          gte: from,
          lte: to,
        },
      },
      orderBy: {
        date: 'asc',
      },
    });
  }

  // ── upsertAggregation ──────────────────────────────────────────────────────
  /**
   * Inserts or updates an aggregation record identified by (period + date).
   */
  async upsertAggregation(
    input: UpsertAggregationInput,
  ): Promise<AggregationRecord> {
    const {
      period,
      date,
      sessions,
      pageviews,
      conversions,
      conversionRate,
      avgSessionDuration,
      bounceRate,
    } = input;

    return this.prisma.analyticsAggregation.upsert({
      where: {
        // Composite unique key: period + date
        period_date: {
          period,
          date,
        },
      },
      update: {
        sessions,
        pageviews,
        conversions,
        conversionRate,
        avgSessionDuration,
        bounceRate,
        updatedAt: new Date(),
      },
      create: {
        period,
        date,
        sessions,
        pageviews,
        conversions,
        conversionRate,
        avgSessionDuration,
        bounceRate,
      },
    });
  }
}