import { PaginationParams, PaginationMeta, PaginatedResponse } from './types';
import { PAGINATION_CONSTANTS } from './constants';

export class PaginationHelper {
  static normalizePage(page?: number): number {
    const normalized = Number(page);
    if (isNaN(normalized) || normalized < 1) {
      return PAGINATION_CONSTANTS.DEFAULT_PAGE;
    }
    return Math.floor(normalized);
  }

  static normalizeLimit(limit?: number): number {
    const normalized = Number(limit);
    if (isNaN(normalized) || normalized < PAGINATION_CONSTANTS.MIN_LIMIT) {
      return PAGINATION_CONSTANTS.DEFAULT_LIMIT;
    }
    return Math.min(normalized, PAGINATION_CONSTANTS.MAX_LIMIT);
  }

  static normalizeParams(params?: Partial<PaginationParams>): PaginationParams {
    return {
      page: this.normalizePage(params?.page),
      limit: this.normalizeLimit(params?.limit)
    };
  }

  static calculateSkip(page: number, limit: number): number {
    return (page - 1) * limit;
  }

  static calculateTotalPages(totalItems: number, limit: number): number {
    if (totalItems === 0 || limit === 0) return 0;
    return Math.ceil(totalItems / limit);
  }

  static createMeta(
    totalItems: number,
    page: number,
    limit: number
  ): PaginationMeta {
    const totalPages = this.calculateTotalPages(totalItems, limit);

    return {
      currentPage: page,
      itemsPerPage: limit,
      totalItems,
      totalPages,
      hasNextPage: page < totalPages,
      hasPreviousPage: page > 1
    };
  }

  static createResponse<T>(
    data: T[],
    totalItems: number,
    page: number,
    limit: number
  ): PaginatedResponse<T> {
    return {
      data,
      meta: this.createMeta(totalItems, page, limit)
    };
  }

  static isValidPage(page: number, totalPages: number): boolean {
    return page >= 1 && page <= Math.max(totalPages, 1);
  }

  static getNextPage(currentPage: number, totalPages: number): number | null {
    return currentPage < totalPages ? currentPage + 1 : null;
  }

  static getPreviousPage(currentPage: number): number | null {
    return currentPage > 1 ? currentPage - 1 : null;
  }

  static getFirstPage(): number {
    return 1;
  }

  static getLastPage(totalPages: number): number {
    return Math.max(totalPages, 1);
  }

  static calculateRange(page: number, limit: number): { start: number; end: number } {
    const start = (page - 1) * limit + 1;
    const end = page * limit;
    return { start, end };
  }

  static getPageNumbers(
    currentPage: number,
    totalPages: number,
    maxVisible: number = 5
  ): number[] {
    if (totalPages <= maxVisible) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }

    const halfVisible = Math.floor(maxVisible / 2);
    let startPage = Math.max(1, currentPage - halfVisible);
    let endPage = Math.min(totalPages, currentPage + halfVisible);

    if (currentPage - halfVisible < 1) {
      endPage = Math.min(totalPages, maxVisible);
    }

    if (currentPage + halfVisible > totalPages) {
      startPage = Math.max(1, totalPages - maxVisible + 1);
    }

    return Array.from(
      { length: endPage - startPage + 1 },
      (_, i) => startPage + i
    );
  }
}

export class CursorPagination {
  static encodeCursor(value: string | number | Date): string {
    const stringValue = value instanceof Date ? value.toISOString() : String(value);
    return Buffer.from(stringValue).toString('base64');
  }

  static decodeCursor(cursor: string): string {
    try {
      return Buffer.from(cursor, 'base64').toString('utf-8');
    } catch {
      throw new Error('Invalid cursor format');
    }
  }

  static createCursorMeta<T>(
    data: T[],
    limit: number,
    getCursorValue: (item: T) => string | number | Date
  ): {
    hasNextPage: boolean;
    hasPreviousPage: boolean;
    startCursor: string | null;
    endCursor: string | null;
  } {
    const hasNextPage = data.length > limit;
    const items = hasNextPage ? data.slice(0, limit) : data;

    return {
      hasNextPage,
      hasPreviousPage: false,
      startCursor: items.length > 0 ? this.encodeCursor(getCursorValue(items[0])) : null,
      endCursor: items.length > 0 ? this.encodeCursor(getCursorValue(items[items.length - 1])) : null
    };
  }
}

export class OffsetPagination {
  static getOffset(page: number, limit: number): number {
    return PaginationHelper.calculateSkip(page, limit);
  }

  static getPageFromOffset(offset: number, limit: number): number {
    if (limit === 0) return 1;
    return Math.floor(offset / limit) + 1;
  }

  static validateOffset(offset: number, totalItems: number): boolean {
    return offset >= 0 && offset < totalItems;
  }
}

export const paginate = <T>(
  items: T[],
  page: number = PAGINATION_CONSTANTS.DEFAULT_PAGE,
  limit: number = PAGINATION_CONSTANTS.DEFAULT_LIMIT
): PaginatedResponse<T> => {
  const normalizedParams = PaginationHelper.normalizeParams({ page, limit });
  const skip = PaginationHelper.calculateSkip(normalizedParams.page, normalizedParams.limit);
  
  const paginatedItems = items.slice(skip, skip + normalizedParams.limit);
  
  return PaginationHelper.createResponse(
    paginatedItems,
    items.length,
    normalizedParams.page,
    normalizedParams.limit
  );
};

export const buildPaginationQuery = (params: {
  page?: number;
  limit?: number;
}): { skip: number; take: number } => {
  const normalized = PaginationHelper.normalizeParams(params);
  
  return {
    skip: PaginationHelper.calculateSkip(normalized.page, normalized.limit),
    take: normalized.limit
  };
};

export const extractPaginationParams = (query: any): PaginationParams => {
  return PaginationHelper.normalizeParams({
    page: query.page ? parseInt(query.page, 10) : undefined,
    limit: query.limit ? parseInt(query.limit, 10) : undefined
  });
};

export const createEmptyPaginatedResponse = <T>(): PaginatedResponse<T> => {
  return {
    data: [],
    meta: {
      currentPage: 1,
      itemsPerPage: PAGINATION_CONSTANTS.DEFAULT_LIMIT,
      totalItems: 0,
      totalPages: 0,
      hasNextPage: false,
      hasPreviousPage: false
    }
  };
};

export const isPaginationValid = (page: number, limit: number): boolean => {
  return (
    page >= 1 &&
    limit >= PAGINATION_CONSTANTS.MIN_LIMIT &&
    limit <= PAGINATION_CONSTANTS.MAX_LIMIT
  );
};

export const getLimitBounds = (): { min: number; max: number } => {
  return {
    min: PAGINATION_CONSTANTS.MIN_LIMIT,
    max: PAGINATION_CONSTANTS.MAX_LIMIT
  };
};

export const getDefaultPagination = (): PaginationParams => {
  return {
    page: PAGINATION_CONSTANTS.DEFAULT_PAGE,
    limit: PAGINATION_CONSTANTS.DEFAULT_LIMIT
  };
};