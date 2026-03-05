from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.db.session import get_session
from app.core.config import settings
from app.core.security import hash_password, verify_password, create_access_token
from app.models.user import User
from app.schemas.auth import RegisterIn, LoginIn, TokenOut

router = APIRouter()

@router.post("/register", response_model=TokenOut)
async def register(data: RegisterIn, session: AsyncSession = Depends(get_session)):
    # 1) проверка email
    existing = (await session.execute(select(User).where(User.email == data.email))).scalar_one_or_none()
    if existing:
        raise HTTPException(status_code=400, detail="Email already used")

    # 2) проверка username
    existing = (await session.execute(select(User).where(User.username == data.username))).scalar_one_or_none()
    if existing:
        raise HTTPException(status_code=400, detail="Username already used")

    # 3) создать юзера
    user = User(
        username=data.username,
        email=data.email,
        password_hash=hash_password(data.password),
    )
    session.add(user)

    try:
        await session.commit()
    except IntegrityError:
        await session.rollback()
        raise HTTPException(status_code=400, detail="Username or email already exists")

    await session.refresh(user)

    token = create_access_token(
        subject=str(user.id),
        secret=settings.JWT_SECRET,
        alg=settings.JWT_ALG,
        minutes=settings.ACCESS_TOKEN_MINUTES,
    )
    return TokenOut(access_token=token)

@router.post("/login", response_model=TokenOut)
async def login(data: LoginIn, session: AsyncSession = Depends(get_session)):
    res = await session.execute(select(User).where(User.email == data.email).limit(1))
    user = res.scalar_one_or_none()

    # ✅ делай явные ошибки на время разработки
    if not user:
        raise HTTPException(status_code=401, detail="User not found")

    # legacy users after migration
    if user.password_hash == "LEGACY_NO_PASSWORD":
        raise HTTPException(status_code=401, detail="Legacy user. Please reset password or re-register.")

    if not verify_password(data.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Wrong password")

    token = create_access_token(
        subject=str(user.id),
        secret=settings.JWT_SECRET,
        alg=settings.JWT_ALG,
        minutes=settings.ACCESS_TOKEN_MINUTES,
    )
    return TokenOut(access_token=token)