"use client"

import * as React from "react"
import * as TogglePrimitive from "@radix-ui/react-toggle"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

// ── Variants ──────────────────────────────────────────────────────────────────

const toggleVariants = cva(
  [
    "inline-flex items-center justify-center gap-2 rounded-md text-sm font-medium",
    "ring-offset-background transition-colors",
    "hover:bg-muted hover:text-muted-foreground",
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
    "disabled:pointer-events-none disabled:opacity-50",
    "data-[state=on]:bg-accent data-[state=on]:text-accent-foreground",
    "[&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  ].join(" "),
  {
    variants: {
      variant: {
        /** Default ghost toggle — used in toolbars, filter bars */
        default: "bg-transparent",

        /** Outlined — used in segmented-style controls */
        outline:
          "border border-input bg-transparent shadow-sm hover:bg-accent hover:text-accent-foreground",

        /**
         * Solid pressed state — used for active filter chips,
         * status toggles (e.g. Active-only in SessionTable)
         */
        solid:
          "bg-transparent border border-transparent data-[state=on]:bg-primary data-[state=on]:text-primary-foreground data-[state=on]:border-primary hover:border-border",

        /**
         * Destructive — for toggles that activate a dangerous mode,
         * e.g. Maintenance Mode indicator
         */
        destructive:
          "bg-transparent data-[state=on]:bg-destructive data-[state=on]:text-destructive-foreground hover:bg-destructive/10",

        /**
         * Status — coloured pressed state for status filter pills
         * (active / inactive / suspended)
         */
        status:
          "rounded-full border border-transparent text-xs px-3 py-1 h-auto data-[state=on]:border-current hover:bg-muted/60",
      },
      size: {
        default: "h-9 px-2 min-w-9",
        sm:      "h-8 px-1.5 min-w-8 text-xs",
        lg:      "h-10 px-3 min-w-10",
        /** Icon-only — used in rich-text toolbars, column headers */
        icon:    "h-8 w-8 p-0",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

// ── Base Toggle ───────────────────────────────────────────────────────────────

const Toggle = React.forwardRef<
  React.ElementRef<typeof TogglePrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof TogglePrimitive.Root> &
    VariantProps<typeof toggleVariants>
>(({ className, variant, size, ...props }, ref) => (
  <TogglePrimitive.Root
    ref={ref}
    className={cn(toggleVariants({ variant, size, className }))}
    {...props}
  />
))
Toggle.displayName = TogglePrimitive.Root.displayName

// ── ToggleGroup helpers (re-exported for convenience) ─────────────────────────

export { Toggle, toggleVariants }

// ── ToggleGroup ───────────────────────────────────────────────────────────────
// Thin wrapper that wires Radix ToggleGroup with the same variant system.
// Used for: view-mode switchers (list/grid), time-range pickers, channel filters.

import * as ToggleGroupPrimitive from "@radix-ui/react-toggle-group"

type ToggleGroupContextValue = VariantProps<typeof toggleVariants>

const ToggleGroupContext = React.createContext<ToggleGroupContextValue>({
  size: "default",
  variant: "default",
})

const ToggleGroup = React.forwardRef<
  React.ElementRef<typeof ToggleGroupPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof ToggleGroupPrimitive.Root> &
    VariantProps<typeof toggleVariants>
>(({ className, variant, size, children, ...props }, ref) => (
  <ToggleGroupPrimitive.Root
    ref={ref}
    className={cn("flex items-center justify-center gap-1", className)}
    {...props}
  >
    <ToggleGroupContext.Provider value={{ variant, size }}>
      {children}
    </ToggleGroupContext.Provider>
  </ToggleGroupPrimitive.Root>
))
ToggleGroup.displayName = ToggleGroupPrimitive.Root.displayName

const ToggleGroupItem = React.forwardRef<
  React.ElementRef<typeof ToggleGroupPrimitive.Item>,
  React.ComponentPropsWithoutRef<typeof ToggleGroupPrimitive.Item> &
    VariantProps<typeof toggleVariants>
>(({ className, children, variant, size, ...props }, ref) => {
  const context = React.useContext(ToggleGroupContext)
  return (
    <ToggleGroupPrimitive.Item
      ref={ref}
      className={cn(
        toggleVariants({
          variant: variant ?? context.variant,
          size: size ?? context.size,
        }),
        className
      )}
      {...props}
    >
      {children}
    </ToggleGroupPrimitive.Item>
  )
})
ToggleGroupItem.displayName = ToggleGroupPrimitive.Item.displayName

export { ToggleGroup, ToggleGroupItem }

// ── Segmented control (compound component) ────────────────────────────────────
// Styled single-select ToggleGroup that looks like a segmented button row.
// Commonly used for: Time range (7d / 30d / 90d), View (Kitchen / Bedroom),
// Appointment type filters, Analytics period pickers.

interface SegmentedControlOption<T extends string = string> {
  value: T
  label: React.ReactNode
  icon?: React.ReactNode
  disabled?: boolean
}

interface SegmentedControlProps<T extends string = string> {
  options: SegmentedControlOption<T>[]
  value?: T
  onValueChange?: (value: T) => void
  size?: "sm" | "default" | "lg"
  className?: string
  disabled?: boolean
}

function SegmentedControl<T extends string = string>({
  options,
  value,
  onValueChange,
  size = "default",
  className,
  disabled,
}: SegmentedControlProps<T>) {
  return (
    <div
      className={cn(
        "inline-flex items-center rounded-lg border bg-muted p-1 gap-0.5",
        className
      )}
      role="group"
    >
      {options.map((opt) => {
        const isActive = opt.value === value
        return (
          <button
            key={opt.value}
            type="button"
            role="radio"
            aria-checked={isActive}
            disabled={disabled || opt.disabled}
            onClick={() => !opt.disabled && onValueChange?.(opt.value)}
            className={cn(
              "inline-flex items-center justify-center gap-1.5 rounded-md font-medium transition-all",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1",
              "disabled:pointer-events-none disabled:opacity-40",
              size === "sm"  && "px-2.5 py-1 text-xs h-7",
              size === "default" && "px-3 py-1.5 text-sm h-8",
              size === "lg"  && "px-4 py-2 text-sm h-9",
              isActive
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            {opt.icon && (
              <span className={cn(
                "flex-shrink-0",
                size === "sm" ? "h-3 w-3" : "h-4 w-4"
              )}>
                {opt.icon}
              </span>
            )}
            {opt.label}
          </button>
        )
      })}
    </div>
  )
}

export { SegmentedControl }
export type { SegmentedControlOption, SegmentedControlProps }