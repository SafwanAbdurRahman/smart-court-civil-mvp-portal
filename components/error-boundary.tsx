"use client"

import { Component, type ReactNode } from "react"
import { Scale } from "lucide-react"

interface Props {
  children: ReactNode
  fallback?: ReactNode
}

interface State {
  hasError: boolean
  error?: Error
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, info: { componentStack: string }) {
    console.error("[ErrorBoundary] Caught unhandled error:", error)
    console.error("[ErrorBoundary] Component stack:", info.componentStack)
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback

      return (
        <div className="flex h-screen w-full items-center justify-center bg-background p-6">
          <div className="w-full max-w-md rounded-2xl border border-destructive/20 bg-destructive/5 p-8 text-center shadow-sm">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-destructive/10">
              <Scale className="h-6 w-6 text-destructive" />
            </div>
            <h2 className="text-lg font-semibold text-card-foreground">
              Something went wrong
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">
              An unexpected error occurred in the portal. Please refresh the
              page to try again. If the issue persists, contact support.
            </p>
            {this.state.error && (
              <p className="mt-3 rounded-lg bg-muted px-3 py-2 font-mono text-xs text-muted-foreground break-all">
                {this.state.error.message}
              </p>
            )}
            <button
              onClick={() => this.setState({ hasError: false, error: undefined })}
              className="mt-5 rounded-lg bg-primary px-5 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
            >
              Try again
            </button>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}
