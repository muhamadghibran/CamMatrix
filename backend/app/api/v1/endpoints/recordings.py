from typing import Any, List
from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from pathlib import Path
import os
from datetime import datetime

from app.api import deps
from app.models.recording import Recording
from app.schemas.recording import RecordingResponse, RecordingCreate
from app.models.user import User
from app.core.storage import generate_presigned_url, upload_file_to_s3

router = APIRouter()

@router.get("/", response_model=List[RecordingResponse])
async def read_recordings(
    db: deps.DbSession,
    skip: int = 0,
    limit: int = 100,
    camera_id: int = None,
    current_user: User = Depends(deps.get_current_user)
) -> Any:
    stmt = select(Recording)
    if camera_id is not None:
        stmt = stmt.where(Recording.camera_id == camera_id)
        
    stmt = stmt.order_by(Recording.created_at.desc()).offset(skip).limit(limit)
    result = await db.execute(stmt)
    recordings = result.scalars().all()
    
    response_list = []
    for rec in recordings:
        rec_dict = rec.__dict__.copy()
        rec_dict["url"] = generate_presigned_url(rec.minio_key) or ""
        response_list.append(rec_dict)
        
    return response_list

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
         
    # Deletion in s3 omitted for brevity, but should be here.
    await db.delete(recording)
    await db.commit()
    return {"message": "Recording deleted"}


def upload_job_sync(file_path: str, camera_id: int, minio_key: str):
    success = upload_file_to_s3(file_path, minio_key)
    if success:
         # delete local file
         os.remove(file_path)

@router.post("/trigger-upload", status_code=202)
async def trigger_upload(
    camera_id: int, 
    file_path: str,
    background_tasks: BackgroundTasks,
    db: deps.DbSession,
    current_user: User = Depends(deps.get_current_admin)
):
    """
    Simulate worker triggering an upload of an .mp4 file.
    MediaMTX creates the file in `file_path`. We upload it, delete it locally, and save to db.
    """
    if not os.path.exists(file_path):
        raise HTTPException(status_code=400, detail="File does not exist")
        
    file_size = os.path.getsize(file_path)
    file_name = Path(file_path).name
    # Assuming the structure is cam_id/timestamp.mp4
    minio_key = f"camera_{camera_id}/{file_name}"
    
    # Save to db
    rec = Recording(
        camera_id=camera_id,
        minio_key=minio_key,
        duration=300, # Approx 5 mins chunks
        size_bytes=file_size
    )
    db.add(rec)
    await db.commit()
    
    # Trigger background upload
    background_tasks.add_task(upload_job_sync, file_path, camera_id, minio_key)
    return {"message": "Upload triggered"}
