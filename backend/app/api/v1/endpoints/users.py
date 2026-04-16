from typing import Any, List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.api import deps
from app.models.user import User
from app.schemas.user import UserCreate, UserUpdate, UserResponse
from app.core.security import hash_password

router = APIRouter()

@router.get("/", response_model=List[UserResponse])
async def read_users(
    db: deps.DbSession,
    skip: int = 0,
    limit: int = 100,
    current_user: User = Depends(deps.get_current_admin)
) -> Any:
    """
    Retrieve users. Only admins can retrieve all users.
    """
    stmt = select(User).offset(skip).limit(limit)
    result = await db.execute(stmt)
    return result.scalars().all()

@router.post("/", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
async def create_user(
    *,
    db: deps.DbSession,
    user_in: UserCreate,
    current_user: User = Depends(deps.get_current_admin)
) -> Any:
    """
    Create new user. Only admins can create users.
    """
    # Check if user with email already exists
    stmt = select(User).where(User.email == user_in.email)
    result = await db.execute(stmt)
    if result.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="The user with this username already exists in the system.",
        )
    
    user = User(
        email=user_in.email,
        hashed_password=hash_password(user_in.password),
        full_name=user_in.full_name,
        role=user_in.role,
        is_active=user_in.is_active,
    )
    db.add(user)
    await db.commit()
    await db.refresh(user)
    return user

@router.get("/{user_id}", response_model=UserResponse)
async def read_user_by_id(
    user_id: int,
    db: deps.DbSession,
    current_user: User = Depends(deps.get_current_admin),
) -> Any:
    """
    Get a specific user by id.
    """
    stmt = select(User).where(User.id == user_id)
    result = await db.execute(stmt)
    user = result.scalar_one_or_none()
    
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    if user == current_user:
        return user
    if current_user.role != "admin":
         raise HTTPException(status_code=403, detail="Not enough permissions")
    return user

@router.put("/{user_id}", response_model=UserResponse)
async def update_user(
    *,
    db: deps.DbSession,
    user_id: int,
    user_in: UserUpdate,
    current_user: User = Depends(deps.get_current_admin)
) -> Any:
    """
    Update a user. Only admin.
    """
    stmt = select(User).where(User.id == user_id)
    result = await db.execute(stmt)
    user = result.scalar_one_or_none()
    
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
        
    update_data = user_in.model_dump(exclude_unset=True)
    if "password" in update_data:
        hashed_password = hash_password(update_data["password"])
        del update_data["password"]
        update_data["hashed_password"] = hashed_password
        
    for field, value in update_data.items():
        setattr(user, field, value)
        
    db.add(user)
    await db.commit()
    await db.refresh(user)
    return user

@router.delete("/{user_id}", response_model=UserResponse)
async def delete_user(
    *,
    db: deps.DbSession,
    user_id: int,
    current_user: User = Depends(deps.get_current_admin)
) -> Any:
    """
    Delete a user. Only admin.
    """
    stmt = select(User).where(User.id == user_id)
    result = await db.execute(stmt)
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
        
    await db.delete(user)
    await db.commit()
    return user
