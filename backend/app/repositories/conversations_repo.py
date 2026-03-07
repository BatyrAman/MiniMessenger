from uuid import UUID, uuid4
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.conversation import Conversation
from app.models.conversation_member import ConversationMember
from app.models.user import User
from app.schemas.conversations import ConversationRead, ConversationMemberRead


async def create_conversation(
    session: AsyncSession,
    creator_id: UUID,
    member_ids: list[UUID],
    title: str | None,
    is_group: bool,
) -> ConversationRead:

    unique_members = list(dict.fromkeys([creator_id, *member_ids]))

    conv = Conversation(
        id=uuid4(),
        title=title,
        is_group=is_group,
    )

    session.add(conv)

    for uid in unique_members:
        session.add(
            ConversationMember(
                conversation_id=conv.id,
                user_id=uid,
                role="member",
            )
        )

    await session.commit()
    await session.refresh(conv)

    return await build_conversation_read(session, conv.id, creator_id)


async def list_user_conversations(
    session: AsyncSession,
    user_id: UUID,
) -> list[ConversationRead]:

    stmt = (
        select(Conversation)
        .join(ConversationMember)
        .where(ConversationMember.user_id == user_id)
        .order_by(Conversation.created_at.desc())
    )

    conversations = (await session.execute(stmt)).scalars().all()

    result = []

    for conv in conversations:
        result.append(
            await build_conversation_read(session, conv.id, user_id)
        )

    return result


async def build_conversation_read(
    session: AsyncSession,
    conversation_id: UUID,
    current_user_id: UUID,
) -> ConversationRead:

    conv = await session.get(Conversation, conversation_id)

    stmt = (
        select(
            ConversationMember,
            User,
        )
        .join(User, User.id == ConversationMember.user_id)
        .where(ConversationMember.conversation_id == conversation_id)
    )

    rows = (await session.execute(stmt)).all()

    members = []
    other_user = None

    for member, user in rows:

        member_schema = ConversationMemberRead(
            user_id=user.id,
            username=user.username,
            first_name=user.first_name,
            surname=user.surname,
            avatar_url=user.avatar_url,
            role=member.role,
        )

        members.append(member_schema)

        if user.id != current_user_id:
            other_user = user

    display_name = conv.title

    if not conv.is_group and other_user:
        if other_user.first_name or other_user.surname:
            display_name = f"{other_user.first_name or ''} {other_user.surname or ''}".strip()
        else:
            display_name = other_user.username

    return ConversationRead(
        id=conv.id,
        title=conv.title,
        is_group=conv.is_group,
        display_name=display_name,
        members=members,
    )

async def is_member(
    session: AsyncSession,
    conversation_id: UUID,
    user_id: UUID,
) -> bool:

    stmt = select(ConversationMember).where(
        ConversationMember.conversation_id == conversation_id,
        ConversationMember.user_id == user_id,
    )

    result = await session.execute(stmt)

    member = result.scalar_one_or_none()

    return member is not None