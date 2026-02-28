"use client"

import * as React from "react"
import { Check, Copy } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { cn } from "@/lib/utils"

interface CopyButtonProps {
  value: string
  tooltip?: string
  successTooltip?: string
  variant?: React.ComponentProps<typeof Button>["variant"]
  size?: React.ComponentProps<typeof Button>["size"]
  className?: string
  iconClassName?: string
  onCopy?: (value: string) => void
}

export function CopyButton({
  value,
  tooltip = "Copy",
  successTooltip = "Copied!",
  variant = "ghost",
  size = "icon",
  className,
  iconClassName,
  onCopy,
}: CopyButtonProps) {
  const [copied, setCopied] = React.useState(false)

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(value)
      setCopied(true)
      onCopy?.(value)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      const el = document.createElement("textarea")
      el.value = value
      el.style.position = "fixed"
      el.style.opacity = "0"
      document.body.appendChild(el)
      el.focus()
      el.select()
      document.execCommand("copy")
      document.body.removeChild(el)
      setCopied(true)
      onCopy?.(value)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          variant={variant}
          size={size}
          onClick={handleCopy}
          className={cn("transition-colors", className)}
          aria-label={copied ? successTooltip : tooltip}
        >
          {copied ? (
            <Check className={cn("h-4 w-4 text-emerald-600", iconClassName)} />
          ) : (
            <Copy className={cn("h-4 w-4", iconClassName)} />
          )}
        </Button>
      </TooltipTrigger>
      <TooltipContent side="top" className="text-xs">
        {copied ? successTooltip : tooltip}
      </TooltipContent>
    </Tooltip>
  )
}

interface CopyFieldProps {
  value: string
  label?: string
  mono?: boolean
  truncate?: boolean
  className?: string
}

export function CopyField({
  value,
  label,
  mono = true,
  truncate = true,
  className,
}: CopyFieldProps) {
  return (
    <div
      className={cn(
        "group flex items-center gap-2 rounded-md border bg-muted/40 pl-3 pr-1 py-1.5",
        className
      )}
    >
      {label && (
        <span className="text-xs text-muted-foreground mr-0.5 flex-shrink-0">
          {label}
        </span>
      )}
      <span
        className={cn(
          "text-sm flex-1",
          mono && "font-mono text-xs",
          truncate && "truncate min-w-0"
        )}
      >
        {value}
      </span>
      <CopyButton
        value={value}
        size="sm"
        className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity"
      />
    </div>
  )
}