from uuid import UUID
from sqlalchemy.ext.asyncio import AsyncSession
from fastapi import APIRouter, Depends, HTTPException

from app.core.deps import get_current_user_id
from app.db.session import get_session
from app.schemas.messages import MessageCreate, MessageRead
from app.repositories.messages_repo import create_message, list_messages
from app.repositories.conversations_repo import is_member
from app.realtime.manager import manager

router = APIRouter()


@router.post("/", response_model=MessageRead)
async def send_message(
    data: MessageCreate,
    session: AsyncSession = Depends(get_session),
    user_id: UUID = Depends(get_current_user_id),
):
    if not await is_member(session, data.conversation_id, user_id):
        raise HTTPException(status_code=403, detail="Not a member of this conversation")

    saved = await create_message(session, data.conversation_id, user_id, data.content)

    await manager.broadcast(
        str(data.conversation_id),
        {
            "type": "message",
            "data": {
                "id": str(saved.id),
                "conversation_id": str(saved.conversation_id),
                "sender_id": str(saved.sender_id),
                "content": saved.content,
                "created_at": saved.created_at.isoformat(),
            },
        },
    )

    return saved


@router.get("/{conversation_id}", response_model=list[MessageRead])
async def get_messages(
    conversation_id: UUID,
    session: AsyncSession = Depends(get_session),
    user_id: UUID = Depends(get_current_user_id),
):
    if not await is_member(session, conversation_id, user_id):
        raise HTTPException(status_code=403, detail="Not a member of this conversation")

    return await list_messages(session, conversation_id, limit=50)