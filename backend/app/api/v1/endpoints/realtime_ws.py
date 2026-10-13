"""
WebSocket endpoint untuk Real-Time Face Detection.

Route:
  WS /ws/realtime/{camera_id}?token=JWT_TOKEN

Flow:
  1. Client connect dengan JWT token di query param
  2. Backend validasi token → ambil data kamera dari DB
  3. Bangun RTSP URL → start/join CameraWorker
  4. Setiap ~200ms kirim hasil deteksi (JSON bounding boxes)
  5. Client disconnect → remove subscriber → worker auto-stop jika 0 subscribers
"""
import asyncio
import json
import logging
from urllib.parse import unquote
from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Query
from sqlalchemy import select

from app.core.database import AsyncSessionLocal
from app.models.camera import Camera
from app.models.user import User
from app.services.realtime_detection import get_detector

logger = logging.getLogger(__name__)
router = APIRouter()


async def _authenticate_ws(token: str):
    """Validasi JWT token dan return user. None jika gagal."""
    if not token:
        return None
    try:
        # Bersihkan token jika terbungkus encoding atau prefix Bearer
        token = unquote(token).strip()
        if token.lower().startswith("bearer "):
            token = token[7:].strip()

        from app.core.security import decode_access_token
        payload = decode_access_token(token)
        if not payload:
            return None
        user_id = payload.get("sub")
        if not user_id:
            return None

        async with AsyncSessionLocal() as db:
            result = await db.execute(
                select(User).where(User.id == int(user_id))
            )
            user = result.scalar_one_or_none()
            return user
    except Exception as e:
        logger.warning(f"WS auth failed: {e}")
        return None


async def _get_camera_rtsp(camera_id: int):
    """Ambil RTSP URL kamera dari database dan bangun URL lengkap."""
    try:
        from app.api.v1.endpoints.cameras import _build_rtsp_with_auth
    except ImportError:
        _build_rtsp_with_auth = None

    async with AsyncSessionLocal() as db:
        result = await db.execute(
            select(Camera).where(Camera.id == camera_id)
        )
        cam = result.scalar_one_or_none()
        if not cam:
            return None, None

        from app.core.config import settings
        # Path default di MediaMTX lokal
        local_mediamtx_url = f"{settings.MEDIAMTX_RTSP_BASE}/cam_{cam.owner_id}_{cam.id}"

        if cam.rtsp_url == "publisher":
            rtsp_url = local_mediamtx_url
        elif _build_rtsp_with_auth:
            built = _build_rtsp_with_auth(cam.rtsp_url, cam.username, cam.password)
            # Jika rtsp_url adalah IP LAN private yang tak terjangkau langsung oleh VPS,
            # prioritaskan stream MediaMTX yang sudah me-relay stream tersebut
            if any(p in built for p in ("192.168.", "10.", "172.16.")):
                rtsp_url = local_mediamtx_url
            else:
                rtsp_url = built
        else:
            rtsp_url = cam.rtsp_url

        return cam, rtsp_url


@router.websocket("/realtime/{camera_id}")
async def ws_realtime_detection(
    websocket: WebSocket,
    camera_id: int,
    token: str = Query(default=""),
):
    """
    WebSocket endpoint untuk streaming deteksi wajah real-time.

    Query params:
      - token: JWT token untuk autentikasi

    Mengirim JSON setiap ~200ms:
    {
      "camera_id": 5,
      "faces": [{"x": 0.32, "y": 0.15, "w": 0.12, "h": 0.18}],
      "face_count": 1,
      "timestamp": 1718700000.123
    }
    """
    # ── 1. Autentikasi ──
    user = await _authenticate_ws(token)
    if not user:
        await websocket.accept()
        await websocket.send_json({"type": "error", "message": "Unauthorized"})
        await websocket.close(code=4001, reason="Unauthorized")
        return

    # ── 2. Ambil data kamera ──
    cam, rtsp_url = await _get_camera_rtsp(camera_id)
    if not cam or not rtsp_url:
        await websocket.accept()
        await websocket.send_json({"type": "error", "message": "Camera not found"})
        await websocket.close(code=4004, reason="Camera not found")
        return

    # ── 3. Accept WebSocket ──
    await websocket.accept()
    logger.info(f"WS connected: user={user.email}, camera={camera_id}")

    # ── 4. Start/join detection worker ──
    detector = get_detector()
    worker = detector.get_or_create_worker(camera_id, cam.name, rtsp_url)
    worker.add_subscriber()

    try:
        # Kirim pesan awal
        await websocket.send_json({
            "type": "connected",
            "camera_id": camera_id,
            "camera_name": cam.name,
            "message": "Real-time detection started",
        })

        # ── 5. Loop: kirim deteksi setiap ~200ms ──
        send_interval = 1.0 / max(1, detector._fps or 5)
        last_timestamp = 0.0

        while True:
            # Cek apakah worker masih running
            if not worker.is_running:
                await asyncio.sleep(1.0)
                worker = detector.get_or_create_worker(camera_id, cam.name, rtsp_url)
                worker.add_subscriber()

            result = worker.latest_result
            if result and result.timestamp != last_timestamp:
                last_timestamp = result.timestamp
                await websocket.send_json(result.to_dict())

            await asyncio.sleep(send_interval)

    except WebSocketDisconnect:
        logger.info(f"WS disconnected: user={user.email}, camera={camera_id}")
    except Exception as e:
        logger.warning(f"WS error: camera={camera_id}, error={e}")
    finally:
        if worker:
            worker.remove_subscriber()
        logger.info(f"WS cleanup done: camera={camera_id}")
