from uuid import UUID
from datetime import datetime
from pydantic import BaseModel


class MessageCreate(BaseModel):
    conversation_id: UUID
    content: str


class MessageRead(BaseModel):
    id: UUID
    conversation_id: UUID
    sender_id: UUID
    content: str
    created_at: datetime

    class Config:
        from_attributes = True