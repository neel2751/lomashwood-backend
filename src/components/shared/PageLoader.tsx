"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
import { Skeleton } from "@/components/ui/skeleton"

interface PageLoaderProps {
  variant?: "spinner" | "skeleton" | "bar"
  label?: string
  className?: string
}

export function PageLoader({
  variant = "spinner",
  label,
  className,
}: PageLoaderProps) {
  if (variant === "bar") {
    return <LoadingBar className={className} />
  }

  if (variant === "skeleton") {
    return <PageSkeleton className={className} />
  }

  return (
    <div
      className={cn(
        "flex min-h-[50vh] flex-col items-center justify-center gap-3",
        className
      )}
      role="status"
      aria-label={label ?? "Loading"}
    >
      <div className="relative h-10 w-10">
        <div className="absolute inset-0 rounded-full border-4 border-muted" />
        <div className="absolute inset-0 rounded-full border-4 border-primary border-t-transparent animate-spin" />
      </div>
      {label && (
        <p className="text-sm text-muted-foreground animate-pulse">{label}</p>
      )}
    </div>
  )
}

function LoadingBar({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "fixed inset-x-0 top-0 z-50 h-1 bg-muted overflow-hidden",
        className
      )}
      role="progressbar"
      aria-label="Loading"
    >
      <div className="h-full w-1/3 bg-primary rounded-full animate-[loading-bar_1.4s_ease-in-out_infinite]" />
    </div>
  )
}

function PageSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn("space-y-6 p-6", className)}>
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <Skeleton className="h-7 w-48" />
          <Skeleton className="h-4 w-72" />
        </div>
        <div className="flex gap-2">
          <Skeleton className="h-9 w-24 rounded-md" />
          <Skeleton className="h-9 w-28 rounded-md" />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="rounded-xl border bg-white p-5 space-y-3">
            <div className="flex items-center justify-between">
              <Skeleton className="h-3.5 w-20" />
              <Skeleton className="h-8 w-8 rounded-lg" />
            </div>
            <Skeleton className="h-7 w-28" />
            <Skeleton className="h-3 w-16" />
          </div>
        ))}
      </div>

      <div className="rounded-md border bg-white overflow-hidden">
        <div className="flex items-center gap-4 px-4 py-3 bg-muted/30 border-b">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-3 w-20" />
          ))}
        </div>
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="flex items-center gap-4 px-4 py-3 border-b last:border-0">
            {Array.from({ length: 5 }).map((__, j) => (
              <Skeleton
                key={j}
                className="h-4"
                style={{ width: `${40 + ((i * 11 + j * 7) % 50)}%` }}
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}