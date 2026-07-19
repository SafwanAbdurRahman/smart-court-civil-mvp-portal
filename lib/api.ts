const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL?.replace(/\/$/, "") || ""

export class ApiError extends Error {
  status: number

  constructor(message: string, status: number) {
    super(message)
    this.name = "ApiError"
    this.status = status
  }
}

export function getBackendUrl() {
  return BACKEND_URL
}

const TOKEN_STORAGE_KEY = "smartcourt.token"

export function getStoredToken(): string | null {
  if (typeof window === "undefined") return null
  return window.localStorage.getItem(TOKEN_STORAGE_KEY)
}

export function setStoredToken(token: string | null) {
  if (typeof window === "undefined") return
  if (token) {
    window.localStorage.setItem(TOKEN_STORAGE_KEY, token)
  } else {
    window.localStorage.removeItem(TOKEN_STORAGE_KEY)
  }
}

interface RequestOptions extends RequestInit {
  timeoutMs?: number
  skipAuth?: boolean
}

/** Thin fetch wrapper: attaches the bearer token, enforces a timeout, and
 * normalizes backend error payloads into a single ApiError type. */
export async function apiFetch<T = unknown>(path: string, options: RequestOptions = {}): Promise<T> {
  if (!BACKEND_URL) {
    throw new ApiError("Backend URL is not configured. Set NEXT_PUBLIC_BACKEND_URL in your environment.", 0)
  }

  const { timeoutMs = 30000, skipAuth = false, headers, ...rest } = options
  const controller = new AbortController()
  const timeout = window.setTimeout(() => controller.abort(), timeoutMs)

  const finalHeaders: Record<string, string> = { ...(headers as Record<string, string>) }
  if (!skipAuth) {
    const token = getStoredToken()
    if (token) finalHeaders["Authorization"] = `Bearer ${token}`
  }

  try {
    const response = await fetch(`${BACKEND_URL}${path}`, {
      ...rest,
      headers: finalHeaders,
      signal: controller.signal,
    })

    if (!response.ok) {
      let detail = `Request failed with status ${response.status}`
      try {
        const body = await response.json()
        detail = body?.detail || body?.message || detail
      } catch {
        // response body wasn't JSON — fall back to the generic message
      }
      throw new ApiError(detail, response.status)
    }

    if (response.status === 204) return undefined as T
    return (await response.json()) as T
  } catch (error) {
    if (error instanceof ApiError) throw error
    if (error instanceof DOMException && error.name === "AbortError") {
      throw new ApiError("Request timed out. Please check your connection and try again.", 0)
    }
    throw new ApiError("Could not reach the backend server.", 0)
  } finally {
    window.clearTimeout(timeout)
  }
}

export async function apiFetchJson<T = unknown>(
  path: string,
  body: unknown,
  options: RequestOptions = {},
): Promise<T> {
  return apiFetch<T>(path, {
    ...options,
    method: options.method || "POST",
    headers: { "Content-Type": "application/json", ...(options.headers as Record<string, string>) },
    body: JSON.stringify(body),
  })
}
