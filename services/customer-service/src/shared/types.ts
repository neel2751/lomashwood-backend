import { SortOrderValue } from './constants';

export type Nullable<T> = T | null;
export type Optional<T> = T | undefined;
export type Maybe<T> = T | null | undefined;

export type DeepPartial<T> = T extends object
  ? { [K in keyof T]?: DeepPartial<T[K]> }
  : T;

export type DeepReadonly<T> = T extends object
  ? { readonly [K in keyof T]: DeepReadonly<T[K]> }
  : T;

export type Prettify<T> = { [K in keyof T]: T[K] } & {};

export interface PaginationParams {
  page: number;
  limit: number;
}

export interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

export interface PaginatedResult<T> {
  data: T[];
  meta: PaginationMeta;
}

export interface SortParams {
  sortBy?: string;
  sortOrder?: SortOrderValue;
}

export interface DateRangeParams {
  from?: string;
  to?: string;
}

export interface BaseQueryParams extends PaginationParams, SortParams, DateRangeParams {}

export interface BaseEntity {
  id: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface SoftDeletableEntity extends BaseEntity {
  deletedAt: Date | null;
}

export type JobResult = {
  success: boolean;
  processed: number;
  errors: number;
  durationMs: number;
  metadata?: Record<string, unknown>;
};

export type ServiceResponse<T> =
  | { success: true; data: T }
  | { success: false; error: string; code: string };

export type AsyncResult<T> = Promise<ServiceResponse<T>>;

export type ID = string;
export type Timestamp = Date;
export type ISODateString = string;
export type EmailAddress = string;
export type PhoneNumber = string;
export type CurrencyCode = string;
export type LanguageCode = string;
export type CountryCode = string;