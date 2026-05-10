from pydantic import BaseModel
from typing import Optional

class CameraBase(BaseModel):
    name: str
    location: str
    rtsp_url: str
    username: Optional[str] = None
    password: Optional[str] = None
    is_public: bool = False

class CameraCreate(CameraBase):
    pass

class CameraUpdate(BaseModel):
    name: Optional[str] = None
    location: Optional[str] = None
    rtsp_url: Optional[str] = None
    username: Optional[str] = None
    password: Optional[str] = None
    is_public: Optional[bool] = None

class CameraResponse(CameraBase):
    id: int
    owner_id: int                  # ID pemilik kamera
    status: str = "offline"       # Computed dynamically dari MediaMTX
    stream_url: str = ""          # URL HLS player untuk ditampilkan di browser

    class Config:
        from_attributes = True
