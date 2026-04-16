from sqlalchemy import Integer, String, DateTime, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy.sql import func
from datetime import datetime
from app.core.database import Base

class Recording(Base):
    __tablename__ = "recordings"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    camera_id: Mapped[int] = mapped_column(ForeignKey("cameras.id", ondelete="CASCADE"), index=True)
    minio_key: Mapped[str] = mapped_column(String(512), unique=True, index=True)
    duration: Mapped[int] = mapped_column(Integer) # in seconds
    size_bytes: Mapped[int] = mapped_column(Integer)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
