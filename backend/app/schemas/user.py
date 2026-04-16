from pydantic import BaseModel, EmailStr
from typing import Optional
from datetime import datetime
from app.models.user import UserRole

# Basic properties
class UserBase(BaseModel):
    email: EmailStr
    full_name: str
    role: UserRole = UserRole.VIEWER
    is_active: bool = True

# Properties for public self-registration (role always VIEWER)
class UserRegister(BaseModel):
    email: EmailStr
    full_name: str
    password: str

# Properties to run when creating user (admin only)
class UserCreate(UserBase):
    password: str

# Properties to run when updating user
class UserUpdate(BaseModel):
    email: Optional[EmailStr] = None
    full_name: Optional[str] = None
    password: Optional[str] = None
    role: Optional[UserRole] = None
    is_active: Optional[bool] = None

# Properties when returning user
class UserResponse(UserBase):
    id: int
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True

# JWT Token payload
class Token(BaseModel):
    access_token: str
    token_type: str

class TokenPayload(BaseModel):
    sub: Optional[str] = None
    role: Optional[str] = None
