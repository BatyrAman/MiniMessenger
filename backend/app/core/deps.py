# app/core/deps.py
from uuid import UUID
from fastapi import Depends, HTTPException
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials

from jose import jwt, JWTError
from app.core.config import settings

bearer = HTTPBearer(auto_error=False)

def get_current_user_id(
    creds: HTTPAuthorizationCredentials | None = Depends(bearer),
) -> UUID:
    if not creds:
        raise HTTPException(status_code=401, detail="Missing token")

    token = creds.credentials
    try:
        payload = jwt.decode(token, settings.JWT_SECRET, algorithms=[settings.JWT_ALG])
        sub = payload.get("sub")
        if not sub:
            raise HTTPException(status_code=401, detail="Invalid token")
        return UUID(sub)
    except (JWTError, ValueError):
        raise HTTPException(status_code=401, detail="Invalid token")