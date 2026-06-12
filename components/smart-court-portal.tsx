"use client"

import { useState } from "react"
import {
  MessageSquare,
  FolderOpen,
  Clock,
  Settings,
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
} from "lucide-react"

interface Message {
  id: number
  type: "bot" | "user"
  content: string
  isDocument?: boolean
  isExtraction?: boolean
}

const extractedData = {
  caseType: "Civil Land Dispute",
  jurisdiction: "District Court, Barabanki",
  tehsil: "Nawabganj",
  plaintiff: "Ram Chander",
  defendant: "State of Uttar Pradesh",
  plotNumbers: "142, 143/A",
  valuation: "₹4,50,000 INR",
  civilCode: "Section 9 (CPC) - Suits of Civil Nature",
}

const navItems = [
  { icon: MessageSquare, label: "Chat", active: true },
  { icon: FolderOpen, label: "Files", active: false },
  { icon: Clock, label: "History", active: false },
  { icon: Settings, label: "Settings", active: false },
]

function Sidebar({ 
  activeTab, 
  setActiveTab 
}: { 
  activeTab: "files" | "chat"; 
  setActiveTab: (tab: "files" | "chat") => void; 
}) {
  // Update your tracking array right inside the function to use live state strings
  const navItems = [
    { id: "files", label: "Files", icon: Scale, active: activeTab === "files" },
    { id: "chat", label: "Chat", icon: MessageSquare, active: activeTab === "chat" } 
  ];

  return (
    <aside className="flex h-full w-16 flex-col items-center bg-sidebar py-4 md:w-20">
      <div className="mb-8 flex h-10 w-10 items-center justify-center rounded-lg bg-sidebar-primary">
        <Scale className="h-5 w-5 text-sidebar-primary-foreground" />
      </div>
      <nav className="flex flex-1 flex-col items-center gap-2">
        {navItems.map((item) => (
          <button
            key={item.id}
            onClick={() => setActiveTab(item.id as "files" | "chat")} // <-- Wires up the click handler live!
            className={`group flex h-12 w-12 flex-col items-center justify-center rounded-lg transition-colors ${
              item.active
                ? "bg-sidebar-accent text-sidebar-accent-foreground"
                : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
            }`}
          >
            <item.icon className="h-5 w-5" />
            <span className="mt-1 text-[10px] font-medium">{item.label}</span>
          </button>
        ))}
      </nav>
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

function UserDocumentMessage() {
  return (
    <div className="flex justify-end">
      <div className="max-w-[85%] rounded-2xl rounded-tr-sm bg-primary px-4 py-3 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary-foreground/10">
            <FileText className="h-5 w-5 text-primary-foreground" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium text-primary-foreground">
              Civil_Suit_94_2026.pdf
            </p>
            <div className="mt-1 flex items-center gap-1.5">
              <CheckCircle2 className="h-3.5 w-3.5 text-accent" />
              <span className="text-xs text-accent">Uploaded Successfully</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function ExtractionResultMessage({ extractedData }: { extractedData: any }) {
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
            <div
              key={index}
              className="flex items-start gap-3 rounded-lg bg-muted/50 p-3"
            >
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-primary/10">
                <field.icon className="h-4 w-4 text-primary" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-medium text-muted-foreground">
                  {field.label}
                </p>
                <p className="mt-0.5 text-sm font-semibold text-card-foreground">
                  {field.value}
                </p>
              </div>
            </div>
          ))}
        </div>
        <div className="mt-4 rounded-lg border border-accent/30 bg-accent/10 p-3">
          <p className="text-xs text-accent">
            ✓ All parameters extracted and logged to database successfully
          </p>
        </div>
      </div>
    </div>
  )
}

function ChatInput({ onFileSelect, isLoading }: { onFileSelect: (file: File) => void; isLoading: boolean }) {
  const [message, setMessage] = useState("")

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      onFileSelect(e.target.files[0])
    }
  }

  return (
    <div className="border-t border-border bg-card p-4">
      <div className="flex items-center gap-3 rounded-xl bg-muted px-4 py-3">
        {/* Hidden native input element */}
        <input
          type="file"
          id="file-upload"
          accept=".jpg,.jpeg,.png,.pdf"
          className="hidden"
          onChange={handleFileChange}
          disabled={isLoading}
        />
        {/* Paperclip acts as a click trigger for the hidden input */}
        <label
          htmlFor="file-upload"
          className={`flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-background hover:text-foreground cursor-pointer ${
            isLoading ? "opacity-50 pointer-events-none" : ""
          }`}
        >
          <Paperclip className="h-5 w-5" />
        </label>
        <input
          type="text"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder={isLoading ? "Processing legal document live..." : "Type a message or click paperclip to upload..."}
          className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground focus:outline-none"
          disabled={isLoading}
        />
        <button
          type="button"
          className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground transition-colors hover:bg-primary/90"
        >
          <Send className="h-4 w-4" />
        </button>
      </div>
    </div>
  )
}

function ChatPanel({
  onFileSelect,
  isLoading,
  uploadedFileName,
  showResult,
  extractedData, 
}: {
  onFileSelect: (file: File) => void;
  isLoading: boolean;
  uploadedFileName: string;
  showResult: boolean;
  extractedData: any; 
}) {
  return (
    <div className="flex flex-1 flex-col bg-background">
      {/* Header */}
      <header className="flex items-center gap-3 border-b border-border bg-card px-4 py-3 md:px-6">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary">
          <Scale className="h-5 w-5 text-primary-foreground" />
        </div>
        <div>
          <h1 className="text-base font-semibold text-card-foreground">
            SmartCourt Civil MVP Portal
          </h1>
          <p className="text-xs text-muted-foreground">
            AI-Powered Civil Case Document Processing
          </p>
        </div>
      </header>

      {/* Messages Window */}
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
                  <p className="text-sm font-medium text-primary-foreground">
                    {uploadedFileName}
                  </p>
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

        {showResult && !isLoading && <ExtractionResultMessage extractedData={extractedData}/>}
      </div>

      {/* Input section passing triggers back up */}
      <ChatInput onFileSelect={onFileSelect} isLoading={isLoading} />
    </div>
  )
}

export default function SmartCourtPortal() {
  const [isLoading, setIsLoading] = useState(false);
  const [uploadedFileName, setUploadedFileName] = useState("");
  const [showResult, setShowResult] = useState(false);
  const [activeTab, setActiveTab] = useState<"files" | "chat">("files");
  const [chatMessages, setChatMessages] = useState<Array<{ sender: "user" | "ai"; text: string }>>([
    { sender: "ai", text: "Hello! I am your SmartCourt Legal Assistant. Ask me anything about the uploaded court documents, case history, or legal provisions." }
  ]);
  const [chatInput, setChatInput] = useState("");

  const handleSendMessage = async () => {
    if (!chatInput.trim()) return;

    const userMessage = { sender: "user" as const, text: chatInput };
    const updatedMessages = [...chatMessages, userMessage];
    setChatMessages(updatedMessages);
    
    const queryText = chatInput;
    setChatInput("");

    setChatMessages([
      ...updatedMessages,
      { sender: "ai" as const, text: "Thinking... 🧠" }
    ]);

    try {
      const response = await fetch("https://fondling-police-gotten.ngrok-free.dev/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: queryText,
          context: liveExtractedData
        })
      });

      const data = await response.json();
      
      setChatMessages([
        ...updatedMessages,
        { sender: "ai" as const, text: data.reply }
      ]);
    } catch (error) {
      console.error("Chat routing connection failed:", error);
      setChatMessages([
        ...updatedMessages,
        { sender: "ai" as const, text: "Lost connection to the legal analysis server. Please check your Colab tunnel." }
      ]);
    }
  };

  const [liveExtractedData, setLiveExtractedData] = useState<any>({
    caseType: "",
    jurisdiction: "",
    tehsil: "",
    plaintiff: "",
    defendant: "",
    plotNumbers: "",
    valuation: "",
    civilCode: ""
  });
  const handleFileSelect = async (file: File) => {
    setIsLoading(true)
    setUploadedFileName(file.name)
    setShowResult(false)

    const formData = new FormData()
    formData.append("file", file)

    try {
      const response = await fetch("https://fondling-police-gotten.ngrok-free.dev/upload", {
        method: "POST",
        body: formData,
      })

      if (response.ok) {
        const jsonResponse = await response.json()
        if (jsonResponse.status === "success") {
          setLiveExtractedData(jsonResponse.data)
        }
        setShowResult(true)
      }
    } catch (error) {
      console.error("Backend pipeline data transmission failed:", error)
      setShowResult(true)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex h-screen w-full overflow-hidden">
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />
      
      {/* 1. Files View Conditional Block */}
      {activeTab === "files" && (
        <ChatPanel 
          onFileSelect={handleFileSelect} 
          isLoading={isLoading} 
          uploadedFileName={uploadedFileName} 
          showResult={showResult} 
          extractedData={liveExtractedData} 
        />
      )}

      {/* 2. Chat View Conditional Block */}
      {activeTab === "chat" && (
        <div className="flex flex-1 flex-col bg-background h-screen">
          {/* Header Title Bar */}
          <div className="border-b border-border p-4 bg-card">
            <h2 className="text-xl font-bold text-card-foreground">SmartCourt AI Chat Assistant</h2>
            <p className="text-xs text-muted-foreground">Ask legal questions or analyze extracted document structures live.</p>
          </div>

          {/* Messages Window */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {chatMessages.map((msg, idx) => (
              
                <div key = {idx}className={'flex w-full  + (msg.sender === "user" ? "justify-end" : "justify-start")'}>
              
                <div className={`max-w-[75%] rounded-lg px-4 py-2.5 text-sm ${
                  msg.sender === "user"
                    ? "bg-primary text-primary-foreground rounded-tr-none"
                    : "bg-muted text-foreground rounded-tl-none border border-border"
                }`}>
                  {msg.text}
                </div>
              </div>
            ))}
          </div>

          {/* Bottom Chat Input Bar */}
          <div className="border-t border-border p-4 bg-card">
            <div className="flex gap-2 max-w-3xl mx-auto">
              <input
                type="text"
                placeholder="Ask about jurisdiction, plot rules, or legal citations..."
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSendMessage()}
                className="flex-1 h-10 px-3 rounded-md border border-input bg-background text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
              />
              <button
                onClick={handleSendMessage}
                className="h-10 px-4 rounded-md bg-primary text-primary-foreground font-medium text-sm hover:opacity-90 transition-opacity"
              >
                Send
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
