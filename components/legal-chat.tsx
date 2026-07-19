"use client"

import { useEffect, useRef, useState } from "react"
import { Scale, Send } from "lucide-react"
import { apiFetch, apiFetchJson, ApiError } from "../lib/api"

interface DisplayMessage {
  role: "user" | "assistant"
  content: string
}

interface ChatMessageRecord {
  id: string
  role: string
  content: string
  createdAt: string
}

export function LegalChat({ activeDocument }: { activeDocument: { id: string; filename: string } | null }) {
  const [messages, setMessages] = useState<DisplayMessage[]>([
    {
      role: "assistant",
      content: activeDocument
        ? `Ask me anything about ${activeDocument.filename} — jurisdiction, plot details, applicable civil code sections, or next steps.`
        : "Select a document from the Files or History tab, or just ask a general civil-law question below.",
    },
  ])
  const [input, setInput] = useState("")
  const [isSending, setIsSending] = useState(false)
  const [isLoadingHistory, setIsLoadingHistory] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!activeDocument) return

    let cancelled = false
    const loadHistory = async () => {
      setIsLoadingHistory(true)
      try {
        const records = await apiFetch<ChatMessageRecord[]>(`/api/chat/${activeDocument.id}`)
        if (cancelled) return
        if (records.length > 0) {
          setMessages(records.map((r) => ({ role: r.role === "user" ? "user" : "assistant", content: r.content })))
        } else {
          setMessages([
            {
              role: "assistant",
              content: `Ask me anything about ${activeDocument.filename} — jurisdiction, plot details, applicable civil code sections, or next steps.`,
            },
          ])
        }
      } catch {
        // Non-fatal — the user can just start chatting fresh.
      } finally {
        if (!cancelled) setIsLoadingHistory(false)
      }
    }

    loadHistory()
    return () => {
      cancelled = true
    }
  }, [activeDocument])

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" })
  }, [messages])

  const handleSend = async () => {
    const trimmed = input.trim()
    if (!trimmed || isSending) return

    setInput("")
    setMessages((prev) => [...prev, { role: "user", content: trimmed }])
    setIsSending(true)

    try {
      const response = await apiFetchJson<{ reply: string }>("/api/chat", {
        message: trimmed,
        documentId: activeDocument?.id ?? null,
      })
      setMessages((prev) => [...prev, { role: "assistant", content: response.reply }])
    } catch (error) {
      const message = error instanceof ApiError ? error.message : "Lost connection to the legal analysis server."
      setMessages((prev) => [...prev, { role: "assistant", content: message }])
    } finally {
      setIsSending(false)
    }
  }

  return (
    <div className="flex flex-1 flex-col bg-background h-screen">
      <div className="border-b border-border p-4 bg-card">
        <h2 className="text-xl font-bold text-card-foreground">SmartCourt AI Chat Assistant</h2>
        <p className="text-xs text-muted-foreground">
          {activeDocument
            ? `Discussing: ${activeDocument.filename}`
            : "Ask legal questions or analyze extracted document structures live."}
        </p>
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4">
        {isLoadingHistory && <p className="text-xs text-muted-foreground">Loading conversation...</p>}
        {messages.map((msg, idx) => (
          <div key={idx} className={`flex w-full ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
            {msg.role === "assistant" && (
              <div className="mr-2 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary">
                <Scale className="h-4 w-4 text-primary-foreground" />
              </div>
            )}
            <div
              className={`max-w-[75%] rounded-lg px-4 py-2.5 text-sm ${
                msg.role === "user"
                  ? "bg-primary text-primary-foreground rounded-tr-none"
                  : "bg-muted text-foreground rounded-tl-none border border-border"
              }`}
            >
              {msg.content}
            </div>
          </div>
        ))}
        {isSending && (
          <div className="flex w-full justify-start">
            <div className="mr-2 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary">
              <Scale className="h-4 w-4 text-primary-foreground" />
            </div>
            <div className="max-w-[75%] rounded-lg rounded-tl-none border border-border bg-muted px-4 py-2.5 text-sm italic text-muted-foreground">
              Thinking...
            </div>
          </div>
        )}
      </div>

      <div className="border-t border-border p-4 bg-card">
        <div className="mx-auto flex max-w-3xl gap-2">
          <input
            type="text"
            placeholder="Ask about jurisdiction, plot rules, or legal citations..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSend()}
            disabled={isSending}
            className="h-10 flex-1 rounded-md border border-input bg-background px-3 text-sm text-foreground outline-none focus:ring-1 focus:ring-primary disabled:opacity-60"
          />
          <button
            onClick={handleSend}
            disabled={isSending || !input.trim()}
            className="flex h-10 items-center gap-1.5 rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Send className="h-3.5 w-3.5" />
            Send
          </button>
        </div>
      </div>
    </div>
  )
}
