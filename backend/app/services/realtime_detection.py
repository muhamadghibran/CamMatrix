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
import time
import logging
import threading
import queue
import asyncio
import base64
import os
from dataclasses import dataclass, field
from typing import Optional

# Paksa OpenCV menggunakan TCP untuk semua stream RTSP guna mencegah packet loss/corrupt H.264
os.environ["OPENCV_FFMPEG_CAPTURE_OPTIONS"] = "rtsp_transport;tcp"

# Guard import cv2 — bisa gagal jika NumPy ABI tidak kompatibel
try:
    import cv2
    _CV2_AVAILABLE = True
except Exception as _cv2_import_err:
    cv2 = None  # type: ignore
    _CV2_AVAILABLE = False
    import logging as _log
    _log.getLogger(__name__).error(
        f"[OpenCV] Gagal import cv2: {_cv2_import_err}. "
        "Face detection dinonaktifkan. "
        "Fix: pip install opencv-python-headless==4.10.0.84"
    )

from app.core.dlib_lock import dlib_lock  # Cegah SEGFAULT akibat concurrent dlib

logger = logging.getLogger(__name__)

# ── Flag untuk pause sementara realtime dlib (saat batch tracking berjalan) ──
_dlib_paused = threading.Event()  # Set = paused, Clear = running

def pause_realtime_dlib():
    """Pause semua camera worker agar tidak memakai dlib. Dipanggil saat batch tracking."""
    _dlib_paused.set()
    logger.info("[dlib] Realtime detection di-pause untuk batch tracking")

def resume_realtime_dlib():
    """Resume camera workers setelah batch tracking selesai."""
    _dlib_paused.clear()
    logger.info("[dlib] Realtime detection di-resume")

# ── Haar Cascade (built-in OpenCV) ──
_cascade = None
_cascade_load_attempted = False
_cascade_lock = threading.Lock()

# Cek apakah opencv build ini mendukung CascadeClassifier
_HAS_CASCADE = _CV2_AVAILABLE and hasattr(cv2, "CascadeClassifier")
if not _CV2_AVAILABLE:
    logger.error("[OpenCV] cv2 tidak dapat diimpor \u2014 face detection dinonaktifkan sepenuhnya.")
elif not _HAS_CASCADE:
    logger.warning(
        "cv2.CascadeClassifier tidak tersedia di build OpenCV ini. "
        "Face detection via Haar akan dinonaktifkan. "
        "Fix: pip install opencv-python-headless==4.10.0.84"
    )


def _get_cascade():
    global _cascade, _cascade_load_attempted
    if not _HAS_CASCADE:
        return None
    if _cascade_load_attempted:
        return _cascade
    with _cascade_lock:
        if _cascade_load_attempted:
            return _cascade
        _cascade_load_attempted = True
        try:
            cascade_path = cv2.data.haarcascades + "haarcascade_frontalface_alt2.xml"
            _cascade = cv2.CascadeClassifier(cascade_path)
            if _cascade.empty():
                cascade_path = cv2.data.haarcascades + "haarcascade_frontalface_default.xml"
                _cascade = cv2.CascadeClassifier(cascade_path)
                if _cascade.empty():
                    logger.error("Haar Cascade XML tidak ditemukan — cascade dinonaktifkan")
                    _cascade = None
                else:
                    logger.info(f"Haar Cascade fallback loaded: {cascade_path}")
            else:
                logger.info(f"Haar Cascade alt2 loaded: {cascade_path}")
        except Exception as e:
            logger.error(f"Gagal inisialisasi Haar Cascade: {e}")
            _cascade = None
    return _cascade


# ── Pre-check face_recognition (bisa gagal dengan SystemExit jika pkg_resources hilang) ──
_FACE_REC_AVAILABLE = False
try:
    import face_recognition as _fr_test  # noqa: F401
    _FACE_REC_AVAILABLE = True
    logger.info("AI: face_recognition (dlib) tersedia — embedding presisi tinggi aktif")
except BaseException as _fr_err:
    logger.warning(
        f"AI: face_recognition tidak tersedia ({type(_fr_err).__name__}: {_fr_err}). "
        "Menggunakan Haar Cascade bawaan. "
        "Fix: pip install setuptools && pip install face_recognition"
    )


class FaceBox:
    """Bounding box wajah dalam koordinat relatif (0.0–1.0)."""
    x: float
    y: float
    w: float
    h: float


def _calculate_iou(box1: FaceBox, box2: FaceBox) -> float:
    """Hitung Intersection over Union (IoU) antara dua FaceBox."""
    x1_1, y1_1, w1, h1 = box1.x, box1.y, box1.w, box1.h
    x2_1, y2_1 = x1_1 + w1, y1_1 + h1

    x1_2, y1_2, w2, h2 = box2.x, box2.y, box2.w, box2.h
    x2_2, y2_2 = x1_2 + w2, y1_2 + h2

    x1_i = max(x1_1, x1_2)
    y1_i = max(y1_1, y1_2)
    x2_i = min(x2_1, x2_2)
    y2_i = min(y2_1, y2_2)

    if x1_i >= x2_i or y1_i >= y2_i:
        return 0.0

    intersection_area = (x2_i - x1_i) * (y2_i - y1_i)
    area1 = w1 * h1
    area2 = w2 * h2
    union_area = area1 + area2 - intersection_area

    if union_area <= 0:
        return 0.0
    return intersection_area / union_area


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

    def __init__(self, camera_id: int, camera_name: str, rtsp_url: str, fps: int = 5, timeout: int = 30):
        self.camera_id = camera_id
        self.camera_name = camera_name
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
        self._last_tracking_time: float = 0.0
        self._prev_boxes: list[FaceBox] = []

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
        """Loop utama worker — grab frame, deteksi cepat, kirim bounding box, simpan tracking."""
        try:
            cascade = _get_cascade()
        except Exception as e:
            logger.error(f"Camera {self.camera_id}: gagal load cascade: {e}")
            cascade = None
        frame_interval = 1.0 / max(1, self.target_fps)

        # ── Coba buka stream RTSP dengan retry ──
        cap = None
        for attempt in range(5):
            if self._stop_event.is_set():
                self._running = False
                return
            cap = cv2.VideoCapture(self.rtsp_url)
            if cap.isOpened():
                break
            logger.warning(
                f"Camera {self.camera_id}: mencoba koneksi RTSP ({attempt + 1}/5) ke {self.rtsp_url}..."
            )
            time.sleep(1.5)

        if not cap or not cap.isOpened():
            # Fallback: coba path MediaMTX lokal jika berbeda
            from app.core.config import settings
            alt_url = f"{settings.MEDIAMTX_RTSP_BASE}/cam_{self.camera_id}"
            if self.rtsp_url != alt_url:
                logger.info(f"Camera {self.camera_id}: mencoba fallback path MediaMTX: {alt_url}")
                cap = cv2.VideoCapture(alt_url)

        if not cap or not cap.isOpened():
            logger.error(f"Camera {self.camera_id}: gagal membuka RTSP: {self.rtsp_url}")
            self._running = False
            return

        logger.info(f"Camera {self.camera_id}: RTSP stream berhasil dibuka ({self.rtsp_url})")

        # Gunakan flag module-level (sudah di-test saat startup, aman dari SystemExit)
        has_face_rec = _FACE_REC_AVAILABLE
        if has_face_rec:
            logger.info(f"Camera {self.camera_id}: face_recognition tersedia")
        else:
            logger.info(f"Camera {self.camera_id}: menggunakan Haar Cascade saja (face_recognition tidak tersedia)")

        try:
            while not self._stop_event.is_set():
                loop_start = time.time()

                # ── Auto-stop jika tidak ada subscriber ──
                with self._lock:
                    if self._subscribers <= 0:
                        idle_time = time.time() - self._last_subscriber_time
                        if idle_time > self.timeout:
                            logger.info(
                                f"Camera {self.camera_id}: tidak ada subscriber selama "
                                f"{idle_time:.0f}s, auto-stopping worker"
                            )
                            break

                # ── Grab frame ──
                ret, frame = cap.read()
                if not ret:
                    logger.warning(f"Camera {self.camera_id}: frame grab gagal, mencoba reconnect...")
                    cap.release()
                    time.sleep(1.5)
                    cap = cv2.VideoCapture(self.rtsp_url)
                    if not cap.isOpened():
                        time.sleep(2.0)
                    continue

                h_img, w_img = frame.shape[:2]
                if h_img == 0 or w_img == 0:
                    continue

                # ── Resize untuk deteksi cepat (max width 640) ──
                scale = 1.0
                if w_img > 640:
                    scale = 640.0 / w_img
                    proc_w = 640
                    proc_h = int(h_img * scale)
                    proc_frame = cv2.resize(frame, (proc_w, proc_h))
                else:
                    proc_frame = frame

                gray = cv2.cvtColor(proc_frame, cv2.COLOR_BGR2GRAY)

                # ── Deteksi wajah cepat menggunakan Haar Cascade (~5-10ms) ──
                if cascade is None:
                    # Haar Cascade tidak tersedia, simpan hasil kosong
                    raw_faces = []
                else:
                    raw_faces = cascade.detectMultiScale(
                        gray,
                        scaleFactor=1.1,
                        minNeighbors=4,
                        minSize=(24, 24),
                    )

                boxes = []
                pixel_boxes = []

                for (sx, sy, sw, sh) in raw_faces:
                    # Kembalikan koordinat ke frame asli
                    orig_x = int(sx / scale)
                    orig_y = int(sy / scale)
                    orig_w = int(sw / scale)
                    orig_h = int(sh / scale)

                    # Filter rasio aspek wajah manusia
                    aspect_ratio = orig_w / max(1, orig_h)
                    if not (0.6 <= aspect_ratio <= 1.4):
                        continue

                    # Pastikan dalam batas frame
                    orig_x = max(0, min(orig_x, w_img - 1))
                    orig_y = max(0, min(orig_y, h_img - 1))
                    orig_w = max(1, min(orig_w, w_img - orig_x))
                    orig_h = max(1, min(orig_h, h_img - orig_y))

                    pixel_boxes.append((orig_x, orig_y, orig_w, orig_h))
                    boxes.append(FaceBox(
                        x=round(orig_x / w_img, 4),
                        y=round(orig_y / h_img, 4),
                        w=round(orig_w / w_img, 4),
                        h=round(orig_h / h_img, 4),
                    ))

                # ── Face Tracking & Embedding Extraction (interval ~1s) ──
                now = time.time()
                if len(pixel_boxes) > 0 and (now - self._last_tracking_time >= 1.0):
                    self._last_tracking_time = now

                    for (px, py, pw, ph) in pixel_boxes:
                        face_crop = frame[py:py+ph, px:px+pw]
                        if face_crop.size == 0:
                            continue

                        # Thumbnail kecil untuk disimpan
                        face_small = cv2.resize(face_crop, (64, 64))
                        _, buf = cv2.imencode(".jpg", face_small, [cv2.IMWRITE_JPEG_QUALITY, 65])
                        crop_b64 = base64.b64encode(buf).decode("utf-8")

                        embedding = None
                        if has_face_rec and not _dlib_paused.is_set():
                            try:
                                import face_recognition
                                rgb_crop = cv2.cvtColor(face_crop, cv2.COLOR_BGR2RGB)
                                ch, cw = face_crop.shape[:2]
                                loc = [(0, cw, ch, 0)]
                                with dlib_lock:
                                    encs = face_recognition.face_encodings(rgb_crop, loc)
                                    if encs:
                                        embedding = encs[0].tolist()
                            except Exception as e:
                                logger.debug(f"Face encoding error: {e}")

                        enqueue_tracking_item({
                            "camera_id": self.camera_id,
                            "camera_name": self.camera_name,
                            "embedding": embedding,
                            "thumbnail": crop_b64,
                            "timestamp": now,
                        })
                        break  # 1 wajah utama per siklus untuk hemat CPU

                # ── Simpan hasil untuk streaming WebSocket ──
                self._latest_result = DetectionResult(
                    camera_id=self.camera_id,
                    faces=boxes,
                    timestamp=now,
                    frame_width=w_img,
                    frame_height=h_img,
                )
                self._prev_boxes = boxes

                # Bebaskan RAM
                del gray
                if proc_frame is not frame:
                    del proc_frame
                del frame

                # ── Rate limiting ──
                elapsed = time.time() - loop_start
                sleep_time = frame_interval - elapsed
                if sleep_time > 0:
                    time.sleep(sleep_time)

        except Exception as e:
            logger.exception(f"Camera {self.camera_id}: worker error: {e}")
        finally:
            if cap:
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

    def get_or_create_worker(self, camera_id: int, camera_name: str, rtsp_url: str) -> CameraWorker:
        """Ambil worker yang ada atau buat baru. Auto-start jika belum running."""
        with self._lock:
            worker = self._workers.get(camera_id)
            if worker is None or not worker.is_running:
                # Buat worker baru
                worker = CameraWorker(
                    camera_id=camera_id,
                    camera_name=camera_name,
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


# ── Background Real-time Face Tracking Queue & Listener ──
_tracking_queue = queue.Queue()
_listener_task: Optional[asyncio.Task] = None
_stop_listener = False


def enqueue_tracking_item(item: dict):
    """Masukkan item deteksi wajah ke antrean untuk diproses background task."""
    try:
        _tracking_queue.put_nowait(item)
    except queue.Full:
        logger.warning("Tracking queue is full, dropping item")


async def start_realtime_tracking_listener():
    """Mulai background listener untuk memproses tracking real-time."""
    global _listener_task, _stop_listener
    if _listener_task is not None:
        return
    _stop_listener = False
    _listener_task = asyncio.create_task(_tracking_listener_loop())
    logger.info("Real-time tracking listener started")


async def stop_realtime_tracking_listener():
    """Hentikan background listener."""
    global _listener_task, _stop_listener
    _stop_listener = True
    if _listener_task:
        _listener_task.cancel()
        try:
            await _listener_task
        except asyncio.CancelledError:
            pass
        _listener_task = None
    logger.info("Real-time tracking listener stopped")


async def _tracking_listener_loop():
    """Loop utama untuk membaca queue dan memproses data tracking."""
    from app.core.database import AsyncSessionLocal
    while not _stop_listener:
        try:
            try:
                item = _tracking_queue.get_nowait()
            except queue.Empty:
                await asyncio.sleep(0.5)
                continue

            camera_id = item["camera_id"]
            camera_name = item["camera_name"]
            embedding = item["embedding"]
            thumbnail = item["thumbnail"]
            timestamp = item["timestamp"]

            async with AsyncSessionLocal() as db:
                await _process_realtime_sighting(
                    db=db,
                    camera_id=camera_id,
                    camera_name=camera_name,
                    embedding=embedding,
                    thumbnail=thumbnail,
                    timestamp=timestamp,
                )

            _tracking_queue.task_done()
        except asyncio.CancelledError:
            break
        except Exception as e:
            logger.error(f"Error in tracking listener loop: {e}", exc_info=True)
            await asyncio.sleep(1.0)


async def _process_realtime_sighting(
    db,
    camera_id: int,
    camera_name: str,
    embedding,  # list[float] atau None (Haar Cascade fallback)
    thumbnail: str,
    timestamp: float,
):
    """Proses pencocokan wajah dan simpan ke database."""
    try:
        import json
        from sqlalchemy import select
        from app.models.person_tracking import TrackedPerson, PersonSighting
    except Exception as e:
        logger.error(f"Failed to import DB models in _process_realtime_sighting: {e}")
        return

    try:
        # Jika tidak ada embedding (Haar fallback), catat sighting tanpa matching vektor
        if not embedding:
            await _record_haar_sighting(db, camera_id, camera_name, thumbnail, timestamp)
            return

        # Cek apakah library matching (face_recognition & numpy) tersedia
        try:
            import face_recognition
            import numpy as np
            has_matching_libs = True
        except ImportError:
            has_matching_libs = False

        if not has_matching_libs:
            await _record_haar_sighting(db, camera_id, camera_name, thumbnail, timestamp)
            return

        # 1. Ambil semua data person untuk dicocokkan
        result = await db.execute(select(TrackedPerson))
        tracked_persons = result.scalars().all()

        target_enc = np.array(embedding)
        matched_person = None
        matched_distance = float("inf")

        if tracked_persons:
            rep_encs = []
            valid_persons = []
            for p in tracked_persons:
                try:
                    emb = json.loads(p.embedding_json)
                    if isinstance(emb, list) and len(emb) == 128:
                        rep_encs.append(np.array(emb))
                        valid_persons.append(p)
                except Exception:
                    continue

            if rep_encs:
                with dlib_lock:
                    distances = face_recognition.face_distance(rep_encs, target_enc)
                min_idx = int(np.argmin(distances))
                if distances[min_idx] < 0.55:  # MATCH_THRESHOLD
                    matched_person = valid_persons[min_idx]
                    matched_distance = distances[min_idx]

        if matched_person:
            # Update TrackedPerson
            p = matched_person
            try:
                old_emb = np.array(json.loads(p.embedding_json))
                new_emb = ((old_emb * p.total_sightings + target_enc) / (p.total_sightings + 1)).tolist()
            except Exception:
                new_emb = embedding

            p.total_sightings += 1
            p.embedding_json = json.dumps(new_emb)
            db.add(p)

            # Cari sighting terbaru untuk kamera ini yang juga merupakan real-time (recording_id=None)
            recent_result = await db.execute(
                select(PersonSighting)
                .where(
                    PersonSighting.person_id == p.id,
                    PersonSighting.camera_id == camera_id,
                    PersonSighting.recording_id == None
                )
                .order_by(PersonSighting.id.desc())
                .limit(1)
            )
            recent_sighting = recent_result.scalar_one_or_none()

            # Jika penampakan terakhir kurang dari 30 detik yang lalu, gabungkan
            if recent_sighting and (timestamp - recent_sighting.last_timestamp_sec < 30.0):
                recent_sighting.last_timestamp_sec = timestamp
                recent_sighting.frame_count += 1
                recent_sighting.thumbnail = thumbnail
                db.add(recent_sighting)
            else:
                # Sesi sighting baru (setelah 30s menghilang)
                ps = PersonSighting(
                    person_id=p.id,
                    recording_id=None,
                    camera_name=camera_name,
                    camera_id=camera_id,
                    first_timestamp_sec=timestamp,
                    last_timestamp_sec=timestamp,
                    frame_count=1,
                    thumbnail=thumbnail,
                )
                db.add(ps)
        else:
            # Buat orang baru
            tp = TrackedPerson(
                embedding_json=json.dumps(embedding),
                first_thumbnail=thumbnail,
                first_camera_name=camera_name,
                first_seen_at=timestamp,
                total_sightings=1,
            )
            db.add(tp)
            await db.flush()

            # Buat sighting baru
            ps = PersonSighting(
                person_id=tp.id,
                recording_id=None,
                camera_name=camera_name,
                camera_id=camera_id,
                first_timestamp_sec=timestamp,
                last_timestamp_sec=timestamp,
                frame_count=1,
                thumbnail=thumbnail,
            )
            db.add(ps)

        await db.commit()
    except Exception as e:
        logger.error(f"Error processing realtime sighting in database: {e}", exc_info=True)
        await db.rollback()


async def _record_haar_sighting(db, camera_id: int, camera_name: str, thumbnail: str, timestamp: float):
    """Catat sighting dari Haar Cascade (tanpa face_recognition embedding).
    Buat TrackedPerson baru dengan embedding kosong jika belum ada sighting
    real-time untuk kamera ini dalam 60 detik terakhir.
    """
    try:
        import json
        from sqlalchemy import select
        from app.models.person_tracking import TrackedPerson, PersonSighting

        # Cari sighting real-time terakhir dari kamera ini (dalam 60 detik)
        recent = await db.execute(
            select(PersonSighting)
            .where(
                PersonSighting.camera_id == camera_id,
                PersonSighting.recording_id == None,
            )
            .order_by(PersonSighting.last_timestamp_sec.desc())
            .limit(1)
        )
        last = recent.scalar_one_or_none()

        if last and (timestamp - last.last_timestamp_sec < 60.0):
            # Perbarui sighting yang ada
            last.last_timestamp_sec = timestamp
            last.frame_count += 1
            last.thumbnail = thumbnail
            db.add(last)
        else:
            # Buat TrackedPerson baru (placeholder, tanpa embedding)
            tp = TrackedPerson(
                embedding_json=json.dumps([]),  # kosong — Haar tidak punya embedding
                first_thumbnail=thumbnail,
                first_camera_name=camera_name,
                first_seen_at=timestamp,
                total_sightings=1,
            )
            db.add(tp)
            await db.flush()

            ps = PersonSighting(
                person_id=tp.id,
                recording_id=None,
                camera_name=camera_name,
                camera_id=camera_id,
                first_timestamp_sec=timestamp,
                last_timestamp_sec=timestamp,
                frame_count=1,
                thumbnail=thumbnail,
            )
            db.add(ps)

        await db.commit()
    except Exception as e:
        logger.error(f"Error recording Haar sighting: {e}", exc_info=True)
        await db.rollback()


# ── Always-on background detection (tanpa perlu WS subscriber) ──
_always_on_task: Optional[asyncio.Task] = None
_stop_always_on = False


async def start_always_on_detection():
    """Mulai deteksi background untuk semua kamera yang ada di DB.
    Berjalan independen dari WebSocket — kamera terus dimonitor meski tidak ada
    browser yang membuka Live View.
    """
    global _always_on_task, _stop_always_on
    if _always_on_task is not None:
        return
    _stop_always_on = False
    _always_on_task = asyncio.create_task(_always_on_loop())
    logger.info("Always-on background detection started")


async def stop_always_on_detection():
    """Hentikan always-on detection."""
    global _always_on_task, _stop_always_on
    _stop_always_on = True
    if _always_on_task:
        _always_on_task.cancel()
        try:
            await _always_on_task
        except asyncio.CancelledError:
            pass
        _always_on_task = None
    logger.info("Always-on background detection stopped")


async def _always_on_loop():
    """Loop background: pastikan semua kamera aktif selalu terdeteksi."""
    from app.core.database import AsyncSessionLocal
    from app.models.camera import Camera
    from sqlalchemy import select

    # Tunggu sebentar agar server fully ready
    await asyncio.sleep(5)
    logger.info("Always-on loop: checking cameras in DB...")

    while not _stop_always_on:
        try:
            async with AsyncSessionLocal() as db:
                result = await db.execute(select(Camera))
                cameras = result.scalars().all()

            detector = get_detector()
            for cam in cameras:
                try:
                    # Build RTSP URL
                    from app.core.config import settings
                    if cam.rtsp_url == "publisher":
                        rtsp_url = f"{settings.MEDIAMTX_RTSP_BASE}/cam_{cam.owner_id}_{cam.id}"
                    else:
                        try:
                            from app.api.v1.endpoints.cameras import _build_rtsp_with_auth
                            rtsp_url = _build_rtsp_with_auth(cam.rtsp_url, cam.username, cam.password)
                        except Exception:
                            rtsp_url = cam.rtsp_url

                    # Start worker jika belum running (tidak tambah subscriber —
                    # worker ini tidak auto-stop karena subscriber=0)
                    worker = detector._workers.get(cam.id)
                    if worker is None or not worker.is_running:
                        logger.info(f"Always-on: starting worker for camera {cam.id} ({cam.name})")
                        # Buat worker dengan timeout sangat panjang (24 jam)
                        new_worker = CameraWorker(
                            camera_id=cam.id,
                            camera_name=cam.name,
                            rtsp_url=rtsp_url,
                            fps=detector._fps,
                            timeout=86400,  # 24 jam — efektif "selalu menyala"
                        )
                        # Tambah 1 subscriber virtual agar worker tidak auto-stop
                        new_worker._subscribers = 1
                        with detector._lock:
                            detector._workers[cam.id] = new_worker
                        new_worker.start()
                except Exception as e:
                    logger.warning(f"Always-on: failed to start worker for camera {cam.id}: {e}")

            # Periksa lagi setiap 60 detik
            await asyncio.sleep(60)

        except asyncio.CancelledError:
            break
        except Exception as e:
            logger.error(f"Always-on loop error: {e}", exc_info=True)
            await asyncio.sleep(30)
