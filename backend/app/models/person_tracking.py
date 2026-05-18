"""
Model untuk Cross-Camera Person Tracking.
Menyimpan identitas orang unik dan jejak kemunculannya di berbagai kamera.
"""
from sqlalchemy import Integer, String, DateTime, ForeignKey, Float, Text
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy.sql import func
from datetime import datetime
from app.core.database import Base


class TrackedPerson(Base):
    """Satu identitas orang unik yang terdeteksi lintas kamera."""
    __tablename__ = "tracked_persons"

    id: Mapped[int]              = mapped_column(primary_key=True, index=True)
    # Embedding wajah representatif (JSON array 128-dim float)
    embedding_json: Mapped[str]  = mapped_column(Text, nullable=False)
    # Thumbnail wajah pertama kali terlihat (base64 JPEG 64×64)
    first_thumbnail: Mapped[str | None] = mapped_column(Text, nullable=True)
    # Kamera pertama kali terlihat
    first_camera_name: Mapped[str | None] = mapped_column(String(255), nullable=True)
    first_seen_at: Mapped[float | None]   = mapped_column(Float, nullable=True)  # timestamp_sec dalam video
    # Jumlah total penampakan
    total_sightings: Mapped[int]          = mapped_column(Integer, default=0)
    created_at: Mapped[datetime]          = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )


class PersonSighting(Base):
    """Setiap kemunculan orang di satu kamera/rekaman."""
    __tablename__ = "person_sightings"

    id: Mapped[int]           = mapped_column(primary_key=True, index=True)
    person_id: Mapped[int]    = mapped_column(
        ForeignKey("tracked_persons.id", ondelete="CASCADE"), index=True
    )
    recording_id: Mapped[int] = mapped_column(
        ForeignKey("recordings.id", ondelete="CASCADE"), index=True
    )
    camera_name: Mapped[str | None]   = mapped_column(String(255), nullable=True)
    camera_id: Mapped[int | None]     = mapped_column(Integer, nullable=True)
    # Waktu kemunculan pertama dalam video ini (detik)
    first_timestamp_sec: Mapped[float]  = mapped_column(Float)
    # Waktu kemunculan terakhir dalam video ini (detik)
    last_timestamp_sec: Mapped[float]   = mapped_column(Float)
    # Jumlah frame terdeteksi di video ini
    frame_count: Mapped[int]            = mapped_column(Integer, default=1)
    # Thumbnail terbaik dari penampakan ini
    thumbnail: Mapped[str | None]       = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime]        = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )


class TrackingSession(Base):
    """Satu sesi tracking lintas kamera (user memulai 1 sesi = 1 record)."""
    __tablename__ = "tracking_sessions"

    id: Mapped[int]              = mapped_column(primary_key=True, index=True)
    status: Mapped[str]          = mapped_column(String(20), default="pending")
    # pending | running | done | failed
    recordings_analyzed: Mapped[int] = mapped_column(Integer, default=0)
    persons_found: Mapped[int]       = mapped_column(Integer, default=0)
    error_msg: Mapped[str | None]    = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime]     = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )
    finished_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
