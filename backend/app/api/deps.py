from typing import AsyncGenerator, Annotated, Optional
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.core.database import get_db
from app.core.security import decode_access_token
from app.models.user import User, UserRole

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/v1/auth/login")

DbSession = Annotated[AsyncSession, Depends(get_db)]

async def get_current_user(
    token: Annotated[str, Depends(oauth2_scheme)],
    db: DbSession
) -> User:
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    
    payload = decode_access_token(token)
    if payload is None:
        raise credentials_exception
        
    user_id: str = payload.get("sub")
    if user_id is None:
        raise credentials_exception

    stmt = select(User).where(User.id == int(user_id))
    result = await db.execute(stmt)
    user = result.scalar_one_or_none()
    
    if user is None:
        raise credentials_exception
        
    if not user.is_active:
        raise HTTPException(status_code=400, detail="Inactive user")
        
    return user

async def get_current_user_full_scope(
    token: Annotated[str, Depends(oauth2_scheme)],
    db: DbSession
) -> User:
    user = await get_current_user(token, db)
    payload = decode_access_token(token)
    if payload and payload.get("scope") == "password_change_only":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Password must be changed before accessing this endpoint"
        )
    return user

async def get_current_admin(
    current_user: Annotated[User, Depends(get_current_user_full_scope)]
) -> User:
    if current_user.role != UserRole.ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="The user doesn't have enough privileges"
        )
    return current_user


# Dependency opsional — kembalikan None jika tidak ada token (untuk endpoint download)
oauth2_scheme_optional = OAuth2PasswordBearer(tokenUrl="/api/v1/auth/login", auto_error=False)

async def get_optional_user(
    token: Annotated[Optional[str], Depends(oauth2_scheme_optional)],
    db: DbSession
) -> Optional[User]:
    """Seperti get_current_user tapi mengembalikan None jika token tidak ada/invalid."""
    if not token:
        return None
    payload = decode_access_token(token)
    if payload is None:
        return None
    user_id: str = payload.get("sub")
    if not user_id:
        return None
    stmt = select(User).where(User.id == int(user_id))
    result = await db.execute(stmt)
    return result.scalar_one_or_none()
