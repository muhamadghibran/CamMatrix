from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class RecordingBase(BaseModel):
    camera_id: int
    duration: int
    size_bytes: int
    minio_key: str

class RecordingCreate(RecordingBase):
    pass

class RecordingResponse(RecordingBase):
    id: int
    created_at: datetime
    url: str = ""
    camera_name: Optional[str] = None

    class Config:
        from_attributes = True
