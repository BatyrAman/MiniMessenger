from __future__ import annotations
from datetime import datetime
from uuid import UUID, uuid4
from sqlmodel import SQLModel, Field
from sqlalchemy import UniqueConstraint

class Like(SQLModel, table=True):
    __tablename__ = "likes"
    __table_args__ = (UniqueConstraint("user_id", "post_id", name="uq_like"),)

    id: UUID = Field(default_factory=uuid4, primary_key=True)
    user_id: UUID = Field(foreign_key="users.id", index=True, nullable=False)
    post_id: UUID = Field(foreign_key="posts.id", index=True, nullable=False)
    created_at: datetime = Field(default_factory=datetime.utcnow, index=True)