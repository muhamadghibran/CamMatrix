from typing import Any
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.api import deps
from app.core.security import create_access_token, verify_password
from app.models.user import User
from app.schemas.user import Token, UserResponse

router = APIRouter()

@router.post("/login", response_model=Token)
async def login_access_token(
    db: deps.DbSession,
    form_data: OAuth2PasswordRequestForm = Depends()
) -> Any:
    """
    OAuth2 compatible token login, get an access token for future requests
    """
    # Fetch user by email
    stmt = select(User).where(User.email == form_data.username)
    result = await db.execute(stmt)
    user = result.scalar_one_or_none()

    if not user or not verify_password(form_data.password, user.hashed_password):
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

@router.get("/me", response_model=UserResponse)
async def read_current_user(
    current_user: User = Depends(deps.get_current_user),
) -> Any:
    """
    Get current user.
    """
    return current_user
