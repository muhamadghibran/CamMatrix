from sqlalchemy import Integer, String, Boolean, Float, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column
from app.core.database import Base

class Setting(Base):
    __tablename__ = "settings"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), unique=True, index=True)
    
    theme: Mapped[str] = mapped_column(String(50), default="dark")
    language: Mapped[str] = mapped_column(String(10), default="id")
    
    notif_face: Mapped[bool] = mapped_column(Boolean, default=True)
    notif_camera: Mapped[bool] = mapped_column(Boolean, default=True)
    notif_storage: Mapped[bool] = mapped_column(Boolean, default=True)
    
    ai_engine: Mapped[str] = mapped_column(String(50), default="auto")
    ai_framerate: Mapped[int] = mapped_column(Integer, default=5)
    ai_confidence: Mapped[float] = mapped_column(Float, default=0.75)
    
    record_chunk: Mapped[int] = mapped_column(Integer, default=5) # minutes
    record_retention: Mapped[int] = mapped_column(Integer, default=30) # days
    
    two_factor: Mapped[bool] = mapped_column(Boolean, default=False)
    session_duration: Mapped[int] = mapped_column(Integer, default=60) # minutes
