from datetime import datetime, timedelta, timezone
from typing import Optional, Any
import base64
import hashlib
from jose import JWTError, jwt
from passlib.context import CryptContext
from cryptography.fernet import Fernet
from app.core.config import settings

# ─── Fernet Key — Derive dari SECRET_KEY agar tidak perlu env variable baru ───
def _get_fernet() -> Fernet:
    """Buat Fernet cipher dari SECRET_KEY. Menggunakan SHA-256 untuk normalisasi."""
    key_bytes = hashlib.sha256(settings.SECRET_KEY.encode()).digest()
    fernet_key = base64.urlsafe_b64encode(key_bytes)
    return Fernet(fernet_key)

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def hash_password(password: str) -> str:
    return pwd_context.hash(password)


def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)


def encrypt_symmetric(data: str) -> str:
    """Enkripsi teks (misal password kamera) menjadi ciphertext Fernet."""
    return _get_fernet().encrypt(data.encode()).decode()


def decrypt_symmetric(encrypted_data: str) -> str:
    """Dekripsi ciphertext Fernet kembali ke teks asli."""
    return _get_fernet().decrypt(encrypted_data.encode()).decode()


def create_access_token(
    subject: Any,
    expires_delta: Optional[timedelta] = None,
    extra_claims: Optional[dict] = None,
) -> str:
    expire = datetime.now(timezone.utc) + (
        expires_delta or timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    )
    payload = {
        "sub": str(subject),
        "exp": expire,
        "iat": datetime.now(timezone.utc),
    }
    if extra_claims:
        payload.update(extra_claims)

    return jwt.encode(payload, settings.SECRET_KEY, algorithm=settings.ALGORITHM)


def decode_access_token(token: str) -> Optional[dict]:
    try:
        payload = jwt.decode(
            token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM]
        )
        return payload
    except JWTError:
        return None
