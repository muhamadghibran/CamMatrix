from pydantic import BaseModel
from typing import Optional

class CameraBase(BaseModel):
    name: str
    location: str
    rtsp_url: str
    username: Optional[str] = None
    password: Optional[str] = None

class CameraCreate(CameraBase):
    pass

class CameraUpdate(BaseModel):
    name: Optional[str] = None
    location: Optional[str] = None
    rtsp_url: Optional[str] = None
    username: Optional[str] = None
    password: Optional[str] = None

class CameraResponse(CameraBase):
    id: int
    status: str = "offline"       # Computed dynamically dari MediaMTX
    stream_url: str = ""          # URL WebRTC player untuk ditampilkan di browser

    class Config:
        from_attributes = True
