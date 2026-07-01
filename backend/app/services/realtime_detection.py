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
import queue
import asyncio
import base64
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
                boxes = []
                use_face_rec = False
                try:
                    import face_recognition
                    use_face_rec = True
                except ImportError:
                    pass

                if use_face_rec:
                    try:
                        # Resize frame untuk mempercepat deteksi (max width 640)
                        target_w = 640
                        if w_img > target_w:
                            scale = target_w / w_img
                            small_frame = cv2.resize(frame, (target_w, int(h_img * scale)))
                        else:
                            scale = 1.0
                            small_frame = frame

                        rgb = cv2.cvtColor(small_frame, cv2.COLOR_BGR2RGB)
                        # HOG model dari dlib sangat akurat dan hemat resource CPU
                        locations = face_recognition.face_locations(rgb, model="hog")
                        
                        for top, right, bottom, left in locations:
                            # Kembalikan koordinat ke skala gambar asli
                            orig_left = left / scale
                            orig_top = top / scale
                            orig_right = right / scale
                            orig_bottom = bottom / scale
                            
                            boxes.append(FaceBox(
                                x=round(orig_left / w_img, 4),
                                y=round(orig_top / h_img, 4),
                                w=round((orig_right - orig_left) / w_img, 4),
                                h=round((orig_bottom - orig_top) / h_img, 4),
                            ))

                        # ── Real-time Face Tracking embedding extraction and queueing ──
                        now = time.time()
                        if len(locations) > 0 and (now - self._last_tracking_time >= 1.5):
                            self._last_tracking_time = now
                            encodings = face_recognition.face_encodings(rgb, locations)
                            for loc, enc in zip(locations, encodings):
                                top_c, right_c, bottom_c, left_c = loc
                                face_crop = small_frame[top_c:bottom_c, left_c:right_c]
                                if face_crop.size > 0:
                                    face_small = cv2.resize(face_crop, (64, 64))
                                    _, buf = cv2.imencode(".jpg", face_small, [cv2.IMWRITE_JPEG_QUALITY, 65])
                                    crop_b64 = base64.b64encode(buf).decode("utf-8")
                                    
                                    enqueue_tracking_item({
                                        "camera_id": self.camera_id,
                                        "camera_name": self.camera_name,
                                        "embedding": enc.tolist(),
                                        "thumbnail": crop_b64,
                                        "timestamp": now,
                                    })
                    except Exception as e:
                        logger.error(f"Error running face_recognition detector: {e}")
                        use_face_rec = False # Fallback jika terjadi error runtime

                if not use_face_rec:
                    gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
                    faces = cascade.detectMultiScale(
                        gray,
                        scaleFactor=1.1,
                        minNeighbors=5,
                        minSize=(30, 30),
                    )
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
                if not use_face_rec:
                    del gray
                del frame

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
    embedding: list[float],
    thumbnail: str,
    timestamp: float,
):
    """Proses pencocokan wajah dan simpan ke database."""
    try:
        import face_recognition
        import numpy as np
        import json
        from sqlalchemy import select
        from app.models.person_tracking import TrackedPerson, PersonSighting
    except ImportError as e:
        logger.error(f"Failed to import required libraries in _process_realtime_sighting: {e}")
        return

    try:
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
                distances = face_recognition.face_distance(rep_encs, target_enc)
                min_idx = int(np.argmin(distances))
                if distances[min_idx] < 0.50:  # MATCH_THRESHOLD
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
