from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from app.db.session import get_session
from app.schemas.user import UserCreate, UserRead
from app.repositories.user_repo import create_user, get_users

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