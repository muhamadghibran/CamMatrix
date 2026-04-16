from sqlalchemy import String
from sqlalchemy.orm import Mapped, mapped_column
from app.core.database import Base

class Camera(Base):
    __tablename__ = "cameras"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    name: Mapped[str] = mapped_column(String(255), index=True)
    location: Mapped[str] = mapped_column(String(255))
    rtsp_url: Mapped[str] = mapped_column(String(1024))
    username: Mapped[str | None] = mapped_column(String(255), nullable=True)
    password: Mapped[str | None] = mapped_column(String(255), nullable=True)
