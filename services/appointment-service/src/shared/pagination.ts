import { PAGINATION } from './constants';

export interface PaginationInput {
  page?: number;
  limit?: number;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

export interface PaginatedResult<T> {
  data: T[];
  meta: PaginationMeta;
}

export interface PrismaPageArgs {
  skip: number;
  take: number;
}

export function normalisePagination(input: PaginationInput): Required<PaginationInput> {
  const page = Math.max(1, Number(input.page) || PAGINATION.DEFAULT_PAGE);
  const limit = Math.min(
    PAGINATION.MAX_LIMIT,
    Math.max(1, Number(input.limit) || PAGINATION.DEFAULT_LIMIT),
  );
  return { page, limit };
}

export function toPrismaPageArgs(page: number, limit: number): PrismaPageArgs {
  return {
    skip: (page - 1) * limit,
    take: limit,
  };
}

export function buildPaginationMeta(page: number, limit: number, total: number): PaginationMeta {
  const totalPages = Math.ceil(total / limit);
  return {
    page,
    limit,
    total,
    totalPages,
    hasNextPage: page < totalPages,
    hasPreviousPage: page > 1,
  };
}

export function buildPaginatedResult<T>(
  data: T[],
  page: number,
  limit: number,
  total: number,
): PaginatedResult<T> {
  return {
    data,
    meta: buildPaginationMeta(page, limit, total),
  };
}

export function paginateQuery<T>(
  input: PaginationInput,
  total: number,
  data: T[],
): PaginatedResult<T> {
  const { page, limit } = normalisePagination(input);
  return buildPaginatedResult(data, page, limit, total);
}