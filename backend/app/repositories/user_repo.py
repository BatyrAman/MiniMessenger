from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from alembic import op
import sqlalchemy as sa
from sqlalchemy.exc import IntegrityError
from fastapi import HTTPException
from app.models.user import User

async def create_user(session, username):
    user = User(username=username)
    session.add(user)
    try:
        await session.commit()
    except IntegrityError:
        await session.rollback()
        raise HTTPException(status_code=409, detail="username already exists")
    await session.refresh(user)
    return user


async def get_users(session: AsyncSession):
    result = await session.execute(select(User))
    return result.scalars().all()


def upgrade():
    # 1) добавить nullable
    op.add_column("users", sa.Column("email", sa.String(length=120), nullable=True))

    # 2) заполнить тем, у кого NULL
    op.execute("""
        UPDATE users
        SET email = username || '@local.invalid'
        WHERE email IS NULL
    """)

    # 3) сделать NOT NULL
    op.alter_column("users", "email", existing_type=sa.String(length=120), nullable=False)

    # 4) уникальность (если надо)
    op.create_unique_constraint("uq_users_email", "users", ["email"])