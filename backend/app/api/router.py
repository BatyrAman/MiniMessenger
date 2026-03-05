from fastapi import APIRouter
from app.api.routes import users, conversations, messages, ws, auth, posts, feed

api_router = APIRouter()
api_router.include_router(users.router, prefix="/users", tags=["users"])
api_router.include_router(conversations.router, prefix="/conversations", tags=["conversations"])
api_router.include_router(messages.router, prefix="/messages", tags=["messages"])
api_router.include_router(ws.router, tags=["ws"])

api_router.include_router(auth.router, prefix="/auth", tags=["auth"])
api_router.include_router(posts.router, tags=["posts"])
api_router.include_router(feed.router, tags=["feed"])