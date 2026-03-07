from fastapi import FastAPI
from app.api.router import api_router

app = FastAPI(title="MiniMessenger API")

app.include_router(api_router)

from fastapi.middleware.cors import CORSMiddleware

app.add_middleware(
    CORSMiddleware,
    allow_origins=
    ["http://localhost:5173",
        "http://127.0.0.1:5173",
        "https://mini-messenger-scib.vercel.app",
        "https://minimessenger-app.vercel.app"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
