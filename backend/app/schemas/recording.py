from pydantic import BaseModel
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
    url: str = "" # Compute presigned url

    class Config:
        from_attributes = True
