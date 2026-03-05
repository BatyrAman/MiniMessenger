from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.models.user import User

async def get_user_by_email(session: AsyncSession, email: str) -> User | None:
    res = await session.execute(select(User).where(User.email == email).limit(1))
    return res.scalar_one_or_none()

async def get_user_by_username(session: AsyncSession, username: str) -> User | None:
    res = await session.execute(select(User).where(User.username == username).limit(1))
    return res.scalar_one_or_none()

async def create_user(session: AsyncSession, *, username: str, email: str, password_hash: str) -> User:
    user = User(username=username, email=email, password_hash=password_hash)
    session.add(user)
    await session.commit()
    await session.refresh(user)
    return user