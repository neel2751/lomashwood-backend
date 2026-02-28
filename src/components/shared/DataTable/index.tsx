"use client"

import * as React from "react"
import {
  ColumnDef,
  ColumnFiltersState,
  Row,
  RowSelectionState,
  SortingState,
  Table as TanstackTable,
  VisibilityState,
  flexRender,
  getCoreRowModel,
  getFacetedRowModel,
  getFacetedUniqueValues,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table"

import { cn } from "@/lib/utils"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Skeleton } from "@/components/ui/skeleton"

import { DataTableFilters, type FilterConfig } from "./Filters"
import { DataTablePagination }                 from "./Pagination"
import { DataTableBulkActions, type BulkAction } from "./BulkActions"



export type { FilterConfig, BulkAction }
export type { ColumnDef }



export type DataTableContextValue<TData> = {
  table: TanstackTable<TData>
}


const DataTableContext = React.createContext<DataTableContextValue<any> | null>(null)

export function useDataTable<TData>() {
  const ctx = React.useContext(DataTableContext) as DataTableContextValue<TData> | null
  if (!ctx) throw new Error("useDataTable must be used within <DataTable>")
  return ctx
}



export interface DataTableProps<TData, TValue = unknown> {

  columns: ColumnDef<TData, TValue>[]

  data: TData[]

  
  isLoading?: boolean
  skeletonRows?: number
  emptyState?: React.ReactNode
  filters?: FilterConfig[]
 
  showViewOptions?: boolean
 
  toolbarRight?: React.ReactNode

  
  
  enableSorting?: boolean
 
  sorting?: SortingState
  onSortingChange?: (sorting: SortingState) => void

  showPagination?: boolean
  
  total?: number
 
  page?: number
  onPageChange?: (page: number) => void
  
  pageSizeOptions?: number[]
  defaultPageSize?: number
  pageSize?: number
  onPageSizeChange?: (size: number) => void
 
  manualPagination?: boolean
  manualSorting?: boolean
  manualFiltering?: boolean

  
  enableRowSelection?: boolean | ((row: Row<TData>) => boolean)
  rowSelection?: RowSelectionState
  onRowSelectionChange?: (selection: RowSelectionState, rows: TData[]) => void
 
  bulkActions?: BulkAction<TData>[]

  
  onRowClick?: (row: TData, e: React.MouseEvent) => void
 
  rowClassName?: (row: TData) => string

  
  defaultColumnVisibility?: VisibilityState

  className?: string
}



export function DataTable<TData, TValue = unknown>({
  columns,
  data,

  isLoading       = false,
  skeletonRows    = 8,
  emptyState,

  filters,
  showViewOptions = true,
  toolbarRight,

  enableSorting   = true,
  sorting:        sortingProp,
  onSortingChange,

  showPagination  = true,
  total,
  page,
  onPageChange,
  pageSizeOptions,
  defaultPageSize = 20,
  pageSize:       pageSizeProp,
  onPageSizeChange,
  manualPagination = false,
  manualSorting    = false,
  manualFiltering  = false,

  enableRowSelection = false,
  rowSelection:       rowSelectionProp,
  onRowSelectionChange,
  bulkActions,

  onRowClick,
  rowClassName,

  defaultColumnVisibility,

  className,
}: DataTableProps<TData, TValue>) {
  
  const [internalSorting, setInternalSorting]         = React.useState<SortingState>([])
  const [columnFilters, setColumnFilters]              = React.useState<ColumnFiltersState>([])
  const [columnVisibility, setColumnVisibility]        = React.useState<VisibilityState>(
    defaultColumnVisibility ?? {}
  )
  const [internalRowSelection, setInternalRowSelection] = React.useState<RowSelectionState>({})

  const activeSorting        = sortingProp        ?? internalSorting
  const activeRowSelection   = rowSelectionProp   ?? internalRowSelection

  const handleSortingChange = (updater: React.SetStateAction<SortingState>) => {
    const next = typeof updater === "function" ? updater(activeSorting) : updater
    onSortingChange ? onSortingChange(next) : setInternalSorting(next)
  }

  const handleRowSelectionChange = (updater: React.SetStateAction<RowSelectionState>) => {
    const next = typeof updater === "function" ? updater(activeRowSelection) : updater
    setInternalRowSelection(next)
    if (onRowSelectionChange) {
      const selectedRows = Object.keys(next)
        .filter((k) => next[k])
        .map((k) => data[parseInt(k)])
        .filter(Boolean)
      onRowSelectionChange(next, selectedRows)
    }
  }

  
  const pageCount = manualPagination && total !== undefined && pageSizeProp
    ? Math.ceil(total / pageSizeProp)
    : undefined

  const table = useReactTable({
    data,
    columns,
    pageCount,
    state: {
      sorting:activeSorting,
      columnFilters,
      columnVisibility,
      rowSelection:     activeRowSelection,
      ...(manualPagination && page !== undefined && pageSizeProp !== undefined
        ? { pagination: { pageIndex: page - 1, pageSize: pageSizeProp } }
        : {}),
    },
    enableRowSelection: enableRowSelection as boolean,
    enableSorting,
    manualPagination,
    manualSorting,
    manualFiltering,
    onSortingChange:  handleSortingChange,
    onColumnFiltersChange:   setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange:  handleRowSelectionChange,
    onPaginationChange: manualPagination && onPageChange && onPageSizeChange
      ? (updater) => {
          const prev = {
            pageIndex: (page ?? 1) - 1,
            pageSize:  pageSizeProp ?? defaultPageSize,
          }
          const next = typeof updater === "function" ? updater(prev) : updater
          if (next.pageIndex !== prev.pageIndex)onPageChange(next.pageIndex + 1)
          if (next.pageSize  !== prev.pageSize)onPageSizeChange(next.pageSize)
        }
      : undefined,
    getCoreRowModel:  getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFacetedRowModel:  getFacetedRowModel(),
    getFacetedUniqueValues:getFacetedUniqueValues(),
    initialState: {
      pagination: { pageSize: defaultPageSize },
    },
  })

  const selectedCount = table.getFilteredSelectedRowModel().rows.length
  const hasSelection  = selectedCount > 0 && !!enableRowSelection && !!bulkActions?.length

  const showToolbar = !!(filters?.length || showViewOptions || toolbarRight || hasSelection)

  return (
    <DataTableContext.Provider value={{ table }}>
      <div className={cn("flex flex-col gap-4", className)}>

      
        {showToolbar && (
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            
            {filters?.length ? (
              <DataTableFilters
                table={table}
                filters={filters}
                showViewOptions={showViewOptions}
              />
            ) : (
              <div />
            )}

          
            {toolbarRight && (
              <div className="flex items-center gap-2 shrink-0">{toolbarRight}</div>
            )}
          </div>
        )}

        
        {hasSelection && bulkActions && (
          <DataTableBulkActions
            table={table}
            actions={bulkActions}
            selectedCount={selectedCount}
          />
        )}

       
        <div className="rounded-md border bg-white overflow-hidden">
          <Table>
            <TableHeader>
              {table.getHeaderGroups().map((hg) => (
                <TableRow key={hg.id} className="bg-muted/30 hover:bg-muted/30">
                  {hg.headers.map((header) => (
                    <TableHead
                      key={header.id}
                      colSpan={header.colSpan}
                      style={{ width: header.getSize() !== 150 ? header.getSize() : undefined }}
                    >
                      {header.isPlaceholder
                        ? null
                        : flexRender(header.column.columnDef.header, header.getContext())}
                    </TableHead>
                  ))}
                </TableRow>
              ))}
            </TableHeader>

            <TableBody>
              {isLoading ? (
                
                Array.from({ length: skeletonRows }).map((_, i) => (
                  <TableRow key={`skeleton-${i}`}>
                    {columns.map((_, j) => (
                      <TableCell key={j}>
                        <Skeleton
                          className="h-4"
                          style={{ width: `${50 + ((i * 13 + j * 7) % 45)}%` }}
                        />
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : table.getRowModel().rows.length ? (
                table.getRowModel().rows.map((row) => (
                  <TableRow
                    key={row.id}
                    data-state={row.getIsSelected() ? "selected" : undefined}
                    onClick={onRowClick ? (e) => onRowClick(row.original, e) : undefined}
                    className={cn(
                      "transition-colors",
                      onRowClick && "cursor-pointer hover:bg-muted/30",
                      row.getIsSelected() && "bg-primary/5 hover:bg-primary/5",
                      rowClassName?.(row.original)
                    )}
                  >
                    {row.getVisibleCells().map((cell) => (
                      <TableCell key={cell.id}>
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell
                    colSpan={columns.length}
                    className="h-36 text-center"
                  >
                    {emptyState ?? (
                      <p className="text-sm text-muted-foreground">
                        No results found.
                      </p>
                    )}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        
        {showPagination && (
          <DataTablePagination
            table={table}
            total={total}
            pageSizeOptions={pageSizeOptions}
          />
        )}
      </div>
    </DataTableContext.Provider>
  )
}