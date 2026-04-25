from sqlalchemy import String, Boolean, Enum, DateTime
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy.sql import func
import enum
from app.core.database import Base

class UserRole(str, enum.Enum):
    ADMIN    = "ADMIN"
    OPERATOR = "OPERATOR"
    VIEWER   = "VIEWER"

class User(Base):
    __tablename__ = "users"

    id: Mapped[int]      = mapped_column(primary_key=True, index=True)
    full_name: Mapped[str]  = mapped_column(String(255), index=True)
    email: Mapped[str]   = mapped_column(String(255), unique=True, index=True, nullable=False)
    hashed_password: Mapped[str] = mapped_column(String(255), nullable=True)
    role: Mapped[UserRole]  = mapped_column(Enum(UserRole), default=UserRole.VIEWER)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    google_id: Mapped[str]  = mapped_column(String(255), unique=True, nullable=True, index=True)
    created_at: Mapped[DateTime] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=True)

    # C3: Paksa ganti password setelah login pertama kali
    # Default False agar admin yang sudah ada tidak terkunci (Q2 → B)
    must_change_password: Mapped[bool] = mapped_column(Boolean, default=False, server_default="false")

