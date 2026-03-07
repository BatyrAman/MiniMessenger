from uuid import UUID

from fastapi import APIRouter, Depends, Query, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, or_

from app.core.deps import get_current_user_id
from app.db.session import get_session
from app.schemas.user import UserCreate, UserRead, UserUpdate
from app.repositories.user_repo import create_user, get_users
from app.models.user import User

router = APIRouter()


@router.post("/", response_model=UserRead)
async def create_user_route(
    data: UserCreate,
    session: AsyncSession = Depends(get_session),
):
    return await create_user(session, data.username)


@router.get("/", response_model=list[UserRead])
async def list_users_route(
    session: AsyncSession = Depends(get_session),
):
    return await get_users(session)

@router.get("/search")
async def search_users(
    q: str = Query(..., min_length=1),
    session: AsyncSession = Depends(get_session),
    current_user_id: UUID = Depends(get_current_user_id),
):
    stmt = (
        select(User)
        .where(
            User.id != current_user_id,
            or_(
                User.username.ilike(f"%{q}%"),
                User.first_name.ilike(f"%{q}%"),
                User.surname.ilike(f"%{q}%"),
            ),
        )
        .order_by(User.username.asc())
        .limit(20)
    )

    users = (await session.execute(stmt)).scalars().all()
    return [
        {
            "id": str(u.id),
            "username": u.username,
            "first_name": u.first_name,
            "surname": u.surname,
            "avatar_url": u.avatar_url,
        }
        for u in users
    ]
@router.get("/me", response_model=UserRead)
async def get_me(
    session: AsyncSession = Depends(get_session),
    current_user_id: UUID = Depends(get_current_user_id),
):
    user = await session.get(User, current_user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user


@router.patch("/me", response_model=UserRead)
async def update_me(
    data: UserUpdate,
    session: AsyncSession = Depends(get_session),
    current_user_id: UUID = Depends(get_current_user_id),
):
    user = await session.get(User, current_user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    # проверка уникальности username
    if data.username is not None and data.username != user.username:
        existing = (
            await session.execute(
                select(User).where(User.username == data.username)
            )
        ).scalar_one_or_none()
        if existing:
            raise HTTPException(status_code=400, detail="Username already used")
        user.username = data.username

    # проверка уникальности email
    if data.email is not None and data.email != user.email:
        existing = (
            await session.execute(
                select(User).where(User.email == data.email)
            )
        ).scalar_one_or_none()
        if existing:
            raise HTTPException(status_code=400, detail="Email already used")
        user.email = data.email

    if data.first_name is not None:
        user.first_name = data.first_name

    if data.surname is not None:
        user.surname = data.surname

    if data.bio is not None:
        user.bio = data.bio

    if data.avatar_url is not None:
        user.avatar_url = data.avatar_url

    session.add(user)
    await session.commit()
    await session.refresh(user)

    return user

