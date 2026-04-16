from pydantic import BaseModel
from typing import Optional

class SettingBase(BaseModel):
    theme: Optional[str] = None
    language: Optional[str] = None
    
    notif_face: Optional[bool] = None
    notif_camera: Optional[bool] = None
    notif_storage: Optional[bool] = None
    
    ai_engine: Optional[str] = None
    ai_framerate: Optional[int] = None
    ai_confidence: Optional[float] = None
    
    record_chunk: Optional[int] = None
    record_retention: Optional[int] = None
    
    two_factor: Optional[bool] = None
    session_duration: Optional[int] = None

class SettingUpdate(SettingBase):
    pass

class SettingResponse(SettingBase):
    id: int
    user_id: int

    class Config:
        from_attributes = True
