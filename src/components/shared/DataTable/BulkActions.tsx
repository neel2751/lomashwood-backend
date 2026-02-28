"use client"

import * as React from "react"
import { Table } from "@tanstack/react-table"
import { Loader2, X } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"


export interface BulkAction<TData> {

  label: string
  
  icon?: React.ReactNode
  
  onClick: (rows: TData[]) => Promise<void> | void
 
  destructive?: boolean
  
  confirm?: {
    title: string
    description?: string
    confirmLabel?: string
  }
 
  disabled?: (rows: TData[]) => boolean

  hidden?: (rows: TData[]) => boolean
  
  tooltip?: string
  
  variant?: "outline" | "secondary" | "ghost" | "destructive"
}


function useConfirmDialog() {
  const [open, setOpen]       = React.useState(false)
  const [config, setConfig]   = React.useState<BulkAction<unknown>["confirm"]>(undefined)
  const resolveRef            = React.useRef<(confirmed: boolean) => void>()

  const prompt = (cfg: BulkAction<unknown>["confirm"]): Promise<boolean> => {
    setConfig(cfg)
    setOpen(true)
    return new Promise((resolve) => {
      resolveRef.current = resolve
    })
  }

  const handleConfirm = () => {
    resolveRef.current?.(true)
    setOpen(false)
  }

  const handleCancel = () => {
    resolveRef.current?.(false)
    setOpen(false)
  }

  return { open, config, prompt, handleConfirm, handleCancel }
}


interface DataTableBulkActionsProps<TData> {
  table: Table<TData>
  actions: BulkAction<TData>[]
  selectedCount: number
  className?: string
}

export function DataTableBulkActions<TData>({
  table,
  actions,
  selectedCount,
  className,
}: DataTableBulkActionsProps<TData>) {
  const [loadingId, setLoadingId] = React.useState<number | null>(null)
  const { open, config, prompt, handleConfirm, handleCancel } = useConfirmDialog()

  const selectedRows = table
    .getFilteredSelectedRowModel()
    .rows.map((r) => r.original)

  const handleAction = async (action: BulkAction<TData>, idx: number) => {
    if (action.confirm) {
      const confirmed = await prompt(action.confirm as BulkAction<unknown>["confirm"])
      if (!confirmed) return
    }

    setLoadingId(idx)
    try {
      await action.onClick(selectedRows)
      table.resetRowSelection()
    } finally {
      setLoadingId(null)
    }
  }

  const visibleActions = actions.filter((a) => !a.hidden?.(selectedRows))

  return (
    <>
      <div
        className={cn(
          "flex items-center gap-3 rounded-lg border border-primary/20 bg-primary/5 px-4 py-2.5",
          "animate-in slide-in-from-top-1 fade-in-0 duration-150",
          className
        )}
        role="toolbar"
        aria-label="Bulk actions"
      >
        
        <div className="flex items-center gap-2 mr-1">
          <span className="text-sm font-semibold tabular-nums text-primary">
            {selectedCount}
          </span>
          <span className="text-sm text-muted-foreground">
            {selectedCount === 1 ? "row" : "rows"} selected
          </span>
          <button
            onClick={() => table.resetRowSelection()}
            className="rounded text-muted-foreground hover:text-foreground transition-colors p-0.5"
            aria-label="Clear selection"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>

        <Separator orientation="vertical" className="h-5" />

        
        <div className="flex items-center gap-1.5 flex-wrap">
          {visibleActions.map((action, idx) => {
            const isLoading  = loadingId === idx
            const isDisabled = isLoading || loadingId !== null || action.disabled?.(selectedRows)

            const buttonVariant: BulkAction<TData>["variant"] =
              action.variant
                ?? (action.destructive ? "destructive" : "outline")

            const btn = (
              <Button
                key={idx}
                variant={buttonVariant}
                size="sm"
                disabled={isDisabled}
                className={cn(
                  "h-7 text-xs gap-1.5",
                  action.destructive &&
                    !action.variant &&
                    "border-destructive/30 text-destructive hover:text-destructive hover:border-destructive/60 hover:bg-destructive/5"
                )}
                onClick={() => handleAction(action, idx)}
              >
                {isLoading ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  action.icon && (
                    <span className="h-3.5 w-3.5 flex items-center">
                      {action.icon}
                    </span>
                  )
                )}
                {action.label}
              </Button>
            )

            if (action.tooltip) {
              return (
                <Tooltip key={idx}>
                  <TooltipTrigger asChild>{btn}</TooltipTrigger>
                  <TooltipContent side="top" className="text-xs">
                    {action.tooltip}
                  </TooltipContent>
                </Tooltip>
              )
            }

            return btn
          })}
        </div>

      
        {table.getIsAllPageRowsSelected() &&
          !table.getIsAllRowsSelected() &&
          table.getFilteredRowModel().rows.length > selectedCount && (
            <div className="ml-auto flex items-center gap-2 text-xs text-muted-foreground">
              <span>
                All {selectedCount} on this page selected.
              </span>
              <button
                className="font-medium text-primary hover:underline"
                onClick={() => table.toggleAllRowsSelected(true)}
              >
                Select all {table.getFilteredRowModel().rows.length} rows
              </button>
            </div>
          )}
      </div>

      
      <AlertDialog open={open} onOpenChange={(v) => !v && handleCancel()}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {config?.title ?? "Are you sure?"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {config?.description ??
                `This will affect ${selectedCount} selected ${
                  selectedCount === 1 ? "item" : "items"
                }. This action cannot be undone.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={handleCancel}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive hover:bg-destructive/90"
              onClick={handleConfirm}
            >
              {config?.confirmLabel ?? "Confirm"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}


import {
  Trash2,
  Download,
  CheckCircle2,
  XCircle,
  Mail,
  Tag,
} from "lucide-react"

export function bulkDeleteAction<TData>(
  onDelete: (rows: TData[]) => Promise<void> | void,
  overrides?: Partial<BulkAction<TData>>
): BulkAction<TData> {
  return {
    label: "Delete",
    icon: <Trash2 className="h-3.5 w-3.5" />,
    onClick: onDelete,
    destructive: true,
    confirm: {
      title: "Delete selected items?",
      description:
        "This will permanently delete all selected items. This action cannot be undone.",
      confirmLabel: "Delete",
    },
    ...overrides,
  }
}

export function bulkExportAction<TData>(
  onExport: (rows: TData[]) => Promise<void> | void,
  overrides?: Partial<BulkAction<TData>>
): BulkAction<TData> {
  return {
    label: "Export",
    icon: <Download className="h-3.5 w-3.5" />,
    onClick: onExport,
    tooltip: "Export selected rows to CSV",
    ...overrides,
  }
}

export function bulkActivateAction<TData>(
  onActivate: (rows: TData[]) => Promise<void> | void,
  overrides?: Partial<BulkAction<TData>>
): BulkAction<TData> {
  return {
    label: "Activate",
    icon: <CheckCircle2 className="h-3.5 w-3.5" />,
    onClick: onActivate,
    ...overrides,
  }
}

export function bulkDeactivateAction<TData>(
  onDeactivate: (rows: TData[]) => Promise<void> | void,
  overrides?: Partial<BulkAction<TData>>
): BulkAction<TData> {
  return {
    label: "Deactivate",
    icon: <XCircle className="h-3.5 w-3.5" />,
    onClick: onDeactivate,
    confirm: {
      title: "Deactivate selected items?",
      confirmLabel: "Deactivate",
    },
    ...overrides,
  }
}

export function bulkEmailAction<TData>(
  onEmail: (rows: TData[]) => Promise<void> | void,
  overrides?: Partial<BulkAction<TData>>
): BulkAction<TData> {
  return {
    label: "Send email",
    icon: <Mail className="h-3.5 w-3.5" />,
    onClick: onEmail,
    ...overrides,
  }
}

export function bulkTagAction<TData>(
  onTag: (rows: TData[]) => Promise<void> | void,
  overrides?: Partial<BulkAction<TData>>
): BulkAction<TData> {
  return {
    label: "Add tag",
    icon: <Tag className="h-3.5 w-3.5" />,
    onClick: onTag,
    ...overrides,
  }
}