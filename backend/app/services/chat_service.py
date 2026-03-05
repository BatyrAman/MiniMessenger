from uuid import UUID
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.conversation import Conversation
from app.repositories.conversations_repo import create_conversation, find_dm_conversation


async def get_or_create_dm(
    session: AsyncSession,
    creator_id: UUID,
    other_user_id: UUID,
) -> Conversation:
    existing = await find_dm_conversation(session, creator_id, other_user_id)
    if existing:
        return existing

    return await create_conversation(
        session=session,
        creator_id=creator_id,
        member_ids=[other_user_id],
        title=None,
        is_group=False,
    )