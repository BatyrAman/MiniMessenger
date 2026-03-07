from __future__ import annotations

from datetime import datetime
from uuid import UUID, uuid4

from sqlmodel import SQLModel, Field


class User(SQLModel, table=True):
    __tablename__ = "users"

    id: UUID = Field(default_factory=uuid4, primary_key=True)

    username: str = Field(index=True, unique=True, nullable=False, max_length=100)
    email: str = Field(index=True, unique=True, nullable=False, max_length=255)
    password_hash: str = Field(nullable=False, max_length=255)

    first_name: str | None = Field(default=None, max_length=100)
    surname: str | None = Field(default=None, max_length=100)
    bio: str | None = Field(default=None, max_length=1000)
    avatar_url: str | None = Field(default=None, max_length=500)

    created_at: datetime = Field(default_factory=datetime.utcnow, nullable=False)