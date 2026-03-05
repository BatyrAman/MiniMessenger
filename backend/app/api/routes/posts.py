from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from uuid import UUID
from app.db.session import get_session
from app.core.deps import get_current_user_id
from app.models.post import Post
from app.models.post_media import PostMedia
from app.schemas.posts import PostCreate, PostOut

router = APIRouter()

@router.post("/posts", response_model=PostOut)
async def create_post(
    data: PostCreate,
    session: AsyncSession = Depends(get_session),
    user_id: UUID = Depends(get_current_user_id),
):
    post = Post(author_id=user_id, caption=data.caption)
    session.add(post)
    await session.flush()

    for m in data.media:
        session.add(PostMedia(
            post_id=post.id,
            url=m.url,
            media_type=m.media_type,
            sort_order=m.sort_order,
        ))

    await session.commit()
    await session.refresh(post)

    out = PostOut.model_validate(post, from_attributes=True)
    out.media = [m for m in data.media]
    return out