"use client"

import { useEffect, type ReactNode } from "react"
import { useRouter } from "next/navigation"
import { Scale } from "lucide-react"
import { useAuth } from "../lib/auth-context"

export function ProtectedRoute({ children }: { children: ReactNode }) {
  const { user, isLoading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!isLoading && !user) {
      router.replace("/login")
    }
  }, [isLoading, user, router])

  if (isLoading || !user) {
    return (
      <div className="flex h-screen w-full flex-col items-center justify-center gap-3 bg-background">
        <div className="flex h-12 w-12 animate-pulse items-center justify-center rounded-xl bg-primary">
          <Scale className="h-6 w-6 text-primary-foreground" />
        </div>
        <p className="text-sm text-muted-foreground">Loading your session...</p>
      </div>
    )
  }

  return <>{children}</>
}
