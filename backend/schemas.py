from datetime import datetime
from typing import Optional

from pydantic import BaseModel, EmailStr, Field, field_validator


class UserRegister(BaseModel):
    email: EmailStr
    password: str = Field(min_length=8, max_length=128)
    full_name: Optional[str] = None

    @field_validator("password")
    @classmethod
    def password_not_padded(cls, value: str) -> str:
        if value != value.strip():
            raise ValueError("Password cannot start or end with whitespace.")
        return value


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class UserOut(BaseModel):
    id: str
    email: str
    fullName: Optional[str] = None
    createdAt: datetime

    @classmethod
    def from_user(cls, user) -> "UserOut":
        return cls(id=user.id, email=user.email, fullName=user.full_name, createdAt=user.created_at)


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserOut


class DocumentOut(BaseModel):
    id: str
    filename: str
    caseType: Optional[str] = None
    jurisdiction: Optional[str] = None
    tehsil: Optional[str] = None
    plaintiff: Optional[str] = None
    defendant: Optional[str] = None
    plotNumbers: Optional[str] = None
    valuation: Optional[str] = None
    civilCode: Optional[str] = None
    createdAt: datetime


class ChatRequest(BaseModel):
    message: str = Field(min_length=1, max_length=4000)
    documentId: Optional[str] = None
    # Free-form fallback context for chats not tied to a saved document —
    # keeps the old inline-chat flow working without a DB round trip.
    context: dict = Field(default_factory=dict)


class ChatMessageOut(BaseModel):
    id: str
    role: str
    content: str
    createdAt: datetime
