"""
Endpoint Cross-Camera Person Tracking.

Routes:
  POST /api/v1/ai/track          → mulai sesi tracking (pilih rekaman)
  GET  /api/v1/ai/track/{id}     → status sesi tracking
  GET  /api/v1/ai/persons        → daftar semua orang terdeteksi
  GET  /api/v1/ai/persons/{id}   → detail trail satu orang
  DELETE /api/v1/ai/persons      → reset semua data tracking
"""
import logging
from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, delete
from typing import List, Optional

from app.api import deps
from app.api.deps import get_current_admin
from app.core.database import get_db, AsyncSessionLocal
from app.models.user import User
from app.models.recording import Recording
from app.models.person_tracking import TrackedPerson, PersonSighting, TrackingSession
from app.services.tracking_service import run_cross_camera_tracking
from app.services.realtime_detection import _FACE_REC_AVAILABLE

logger = logging.getLogger(__name__)
router = APIRouter()


async def _run_bg(session_id: int, recording_ids: list[int]):
    async with AsyncSessionLocal() as db:
        await run_cross_camera_tracking(session_id, recording_ids, db)


# ── POST /ai/track ────────────────────────────────────────────────────────────
@router.post("/track", summary="Mulai sesi tracking lintas kamera")
async def start_tracking(
    background_tasks: BackgroundTasks,
    recording_ids: Optional[List[int]] = None,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(deps.get_current_user),
):
    """
    Mulai tracking. Jika recording_ids tidak dikirim → analisis SEMUA rekaman.
    """
    # Tentukan rekaman yang akan dianalisis
    if recording_ids:
        result = await db.execute(
            select(Recording).where(Recording.id.in_(recording_ids))
        )
    else:
        result = await db.execute(select(Recording))

    recordings = result.scalars().all()
    if not recordings:
        return {
            "session_id": 0,
            "status": "done",
            "recordings_to_analyze": 0,
            "persons_found": 0,
            "message": "Belum ada file rekaman video di server. AI melacak wajah secara otomatis dari Live Stream kamera.",
        }

    ids = [r.id for r in recordings]

    # Buat sesi baru
    session = TrackingSession(status="pending")
    db.add(session)
    await db.flush()
    await db.commit()
    await db.refresh(session)

    background_tasks.add_task(_run_bg, session.id, ids)

    return {
        "session_id": session.id,
        "status": "pending",
        "recordings_to_analyze": len(ids),
        "message": f"Tracking {len(ids)} rekaman dimulai. Poll /ai/track/{session.id} untuk progress.",
    }


# ── POST /ai/scan-live ────────────────────────────────────────────────────────
@router.post("/scan-live", summary="Trigger scan wajah live stream langsung")
async def scan_live_cameras(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(deps.get_current_user),
):
    """
    Trigger scan wajah langsung dari seluruh kamera yang aktif saat ini.
    """
    import cv2
    import time
    import base64
    from sqlalchemy import select
    from app.models.camera import Camera
    from app.services.realtime_detection import _process_realtime_sighting, _get_cascade, get_detector
    from app.api.v1.endpoints.cameras import get_mediamtx_status
    from app.core.config import settings

    # Ambil semua kamera
    stmt = select(Camera)
    result = await db.execute(stmt)
    cameras = result.scalars().all()

    total_faces = 0
    scanned_cams = 0
    cascade = _get_cascade()
    now = time.time()

    for cam in cameras:
        st = await get_mediamtx_status(cam.owner_id, cam.id)
        if st != "live":
            continue

        scanned_cams += 1
        path = f"cam_{cam.owner_id}_{cam.id}"
        rtsp_urls = [
            f"{settings.MEDIAMTX_RTSP_BASE}/{path}",
            f"http://127.0.0.1:8888/{path}/index.m3u8",
        ]

        frame = None
        for u in rtsp_urls:
            cap = cv2.VideoCapture(u)
            if cap.isOpened():
                for _ in range(3):  # Lewati buffering awal untuk frame teranyar
                    ret, f = cap.read()
                    if ret and f is not None and f.size > 0:
                        frame = f
                cap.release()
                if frame is not None:
                    break

        if frame is None or frame.size == 0:
            continue

        h_img, w_img = frame.shape[:2]
        gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
        raw_faces = cascade.detectMultiScale(gray, scaleFactor=1.1, minNeighbors=3, minSize=(24, 24))

        for (sx, sy, sw, sh) in raw_faces:
            aspect_ratio = sw / max(1, sh)
            if not (0.6 <= aspect_ratio <= 1.4):
                continue

            total_faces += 1
            face_crop = frame[max(0, sy):min(h_img, sy+sh), max(0, sx):min(w_img, sx+sw)]
            if face_crop.size == 0:
                continue

            face_small = cv2.resize(face_crop, (64, 64))
            _, buf = cv2.imencode(".jpg", face_small, [cv2.IMWRITE_JPEG_QUALITY, 65])
            crop_b64 = base64.b64encode(buf).decode("utf-8")

            embedding = None
            try:
                if _FACE_REC_AVAILABLE:
                    import face_recognition
                    rgb_crop = cv2.cvtColor(face_crop, cv2.COLOR_BGR2RGB)
                    loc = [(0, sw, sh, 0)]
                    encs = face_recognition.face_encodings(rgb_crop, loc)
                    if encs:
                        embedding = encs[0].tolist()
            except BaseException:
                pass

            await _process_realtime_sighting(
                db=db,
                camera_id=cam.id,
                camera_name=cam.name,
                embedding=embedding,
                thumbnail=crop_b64,
                timestamp=now,
            )

    if total_faces > 0:
        await db.commit()

    return {
        "status": "success",
        "active_cameras": scanned_cams,
        "total_faces_now": total_faces,
        "message": f"Scan selesai: {total_faces} wajah terdeteksi dari {scanned_cams} kamera aktif",
    }


# ── GET /ai/track/{session_id} ────────────────────────────────────────────────
@router.get("/track/{session_id}", summary="Status sesi tracking")
async def get_tracking_status(
    session_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(deps.get_current_user),
):
    result = await db.execute(
        select(TrackingSession).where(TrackingSession.id == session_id)
    )
    session = result.scalar_one_or_none()
    if not session:
        raise HTTPException(status_code=404, detail="Sesi tidak ditemukan")

    return {
        "session_id": session.id,
        "status": session.status,
        "recordings_analyzed": session.recordings_analyzed,
        "persons_found": session.persons_found,
        "error_msg": session.error_msg,
        "created_at": session.created_at,
        "finished_at": session.finished_at,
    }


# ── GET /ai/persons ───────────────────────────────────────────────────────────
@router.get("/persons", summary="Daftar semua orang yang terdeteksi lintas kamera")
async def list_persons(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(deps.get_current_user),
):
    """
    Return: daftar TrackedPerson dengan sighting summary (camera trail).
    """
    persons_result = await db.execute(
        select(TrackedPerson).order_by(TrackedPerson.created_at.desc())
    )
    persons = persons_result.scalars().all()

    out = []
    for p in persons:
        # Ambil sightings untuk person ini, urut kronologis berdasarkan waktu
        sightings_result = await db.execute(
            select(PersonSighting)
            .where(PersonSighting.person_id == p.id)
            .order_by(PersonSighting.first_timestamp_sec)
        )
        sightings = sightings_result.scalars().all()

        out.append({
            "person_id":          p.id,
            "first_thumbnail":    p.first_thumbnail,
            "first_camera_name":  p.first_camera_name,
            "total_cameras":      len(set(s.camera_name for s in sightings if s.camera_name)),
            "total_sightings":    p.total_sightings,
            "trail": [
                {
                    "step":                i + 1,
                    "camera_name":        s.camera_name,
                    "camera_id":          s.camera_id,
                    "recording_id":       s.recording_id,
                    "first_timestamp_sec": s.first_timestamp_sec,
                    "last_timestamp_sec":  s.last_timestamp_sec,
                    "frame_count":         s.frame_count,
                    "thumbnail":           s.thumbnail,
                }
                for i, s in enumerate(sightings)
            ],
        })
    return out


# ── GET /ai/persons/{person_id} ───────────────────────────────────────────────
@router.get("/persons/{person_id}", summary="Detail trail satu orang")
async def get_person_trail(
    person_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(deps.get_current_user),
):
    p_result = await db.execute(
        select(TrackedPerson).where(TrackedPerson.id == person_id)
    )
    p = p_result.scalar_one_or_none()
    if not p:
        raise HTTPException(status_code=404, detail="Orang tidak ditemukan")

    sightings_result = await db.execute(
        select(PersonSighting)
        .where(PersonSighting.person_id == person_id)
        .order_by(PersonSighting.first_timestamp_sec)
    )
    sightings = sightings_result.scalars().all()

    return {
        "person_id":  p.id,
        "first_thumbnail": p.first_thumbnail,
        "first_camera_name": p.first_camera_name,
        "total_sightings": p.total_sightings,
        "trail": [
            {
                "step":               i + 1,
                "camera_name":        s.camera_name,
                "camera_id":          s.camera_id,
                "recording_id":       s.recording_id,
                "first_timestamp_sec": s.first_timestamp_sec,
                "last_timestamp_sec":  s.last_timestamp_sec,
                "frame_count":         s.frame_count,
                "thumbnail":           s.thumbnail,
            }
            for i, s in enumerate(sightings)
        ],
    }


# ── DELETE /ai/persons ────────────────────────────────────────────────────────
@router.delete("/persons", summary="Reset semua data tracking")
async def reset_tracking(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(deps.get_current_admin),
):
    await db.execute(delete(PersonSighting))
    await db.execute(delete(TrackedPerson))
    await db.execute(delete(TrackingSession))
    await db.commit()
    return {"message": "Semua data tracking berhasil dihapus"}
