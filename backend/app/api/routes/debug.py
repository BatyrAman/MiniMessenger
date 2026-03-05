# app/api/routes/debug.py
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import text
from app.db.session import get_session

router = APIRouter()

@router.get("/db-ping")
async def db_ping(session: AsyncSession = Depends(get_session)):
    r = await session.execute(text("select 1"))
    return {"ok": True, "value": r.scalar_one()}