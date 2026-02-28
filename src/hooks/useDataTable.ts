import { useState, useCallback } from "react";
import {
  ColumnFiltersState,
  PaginationState,
  RowSelectionState,
  SortingState,
  VisibilityState,
} from "@tanstack/react-table";

interface UseDataTableOptions {
  pageSize?: number;
}

export function useDataTable({ pageSize = 10 }: UseDataTableOptions = {}) {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});
  const [globalFilter, setGlobalFilter] = useState("");
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize,
  });

  const resetFilters = useCallback(() => {
    setSorting([]);
    setColumnFilters([]);
    setGlobalFilter("");
    setPagination({ pageIndex: 0, pageSize });
  }, [pageSize]);

  const clearSelection = useCallback(() => {
    setRowSelection({});
  }, []);

  return {
    sorting,
    setSorting,
    columnFilters,
    setColumnFilters,
    columnVisibility,
    setColumnVisibility,
    rowSelection,
    setRowSelection,
    globalFilter,
    setGlobalFilter,
    pagination,
    setPagination,
    resetFilters,
    clearSelection,
  };
}