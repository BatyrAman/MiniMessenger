from __future__ import annotations
from datetime import datetime
from uuid import UUID, uuid4
from sqlmodel import SQLModel, Field

class Comment(SQLModel, table=True):
    __tablename__ = "comments"

    id: UUID = Field(default_factory=uuid4, primary_key=True)
    post_id: UUID = Field(foreign_key="posts.id", index=True, nullable=False)
    user_id: UUID = Field(foreign_key="users.id", index=True, nullable=False)

    text: str = Field(max_length=2000)
    created_at: datetime = Field(default_factory=datetime.utcnow, index=True)