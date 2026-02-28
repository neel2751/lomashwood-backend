export type ApiResponse<T> = {
  data: T;
  message?: string;
  meta?: PaginationMeta;
};

export type PaginatedResponse<T> = ApiResponse<T[]>;

export type PaginationMeta = {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
};

export type SortOrder = "asc" | "desc";

export type PaginationParams = {
  page?: number;
  limit?: number;
  sort?: string;
  order?: SortOrder;
};

export type FilterParams = PaginationParams & {
  search?: string;
  startDate?: string;
  endDate?: string;
};

export type ApiErrorShape = {
  message: string;
  status: number;
  code?: string;
  details?: unknown;
};

export type RequestState<T> = {
  data: T | null;
  isLoading: boolean;
  isError: boolean;
  error: ApiErrorShape | null;
};

export type MutationState = {
  isLoading: boolean;
  isError: boolean;
  isSuccess: boolean;
  error: ApiErrorShape | null;
};

export type UploadResponse = {
  urls: string[];
};

export type BulkActionPayload<T = string> = {
  ids: T[];
};

export type BulkActionResponse = {
  succeeded: string[];
  failed: string[];
};

export type SelectOption = {
  label: string;
  value: string;
};

export type GroupedSelectOption = {
  label: string;
  options: SelectOption[];
};

export type TableColumn<T> = {
  key: keyof T | string;
  label: string;
  sortable?: boolean;
  width?: number | string;
};