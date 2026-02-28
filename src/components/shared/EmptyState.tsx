import * as React from "react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Package,
  Users,
  ShoppingBag,
  Calendar,
  Bell,
  FileText,
  BarChart2,
  Search,
  Plus,
  RefreshCw,
  Filter,
  Inbox,
} from "lucide-react"

const PRESET_ICONS = {
  products:     Package,
  customers:    Users,
  orders:       ShoppingBag,
  appointments: Calendar,
  notifications: Bell,
  content:      FileText,
  analytics:    BarChart2,
  search:       Search,
  inbox:        Inbox,
  default:      Inbox,
} as const

type PresetKey = keyof typeof PRESET_ICONS

interface EmptyStateAction {
  label: string
  onClick: () => void
  icon?: React.ReactNode
  variant?: "default" | "outline" | "ghost" | "secondary"
}

interface EmptyStateProps {
  preset?: PresetKey
  icon?: React.ReactNode
  title: string
  description?: string
  actions?: EmptyStateAction[]
  variant?: "page" | "section" | "card" | "table"
  filtered?: boolean
  onClearFilters?: () => void
  onCreateNew?: () => void
  createNewLabel?: string
  className?: string
}

export function EmptyState({
  preset,
  icon,
  title,
  description,
  actions,
  variant = "section",
  filtered = false,
  onClearFilters,
  onCreateNew,
  createNewLabel = "Create new",
  className,
}: EmptyStateProps) {
  const IconComponent = preset ? PRESET_ICONS[preset] : null

  const resolvedIcon = icon ?? (
    IconComponent ? <IconComponent className={cn(
      "text-muted-foreground/40",
      variant === "table" ? "h-8 w-8" : variant === "card" ? "h-7 w-7" : "h-10 w-10"
    )} /> : null
  )

  const resolvedTitle = filtered
    ? "No results match your filters"
    : title

  const resolvedDescription = filtered
    ? description ?? "Try adjusting or clearing your filters to see more results."
    : description

  const resolvedActions: EmptyStateAction[] = actions ?? [
    ...(filtered && onClearFilters
      ? [{ label: "Clear filters", onClick: onClearFilters, icon: <Filter className="h-4 w-4" />, variant: "outline" as const }]
      : []),
    ...(onCreateNew && !filtered
      ? [{ label: createNewLabel, onClick: onCreateNew, icon: <Plus className="h-4 w-4" /> }]
      : []),
  ]

  if (variant === "table") {
    return (
      <div className={cn("flex flex-col items-center justify-center gap-2 py-12 text-center", className)}>
        {resolvedIcon}
        <p className="text-sm font-medium">{resolvedTitle}</p>
        {resolvedDescription && (
          <p className="text-xs text-muted-foreground max-w-xs">{resolvedDescription}</p>
        )}
        {resolvedActions.length > 0 && (
          <div className="flex gap-2 mt-1">
            {resolvedActions.map((action, i) => (
              <Button
                key={i}
                variant={action.variant ?? (i === 0 ? "default" : "outline")}
                size="sm"
                onClick={action.onClick}
                className="mt-1"
              >
                {action.icon}
                {action.label}
              </Button>
            ))}
          </div>
        )}
      </div>
    )
  }

  if (variant === "card") {
    return (
      <div className={cn(
        "flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed bg-muted/20 px-6 py-10 text-center",
        className
      )}>
        {resolvedIcon && (
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
            {resolvedIcon}
          </div>
        )}
        <div className="space-y-1">
          <p className="text-sm font-medium">{resolvedTitle}</p>
          {resolvedDescription && (
            <p className="text-xs text-muted-foreground">{resolvedDescription}</p>
          )}
        </div>
        {resolvedActions.length > 0 && (
          <div className="flex gap-2">
            {resolvedActions.map((action, i) => (
              <Button
                key={i}
                variant={action.variant ?? (i === 0 ? "default" : "outline")}
                size="sm"
                onClick={action.onClick}
              >
                {action.icon}
                {action.label}
              </Button>
            ))}
          </div>
        )}
      </div>
    )
  }

  return (
    <div className={cn(
      "flex flex-col items-center justify-center gap-4 text-center",
      variant === "page" ? "min-h-[55vh] px-4" : "py-16 px-6",
      className
    )}>
      {resolvedIcon && (
        <div className={cn(
          "flex items-center justify-center rounded-full bg-muted",
          variant === "page" ? "h-16 w-16" : "h-14 w-14"
        )}>
          {resolvedIcon}
        </div>
      )}
      <div className="space-y-2 max-w-sm">
        <h3 className={cn("font-semibold", variant === "page" ? "text-xl" : "text-base")}>
          {resolvedTitle}
        </h3>
        {resolvedDescription && (
          <p className="text-sm text-muted-foreground leading-relaxed">{resolvedDescription}</p>
        )}
      </div>
      {resolvedActions.length > 0 && (
        <div className="flex flex-wrap items-center justify-center gap-2">
          {resolvedActions.map((action, i) => (
            <Button
              key={i}
              variant={action.variant ?? (i === 0 ? "default" : "outline")}
              onClick={action.onClick}
            >
              {action.icon}
              {action.label}
            </Button>
          ))}
        </div>
      )}
    </div>
  )
}

export function EmptySearch({
  query,
  onClear,
  className,
}: {
  query?: string
  onClear?: () => void
  className?: string
}) {
  return (
    <EmptyState
      icon={<Search className="h-9 w-9 text-muted-foreground/40" />}
      title={query ? `No results for "${query}"` : "No results found"}
      description="Try different keywords or check your spelling."
      variant="table"
      actions={
        onClear
          ? [{ label: "Clear search", onClick: onClear, icon: <RefreshCw className="h-4 w-4" />, variant: "outline" }]
          : []
      }
      className={className}
    />
  )
}