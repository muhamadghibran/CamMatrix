from datetime import datetime, timedelta, timezone
from typing import Optional, Any
from jose import JWTError, jwt
from passlib.context import CryptContext
from cryptography.fernet import Fernet
import base64
from app.core.config import settings

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# Fernet membutuhkan 32-url-safe base64-encoded bytes
# Kita turunkan dari SECRET_KEY agar tetap stabil selama SECRET_KEY tidak diganti
_fernet_key = base64.urlsafe_b64encode(settings.SECRET_KEY.encode()[:32].ljust(32, b'0'))
_fernet = Fernet(_fernet_key)

def encrypt_symmetric(data: str) -> str:
    """Mengenkripsi teks biasa menjadi token Fernet."""
    if not data:
        return data
    return _fernet.encrypt(data.encode()).decode()

def decrypt_symmetric(encrypted_data: str) -> str:
    """Mengembalikan token Fernet menjadi teks biasa."""
    if not encrypted_data:
        return encrypted_data
    try:
        return _fernet.decrypt(encrypted_data.encode()).decode()
    except Exception:
        # Menghindari error jika data lama yang belum terenkripsi tersisa di DB
        return encrypted_data



def hash_password(password: str) -> str:
    return pwd_context.hash(password)


def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)


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
