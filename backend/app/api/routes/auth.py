from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from app.db.session import get_session
from app.core.config import settings
from app.core.security import hash_password, verify_password, create_access_token
from app.schemas.auth import RegisterIn, LoginIn, TokenOut
from app.repositories.auth_repo import (
    get_user_by_email, get_user_by_username, create_user
)

router = APIRouter()

@router.post("/register", response_model=TokenOut)
async def register(data: RegisterIn, session: AsyncSession = Depends(get_session)):
    if await get_user_by_email(session, data.email):
        raise HTTPException(400, "Email already used")
    if await get_user_by_username(session, data.username):
        raise HTTPException(400, "Username already used")

    user = await create_user(
        session,
        username=data.username,
        email=data.email,
        password_hash=hash_password(data.password),
    )

    token = create_access_token(
        subject=str(user.id),
        secret=settings.JWT_SECRET,
        alg=settings.JWT_ALG,
        minutes=settings.ACCESS_TOKEN_MINUTES,
    )
    return TokenOut(access_token=token)

@router.post("/login", response_model=TokenOut)
async def login(data: LoginIn, session: AsyncSession = Depends(get_session)):
    user = await get_user_by_email(session, data.email)
    if not user or not verify_password(data.password, user.password_hash):
        raise HTTPException(401, "Invalid credentials")

    token = create_access_token(
        subject=str(user.id),
        secret=settings.JWT_SECRET,
        alg=settings.JWT_ALG,
        minutes=settings.ACCESS_TOKEN_MINUTES,
    )
    return TokenOut(access_token=token)