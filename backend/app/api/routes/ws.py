from uuid import UUID
from fastapi import APIRouter, WebSocket, WebSocketDisconnect

from app.db.session import AsyncSessionLocal
from app.repositories.conversations_repo import is_member
from app.realtime.manager import manager

router = APIRouter()

@router.websocket("/ws/conversations/{conversation_id}")
async def ws_conversation(websocket: WebSocket, conversation_id: UUID):
    user_id_str = websocket.query_params.get("user_id")
    if not user_id_str:
        await websocket.close(code=4401)  # unauthorized
        return

    try:
        user_id = UUID(user_id_str)
    except Exception:
        await websocket.close(code=4400)  # bad request
        return

    async with AsyncSessionLocal() as session:
        ok = await is_member(session, conversation_id, user_id)
        if not ok:
            await websocket.close(code=4403)  # forbidden
            return

    room = str(conversation_id)
    await manager.connect(room, websocket)

    try:
        while True:
            # можно слушать ping/служебные сообщения
            _ = await websocket.receive_text()
    except WebSocketDisconnect:
        pass
    finally:
        await manager.disconnect(room, websocket)