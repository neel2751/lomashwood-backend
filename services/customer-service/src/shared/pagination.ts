import { z } from 'zod';
import { Pagination, SortOrder, SortOrderValue } from './constants';
import { PaginationMeta, PaginatedResult } from './types';

export const PaginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(Pagination.DEFAULT_PAGE),
  limit: z.coerce
    .number()
    .int()
    .min(Pagination.MIN_LIMIT)
    .max(Pagination.MAX_LIMIT)
    .default(Pagination.DEFAULT_LIMIT),
});

export const SortSchema = z.object({
  sortOrder: z.nativeEnum(SortOrder).default(SortOrder.DESC),
  sortBy: z.string().optional(),
});

export const DateRangeSchema = z.object({
  from: z.string().datetime({ offset: true }).optional(),
  to: z.string().datetime({ offset: true }).optional(),
});

export const BaseQuerySchema = PaginationSchema.merge(SortSchema).merge(DateRangeSchema);

export type PaginationInput = z.infer<typeof PaginationSchema>;
export type SortInput = z.infer<typeof SortSchema>;
export type DateRangeInput = z.infer<typeof DateRangeSchema>;
export type BaseQueryInput = z.infer<typeof BaseQuerySchema>;

export function buildPaginationMeta(
  total: number,
  page: number,
  limit: number,
): PaginationMeta {
  const totalPages = Math.ceil(total / limit);
  return {
    total,
    page,
    limit,
    totalPages,
    hasNextPage: page < totalPages,
    hasPreviousPage: page > 1,
  };
}

export function buildPaginatedResult<T>(
  data: T[],
  total: number,
  page: number,
  limit: number,
): PaginatedResult<T> {
  return {
    data,
    meta: buildPaginationMeta(total, page, limit),
  };
}

export function toSkip(page: number, limit: number): number {
  return (page - 1) * limit;
}

export function toPrismaOrderBy(
  sortBy?: string,
  sortOrder: SortOrderValue = SortOrder.DESC,
): Record<string, SortOrderValue> {
  return { [sortBy ?? 'createdAt']: sortOrder };
}

export function buildCursorPagination(cursor?: string, limit = Pagination.DEFAULT_LIMIT): {
  take: number;
  skip: number;
  cursor?: { id: string };
} {
  return {
    take: limit,
    skip: cursor ? 1 : 0,
    ...(cursor && { cursor: { id: cursor } }),
  };
}

export function validateDateRange(from?: string, to?: string): void {
  if (from && to && new Date(from) > new Date(to)) {
    throw new Error("'from' date must be before 'to' date");
  }
}

export function normalizePage(page: unknown): number {
  const parsed = Number(page);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : Pagination.DEFAULT_PAGE;
}

export function normalizeLimit(limit: unknown): number {
  const parsed = Number(limit);
  return Number.isInteger(parsed) &&
    parsed >= Pagination.MIN_LIMIT &&
    parsed <= Pagination.MAX_LIMIT
    ? parsed
    : Pagination.DEFAULT_LIMIT;
}