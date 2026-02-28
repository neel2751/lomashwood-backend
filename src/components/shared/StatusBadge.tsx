import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const statusBadgeVariants = cva(
  "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium",
  {
    variants: {
      status: {
        active:      "bg-emerald-50 text-emerald-700 border-emerald-200",
        inactive:    "bg-muted text-muted-foreground border-transparent",
        pending:     "bg-amber-50 text-amber-700 border-amber-200",
        suspended:   "bg-red-50 text-red-700 border-red-200",
        draft:       "bg-muted text-muted-foreground border-border",
        published:   "bg-emerald-50 text-emerald-700 border-emerald-200",
        archived:    "bg-muted text-muted-foreground border-transparent",
        cancelled:   "bg-red-50 text-red-700 border-red-200",
        completed:   "bg-emerald-50 text-emerald-700 border-emerald-200",
        processing:  "bg-blue-50 text-blue-700 border-blue-200",
        failed:      "bg-red-50 text-red-700 border-red-200",
        refunded:    "bg-orange-50 text-orange-700 border-orange-200",
        delivered:   "bg-emerald-50 text-emerald-700 border-emerald-200",
        sent:        "bg-blue-50 text-blue-700 border-blue-200",
        bounced:     "bg-orange-50 text-orange-700 border-orange-200",
        confirmed:   "bg-emerald-50 text-emerald-700 border-emerald-200",
        scheduled:   "bg-violet-50 text-violet-700 border-violet-200",
        noshow:      "bg-red-50 text-red-700 border-red-200",
        new:         "bg-blue-50 text-blue-700 border-blue-200",
        open:        "bg-amber-50 text-amber-700 border-amber-200",
        resolved:    "bg-emerald-50 text-emerald-700 border-emerald-200",
      },
    },
  }
)

const DOT_VARIANTS: Record<string, string> = {
  active:     "bg-emerald-500",
  inactive:   "bg-muted-foreground/40",
  pending:    "bg-amber-500 animate-pulse",
  suspended:  "bg-red-500",
  draft:      "bg-muted-foreground/40",
  published:  "bg-emerald-500",
  archived:   "bg-muted-foreground/30",
  cancelled:  "bg-red-500",
  completed:  "bg-emerald-500",
  processing: "bg-blue-500 animate-pulse",
  failed:     "bg-red-500",
  refunded:   "bg-orange-500",
  delivered:  "bg-emerald-500",
  sent:       "bg-blue-500",
  bounced:    "bg-orange-500",
  confirmed:  "bg-emerald-500",
  scheduled:  "bg-violet-500",
  noshow:     "bg-red-500",
  new:        "bg-blue-500",
  open:       "bg-amber-500",
  resolved:   "bg-emerald-500",
}

const STATUS_LABELS: Record<string, string> = {
  active:     "Active",
  inactive:   "Inactive",
  pending:    "Pending",
  suspended:  "Suspended",
  draft:      "Draft",
  published:  "Published",
  archived:   "Archived",
  cancelled:  "Cancelled",
  completed:  "Completed",
  processing: "Processing",
  failed:     "Failed",
  refunded:   "Refunded",
  delivered:  "Delivered",
  sent:       "Sent",
  bounced:    "Bounced",
  confirmed:  "Confirmed",
  scheduled:  "Scheduled",
  noshow:     "No Show",
  new:        "New",
  open:       "Open",
  resolved:   "Resolved",
}

type StatusKey = keyof typeof STATUS_LABELS

interface StatusBadgeProps {
  status: StatusKey | string
  label?: string
  showDot?: boolean
  className?: string
}

export function StatusBadge({
  status,
  label,
  showDot = true,
  className,
}: StatusBadgeProps) {
  const knownStatus = status as StatusKey
  const badgeClass = statusBadgeVariants({ status: knownStatus })
  const dotClass   = DOT_VARIANTS[status] ?? "bg-muted-foreground/40"
  const displayLabel = label ?? STATUS_LABELS[status] ?? status.replace(/_/g, " ")

  return (
    <span className={cn(badgeClass ?? "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium bg-muted text-muted-foreground", className)}>
      {showDot && (
        <span className={cn("h-1.5 w-1.5 rounded-full flex-shrink-0", dotClass)} />
      )}
      <span className="capitalize">{displayLabel}</span>
    </span>
  )
}

interface StatusDotProps {
  status: StatusKey | string
  className?: string
}

export function StatusDot({ status, className }: StatusDotProps) {
  const dotClass = DOT_VARIANTS[status] ?? "bg-muted-foreground/40"
  return (
    <span
      className={cn("inline-block h-2 w-2 rounded-full flex-shrink-0", dotClass, className)}
      aria-label={STATUS_LABELS[status] ?? status}
    />
  )
}

export { STATUS_LABELS, DOT_VARIANTS, type StatusKey }