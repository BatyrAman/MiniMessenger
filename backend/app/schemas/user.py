from uuid import UUID
from datetime import datetime
from pydantic import BaseModel


class UserCreate(BaseModel):
    username: str


class UserRead(BaseModel):
    id: UUID
    username: str
    created_at: datetime

    class Config:
        from_attributes = True