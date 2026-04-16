from typing import Any, List
import asyncio
import httpx
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select

from app.api import deps
from app.core.config import settings
from app.models.camera import Camera
from app.schemas.camera import CameraCreate, CameraUpdate, CameraResponse
from app.models.user import User

router = APIRouter()

MEDIAMTX_API = settings.MEDIAMTX_API_URL
HLS_BASE = "http://localhost:8888"   # Port HLS MediaMTX (lebih stabil dari WebRTC di Docker)



async def get_mediamtx_status(camera_id: int) -> str:
    """Cek status kamera secara ASYNC via MediaMTX API."""
    try:
        async with httpx.AsyncClient(timeout=3.0) as client:  # Naikkan timeout ke 3 detik
            res = await client.get(f"{MEDIAMTX_API}/v3/paths/get/cam_{camera_id}")
            if res.status_code == 200 and res.json().get("ready"):
                return "live"
    except Exception:
        pass
    return "offline"


async def register_camera_to_mediamtx(camera_id: int, rtsp_url: str):
    """Daftarkan RTSP source ke MediaMTX agar bisa diakses via WebRTC."""
    try:
        async with httpx.AsyncClient(timeout=3.0) as client:
            await client.post(
                f"{MEDIAMTX_API}/v3/config/paths/add/cam_{camera_id}",
                json={"source": rtsp_url}  # MediaMTX akan pull dari URL ini
            )
    except Exception:
        pass


async def remove_camera_from_mediamtx(camera_id: int):
    """Hapus path dari MediaMTX saat kamera dihapus."""
    try:
        async with httpx.AsyncClient(timeout=2.0) as client:
            await client.delete(f"{MEDIAMTX_API}/v3/config/paths/delete/cam_{camera_id}")
    except Exception:
        pass


def write_cameras_to_config(cameras: list):
    """Tulis semua kamera ke mediamtx.yml agar persist setelah Docker restart."""
    import os
    config_path = os.path.abspath(
        os.path.join(os.path.dirname(__file__), "..", "..", "..", "..", "..", "media_server", "mediamtx.yml")
    )

    # Build paths section
    paths_section = ""
    for cam in cameras:
        path_name = f"cam_{cam.id}"
        paths_section += f"  {path_name}:\n"
        paths_section += f"    source: {cam.rtsp_url}\n"
        paths_section += f"    sourceOnDemandCloseAfter: 60s\n"
        paths_section += f"\n"

    content = f"""###############################################################
# MediaMTX Configuration — CCTV VMS Platform (Auto-generated)
###############################################################

rtspAddress: :8554
webrtcAddress: :8889

hlsAddress: :8888
hlsAlwaysRemux: yes
hlsSegmentDuration: 2s
hlsPartDuration: 500ms

api: yes
apiAddress: :9997

logLevel: info
logDestinations: [stdout]

authInternalUsers:
  - user: any
    pass:
    ips: []
    permissions:
      - action: publish
      - action: read
      - action: playback
      - action: api

paths:
  all_others:

{paths_section}"""

    try:
        with open(config_path, "w", encoding="utf-8") as f:
            f.write(content)
        print(f"✅ mediamtx.yml diperbarui dengan {len(cameras)} kamera")
    except Exception as e:
        print(f"⚠️  Gagal menulis mediamtx.yml: {e}")

def camera_to_dict(cam: Camera, cam_status: str = "offline") -> dict:
    """Ubah model SQLAlchemy ke dict bersih untuk response Pydantic."""
    return {
        "id": cam.id,
        "name": cam.name,
        "location": cam.location,
        "rtsp_url": cam.rtsp_url,
        "username": cam.username,
        "password": cam.password,
        "status": cam_status,
        # HLS lebih stabil di Docker daripada WebRTC (tidak ada ICE/NAT issue)
        "stream_url": f"{HLS_BASE}/cam_{cam.id}/index.m3u8",
    }


@router.get("/", response_model=List[CameraResponse])
async def read_cameras(
    db: deps.DbSession,
    skip: int = 0,
    limit: int = 100,
    current_user: User = Depends(deps.get_current_user)
) -> Any:
    stmt = select(Camera).offset(skip).limit(limit)
    result = await db.execute(stmt)
    cameras = result.scalars().all()
    # Kembalikan langsung tanpa menunggu status MediaMTX
    # Status diambil secara terpisah via endpoint /status
    return [camera_to_dict(cam, "offline") for cam in cameras]


@router.get("/statuses")
async def get_all_camera_statuses(
    db: deps.DbSession,
    current_user: User = Depends(deps.get_current_user)
) -> Any:
    """Mengembalikan status semua kamera dalam 1 request (batch) via MediaMTX."""
    stmt = select(Camera.id)
    result = await db.execute(stmt)
    ids = [row[0] for row in result.fetchall()]
    if not ids:
        return []
    # Cek semua status secara paralel
    statuses = await asyncio.gather(*[get_mediamtx_status(cam_id) for cam_id in ids])
    return [{"id": cam_id, "status": st} for cam_id, st in zip(ids, statuses)]


@router.get("/{camera_id}/status")
async def get_camera_status(
    camera_id: int,
    db: deps.DbSession,
    current_user: User = Depends(deps.get_current_user)
) -> Any:
    """Cek status satu kamera secara realtime."""
    stmt = select(Camera).where(Camera.id == camera_id)
    result = await db.execute(stmt)
    camera = result.scalar_one_or_none()
    if not camera:
        raise HTTPException(status_code=404, detail="Camera not found")
    cam_status = await get_mediamtx_status(camera_id)
    return {"id": camera_id, "status": cam_status}


@router.post("/", response_model=CameraResponse, status_code=status.HTTP_201_CREATED)
async def create_camera(
    *,
    db: deps.DbSession,
    camera_in: CameraCreate,
    current_user: User = Depends(deps.get_current_admin)
) -> Any:
    camera = Camera(
        name=camera_in.name,
        location=camera_in.location,
        rtsp_url=camera_in.rtsp_url,
        username=camera_in.username or None,
        password=camera_in.password or None,
    )
    db.add(camera)
    await db.commit()
    await db.refresh(camera)
    # Daftarkan ke MediaMTX via API (langsung aktif)
    await register_camera_to_mediamtx(camera.id, camera.rtsp_url)
    # Tulis juga ke mediamtx.yml agar bertahan setelah Docker restart
    all_cams_result = await db.execute(select(Camera))
    all_cams = all_cams_result.scalars().all()
    write_cameras_to_config(all_cams)
    return camera_to_dict(camera, "offline")


@router.put("/{camera_id}", response_model=CameraResponse)
async def update_camera(
    *,
    db: deps.DbSession,
    camera_id: int,
    camera_in: CameraUpdate,
    current_user: User = Depends(deps.get_current_admin)
) -> Any:
    stmt = select(Camera).where(Camera.id == camera_id)
    result = await db.execute(stmt)
    camera = result.scalar_one_or_none()

    if not camera:
        raise HTTPException(status_code=404, detail="Camera not found")

    update_data = camera_in.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        # Konversi string kosong jadi None untuk field opsional
        setattr(camera, field, value or None if isinstance(value, str) and field in ("username", "password") else value)

    db.add(camera)
    await db.commit()
    await db.refresh(camera)

    st = await get_mediamtx_status(camera.id)
    return camera_to_dict(camera, st)


@router.delete("/{camera_id}")
async def delete_camera(
    *,
    db: deps.DbSession,
    camera_id: int,
    current_user: User = Depends(deps.get_current_user)
) -> Any:
    stmt = select(Camera).where(Camera.id == camera_id)
    result = await db.execute(stmt)
    camera = result.scalar_one_or_none()

    if not camera:
        raise HTTPException(status_code=404, detail="Camera not found")

    # Hapus path dari MediaMTX terlebih dahulu
    await remove_camera_from_mediamtx(camera_id)
    await db.delete(camera)
    await db.commit()
    # Perbarui mediamtx.yml agar kamera ini tidak muncul setelah restart
    remaining_result = await db.execute(select(Camera))
    remaining_cams = remaining_result.scalars().all()
    write_cameras_to_config(remaining_cams)
    return {"message": "Camera deleted successfully"}
