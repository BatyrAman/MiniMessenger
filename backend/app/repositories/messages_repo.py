from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.models.message import Message
from app.models.user import User


async def create_message(session: AsyncSession, conversation_id, sender_id, content: str) -> Message:
    msg = Message(conversation_id=conversation_id, sender_id=sender_id, content=content)
    session.add(msg)
    await session.commit()
    await session.refresh(msg)
    return msg


async def list_messages(session: AsyncSession, conversation_id, limit: int = 50):
    stmt = (
        select(Message, User.username)
        .join(User, Message.sender_id == User.id)
        .where(Message.conversation_id == conversation_id)
        .order_by(Message.created_at.desc())
        .limit(limit)
    )
    res = await session.execute(stmt)
    return list(reversed(res.scalars().all()))