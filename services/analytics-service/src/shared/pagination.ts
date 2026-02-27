import { PAGINATION } from './constants';
import type { IPaginationMeta, IPaginatedResponse } from './types';
import { BadRequestError } from './errors';

export interface IPaginationInput {
  page?:  number | string;
  limit?: number | string;
}

export interface IPaginationOptions {
  page:  number;
  limit: number;
  skip:  number;
}

export function parsePagination(input: IPaginationInput): IPaginationOptions {
  const rawPage  = typeof input.page  === 'string' ? parseInt(input.page,  10) : (input.page  ?? PAGINATION.DEFAULT_PAGE);
  const rawLimit = typeof input.limit === 'string' ? parseInt(input.limit, 10) : (input.limit ?? PAGINATION.DEFAULT_LIMIT);

  if (isNaN(rawPage) || rawPage < 1) {
    throw new BadRequestError(`Invalid page value: '${input.page}'. Must be a positive integer.`);
  }

  if (isNaN(rawLimit) || rawLimit < PAGINATION.MIN_LIMIT || rawLimit > PAGINATION.MAX_LIMIT) {
    throw new BadRequestError(
      `Invalid limit value: '${input.limit}'. Must be between ${PAGINATION.MIN_LIMIT} and ${PAGINATION.MAX_LIMIT}.`,
    );
  }

  const page  = Math.floor(rawPage);
  const limit = Math.floor(rawLimit);
  const skip  = (page - 1) * limit;

  return { page, limit, skip };
}

export function buildPaginationMeta(
  page:  number,
  limit: number,
  total: number,
): IPaginationMeta {
  const totalPages = total === 0 ? 1 : Math.ceil(total / limit);

  return {
    page,
    limit,
    total,
    totalPages,
    hasNext: page < totalPages,
    hasPrev: page > 1,
  };
}

export function buildPaginatedResponse<T>(
  data:  T[],
  page:  number,
  limit: number,
  total: number,
): IPaginatedResponse<T> {
  return {
    data,
    pagination: buildPaginationMeta(page, limit, total),
  };
}

export function buildPrismaSkipTake(options: IPaginationOptions): { skip: number; take: number } {
  return {
    skip: options.skip,
    take: options.limit,
  };
}

export function assertPageInBounds(page: number, totalPages: number): void {
  if (totalPages > 0 && page > totalPages) {
    throw new BadRequestError(
      `Page ${page} does not exist. Total pages: ${totalPages}.`,
    );
  }
}

export function parseSortOrder(input: string | undefined, allowedFields: string[]): { field: string; direction: 'asc' | 'desc' } {
  const DEFAULT_FIELD     = 'createdAt';
  const DEFAULT_DIRECTION = 'desc' as const;

  if (!input) return { field: DEFAULT_FIELD, direction: DEFAULT_DIRECTION };

  const [rawField, rawDir] = input.split(':');
  const field     = rawField ?? DEFAULT_FIELD;
  const direction = rawDir === 'asc' ? 'asc' : DEFAULT_DIRECTION;

  if (!allowedFields.includes(field)) {
    throw new BadRequestError(
      `Invalid sort field '${field}'. Allowed: ${allowedFields.join(', ')}.`,
    );
  }

  return { field, direction };
}

export function paginateArray<T>(array: T[], page: number, limit: number): IPaginatedResponse<T> {
  const total = array.length;
  const skip  = (page - 1) * limit;
  const data  = array.slice(skip, skip + limit);
  return buildPaginatedResponse(data, page, limit, total);
}