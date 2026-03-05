from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from uuid import UUID
from app.db.session import get_session
from app.core.deps import get_current_user_id
from app.repositories.feed_repo import list_feed_posts
from app.schemas.posts import PostOut

router = APIRouter()

@router.get("/feed", response_model=list[PostOut])
async def feed(
    session: AsyncSession = Depends(get_session),
    user_id: UUID = Depends(get_current_user_id),
):
    posts = await list_feed_posts(session, user_id=user_id, limit=30)
    # для MVP возвращаем без агрегаций по лайкам/комментам
    return [PostOut.model_validate(p, from_attributes=True) for p in posts]