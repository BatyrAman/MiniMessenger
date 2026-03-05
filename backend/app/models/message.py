from __future__ import annotations

from datetime import datetime
from uuid import UUID, uuid4

from sqlmodel import SQLModel, Field


class Message(SQLModel, table=True):
    __tablename__ = "messages"

    id: UUID = Field(default_factory=uuid4, primary_key=True)

    conversation_id: UUID = Field(foreign_key="conversations.id", index=True, nullable=False)
    sender_id: UUID = Field(foreign_key="users.id", index=True, nullable=False)

    content: str = Field(max_length=5000)
    created_at: datetime = Field(default_factory=datetime.utcnow, index=True, nullable=False)