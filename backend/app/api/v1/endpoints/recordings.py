from typing import Any, List, Optional
from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks, Query
from fastapi.responses import FileResponse
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from pathlib import Path
import os, glob, uuid, logging
from datetime import datetime

from app.api import deps
from app.models.recording import Recording
from app.models.camera import Camera
from app.schemas.recording import RecordingResponse, RecordingCreate
from app.models.user import User, UserRole
from app.core.storage import generate_presigned_url, upload_file_to_s3

logger = logging.getLogger(__name__)
router = APIRouter()

RECORDINGS_BASE = "/var/www/CamMatrix/recordings"
ALLOWED_RECORDING_ROOT = "/var/lib/mediamtx/recordings"  # kept for legacy trigger-upload

# ─── Helper: resolve file path from minio_key ───────────────────────────────
def _resolve_file_path(minio_key: str) -> Optional[str]:
    """Ekstrak path file lokal dari minio_key.
    Format lokal: 'local:{uuid}:{/abs/path/to/file.mp4}'
    """
    if minio_key.startswith("local:"):
        parts = minio_key.split(":", 2)
        return parts[2] if len(parts) >= 3 else None
    return None

# ─── Helper: cari file MP4 terbaru untuk kamera ─────────────────────────────
def _find_latest_mp4(camera: Camera) -> Optional[str]:
    path = f"cam_{camera.owner_id}_{camera.id}"
    specific_dir = os.path.join(RECORDINGS_BASE, path)

    all_mp4: list[str] = []
    if os.path.isdir(specific_dir):
        all_mp4 = glob.glob(os.path.join(specific_dir, "*.mp4"))
    if not all_mp4:
        all_mp4 = [f for f in glob.glob(
            os.path.join(RECORDINGS_BASE, "**", "*.mp4"), recursive=True
        ) if path in f]
    if not all_mp4:
        return None
    all_mp4.sort(key=os.path.getmtime, reverse=True)
    return all_mp4[0]


# ─── GET /recordings/ ────────────────────────────────────────────────────────
@router.get("/", response_model=List[RecordingResponse])
async def read_recordings(
    db: deps.DbSession,
    skip: int = 0,
    limit: int = 100,
    camera_id: int = None,
    current_user: User = Depends(deps.get_current_user_full_scope)
) -> Any:
    stmt = select(Recording, Camera).join(Camera, Recording.camera_id == Camera.id)
    if current_user.role != UserRole.ADMIN:
        stmt = stmt.where(Camera.owner_id == current_user.id)
    if camera_id is not None:
        stmt = stmt.where(Recording.camera_id == camera_id)

    stmt = stmt.order_by(Recording.created_at.desc()).offset(skip).limit(limit)
    result = await db.execute(stmt)
    rows = result.all()

    responses = []
    for rec, cam in rows:
        file_path = _resolve_file_path(rec.minio_key)
        # Untuk rekaman lokal, gunakan URL download API; untuk MinIO gunakan presigned URL
        if file_path:
            url = ""  # Frontend akan build URL dengan token
        else:
            url = generate_presigned_url(rec.minio_key) or ""
        resp = RecordingResponse.model_validate(rec).model_copy(
            update={"url": url, "camera_name": cam.name if cam else None}
        )
        responses.append(resp)
    return responses


# ─── POST /recordings/capture/{camera_id} ────────────────────────────────────
@router.post("/capture/{camera_id}", status_code=201)
async def capture_recording(
    camera_id: int,
    db: deps.DbSession,
    current_user: User = Depends(deps.get_current_user_full_scope)
) -> Any:
    """
    Simpan metadata rekaman terbaru dari kamera ke database.
    Tidak mengunduh file, hanya mencatat informasinya.
    """
    cam_result = await db.execute(select(Camera).where(Camera.id == camera_id))
    camera = cam_result.scalar_one_or_none()
    if not camera:
        raise HTTPException(status_code=404, detail="Kamera tidak ditemukan")
    if current_user.role != UserRole.ADMIN and camera.owner_id != current_user.id:
        raise HTTPException(status_code=403, detail="Akses ditolak")

    latest_file = _find_latest_mp4(camera)
    if not latest_file:
        raise HTTPException(
            status_code=404,
            detail=f"Belum ada rekaman untuk kamera '{camera.name}'. "
                   "Pastikan kamera sudah menyala beberapa menit."
        )

    file_size = os.path.getsize(latest_file)
    if file_size < 10_240:
        raise HTTPException(
            status_code=404,
            detail="File rekaman terlalu kecil. Biarkan kamera menyala lebih lama."
        )

    # Estimasi durasi berdasarkan ukuran file (kasar)
    est_duration = max(int(file_size / (350_000)), 60)  # ~350KB/s average

    # Buat unique key — format: local:{uuid}:{abs_path}
    unique_key = f"local:{uuid.uuid4().hex}:{latest_file}"

    rec = Recording(
        camera_id=camera_id,
        minio_key=unique_key,
        duration=est_duration,
        size_bytes=file_size,
    )
    db.add(rec)
    await db.commit()
    await db.refresh(rec)

    return {
        "id": rec.id,
        "camera_id": camera_id,
        "camera_name": camera.name,
        "file_size": file_size,
        "duration": est_duration,
        "created_at": rec.created_at.isoformat(),
        "message": f"Rekaman '{camera.name}' berhasil disimpan ke daftar rekaman."
    }


# ─── GET /recordings/{recording_id}/download ─────────────────────────────────
@router.get("/{recording_id}/download", response_class=FileResponse)
async def download_recording_by_id(
    recording_id: int,
    db: deps.DbSession,
    token: Optional[str] = Query(None),
    current_user: Optional[User] = Depends(deps.get_optional_user),
) -> Any:
    """
    Unduh file rekaman berdasarkan ID.
    Auth: Bearer header ATAU ?token= query param.
    """
    # Autentikasi via query token jika header tidak ada
    if current_user is None:
        if not token:
            raise HTTPException(status_code=401, detail="Token diperlukan")
        from app.core.security import decode_access_token
        payload = decode_access_token(token)
        if not payload:
            raise HTTPException(status_code=401, detail="Token tidak valid atau kadaluarsa")
        user_id = payload.get("sub")
        stmt = select(User).where(User.id == int(user_id))
        result = await db.execute(stmt)
        current_user = result.scalar_one_or_none()
        if not current_user:
            raise HTTPException(status_code=401, detail="User tidak ditemukan")

    rec_result = await db.execute(select(Recording).where(Recording.id == recording_id))
    recording = rec_result.scalar_one_or_none()
    if not recording:
        raise HTTPException(status_code=404, detail="Rekaman tidak ditemukan")

    cam_result = await db.execute(select(Camera).where(Camera.id == recording.camera_id))
    camera = cam_result.scalar_one_or_none()
    if not camera:
        raise HTTPException(status_code=404, detail="Kamera tidak ditemukan")

    if current_user.role != UserRole.ADMIN and camera.owner_id != current_user.id:
        raise HTTPException(status_code=403, detail="Akses ditolak")

    file_path = _resolve_file_path(recording.minio_key)
    if not file_path:
        raise HTTPException(status_code=400, detail="Format rekaman tidak mendukung download lokal")

    if not os.path.exists(file_path):
        raise HTTPException(
            status_code=404,
            detail="File rekaman tidak ditemukan di server. Mungkin sudah dihapus."
        )

    ts = recording.created_at.strftime("%Y%m%d_%H%M%S")
    download_name = f"{camera.name.replace(' ', '_')}_{ts}.mp4"

    return FileResponse(path=file_path, filename=download_name, media_type="video/mp4")


# ─── DELETE /recordings/{recording_id} ───────────────────────────────────────
@router.delete("/{recording_id}")
async def delete_recording(
    recording_id: int,
    db: deps.DbSession,
    current_user: User = Depends(deps.get_current_admin)
) -> Any:
    stmt = select(Recording).where(Recording.id == recording_id)
    result = await db.execute(stmt)
    recording = result.scalar_one_or_none()
    if not recording:
        raise HTTPException(status_code=404, detail="Recording not found")
    await db.delete(recording)
    await db.commit()
    return {"message": "Recording deleted"}


# ─── Legacy: POST /recordings/trigger-upload ─────────────────────────────────
def upload_job_sync(file_path: str, camera_id: int, minio_key: str):
    try:
        success = upload_file_to_s3(file_path, minio_key)
        if success:
            os.remove(file_path)
    except Exception:
        logger.exception(f"Upload job failed for {file_path}")

@router.post("/trigger-upload", status_code=202)
async def trigger_upload(
    camera_id: int,
    background_tasks: BackgroundTasks,
    db: deps.DbSession,
    current_user: User = Depends(deps.get_current_admin)
):
    """Legacy: Upload rekaman ke MinIO."""
    cam_result = await db.execute(select(Camera).where(Camera.id == camera_id))
    camera = cam_result.scalar_one_or_none()
    if not camera:
        raise HTTPException(status_code=404, detail="Camera not found")
    if current_user.role != UserRole.ADMIN and camera.owner_id != current_user.id:
        raise HTTPException(status_code=403, detail="Akses ditolak")

    cam_path = f"cam_{camera.owner_id}_{camera.id}"
    file_path = os.path.join(ALLOWED_RECORDING_ROOT, cam_path, "latest.mp4")
    real_path = os.path.realpath(file_path)
    if not real_path.startswith(os.path.realpath(ALLOWED_RECORDING_ROOT)):
        raise HTTPException(status_code=400, detail="Path tidak valid")
    if not os.path.exists(file_path):
        raise HTTPException(status_code=400, detail="File rekaman belum tersedia")

    file_size = os.path.getsize(file_path)
    file_name = Path(file_path).name
    minio_key = f"camera_{camera_id}/{file_name}"

    rec = Recording(camera_id=camera_id, minio_key=minio_key, duration=300, size_bytes=file_size)
    db.add(rec)
    await db.commit()
    background_tasks.add_task(upload_job_sync, file_path, camera_id, minio_key)
    return {"message": "Upload triggered"}
