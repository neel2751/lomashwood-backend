import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

// ── Variants ──────────────────────────────────────────────────────────────────

const textareaVariants = cva(
  [
    "flex w-full rounded-md border bg-transparent px-3 py-2 text-sm",
    "shadow-sm transition-colors placeholder:text-muted-foreground",
    "focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring",
    "disabled:cursor-not-allowed disabled:opacity-50",
    "aria-invalid:ring-destructive/20 aria-invalid:border-destructive",
  ].join(" "),
  {
    variants: {
      variant: {
        /** Standard admin form textarea */
        default: "border-input resize-y min-h-[80px]",
        /** Fixed-height, no resize — used for short CMS inputs */
        fixed: "border-input resize-none",
        /** Borderless inline editor feel — for CMS rich-text wrappers */
        ghost:
          "border-transparent bg-transparent shadow-none hover:bg-muted/40 focus-visible:bg-background focus-visible:border-input resize-y min-h-[80px]",
        /** Code / mono content — SMS body, HTML snippets, robots.txt, IP lists */
        code:
          "border-input font-mono text-xs resize-y min-h-[80px] bg-muted/30",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

export interface TextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement>,
    VariantProps<typeof textareaVariants> {
  /** Show a character / word counter below the textarea */
  showCount?: boolean
  /** Hard max for counter display (does not enforce maxLength — use the native attr for that) */
  maxCount?: number
  /** Count mode — "chars" (default) or "words" */
  countMode?: "chars" | "words"
}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  (
    {
      className,
      variant,
      showCount = false,
      maxCount,
      countMode = "chars",
      onChange,
      value,
      defaultValue,
      ...props
    },
    ref
  ) => {
    // Track value internally only when showCount is on and the component is uncontrolled
    const [internalValue, setInternalValue] = React.useState(
      (defaultValue as string) ?? ""
    )

    const currentValue =
      value !== undefined ? (value as string) : internalValue

    const count =
      countMode === "words"
        ? currentValue.trim() === ""
          ? 0
          : currentValue.trim().split(/\s+/).length
        : currentValue.length

    const isOverLimit = maxCount !== undefined && count > maxCount

    const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      if (value === undefined) setInternalValue(e.target.value)
      onChange?.(e)
    }

    return (
      <div className="relative w-full">
        <textarea
          ref={ref}
          value={value}
          defaultValue={value !== undefined ? undefined : defaultValue}
          onChange={handleChange}
          className={cn(
            textareaVariants({ variant }),
            showCount && "pb-6",
            className
          )}
          {...props}
        />
        {showCount && (
          <span
            className={cn(
              "absolute bottom-2 right-3 text-xs select-none pointer-events-none transition-colors",
              isOverLimit
                ? "text-destructive font-medium"
                : "text-muted-foreground"
            )}
          >
            {maxCount !== undefined ? (
              <>
                <span className={isOverLimit ? "text-destructive" : ""}>
                  {count}
                </span>
                <span className="opacity-60">/{maxCount}</span>
              </>
            ) : (
              count
            )}
            {countMode === "words" ? " words" : ""}
          </span>
        )}
      </div>
    )
  }
)
Textarea.displayName = "Textarea"

// ── Labelled textarea (convenience wrapper) ───────────────────────────────────

export interface LabelledTextareaProps extends TextareaProps {
  label?: string
  description?: string
  error?: string
  required?: boolean
  id?: string
}

/**
 * A self-contained labelled textarea for use outside react-hook-form contexts,
 * e.g. quick inline CMS editors, filter panels, or standalone admin widgets.
 */
const LabelledTextarea = React.forwardRef<
  HTMLTextAreaElement,
  LabelledTextareaProps
>(({ label, description, error, required, id: idProp, className, ...props }, ref) => {
  const generatedId = React.useId()
  const id = idProp ?? generatedId

  return (
    <div className="space-y-2">
      {label && (
        <label
          htmlFor={id}
          className={cn(
            "text-sm font-medium leading-none",
            error && "text-destructive"
          )}
        >
          {label}
          {required && <span className="text-destructive ml-0.5">*</span>}
        </label>
      )}
      <Textarea
        ref={ref}
        id={id}
        aria-invalid={!!error}
        aria-describedby={
          description || error ? `${id}-help` : undefined
        }
        className={cn(error && "border-destructive focus-visible:ring-destructive/30", className)}
        {...props}
      />
      {(description || error) && (
        <p
          id={`${id}-help`}
          className={cn(
            "text-xs",
            error ? "text-destructive" : "text-muted-foreground"
          )}
        >
          {error ?? description}
        </p>
      )}
    </div>
  )
})
LabelledTextarea.displayName = "LabelledTextarea"

export { Textarea, LabelledTextarea, textareaVariants }