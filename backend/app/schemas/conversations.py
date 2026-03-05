from uuid import UUID
from pydantic import BaseModel
from typing import Optional, List


class ConversationCreate(BaseModel):
    member_ids: List[UUID]          # участников передаёшь UUID-ами
    title: Optional[str] = None     # для групп
    is_group: bool = False


class ConversationRead(BaseModel):
    id: UUID
    title: Optional[str]
    is_group: bool

    class Config:
        from_attributes = True