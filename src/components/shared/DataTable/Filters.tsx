"use client"

import * as React from "react"
import { Table } from "@tanstack/react-table"
import { format } from "date-fns"
import { Calendar as CalendarIcon, Search, SlidersHorizontal, X } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Calendar } from "@/components/ui/calendar"
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

export type FilterOption = {
  label: string
  value: string
  
  icon?: React.ReactNode
  
  color?: string
}

export type FilterConfig =
  | {
      type: "search"
     
      columnId: string
      placeholder?: string
      className?: string
    }
  | {
      type: "select"
      columnId: string
      label: string
      options: FilterOption[]
   
      multi?: boolean
      className?: string
    }
  | {
      type: "daterange"
     
      columnId: string
      label?: string
      className?: string
    }
  | {
      type: "custom"
    
      render: () => React.ReactNode
      className?: string
    }


function SearchFilter<TData>({
  table,
  config,
}: {
  table: Table<TData>
  config: Extract<FilterConfig, { type: "search" }>
}) {
  const column = config.columnId === "global" ? null : table.getColumn(config.columnId)
  const value  = (column?.getFilterValue() as string) ?? ""

  return (
    <div className={cn("relative flex-1 min-w-[180px] max-w-xs", config.className)}>
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
      <Input
        placeholder={config.placeholder ?? "Search…"}
        value={value}
        onChange={(e) => column?.setFilterValue(e.target.value || undefined)}
        className="pl-9 h-8 text-sm"
      />
      {value && (
        <button
          onClick={() => column?.setFilterValue(undefined)}
          className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      )}
    </div>
  )
}

function SelectFilter<TData>({
  table,
  config,
}: {
  table: Table<TData>
  config: Extract<FilterConfig, { type: "select" }>
}) {
  const column       = table.getColumn(config.columnId)
  const filterValue  = column?.getFilterValue()

  if (config.multi) {
    
    const selectedValues = new Set(
      Array.isArray(filterValue) ? filterValue as string[] : []
    )

    const handleToggle = (value: string) => {
      const next = new Set(selectedValues)
      next.has(value) ? next.delete(value) : next.add(value)
      column?.setFilterValue(next.size > 0 ? Array.from(next) : undefined)
    }

    return (
      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            className={cn(
              "h-8 border-dashed text-xs gap-1.5",
              selectedValues.size > 0 && "border-solid border-primary/40",
              config.className
            )}
          >
            <SlidersHorizontal className="h-3.5 w-3.5" />
            {config.label}
            {selectedValues.size > 0 && (
              <>
                <span className="h-3.5 w-px bg-border" />
                <Badge variant="secondary" className="rounded-sm px-1 py-0 font-normal text-xs">
                  {selectedValues.size}
                </Badge>
              </>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-48 p-1" align="start">
          {config.options.map((opt) => {
            const isSelected = selectedValues.has(opt.value)
            return (
              <button
                key={opt.value}
                onClick={() => handleToggle(opt.value)}
                className={cn(
                  "flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-sm",
                  "hover:bg-accent hover:text-accent-foreground transition-colors",
                  isSelected && "bg-accent/50"
                )}
              >
                <div
                  className={cn(
                    "flex h-4 w-4 items-center justify-center rounded border",
                    isSelected
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-muted-foreground/40"
                  )}
                >
                  {isSelected && (
                    <svg viewBox="0 0 8 8" className="h-2.5 w-2.5 fill-current">
                      <path d="M1.5 4L3.5 6L6.5 2" stroke="currentColor" strokeWidth="1.5" fill="none" />
                    </svg>
                  )}
                </div>
                {opt.icon && <span className="h-4 w-4 flex items-center">{opt.icon}</span>}
                <span className="flex-1 text-left">{opt.label}</span>
                {/* Facet count */}
                {(() => {
                  const count = column?.getFacetedUniqueValues?.()?.get(opt.value)
                  return count ? (
                    <span className="text-xs text-muted-foreground tabular-nums">{count}</span>
                  ) : null
                })()}
              </button>
            )
          })}
          {selectedValues.size > 0 && (
            <>
              <div className="-mx-1 my-1 h-px bg-border" />
              <button
                onClick={() => column?.setFilterValue(undefined)}
                className="flex w-full items-center justify-center rounded-sm px-2 py-1.5 text-xs text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
              >
                Clear filters
              </button>
            </>
          )}
        </PopoverContent>
      </Popover>
    )
  }

 
  return (
    <Select
      value={(filterValue as string) ?? ""}
      onValueChange={(v) => column?.setFilterValue(v === "__all__" ? undefined : v)}
    >
      <SelectTrigger className={cn("h-8 text-xs w-[140px]", config.className)}>
        <SelectValue placeholder={config.label} />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="__all__" className="text-xs">
          All {config.label}
        </SelectItem>
        {config.options.map((opt) => (
          <SelectItem key={opt.value} value={opt.value} className="text-xs">
            <span className="flex items-center gap-1.5">
              {opt.icon}
              {opt.label}
            </span>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}

function DateRangeFilter<TData>({
  table,
  config,
}: {
  table: Table<TData>
  config: Extract<FilterConfig, { type: "daterange" }>
}) {
  const column      = table.getColumn(config.columnId)
  const filterValue = column?.getFilterValue() as [Date | null, Date | null] | undefined
  const [from, to]  = filterValue ?? [null, null]

  const [open, setOpen] = React.useState(false)
  const [range, setRange] = React.useState<{ from?: Date; to?: Date }>({
    from: from ?? undefined,
    to:   to   ?? undefined,
  })

  const apply = () => {
    column?.setFilterValue(
      range.from || range.to ? [range.from ?? null, range.to ?? null] : undefined
    )
    setOpen(false)
  }

  const clear = () => {
    setRange({})
    column?.setFilterValue(undefined)
  }

  const hasValue = !!from || !!to

  const label = hasValue
    ? from && to
      ? `${format(from, "dd MMM")} – ${format(to, "dd MMM")}`
      : from
      ? `From ${format(from, "dd MMM")}`
      : `Until ${format(to!, "dd MMM")}`
    : (config.label ?? "Date range")

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className={cn(
            "h-8 text-xs gap-1.5",
            hasValue && "border-primary/40 text-foreground",
            config.className
          )}
        >
          <CalendarIcon className="h-3.5 w-3.5" />
          <span>{label}</span>
          {hasValue && (
            <span
              role="button"
              className="ml-0.5 hover:text-destructive transition-colors"
              onClick={(e) => { e.stopPropagation(); clear() }}
            >
              <X className="h-3 w-3" />
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-3" align="start">
        <Calendar
          mode="range"
          selected={{ from: range.from, to: range.to }}
          onSelect={(r) => setRange({ from: r?.from, to: r?.to })}
          numberOfMonths={2}
          initialFocus
        />
        <div className="flex justify-end gap-2 mt-3 pt-3 border-t">
          <Button variant="ghost" size="sm" onClick={clear}>Clear</Button>
          <Button size="sm" onClick={apply}>Apply</Button>
        </div>
      </PopoverContent>
    </Popover>
  )
}


function ViewOptionsToggle<TData>({ table }: { table: Table<TData> }) {
  const hideable = table
    .getAllColumns()
    .filter((col) => typeof col.accessorFn !== "undefined" && col.getCanHide())

  if (!hideable.length) return null

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="h-8 ml-auto text-xs">
          <SlidersHorizontal className="h-3.5 w-3.5 mr-1.5" />
          View
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-44">
        <DropdownMenuLabel className="text-xs">Toggle columns</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {hideable.map((col) => (
          <DropdownMenuCheckboxItem
            key={col.id}
            className="capitalize text-xs"
            checked={col.getIsVisible()}
            onCheckedChange={(v) => col.toggleVisibility(!!v)}
          >
            {String(col.columnDef.header ?? col.id).replace(/_/g, " ")}
          </DropdownMenuCheckboxItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}


function ActiveFilterPills<TData>({
  table,
  filters,
}: {
  table: Table<TData>
  filters: FilterConfig[]
}) {
  const activeFilters = table.getState().columnFilters

  if (!activeFilters.length) return null

  const getLabel = (id: string, value: unknown): string => {
    const config = filters.find(
      (f) => f.type !== "custom" && f.type !== "search" && f.columnId === id
    )
    if (config?.type === "select") {
      if (Array.isArray(value)) {
        return value
          .map((v) => config.options.find((o) => o.value === v)?.label ?? v)
          .join(", ")
      }
      return config.options.find((o) => o.value === value)?.label ?? String(value)
    }
    if (config?.type === "daterange" && Array.isArray(value)) {
      const [from, to] = value as [Date | null, Date | null]
      if (from && to) return `${format(from, "dd MMM")} – ${format(to, "dd MMM")}`
      if (from) return `From ${format(from, "dd MMM")}`
      if (to)   return `Until ${format(to, "dd MMM")}`
    }
    return String(value)
  }

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {activeFilters.map((f) => (
        <Badge
          key={f.id}
          variant="secondary"
          className="text-xs gap-1 pr-1 h-6 font-normal"
        >
          <span className="text-muted-foreground capitalize">
            {f.id.replace(/_/g, " ")}:
          </span>
          <span className="max-w-[120px] truncate">
            {getLabel(f.id, f.value)}
          </span>
          <button
            onClick={() => table.getColumn(f.id)?.setFilterValue(undefined)}
            className="hover:text-destructive transition-colors ml-0.5"
          >
            <X className="h-3 w-3" />
          </button>
        </Badge>
      ))}
      {activeFilters.length > 1 && (
        <button
          onClick={() => table.resetColumnFilters()}
          className="text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          Clear all
        </button>
      )}
    </div>
  )
}


interface DataTableFiltersProps<TData> {
  table: Table<TData>
  filters: FilterConfig[]
  showViewOptions?: boolean
  className?: string
}

export function DataTableFilters<TData>({
  table,
  filters,
  showViewOptions = true,
  className,
}: DataTableFiltersProps<TData>) {
  const activeCount = table.getState().columnFilters.length

  return (
    <div className={cn("flex flex-col gap-2 flex-1", className)}>
      
      <div className="flex flex-wrap items-center gap-2">
        {filters.map((config, i) => {
          if (config.type === "search") {
            return (
              <SearchFilter key={i} table={table} config={config} />
            )
          }
          if (config.type === "select") {
            return (
              <SelectFilter key={i} table={table} config={config} />
            )
          }
          if (config.type === "daterange") {
            return (
              <DateRangeFilter key={i} table={table} config={config} />
            )
          }
          if (config.type === "custom") {
            return (
              <React.Fragment key={i}>{config.render()}</React.Fragment>
            )
          }
          return null
        })}

        {activeCount > 0 && (
          <Button
            variant="ghost"
            size="sm"
            className="h-8 text-xs text-muted-foreground px-2"
            onClick={() => table.resetColumnFilters()}
          >
            Reset
            <X className="h-3.5 w-3.5 ml-1" />
          </Button>
        )}

        {showViewOptions && <ViewOptionsToggle table={table} />}
      </div>

      
      <ActiveFilterPills table={table} filters={filters} />
    </div>
  )
}