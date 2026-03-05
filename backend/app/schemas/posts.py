from pydantic import BaseModel
from uuid import UUID
from datetime import datetime
from typing import Optional, List, Literal

class MediaIn(BaseModel):
    url: str
    media_type: Literal["image", "video"] = "image"
    sort_order: int = 0

class PostCreate(BaseModel):
    caption: Optional[str] = None
    media: List[MediaIn] = []

class PostOut(BaseModel):
    id: UUID
    author_id: UUID
    caption: Optional[str]
    created_at: datetime

    media: list[MediaIn] = []
    likes_count: int = 0
    comments_count: int = 0

    class Config:
        from_attributes = True