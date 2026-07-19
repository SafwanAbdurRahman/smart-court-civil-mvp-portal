# SmartCourt Civil MVP Portal

An AI-powered document scrutiny assistant designed to accelerate the intake pipeline for Indian civil case filings. This full-stack application automates parameter extraction from bilingual (English/Hindi) legal documents, helping legal teams and court clerks identify key case metrics rapidly.

---

## 🚀 Project Overview & Intent
This project is currently a **Minimum Viable Product (MVP)** built to demonstrate the feasibility of localized, privacy-first legal tech pipelines. It is structured using a completely decoupled frontend and backend architecture to handle asynchronous computational tasks (like OCR text extraction and LLM parsing) without locking the user interface.

> 📝 **Important Status Note:** This system is an active prototype and engineering proof-of-concept. It is **not yet production-grade** or optimized for multi-user enterprise scale. 

---

## 🛠️ The Tech Stack

### Frontend Architecture
- **Framework:** Next.js (TypeScript) with App Router
- **UI Components:** Tailwind CSS, Shadcn UI
- **State Management:** React Context API for localized authentication states

### Backend Architecture
- **Framework:** FastAPI (Python) for asynchronous, high-performance API endpoints
- **Database Engine:** SQLite (Local instance for development velocity)
- **ORM:** SQLAlchemy with structured database models
- **Security:** JWT (JSON Web Tokens) with `bcrypt` password hashing profiles

### AI & Pipeline Processing
- **OCR Engine:** Tesseract OCR / PDF plumbing modules optimized for script detection
- **Local LLM Engine:** Ollama running open-source models (e.g., Llama 3) completely on-premise for 100% data privacy

---

## ⚠️ Known Limitations & Current Flaws
In the spirit of open development, the current MVP version has the following architectural bottlenecks:

1. **Context Window Constraints:** The AI parameter extraction relies on passing raw extracted text directly into a single prompt. Extremely large, multi-page case files will trigger tokenization errors due to local context limits. It is currently optimized for first-page screening.
2. **Deterministic Variance:** Because local LLM parameters (like temperature) are not completely locked down, sequential processing of the same handwritten image file can occasionally result in varying field extractions.
3. **Local Database & Storage Dependency:** SQLite and local file systems are used for file tracking and historical entries. Data is bound to the local host machine and files will not persist across cloud container rebuilds.
4. **Simple Field Scanning:** The chat assistant answers queries using extracted metadata parameters rather than a deep semantic search over the entire multi-page document body.
5. **Lack of Automated Testing:** The codebase currently lacks comprehensive unit, integration, or end-to-end testing scripts.

---

## 🗺️ Engineering Roadmap (Next Steps)
To upgrade this application from a 9/10 portfolio MVP to an enterprise-ready legal SaaS platform, the next development cycles will focus on:

- [ ] **Migration to Cloud Database:** Replacing SQLite with a managed PostgreSQL instance (via Supabase or Neon).
- [ ] **Full-Text RAG Implementation:** Integrating a vector database (like pgvector or Chroma) to allow the legal chat assistant to scan an entire 50+ page legal document rather than just metadata fields.
- [ ] **Cloud AI Integration:** Implementing API configurations for high-speed cloud infrastructures (like Groq Cloud API or OpenAI) to handle production traffic efficiently.
- [ ] **Deterministic Constraints:** Adjusting LLM hyperparameters (`temperature = 0.0`, `top_p`) to guarantee consistent, unvaried extraction across repeated uploads.
- [ ] **Background Queues:** Offloading intense OCR operations to a background task runner (like Celery or Redis Queue) to prevent API timeouts during heavy processing tasks.
