from uuid import UUID
from sqlalchemy import select, func
from app.models.conversation import Conversation
from app.models.conversation_member import ConversationMember
from sqlalchemy.ext.asyncio import AsyncSession

async def create_conversation(
    session: AsyncSession,
    creator_id: UUID,
    member_ids: list[UUID],
    title: str | None,
    is_group: bool,
) -> Conversation:
    unique_members = list(dict.fromkeys([creator_id, *member_ids]))
    conv = Conversation(title=title, is_group=is_group)
    session.add(conv)
    await session.flush()
    for uid in unique_members:
        session.add(ConversationMember(conversation_id=conv.id, user_id=uid))
    await session.commit()
    await session.refresh(conv)
    return conv

async def list_user_conversations(session: AsyncSession, user_id: UUID):
    stmt = (
        select(Conversation).join(ConversationMember, ConversationMember.conversation_id == Conversation.id).where(ConversationMember.user_id == user_id).order_by(Conversation.created_at.desc())
    )
    res = await session.execute(stmt)
    return res.scalars().all()

async def is_member(session: AsyncSession, conversation_id: UUID, user_id: UUID) -> bool:
    stmt = (
        select(ConversationMember.id)
        .where(ConversationMember.conversation_id == conversation_id)
        .where(ConversationMember.user_id == user_id)
        .limit(1)
    )
    res = await session.execute(stmt)
    return res.scalar_one_or_none() is not None

async def find_dm_conversation(
    session: AsyncSession,
    user_a: UUID,
    user_b: UUID,
) -> Conversation | None:
    """
    Ищем 1-на-1 чат (is_group=False) в котором ровно два участника: user_a и user_b.
    """
    members = {user_a, user_b}

    # Берём conversation_id где:
    # - is_group = false
    # - участники включают оба user_a и user_b
    # - всего участников ровно 2
    subq = (
        select(ConversationMember.conversation_id)
        .where(ConversationMember.user_id.in_(list(members)))
        .group_by(ConversationMember.conversation_id)
        .having(func.count(func.distinct(ConversationMember.user_id)) == 2)
        .subquery()
    )

    stmt = (
        select(Conversation)
        .join(subq, subq.c.conversation_id == Conversation.id)
        .where(Conversation.is_group == False)  # noqa: E712
        # гарантируем ровно 2 участника в чате (не группа)
        .where(
            select(func.count(ConversationMember.id))
            .where(ConversationMember.conversation_id == Conversation.id)
            .scalar_subquery()
            == 2
        )
        .limit(1)
    )

    res = await session.execute(stmt)
    return res.scalar_one_or_none()