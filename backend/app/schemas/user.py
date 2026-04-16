from pydantic import BaseModel, EmailStr
from typing import Optional
from app.models.user import UserRole

# Basic properties
class UserBase(BaseModel):
    email: EmailStr
    full_name: str
    role: UserRole = UserRole.VIEWER
    is_active: bool = True

# Properties to run when creating user
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

    class Config:
        from_attributes = True

# JWT Token payload
class Token(BaseModel):
    access_token: str
    token_type: str

class TokenPayload(BaseModel):
    sub: Optional[str] = None
    role: Optional[str] = None
