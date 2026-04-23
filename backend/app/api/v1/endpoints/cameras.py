from typing import Any, List
import asyncio
import httpx
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select

from app.api import deps
from app.core.config import settings
from app.models.camera import Camera
from app.schemas.camera import CameraCreate, CameraUpdate, CameraResponse
from app.models.user import User, UserRole
from app.core.security import encrypt_symmetric, decrypt_symmetric
from urllib.parse import quote_plus

router = APIRouter()

MEDIAMTX_API = settings.MEDIAMTX_API_URL
HLS_BASE = "http://103.180.198.240:8888"


def _path_name(user_id: int, camera_id: int) -> str:
    """Format path MediaMTX: cam_{user_id}_{camera_id} — unik per pengguna."""
    return f"cam_{user_id}_{camera_id}"


def _build_authenticated_rtsp(rtsp_url: str, username: str | None, password: str | None) -> str:
    """Menggabungkan kredensial ke dalam struktur rtsp://user:pass@ip:port"""
    if not rtsp_url or rtsp_url == "publisher" or "://" not in rtsp_url:
        return rtsp_url
    if not username or not password:
        return rtsp_url
        
    protocol, address = rtsp_url.split("://", 1)
    if "@" in address:
        return rtsp_url  # Jangan tumpuk kredensial jika URL sudah memilikinya
        
    safe_user = quote_plus(username)
    safe_pass = quote_plus(password)
    return f"{protocol}://{safe_user}:{safe_pass}@{address}"


async def get_mediamtx_status(user_id: int, camera_id: int) -> str:
    """Cek status kamera secara ASYNC via MediaMTX API."""
    try:
        path = _path_name(user_id, camera_id)
        async with httpx.AsyncClient(timeout=3.0) as client:
            res = await client.get(f"{MEDIAMTX_API}/v3/paths/get/{path}")
            if res.status_code == 200 and (res.json().get("sourceReady") or res.json().get("ready")):
                return "live"
    except Exception:
        pass
    return "offline"


async def register_camera_to_mediamtx(user_id: int, camera_id: int, rtsp_url: str):
    """Daftarkan RTSP source ke MediaMTX dengan path unik per pengguna."""
    try:
        path = _path_name(user_id, camera_id)
        async with httpx.AsyncClient(timeout=3.0) as client:
            payload = {"source": rtsp_url}
            if rtsp_url == "publisher":
                payload = {} # Kosongkan source agar MediaMTX menerima PUSH
            await client.post(
                f"{MEDIAMTX_API}/v3/config/paths/add/{path}",
                json=payload
            )
    except Exception:
        pass


async def remove_camera_from_mediamtx(user_id: int, camera_id: int):
    """Hapus path dari MediaMTX saat kamera dihapus."""
    try:
        path = _path_name(user_id, camera_id)
        async with httpx.AsyncClient(timeout=2.0) as client:
            await client.delete(f"{MEDIAMTX_API}/v3/config/paths/delete/{path}")
    except Exception:
        pass


def write_cameras_to_config(cameras: list):
    """Tulis semua kamera ke mediamtx.yml agar persist setelah restart."""
    import os
    # Gunakan path konfigurasi sistem yang sesungguhnya di Linux
    config_path = "/etc/mediamtx/mediamtx.yml"

    paths_section = ""
    for cam in cameras:
        path_name = _path_name(cam.owner_id, cam.id)
        paths_section += f"  {path_name}:\n"
        if cam.rtsp_url == "publisher":
            paths_section += f"\n" # Mode Push
        else:
            raw_pass = decrypt_symmetric(cam.password) if cam.password else None
            rtsp_source = _build_authenticated_rtsp(cam.rtsp_url, cam.username, raw_pass)
            paths_section += f"    source: {rtsp_source}\n"
            paths_section += f"    sourceOnDemandCloseAfter: 60s\n\n"

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
    path = _path_name(cam.owner_id, cam.id)
    return {
        "id": cam.id,
        "owner_id": cam.owner_id,
        "name": cam.name,
        "location": cam.location,
        "rtsp_url": cam.rtsp_url,
        "username": cam.username,
        "password": "", # Override password sebelum dikirim ke Frontend untuk keamanan
        "status": cam_status,
        "stream_url": f"{HLS_BASE}/{path}/index.m3u8",
    }


# ─────────────────────────────────────────────────────────────
# GET  /cameras/  — Hanya tampilkan kamera milik user sendiri
#                   ADMIN bisa lihat semua kamera
# ─────────────────────────────────────────────────────────────
@router.get("/", response_model=List[CameraResponse])
async def read_cameras(
    db: deps.DbSession,
    skip: int = 0,
    limit: int = 100,
    current_user: User = Depends(deps.get_current_user)
) -> Any:
    if current_user.role == UserRole.ADMIN:
        stmt = select(Camera).offset(skip).limit(limit)
    else:
        # User biasa hanya lihat kamera miliknya sendiri
        stmt = select(Camera).where(Camera.owner_id == current_user.id).offset(skip).limit(limit)

    result = await db.execute(stmt)
    cameras = result.scalars().all()
    return [camera_to_dict(cam, "offline") for cam in cameras]


# ─────────────────────────────────────────────────────────────
# GET  /cameras/statuses  — Status semua kamera milik user
# ─────────────────────────────────────────────────────────────
@router.get("/statuses")
async def get_all_camera_statuses(
    db: deps.DbSession,
    current_user: User = Depends(deps.get_current_user)
) -> Any:
    if current_user.role == UserRole.ADMIN:
        stmt = select(Camera.id, Camera.owner_id)
    else:
        stmt = select(Camera.id, Camera.owner_id).where(Camera.owner_id == current_user.id)

    result = await db.execute(stmt)
    rows = result.fetchall()
    if not rows:
        return []

    statuses = await asyncio.gather(
        *[get_mediamtx_status(row[1], row[0]) for row in rows]
    )
    return [{"id": row[0], "status": st} for row, st in zip(rows, statuses)]


# ─────────────────────────────────────────────────────────────
# GET  /cameras/{camera_id}/status
# ─────────────────────────────────────────────────────────────
@router.get("/{camera_id}/status")
async def get_camera_status(
    camera_id: int,
    db: deps.DbSession,
    current_user: User = Depends(deps.get_current_user)
) -> Any:
    camera = await _get_owned_camera(camera_id, current_user, db)
    cam_status = await get_mediamtx_status(camera.owner_id, camera_id)
    return {"id": camera_id, "status": cam_status}


# ─────────────────────────────────────────────────────────────
# POST /cameras/  — Semua user (bukan hanya ADMIN) bisa tambah
# ─────────────────────────────────────────────────────────────
@router.post("/", response_model=CameraResponse, status_code=status.HTTP_201_CREATED)
async def create_camera(
    *,
    db: deps.DbSession,
    camera_in: CameraCreate,
    current_user: User = Depends(deps.get_current_user)  # Semua user bisa tambah kamera
) -> Any:
    camera = Camera(
        owner_id=current_user.id,          # Otomatis jadi milik user yang login
        name=camera_in.name,
        location=camera_in.location,
        rtsp_url=camera_in.rtsp_url,
        username=camera_in.username or None,
        password=encrypt_symmetric(camera_in.password) if camera_in.password else None,
    )
    db.add(camera)
    await db.commit()
    await db.refresh(camera)

    # Daftarkan ke MediaMTX dengan path unik milik user ini ditambah credentials asli
    auth_url = _build_authenticated_rtsp(camera.rtsp_url, camera.username, camera_in.password)
    await register_camera_to_mediamtx(current_user.id, camera.id, auth_url)

    # Update mediamtx.yml
    all_cams_result = await db.execute(select(Camera))
    all_cams = all_cams_result.scalars().all()
    write_cameras_to_config(all_cams)

    return camera_to_dict(camera, "offline")


# ─────────────────────────────────────────────────────────────
# PUT /cameras/{camera_id}  — Hanya pemilik atau ADMIN
# ─────────────────────────────────────────────────────────────
@router.put("/{camera_id}", response_model=CameraResponse)
async def update_camera(
    *,
    db: deps.DbSession,
    camera_id: int,
    camera_in: CameraUpdate,
    current_user: User = Depends(deps.get_current_user)
) -> Any:
    camera = await _get_owned_camera(camera_id, current_user, db)

    update_data = camera_in.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        if field == "password":
            if value: # Encrypt hanya jika mengganti password baru
                setattr(camera, field, encrypt_symmetric(value))
        else:
            setattr(camera, field, value or None if isinstance(value, str) and field in ("username", "password") else value)

    db.add(camera)
    await db.commit()
    await db.refresh(camera)

    st = await get_mediamtx_status(camera.owner_id, camera.id)
    return camera_to_dict(camera, st)


# ─────────────────────────────────────────────────────────────
# DELETE /cameras/{camera_id} — Hanya pemilik atau ADMIN
# ─────────────────────────────────────────────────────────────
@router.delete("/{camera_id}")
async def delete_camera(
    *,
    db: deps.DbSession,
    camera_id: int,
    current_user: User = Depends(deps.get_current_user)
) -> Any:
    camera = await _get_owned_camera(camera_id, current_user, db)

    await remove_camera_from_mediamtx(camera.owner_id, camera_id)
    await db.delete(camera)
    await db.commit()

    remaining_result = await db.execute(select(Camera))
    remaining_cams = remaining_result.scalars().all()
    write_cameras_to_config(remaining_cams)
    return {"message": "Camera deleted successfully"}


# ─────────────────────────────────────────────────────────────
# HELPER — Pastikan kamera dimiliki user, atau user adalah ADMIN
# ─────────────────────────────────────────────────────────────
async def _get_owned_camera(camera_id: int, current_user: User, db) -> Camera:
    """Ambil kamera dan validasi kepemilikan. ADMIN bisa akses semua."""
    stmt = select(Camera).where(Camera.id == camera_id)
    result = await db.execute(stmt)
    camera = result.scalar_one_or_none()

    if not camera:
        raise HTTPException(status_code=404, detail="Camera not found")

    # ADMIN bisa akses kamera siapapun
    if current_user.role != UserRole.ADMIN and camera.owner_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Anda tidak memiliki akses ke kamera ini"
        )

    return camera
