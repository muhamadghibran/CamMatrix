"""
Endpoint publik statistik dashboard — data real dari database dan MediaMTX.
"""
from typing import Any
import asyncio
import httpx
from fastapi import APIRouter, Depends
from sqlalchemy import select, func

from app.api import deps
from app.models.camera import Camera
from app.models.recording import Recording
from app.models.user import User
from app.core.config import settings
from app.api.v1.endpoints.cameras import _path_name

router = APIRouter()

MEDIAMTX_API = settings.MEDIAMTX_API_URL


async def _check_cam_live(owner_id: int, cam_id: int) -> bool:
    """Cek apakah kamera sedang live di MediaMTX."""
    try:
        path = _path_name(owner_id, cam_id)
        async with httpx.AsyncClient(timeout=2.0) as client:
            res = await client.get(f"{MEDIAMTX_API}/v3/paths/get/{path}")
            if res.status_code == 200:
                data = res.json()
                return bool(data.get("sourceReady") or data.get("ready"))
    except Exception:
        pass
    return False


@router.get("/stats")
async def dashboard_stats(
    db: deps.DbSession,
    current_user: User = Depends(deps.get_current_user_full_scope)
) -> Any:
    """
    Statistik dashboard: jumlah kamera, live, rekaman, pengguna, storage.
    Data real dari database + MediaMTX API.
    """
    # Ambil semua kamera
    cam_result = await db.execute(select(Camera))
    cameras = cam_result.scalars().all()

    # Cek status live secara parallel
    live_statuses = await asyncio.gather(
        *[_check_cam_live(cam.owner_id, cam.id) for cam in cameras]
    )

    total_cameras = len(cameras)
    live_count    = sum(live_statuses)
    offline_count = total_cameras - live_count

    # Hitung rekaman
    rec_result = await db.execute(select(func.count(Recording.id)))
    total_recordings = rec_result.scalar() or 0

    # Hitung storage (bytes → GB)
    size_result = await db.execute(select(func.sum(Recording.size_bytes)))
    total_bytes = size_result.scalar() or 0
    storage_gb  = round(total_bytes / (1024 ** 3), 2)

    # Hitung pengguna aktif
    user_result = await db.execute(
        select(func.count(User.id)).where(User.is_active == True)
    )
    active_users = user_result.scalar() or 0

    return {
        "total_cameras":   total_cameras,
        "live_cameras":    live_count,
        "offline_cameras": offline_count,
        "total_recordings": total_recordings,
        "storage_gb":      storage_gb,
        "active_users":    active_users,
    }


@router.get("/cameras-status")
async def cameras_status(
    db: deps.DbSession,
    current_user: User = Depends(deps.get_current_user_full_scope)
) -> Any:
    """
    Status real setiap kamera untuk tabel Status Kamera di dashboard.
    """
    cam_result = await db.execute(select(Camera))
    cameras = cam_result.scalars().all()

    live_statuses = await asyncio.gather(
        *[_check_cam_live(cam.owner_id, cam.id) for cam in cameras]
    )

    return [
        {
            "id":       cam.id,
            "name":     cam.name,
            "location": cam.location or "",
            "status":   "live" if is_live else "offline",
        }
        for cam, is_live in zip(cameras, live_statuses)
    ]
