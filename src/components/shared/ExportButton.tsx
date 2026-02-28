"use client"

import * as React from "react"
import { Download, FileText, Table2, FileJson, Loader2, ChevronDown } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { cn } from "@/lib/utils"

export type ExportFormat = "csv" | "xlsx" | "json" | "pdf"

interface ExportOption {
  format: ExportFormat
  label: string
  description?: string
}

const FORMAT_ICONS: Record<ExportFormat, React.ReactNode> = {
  csv:  <Table2   className="h-4 w-4 text-emerald-600" />,
  xlsx: <Table2   className="h-4 w-4 text-emerald-700" />,
  json: <FileJson className="h-4 w-4 text-blue-600" />,
  pdf:  <FileText className="h-4 w-4 text-red-600" />,
}

const DEFAULT_OPTIONS: ExportOption[] = [
  { format: "csv",  label: "Export as CSV",  description: "Comma-separated values" },
  { format: "xlsx", label: "Export as Excel", description: "Microsoft Excel format" },
  { format: "json", label: "Export as JSON", description: "Raw JSON data" },
]

function triggerDownload(content: string, filename: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType })
  const url  = URL.createObjectURL(blob)
  const a    = document.createElement("a")
  a.href     = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

function toCSV(data: Record<string, unknown>[]): string {
  if (!data.length) return ""
  const headers = Object.keys(data[0])
  const escape  = (v: unknown) => {
    const s = v == null ? "" : String(v)
    return s.includes(",") || s.includes('"') || s.includes("\n")
      ? `"${s.replace(/"/g, '""')}"`
      : s
  }
  return [
    headers.join(","),
    ...data.map((row) => headers.map((h) => escape(row[h])).join(",")),
  ].join("\n")
}

interface ExportButtonProps {
  onExport: (format: ExportFormat) => Promise<Record<string, unknown>[] | void> | Record<string, unknown>[] | void
  formats?: ExportFormat[]
  filename?: string
  label?: string
  variant?: React.ComponentProps<typeof Button>["variant"]
  size?: React.ComponentProps<typeof Button>["size"]
  disabled?: boolean
  className?: string
  selectedCount?: number
}

export function ExportButton({
  onExport,
  formats = ["csv", "xlsx", "json"],
  filename = "export",
  label = "Export",
  variant = "outline",
  size = "sm",
  disabled = false,
  className,
  selectedCount,
}: ExportButtonProps) {
  const [loading, setLoading] = React.useState<ExportFormat | null>(null)

  const options = DEFAULT_OPTIONS.filter((o) => formats.includes(o.format))

  const handleExport = async (format: ExportFormat) => {
    setLoading(format)
    try {
      const result = await onExport(format)

      if (Array.isArray(result) && result.length > 0) {
        const ts = new Date().toISOString().slice(0, 10)
        const name = `${filename}-${ts}`

        if (format === "csv") {
          triggerDownload(toCSV(result), `${name}.csv`, "text/csv;charset=utf-8")
        } else if (format === "json") {
          triggerDownload(JSON.stringify(result, null, 2), `${name}.json`, "application/json")
        }
      }
    } finally {
      setLoading(null)
    }
  }

  if (formats.length === 1) {
    const fmt = formats[0]
    return (
      <Button
        variant={variant}
        size={size}
        disabled={disabled || !!loading}
        onClick={() => handleExport(fmt)}
        className={className}
      >
        {loading ? (
          <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />
        ) : (
          <Download className="h-4 w-4 mr-1.5" />
        )}
        {label}
        {selectedCount !== undefined && selectedCount > 0 && (
          <span className="ml-1 tabular-nums text-xs opacity-70">({selectedCount})</span>
        )}
      </Button>
    )
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant={variant}
          size={size}
          disabled={disabled || !!loading}
          className={cn("gap-1", className)}
        >
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Download className="h-4 w-4" />
          )}
          {label}
          {selectedCount !== undefined && selectedCount > 0 && (
            <span className="tabular-nums text-xs opacity-70">({selectedCount})</span>
          )}
          <ChevronDown className="h-3.5 w-3.5 opacity-60 ml-0.5" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuLabel className="text-xs">
          {selectedCount !== undefined && selectedCount > 0
            ? `Export ${selectedCount} selected row${selectedCount !== 1 ? "s" : ""}`
            : "Choose format"}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {options.map((opt) => (
          <DropdownMenuItem
            key={opt.format}
            disabled={!!loading}
            onClick={() => handleExport(opt.format)}
            className="gap-2"
          >
            {loading === opt.format ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              FORMAT_ICONS[opt.format]
            )}
            <div className="flex-1 min-w-0">
              <p className="text-sm">{opt.label}</p>
              {opt.description && (
                <p className="text-xs text-muted-foreground">{opt.description}</p>
              )}
            </div>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}