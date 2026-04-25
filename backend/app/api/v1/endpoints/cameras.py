from typing import Any, List
import asyncio
import httpx
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select

from app.api import deps
from app.core.config import settings
from app.core.security import encrypt_symmetric, decrypt_symmetric
from app.models.camera import Camera
from app.schemas.camera import CameraCreate, CameraUpdate, CameraResponse
from app.models.user import User, UserRole

router = APIRouter()

MEDIAMTX_API = settings.MEDIAMTX_API_URL
HLS_BASE = settings.HLS_BASE_URL  # C11: tidak hardcode IP, baca dari .env


def _path_name(user_id: int, camera_id: int) -> str:
    """Format path MediaMTX: cam_{user_id}_{camera_id} — unik per pengguna."""
    return f"cam_{user_id}_{camera_id}"


def _build_rtsp_with_auth(rtsp_url: str, username: str | None, encrypted_password: str | None) -> str:
    """Gabungkan username:password ke RTSP URL jika ada kredensial.
    Contoh hasil: rtsp://admin:sandi123@192.168.1.100:554/stream1
    """
    if not username or not encrypted_password or rtsp_url == "publisher":
        return rtsp_url
    try:
        plain_pass = decrypt_symmetric(encrypted_password)
    except Exception:
        return rtsp_url  # Jika dekripsi gagal, pakai URL asli tanpa auth

    # Sisipkan user:pass setelah rtsp://
    if "://" in rtsp_url:
        scheme, rest = rtsp_url.split("://", 1)
        return f"{scheme}://{username}:{plain_pass}@{rest}"
    return rtsp_url


def _validate_rtsp_url(url: str) -> str:
    """C9: Validasi RTSP URL untuk mencegah SSRF.
    Hanya rtsp:// dan rtsps:// yang diizinkan.
    IP private/loopback/reserved diblokir.
    Nilai 'publisher' diizinkan sebagai push mode.
    """
    if url == "publisher":
        return url  # Mode push khusus, tidak perlu validasi URL

    from urllib.parse import urlparse
    import ipaddress

    parsed = urlparse(url)
    if parsed.scheme not in ("rtsp", "rtsps"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Hanya URL rtsp:// atau rtsps:// yang diizinkan."
        )
    host = parsed.hostname
    if not host:
        raise HTTPException(status_code=400, detail="Host tidak valid pada URL RTSP.")

    try:
        ip = ipaddress.ip_address(host)
        if ip.is_loopback or ip.is_link_local or ip.is_reserved or ip.is_multicast:
            raise HTTPException(
                status_code=400,
                detail="IP loopback/link-local/reserved tidak diizinkan. Gunakan IP publik atau nama domain."
            )
    except ValueError:
        pass  # host berupa nama domain, bukan IP — diizinkan
    return url



async def get_mediamtx_status(user_id: int, camera_id: int) -> str:
    """Cek status kamera secara ASYNC via MediaMTX API."""
    try:
        path = _path_name(user_id, camera_id)
        async with httpx.AsyncClient(timeout=3.0) as client:
            res = await client.get(f"{MEDIAMTX_API}/v3/paths/get/{path}")
            if res.status_code == 200 and (res.json().get("sourceReady") or res.json().get("ready")):
                return "live"
    except Exception:
        pass
    return "offline"


async def register_camera_to_mediamtx(user_id: int, camera_id: int, rtsp_url: str):
    """Daftarkan RTSP source ke MediaMTX dengan path unik per pengguna."""
    try:
        path = _path_name(user_id, camera_id)
        async with httpx.AsyncClient(timeout=3.0) as client:
            payload = {"source": rtsp_url}
            if rtsp_url == "publisher":
                payload = {} # Kosongkan source agar MediaMTX menerima PUSH
            await client.post(
                f"{MEDIAMTX_API}/v3/config/paths/add/{path}",
                json=payload
            )
    except Exception:
        pass


async def remove_camera_from_mediamtx(user_id: int, camera_id: int):
    """Hapus path dari MediaMTX saat kamera dihapus."""
    try:
        path = _path_name(user_id, camera_id)
        async with httpx.AsyncClient(timeout=2.0) as client:
            await client.delete(f"{MEDIAMTX_API}/v3/config/paths/delete/{path}")
    except Exception:
        pass



def write_cameras_paths(cameras: list):
    """
    N3+N4: Tulis paths kamera ke mediamtx.yml dengan aman.
    Strategi:
    - Baca base config dari mediamtx.yml (hanya sampai baris 'paths:')
    - Tulis cameras.env (mode 600) berisi RTSP URL yang sudah di-decrypt
    - Tambahkan paths ke bawah config dengan referensi ${CAM_x_RTSP_URL}
    - Reload mediamtx agar config terbaca tanpa restart
    """
    import os, subprocess

    config_path = settings.MEDIAMTX_CONFIG_PATH          # /etc/mediamtx/mediamtx.yml
    env_path    = "/etc/mediamtx/cameras.env"

    # ── 1. Baca base config (hanya sampai sebelum paths pertama yg dynamic) ──
    base_lines = []
    try:
        with open(config_path, "r", encoding="utf-8") as f:
            for line in f:
                base_lines.append(line)
                # Potong tepat setelah baris "  all_others:"
                if line.strip() == "all_others:":
                    break
    except FileNotFoundError:
        # Fallback kalau config belum ada sama sekali
        base_lines = [
            "###############################################################\n",
            "# MediaMTX — Auto-generated (base config tidak ditemukan)\n",
            "###############################################################\n",
            "rtspAddress: :8554\n",
            "hlsAddress: :8888\n",
            "hlsAlwaysRemux: yes\n",
            "api: yes\n",
            "apiAddress: 127.0.0.1:9997\n",
            "logLevel: info\n",
            "logDestinations: [stdout]\n",
            "paths:\n",
            "  all_others:\n",
        ]

    # ── 2. Bangun cameras.env dan paths section ──────────────────────────────
    env_lines   = ["# cameras.env — Di-generate otomatis oleh backend. Jangan edit manual.\n"]
    paths_lines = []

    for cam in cameras:
        path_name = _path_name(cam.owner_id, cam.id)
        env_key   = f"CAM_{cam.owner_id}_{cam.id}_RTSP_URL"

        if cam.rtsp_url == "publisher":
            # Mode push — tidak butuh source, tidak perlu env entry
            paths_lines.append(f"\n  {path_name}:\n")
        else:
            # Decrypt RTSP URL + credentials → simpan ke env, referensi di yaml
            full_url = _build_rtsp_with_auth(cam.rtsp_url, cam.username, cam.password)
            env_lines.append(f"{env_key}={full_url}\n")
            paths_lines.append(
                f"\n  {path_name}:\n"
                f"    source: ${{{env_key}}}\n"
                f"    sourceOnDemandCloseAfter: 60s\n"
            )

    # ── 3. Tulis cameras.env (mode 600 agar hanya root yang bisa baca) ───────
    try:
        with open(env_path, "w", encoding="utf-8") as f:
            f.writelines(env_lines)
        os.chmod(env_path, 0o600)
    except Exception as e:
        print(f"⚠️  Gagal menulis cameras.env: {e}")

    # ── 4. Tulis mediamtx.yml = base + dynamic paths ─────────────────────────
    try:
        with open(config_path, "w", encoding="utf-8") as f:
            f.writelines(base_lines)
            f.writelines(paths_lines)
        print(f"✅ mediamtx.yml diperbarui dengan {len(cameras)} kamera")
    except Exception as e:
        print(f"⚠️  Gagal menulis mediamtx.yml: {e}")
        return

    # ── 5. Reload mediamtx agar paths langsung aktif ─────────────────────────
    try:
        subprocess.run(
            ["systemctl", "reload", "mediamtx"],
            check=False, timeout=5,
            capture_output=True,
        )
    except Exception:
        pass  # Di lingkungan dev (Windows), perintah ini tidak ada — tidak masalah


# Alias backward-compat agar main.py tidak perlu diubah
write_cameras_to_config = write_cameras_paths




def camera_to_dict(cam: Camera, cam_status: str = "offline") -> dict:
    """Ubah model SQLAlchemy ke dict bersih untuk response Pydantic.
    Password TIDAK dikembalikan ke Frontend demi keamanan.
    """
    path = _path_name(cam.owner_id, cam.id)
    return {
        "id": cam.id,
        "owner_id": cam.owner_id,
        "name": cam.name,
        "location": cam.location,
        "rtsp_url": cam.rtsp_url,
        "username": cam.username,
        "password": "",   # Sembunyikan dari API response — tidak bocor ke browser
        "status": cam_status,
        "stream_url": f"{HLS_BASE}/{path}/index.m3u8",
    }


# ─────────────────────────────────────────────────────────────
# GET  /cameras/  — Hanya tampilkan kamera milik user sendiri
#                   ADMIN bisa lihat semua kamera
# ─────────────────────────────────────────────────────────────
@router.get("/", response_model=List[CameraResponse])
async def read_cameras(
    db: deps.DbSession,
    skip: int = 0,
    limit: int = 100,
    current_user: User = Depends(deps.get_current_user)
) -> Any:
    if current_user.role == UserRole.ADMIN:
        stmt = select(Camera).offset(skip).limit(limit)
    else:
        # User biasa hanya lihat kamera miliknya sendiri
        stmt = select(Camera).where(Camera.owner_id == current_user.id).offset(skip).limit(limit)

    result = await db.execute(stmt)
    cameras = result.scalars().all()
    return [camera_to_dict(cam, "offline") for cam in cameras]


# ─────────────────────────────────────────────────────────────
# GET  /cameras/statuses  — Status semua kamera milik user
# ─────────────────────────────────────────────────────────────
@router.get("/statuses")
async def get_all_camera_statuses(
    db: deps.DbSession,
    current_user: User = Depends(deps.get_current_user)
) -> Any:
    if current_user.role == UserRole.ADMIN:
        stmt = select(Camera.id, Camera.owner_id)
    else:
        stmt = select(Camera.id, Camera.owner_id).where(Camera.owner_id == current_user.id)

    result = await db.execute(stmt)
    rows = result.fetchall()
    if not rows:
        return []

    statuses = await asyncio.gather(
        *[get_mediamtx_status(row[1], row[0]) for row in rows]
    )
    return [{"id": row[0], "status": st} for row, st in zip(rows, statuses)]


# ─────────────────────────────────────────────────────────────
# GET  /cameras/{camera_id}/status
# ─────────────────────────────────────────────────────────────
@router.get("/{camera_id}/status")
async def get_camera_status(
    camera_id: int,
    db: deps.DbSession,
    current_user: User = Depends(deps.get_current_user)
) -> Any:
    camera = await _get_owned_camera(camera_id, current_user, db)
    cam_status = await get_mediamtx_status(camera.owner_id, camera_id)
    return {"id": camera_id, "status": cam_status}


# ─────────────────────────────────────────────────────────────
# POST /cameras/  — Semua user (bukan hanya ADMIN) bisa tambah
# ─────────────────────────────────────────────────────────────
@router.post("/", response_model=CameraResponse, status_code=status.HTTP_201_CREATED)
async def create_camera(
    *,
    db: deps.DbSession,
    camera_in: CameraCreate,
    current_user: User = Depends(deps.get_current_user)  # Semua user bisa tambah kamera
) -> Any:
    # C9: Validasi RTSP URL sebelum disimpan (cegah SSRF)
    validated_url = _validate_rtsp_url(camera_in.rtsp_url)
    camera = Camera(
        owner_id=current_user.id,
        name=camera_in.name,
        location=camera_in.location,
        rtsp_url=validated_url,
        username=camera_in.username or None,
        # Enkripsi password sebelum disimpan ke PostgreSQL
        password=encrypt_symmetric(camera_in.password) if camera_in.password else None,
    )
    db.add(camera)
    await db.commit()
    await db.refresh(camera)

    # Bangun URL RTSP yang sudah memiliki kredensial tersemat untuk MediaMTX
    authenticated_url = _build_rtsp_with_auth(
        camera.rtsp_url, camera.username, camera.password
    )
    await register_camera_to_mediamtx(current_user.id, camera.id, authenticated_url)

    # Update mediamtx.yml
    all_cams_result = await db.execute(select(Camera))
    all_cams = all_cams_result.scalars().all()
    write_cameras_to_config(all_cams)

    return camera_to_dict(camera, "offline")


# ─────────────────────────────────────────────────────────────
# PUT /cameras/{camera_id}  — Hanya pemilik atau ADMIN
# ─────────────────────────────────────────────────────────────
@router.put("/{camera_id}", response_model=CameraResponse)
async def update_camera(
    *,
    db: deps.DbSession,
    camera_id: int,
    camera_in: CameraUpdate,
    current_user: User = Depends(deps.get_current_user)
) -> Any:
    camera = await _get_owned_camera(camera_id, current_user, db)

    update_data = camera_in.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        if field == "password":
            if value:
                setattr(camera, field, encrypt_symmetric(value))
        elif field == "rtsp_url" and value:
            # C9: Validasi URL baru juga saat update
            setattr(camera, field, _validate_rtsp_url(value))
        elif field in ("username",) and isinstance(value, str):
            setattr(camera, field, value or None)
        else:
            setattr(camera, field, value)

    db.add(camera)
    await db.commit()
    await db.refresh(camera)

    st = await get_mediamtx_status(camera.owner_id, camera.id)
    return camera_to_dict(camera, st)


# ─────────────────────────────────────────────────────────────
# DELETE /cameras/{camera_id} — Hanya pemilik atau ADMIN
# ─────────────────────────────────────────────────────────────
@router.delete("/{camera_id}")
async def delete_camera(
    *,
    db: deps.DbSession,
    camera_id: int,
    current_user: User = Depends(deps.get_current_user)
) -> Any:
    camera = await _get_owned_camera(camera_id, current_user, db)

    await remove_camera_from_mediamtx(camera.owner_id, camera_id)
    await db.delete(camera)
    await db.commit()

    remaining_result = await db.execute(select(Camera))
    remaining_cams = remaining_result.scalars().all()
    write_cameras_to_config(remaining_cams)
    return {"message": "Camera deleted successfully"}


# ─────────────────────────────────────────────────────────────
# HELPER — Pastikan kamera dimiliki user, atau user adalah ADMIN
# ─────────────────────────────────────────────────────────────
async def _get_owned_camera(camera_id: int, current_user: User, db) -> Camera:
    """Ambil kamera dan validasi kepemilikan. ADMIN bisa akses semua."""
    stmt = select(Camera).where(Camera.id == camera_id)
    result = await db.execute(stmt)
    camera = result.scalar_one_or_none()

    if not camera:
        raise HTTPException(status_code=404, detail="Camera not found")

    # ADMIN bisa akses kamera siapapun
    if current_user.role != UserRole.ADMIN and camera.owner_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Anda tidak memiliki akses ke kamera ini"
        )

    return camera
