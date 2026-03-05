# app/core/security.py
from datetime import datetime, timedelta, timezone
from passlib.context import CryptContext
from jose import jwt

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def _ensure_password(password: str) -> str:
    if not isinstance(password, str):
        raise TypeError("password must be a string")
    password = password.strip()
    if len(password.encode("utf-8")) > 72:
        # bcrypt limitation
        raise ValueError("Password too long (bcrypt max 72 bytes)")
    return password

def hash_password(password: str) -> str:
    password = _ensure_password(password)
    return pwd_context.hash(password)

def verify_password(password: str, password_hash: str) -> bool:
    password = _ensure_password(password)
    return pwd_context.verify(password, password_hash)

def create_access_token(*, subject: str, secret: str, alg: str, minutes: int) -> str:
    now = datetime.now(timezone.utc)
    payload = {
        "sub": subject,
        "iat": int(now.timestamp()),
        "exp": int((now + timedelta(minutes=minutes)).timestamp()),
    }
    return jwt.encode(payload, secret, algorithm=alg)