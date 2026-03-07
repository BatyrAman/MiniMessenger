from uuid import UUID
from typing import List, Optional
from pydantic import BaseModel, Field, ConfigDict


class ConversationMemberRead(BaseModel):
    user_id: UUID
    username: str
    first_name: Optional[str] = None
    surname: Optional[str] = None
    avatar_url: Optional[str] = None
    role: str

    model_config = ConfigDict(from_attributes=True)


class ConversationCreate(BaseModel):
    member_ids: List[UUID]
    title: Optional[str] = Field(default=None, max_length=200)
    is_group: bool = False


class ConversationRead(BaseModel):
    id: UUID
    title: Optional[str]
    is_group: bool
    display_name: Optional[str] = None
    members: List[ConversationMemberRead] = []

    model_config = ConfigDict(from_attributes=True)