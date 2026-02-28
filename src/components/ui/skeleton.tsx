import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

// ── Base skeleton pulse ───────────────────────────────────────────────────────

const skeletonVariants = cva(
  "animate-pulse rounded-md bg-muted",
  {
    variants: {
      variant: {
        default: "bg-muted",
        subtle:  "bg-muted/50",
        strong:  "bg-muted-foreground/20",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

export interface SkeletonProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof skeletonVariants> {}

function Skeleton({ className, variant, ...props }: SkeletonProps) {
  return (
    <div
      className={cn(skeletonVariants({ variant }), className)}
      {...props}
    />
  )
}

// ── Composite skeletons for Lomash Wood admin screens ────────────────────────

/** Single table row — matches the dense row height used across all admin tables */
function SkeletonTableRow({
  columns = 5,
  className,
}: {
  columns?: number
  className?: string
}) {
  return (
    <div className={cn("flex items-center gap-4 px-4 py-3 border-b last:border-0", className)}>
      {Array.from({ length: columns }).map((_, i) => (
        <Skeleton
          key={i}
          className="h-4"
          style={{ width: `${55 + ((i * 37) % 40)}%`, flexShrink: 0 }}
        />
      ))}
    </div>
  )
}

/** Full table skeleton with header + N body rows */
function SkeletonTable({
  rows = 8,
  columns = 5,
  className,
}: {
  rows?: number
  columns?: number
  className?: string
}) {
  return (
    <div className={cn("rounded-md border bg-white overflow-hidden", className)}>
      {/* Header */}
      <div className="flex items-center gap-4 px-4 py-3 bg-muted/30 border-b">
        {Array.from({ length: columns }).map((_, i) => (
          <Skeleton key={i} className="h-3 bg-muted-foreground/15" style={{ width: `${40 + ((i * 23) % 30)}%` }} />
        ))}
      </div>
      {/* Rows */}
      {Array.from({ length: rows }).map((_, i) => (
        <SkeletonTableRow key={i} columns={columns} />
      ))}
    </div>
  )
}

/** Stats card — used on the overview dashboard */
function SkeletonStatsCard({ className }: { className?: string }) {
  return (
    <div className={cn("rounded-xl border bg-white p-6 space-y-3", className)}>
      <div className="flex items-center justify-between">
        <Skeleton className="h-3.5 w-24" />
        <Skeleton className="h-8 w-8 rounded-lg" />
      </div>
      <Skeleton className="h-7 w-32" />
      <Skeleton className="h-3 w-20" />
    </div>
  )
}

/** Product / content card — used in grid listings */
function SkeletonCard({ className }: { className?: string }) {
  return (
    <div className={cn("rounded-xl border bg-white overflow-hidden", className)}>
      <Skeleton className="h-48 w-full rounded-none" />
      <div className="p-4 space-y-2.5">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-3 w-full" />
        <Skeleton className="h-3 w-5/6" />
        <div className="flex items-center justify-between pt-1">
          <Skeleton className="h-5 w-16 rounded-full" />
          <Skeleton className="h-8 w-24 rounded-md" />
        </div>
      </div>
    </div>
  )
}

/** Detail page — two-column layout with sidebar */
function SkeletonDetailPage({ className }: { className?: string }) {
  return (
    <div className={cn("space-y-6", className)}>
      {/* Back button */}
      <Skeleton className="h-8 w-28" />
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Main content */}
        <div className="lg:col-span-2 space-y-4">
          <div className="rounded-xl border bg-white p-6 space-y-4">
            <div className="flex items-center gap-3">
              <Skeleton className="h-12 w-12 rounded-full" />
              <div className="space-y-2 flex-1">
                <Skeleton className="h-5 w-48" />
                <Skeleton className="h-3.5 w-32" />
              </div>
              <Skeleton className="h-6 w-20 rounded-full" />
            </div>
            <Skeleton className="h-px w-full" />
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex justify-between items-center">
                <Skeleton className="h-3.5 w-24" />
                <Skeleton className="h-3.5 w-36" />
              </div>
            ))}
          </div>
          <div className="rounded-xl border bg-white p-6 space-y-3">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-24 w-full" />
          </div>
        </div>
        {/* Sidebar */}
        <div className="space-y-4">
          <div className="rounded-xl border bg-white p-5 space-y-3">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-px w-full" />
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="flex justify-between">
                <Skeleton className="h-3.5 w-20" />
                <Skeleton className="h-3.5 w-24" />
              </div>
            ))}
          </div>
          <div className="rounded-xl border bg-white p-5 space-y-3">
            <Skeleton className="h-4 w-28" />
            <Skeleton className="h-8 w-full rounded-md" />
            <Skeleton className="h-8 w-full rounded-md" />
          </div>
        </div>
      </div>
    </div>
  )
}

/** Form page skeleton — matches the section-card layout used across all admin forms */
function SkeletonForm({
  sections = 3,
  fieldsPerSection = 4,
  className,
}: {
  sections?: number
  fieldsPerSection?: number
  className?: string
}) {
  return (
    <div className={cn("space-y-6", className)}>
      <Skeleton className="h-8 w-28" />
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-4">
          {Array.from({ length: sections }).map((_, s) => (
            <div key={s} className="rounded-xl border bg-white p-6 space-y-4">
              <div className="flex items-center gap-2">
                <Skeleton className="h-4 w-4 rounded" />
                <Skeleton className="h-4 w-36" />
              </div>
              <Skeleton className="h-px w-full" />
              <div className="grid grid-cols-2 gap-4">
                {Array.from({ length: fieldsPerSection }).map((_, f) => (
                  <div key={f} className={cn("space-y-2", f % 3 === 0 ? "col-span-2" : "")}>
                    <Skeleton className="h-3.5 w-24" />
                    <Skeleton className="h-9 w-full rounded-md" />
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
        {/* Sidebar */}
        <div className="space-y-4">
          <div className="rounded-xl border bg-white p-5 space-y-4">
            <Skeleton className="h-3.5 w-28" />
            <Skeleton className="h-px w-full" />
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="flex items-center justify-between">
                <div className="space-y-1.5">
                  <Skeleton className="h-3.5 w-24" />
                  <Skeleton className="h-3 w-36" />
                </div>
                <Skeleton className="h-5 w-9 rounded-full" />
              </div>
            ))}
          </div>
          <Skeleton className="h-9 w-full rounded-md" />
        </div>
      </div>
    </div>
  )
}

/** Appointment calendar skeleton */
function SkeletonCalendar({ className }: { className?: string }) {
  const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]
  return (
    <div className={cn("rounded-xl border bg-white p-4 space-y-3", className)}>
      {/* Header */}
      <div className="flex items-center justify-between pb-1">
        <Skeleton className="h-5 w-32" />
        <div className="flex gap-1">
          <Skeleton className="h-7 w-7 rounded-md" />
          <Skeleton className="h-7 w-7 rounded-md" />
        </div>
      </div>
      {/* Day labels */}
      <div className="grid grid-cols-7 gap-1">
        {days.map((d) => (
          <Skeleton key={d} className="h-3 mx-auto w-6" />
        ))}
      </div>
      {/* Calendar cells */}
      {Array.from({ length: 5 }).map((_, week) => (
        <div key={week} className="grid grid-cols-7 gap-1">
          {Array.from({ length: 7 }).map((_, day) => (
            <Skeleton
              key={day}
              className={cn(
                "h-9 rounded-md",
                (week === 0 && day < 2) || (week === 4 && day > 4) ? "opacity-30" : ""
              )}
            />
          ))}
        </div>
      ))}
    </div>
  )
}

/** Notification / activity feed item */
function SkeletonFeedItem({ className }: { className?: string }) {
  return (
    <div className={cn("flex items-start gap-3 py-3", className)}>
      <Skeleton className="h-8 w-8 rounded-full flex-shrink-0" />
      <div className="flex-1 space-y-1.5">
        <Skeleton className="h-3.5 w-3/4" />
        <Skeleton className="h-3 w-1/2" />
      </div>
      <Skeleton className="h-3 w-12 flex-shrink-0" />
    </div>
  )
}

/** Page header with title, description and action buttons */
function SkeletonPageHeader({ className }: { className?: string }) {
  return (
    <div className={cn("flex items-start justify-between", className)}>
      <div className="space-y-2">
        <Skeleton className="h-7 w-48" />
        <Skeleton className="h-4 w-72" />
      </div>
      <div className="flex gap-2">
        <Skeleton className="h-9 w-24 rounded-md" />
        <Skeleton className="h-9 w-28 rounded-md" />
      </div>
    </div>
  )
}

/** Chart / analytics card */
function SkeletonChart({ className }: { className?: string }) {
  return (
    <div className={cn("rounded-xl border bg-white p-6 space-y-4", className)}>
      <div className="flex items-center justify-between">
        <div className="space-y-1.5">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-3 w-24" />
        </div>
        <Skeleton className="h-8 w-28 rounded-md" />
      </div>
      {/* Y-axis labels + bars */}
      <div className="flex gap-3 items-end h-40 pt-2">
        <div className="flex flex-col justify-between h-full py-1">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-2.5 w-8" />
          ))}
        </div>
        <div className="flex-1 flex items-end gap-1.5 h-full">
          {Array.from({ length: 12 }).map((_, i) => (
            <Skeleton
              key={i}
              className="flex-1 rounded-t-sm"
              style={{ height: `${25 + ((i * 17 + 43) % 75)}%` }}
            />
          ))}
        </div>
      </div>
      {/* X-axis labels */}
      <div className="flex justify-between ml-11">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-2.5 w-8" />
        ))}
      </div>
    </div>
  )
}

export {
  Skeleton,
  SkeletonTableRow,
  SkeletonTable,
  SkeletonStatsCard,
  SkeletonCard,
  SkeletonDetailPage,
  SkeletonForm,
  SkeletonCalendar,
  SkeletonFeedItem,
  SkeletonPageHeader,
  SkeletonChart,
}