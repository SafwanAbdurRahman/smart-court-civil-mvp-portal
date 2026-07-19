"use client"

import { useEffect, useState } from "react"
import {
  Paperclip,
  Send,
  CheckCircle2,
  FileText,
  Scale,
  Building2,
  User,
  MapPin,
  Hash,
  IndianRupee,
  BookOpen,
  History,
  MessageSquare,
  LogOut,
} from "lucide-react"
// Look one folder up, then into lib
import { getBackendUrl, getStoredToken } from "../lib/api"
import { useAuth } from "../lib/auth-context"

// Look directly in the current folder (components)
import { DocumentHistory, type HistoryDocument } from "./document-history"
import { LegalChat } from "./legal-chat"
const BACKEND_URL = getBackendUrl()

interface ExtractedCaseData {
  caseType: string | null
  jurisdiction: string | null
  tehsil: string | null
  plaintiff: string | null
  defendant: string | null
  plotNumbers: string | null
  valuation: string | null
  civilCode: string | null
}

const EMPTY_EXTRACTION: ExtractedCaseData = {
  caseType: null,
  jurisdiction: null,
  tehsil: null,
  plaintiff: null,
  defendant: null,
  plotNumbers: null,
  valuation: null,
  civilCode: null,
}

type Tab = "files" | "history" | "chat"

function Sidebar({
  activeTab,
  setActiveTab,
  userEmail,
  onLogout,
}: {
  activeTab: Tab
  setActiveTab: (tab: Tab) => void
  userEmail: string
  onLogout: () => void
}) {
  const navItems: { id: Tab; label: string; icon: typeof Scale }[] = [
    { id: "files", label: "Files", icon: Scale },
    { id: "history", label: "History", icon: History },
    { id: "chat", label: "Chat", icon: MessageSquare },
  ]

  return (
    <aside className="flex h-full w-16 flex-col items-center bg-sidebar py-4 md:w-20">
      <div className="mb-8 flex h-10 w-10 items-center justify-center rounded-lg bg-sidebar-primary">
        <Scale className="h-5 w-5 text-sidebar-primary-foreground" />
      </div>
      <nav className="flex flex-1 flex-col items-center gap-2">
        {navItems.map((item) => (
          <button
            key={item.id}
            onClick={() => setActiveTab(item.id)}
            className={`group flex h-12 w-12 flex-col items-center justify-center rounded-lg transition-colors ${
              activeTab === item.id
                ? "bg-sidebar-accent text-sidebar-accent-foreground"
                : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
            }`}
          >
            <item.icon className="h-5 w-5" />
            <span className="mt-1 text-[10px] font-medium">{item.label}</span>
          </button>
        ))}
      </nav>
      <button
        onClick={onLogout}
        title={`Log out (${userEmail})`}
        className="flex h-12 w-12 flex-col items-center justify-center rounded-lg text-sidebar-foreground/70 transition-colors hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
      >
        <LogOut className="h-5 w-5" />
        <span className="mt-1 text-[10px] font-medium">Logout</span>
      </button>
    </aside>
  )
}

function BotMessage({ content }: { content: string }) {
  return (
    <div className="flex gap-3">
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary">
        <Scale className="h-4 w-4 text-primary-foreground" />
      </div>
      <div className="max-w-[85%] rounded-2xl rounded-tl-sm bg-card px-4 py-3 shadow-sm">
        <p className="text-sm leading-relaxed text-card-foreground">{content}</p>
      </div>
    </div>
  )
}

function ExtractionResultMessage({ extractedData }: { extractedData: ExtractedCaseData }) {
  const dataFields = [
    { icon: Scale, label: "Case Type", value: extractedData.caseType },
    { icon: Building2, label: "Jurisdiction", value: extractedData.jurisdiction },
    { icon: MapPin, label: "Tehsil / Block", value: extractedData.tehsil },
    { icon: User, label: "Plaintiff Name", value: extractedData.plaintiff },
    { icon: User, label: "Defendant Name", value: extractedData.defendant },
    { icon: Hash, label: "Disputed Plot Numbers", value: extractedData.plotNumbers },
    { icon: IndianRupee, label: "Total Property Valuation", value: extractedData.valuation },
    { icon: BookOpen, label: "Recommended Civil Code Section", value: extractedData.civilCode },
  ]

  return (
    <div className="flex gap-3">
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary">
        <Scale className="h-4 w-4 text-primary-foreground" />
      </div>
      <div className="max-w-[90%] rounded-2xl rounded-tl-sm bg-card p-4 shadow-sm md:max-w-[85%]">
        <div className="mb-3 flex items-center gap-2">
          <div className="h-1.5 w-1.5 rounded-full bg-accent" />
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            AI Parameter Extraction Complete
          </p>
        </div>
        <div className="space-y-3">
          {dataFields.map((field, index) => (
            <div key={index} className="flex items-start gap-3 rounded-lg bg-muted/50 p-3">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-primary/10">
                <field.icon className="h-4 w-4 text-primary" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-medium text-muted-foreground">{field.label}</p>
                <p className="mt-0.5 text-sm font-semibold text-card-foreground">{field.value ?? "—"}</p>
              </div>
            </div>
          ))}
        </div>
        <div className="mt-4 rounded-lg border border-accent/30 bg-accent/10 p-3">
          <p className="text-xs text-accent">✓ Saved to your document history — ask about it anytime in Chat</p>
        </div>
      </div>
    </div>
  )
}

function ChatInput({
  onFileSelect,
  isLoading,
}: {
  onFileSelect: (file: File) => void
  isLoading: boolean
}) {
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      onFileSelect(e.target.files[0])
      e.target.value = ""
    }
  }

  return (
    <div className="border-t border-border bg-card p-4">
      <div className="flex items-center gap-3 rounded-xl bg-muted px-4 py-3">
        <input
          type="file"
          id="file-upload"
          accept=".jpg,.jpeg,.png,.pdf"
          className="hidden"
          onChange={handleFileChange}
          disabled={isLoading}
        />
        <label
          htmlFor="file-upload"
          className={`flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-background hover:text-foreground cursor-pointer ${
            isLoading ? "opacity-50 pointer-events-none" : ""
          }`}
        >
          <Paperclip className="h-5 w-5" />
        </label>
        <p className="flex-1 text-sm text-muted-foreground">
          {isLoading ? "Processing legal document live..." : "Click the paperclip to upload a civil case file"}
        </p>
        <Send className="h-4 w-4 text-muted-foreground/40" />
      </div>
    </div>
  )
}

export default function SmartCourtPortal() {
  const { user, logout } = useAuth()
  const [isLoading, setIsLoading] = useState(false)
  const [uploadedFileName, setUploadedFileName] = useState("")
  const [showResult, setShowResult] = useState(false)
  const [errorMessage, setErrorMessage] = useState("")
  const [backendStatus, setBackendStatus] = useState<"checking" | "ready" | "unavailable">("checking")
  const [activeTab, setActiveTab] = useState<Tab>("files")
  const [historyRefreshKey, setHistoryRefreshKey] = useState(0)
  const [activeDocument, setActiveDocument] = useState<HistoryDocument | null>(null)
  const [liveExtractedData, setLiveExtractedData] = useState<ExtractedCaseData>(EMPTY_EXTRACTION)

  useEffect(() => {
    const checkBackendHealth = async () => {
      if (!BACKEND_URL) {
        setBackendStatus("unavailable")
        return
      }
      try {
        // perform a simple fetch with timeout to check backend health
        const controller = new AbortController()
        const id = setTimeout(() => controller.abort(), 5000)
        await fetch(`${BACKEND_URL}/health`, { signal: controller.signal })
        clearTimeout(id)
        setBackendStatus("ready")
      } catch {
        setBackendStatus("unavailable")
      }
    }

    checkBackendHealth()
  }, [])

  const handleFileSelect = async (file: File) => {
    const MAX_FILE_SIZE_MB = 10
    if (file.size > MAX_FILE_SIZE_MB * 1024 * 1024) {
      setErrorMessage(`File too large. Maximum allowed size is ${MAX_FILE_SIZE_MB}MB.`)
      setShowResult(true)
      setUploadedFileName("")
      return
    }

    if (backendStatus !== "ready") {
      setErrorMessage("Backend is not reachable. Please verify the service is running and the configured URL is correct.")
      setShowResult(true)
      setUploadedFileName("")
      return
    }

    setIsLoading(true)
    setUploadedFileName(file.name)
    setShowResult(false)
    setErrorMessage("")

    const formData = new FormData()
    formData.append("file", file)

    const isPdf = file.name.toLowerCase().endsWith(".pdf")
    const endpoint = isPdf ? "/upload-pdf" : "/upload"

    try {
      const token = getStoredToken()
      const response = await fetch(`${BACKEND_URL}${endpoint}`, {
        method: "POST",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: formData,
      })

      if (response.ok) {
        const jsonResponse = await response.json()
        if (jsonResponse.status === "success") {
          const finalData: ExtractedCaseData = isPdf
            ? (jsonResponse.data?.metadata ?? jsonResponse.data)
            : jsonResponse.data

          setLiveExtractedData(finalData)
          setErrorMessage("")

          if (jsonResponse.documentId) {
            setActiveDocument({
              id: jsonResponse.documentId,
              filename: file.name,
              createdAt: new Date().toISOString(),
              ...finalData,
            })
          }
          setHistoryRefreshKey((k) => k + 1)
        } else {
          setErrorMessage(jsonResponse.message || "Failed to process the document parameters.")
        }
        setShowResult(true)
      } else if (response.status === 401) {
        setErrorMessage("Your session expired. Please log in again.")
        setShowResult(true)
        logout()
      } else {
        setErrorMessage(`Server error: ${response.status} - Failed to extract parameters.`)
        setShowResult(true)
      }
    } catch (error) {
      console.error("Backend pipeline data transmission failed:", error)
      setErrorMessage("Could not connect to the backend server. Please verify the server is running and NEXT_PUBLIC_BACKEND_URL is correct.")
      setShowResult(true)
    } finally {
      setIsLoading(false)
    }
  }

  const handleSelectHistoryDocument = (doc: HistoryDocument) => {
    setActiveDocument(doc)
    setActiveTab("chat")
  }

  return (
    <div className="flex h-screen w-full overflow-hidden">
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} userEmail={user?.email ?? ""} onLogout={logout} />

      {activeTab === "files" && (
        <div className="flex flex-1 flex-col bg-background">
          <header className="flex items-center gap-3 border-b border-border bg-card px-4 py-3 md:px-6">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary">
              <Scale className="h-5 w-5 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-base font-semibold text-card-foreground">SmartCourt Civil MVP Portal</h1>
              <p className="text-xs text-muted-foreground">
                {backendStatus === "ready"
                  ? "AI-Powered Civil Case Document Processing"
                  : backendStatus === "checking"
                    ? "Checking backend availability..."
                    : "Backend unavailable — configure NEXT_PUBLIC_BACKEND_URL"}
              </p>
            </div>
          </header>

          <div className="flex-1 space-y-6 overflow-y-auto p-4 md:p-6">
            <BotMessage content="Welcome to the SmartCourt Civil MVP Portal. Please click the paperclip icon to upload your English or Hindi Civil Case Document (.pdf / .jpg) to begin live parameter extraction." />

            {uploadedFileName && (
              <div className="flex justify-end">
                <div className="max-w-[85%] rounded-2xl rounded-tr-sm bg-primary px-4 py-3 shadow-sm">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary-foreground/10">
                      <FileText className="h-5 w-5 text-primary-foreground" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-primary-foreground">{uploadedFileName}</p>
                      <div className="mt-1 flex items-center gap-1.5">
                        <CheckCircle2 className="h-3.5 w-3.5 text-accent" />
                        <span className="text-xs text-accent">Uploaded Successfully</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {isLoading && (
              <div className="flex gap-3 animate-pulse">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary">
                  <Scale className="h-4 w-4 text-primary-foreground" />
                </div>
                <div className="max-w-[85%] rounded-2xl rounded-tl-sm bg-card px-4 py-3 shadow-sm">
                  <p className="text-sm text-card-foreground italic">Running live bilingual OCR extraction engine...</p>
                </div>
              </div>
            )}

            {showResult && !isLoading && !errorMessage && <ExtractionResultMessage extractedData={liveExtractedData} />}

            {errorMessage && (
              <div className="flex gap-3">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-destructive">
                  <Scale className="h-4 w-4 text-destructive-foreground" />
                </div>
                <div className="max-w-[85%] rounded-2xl rounded-tl-sm bg-destructive/10 border border-destructive/20 p-4 shadow-sm">
                  <p className="text-sm font-semibold text-destructive">Extraction Failed</p>
                  <p className="mt-1 text-xs text-muted-foreground">{errorMessage}</p>
                </div>
              </div>
            )}
          </div>

          <ChatInput onFileSelect={handleFileSelect} isLoading={isLoading} />
        </div>
      )}

      {activeTab === "history" && (
        <div className="flex flex-1 flex-col bg-background">
          <header className="flex items-center gap-3 border-b border-border bg-card px-4 py-3 md:px-6">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary">
              <History className="h-5 w-5 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-base font-semibold text-card-foreground">Document History</h1>
              <p className="text-xs text-muted-foreground">Every document you've extracted, saved to your account</p>
            </div>
          </header>
          <DocumentHistory onSelectDocument={handleSelectHistoryDocument} refreshKey={historyRefreshKey} />
        </div>
      )}

      {activeTab === "chat" && <LegalChat activeDocument={activeDocument} />}
    </div>
  )
}
