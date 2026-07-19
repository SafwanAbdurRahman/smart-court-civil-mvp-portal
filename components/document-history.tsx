"use client"

import { useEffect, useState } from "react"
import { FileClock, Scale } from "lucide-react"
import { apiFetch, ApiError } from "../lib/api"

export interface HistoryDocument {
  id: string
  filename: string
  caseType: string | null
  jurisdiction: string | null
  tehsil: string | null
  plaintiff: string | null
  defendant: string | null
  plotNumbers: string | null
  valuation: string | null
  civilCode: string | null
  createdAt: string
}

export function DocumentHistory({
  onSelectDocument,
  refreshKey,
}: {
  onSelectDocument: (doc: HistoryDocument) => void
  refreshKey: number
}) {
  const [documents, setDocuments] = useState<HistoryDocument[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState("")

  useEffect(() => {
    let cancelled = false

    const loadHistory = async () => {
      setIsLoading(true)
      setErrorMessage("")
      try {
        const data = await apiFetch<HistoryDocument[]>("/api/documents")
        if (!cancelled) setDocuments(data)
      } catch (error) {
        if (!cancelled) {
          setErrorMessage(error instanceof ApiError ? error.message : "Could not load your document history.")
        }
      } finally {
        if (!cancelled) setIsLoading(false)
      }
    }

    loadHistory()
    return () => {
      cancelled = true
    }
  }, [refreshKey])

  if (isLoading) {
    return <p className="p-6 text-sm text-muted-foreground">Loading your document history...</p>
  }

  if (errorMessage) {
    return <p className="p-6 text-sm text-destructive">{errorMessage}</p>
  }

  if (documents.length === 0) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-2 p-6 text-center">
        <FileClock className="h-8 w-8 text-muted-foreground" />
        <p className="text-sm font-medium text-foreground">No documents yet</p>
        <p className="text-xs text-muted-foreground">
          Upload a civil case file from the Files tab and it will show up here automatically.
        </p>
      </div>
    )
  }

  return (
    <div className="flex-1 space-y-3 overflow-y-auto p-4 md:p-6">
      {documents.map((doc) => (
        <button
          key={doc.id}
          onClick={() => onSelectDocument(doc)}
          className="flex w-full items-start gap-3 rounded-xl border border-border bg-card p-4 text-left shadow-sm transition-colors hover:border-primary/40 hover:bg-muted/40"
        >
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10">
            <Scale className="h-4 w-4 text-primary" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-card-foreground">{doc.filename}</p>
            <p className="mt-0.5 truncate text-xs text-muted-foreground">
              {doc.caseType || "Case type not extracted"} · {doc.plaintiff || "Unknown plaintiff"} vs{" "}
              {doc.defendant || "Unknown defendant"}
            </p>
            <p className="mt-1 text-[11px] text-muted-foreground/70">
              {new Date(doc.createdAt).toLocaleString()}
            </p>
          </div>
        </button>
      ))}
    </div>
  )
}
