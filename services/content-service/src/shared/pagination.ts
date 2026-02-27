import { z } from 'zod';
import { PAGINATION } from './constants';
import type { PaginationMeta, PaginationQuery, SortQuery, PaginatedResult } from './types';



export const paginationQuerySchema = z.object({
  page: z
    .coerce
    .number()
    .int()
    .min(PAGINATION.MIN_LIMIT)
    .default(PAGINATION.DEFAULT_PAGE),
  limit: z
    .coerce
    .number()
    .int()
    .min(PAGINATION.MIN_LIMIT)
    .max(PAGINATION.MAX_LIMIT)
    .default(PAGINATION.DEFAULT_LIMIT),
});

export const sortQuerySchema = (allowedFields: readonly string[]) =>
  z.object({
    sortBy: z
      .string()
      .refine((v) => allowedFields.includes(v), {
        message: `sortBy must be one of: ${allowedFields.join(', ')}`,
      })
      .default(allowedFields[0]),
    sortOrder: z.enum(['asc', 'desc']).default('desc'),
  });

export const dateRangeSchema = z.object({
  from: z.string().datetime({ offset: true }).optional(),
  to: z.string().datetime({ offset: true }).optional(),
}).refine(
  (data) => {
    if (data.from && data.to) {
      return new Date(data.from) <= new Date(data.to);
    }
    return true;
  },
  { message: '"from" must be before or equal to "to"' },
);



/**
 * Converts page/limit to Prisma `skip`/`take`.
 *
 * @example
 * toPrismaSkipTake({ page: 2, limit: 20 })
 * 
 */
export function toPrismaSkipTake(query: PaginationQuery): {
  skip: number;
  take: number;
} {
  return {
    skip: (query.page - 1) * query.limit,
    take: query.limit,
  };
}

/**
 * Converts sortBy/sortOrder to a Prisma `orderBy` clause.
 *
 * @example
 * toPrismaOrderBy({ sortBy: 'publishedAt', sortOrder: 'desc' })
 * 
 */
export function toPrismaOrderBy(query: SortQuery): Record<string, 'asc' | 'desc'> {
  return { [query.sortBy]: query.sortOrder };
}



/**
 * Builds the `PaginationMeta` object for API responses.
 *
 * @example
 * buildPaginationMeta({ page: 2, limit: 20 }, 95)
 * 
 */
export function buildPaginationMeta(
  query: PaginationQuery,
  total: number,
): PaginationMeta {
  const totalPages = Math.ceil(total / query.limit);

  return {
    page: query.page,
    limit: query.limit,
    total,
    totalPages,
    hasNextPage: query.page < totalPages,
    hasPreviousPage: query.page > 1,
  };
}



/**
 * Wraps a data array and pagination meta into a `PaginatedResult<T>`.
 *
 * @example
 * buildPaginatedResult(blogs, { page: 1, limit: 20 }, 45)
 */
export function buildPaginatedResult<T>(
  data: T[],
  query: PaginationQuery,
  total: number,
): PaginatedResult<T> {
  return {
    data,
    pagination: buildPaginationMeta(query, total),
  };
}



export interface CursorPaginationQuery {
  cursor?: string;
  limit: number;
  direction?: 'forward' | 'backward';
}

export interface CursorPaginationMeta {
  nextCursor: string | null;
  previousCursor: string | null;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
  limit: number;
}

export interface CursorPaginatedResult<T extends { id: string }> {
  data: T[];
  pagination: CursorPaginationMeta;
}

/**
 * Builds cursor-based pagination args for Prisma.
 * Fetches `limit + 1` records to determine if a next page exists.
 */
export function toPrismaCursorArgs(query: CursorPaginationQuery): {
  take: number;
  skip: number;
  cursor?: { id: string };
} {
  return {
    take: query.limit + 1,
    skip: query.cursor ? 1 : 0,
    ...(query.cursor ? { cursor: { id: query.cursor } } : {}),
  };
}

/**
 * Processes cursor-paginated results, trimming the extra record
 * and building the `CursorPaginationMeta`.
 */
export function buildCursorPaginatedResult<T extends { id: string }>(
  rawData: T[],
  query: CursorPaginationQuery,
): CursorPaginatedResult<T> {
  const hasNextPage = rawData.length > query.limit;
  const data = hasNextPage ? rawData.slice(0, query.limit) : rawData;

  const nextCursor = hasNextPage ? (data[data.length - 1]?.id ?? null) : null;
  const previousCursor = query.cursor ?? null;

  return {
    data,
    pagination: {
      nextCursor,
      previousCursor,
      hasNextPage,
      hasPreviousPage: !!query.cursor,
      limit: query.limit,
    },
  };
}



/**
 * Returns a normalised page query with defaults applied.
 * Safe to call with raw, unvalidated query params after Zod parsing.
 */
export function normalisePaginationQuery(raw: Partial<PaginationQuery>): PaginationQuery {
  const page = Math.max(PAGINATION.MIN_LIMIT, raw.page ?? PAGINATION.DEFAULT_PAGE);
  const limit = Math.min(
    PAGINATION.MAX_LIMIT,
    Math.max(PAGINATION.MIN_LIMIT, raw.limit ?? PAGINATION.DEFAULT_LIMIT),
  );

  return { page, limit };
}