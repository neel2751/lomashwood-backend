"use client"

import * as React from "react"
import { Table } from "@tanstack/react-table"
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"


const DEFAULT_PAGE_SIZE_OPTIONS = [10, 20, 30, 50, 100]


function PageButton({
  page,
  currentPage,
  onClick,
}: {
  page: number
  currentPage: number
  onClick: () => void
}) {
  const isActive = page === currentPage
  return (
    <Button
      variant={isActive ? "default" : "outline"}
      size="icon"
      className={cn(
        "h-8 w-8 text-xs",
        isActive && "pointer-events-none"
      )}
      onClick={onClick}
      aria-label={`Go to page ${page}`}
      aria-current={isActive ? "page" : undefined}
    >
      {page}
    </Button>
  )
}


function buildPageWindow(
  currentPage: number,
  totalPages: number,
  windowSize = 5
): (number | "ellipsis")[] {
  if (totalPages <= windowSize + 2) {
    return Array.from({ length: totalPages }, (_, i) => i + 1)
  }

  const half  = Math.floor(windowSize / 2)
  let start   = Math.max(2, currentPage - half)
  let end     = Math.min(totalPages - 1, currentPage + half)

  if (end - start < windowSize - 1) {
    if (currentPage <= half + 1) {
      end = Math.min(totalPages - 1, windowSize)
    } else {
      start = Math.max(2, totalPages - windowSize)
    }
  }

  const pages: (number | "ellipsis")[] = [1]
  if (start > 2) pages.push("ellipsis")
  for (let p = start; p <= end; p++) pages.push(p)
  if (end < totalPages - 1) pages.push("ellipsis")
  pages.push(totalPages)

  return pages
}


interface DataTablePaginationProps<TData> {
  table: Table<TData>
  
  total?: number
  
  pageSizeOptions?: number[]
 
  hidePageSize?: boolean
 
  hideSelectionCount?: boolean
  className?: string
}

export function DataTablePagination<TData>({
  table,
  total,
  pageSizeOptions = DEFAULT_PAGE_SIZE_OPTIONS,
  hidePageSize       = false,
  hideSelectionCount = false,
  className,
}: DataTablePaginationProps<TData>) {
  const { pageIndex, pageSize } = table.getState().pagination
  const currentPage = pageIndex + 1

  
  const totalRows   = total ?? table.getFilteredRowModel().rows.length
  const totalPages  = table.getPageCount() > 0
    ? table.getPageCount()
    : Math.ceil(totalRows / pageSize)

  const selectionCount = table.getFilteredSelectedRowModel().rows.length

  const firstRow = totalRows === 0 ? 0 : pageIndex * pageSize + 1
  const lastRow  = Math.min(pageIndex * pageSize + pageSize, totalRows)

  const pageWindow = buildPageWindow(currentPage, totalPages)

  if (totalPages <= 1 && totalRows <= pageSize) {
    
    return (
      <div className={cn("flex items-center justify-between text-sm text-muted-foreground", className)}>
        <p className="text-xs">
          {totalRows === 0 ? "No results" : `${totalRows} result${totalRows !== 1 ? "s" : ""}`}
        </p>
        {!hidePageSize && totalRows > 0 && (
          <PageSizeSelector
            value={pageSize}
            options={pageSizeOptions}
            onChange={(size) => table.setPageSize(size)}
          />
        )}
      </div>
    )
  }

  return (
    <div
      className={cn(
        "flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between",
        className
      )}
    >
     
      <div className="flex items-center gap-3 text-xs text-muted-foreground">
        {!hideSelectionCount && selectionCount > 0 && (
          <span className="font-medium text-foreground">
            {selectionCount} selected ·{" "}
          </span>
        )}
        <span>
          {totalRows === 0
            ? "No results"
            : `Showing ${firstRow}–${lastRow} of ${totalRows.toLocaleString()}`}
        </span>
      </div>

      
      <div className="flex items-center gap-3">
        {!hidePageSize && (
          <PageSizeSelector
            value={pageSize}
            options={pageSizeOptions}
            onChange={(size) => table.setPageSize(size)}
          />
        )}

        <div className="flex items-center gap-1" role="navigation" aria-label="Pagination">
        
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8 hidden sm:flex"
            onClick={() => table.setPageIndex(0)}
            disabled={!table.getCanPreviousPage()}
            aria-label="First page"
          >
            <ChevronsLeft className="h-4 w-4" />
          </Button>

       
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
            aria-label="Previous page"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>

          
          <div className="hidden sm:flex items-center gap-1">
            {pageWindow.map((item, i) =>
              item === "ellipsis" ? (
                <span
                  key={`ellipsis-${i}`}
                  className="flex h-8 w-5 items-center justify-center text-xs text-muted-foreground select-none"
                >
                  ···
                </span>
              ) : (
                <PageButton
                  key={item}
                  page={item}
                  currentPage={currentPage}
                  onClick={() => table.setPageIndex(item - 1)}
                />
              )
            )}
          </div>

        
          <span className="flex sm:hidden items-center px-2 text-xs text-muted-foreground">
            {currentPage} / {totalPages}
          </span>

         
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
            aria-label="Next page"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>

         
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8 hidden sm:flex"
            onClick={() => table.setPageIndex(totalPages - 1)}
            disabled={!table.getCanNextPage()}
            aria-label="Last page"
          >
            <ChevronsRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  )
}


function PageSizeSelector({
  value,
  options,
  onChange,
}: {
  value: number
  options: number[]
  onChange: (size: number) => void
}) {
  return (
    <div className="flex items-center gap-1.5">
      <span className="text-xs text-muted-foreground whitespace-nowrap">Rows per page</span>
      <Select
        value={String(value)}
        onValueChange={(v) => onChange(Number(v))}
      >
        <SelectTrigger className="h-8 w-[68px] text-xs">
          <SelectValue />
        </SelectTrigger>
        <SelectContent side="top">
          {options.map((opt) => (
            <SelectItem key={opt} value={String(opt)} className="text-xs">
              {opt}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}