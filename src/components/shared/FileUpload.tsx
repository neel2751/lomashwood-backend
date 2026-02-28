"use client"

import * as React from "react"
import { Upload, X, File, Image, FileText, AlertCircle, CheckCircle2, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { cn } from "@/lib/utils"

const IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif", "image/svg+xml"]

function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 B"
  const k = 1024
  const sizes = ["B", "KB", "MB", "GB"]
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`
}

function FileIcon({ type, className }: { type: string; className?: string }) {
  if (IMAGE_TYPES.includes(type)) return <Image className={cn("h-5 w-5 text-blue-500", className)} />
  if (type.includes("pdf")) return <FileText className={cn("h-5 w-5 text-red-500", className)} />
  return <File className={cn("h-5 w-5 text-muted-foreground", className)} />
}

interface UploadedFile {
  id: string
  file: File
  preview?: string
  status: "idle" | "uploading" | "success" | "error"
  progress: number
  error?: string
  url?: string
}

interface FileUploadProps {
  accept?: string
  multiple?: boolean
  maxSize?: number
  maxFiles?: number
  onUpload?: (files: File[]) => Promise<{ url: string }[]> | void
  onRemove?: (id: string) => void
  onChange?: (files: UploadedFile[]) => void
  disabled?: boolean
  className?: string
  dropzoneClassName?: string
  variant?: "default" | "compact" | "avatar"
  hint?: string
}

export function FileUpload({
  accept,
  multiple = false,
  maxSize = 10 * 1024 * 1024,
  maxFiles = 10,
  onUpload,
  onRemove,
  onChange,
  disabled = false,
  className,
  dropzoneClassName,
  variant = "default",
  hint,
}: FileUploadProps) {
  const [files, setFiles] = React.useState<UploadedFile[]>([])
  const [isDragging, setIsDragging] = React.useState(false)
  const inputRef = React.useRef<HTMLInputElement>(null)

  const notifyChange = (updated: UploadedFile[]) => {
    setFiles(updated)
    onChange?.(updated)
  }

  const validateFile = (file: File): string | null => {
    if (maxSize && file.size > maxSize) {
      return `File too large. Max size is ${formatBytes(maxSize)}.`
    }
    if (accept) {
      const allowed = accept.split(",").map((t) => t.trim())
      const ext = "." + file.name.split(".").pop()?.toLowerCase()
      if (!allowed.some((a) => a === file.type || a === ext || a === "*")) {
        return `File type not allowed.`
      }
    }
    return null
  }

  const processFiles = async (incoming: File[]) => {
    const remaining = maxFiles - files.length
    const toProcess = incoming.slice(0, remaining)

    const previews: Record<string, string> = {}
    for (const file of toProcess) {
      if (IMAGE_TYPES.includes(file.type)) {
        previews[file.name] = URL.createObjectURL(file)
      }
    }

    const newEntries: UploadedFile[] = toProcess.map((file) => ({
      id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
      file,
      preview: previews[file.name],
      status: validateFile(file) ? "error" : "idle",
      progress: 0,
      error: validateFile(file) ?? undefined,
    }))

    const updated = multiple ? [...files, ...newEntries] : newEntries
    notifyChange(updated)

    if (onUpload) {
      const valid = newEntries.filter((e) => e.status !== "error")
      for (const entry of valid) {
        setFiles((prev) =>
          prev.map((f) => f.id === entry.id ? { ...f, status: "uploading", progress: 0 } : f)
        )
        try {
          const results = await onUpload([entry.file])
          const url = Array.isArray(results) ? results[0]?.url : undefined
          setFiles((prev) =>
            prev.map((f) => f.id === entry.id ? { ...f, status: "success", progress: 100, url } : f)
          )
        } catch (err) {
          setFiles((prev) =>
            prev.map((f) =>
              f.id === entry.id
                ? { ...f, status: "error", error: err instanceof Error ? err.message : "Upload failed" }
                : f
            )
          )
        }
      }
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    if (disabled) return
    processFiles(Array.from(e.dataTransfer.files))
  }

  const handleRemove = (id: string) => {
    const entry = files.find((f) => f.id === id)
    if (entry?.preview) URL.revokeObjectURL(entry.preview)
    const updated = files.filter((f) => f.id !== id)
    notifyChange(updated)
    onRemove?.(id)
  }

  const isCompact = variant === "compact"

  return (
    <div className={cn("space-y-3", className)}>
      <div
        onDragEnter={(e) => { e.preventDefault(); if (!disabled) setIsDragging(true) }}
        onDragLeave={(e) => { e.preventDefault(); setIsDragging(false) }}
        onDragOver={(e) => e.preventDefault()}
        onDrop={handleDrop}
        onClick={() => !disabled && inputRef.current?.click()}
        className={cn(
          "relative flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed transition-colors",
          isCompact ? "gap-1.5 px-4 py-4" : "gap-3 px-6 py-10",
          isDragging
            ? "border-primary bg-primary/5"
            : "border-muted-foreground/20 bg-muted/20 hover:border-muted-foreground/40 hover:bg-muted/40",
          disabled && "cursor-not-allowed opacity-50",
          dropzoneClassName
        )}
      >
        <Upload className={cn("text-muted-foreground", isCompact ? "h-5 w-5" : "h-8 w-8")} />
        <div className="text-center">
          <p className={cn("font-medium", isCompact ? "text-xs" : "text-sm")}>
            {isDragging ? "Drop files here" : "Drop files or click to upload"}
          </p>
          {!isCompact && (
            <p className="mt-1 text-xs text-muted-foreground">
              {hint ?? `${accept ? accept.replace(/,/g, ", ") : "Any file"} • Max ${formatBytes(maxSize)}`}
            </p>
          )}
        </div>
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          multiple={multiple}
          className="sr-only"
          disabled={disabled}
          onChange={(e) => processFiles(Array.from(e.target.files ?? []))}
          onClick={(e) => (e.currentTarget.value = "")}
        />
      </div>

      {files.length > 0 && (
        <ul className="space-y-2">
          {files.map((entry) => (
            <li
              key={entry.id}
              className={cn(
                "flex items-center gap-3 rounded-md border px-3 py-2 text-sm",
                entry.status === "error" && "border-destructive/30 bg-destructive/5",
                entry.status === "success" && "border-emerald-200 bg-emerald-50/50"
              )}
            >
              {entry.preview ? (
                <img
                  src={entry.preview}
                  alt={entry.file.name}
                  className="h-8 w-8 rounded object-cover flex-shrink-0"
                />
              ) : (
                <FileIcon type={entry.file.type} />
              )}

              <div className="flex-1 min-w-0">
                <p className="truncate text-xs font-medium">{entry.file.name}</p>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">{formatBytes(entry.file.size)}</span>
                  {entry.status === "error" && entry.error && (
                    <span className="text-xs text-destructive flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" />
                      {entry.error}
                    </span>
                  )}
                </div>
                {entry.status === "uploading" && (
                  <Progress value={entry.progress} className="mt-1 h-1" />
                )}
              </div>

              <div className="flex items-center gap-1 flex-shrink-0">
                {entry.status === "uploading" && (
                  <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                )}
                {entry.status === "success" && (
                  <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                )}
                {entry.status === "error" && (
                  <AlertCircle className="h-4 w-4 text-destructive" />
                )}
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  onClick={(e) => { e.stopPropagation(); handleRemove(entry.id) }}
                >
                  <X className="h-3.5 w-3.5" />
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}