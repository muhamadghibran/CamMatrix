"""
Real-Time Face Detection Service.
Mengelola worker thread per kamera yang menjalankan deteksi wajah
pada frame RTSP secara real-time.

Arsitektur:
  - Satu worker thread per kamera (on-demand)
  - Worker grab frame dari RTSP via OpenCV
  - Jalankan Haar Cascade face detection
  - Simpan hasil bounding box ke shared state
  - Auto-stop jika tidak ada subscriber selama TIMEOUT detik

RAM usage: ~50-150 MB per kamera aktif
"""
import cv2
import time
import logging
import threading
from dataclasses import dataclass, field
from typing import Optional

logger = logging.getLogger(__name__)

# ── Haar Cascade (built-in OpenCV) ──
_cascade = None
_cascade_lock = threading.Lock()


def _get_cascade():
    global _cascade
    if _cascade is None:
        with _cascade_lock:
            if _cascade is None:
                cascade_path = cv2.data.haarcascades + "haarcascade_frontalface_default.xml"
                _cascade = cv2.CascadeClassifier(cascade_path)
                logger.info(f"Haar Cascade loaded: {cascade_path}")
    return _cascade


@dataclass
class FaceBox:
    """Bounding box wajah dalam koordinat relatif (0.0–1.0)."""
    x: float
    y: float
    w: float
    h: float


@dataclass
class DetectionResult:
    """Hasil deteksi satu frame."""
    camera_id: int
    faces: list[FaceBox] = field(default_factory=list)
    timestamp: float = 0.0
    frame_width: int = 0
    frame_height: int = 0

    def to_dict(self) -> dict:
        return {
            "camera_id": self.camera_id,
            "faces": [
                {"x": f.x, "y": f.y, "w": f.w, "h": f.h}
                for f in self.faces
            ],
            "timestamp": self.timestamp,
            "face_count": len(self.faces),
        }


class CameraWorker:
    """
    Worker thread yang menjalankan deteksi wajah pada satu kamera.
    Auto-stop jika tidak ada subscriber selama `timeout` detik.
    """

    def __init__(self, camera_id: int, rtsp_url: str, fps: int = 5, timeout: int = 30):
        self.camera_id = camera_id
        self.rtsp_url = rtsp_url
        self.target_fps = fps
        self.timeout = timeout

        self._thread: Optional[threading.Thread] = None
        self._stop_event = threading.Event()
        self._lock = threading.Lock()

        # Shared state
        self._subscribers: int = 0
        self._last_subscriber_time: float = time.time()
        self._latest_result: Optional[DetectionResult] = None
        self._running: bool = False

    @property
    def is_running(self) -> bool:
        return self._running

    @property
    def latest_result(self) -> Optional[DetectionResult]:
        return self._latest_result

    def add_subscriber(self):
        with self._lock:
            self._subscribers += 1
            self._last_subscriber_time = time.time()
            logger.info(f"Camera {self.camera_id}: subscriber added (total: {self._subscribers})")

    def remove_subscriber(self):
        with self._lock:
            self._subscribers = max(0, self._subscribers - 1)
            if self._subscribers == 0:
                self._last_subscriber_time = time.time()
            logger.info(f"Camera {self.camera_id}: subscriber removed (total: {self._subscribers})")

    def start(self):
        if self._running:
            return
        self._stop_event.clear()
        self._running = True
        self._thread = threading.Thread(
            target=self._worker_loop,
            name=f"face-detect-cam-{self.camera_id}",
            daemon=True,
        )
        self._thread.start()
        logger.info(f"Camera {self.camera_id}: detection worker started")

    def stop(self):
        self._stop_event.set()
        self._running = False
        if self._thread and self._thread.is_alive():
            self._thread.join(timeout=5)
        self._latest_result = None
        logger.info(f"Camera {self.camera_id}: detection worker stopped")

    def _worker_loop(self):
        """Loop utama worker — grab frame, deteksi, simpan hasil."""
        cascade = _get_cascade()
        frame_interval = 1.0 / self.target_fps

        cap = cv2.VideoCapture(self.rtsp_url)
        if not cap.isOpened():
            logger.error(f"Camera {self.camera_id}: gagal membuka RTSP: {self.rtsp_url}")
            self._running = False
            return

        logger.info(f"Camera {self.camera_id}: RTSP stream opened ({self.rtsp_url})")

        try:
            while not self._stop_event.is_set():
                loop_start = time.time()

                # ── Auto-stop jika tidak ada subscriber ──
                with self._lock:
                    if self._subscribers == 0:
                        idle_time = time.time() - self._last_subscriber_time
                        if idle_time > self.timeout:
                            logger.info(
                                f"Camera {self.camera_id}: no subscribers for "
                                f"{idle_time:.0f}s, auto-stopping"
                            )
                            break

                # ── Grab frame ──
                ret, frame = cap.read()
                if not ret:
                    # Stream terputus — coba reconnect
                    logger.warning(f"Camera {self.camera_id}: frame grab failed, reconnecting...")
                    cap.release()
                    time.sleep(2)
                    cap = cv2.VideoCapture(self.rtsp_url)
                    if not cap.isOpened():
                        logger.error(f"Camera {self.camera_id}: reconnect failed")
                        time.sleep(3)
                    continue

                h_img, w_img = frame.shape[:2]

                # ── Deteksi wajah ──
                gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
                faces = cascade.detectMultiScale(
                    gray,
                    scaleFactor=1.1,
                    minNeighbors=5,
                    minSize=(30, 30),
                )

                boxes = []
                if len(faces) > 0:
                    for (x, y, w, h) in faces:
                        boxes.append(FaceBox(
                            x=round(x / w_img, 4),
                            y=round(y / h_img, 4),
                            w=round(w / w_img, 4),
                            h=round(h / h_img, 4),
                        ))

                # ── Simpan hasil ──
                self._latest_result = DetectionResult(
                    camera_id=self.camera_id,
                    faces=boxes,
                    timestamp=time.time(),
                    frame_width=w_img,
                    frame_height=h_img,
                )

                # Bebaskan RAM
                del frame, gray

                # ── Rate limiting ──
                elapsed = time.time() - loop_start
                sleep_time = frame_interval - elapsed
                if sleep_time > 0:
                    time.sleep(sleep_time)

        except Exception as e:
            logger.exception(f"Camera {self.camera_id}: worker error: {e}")
        finally:
            cap.release()
            self._running = False
            logger.info(f"Camera {self.camera_id}: worker loop ended")


class RealtimeDetector:
    """
    Singleton manager untuk semua CameraWorker.
    Mengelola lifecycle worker per kamera.
    """

    def __init__(self, fps: int = 5, timeout: int = 30):
        self._workers: dict[int, CameraWorker] = {}
        self._lock = threading.Lock()
        self._fps = fps
        self._timeout = timeout

    def get_or_create_worker(self, camera_id: int, rtsp_url: str) -> CameraWorker:
        """Ambil worker yang ada atau buat baru. Auto-start jika belum running."""
        with self._lock:
            worker = self._workers.get(camera_id)
            if worker is None or not worker.is_running:
                # Buat worker baru
                worker = CameraWorker(
                    camera_id=camera_id,
                    rtsp_url=rtsp_url,
                    fps=self._fps,
                    timeout=self._timeout,
                )
                self._workers[camera_id] = worker
                worker.start()
            return worker

    def stop_worker(self, camera_id: int):
        """Stop worker tertentu."""
        with self._lock:
            worker = self._workers.pop(camera_id, None)
            if worker:
                worker.stop()

    def stop_all(self):
        """Stop semua worker — dipanggil saat server shutdown."""
        with self._lock:
            for cam_id, worker in list(self._workers.items()):
                worker.stop()
            self._workers.clear()
            logger.info("All detection workers stopped")

    def get_active_cameras(self) -> list[int]:
        """Daftar camera_id yang sedang aktif."""
        with self._lock:
            return [
                cam_id for cam_id, w in self._workers.items()
                if w.is_running
            ]


# ── Singleton instance (dibuat saat import) ──
# FPS dan timeout akan di-override dari config saat startup
_detector: Optional[RealtimeDetector] = None


def get_detector() -> RealtimeDetector:
    """Ambil singleton detector instance."""
    global _detector
    if _detector is None:
        from app.core.config import settings
        _detector = RealtimeDetector(
            fps=settings.AI_REALTIME_FPS,
            timeout=settings.AI_REALTIME_TIMEOUT,
        )
    return _detector


def shutdown_detector():
    """Cleanup saat server shutdown."""
    global _detector
    if _detector:
        _detector.stop_all()
        _detector = None
