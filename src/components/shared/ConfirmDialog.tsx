"use client"

import * as React from "react"
import { Loader2 } from "lucide-react"
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
import { cn } from "@/lib/utils"

interface ConfirmDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  description?: string
  confirmLabel?: string
  cancelLabel?: string
  destructive?: boolean
  isLoading?: boolean
  onConfirm: () => Promise<void> | void
  onCancel?: () => void
  children?: React.ReactNode
}

export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  destructive = false,
  isLoading = false,
  onConfirm,
  onCancel,
  children,
}: ConfirmDialogProps) {
  const [loading, setLoading] = React.useState(false)

  const handleConfirm = async (e: React.MouseEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      await onConfirm()
      onOpenChange(false)
    } finally {
      setLoading(false)
    }
  }

  const handleCancel = () => {
    onCancel?.()
    onOpenChange(false)
  }

  const busy = isLoading || loading

  return (
    <AlertDialog open={open} onOpenChange={(v) => !busy && onOpenChange(v)}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          {description && (
            <AlertDialogDescription>{description}</AlertDialogDescription>
          )}
        </AlertDialogHeader>

        {children && <div className="text-sm text-muted-foreground">{children}</div>}

        <AlertDialogFooter>
          <AlertDialogCancel onClick={handleCancel} disabled={busy}>
            {cancelLabel}
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={handleConfirm}
            disabled={busy}
            className={cn(
              destructive && "bg-destructive hover:bg-destructive/90 focus:ring-destructive"
            )}
          >
            {busy && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            {confirmLabel}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

export function useConfirmDialog() {
  const [state, setState] = React.useState<{
    open: boolean
    props: Omit<ConfirmDialogProps, "open" | "onOpenChange"> | null
  }>({ open: false, props: null })

  const confirm = React.useCallback(
    (props: Omit<ConfirmDialogProps, "open" | "onOpenChange">) => {
      setState({ open: true, props })
    },
    []
  )

  const dialog = state.props ? (
    <ConfirmDialog
      {...state.props}
      open={state.open}
      onOpenChange={(v) => setState((s) => ({ ...s, open: v }))}
    />
  ) : null

  return { confirm, dialog }
}