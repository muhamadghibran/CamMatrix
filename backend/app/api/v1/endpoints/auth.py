from typing import Any
from fastapi import APIRouter, Depends, HTTPException, status, Request
from fastapi.security import OAuth2PasswordRequestForm
from slowapi import Limiter
from slowapi.util import get_remote_address
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.api import deps
from app.core.security import create_access_token, verify_password, hash_password
from app.models.user import User, UserRole
from app.schemas.user import Token, UserResponse, UserRegister

router = APIRouter()
limiter = Limiter(key_func=get_remote_address)


@router.post("/login", response_model=Token)
@limiter.limit("5/minute")  # H4: Rate limit — cegah brute-force
async def login_access_token(
    request: Request,
    db: deps.DbSession,
    form_data: OAuth2PasswordRequestForm = Depends()
) -> Any:
    """
    OAuth2 compatible token login, get an access token for future requests
    """
    stmt = select(User).where(User.email == form_data.username)
    result = await db.execute(stmt)
    user = result.scalar_one_or_none()

    if not user or not user.hashed_password or not verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    elif not user.is_active:
        raise HTTPException(status_code=400, detail="Inactive user")

    access_token = create_access_token(
        subject=user.id,
        extra_claims={"role": user.role}
    )

    return {
        "access_token": access_token,
        "token_type": "bearer",
    }


@router.post("/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
@limiter.limit("3/hour")  # H4: Rate limit — cegah spam registrasi
async def register(
    request: Request,
    *,
    db: deps.DbSession,
    user_in: UserRegister,
) -> Any:
    """
    Public self-registration endpoint.
    New users are always registered as VIEWER role.
    """
    # Cek apakah email sudah terdaftar
    stmt = select(User).where(User.email == user_in.email)
    result = await db.execute(stmt)
    if result.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email sudah terdaftar. Silakan gunakan email lain atau masuk.",
        )

    user = User(
        email=user_in.email,
        hashed_password=hash_password(user_in.password),
        full_name=user_in.full_name,
        role=UserRole.VIEWER,
        is_active=True,
    )
    db.add(user)
    await db.commit()
    await db.refresh(user)
    return user


@router.post("/google", response_model=Token)
@limiter.limit("10/minute")  # H4: Rate limit Google OAuth
async def google_login(
    request: Request,
    *,
    db: deps.DbSession,
    payload: dict,
) -> Any:
    """
    Login or register via Google OAuth.
    Expects: { google_id, email, full_name }
    """
    google_id = payload.get("google_id")
    email = payload.get("email")
    full_name = payload.get("full_name", "")

    if not google_id or not email:
        raise HTTPException(status_code=400, detail="Data Google tidak lengkap.")

    # Cari user berdasarkan google_id atau email
    stmt = select(User).where(
        (User.google_id == google_id) | (User.email == email)
    )
    result = await db.execute(stmt)
    user = result.scalar_one_or_none()

    if not user:
        # Daftarkan user baru via Google
        user = User(
            email=email,
            full_name=full_name,
            hashed_password=None,
            role=UserRole.VIEWER,
            is_active=True,
            google_id=google_id,
        )
        db.add(user)
        await db.commit()
        await db.refresh(user)
    else:
        # Update google_id jika belum ada
        if not user.google_id:
            user.google_id = google_id
            await db.commit()
            await db.refresh(user)

    if not user.is_active:
        raise HTTPException(status_code=400, detail="Akun tidak aktif.")

    access_token = create_access_token(
        subject=user.id,
        extra_claims={"role": user.role}
    )

    return {
        "access_token": access_token,
        "token_type": "bearer",
    }


@router.get("/me", response_model=UserResponse)
async def read_current_user(
    current_user: User = Depends(deps.get_current_user),
) -> Any:
    """
    Get current user.
    """
    return current_user
