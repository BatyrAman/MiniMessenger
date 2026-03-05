from typing import Dict, Set
from fastapi import WebSocket
import asyncio

class ConnectionManager:
    def __init__(self) -> None:
        self.rooms: Dict[str, Set[WebSocket]] = {}
        self._lock = asyncio.Lock()

    async def connect(self, room: str, ws: WebSocket) -> None:
        await ws.accept()
        async with self._lock:
            self.rooms.setdefault(room, set()).add(ws)

    async def disconnect(self, room: str, ws: WebSocket) -> None:
        async with self._lock:
            if room in self.rooms:
                self.rooms[room].discard(ws)
                if not self.rooms[room]:
                    self.rooms.pop(room, None)

    async def broadcast(self, room: str, message: dict) -> None:
        async with self._lock:
            sockets = list(self.rooms.get(room, set()))

        dead: list[WebSocket] = []
        for ws in sockets:
            try:
                await ws.send_json(message)
            except Exception:
                dead.append(ws)

        for ws in dead:
            await self.disconnect(room, ws)

manager = ConnectionManager()