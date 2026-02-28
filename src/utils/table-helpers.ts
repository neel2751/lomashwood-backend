import type { ColumnDef, SortingState, ColumnFiltersState, VisibilityState } from "@tanstack/react-table";
import { DEFAULT_PAGE_SIZE, PAGE_SIZE_OPTIONS } from "@/lib/constants";

export type TableParams = {
  page: number;
  limit: number;
  sort?: string;
  order?: "asc" | "desc";
  search?: string;
  [key: string]: unknown;
};

export type TableState = {
  sorting: SortingState;
  columnFilters: ColumnFiltersState;
  columnVisibility: VisibilityState;
  rowSelection: Record<string, boolean>;
  globalFilter: string;
  pagination: { pageIndex: number; pageSize: number };
};

export function getDefaultTableState(): TableState {
  return {
    sorting: [],
    columnFilters: [],
    columnVisibility: {},
    rowSelection: {},
    globalFilter: "",
    pagination: { pageIndex: 0, pageSize: DEFAULT_PAGE_SIZE },
  };
}

export function tableStateToParams(state: TableState): TableParams {
  const sort = state.sorting[0];
  return {
    page: state.pagination.pageIndex + 1,
    limit: state.pagination.pageSize,
    sort: sort?.id,
    order: sort ? (sort.desc ? "desc" : "asc") : undefined,
    search: state.globalFilter || undefined,
  };
}

export function getSelectedRowIds(rowSelection: Record<string, boolean>): string[] {
  return Object.entries(rowSelection)
    .filter(([, selected]) => selected)
    .map(([id]) => id);
}

export function getSelectedCount(rowSelection: Record<string, boolean>): number {
  return Object.values(rowSelection).filter(Boolean).length;
}

export function buildSelectAllState<T extends { id: string }>(
  items: T[],
  selected: boolean,
): Record<string, boolean> {
  return Object.fromEntries(items.map((item) => [item.id, selected]));
}

export function isPageFullySelected<T extends { id: string }>(
  items: T[],
  rowSelection: Record<string, boolean>,
): boolean {
  return items.length > 0 && items.every((item) => rowSelection[item.id]);
}

export function isPagePartiallySelected<T extends { id: string }>(
  items: T[],
  rowSelection: Record<string, boolean>,
): boolean {
  const someSelected = items.some((item) => rowSelection[item.id]);
  const allSelected = isPageFullySelected(items, rowSelection);
  return someSelected && !allSelected;
}

export function getPageSizeOptions(): number[] {
  return [...PAGE_SIZE_OPTIONS];
}

export function getPaginationMeta(
  total: number,
  page: number,
  limit: number,
): {
  totalPages: number;
  from: number;
  to: number;
  hasPrev: boolean;
  hasNext: boolean;
} {
  const totalPages = Math.ceil(total / limit);
  const from = total === 0 ? 0 : (page - 1) * limit + 1;
  const to = Math.min(page * limit, total);
  return {
    totalPages,
    from,
    to,
    hasPrev: page > 1,
    hasNext: page < totalPages,
  };
}

export function createSortableColumn<T>(
  accessorKey: keyof T & string,
  header: string,
  options?: Partial<ColumnDef<T>>,
): ColumnDef<T> {
  return {
    accessorKey,
    header,
    enableSorting: true,
    ...options,
  };
}

export function createStaticColumn<T>(
  id: string,
  header: string,
  options?: Partial<ColumnDef<T>>,
): ColumnDef<T> {
  return {
    id,
    header,
    enableSorting: false,
    ...options,
  };
}

export function getVisibleColumns<T>(
  columns: ColumnDef<T>[],
  visibility: VisibilityState,
): ColumnDef<T>[] {
  return columns.filter((col) => {
    const key = (col as { accessorKey?: string }).accessorKey ?? (col as { id?: string }).id;
    return key ? visibility[key] !== false : true;
  });
}

export function buildColumnVisibilityFromKeys(
  keys: string[],
  hidden: string[],
): VisibilityState {
  return Object.fromEntries(keys.map((key) => [key, !hidden.includes(key)]));
}

export function applyColumnFilters<T extends Record<string, unknown>>(
  items: T[],
  filters: ColumnFiltersState,
): T[] {
  return items.filter((item) =>
    filters.every(({ id, value }) => {
      const cellValue = item[id];
      if (Array.isArray(value)) return value.includes(cellValue);
      return String(cellValue ?? "").toLowerCase().includes(String(value).toLowerCase());
    }),
  );
}

export function getSortedValue<T extends Record<string, unknown>>(
  item: T,
  key: string,
): string | number {
  const value = item[key];
  if (typeof value === "number") return value;
  if (typeof value === "string") return value.toLowerCase();
  return String(value ?? "").toLowerCase();
}

export function paginateItems<T>(
  items: T[],
  page: number,
  limit: number,
): T[] {
  const start = (page - 1) * limit;
  return items.slice(start, start + limit);
}

export function getRowNumber(
  rowIndex: number,
  pageIndex: number,
  pageSize: number,
): number {
  return pageIndex * pageSize + rowIndex + 1;
}