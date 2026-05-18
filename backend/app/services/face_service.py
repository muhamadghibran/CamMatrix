"""
Face Detection Service — Ringan, tanpa GPU, hemat RAM.
Menggunakan opencv haar cascade (built-in, 0 install tambahan awal).
Proses rekaman video per-N-frame, bukan live stream.

RAM usage: ~50–150 MB (vs YOLOv8 = 1.5 GB)
"""
import cv2
import base64
import asyncio
import logging
from datetime import datetime, timezone
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update
from app.models.face_analysis import FaceAnalysisJob, FaceDetection
from app.models.recording import Recording

logger = logging.getLogger(__name__)

# ── Haar Cascade (built-in di opencv, tidak perlu download) ──
# Lebih ringan dari DNN, cukup untuk deteksi wajah frontal
_cascade = None

def _get_cascade():
    global _cascade
    if _cascade is None:
        import cv2
        cascade_path = cv2.data.haarcascades + "haarcascade_frontalface_default.xml"
        _cascade = cv2.CascadeClassifier(cascade_path)
    return _cascade


def _detect_faces_in_frame(frame_bgr) -> list[dict]:
    """
    Deteksi wajah dalam satu frame menggunakan Haar Cascade.
    Return: list of dict {x, y, w, h, confidence}
    """
    cascade = _get_cascade()
    gray = cv2.cvtColor(frame_bgr, cv2.COLOR_BGR2GRAY)
    h_img, w_img = frame_bgr.shape[:2]

    # scaleFactor=1.1, minNeighbors=5 → balance speed vs akurasi
    faces = cascade.detectMultiScale(
        gray,
        scaleFactor=1.1,
        minNeighbors=5,
        minSize=(30, 30),
    )

    results = []
    if len(faces) == 0:
        return results

    for (x, y, w, h) in faces:
        # Crop wajah → resize kecil → encode base64 (untuk thumbnail)
        face_crop = frame_bgr[y:y+h, x:x+w]
        face_small = cv2.resize(face_crop, (64, 64))
        _, buf = cv2.imencode(".jpg", face_small, [cv2.IMWRITE_JPEG_QUALITY, 60])
        crop_b64 = base64.b64encode(buf).decode("utf-8")

        results.append({
            "bbox_x": round(x / w_img, 4),
            "bbox_y": round(y / h_img, 4),
            "bbox_w": round(w / w_img, 4),
            "bbox_h": round(h / h_img, 4),
            "confidence": None,   # Haar tidak punya confidence score
            "face_crop_b64": crop_b64,
        })
    return results


async def run_face_analysis(job_id: int, video_path: str, db: AsyncSession):
    """
    Proses analisis wajah pada file video.
    Dipanggil secara async tapi frame processing tetap di thread pool
    supaya tidak block event loop.

    Strategi hemat RAM:
    - Baca 1 frame setiap SAMPLE_EVERY_N frame (default 30 = ~1 detik per frame)
    - Langsung hapus frame dari memori setelah diproses
    - Simpan hanya bounding box + thumbnail kecil (64x64 JPEG)
    """
    SAMPLE_EVERY_N = 30  # Ambil 1 frame per 30 frame (~1 detik pada 30fps)

    def _process_video():
        """Dijalankan di thread terpisah agar tidak block async loop."""
        cap = cv2.VideoCapture(video_path)
        if not cap.isOpened():
            return None, f"Tidak dapat membuka video: {video_path}"

        fps        = cap.get(cv2.CAP_PROP_FPS) or 25
        total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
        detections = []
        frame_idx  = 0
        processed  = 0

        while True:
            ret, frame = cap.read()
            if not ret:
                break

            if frame_idx % SAMPLE_EVERY_N == 0:
                timestamp_sec = round(frame_idx / fps, 2)
                faces = _detect_faces_in_frame(frame)
                for face in faces:
                    face["timestamp_sec"] = timestamp_sec
                    detections.append(face)
                processed += 1

            frame_idx += 1
            del frame  # Bebaskan RAM segera

        cap.release()
        return {
            "total_frames": total_frames,
            "processed_frames": processed,
            "detections": detections,
        }, None

    # ── Update status → running ──
    await db.execute(
        update(FaceAnalysisJob)
        .where(FaceAnalysisJob.id == job_id)
        .values(status="running")
    )
    await db.commit()

    try:
        # Jalankan di thread pool agar tidak block event loop
        loop = asyncio.get_event_loop()
        result, error = await loop.run_in_executor(None, _process_video)

        if error:
            await db.execute(
                update(FaceAnalysisJob)
                .where(FaceAnalysisJob.id == job_id)
                .values(status="failed", error_msg=error, finished_at=datetime.now(timezone.utc))
            )
            await db.commit()
            return

        # ── Simpan deteksi ke DB ──
        for det in result["detections"]:
            db.add(FaceDetection(
                job_id=job_id,
                timestamp_sec=det["timestamp_sec"],
                bbox_x=det["bbox_x"],
                bbox_y=det["bbox_y"],
                bbox_w=det["bbox_w"],
                bbox_h=det["bbox_h"],
                confidence=det.get("confidence"),
                face_crop_b64=det.get("face_crop_b64"),
            ))

        await db.execute(
            update(FaceAnalysisJob)
            .where(FaceAnalysisJob.id == job_id)
            .values(
                status="done",
                total_frames=result["total_frames"],
                processed_frames=result["processed_frames"],
                faces_found=len(result["detections"]),
                finished_at=datetime.now(timezone.utc),
            )
        )
        await db.commit()
        logger.info(f"Job {job_id} selesai: {len(result['detections'])} wajah ditemukan")

    except Exception as e:
        logger.exception(f"Job {job_id} error: {e}")
        await db.execute(
            update(FaceAnalysisJob)
            .where(FaceAnalysisJob.id == job_id)
            .values(status="failed", error_msg=str(e), finished_at=datetime.now(timezone.utc))
        )
        await db.commit()
