import { PAGINATION_CONSTANTS } from './constants';
import { PaginatedResult, PaginationMeta, PaginationOptions, SortOrder } from './types';
import { ValidationError } from './errors';

export interface PaginationQuery {
  page?: number | string;
  limit?: number | string;
  sortBy?: string;
  sortOrder?: string;
}

export interface ParsedPagination {
  page: number;
  limit: number;
  skip: number;
  take: number;
  sortOrder: SortOrder;
}

export interface ParsedPaginationWithSort extends ParsedPagination {
  sortBy: string;
}

export function parsePagination(query: PaginationQuery): ParsedPagination {
  const page = Number(query.page ?? PAGINATION_CONSTANTS.DEFAULT_PAGE);
  const limit = Number(query.limit ?? PAGINATION_CONSTANTS.DEFAULT_LIMIT);

  if (!Number.isInteger(page) || page < 1) {
    throw new ValidationError('Invalid pagination parameters', {
      page: ['Page must be a positive integer'],
    });
  }

  if (
    !Number.isInteger(limit) ||
    limit < PAGINATION_CONSTANTS.MIN_LIMIT ||
    limit > PAGINATION_CONSTANTS.MAX_LIMIT
  ) {
    throw new ValidationError('Invalid pagination parameters', {
      limit: [
        `Limit must be between ${PAGINATION_CONSTANTS.MIN_LIMIT} and ${PAGINATION_CONSTANTS.MAX_LIMIT}`,
      ],
    });
  }

  const sortOrder =
    query.sortOrder?.toLowerCase() === SortOrder.ASC ? SortOrder.ASC : SortOrder.DESC;

  return {
    page,
    limit,
    skip: (page - 1) * limit,
    take: limit,
    sortOrder,
  };
}

export function parsePaginationWithSort(
  query: PaginationQuery,
  allowedSortFields: string[],
  defaultSortField: string,
): ParsedPaginationWithSort {
  const base = parsePagination(query);

  const sortBy =
    query.sortBy && allowedSortFields.includes(query.sortBy)
      ? query.sortBy
      : defaultSortField;

  return {
    ...base,
    sortBy,
  };
}

export function buildPaginationMeta(
  total: number,
  page: number,
  limit: number,
): PaginationMeta {
  const totalPages = Math.ceil(total / limit);

  return {
    page,
    limit,
    total,
    totalPages,
    hasNextPage: page < totalPages,
    hasPrevPage: page > 1,
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

export function buildPrismaOrderBy<T extends string>(
  sortBy: T,
  sortOrder: SortOrder,
): Record<T, SortOrder> {
  return { [sortBy]: sortOrder } as Record<T, SortOrder>;
}

export function buildCursorPagination(cursor: string | undefined, take: number) {
  if (!cursor) {
    return { take };
  }
  return {
    take,
    skip: 1,
    cursor: { id: cursor },
  };
}

export type OrderSortField =
  | 'createdAt'
  | 'updatedAt'
  | 'totalAmount'
  | 'orderNumber'
  | 'status';

export type PaymentSortField =
  | 'createdAt'
  | 'updatedAt'
  | 'amount'
  | 'paidAt'
  | 'status';

export type InvoiceSortField =
  | 'createdAt'
  | 'updatedAt'
  | 'issuedAt'
  | 'dueAt'
  | 'totalAmount'
  | 'status';

export type RefundSortField =
  | 'createdAt'
  | 'updatedAt'
  | 'amount'
  | 'initiatedAt'
  | 'status';

export const ORDER_ALLOWED_SORT_FIELDS: OrderSortField[] = [
  'createdAt',
  'updatedAt',
  'totalAmount',
  'orderNumber',
  'status',
];

export const PAYMENT_ALLOWED_SORT_FIELDS: PaymentSortField[] = [
  'createdAt',
  'updatedAt',
  'amount',
  'paidAt',
  'status',
];

export const INVOICE_ALLOWED_SORT_FIELDS: InvoiceSortField[] = [
  'createdAt',
  'updatedAt',
  'issuedAt',
  'dueAt',
  'totalAmount',
  'status',
];

export const REFUND_ALLOWED_SORT_FIELDS: RefundSortField[] = [
  'createdAt',
  'updatedAt',
  'amount',
  'initiatedAt',
  'status',
];