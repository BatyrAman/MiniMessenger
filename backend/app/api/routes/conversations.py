from uuid import UUID, uuid4

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field
from sqlalchemy import and_, func, select, delete
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.deps import get_current_user_id
from app.db.session import get_session
from app.schemas.conversations import ConversationCreate, ConversationRead
from app.repositories.conversations_repo import create_conversation, list_user_conversations
from app.models.conversation import Conversation
from app.models.conversation_member import ConversationMember
from app.models.user import User

router = APIRouter()


# =========================
# Pydantic schemas for routes
# =========================

class DMCreate(BaseModel):
    other_user_id: UUID


class ConversationRename(BaseModel):
    title: str = Field(..., min_length=1, max_length=200)


class AddMembersIn(BaseModel):
    member_ids: list[UUID]


# =========================
# Helpers
# =========================

async def ensure_user_exists(session: AsyncSession, user_id: UUID) -> None:
    user = await session.get(User, user_id)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found",
        )


async def ensure_conversation_exists(session: AsyncSession, conversation_id: UUID) -> Conversation:
    conv = await session.get(Conversation, conversation_id)
    if not conv:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Conversation not found",
        )
    return conv


async def ensure_member(session: AsyncSession, conversation_id: UUID, user_id: UUID) -> ConversationMember:
    stmt = select(ConversationMember).where(
        and_(
            ConversationMember.conversation_id == conversation_id,
            ConversationMember.user_id == user_id,
        )
    )
    member = (await session.execute(stmt)).scalar_one_or_none()
    if not member:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You are not a member of this conversation",
        )
    return member


async def find_existing_dm(
        session: AsyncSession,
        user_a: UUID,
        user_b: UUID,
) -> UUID | None:
    """
    Ищем conversation, где:
    - is_group = False
    - ровно 2 участника
    - оба участника = user_a и user_b
    """

    stmt = (
        select(Conversation.id)
        .join(ConversationMember, ConversationMember.conversation_id == Conversation.id)
        .where(
            Conversation.is_group == False,
            ConversationMember.user_id.in_([user_a, user_b]),
        )
        .group_by(Conversation.id)
        .having(func.count(ConversationMember.user_id) == 2)
        .limit(1)
    )

    result = await session.execute(stmt)
    return result.scalar_one_or_none()


# =========================
# Routes
# =========================

@router.post("/", response_model=ConversationRead)
async def create_conv(
    data: ConversationCreate,
    session: AsyncSession = Depends(get_session),
    user_id: UUID = Depends(get_current_user_id),
):
    if data.is_group:
        if len(data.member_ids) < 2:
            raise HTTPException(400, detail="Group must contain at least 3 users including creator")
        if not data.title or not data.title.strip():
            raise HTTPException(400, detail="Group title is required")
    else:
        if len(data.member_ids) != 1:
            raise HTTPException(400, detail="Direct message must contain exactly 1 other user")

    return await create_conversation(session, user_id, data.member_ids, data.title, data.is_group)


@router.get("/", response_model=list[ConversationRead])
async def my_convs(
        session: AsyncSession = Depends(get_session),
        user_id: UUID = Depends(get_current_user_id),
):
    return await list_user_conversations(session, user_id)


@router.post("/dm", response_model=ConversationRead)
async def create_or_get_dm(
        data: DMCreate,
        session: AsyncSession = Depends(get_session),
        user_id: UUID = Depends(get_current_user_id),
):
    """
    Создать или получить DM через body:
    {
      "other_user_id": "uuid"
    }
    """
    other_user_id = data.other_user_id

    if other_user_id == user_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Can't DM yourself",
        )

    await ensure_user_exists(session, other_user_id)

    existing_dm_id = await find_existing_dm(session, user_id, other_user_id)
    if existing_dm_id:
        conv = await session.get(Conversation, existing_dm_id)
        return conv

    conv = Conversation(
        id=uuid4(),
        is_group=False,
        title=None,
    )
    session.add(conv)
    session.add(ConversationMember(conversation_id=conv.id, user_id=user_id, role="member"))
    session.add(ConversationMember(conversation_id=conv.id, user_id=other_user_id, role="member"))

    await session.commit()
    await session.refresh(conv)
    return conv


@router.post("/dm/{other_user_id}", response_model=ConversationRead)
async def create_or_get_dm_by_path(
        other_user_id: UUID,
        session: AsyncSession = Depends(get_session),
        user_id: UUID = Depends(get_current_user_id),
):
    """
    То же самое, но через path param.
    Удобно для frontend:
    POST /conversations/dm/{other_user_id}
    """
    if other_user_id == user_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Can't DM yourself",
        )

    await ensure_user_exists(session, other_user_id)

    existing_dm_id = await find_existing_dm(session, user_id, other_user_id)
    if existing_dm_id:
        conv = await session.get(Conversation, existing_dm_id)
        return conv

    conv = Conversation(
        id=uuid4(),
        is_group=False,
        title=None,
    )
    session.add(conv)
    session.add(ConversationMember(conversation_id=conv.id, user_id=user_id, role="member"))
    session.add(ConversationMember(conversation_id=conv.id, user_id=other_user_id, role="member"))

    await session.commit()
    await session.refresh(conv)
    return conv


@router.patch("/{conversation_id}", response_model=ConversationRead)
async def rename_conversation(
        conversation_id: UUID,
        data: ConversationRename,
        session: AsyncSession = Depends(get_session),
        user_id: UUID = Depends(get_current_user_id),
):
    """
    Переименовать conversation.
    Пока что любой участник conversation может менять title.
    Позже можно ограничить только owner/admin.
    """
    conv = await ensure_conversation_exists(session, conversation_id)
    await ensure_member(session, conversation_id, user_id)

    conv.title = data.title.strip()

    await session.commit()
    await session.refresh(conv)
    return conv


@router.post("/{conversation_id}/members", response_model=ConversationRead)
async def add_members(
        conversation_id: UUID,
        data: AddMembersIn,
        session: AsyncSession = Depends(get_session),
        user_id: UUID = Depends(get_current_user_id),
):
    """
    Добавить участников в group conversation.
    """
    conv = await ensure_conversation_exists(session, conversation_id)
    await ensure_member(session, conversation_id, user_id)

    if not conv.is_group:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot add members to direct message",
        )

    unique_member_ids = list(dict.fromkeys(data.member_ids))

    for member_id in unique_member_ids:
        await ensure_user_exists(session, member_id)

        stmt = select(ConversationMember).where(
            and_(
                ConversationMember.conversation_id == conversation_id,
                ConversationMember.user_id == member_id,
            )
        )
        already_member = (await session.execute(stmt)).scalar_one_or_none()

        if already_member:
            continue

        session.add(
            ConversationMember(
                conversation_id=conversation_id,
                user_id=member_id,
                role="member",
            )
        )

    await session.commit()
    await session.refresh(conv)
    return conv


@router.delete("/{conversation_id}/members/{member_id}")
async def remove_member(
        conversation_id: UUID,
        member_id: UUID,
        session: AsyncSession = Depends(get_session),
        user_id: UUID = Depends(get_current_user_id),
):
    """
    Удалить участника из group conversation.
    """
    conv = await ensure_conversation_exists(session, conversation_id)
    await ensure_member(session, conversation_id, user_id)

    if not conv.is_group:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot remove members from direct message",
        )

    target_member_stmt = select(ConversationMember).where(
        and_(
            ConversationMember.conversation_id == conversation_id,
            ConversationMember.user_id == member_id,
        )
    )
    target_member = (await session.execute(target_member_stmt)).scalar_one_or_none()

    if not target_member:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Member not found in this conversation",
        )

    await session.delete(target_member)
    await session.commit()

    return {"ok": True, "removed_user_id": str(member_id)}