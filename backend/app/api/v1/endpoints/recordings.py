from typing import Any, List
from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from pathlib import Path
import os
import logging
from datetime import datetime

from app.api import deps
from app.models.recording import Recording
from app.models.camera import Camera
from app.schemas.recording import RecordingResponse, RecordingCreate
from app.models.user import User, UserRole
from app.core.storage import generate_presigned_url, upload_file_to_s3

logger = logging.getLogger(__name__)
router = APIRouter()

# Path root yang diizinkan untuk upload (C6: mencegah arbitrary file read)
ALLOWED_RECORDING_ROOT = "/var/lib/mediamtx/recordings"

@router.get("/", response_model=List[RecordingResponse])
async def read_recordings(
    db: deps.DbSession,
    skip: int = 0,
    limit: int = 100,
    camera_id: int = None,
    current_user: User = Depends(deps.get_current_user)
) -> Any:
    # C5: Join ke Camera, filter berdasarkan owner_id kecuali ADMIN
    stmt = select(Recording).join(Camera)
    if current_user.role != UserRole.ADMIN:
        stmt = stmt.where(Camera.owner_id == current_user.id)
    if camera_id is not None:
        stmt = stmt.where(Recording.camera_id == camera_id)

    stmt = stmt.order_by(Recording.created_at.desc()).offset(skip).limit(limit)
    result = await db.execute(stmt)
    recordings = result.scalars().all()

    # C7: Gunakan Pydantic model_validate, bukan __dict__.copy()
    return [
        RecordingResponse.model_validate(rec).model_copy(
            update={"url": generate_presigned_url(rec.minio_key) or ""}
        )
        for rec in recordings
    ]

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
    """
    Trigger upload rekaman MP4 dari path internal MediaMTX ke MinIO.
    C6: file_path tidak lagi diterima dari user — dikonstruksi internal dari camera_id.
    """
    # C6: Konstruksi path dari konvensi internal, bukan dari input user
    cam_result = await db.execute(select(Camera).where(Camera.id == camera_id))
    camera = cam_result.scalar_one_or_none()
    if not camera:
        raise HTTPException(status_code=404, detail="Camera not found")
    if current_user.role != UserRole.ADMIN and camera.owner_id != current_user.id:
        raise HTTPException(status_code=403, detail="Akses ditolak")

    # Path konvensi MediaMTX: /var/lib/mediamtx/recordings/{cam_path}/latest.mp4
    cam_path = f"cam_{camera.owner_id}_{camera.id}"
    file_path = os.path.join(ALLOWED_RECORDING_ROOT, cam_path, "latest.mp4")

    # Validasi path tidak keluar dari ALLOWED_RECORDING_ROOT (mencegah path traversal)
    real_path = os.path.realpath(file_path)
    if not real_path.startswith(os.path.realpath(ALLOWED_RECORDING_ROOT)):
        raise HTTPException(status_code=400, detail="Path tidak valid")

    if not os.path.exists(file_path):
        raise HTTPException(status_code=400, detail="File rekaman belum tersedia")

    file_size = os.path.getsize(file_path)
    file_name = Path(file_path).name
    minio_key = f"camera_{camera_id}/{file_name}"

    rec = Recording(
        camera_id=camera_id,
        minio_key=minio_key,
        duration=300,
        size_bytes=file_size
    )
    db.add(rec)
    await db.commit()

    background_tasks.add_task(upload_job_sync, file_path, camera_id, minio_key)
    return {"message": "Upload triggered"}
