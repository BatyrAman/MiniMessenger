from __future__ import annotations
from datetime import datetime
from uuid import UUID, uuid4
from typing import Optional
from sqlmodel import SQLModel, Field

from enum import Enum
class Post(SQLModel, table=True):
    __tablename__ = "posts"

    id: UUID = Field(default_factory=uuid4, primary_key=True)
    author_id: UUID = Field(foreign_key="users.id", index=True, nullable=False)

    caption: Optional[str] = Field(default=None, max_length=2200)
    created_at: datetime = Field(default_factory=datetime.utcnow, index=True, nullable=False)


class MediaType(str, Enum):
    image = "image"
    video = "video"