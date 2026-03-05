from fastapi import APIRouter, Depends, Query, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.db.session import get_session
from app.schemas.user import UserCreate, UserRead
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
    q: str = Query(min_length=1, max_length=30),
    session: AsyncSession = Depends(get_session),
):
    stmt = (
        select(User.id, User.username, User.avatar_url)
        .where(User.username.ilike(f"%{q}%"))
        .order_by(User.username.asc())
        .limit(20)
    )
    rows = (await session.execute(stmt)).all()
    return [
        {"id": str(r.id), "username": r.username, "avatar_url": r.avatar_url}
        for r in rows
    ]