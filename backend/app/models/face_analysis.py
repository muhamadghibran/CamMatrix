"""
Models untuk AI Face Analysis.
Terpisah dari model utama — tidak mengubah tabel yang sudah ada.
"""
from sqlalchemy import Integer, String, DateTime, ForeignKey, Float, Text, JSON
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy.sql import func
from datetime import datetime
from app.core.database import Base


class FaceAnalysisJob(Base):
    """Satu job analisis wajah per rekaman."""
    __tablename__ = "face_analysis_jobs"

    id: Mapped[int]         = mapped_column(primary_key=True, index=True)
    recording_id: Mapped[int] = mapped_column(
        ForeignKey("recordings.id", ondelete="CASCADE"), index=True
    )
    status: Mapped[str]     = mapped_column(String(20), default="pending")
    # pending | running | done | failed
    total_frames: Mapped[int]    = mapped_column(Integer, default=0)
    processed_frames: Mapped[int] = mapped_column(Integer, default=0)
    faces_found: Mapped[int]     = mapped_column(Integer, default=0)
    error_msg: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )
    finished_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )


class FaceDetection(Base):
    """Setiap wajah yang terdeteksi dalam satu job."""
    __tablename__ = "face_detections"

    id: Mapped[int]         = mapped_column(primary_key=True, index=True)
    job_id: Mapped[int]     = mapped_column(
        ForeignKey("face_analysis_jobs.id", ondelete="CASCADE"), index=True
    )
    # Waktu dalam video (detik)
    timestamp_sec: Mapped[float] = mapped_column(Float)
    # Bounding box relatif (0.0–1.0)
    bbox_x: Mapped[float]   = mapped_column(Float)
    bbox_y: Mapped[float]   = mapped_column(Float)
    bbox_w: Mapped[float]   = mapped_column(Float)
    bbox_h: Mapped[float]   = mapped_column(Float)
    # Confidence score dari detektor
    confidence: Mapped[float | None] = mapped_column(Float, nullable=True)
    # Frame thumbnail (base64 JPEG crop wajah, kecil)
    face_crop_b64: Mapped[str | None] = mapped_column(Text, nullable=True)
