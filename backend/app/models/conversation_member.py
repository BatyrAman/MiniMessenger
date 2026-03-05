from __future__ import annotations

from datetime import datetime
from typing import Optional
from uuid import UUID, uuid4

from sqlmodel import SQLModel, Field


class ConversationMember(SQLModel, table=True):
    __tablename__ = "conversation_members"

    id: UUID = Field(default_factory=uuid4, primary_key=True)

    conversation_id: UUID = Field(foreign_key="conversations.id", index=True, nullable=False)
    user_id: UUID = Field(foreign_key="users.id", index=True, nullable=False)

    role: str = Field(default="member", max_length=32)  # member/admin/owner
    joined_at: datetime = Field(default_factory=datetime.utcnow, nullable=False)

    # Для unread: храним последний прочитанный message_id
    last_read_message_id: Optional[UUID] = Field(default=None, foreign_key="messages.id")