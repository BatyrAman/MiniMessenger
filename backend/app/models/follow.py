from __future__ import annotations
from datetime import datetime
from uuid import UUID, uuid4
from sqlmodel import SQLModel, Field
from sqlalchemy import UniqueConstraint

class Follow(SQLModel, table=True):
    __tablename__ = "follows"
    __table_args__ = (UniqueConstraint("follower_id", "following_id", name="uq_follow"),)

    id: UUID = Field(default_factory=uuid4, primary_key=True)
    follower_id: UUID = Field(foreign_key="users.id", index=True, nullable=False)
    following_id: UUID = Field(foreign_key="users.id", index=True, nullable=False)
    created_at: datetime = Field(default_factory=datetime.utcnow, index=True)