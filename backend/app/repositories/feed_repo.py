from uuid import UUID
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc
from app.models.post import Post
from app.models.follow import Follow

async def list_feed_posts(session: AsyncSession, *, user_id: UUID, limit: int = 30):
    # посты авторов, на которых подписан user_id, плюс свои
    followed = select(Follow.following_id).where(Follow.follower_id == user_id)
    stmt = (
        select(Post)
        .where((Post.author_id.in_(followed)) | (Post.author_id == user_id))
        .order_by(desc(Post.created_at))
        .limit(limit)
    )
    res = await session.execute(stmt)
    return res.scalars().all()