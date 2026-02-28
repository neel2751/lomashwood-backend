import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const spinnerVariants = cva("animate-spin rounded-full border-2 flex-shrink-0", {
  variants: {
    size: {
      xs:  "h-3 w-3",
      sm:  "h-4 w-4",
      md:  "h-6 w-6",
      lg:  "h-8 w-8",
      xl:  "h-10 w-10",
    },
    variant: {
      default:     "border-muted border-t-primary",
      primary:     "border-primary/20 border-t-primary",
      white:       "border-white/30 border-t-white",
      muted:       "border-muted-foreground/20 border-t-muted-foreground",
      destructive: "border-destructive/20 border-t-destructive",
    },
  },
  defaultVariants: {
    size: "md",
    variant: "default",
  },
})

export interface LoadingSpinnerProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof spinnerVariants> {
  label?: string
  showLabel?: boolean
  labelPosition?: "right" | "bottom"
}

export function LoadingSpinner({
  size,
  variant,
  label = "Loading…",
  showLabel = false,
  labelPosition = "right",
  className,
  ...props
}: LoadingSpinnerProps) {
  const spinner = (
    <span
      className={cn(spinnerVariants({ size, variant }), className)}
      role="status"
      aria-label={label}
      {...props}
    />
  )

  if (!showLabel) return spinner

  return (
    <span
      className={cn(
        "inline-flex items-center gap-2",
        labelPosition === "bottom" && "flex-col"
      )}
    >
      {spinner}
      <span className="text-sm text-muted-foreground">{label}</span>
    </span>
  )
}

export function ButtonSpinner({ className }: { className?: string }) {
  return (
    <LoadingSpinner
      size="sm"
      variant="white"
      className={cn("border-current/20 border-t-current", className)}
    />
  )
}

export function InlineSpinner({ className }: { className?: string }) {
  return <LoadingSpinner size="sm" variant="muted" className={className} />
}