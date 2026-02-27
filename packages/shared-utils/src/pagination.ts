export interface PaginationParams {
  readonly page: number;
  readonly limit: number;
}

export interface PaginationMeta {
  readonly page: number;
  readonly limit: number;
  readonly total: number;
  readonly totalPages: number;
  readonly hasNextPage: boolean;
  readonly hasPrevPage: boolean;
}

export interface PaginatedResult<T> {
  readonly items: readonly T[];
  readonly pagination: PaginationMeta;
}

export interface CursorPaginationParams {
  readonly cursor?: string | undefined;
  readonly limit: number;
  readonly direction?: 'forward' | 'backward' | undefined;
}

export interface CursorPaginationMeta {
  readonly nextCursor: string | null;
  readonly prevCursor: string | null;
  readonly hasNextPage: boolean;
  readonly hasPrevPage: boolean;
  readonly limit: number;
}

export interface CursorPaginatedResult<T> {
  readonly items: readonly T[];
  readonly pagination: CursorPaginationMeta;
}

export interface PrismaOffsetArgs {
  readonly skip: number;
  readonly take: number;
}

const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 100;
const MIN_LIMIT = 1;
const MIN_PAGE = 1;

export function parsePaginationParams(
  rawPage: unknown,
  rawLimit: unknown,
  defaults?: Partial<PaginationParams> | undefined,
): PaginationParams {
  const defaultPage = defaults?.page ?? DEFAULT_PAGE;
  const defaultLimit = defaults?.limit ?? DEFAULT_LIMIT;

  const page = typeof rawPage === 'string'
    ? Math.max(MIN_PAGE, parseInt(rawPage, 10) || defaultPage)
    : typeof rawPage === 'number'
      ? Math.max(MIN_PAGE, Math.floor(rawPage))
      : defaultPage;

  const limit = typeof rawLimit === 'string'
    ? Math.min(MAX_LIMIT, Math.max(MIN_LIMIT, parseInt(rawLimit, 10) || defaultLimit))
    : typeof rawLimit === 'number'
      ? Math.min(MAX_LIMIT, Math.max(MIN_LIMIT, Math.floor(rawLimit)))
      : defaultLimit;

  return { page, limit };
}

export function buildPaginationMeta(
  params: PaginationParams,
  total: number,
): PaginationMeta {
  const totalPages = total === 0 ? 1 : Math.ceil(total / params.limit);
  return {
    page: params.page,
    limit: params.limit,
    total,
    totalPages,
    hasNextPage: params.page < totalPages,
    hasPrevPage: params.page > 1,
  };
}

export function toPrismaOffsetArgs(params: PaginationParams): PrismaOffsetArgs {
  return {
    skip: (params.page - 1) * params.limit,
    take: params.limit,
  };
}

export function buildPaginatedResult<T>(
  items: readonly T[],
  params: PaginationParams,
  total: number,
): PaginatedResult<T> {
  return {
    items,
    pagination: buildPaginationMeta(params, total),
  };
}

export function buildCursorPaginationMeta<T extends { id: string }>(
  items: readonly T[],
  limit: number,
  hasMore: boolean,
  prevCursor?: string | undefined,
): CursorPaginationMeta {
  const lastItem = items[items.length - 1];
  return {
    nextCursor: hasMore && lastItem !== undefined ? lastItem.id : null,
    prevCursor: prevCursor ?? null,
    hasNextPage: hasMore,
    hasPrevPage: prevCursor !== undefined,
    limit,
  };
}

export function buildCursorPaginatedResult<T extends { id: string }>(
  items: readonly T[],
  limit: number,
  prevCursor?: string | undefined,
): CursorPaginatedResult<T> {
  const hasMore = items.length > limit;
  const slicedItems = hasMore ? items.slice(0, limit) : items;

  return {
    items: slicedItems,
    pagination: buildCursorPaginationMeta(slicedItems, limit, hasMore, prevCursor),
  };
}

export function toPrismaCursorArgs(
  params: CursorPaginationParams,
): { cursor?: { id: string }; skip?: number; take: number } {
  const result: { cursor?: { id: string }; skip?: number; take: number } = {
    take: params.limit + 1,
  };
  
  if (params.cursor !== undefined) {
    result.cursor = { id: params.cursor };
    result.skip = 1;
  }
  
  return result;
}

export function calculateOffset(page: number, limit: number): number {
  return (page - 1) * limit;
}

export function getPageFromOffset(offset: number, limit: number): number {
  return Math.floor(offset / limit) + 1;
}

export function isLastPage(pagination: PaginationMeta): boolean {
  return !pagination.hasNextPage;
}

export function isFirstPage(pagination: PaginationMeta): boolean {
  return !pagination.hasPrevPage;
}

export function clampLimit(limit: number, max: number = MAX_LIMIT): number {
  return Math.min(Math.max(MIN_LIMIT, limit), max);
}