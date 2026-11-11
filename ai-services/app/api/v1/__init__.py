from fastapi import APIRouter
from app.api.v1.chat import router as chat_router
from app.api.v1.profile import router as profile_router
from app.api.v1.ingest import router as ingest_router

v1_router = APIRouter(prefix="/v1")
v1_router.include_router(chat_router)
v1_router.include_router(profile_router)
v1_router.include_router(ingest_router)

__all__ = ["v1_router"]

