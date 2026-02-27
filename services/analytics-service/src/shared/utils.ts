import type { IDateRange, IDateRangeInput, DateGranularity, ITimeSeriesPoint, INotificationMetrics, IEngagementMetrics } from './types';
import { DATE_RANGE_PRESETS, DATE_GRANULARITY } from './constants';

export function resolveDate(input: string | Date | undefined): Date | undefined {
  if (!input) return undefined;
  if (input instanceof Date) return input;
  const parsed = new Date(input);
  if (isNaN(parsed.getTime())) return undefined;
  return parsed;
}

export function resolveDateRange(input: IDateRangeInput): IDateRange {
  if (input.preset && input.preset !== DATE_RANGE_PRESETS.CUSTOM) {
    return presetToDateRange(input.preset);
  }

  const from = resolveDate(input.from);
  const to   = resolveDate(input.to);

  if (!from || !to) {
    return presetToDateRange(DATE_RANGE_PRESETS.LAST_30_DAYS);
  }

  if (from > to) {
    throw new Error('Date range "from" must be before "to"');
  }

  return { from, to };
}

export function presetToDateRange(preset: string): IDateRange {
  const now   = new Date();
  const today = startOfDay(now);

  switch (preset) {
    case DATE_RANGE_PRESETS.TODAY:
      return { from: today, to: endOfDay(now) };

    case DATE_RANGE_PRESETS.YESTERDAY: {
      const yesterday = addDays(today, -1);
      return { from: yesterday, to: endOfDay(yesterday) };
    }

    case DATE_RANGE_PRESETS.LAST_7_DAYS:
      return { from: addDays(today, -6), to: endOfDay(now) };

    case DATE_RANGE_PRESETS.LAST_30_DAYS:
      return { from: addDays(today, -29), to: endOfDay(now) };

    case DATE_RANGE_PRESETS.LAST_90_DAYS:
      return { from: addDays(today, -89), to: endOfDay(now) };

    case DATE_RANGE_PRESETS.THIS_MONTH:
      return { from: startOfMonth(now), to: endOfDay(now) };

    case DATE_RANGE_PRESETS.LAST_MONTH: {
      const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      return { from: startOfMonth(lastMonth), to: endOfMonth(lastMonth) };
    }

    case DATE_RANGE_PRESETS.THIS_YEAR:
      return { from: startOfYear(now), to: endOfDay(now) };

    default:
      return { from: addDays(today, -29), to: endOfDay(now) };
  }
}

export function startOfDay(date: Date): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

export function endOfDay(date: Date): Date {
  const d = new Date(date);
  d.setHours(23, 59, 59, 999);
  return d;
}

export function startOfMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), 1, 0, 0, 0, 0);
}

export function endOfMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59, 999);
}

export function startOfYear(date: Date): Date {
  return new Date(date.getFullYear(), 0, 1, 0, 0, 0, 0);
}

export function addDays(date: Date, days: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

export function differenceInDays(from: Date, to: Date): number {
  const ms = to.getTime() - from.getTime();
  return Math.round(ms / (1000 * 60 * 60 * 24));
}

export function inferGranularity(range: IDateRange): DateGranularity {
  const days = differenceInDays(range.from, range.to);

  if (days <= 1)  return DATE_GRANULARITY.HOUR;
  if (days <= 30) return DATE_GRANULARITY.DAY;
  if (days <= 90) return DATE_GRANULARITY.WEEK;
  if (days <= 730) return DATE_GRANULARITY.MONTH;
  return DATE_GRANULARITY.YEAR;
}

export function formatTimestampByGranularity(date: Date, granularity: DateGranularity): string {
  const iso = date.toISOString();
  switch (granularity) {
    case DATE_GRANULARITY.HOUR:  return iso.slice(0, 13) + ':00:00.000Z';
    case DATE_GRANULARITY.DAY:   return iso.slice(0, 10);
    case DATE_GRANULARITY.WEEK:  return getISOWeekLabel(date);
    case DATE_GRANULARITY.MONTH: return iso.slice(0, 7);
    case DATE_GRANULARITY.YEAR:  return iso.slice(0, 4);
    default:                     return iso.slice(0, 10);
  }
}

export function getISOWeekLabel(date: Date): string {
  const year = date.getFullYear();
  const week = getISOWeek(date);
  return `${year}-W${String(week).padStart(2, '0')}`;
}

export function getISOWeek(date: Date): number {
  const d        = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum   = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
}

export function fillTimeSeriesGaps(
  points:      ITimeSeriesPoint[],
  range:       IDateRange,
  granularity: DateGranularity,
  defaultValue = 0,
): ITimeSeriesPoint[] {
  const pointMap = new Map(points.map((p) => [p.timestamp, p.value]));
  const filled: ITimeSeriesPoint[] = [];
  const cursor = new Date(range.from);

  while (cursor <= range.to) {
    const label = formatTimestampByGranularity(cursor, granularity);
    if (!filled.find((p) => p.timestamp === label)) {
      filled.push({ timestamp: label, value: pointMap.get(label) ?? defaultValue });
    }
    advanceCursor(cursor, granularity);
  }

  return filled;
}

function advanceCursor(cursor: Date, granularity: DateGranularity): void {
  switch (granularity) {
    case DATE_GRANULARITY.HOUR:  cursor.setHours(cursor.getHours() + 1);   break;
    case DATE_GRANULARITY.DAY:   cursor.setDate(cursor.getDate() + 1);     break;
    case DATE_GRANULARITY.WEEK:  cursor.setDate(cursor.getDate() + 7);     break;
    case DATE_GRANULARITY.MONTH: cursor.setMonth(cursor.getMonth() + 1);   break;
    case DATE_GRANULARITY.YEAR:  cursor.setFullYear(cursor.getFullYear() + 1); break;
  }
}

export function safeRate(numerator: number, denominator: number, decimalPlaces = 4): number {
  if (denominator === 0) return 0;
  const raw = numerator / denominator;
  const factor = Math.pow(10, decimalPlaces);
  return Math.round(raw * factor) / factor;
}

export function toPercent(rate: number): number {
  return Math.round(rate * 10000) / 100;
}

export function computeNotificationMetrics(raw: {
  total:     number;
  sent:      number;
  delivered: number;
  failed:    number;
  pending:   number;
  cancelled: number;
  bounced:   number;
}): INotificationMetrics {
  return {
    ...raw,
    deliveryRate: safeRate(raw.delivered, raw.sent),
    failureRate:  safeRate(raw.failed, raw.total),
    bounceRate:   safeRate(raw.bounced, raw.delivered + raw.bounced),
  };
}

export function computeEngagementMetrics(raw: {
  totalDelivered:    number;
  totalOpened:       number;
  totalClicked:      number;
  totalUnsubscribed: number;
  totalComplained:   number;
}): IEngagementMetrics {
  return {
    ...raw,
    openRate:         safeRate(raw.totalOpened,       raw.totalDelivered),
    clickRate:        safeRate(raw.totalClicked,      raw.totalDelivered),
    clickToOpenRate:  safeRate(raw.totalClicked,      raw.totalOpened),
    unsubscribeRate:  safeRate(raw.totalUnsubscribed, raw.totalDelivered),
    complaintRate:    safeRate(raw.totalComplained,   raw.totalDelivered),
  };
}

export function roundToDecimalPlaces(value: number, places: number): number {
  const factor = Math.pow(10, places);
  return Math.round(value * factor) / factor;
}

export function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

export function groupBy<T>(items: T[], keyFn: (item: T) => string): Record<string, T[]> {
  return items.reduce<Record<string, T[]>>((acc, item) => {
    const key = keyFn(item);
    (acc[key] ??= []).push(item);
    return acc;
  }, {});
}

export function sumBy<T>(items: T[], valueFn: (item: T) => number): number {
  return items.reduce((sum, item) => sum + valueFn(item), 0);
}

export function sortBy<T>(items: T[], keyFn: (item: T) => number | string, direction: 'asc' | 'desc' = 'asc'): T[] {
  return [...items].sort((a, b) => {
    const valA = keyFn(a);
    const valB = keyFn(b);
    const cmp  = valA < valB ? -1 : valA > valB ? 1 : 0;
    return direction === 'asc' ? cmp : -cmp;
  });
}

export function chunk<T>(array: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < array.length; i += size) {
    chunks.push(array.slice(i, i + size));
  }
  return chunks;
}

export function omit<T extends Record<string, unknown>, K extends keyof T>(obj: T, keys: K[]): Omit<T, K> {
  const result = { ...obj };
  keys.forEach((key) => delete result[key]);
  return result as Omit<T, K>;
}

export function pick<T extends Record<string, unknown>, K extends keyof T>(obj: T, keys: K[]): Pick<T, K> {
  const result = {} as Pick<T, K>;
  keys.forEach((key) => { result[key] = obj[key]; });
  return result;
}

export function isValidDateRange(range: IDateRange): boolean {
  return range.from instanceof Date
    && range.to instanceof Date
    && !isNaN(range.from.getTime())
    && !isNaN(range.to.getTime())
    && range.from <= range.to;
}

export function buildCacheKey(...parts: string[]): string {
  return parts.join(':');
}

export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}