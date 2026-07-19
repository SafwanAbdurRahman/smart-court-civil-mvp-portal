import sys
import os
import dotenv

# Load .env before anything else reads os.getenv
dotenv.load_dotenv()

# Set UTF-8 encoding for stdout/stderr to avoid UnicodeEncodeError on Windows console
if sys.stdout:
    sys.stdout.reconfigure(encoding="utf-8")
if sys.stderr:
    sys.stderr.reconfigure(encoding="utf-8")

import asyncio
import nest_asyncio
import uvicorn
from fastapi import Depends, FastAPI, File, HTTPException, Request, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordRequestForm
from pyngrok import ngrok
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from slowapi.util import get_remote_address
from sqlalchemy.orm import Session

from ai_engine import ExtractionError, ask_legal_chat, extract_fields_from_images
from auth import create_access_token, get_current_user, hash_password, verify_password
from database import Base, engine, get_db
from models import ChatMessage, Document, User
from pdf_engine import render_pdf_pages_to_png
from schemas import (
    ChatMessageOut,
    ChatRequest,
    DocumentOut,
    TokenResponse,
    UserLogin,
    UserOut,
    UserRegister,
)

Base.metadata.create_all(bind=engine)

# ─── Rate Limiter ─────────────────────────────────────────────────────────────
limiter = Limiter(key_func=get_remote_address)

app = FastAPI(title="SmartCourt Civil MVP Backend", version="2.0.0")
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# ─── CORS ─────────────────────────────────────────────────────────────────────
_raw_origins = os.getenv("ALLOWED_ORIGINS", "*")
ALLOWED_ORIGINS = ["*"] if _raw_origins.strip() == "*" else [o.strip() for o in _raw_origins.split(",")]

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    # allow_credentials must be False when allow_origins=["*"]; browsers reject
    # credentialed requests to wildcard origins. We don't need credentials mode
    # anyway since auth travels in the Authorization header, not cookies.
    allow_credentials=False,
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["*"],
)

# ─── Constants ────────────────────────────────────────────────────────────────
MAX_FILE_SIZE_MB = 10
MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024


def document_to_out(doc: Document) -> DocumentOut:
    return DocumentOut(
        id=doc.id,
        filename=doc.filename,
        caseType=doc.case_type,
        jurisdiction=doc.jurisdiction,
        tehsil=doc.tehsil,
        plaintiff=doc.plaintiff,
        defendant=doc.defendant,
        plotNumbers=doc.plot_numbers,
        valuation=doc.valuation,
        civilCode=doc.civil_code,
        createdAt=doc.created_at,
    )


def save_extracted_document(db: Session, user: User, filename: str, extracted: dict) -> Document:
    doc = Document(
        user_id=user.id,
        filename=filename,
        case_type=extracted.get("caseType"),
        jurisdiction=extracted.get("jurisdiction"),
        tehsil=extracted.get("tehsil"),
        plaintiff=extracted.get("plaintiff"),
        defendant=extracted.get("defendant"),
        plot_numbers=extracted.get("plotNumbers"),
        valuation=extracted.get("valuation"),
        civil_code=extracted.get("civilCode"),
    )
    db.add(doc)
    db.commit()
    db.refresh(doc)
    return doc


# ─── Health Check ─────────────────────────────────────────────────────────────
@app.get("/health")
async def health_check():
    return {"status": "ok", "service": "SmartCourt Civil MVP Backend"}


# ─── Auth Routes ──────────────────────────────────────────────────────────────
@app.post("/auth/register", response_model=TokenResponse, status_code=201)
@limiter.limit("10/minute")
async def register(request: Request, payload: UserRegister, db: Session = Depends(get_db)):
    existing = db.query(User).filter(User.email == payload.email.lower()).first()
    if existing:
        raise HTTPException(status_code=409, detail="An account with this email already exists.")

    user = User(
        email=payload.email.lower(),
        hashed_password=hash_password(payload.password),
        full_name=payload.full_name,
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    token = create_access_token(subject=user.email)
    return TokenResponse(access_token=token, user=UserOut.from_user(user))


@app.post("/auth/login", response_model=TokenResponse)
@limiter.limit("20/minute")
async def login(request: Request, db: Session = Depends(get_db), form_data: OAuth2PasswordRequestForm = Depends()):
    # OAuth2PasswordRequestForm uses `username` as the field name — we treat it as the email.
    user = db.query(User).filter(User.email == form_data.username.lower()).first()
    if not user or not verify_password(form_data.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Incorrect email or password.")

    token = create_access_token(subject=user.email)
    return TokenResponse(access_token=token, user=UserOut.from_user(user))


@app.post("/auth/login-json", response_model=TokenResponse)
@limiter.limit("20/minute")
async def login_json(request: Request, payload: UserLogin, db: Session = Depends(get_db)):
    """JSON-body login for the frontend, since OAuth2PasswordRequestForm expects form-encoded data."""
    user = db.query(User).filter(User.email == payload.email.lower()).first()
    if not user or not verify_password(payload.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Incorrect email or password.")

    token = create_access_token(subject=user.email)
    return TokenResponse(access_token=token, user=UserOut.from_user(user))


@app.get("/auth/me", response_model=UserOut)
async def read_current_user(current_user: User = Depends(get_current_user)):
    return UserOut.from_user(current_user)


# ─── Route: Image Upload ───────────────────────────────────────────────────────
@app.post("/upload")
@limiter.limit("10/minute")
async def process_court_doc(
    request: Request,
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    print(f"📥 Received image file: {file.filename} (user: {current_user.email})")
    try:
        file_bytes = await file.read()

        if len(file_bytes) > MAX_FILE_SIZE_BYTES:
            return {"status": "error", "message": f"File too large. Maximum allowed size is {MAX_FILE_SIZE_MB}MB."}

        extracted_data = await asyncio.to_thread(extract_fields_from_images, [file_bytes])
        saved = save_extracted_document(db, current_user, file.filename or "upload", extracted_data)

        return {"status": "success", "data": extracted_data, "documentId": saved.id}

    except ExtractionError as e:
        print(f"❌ Extraction failed for {file.filename}: {e}")
        return {"status": "error", "message": str(e)}
    except Exception as e:
        print(f"❌ Error during image processing: {str(e)}")
        return {"status": "error", "message": str(e)}


# ─── Route: PDF Upload ─────────────────────────────────────────────────────────
@app.post("/upload-pdf")
@limiter.limit("10/minute")
async def process_pdf_document(
    request: Request,
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    print(f"📥 Received PDF file: {file.filename} (user: {current_user.email})")
    try:
        pdf_bytes = await file.read()

        if len(pdf_bytes) > MAX_FILE_SIZE_BYTES:
            return {"status": "error", "message": f"File too large. Maximum allowed size is {MAX_FILE_SIZE_MB}MB."}

        page_images = await asyncio.to_thread(render_pdf_pages_to_png, pdf_bytes)
        extracted_data = await asyncio.to_thread(extract_fields_from_images, page_images)
        saved = save_extracted_document(db, current_user, file.filename or "upload.pdf", extracted_data)

        return {
            "status": "success",
            "data": {"metadata": extracted_data, "pages": []},
            "documentId": saved.id,
        }
    except ExtractionError as e:
        print(f"❌ Extraction failed for {file.filename}: {e}")
        return {"status": "error", "message": str(e)}
    except Exception as e:
        print(f"❌ Error during PDF processing: {str(e)}")
        return {"status": "error", "message": str(e)}


# ─── Route: Document History ───────────────────────────────────────────────────
@app.get("/api/documents", response_model=list[DocumentOut])
async def list_documents(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    documents = (
        db.query(Document)
        .filter(Document.user_id == current_user.id)
        .order_by(Document.created_at.desc())
        .all()
    )
    return [document_to_out(doc) for doc in documents]


@app.get("/api/documents/{document_id}", response_model=DocumentOut)
async def get_document(
    document_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    doc = (
        db.query(Document)
        .filter(Document.id == document_id, Document.user_id == current_user.id)
        .first()
    )
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found.")
    return document_to_out(doc)


# ─── Route: Chat Assistant ─────────────────────────────────────────────────────
@app.post("/api/chat")
@limiter.limit("20/minute")
async def legal_chat_assistant(
    request: Request,
    chat_request: ChatRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    ctx = chat_request.context or {}
    document = None

    if chat_request.documentId:
        document = (
            db.query(Document)
            .filter(Document.id == chat_request.documentId, Document.user_id == current_user.id)
            .first()
        )
        if not document:
            raise HTTPException(status_code=404, detail="Document not found.")
        ctx = {
            "caseType": document.case_type,
            "jurisdiction": document.jurisdiction,
            "tehsil": document.tehsil,
            "plaintiff": document.plaintiff,
            "defendant": document.defendant,
            "plotNumbers": document.plot_numbers,
            "valuation": document.valuation,
            "civilCode": document.civil_code,
        }

    db.add(ChatMessage(
        user_id=current_user.id,
        document_id=document.id if document else None,
        role="user",
        content=chat_request.message,
    ))
    db.commit()

    try:
        reply = await asyncio.to_thread(ask_legal_chat, chat_request.message, ctx)
    except ExtractionError as e:
        print(f"❌ Error during chat assistant query: {e}")
        reply = str(e)

    db.add(ChatMessage(
        user_id=current_user.id,
        document_id=document.id if document else None,
        role="assistant",
        content=reply,
    ))
    db.commit()

    return {"reply": reply}


@app.get("/api/chat/{document_id}", response_model=list[ChatMessageOut])
async def get_chat_history(
    document_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    document = (
        db.query(Document)
        .filter(Document.id == document_id, Document.user_id == current_user.id)
        .first()
    )
    if not document:
        raise HTTPException(status_code=404, detail="Document not found.")

    messages = (
        db.query(ChatMessage)
        .filter(ChatMessage.document_id == document_id, ChatMessage.user_id == current_user.id)
        .order_by(ChatMessage.created_at.asc())
        .all()
    )
    return [
        ChatMessageOut(id=m.id, role=m.role, content=m.content, createdAt=m.created_at)
        for m in messages
    ]


# ─── Startup (local dev with optional ngrok) ───────────────────────────────────
async def main():
    use_ngrok = os.getenv("USE_NGROK", "False").lower() in ("true", "1", "yes")

    if use_ngrok:
        try:
            NGROK_TOKEN = os.getenv("NGROK_TOKEN")
            if not NGROK_TOKEN:
                raise ValueError("NGROK_TOKEN is not set in the environment or .env file.")
            ngrok.set_auth_token(NGROK_TOKEN)
            ngrok.kill()
            tunnel = ngrok.connect(8000)
            public_url = tunnel.public_url
            print(f"\n🚀 YOUR LIVE BACKEND URL IS: {public_url} \n")
        except Exception as e:
            print(f"⚠️ Failed to start Ngrok tunnel (continuing without tunnel): {str(e)}")
    else:
        print("\n🚀 Starting server in production mode (without Ngrok tunnel).")

    nest_asyncio.apply()
    port = int(os.getenv("PORT", 8000))
    config = uvicorn.Config(app, host="0.0.0.0", port=port, loop="asyncio")
    server = uvicorn.Server(config)
    await server.serve()


if __name__ == "__main__":
    asyncio.run(main())
