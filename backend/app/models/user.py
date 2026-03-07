from __future__ import annotations
from datetime import datetime
from uuid import UUID, uuid4
from typing import Optional
from sqlmodel import SQLModel, Field

class User(SQLModel, table=True):
    __tablename__ = "users"

    id: UUID = Field(default_factory=uuid4, primary_key=True)
    username: str = Field(index=True, unique=True, max_length=30)
    email: str = Field(index=True, unique=True, max_length=120)
    password_hash: str

    first_name: Optional[str] = Field(default=None, max_length=50)
    surname: Optional[str] = Field(default=None, max_length=50)
    bio: Optional[str] = Field(default=None, max_length=160)
    avatar_url: Optional[str] = Field(default=None, max_length=400)

    created_at: datetime = Field(default_factory=datetime.utcnow, index=True)

