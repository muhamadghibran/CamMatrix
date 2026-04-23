from pydantic_settings import BaseSettings
from pydantic import field_validator, Field
from functools import lru_cache
from typing import List


class Settings(BaseSettings):
    APP_NAME: str = "CCTV VMS Platform"
    APP_VERSION: str = "1.0.0"
    DEBUG: bool = False

    # C10: Tidak ada default — raise di startup kalau kosong/default
    SECRET_KEY: str
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24

    @field_validator("SECRET_KEY")
    @classmethod
    def secret_key_strong(cls, v: str) -> str:
        if not v or len(v) < 32 or v.startswith("change-this"):
            raise ValueError(
                "SECRET_KEY harus diisi dengan nilai acak minimal 32 karakter. "
                "Generate dengan: python -c \"import secrets; print(secrets.token_hex(32))\""
            )
        return v

    DATABASE_URL: str = "postgresql://user:password@localhost:5432/cctv_vms"

    MINIO_ENDPOINT: str = "localhost:9000"
    MINIO_ACCESS_KEY: str = "minioadmin"
    MINIO_SECRET_KEY: str = "minioadmin"
    MINIO_BUCKET_NAME: str = "cctv-recordings"
    MINIO_SECURE: bool = False

    MEDIAMTX_API_URL: str = "http://localhost:9997"
    MEDIAMTX_RTSP_BASE: str = "rtsp://localhost:8554"
    MEDIAMTX_CONFIG_PATH: str = "/etc/mediamtx/mediamtx.yml"

    # C11: CORS dan HLS dari env, bukan hardcode IP
    CORS_ORIGINS: List[str] = Field(default=["http://localhost:5173"])
    HLS_BASE_URL: str = "http://localhost:8888"

    AI_FRAME_SAMPLE_RATE: int = 5
    AI_DEVICE: str = "auto"
    AI_FACE_CONFIDENCE: float = 0.75
    AI_SIMILARITY_THRESHOLD: float = 0.6

    class Config:
        env_file = ".env"
        case_sensitive = True


@lru_cache()
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
