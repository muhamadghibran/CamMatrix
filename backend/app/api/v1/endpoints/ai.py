"""
AI Face Analysis Endpoint.
Endpoint terpisah — tidak mengubah kode existing sama sekali.

Routes:
  POST /api/v1/ai/analyze/{recording_id}  → mulai job analisis
  GET  /api/v1/ai/jobs/{job_id}           → cek status & progress
  GET  /api/v1/ai/jobs/{job_id}/results   → ambil hasil deteksi
  GET  /api/v1/ai/recording/{recording_id}/jobs → list semua job untuk rekaman ini
"""
import logging
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from datetime import datetime

from app.api import deps
from app.core.database import get_db, AsyncSessionLocal
from app.models.user import User
from app.models.recording import Recording
from app.models.face_analysis import FaceAnalysisJob, FaceDetection
from app.services.face_service import run_face_analysis

logger = logging.getLogger(__name__)
router = APIRouter()

RECORDINGS_BASE = "/var/www/CamMatrix/recordings"


def _resolve_video_path(minio_key: str) -> Optional[str]:
    """Ambil path file lokal dari minio_key."""
    if minio_key and minio_key.startswith("local:"):
        parts = minio_key.split(":", 2)
        return parts[2] if len(parts) >= 3 else None
    return None


async def _run_job_background(job_id: int, video_path: str):
    """Wrapper untuk menjalankan job di background task."""
    async with AsyncSessionLocal() as db:
        await run_face_analysis(job_id, video_path, db)


# ── POST /ai/analyze/{recording_id} ──────────────────────────────────────────
@router.post("/analyze/{recording_id}", summary="Mulai analisis wajah pada rekaman")
async def start_analysis(
    recording_id: int,
    background_tasks: BackgroundTasks,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(deps.get_current_user),
):
    """
    Mulai job analisis wajah pada rekaman tertentu.
    Job dijalankan di background — langsung return job_id untuk polling.
    """
    # Cari rekaman
    result = await db.execute(select(Recording).where(Recording.id == recording_id))
    rec = result.scalar_one_or_none()
    if not rec:
        raise HTTPException(status_code=404, detail="Rekaman tidak ditemukan")

    # Resolve path file video
    video_path = _resolve_video_path(rec.minio_key)
    if not video_path:
        raise HTTPException(
            status_code=422,
            detail="Rekaman ini tidak tersimpan secara lokal, tidak dapat dianalisis"
        )

    import os
    if not os.path.isfile(video_path):
        raise HTTPException(
            status_code=404,
            detail=f"File video tidak ditemukan di server: {video_path}"
        )

    # Cek apakah sudah ada job yang running/done
    existing = await db.execute(
        select(FaceAnalysisJob)
        .where(FaceAnalysisJob.recording_id == recording_id)
        .where(FaceAnalysisJob.status.in_(["pending", "running", "done"]))
        .order_by(FaceAnalysisJob.created_at.desc())
        .limit(1)
    )
    existing_job = existing.scalar_one_or_none()
    if existing_job and existing_job.status == "done":
        return {
            "job_id": existing_job.id,
            "status": "done",
            "message": "Analisis sebelumnya sudah ada. Gunakan endpoint /results untuk melihat hasilnya.",
            "faces_found": existing_job.faces_found,
        }
    if existing_job and existing_job.status in ("pending", "running"):
        return {
            "job_id": existing_job.id,
            "status": existing_job.status,
            "message": "Job sedang berjalan, pantau progress di endpoint /jobs/{job_id}",
        }

    # Buat job baru
    job = FaceAnalysisJob(recording_id=recording_id, status="pending")
    db.add(job)
    await db.flush()  # Dapatkan job.id
    await db.commit()
    await db.refresh(job)

    # Jalankan di background
    background_tasks.add_task(_run_job_background, job.id, video_path)

    return {
        "job_id": job.id,
        "status": "pending",
        "message": "Job analisis dimulai. Polling /ai/jobs/{job_id} untuk progress.",
    }


# ── GET /ai/jobs/{job_id} ─────────────────────────────────────────────────────
@router.get("/jobs/{job_id}", summary="Cek status & progress job")
async def get_job_status(
    job_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(deps.get_current_user),
):
    result = await db.execute(select(FaceAnalysisJob).where(FaceAnalysisJob.id == job_id))
    job = result.scalar_one_or_none()
    if not job:
        raise HTTPException(status_code=404, detail="Job tidak ditemukan")

    progress_pct = 0
    if job.total_frames and job.total_frames > 0:
        progress_pct = round((job.processed_frames / job.total_frames) * 100)

    return {
        "job_id": job.id,
        "recording_id": job.recording_id,
        "status": job.status,
        "progress_pct": progress_pct,
        "total_frames": job.total_frames,
        "processed_frames": job.processed_frames,
        "faces_found": job.faces_found,
        "error_msg": job.error_msg,
        "created_at": job.created_at,
        "finished_at": job.finished_at,
    }


# ── GET /ai/jobs/{job_id}/results ─────────────────────────────────────────────
@router.get("/jobs/{job_id}/results", summary="Ambil hasil deteksi wajah")
async def get_job_results(
    job_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(deps.get_current_user),
):
    result = await db.execute(select(FaceAnalysisJob).where(FaceAnalysisJob.id == job_id))
    job = result.scalar_one_or_none()
    if not job:
        raise HTTPException(status_code=404, detail="Job tidak ditemukan")
    if job.status != "done":
        raise HTTPException(status_code=425, detail=f"Job belum selesai. Status: {job.status}")

    dets = await db.execute(
        select(FaceDetection)
        .where(FaceDetection.job_id == job_id)
        .order_by(FaceDetection.timestamp_sec)
    )
    detections = dets.scalars().all()

    return {
        "job_id": job_id,
        "recording_id": job.recording_id,
        "faces_found": job.faces_found,
        "detections": [
            {
                "id": d.id,
                "timestamp_sec": d.timestamp_sec,
                "bbox": {"x": d.bbox_x, "y": d.bbox_y, "w": d.bbox_w, "h": d.bbox_h},
                "confidence": d.confidence,
                "face_crop_b64": d.face_crop_b64,
            }
            for d in detections
        ],
    }


# ── GET /ai/recording/{recording_id}/jobs ─────────────────────────────────────
@router.get("/recording/{recording_id}/jobs", summary="List semua job untuk rekaman")
async def list_recording_jobs(
    recording_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(deps.get_current_user),
):
    result = await db.execute(
        select(FaceAnalysisJob)
        .where(FaceAnalysisJob.recording_id == recording_id)
        .order_by(FaceAnalysisJob.created_at.desc())
    )
    jobs = result.scalars().all()
    return [
        {
            "job_id": j.id,
            "status": j.status,
            "faces_found": j.faces_found,
            "created_at": j.created_at,
            "finished_at": j.finished_at,
        }
        for j in jobs
    ]
