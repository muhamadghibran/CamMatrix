from fastapi import APIRouter

from app.api.v1.endpoints import auth, users, cameras, settings, recordings, public, dashboard

api_router = APIRouter()

# Endpoint publik — tidak memerlukan autentikasi
api_router.include_router(public.router, prefix="/public", tags=["public"])

api_router.include_router(auth.router, prefix="/auth", tags=["auth"])
api_router.include_router(users.router, prefix="/users", tags=["users"])
api_router.include_router(cameras.router, prefix="/cameras", tags=["cameras"])
api_router.include_router(settings.router, prefix="/settings", tags=["settings"])
api_router.include_router(recordings.router, prefix="/recordings", tags=["recordings"])
api_router.include_router(dashboard.router, prefix="/dashboard", tags=["dashboard"])
