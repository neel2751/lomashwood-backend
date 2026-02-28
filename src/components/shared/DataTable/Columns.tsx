"use client"

import * as React from "react"
import {
  ColumnDef,
  Column,
  Row,
} from "@tanstack/react-table"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { cn } from "@/lib/utils"
import { formatters } from "@/utils/formatters"
import {
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  MoreHorizontal,
  Eye,
  Pencil,
  Trash2,
  Copy,
  ExternalLink,
} from "lucide-react"



interface SortableHeaderProps<TData, TValue> {
  column: Column<TData, TValue>
  title: string
  className?: string
}

export function SortableHeader<TData, TValue>({
  column,
  title,
  className,
}: SortableHeaderProps<TData, TValue>) {
  if (!column.getCanSort()) {
    return (
      <span className={cn("text-xs font-medium text-muted-foreground", className)}>
        {title}
      </span>
    )
  }

  const sorted = column.getIsSorted()

  return (
    <button
      onClick={() => column.toggleSorting(sorted === "asc")}
      className={cn(
        "group inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground",
        "hover:text-foreground transition-colors -ml-0.5 px-0.5 py-1 rounded",
        sorted && "text-foreground",
        className
      )}
    >
      {title}
      <span className="flex-shrink-0 opacity-50 group-hover:opacity-100 transition-opacity">
        {sorted === "asc"  ? <ArrowUp   className="h-3.5 w-3.5" /> :
         sorted === "desc" ? <ArrowDown className="h-3.5 w-3.5" /> :
                             <ArrowUpDown className="h-3.5 w-3.5" />}
      </span>
    </button>
  )
}



export function createSelectionColumn<TData>(): ColumnDef<TData> {
  return {
    id: "_select",
    size: 40,
    enableSorting: false,
    enableHiding: false,
    header: ({ table }) => (
      <Checkbox
        checked={
          table.getIsAllPageRowsSelected()
            ? true
            : table.getIsSomePageRowsSelected()
            ? "indeterminate"
            : false
        }
        onCheckedChange={(v) => table.toggleAllPageRowsSelected(!!v)}
        aria-label="Select all"
      />
    ),
    cell: ({ row }) => (
      <Checkbox
        checked={row.getIsSelected()}
        onCheckedChange={(v) => row.toggleSelected(!!v)}
        aria-label="Select row"
        onClick={(e) => e.stopPropagation()}
      />
    ),
  }
}



export interface RowAction<TData> {
  label: string
  icon?: React.ReactNode
  
  onClick: (row: TData) => void
 
  destructive?: boolean
 
  separator?: boolean
  
  hidden?: (row: TData) => boolean
  disabled?: (row: TData) => boolean
}

export function createActionsColumn<TData>(
  actions: RowAction<TData>[],
  { size = 52 }: { size?: number } = {}
): ColumnDef<TData> {
  return {
    id: "_actions",
    size,
    enableSorting: false,
    enableHiding: false,
    header: () => null,
    cell: ({ row }) => {
      const visibleActions = actions.filter(
        (a) => !a.hidden?.(row.original)
      )
      if (!visibleActions.length) return null
      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 opacity-0 group-hover/row:opacity-100 data-[state=open]:opacity-100 transition-opacity"
              onClick={(e) => e.stopPropagation()}
            >
              <MoreHorizontal className="h-4 w-4" />
              <span className="sr-only">Actions</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-40">
            {visibleActions.map((action, i) => (
              <React.Fragment key={i}>
                {action.separator && i > 0 && <DropdownMenuSeparator />}
                <DropdownMenuItem
                  disabled={action.disabled?.(row.original)}
                  className={cn(
                    action.destructive && "text-destructive focus:text-destructive"
                  )}
                  onClick={(e) => {
                    e.stopPropagation()
                    action.onClick(row.original)
                  }}
                >
                  {action.icon && (
                    <span className="mr-2 h-4 w-4 flex-shrink-0">{action.icon}</span>
                  )}
                  {action.label}
                </DropdownMenuItem>
              </React.Fragment>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      )
    },
  }
}



export function viewAction<TData>(
  onClick: (row: TData) => void,
  overrides?: Partial<RowAction<TData>>
): RowAction<TData> {
  return { label: "View", icon: <Eye className="h-4 w-4" />, onClick, ...overrides }
}

export function editAction<TData>(
  onClick: (row: TData) => void,
  overrides?: Partial<RowAction<TData>>
): RowAction<TData> {
  return { label: "Edit", icon: <Pencil className="h-4 w-4" />, onClick, ...overrides }
}

export function deleteAction<TData>(
  onClick: (row: TData) => void,
  overrides?: Partial<RowAction<TData>>
): RowAction<TData> {
  return {
    label: "Delete",
    icon: <Trash2 className="h-4 w-4" />,
    onClick,
    destructive: true,
    separator: true,
    ...overrides,
  }
}

export function copyAction<TData>(
  getValue: (row: TData) => string,
  overrides?: Partial<RowAction<TData>>
): RowAction<TData> {
  return {
    label: "Copy ID",
    icon: <Copy className="h-4 w-4" />,
    onClick: (row) => navigator.clipboard.writeText(getValue(row)),
    ...overrides,
  }
}

export function openAction<TData>(
  getUrl: (row: TData) => string,
  overrides?: Partial<RowAction<TData>>
): RowAction<TData> {
  return {
    label: "Open",
    icon: <ExternalLink className="h-4 w-4" />,
    onClick: (row) => window.open(getUrl(row), "_blank"),
    ...overrides,
  }
}




export function TextCell({
  value,
  maxWidth = 200,
  muted = false,
  mono = false,
  className,
}: {
  value: React.ReactNode
  maxWidth?: number
  muted?: boolean
  mono?: boolean
  className?: string
}) {
  return (
    <span
      className={cn(
        "block truncate text-sm",
        muted && "text-muted-foreground",
        mono  && "font-mono text-xs",
        className
      )}
      style={{ maxWidth }}
    >
      {value ?? "—"}
    </span>
  )
}


export function StackedCell({
  title,
  subtitle,
  titleClassName,
  subtitleClassName,
}: {
  title: React.ReactNode
  subtitle?: React.ReactNode
  titleClassName?: string
  subtitleClassName?: string
}) {
  return (
    <div className="space-y-0.5 min-w-0">
      <p className={cn("text-sm font-medium leading-tight truncate", titleClassName)}>
        {title}
      </p>
      {subtitle && (
        <p className={cn("text-xs text-muted-foreground truncate", subtitleClassName)}>
          {subtitle}
        </p>
      )}
    </div>
  )
}

export function DateCell({
  value,
  format = "date",
}: {
  value: string | Date | null | undefined
  format?: "date" | "datetime" | "relative"
}) {
  if (!value) return <span className="text-xs text-muted-foreground">—</span>

  const display =
    format === "datetime" ? formatters.dateTime(value as string)
    : format === "relative" ? formatters.relative?.(value as string) ?? formatters.date(value as string)
    : formatters.date(value as string)

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span className="text-xs text-muted-foreground cursor-default whitespace-nowrap">
          {display}
        </span>
      </TooltipTrigger>
      <TooltipContent side="top" className="text-xs">
        {formatters.dateTime(value as string)}
      </TooltipContent>
    </Tooltip>
  )
}


export function BadgeCell({
  value,
  colorMap,
  className,
}: {
  value: string | null | undefined
  colorMap?: Record<string, string>
  className?: string
}) {
  if (!value) return <span className="text-xs text-muted-foreground">—</span>
  const style = colorMap?.[value] ?? ""
  return (
    <Badge
      variant="outline"
      className={cn("text-xs capitalize font-medium", style, className)}
    >
      {value.replace(/_/g, " ")}
    </Badge>
  )
}


export function CurrencyCell({
  value,
  currency = "GBP",
  className,
}: {
  value: number | null | undefined
  currency?: string
  className?: string
}) {
  if (value === null || value === undefined) {
    return <span className="text-xs text-muted-foreground text-right block">—</span>
  }
  const formatted = new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
  }).format(value)

  return (
    <span className={cn("text-sm font-medium tabular-nums text-right block", className)}>
      {formatted}
    </span>
  )
}


export function NumberCell({
  value,
  unit,
  className,
}: {
  value: number | null | undefined
  unit?: string
  className?: string
}) {
  if (value === null || value === undefined) {
    return <span className="text-xs text-muted-foreground">—</span>
  }
  return (
    <span className={cn("text-sm tabular-nums", className)}>
      {value.toLocaleString("en-GB")}
      {unit && <span className="text-muted-foreground ml-0.5 text-xs">{unit}</span>}
    </span>
  )
}


export function BooleanCell({
  value,
  trueLabel  = "Yes",
  falseLabel = "No",
}: {
  value: boolean | null | undefined
  trueLabel?:  string
  falseLabel?: string
}) {
  if (value === null || value === undefined) {
    return <span className="text-xs text-muted-foreground">—</span>
  }
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 text-xs font-medium",
        value ? "text-emerald-700" : "text-muted-foreground"
      )}
    >
      <span
        className={cn(
          "h-1.5 w-1.5 rounded-full",
          value ? "bg-emerald-500" : "bg-muted-foreground/40"
        )}
      />
      {value ? trueLabel : falseLabel}
    </span>
  )
}


export function AvatarCell({
  name,
  subtitle,
  initials,
  className,
}: {
  name: string
  subtitle?: string
  initials?: string
  className?: string
}) {
  const fallback = initials
    ?? name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)

  return (
    <div className={cn("flex items-center gap-2.5 min-w-0", className)}>
      <div className="h-7 w-7 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-semibold flex-shrink-0">
        {fallback}
      </div>
      <StackedCell title={name} subtitle={subtitle} />
    </div>
  )
}



type ColumnHelper<TData> = {
  
  text: (
    id: keyof TData & string,
    title: string,
    options?: {
      cell?: (row: TData) => React.ReactNode
      size?: number
      enableSorting?: boolean
      enableHiding?: boolean
      className?: string
    }
  ) => ColumnDef<TData>

 
  date: (
    id: keyof TData & string,
    title: string,
    options?: { format?: "date" | "datetime" | "relative"; size?: number }
  ) => ColumnDef<TData>


  badge: (
    id: keyof TData & string,
    title: string,
    colorMap?: Record<string, string>,
    options?: { size?: number }
  ) => ColumnDef<TData>

 
  currency: (
    id: keyof TData & string,
    title: string,
    options?: { currency?: string; size?: number }
  ) => ColumnDef<TData>

 
  boolean: (
    id: keyof TData & string,
    title: string,
    options?: { trueLabel?: string; falseLabel?: string; size?: number }
  ) => ColumnDef<TData>

  
  selection: () => ColumnDef<TData>

  
  actions: (actions: RowAction<TData>[], options?: { size?: number }) => ColumnDef<TData>
}

export function createColumnHelper<TData>(): ColumnHelper<TData> {
  return {
    text(id, title, options = {}) {
      return {
        accessorKey: id,
        size: options.size,
        enableSorting: options.enableSorting ?? true,
        enableHiding:  options.enableHiding  ?? true,
        header: ({ column }) => (
          <SortableHeader column={column} title={title} className={options.className} />
        ),
        cell: ({ row }) =>
          options.cell ? (
            options.cell(row.original)
          ) : (
            <TextCell value={row.getValue(id)} />
          ),
      } as ColumnDef<TData>
    },

    date(id, title, options = {}) {
      return {
        accessorKey: id,
        size: options.size ?? 140,
        enableSorting: true,
        header: ({ column }) => <SortableHeader column={column} title={title} />,
        cell: ({ row }) => (
          <DateCell value={row.getValue(id)} format={options.format ?? "date"} />
        ),
      } as ColumnDef<TData>
    },

    badge(id, title, colorMap, options = {}) {
      return {
        accessorKey: id,
        size: options.size ?? 120,
        enableSorting: false,
        header: () => (
          <span className="text-xs font-medium text-muted-foreground">{title}</span>
        ),
        cell: ({ row }) => (
          <BadgeCell value={row.getValue(id)} colorMap={colorMap} />
        ),
      } as ColumnDef<TData>
    },

    currency(id, title, options = {}) {
      return {
        accessorKey: id,
        size: options.size ?? 110,
        enableSorting: true,
        header: ({ column }) => (
          <SortableHeader column={column} title={title} className="ml-auto" />
        ),
        cell: ({ row }) => (
          <CurrencyCell value={row.getValue(id)} currency={options.currency} />
        ),
      } as ColumnDef<TData>
    },

    boolean(id, title, options = {}) {
      return {
        accessorKey: id,
        size: options.size ?? 90,
        enableSorting: false,
        header: () => (
          <span className="text-xs font-medium text-muted-foreground">{title}</span>
        ),
        cell: ({ row }) => (
          <BooleanCell
            value={row.getValue(id)}
            trueLabel={options.trueLabel}
            falseLabel={options.falseLabel}
          />
        ),
      } as ColumnDef<TData>
    },

    selection: () => createSelectionColumn<TData>(),

    actions: (actions, options) => createActionsColumn<TData>(actions, options),
  }
}