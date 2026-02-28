"use client"

import * as React from "react"
import { AlertTriangle, RefreshCw, Home } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface ErrorBoundaryState {
  hasError: boolean
  error: Error | null
  errorInfo: React.ErrorInfo | null
}

interface ErrorBoundaryProps {
  children: React.ReactNode
  fallback?: React.ReactNode
  onError?: (error: Error, info: React.ErrorInfo) => void
  onReset?: () => void
  resetKeys?: unknown[]
  className?: string
}

export class ErrorBoundary extends React.Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state = { hasError: false, error: null, errorInfo: null }
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    this.setState({ errorInfo: info })
    this.props.onError?.(error, info)
  }

  componentDidUpdate(prevProps: ErrorBoundaryProps) {
    if (
      this.state.hasError &&
      prevProps.resetKeys !== this.props.resetKeys
    ) {
      this.reset()
    }
  }

  reset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null })
    this.props.onReset?.()
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback

      return (
        <ErrorFallback
          error={this.state.error}
          onReset={this.reset}
          className={this.props.className}
        />
      )
    }

    return this.props.children
  }
}

interface ErrorFallbackProps {
  error?: Error | null
  onReset?: () => void
  className?: string
  variant?: "page" | "section" | "inline"
}

export function ErrorFallback({
  error,
  onReset,
  className,
  variant = "section",
}: ErrorFallbackProps) {
  const isPage = variant === "page"
  const isInline = variant === "inline"

  if (isInline) {
    return (
      <div className={cn("flex items-center gap-2 text-sm text-destructive", className)}>
        <AlertTriangle className="h-4 w-4 flex-shrink-0" />
        <span>{error?.message ?? "Something went wrong"}</span>
        {onReset && (
          <button
            onClick={onReset}
            className="underline underline-offset-2 hover:no-underline ml-1"
          >
            Retry
          </button>
        )}
      </div>
    )
  }

  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-4 text-center",
        isPage ? "min-h-[60vh] px-4" : "py-16 px-6",
        className
      )}
    >
      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-destructive/10">
        <AlertTriangle className="h-7 w-7 text-destructive" />
      </div>

      <div className="space-y-1.5 max-w-sm">
        <h3 className={cn("font-semibold", isPage ? "text-xl" : "text-base")}>
          Something went wrong
        </h3>
        {error?.message && (
          <p className="text-sm text-muted-foreground">{error.message}</p>
        )}
      </div>

      <div className="flex items-center gap-2">
        {onReset && (
          <Button variant="outline" size="sm" onClick={onReset}>
            <RefreshCw className="h-4 w-4 mr-1.5" />
            Try again
          </Button>
        )}
        {isPage && (
          <Button variant="ghost" size="sm" onClick={() => window.location.href = "/"}>
            <Home className="h-4 w-4 mr-1.5" />
            Go home
          </Button>
        )}
      </div>

      {process.env.NODE_ENV === "development" && error?.stack && (
        <details className="mt-2 w-full max-w-xl text-left">
          <summary className="cursor-pointer text-xs text-muted-foreground hover:text-foreground">
            Stack trace
          </summary>
          <pre className="mt-2 overflow-x-auto rounded-md bg-muted p-3 text-xs text-muted-foreground whitespace-pre-wrap">
            {error.stack}
          </pre>
        </details>
      )}
    </div>
  )
}

export function withErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  options?: Omit<ErrorBoundaryProps, "children">
) {
  const Wrapped = (props: P) => (
    <ErrorBoundary {...options}>
      <Component {...props} />
    </ErrorBoundary>
  )
  Wrapped.displayName = `withErrorBoundary(${Component.displayName ?? Component.name})`
  return Wrapped
}