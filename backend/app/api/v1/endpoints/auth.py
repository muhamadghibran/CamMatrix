from typing import Any
from fastapi import APIRouter, Depends, HTTPException, status, Request
from fastapi.security import OAuth2PasswordRequestForm
from slowapi import Limiter
from slowapi.util import get_remote_address
from sqlalchemy import select

from app.api import deps
from app.core.security import create_access_token, verify_password, hash_password
from app.models.user import User
from app.schemas.user import Token, UserResponse

router = APIRouter()
limiter = Limiter(key_func=get_remote_address)


@router.post("/login", response_model=Token)
@limiter.limit("5/minute")
async def login_access_token(
    request: Request,
    db: deps.DbSession,
    form_data: OAuth2PasswordRequestForm = Depends()
) -> Any:
    """Login dengan email dan password. Hanya untuk Administrator."""
    stmt = select(User).where(User.email == form_data.username)
    result = await db.execute(stmt)
    user = result.scalar_one_or_none()

    if not user or not user.hashed_password or not verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Email atau password salah",
            headers={"WWW-Authenticate": "Bearer"},
        )
    if not user.is_active:
        raise HTTPException(status_code=400, detail="Akun tidak aktif")

    # C3: Kalau must_change_password=True, token diberi scope terbatas
    extra_claims: dict = {"role": user.role}
    if user.must_change_password:
        extra_claims["scope"] = "password_change_only"

    access_token = create_access_token(subject=user.id, extra_claims=extra_claims)

    return {
        "access_token": access_token,
        "token_type": "bearer",
        "must_change_password": user.must_change_password,  # info untuk frontend
    }


@router.get("/me", response_model=UserResponse)
async def read_current_user(
    current_user: User = Depends(deps.get_current_user),
) -> Any:
    """Ambil data user yang sedang login."""
    return current_user


@router.put("/change-password")
@limiter.limit("5/minute")
async def change_password(
    request: Request,
    payload: dict,
    db: deps.DbSession,
    current_user: User = Depends(deps.get_current_user),
) -> Any:
    """
    C3: Ganti password — wajib dipanggil jika must_change_password=True.
    Setelah berhasil, flag di-reset ke False dan akses penuh terbuka.
    """
    new_password = payload.get("new_password", "")
    if len(new_password) < 8:
        raise HTTPException(
            status_code=400,
            detail="Password baru minimal 8 karakter."
        )

    current_user.hashed_password    = hash_password(new_password)
    current_user.must_change_password = False
    db.add(current_user)
    await db.commit()

    # Keluarkan token baru dengan scope penuh
    access_token = create_access_token(
        subject=current_user.id,
        extra_claims={"role": current_user.role}
    )
    return {
        "message": "Password berhasil diubah.",
        "access_token": access_token,
        "token_type": "bearer",
    }
