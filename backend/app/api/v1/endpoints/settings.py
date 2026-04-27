from typing import Any
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.api import deps
from app.models.setting import Setting
from app.schemas.setting import SettingUpdate, SettingResponse
from app.models.user import User

router = APIRouter()

@router.get("/", response_model=SettingResponse)
async def read_my_settings(
    db: deps.DbSession,
    current_user: User = Depends(deps.get_current_user_full_scope)
) -> Any:
    stmt = select(Setting).where(Setting.user_id == current_user.id)
    result = await db.execute(stmt)
    setting = result.scalar_one_or_none()
    
    if not setting:
        setting = Setting(user_id=current_user.id)
        db.add(setting)
        await db.commit()
        await db.refresh(setting)
        
    return setting

@router.put("/", response_model=SettingResponse)
async def update_my_settings(
    *,
    db: deps.DbSession,
    setting_in: SettingUpdate,
    current_user: User = Depends(deps.get_current_user_full_scope)
) -> Any:
    stmt = select(Setting).where(Setting.user_id == current_user.id)
    result = await db.execute(stmt)
    setting = result.scalar_one_or_none()
    
    if not setting:
        setting = Setting(user_id=current_user.id)
        db.add(setting)
    
    update_data = setting_in.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(setting, field, value)
        
    db.add(setting)
    await db.commit()
    await db.refresh(setting)
    
    return setting
