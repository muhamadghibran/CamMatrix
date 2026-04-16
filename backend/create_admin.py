"""
Script untuk membuat pengguna admin pertama di database.
Jalankan sekali saja dari folder backend:
  python create_admin.py
"""
import asyncio
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.core.database import AsyncSessionLocal, engine
from app.core.security import hash_password
from app.models import Base, User
from app.models.user import UserRole


async def create_admin():
    # Pastikan semua tabel sudah ada (alternatif jika belum pakai alembic)
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    async with AsyncSessionLocal() as db:
        # Cek apakah admin sudah ada
        result = await db.execute(select(User).where(User.email == "admin@vms.com"))
        existing = result.scalar_one_or_none()

        if existing:
            print("✅ Admin sudah ada:", existing.email)
            return

        admin = User(
            full_name="Administrator",
            email="admin@vms.com",
            hashed_password=hash_password("admin123"),
            role=UserRole.ADMIN,
            is_active=True,
        )
        db.add(admin)
        await db.commit()
        print("✅ Admin berhasil dibuat!")
        print("   Email   : admin@vms.com")
        print("   Password: admin123")


if __name__ == "__main__":
    asyncio.run(create_admin())
