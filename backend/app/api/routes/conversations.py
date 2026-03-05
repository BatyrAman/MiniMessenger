from uuid import UUID
from fastapi import APIRouter, Depends
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.deps import get_current_user_id
from app.db.session import get_session
from app.schemas.conversations import ConversationCreate, ConversationRead
from app.repositories.conversations_repo import create_conversation, list_user_conversations
from app.services.chat_service import get_or_create_dm

router = APIRouter()

@router.post("/", response_model=ConversationRead)
async def create_conv(
    data: ConversationCreate,
    session: AsyncSession = Depends(get_session),
    user_id: UUID = Depends(get_current_user_id),
):
    return await create_conversation(session, user_id, data.member_ids, data.title, data.is_group)

@router.get("/", response_model=list[ConversationRead])
async def my_convs(
    session: AsyncSession = Depends(get_session),
    user_id: UUID = Depends(get_current_user_id),
):
    return await list_user_conversations(session, user_id)

class DMCreate(BaseModel):
    other_user_id: UUID


@router.post("/dm", response_model=ConversationRead)
async def create_or_get_dm(
    data: DMCreate,
    session: AsyncSession = Depends(get_session),
    user_id: UUID = Depends(get_current_user_id),
):
    return await get_or_create_dm(session, user_id, data.other_user_id)