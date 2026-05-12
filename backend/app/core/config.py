from pydantic_settings import BaseSettings
from pydantic import field_validator, Field
from functools import lru_cache
from typing import List, Optional
import logging

logger = logging.getLogger(__name__)


class Settings(BaseSettings):
    APP_NAME: str = "CCTV VMS Platform"
    APP_VERSION: str = "1.0.0"
    DEBUG: bool = False

    # SECRET_KEY wajib ada, minimal 32 karakter
    SECRET_KEY: str
    # ENCRYPTION_KEY opsional — jika tidak diset, dibuat otomatis dari SECRET_KEY
    ENCRYPTION_KEY: Optional[str] = None
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24

    @field_validator("SECRET_KEY")
    @classmethod
    def secret_key_strong(cls, v: str) -> str:
        if not v or len(v) < 16:
            raise ValueError(
                "SECRET_KEY harus diisi minimal 16 karakter. "
                "Generate: python -c \"import secrets; print(secrets.token_hex(32))\""
            )
        if v.startswith("change-this") or v.startswith("ganti"):
            logger.warning(
                "SECRET_KEY masih menggunakan nilai default! "
                "Ganti dengan nilai acak di .env untuk keamanan produksi."
            )
        return v

    @field_validator("ENCRYPTION_KEY")
    @classmethod
    def validate_encryption_key(cls, v: Optional[str]) -> Optional[str]:
        # Opsional — tidak crash jika kosong
        if v and (len(v) < 32 or v.startswith("change-this")):
            logger.warning(
                "ENCRYPTION_KEY terlalu pendek atau masih default. "
                "Generate: openssl rand -hex 32"
            )
        return v

    def get_encryption_key(self) -> str:
        """Kembalikan ENCRYPTION_KEY yang valid — fallback ke turunan SECRET_KEY."""
        if self.ENCRYPTION_KEY and len(self.ENCRYPTION_KEY) >= 32:
            return self.ENCRYPTION_KEY
        # Fallback aman: derive dari SECRET_KEY menggunakan PBKDF2
        import hashlib
        derived = hashlib.pbkdf2_hmac(
            "sha256", self.SECRET_KEY.encode(), b"cammatrix-enc", 100_000
        ).hex()
        return derived

    DATABASE_URL: str = "postgresql://user:password@localhost:5432/cctv_vms"

    MINIO_ENDPOINT: str = "localhost:9000"
    MINIO_ACCESS_KEY: str = "minioadmin"
    MINIO_SECRET_KEY: str = "minioadmin"
    MINIO_BUCKET_NAME: str = "cctv-recordings"
    MINIO_SECURE: bool = False

    MEDIAMTX_API_URL: str = "http://localhost:9997"
    MEDIAMTX_RTSP_BASE: str = "rtsp://localhost:8554"
    MEDIAMTX_CONFIG_PATH: str = "/etc/mediamtx/mediamtx.yml"
    MTX_PUBLISHER_PASS: str = "publisher_pass" # Untuk integrasi API MediaMTX

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
