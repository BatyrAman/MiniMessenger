from typing import Optional
from uuid import UUID
from datetime import datetime
from pydantic import BaseModel, ConfigDict, EmailStr, Field


class UserCreate(BaseModel):
    username: str


class UserRead(BaseModel):
    id: UUID
    username: str
    email: EmailStr
    first_name: Optional[str] = None
    surname: Optional[str] = None
    bio: Optional[str] = None
    avatar_url: Optional[str] = None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)

class UserPublicRead(BaseModel):
    id: UUID
    username: str
    first_name: str | None = None
    surname: str | None = None
    avatar_url: str | None = None

class UserUpdate(BaseModel):
    username: Optional[str] = Field(default=None, min_length=3, max_length=30)
    email: Optional[EmailStr] = None
    first_name: Optional[str] = Field(default=None, max_length=50)
    surname: Optional[str] = Field(default=None, max_length=50)
    bio: Optional[str] = Field(default=None, max_length=300)
    avatar_url: Optional[str] = Field(default=None, max_length=500)

    class Config:
        from_attributes = True