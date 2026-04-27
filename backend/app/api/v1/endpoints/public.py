"""
Endpoint publik — tidak memerlukan autentikasi.
Hanya mengembalikan data yang aman untuk ditampilkan ke viewer umum.
"""
from typing import Any, List
import asyncio
from fastapi import APIRouter
from sqlalchemy import select

from app.api import deps
from app.models.camera import Camera
from app.core.config import settings
from app.api.v1.endpoints.cameras import _path_name, get_mediamtx_status

router = APIRouter()

HLS_BASE = settings.HLS_BASE_URL


@router.get("/cameras", tags=["public"])
async def public_cameras(db: deps.DbSession) -> Any:
    """
    Daftar kamera yang tersedia untuk viewer publik.
    TIDAK memerlukan login. TIDAK mengembalikan credentials.
    Hanya mengembalikan nama, lokasi, dan stream_url HLS.
    """
    result = await db.execute(select(Camera).where(Camera.is_public == True))
    cameras = result.scalars().all()

    # Cek status semua kamera secara async
    statuses = await asyncio.gather(
        *[get_mediamtx_status(cam.owner_id, cam.id) for cam in cameras]
    )

    return [
        {
            "id": cam.id,
            "name": cam.name,
            "location": cam.location or "",
            "status": st,
            "stream_url": f"{HLS_BASE}/{_path_name(cam.owner_id, cam.id)}/index.m3u8",
        }
        for cam, st in zip(cameras, statuses)
    ]
