"use client"

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react"
import { apiFetch, apiFetchJson, ApiError, getStoredToken, setStoredToken } from "./api"

export interface AuthUser {
  id: string
  email: string
  fullName: string | null
  createdAt: string
}

interface TokenResponse {
  access_token: string
  token_type: string
  user: AuthUser
}

interface AuthContextValue {
  user: AuthUser | null
  isLoading: boolean
  login: (email: string, password: string) => Promise<void>
  register: (email: string, password: string, fullName?: string) => Promise<void>
  logout: () => void
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const restoreSession = async () => {
      const token = getStoredToken()
      if (!token) {
        setIsLoading(false)
        return
      }

      try {
        const me = await apiFetch<AuthUser>("/auth/me")
        setUser(me)
      } catch {
        // Token expired or backend rejected it — clear it so we don't keep retrying.
        setStoredToken(null)
      } finally {
        setIsLoading(false)
      }
    }

    restoreSession()
  }, [])

  const login = useCallback(async (email: string, password: string) => {
    const result = await apiFetchJson<TokenResponse>("/auth/login-json", { email, password }, { skipAuth: true })
    setStoredToken(result.access_token)
    setUser(result.user)
  }, [])

  const register = useCallback(async (email: string, password: string, fullName?: string) => {
    const result = await apiFetchJson<TokenResponse>(
      "/auth/register",
      { email, password, full_name: fullName || null },
      { skipAuth: true },
    )
    setStoredToken(result.access_token)
    setUser(result.user)
  }, [])

  const logout = useCallback(() => {
    setStoredToken(null)
    setUser(null)
  }, [])

  const value = useMemo(() => ({ user, isLoading, login, register, logout }), [user, isLoading, login, register, logout])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error("useAuth must be used within an AuthProvider")
  return ctx
}

export { ApiError }
