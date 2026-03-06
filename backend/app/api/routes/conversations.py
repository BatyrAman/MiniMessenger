from pydantic import BaseModel

from uuid import UUID, uuid4
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_, func

from app.core.deps import get_current_user_id
from app.db.session import get_session
from app.schemas.conversations import ConversationCreate, ConversationRead
from app.repositories.conversations_repo import create_conversation, list_user_conversations
from app.services.chat_service import get_or_create_dm
from app.models.conversation_member import ConversationMember
from app.models.conversation import Conversation
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

@router.post("/dm/{other_user_id}")
async def start_dm(
    other_user_id: UUID,
    session: AsyncSession = Depends(get_session),
    me: UUID = Depends(get_current_user_id),
):
    if other_user_id == me:
        raise HTTPException(400, detail="Can't DM yourself")

    # найти существующий DM: conversation where exactly these 2 users
    # простой вариант: ищем conversation_id которые есть у обоих
    my_convs = select(ConversationMember.conversation_id).where(ConversationMember.user_id == me).subquery()
    other_convs = select(ConversationMember.conversation_id).where(ConversationMember.user_id == other_user_id).subquery()

    stmt = select(Conversation.id).where(
        and_(
            Conversation.is_group == False,
            Conversation.id.in_(select(my_convs.c.conversation_id)),
            Conversation.id.in_(select(other_convs.c.conversation_id)),
        )
    ).limit(1)

    existing = (await session.execute(stmt)).scalar_one_or_none()
    if existing:
        return {"conversation_id": str(existing)}

    # создать новый
    conv = Conversation(id=uuid4(), is_group=False, title=None)
    session.add(conv)
    session.add(ConversationMember(conversation_id=conv.id, user_id=me))
    session.add(ConversationMember(conversation_id=conv.id, user_id=other_user_id))

    await session.commit()
    return {"conversation_id": str(conv.id)}