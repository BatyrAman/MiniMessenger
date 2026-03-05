# app/models/post_media.py
from __future__ import annotations
from uuid import UUID, uuid4

from sqlmodel import SQLModel, Field
from sqlalchemy import Column
from sqlalchemy import Enum as SAEnum

from app.models.enums import MediaType


class PostMedia(SQLModel, table=True):
    __tablename__ = "post_media"

    id: UUID = Field(default_factory=uuid4, primary_key=True)
    post_id: UUID = Field(foreign_key="posts.id", index=True, nullable=False)

    url: str = Field(max_length=500)

    # ✅ ВАЖНО: Literal нельзя, используем Enum
    media_type: MediaType = Field(
        default=MediaType.image,
        sa_column=Column(SAEnum(MediaType, name="media_type_enum"), nullable=False),
    )

    sort_order: int = Field(default=0, index=True)