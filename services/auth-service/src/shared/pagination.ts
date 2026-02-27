import { AUTH_CONSTANTS } from './constants';
import { PaginationParams, PaginatedResponse } from './types';

export class PaginationHelper {
  static validateParams(params: Partial<PaginationParams>): PaginationParams {
    const page = Math.max(1, params.page || AUTH_CONSTANTS.PAGINATION.DEFAULT_PAGE);
    const limit = Math.min(
      AUTH_CONSTANTS.PAGINATION.MAX_LIMIT,
      Math.max(1, params.limit || AUTH_CONSTANTS.PAGINATION.DEFAULT_LIMIT)
    );

    return {
      page,
      limit,
      sortBy: params.sortBy,
      sortOrder: params.sortOrder || 'desc',
    };
  }

  static calculateOffset(page: number, limit: number): number {
    return (page - 1) * limit;
  }

  static calculateTotalPages(total: number, limit: number): number {
    return Math.ceil(total / limit);
  }

  static buildResponse<T>(
    data: T[],
    total: number,
    params: PaginationParams
  ): PaginatedResponse<T> {
    const totalPages = this.calculateTotalPages(total, params.limit);

    return {
      data,
      pagination: {
        page: params.page,
        limit: params.limit,
        total,
        totalPages,
        hasNext: params.page < totalPages,
        hasPrevious: params.page > 1,
      },
    };
  }

  static getPrismaParams(params: PaginationParams): {
    skip: number;
    take: number;
    orderBy?: Record<string, 'asc' | 'desc'>;
  } {
    const skip = this.calculateOffset(params.page, params.limit);
    const take = params.limit;

    const result: {
      skip: number;
      take: number;
      orderBy?: Record<string, 'asc' | 'desc'>;
    } = { skip, take };

    if (params.sortBy) {
      result.orderBy = {
        [params.sortBy]: params.sortOrder || 'desc',
      };
    }

    return result;
  }

  static getPageInfo(page: number, limit: number, total: number) {
    const totalPages = this.calculateTotalPages(total, limit);
    const offset = this.calculateOffset(page, limit);

    return {
      currentPage: page,
      itemsPerPage: limit,
      totalItems: total,
      totalPages,
      offset,
      hasNext: page < totalPages,
      hasPrevious: page > 1,
      isFirstPage: page === 1,
      isLastPage: page === totalPages,
      nextPage: page < totalPages ? page + 1 : null,
      previousPage: page > 1 ? page - 1 : null,
      startIndex: offset + 1,
      endIndex: Math.min(offset + limit, total),
    };
  }

  static createEmptyResponse<T>(): PaginatedResponse<T> {
    return {
      data: [],
      pagination: {
        page: 1,
        limit: AUTH_CONSTANTS.PAGINATION.DEFAULT_LIMIT,
        total: 0,
        totalPages: 0,
        hasNext: false,
        hasPrevious: false,
      },
    };
  }

  static parsePaginationQuery(query: Record<string, unknown>): PaginationParams {
    return this.validateParams({
      page: query['page'] ? parseInt(query['page'] as string, 10) : undefined,
      limit: query['limit'] ? parseInt(query['limit'] as string, 10) : undefined,
      sortBy: query['sortBy'] as string | undefined,
      sortOrder: query['sortOrder'] === 'asc' ? 'asc' : 'desc',
    });
  }

  static getCursorParams(
    cursor?: string,
    limit: number = AUTH_CONSTANTS.PAGINATION.DEFAULT_LIMIT
  ): {
    take: number;
    cursor?: { id: string };
    skip?: number;
  } {
    const take = Math.min(limit, AUTH_CONSTANTS.PAGINATION.MAX_LIMIT);

    if (!cursor) {
      return { take };
    }

    return {
      take,
      cursor: { id: cursor },
      skip: 1,
    };
  }

  static buildCursorResponse<T extends { id: string }>(
    data: T[],
    limit: number
  ): {
    data: T[];
    hasMore: boolean;
    nextCursor?: string;
  } {
    const hasMore = data.length > limit;
    const items = hasMore ? data.slice(0, limit) : data;
    const nextCursor = hasMore && items.length > 0 ? items[items.length - 1]!.id : undefined;

    return {
      data: items,
      hasMore,
      nextCursor,
    };
  }

  static validateSortField(field: string, allowedFields: string[]): string | undefined {
    return allowedFields.includes(field) ? field : undefined;
  }

  static buildOrderBy(
    sortBy?: string,
    sortOrder?: 'asc' | 'desc',
    defaultSort: Record<string, 'asc' | 'desc'> = { createdAt: 'desc' }
  ): Record<string, 'asc' | 'desc'> {
    if (!sortBy) {
      return defaultSort;
    }

    return {
      [sortBy]: sortOrder || 'desc',
    };
  }

  static combineFilters<T extends Record<string, unknown>>(
    baseFilter: T,
    additionalFilters: Partial<T>
  ): T {
    return {
      ...baseFilter,
      ...Object.fromEntries(
        Object.entries(additionalFilters).filter(([_key, value]) => value !== undefined)
      ),
    } as T;
  }

  static buildSearchFilter(
    search: string | undefined,
    searchFields: string[]
  ): Record<string, unknown> | undefined {
    if (!search || search.trim() === '') {
      return undefined;
    }

    const searchTerm = search.trim();

    if (searchFields.length === 1) {
      // ─── FIX 1: extract to const so TS narrows string | undefined → string ───
      // ─── FIX 2: 'as string' cast satisfies computed property key constraint ───
      const field = searchFields[0] as string;
      return {
        [field]: {
          contains: searchTerm,
          mode: 'insensitive',
        },
      };
    }

    return {
      OR: searchFields.map((field) => ({
        [field]: {
          contains: searchTerm,
          mode: 'insensitive',
        },
      })),
    };
  }

  static calculateRange(page: number, limit: number): { start: number; end: number } {
    const start = (page - 1) * limit;
    const end = start + limit;

    return { start, end };
  }

  static isValidPage(page: number, totalPages: number): boolean {
    return page >= 1 && page <= Math.max(1, totalPages);
  }

  static normalizePageNumber(page: number, totalPages: number): number {
    if (page < 1) return 1;
    if (page > totalPages) return Math.max(1, totalPages);
    return page;
  }

  static getLinks(
    baseUrl: string,
    params: PaginationParams,
    total: number
  ): {
    self: string;
    first: string;
    last: string;
    next?: string;
    prev?: string;
  } {
    const totalPages = this.calculateTotalPages(total, params.limit);
    const buildUrl = (page: number) => {
      const url = new URL(baseUrl);
      url.searchParams.set('page', page.toString());
      url.searchParams.set('limit', params.limit.toString());
      if (params.sortBy) url.searchParams.set('sortBy', params.sortBy);
      if (params.sortOrder) url.searchParams.set('sortOrder', params.sortOrder);
      return url.toString();
    };

    const links: { self: string; first: string; last: string; next?: string; prev?: string } = {
      self: buildUrl(params.page),
      first: buildUrl(1),
      last: buildUrl(totalPages),
    };

    if (params.page < totalPages) {
      links.next = buildUrl(params.page + 1);
    }

    if (params.page > 1) {
      links.prev = buildUrl(params.page - 1);
    }

    return links;
  }

  static extractMetadata(params: PaginationParams, total: number) {
    const totalPages = this.calculateTotalPages(total, params.limit);
    const offset = this.calculateOffset(params.page, params.limit);

    return {
      page: params.page,
      limit: params.limit,
      total,
      totalPages,
      offset,
      sortBy: params.sortBy,
      sortOrder: params.sortOrder,
    };
  }
}

export default PaginationHelper;