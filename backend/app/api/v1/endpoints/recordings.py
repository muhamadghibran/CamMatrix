from typing import Any, List, Optional
from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks, Query
from fastapi.responses import FileResponse
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from pathlib import Path
import os, glob, uuid, logging, shutil, subprocess, json, time
from datetime import datetime, timedelta, timezone

from app.api import deps
from app.models.recording import Recording
from app.models.camera import Camera
from app.schemas.recording import RecordingResponse, RecordingCreate
from app.models.user import User, UserRole
from app.core.storage import generate_presigned_url, upload_file_to_s3

logger = logging.getLogger(__name__)
router = APIRouter()

RECORDINGS_BASE = "/var/www/CamMatrix/recordings"
ALLOWED_RECORDING_ROOT = "/var/lib/mediamtx/recordings"  # kept for legacy trigger-upload

# ─── Helper: resolve file path from minio_key ───────────────────────────────
def _resolve_file_path(minio_key: str) -> Optional[str]:
    """Ekstrak path file lokal dari minio_key.
    Format lama : 'local:{uuid}:{/abs/path/to/file.mp4}'
    Format baru : 'local:{uuid}:{/abs/path/to/file.mp4}:src={source_basename}'
    """
    if not minio_key.startswith("local:"):
        return None
    parts = minio_key.split(":", 2)
    if len(parts) < 3:
        return None
    # Bagian ke-3 bisa mengandung ':src=...' di belakang — potong saja
    raw_path = parts[2]
    # Hapus suffix ':src=...' jika ada
    src_marker = ":src="
    if src_marker in raw_path:
        raw_path = raw_path[:raw_path.index(src_marker)]
    return raw_path

# ─── Helper: cari file MP4 terbaru yang SUDAH SELESAI ditulis ──────────────
def _find_latest_mp4(camera: Camera, min_size_bytes: int = 10_240) -> Optional[str]:
    """Cari segmen rekaman terbaru yang SUDAH SELESAI ditulis MediaMTX.
    - Skip file yang dimodifikasi dalam 75 detik terakhir (masih aktif ditulis,
      moov atom belum ditutup dengan benar → durasi salah).
    - Skip file yang terlalu kecil (rekaman gagal / kosong).
    - Kembali dari terbaru ke terlama, ambil yang pertama memenuhi syarat.
    """
    path = f"cam_{camera.owner_id}_{camera.id}"
    specific_dir = os.path.join(RECORDINGS_BASE, path)

    all_mp4: list[str] = []
    if os.path.isdir(specific_dir):
        all_mp4 = glob.glob(os.path.join(specific_dir, "*.mp4"))
    if not all_mp4:
        all_mp4 = [f for f in glob.glob(
            os.path.join(RECORDINGS_BASE, "**", "*.mp4"), recursive=True
        ) if path in f]
    if not all_mp4:
        return None

    write_guard = time.time() - 75  # segmen aktif dimodifikasi < 75 detik lalu

    # Urutkan terbaru dulu, cari segmen selesai pertama
    all_mp4.sort(key=os.path.getmtime, reverse=True)
    for f in all_mp4:
        try:
            # Lewati file yang masih aktif ditulis
            if os.path.getmtime(f) > write_guard:
                continue
            if os.path.getsize(f) >= min_size_bytes:
                return f
        except OSError:
            continue
    return None


# ─── Helper: kumpulkan semua segmen N menit terakhir ───────────────────────
def _find_segments(camera: Camera, max_minutes: int = 30,
                   min_size_bytes: int = 10_240) -> list:
    """Kembalikan list path segmen rekaman dalam max_minutes menit terakhir,
    diurutkan dari terlama ke terbaru (untuk urutan concat yang benar).
    Mengecualikan file yang sedang aktif ditulis MediaMTX (< 75 detik terakhir).
    """
    path = f"cam_{camera.owner_id}_{camera.id}"
    specific_dir = os.path.join(RECORDINGS_BASE, path)

    all_mp4: list = []
    if os.path.isdir(specific_dir):
        all_mp4 = glob.glob(os.path.join(specific_dir, "*.mp4"))
    if not all_mp4:
        all_mp4 = [f for f in glob.glob(
            os.path.join(RECORDINGS_BASE, "**", "*.mp4"), recursive=True
        ) if path in f]
    if not all_mp4:
        return []

    now        = time.time()
    cutoff     = now - (max_minutes * 60)  # tidak lebih lama dari max_minutes
    # File dimodifikasi < 75 detik lalu = segmen aktif, moov atom belum final
    write_guard = now - 75

    completed = [
        f for f in all_mp4
        if os.path.getmtime(f) >= cutoff          # dalam rentang waktu
        and os.path.getmtime(f) <= write_guard    # BUKAN segmen yang sedang ditulis
        and _safe_getsize(f) >= min_size_bytes
    ]

    # Fallback: jika tidak ada segmen selesai, ambil yang terbesar yang ada
    if not completed:
        candidates = [f for f in all_mp4 if _safe_getsize(f) >= min_size_bytes]
        if candidates:
            completed = [max(candidates, key=_safe_getsize)]

    # Urutkan terlama → terbaru agar hasil concat runtut
    completed.sort(key=os.path.getmtime)
    return completed


def _safe_getsize(path: str) -> int:
    try:
        return os.path.getsize(path)
    except OSError:
        return 0


# ─── Helper: durasi dari nama file MediaMTX + mtime (PALING AKURAT) ────────
def _get_segment_duration(file_path: str) -> Optional[int]:
    """Hitung durasi segmen dari nama file MediaMTX dan mtime.
    MediaMTX menamai file dengan waktu MULAI (e.g. 2026-05-12_18-35-11.mp4).
    MediaMTX MENUTUP file saat segmen berikutnya dimulai → mtime = waktu selesai.
    Durasi = mtime - waktu_mulai_dari_nama_file.
    """
    import re
    from datetime import datetime as dt
    basename = os.path.basename(file_path)
    m = re.match(r'(\d{4}-\d{2}-\d{2})_(\d{2}-\d{2}-\d{2})\.mp4$', basename)
    if not m:
        return None
    try:
        start = dt.strptime(f"{m.group(1)} {m.group(2).replace('-', ':')}",
                            "%Y-%m-%d %H:%M:%S")
        end   = dt.fromtimestamp(os.path.getmtime(file_path))
        dur   = int((end - start).total_seconds())
        return dur if 10 <= dur <= 300 else None
    except Exception:
        return None


# ─── Helper: dapatkan durasi aktual via ffprobe (fallback) ──────────────────
def _get_duration_ffprobe(file_path: str) -> Optional[int]:
    """Gunakan ffprobe untuk mendapat durasi aktual video (detik).
    Kembalikan None jika ffprobe tidak tersedia.
    """
    try:
        result = subprocess.run(
            ["ffprobe", "-v", "quiet", "-print_format", "json",
             "-show_format", file_path],
            capture_output=True, text=True, timeout=15
        )
        if result.returncode == 0:
            data = json.loads(result.stdout)
            dur = float(data.get("format", {}).get("duration", 0))
            return int(dur) if dur > 0 else None
    except Exception:
        pass
    return None


# ─── Helper: gabungkan beberapa segmen MP4 dengan ffmpeg ─────────────────
def _concat_segments(segments: list, output_path: str) -> bool:
    """Gabungkan list file MP4 menjadi satu file.
    Selalu re-encode untuk segmen ganda agar timestamp pasti benar.
    Return True jika berhasil.
    """
    if not segments:
        return False
    if len(segments) == 1:
        shutil.copy2(segments[0], output_path)
        return True

    list_file = output_path + ".concat.txt"
    try:
        with open(list_file, "w") as f:
            for seg in segments:
                safe = seg.replace("'", "'\\''")
                f.write(f"file '{safe}'\n")

        # Re-encode dengan libx264 — satu-satunya cara PASTI menghasilkan
        # timestamp sequential yang benar dari segmen MediaMTX.
        # Tanpa ini, player berhenti di batas segmen pertama.
        # veryfast + crf23 = kualitas baik, kecepatan encode ~10-20x realtime.
        result = subprocess.run(
            ["ffmpeg", "-y",
             "-f", "concat", "-safe", "0",
             "-i", list_file,
             "-c:v", "libx264", "-preset", "veryfast", "-crf", "23",
             "-an",                          # Strip audio (CCTV biasanya tanpa audio)
             "-movflags", "+faststart",      # Moov di depan untuk streaming web
             output_path],
            capture_output=True, timeout=600   # max 10 menit encode
        )

        if result.returncode == 0 and os.path.exists(output_path) \
                and os.path.getsize(output_path) > 1024:
            logger.info(
                f"Concat {len(segments)} segmen berhasil: "
                f"{os.path.getsize(output_path)//1024} KB"
            )
            return True

        # Fallback: jika libx264 gagal (misal: ffmpeg tanpa encoder),
        # coba stream copy sebagai cadangan terakhir
        logger.warning("Re-encode gagal, mencoba stream copy sebagai fallback...")
        r2 = subprocess.run(
            ["ffmpeg", "-y",
             "-f", "concat", "-safe", "0",
             "-fflags", "+igndts",
             "-i", list_file,
             "-c", "copy",
             "-avoid_negative_ts", "make_zero",
             "-movflags", "+faststart",
             output_path],
            capture_output=True, timeout=180
        )
        return r2.returncode == 0 and os.path.getsize(output_path) > 1024

    except FileNotFoundError:
        # ffmpeg tidak terinstall — copy segmen terbesar saja
        logger.error("ffmpeg tidak ditemukan! Install: sudo apt install ffmpeg -y")
        largest = max(segments, key=_safe_getsize)
        shutil.copy2(largest, output_path)
        return True
    except Exception as e:
        logger.error(f"_concat_segments error: {e}")
        return False
    finally:
        if os.path.exists(list_file):
            try:
                os.remove(list_file)
            except OSError:
                pass


# ─── GET /recordings/ ────────────────────────────────────────────────────────
@router.get("/", response_model=List[RecordingResponse])
async def read_recordings(
    db: deps.DbSession,
    skip: int = 0,
    limit: int = 100,
    camera_id: int = None,
    current_user: User = Depends(deps.get_current_user_full_scope)
) -> Any:
    stmt = select(Recording, Camera).join(Camera, Recording.camera_id == Camera.id)
    if current_user.role != UserRole.ADMIN:
        stmt = stmt.where(Camera.owner_id == current_user.id)
    if camera_id is not None:
        stmt = stmt.where(Recording.camera_id == camera_id)

    stmt = stmt.order_by(Recording.created_at.desc()).offset(skip).limit(limit)
    result = await db.execute(stmt)
    rows = result.all()

    responses = []
    for rec, cam in rows:
        file_path = _resolve_file_path(rec.minio_key)
        # Untuk rekaman lokal, gunakan URL download API; untuk MinIO gunakan presigned URL
        if file_path:
            url = ""  # Frontend akan build URL dengan token
        else:
            url = generate_presigned_url(rec.minio_key) or ""
        resp = RecordingResponse.model_validate(rec).model_copy(
            update={"url": url, "camera_name": cam.name if cam else None}
        )
        responses.append(resp)
    return responses


# ─── POST /recordings/capture/{camera_id} ────────────────────────────────────
@router.post("/capture/{camera_id}", status_code=201)
async def capture_recording(
    camera_id: int,
    db: deps.DbSession,
    current_user: User = Depends(deps.get_current_user_full_scope)
) -> Any:
    """
    Ambil segmen rekaman terbaru yang SUDAH SELESAI ditulis MediaMTX,
    salin ke folder captured (snapshot statis), catat ke DB dengan durasi aktual.

    Pendekatan 1 segmen: setiap kali REC ditekan menghasilkan file unik
    berisi ~1 menit rekaman terbaru yang benar — tidak ada duplikasi.
    """
    cam_result = await db.execute(select(Camera).where(Camera.id == camera_id))
    camera = cam_result.scalar_one_or_none()
    if not camera:
        raise HTTPException(status_code=404, detail="Kamera tidak ditemukan")
    if current_user.role != UserRole.ADMIN and camera.owner_id != current_user.id:
        raise HTTPException(status_code=403, detail="Akses ditolak")

    # Cari segmen terbaru yang sudah selesai ditulis (lewati segmen aktif)
    latest_file = _find_latest_mp4(camera)

    if not latest_file:
        path_check = f"cam_{camera.owner_id}_{camera.id}"
        any_files = glob.glob(os.path.join(RECORDINGS_BASE, path_check, "*.mp4"))
        if any_files:
            raise HTTPException(
                status_code=404,
                detail="Rekaman sedang ditulis. Tunggu sekitar 60 detik lalu coba lagi."
            )
        raise HTTPException(
            status_code=404,
            detail=f"Belum ada rekaman untuk kamera '{camera.name}'. "
                   "Pastikan kamera sudah menyala dan recording aktif."
        )

    # ── Deduplication: cegah capture segmen yang sama lebih dari sekali ──────
    source_basename  = os.path.basename(latest_file)   # e.g. "2026-05-12_20-35-11.mp4"
    source_file_size = os.path.getsize(latest_file)

    # Cek 1: source_basename ada di minio_key (format baru)
    dedupe_window = datetime.now(timezone.utc) - timedelta(minutes=10)
    dup_result = await db.execute(
        select(Recording)
        .where(Recording.camera_id == camera_id)
        .where(Recording.minio_key.contains(source_basename))
        .where(Recording.created_at >= dedupe_window)
        .limit(1)
    )
    if dup_result.scalar_one_or_none():
        raise HTTPException(
            status_code=409,
            detail=(
                "Segmen ini sudah pernah disimpan. "
                "MediaMTX menulis segmen baru setiap ~60 detik. "
                "Tunggu sebentar lalu coba lagi."
            )
        )

    # Cek 2: fallback — ukuran file + kamera sama dalam 5 menit (format lama)
    size_window = datetime.now(timezone.utc) - timedelta(minutes=5)
    size_dup = await db.execute(
        select(Recording)
        .where(Recording.camera_id == camera_id)
        .where(Recording.size_bytes == source_file_size)
        .where(Recording.created_at >= size_window)
        .limit(1)
    )
    if size_dup.scalar_one_or_none():
        raise HTTPException(
            status_code=409,
            detail=(
                "Rekaman dengan konten yang sama baru saja disimpan (5 menit terakhir). "
                "Tunggu segmen baru dari kamera lalu coba lagi."
            )
        )
    # ─────────────────────────────────────────────────────────────────────────

    # Hitung durasi dari segmen ASLI sebelum dicopy (filename + mtime = akurat)
    # ffprobe TIDAK akurat untuk MediaMTX karena moov atom di-pre-allocate salah.
    actual_duration = (
        _get_segment_duration(latest_file)      # paling akurat: nama file + mtime
        or _get_duration_ffprobe(latest_file)   # fallback: ffprobe
        or max(int(os.path.getsize(latest_file) // 150_000), 10)  # estimasi
    )

    # Salin segmen ke folder captured — sertakan source_basename agar traceable
    captured_dir = os.path.join(RECORDINGS_BASE, "captured")
    os.makedirs(captured_dir, exist_ok=True)

    snap_name = f"{camera.name.replace(' ', '_')}_{source_basename.replace('.mp4', '')}_{uuid.uuid4().hex[:6]}.mp4"
    snap_path = os.path.join(captured_dir, snap_name)
    shutil.copy2(latest_file, snap_path)

    snap_size = os.path.getsize(snap_path)

    # Encode source_basename ke minio_key agar dedup di atas bisa mendeteksinya
    unique_key = f"local:{uuid.uuid4().hex}:{snap_path}:src={source_basename}"
    rec = Recording(
        camera_id=camera_id,
        minio_key=unique_key,
        duration=actual_duration,
        size_bytes=snap_size,
    )
    db.add(rec)
    await db.commit()
    await db.refresh(rec)

    logger.info(
        f"Capture '{camera.name}': {snap_name} "
        f"({snap_size // 1024} KB, {actual_duration}s, src={source_basename})"
    )

    return {
        "id":          rec.id,
        "camera_id":   camera_id,
        "camera_name": camera.name,
        "file_size":   snap_size,
        "duration":    actual_duration,
        "created_at":  rec.created_at.isoformat(),
        "message":     f"Rekaman '{camera.name}' berhasil disimpan ({actual_duration}s)."
    }


# ─── GET /recordings/{recording_id}/download ─────────────────────────────────
@router.get("/{recording_id}/download", response_class=FileResponse)
async def download_recording_by_id(
    recording_id: int,
    db: deps.DbSession,
    token: Optional[str] = Query(None),
    current_user: Optional[User] = Depends(deps.get_optional_user),
) -> Any:
    """
    Unduh file rekaman berdasarkan ID.
    Auth: Bearer header ATAU ?token= query param.
    """
    # Autentikasi via query token jika header tidak ada
    if current_user is None:
        if not token:
            raise HTTPException(status_code=401, detail="Token diperlukan")
        from app.core.security import decode_access_token
        payload = decode_access_token(token)
        if not payload:
            raise HTTPException(status_code=401, detail="Token tidak valid atau kadaluarsa")
        user_id = payload.get("sub")
        stmt = select(User).where(User.id == int(user_id))
        result = await db.execute(stmt)
        current_user = result.scalar_one_or_none()
        if not current_user:
            raise HTTPException(status_code=401, detail="User tidak ditemukan")

    rec_result = await db.execute(select(Recording).where(Recording.id == recording_id))
    recording = rec_result.scalar_one_or_none()
    if not recording:
        raise HTTPException(status_code=404, detail="Rekaman tidak ditemukan")

    cam_result = await db.execute(select(Camera).where(Camera.id == recording.camera_id))
    camera = cam_result.scalar_one_or_none()
    if not camera:
        raise HTTPException(status_code=404, detail="Kamera tidak ditemukan")

    if current_user.role != UserRole.ADMIN and camera.owner_id != current_user.id:
        raise HTTPException(status_code=403, detail="Akses ditolak")

    file_path = _resolve_file_path(recording.minio_key)
    if not file_path:
        raise HTTPException(status_code=400, detail="Format rekaman tidak mendukung download lokal")

    if not os.path.exists(file_path):
        raise HTTPException(
            status_code=404,
            detail="File rekaman tidak ditemukan di server. Mungkin sudah dihapus."
        )

    ts = recording.created_at.strftime("%Y%m%d_%H%M%S")
    download_name = f"{camera.name.replace(' ', '_')}_{ts}.mp4"

    return FileResponse(path=file_path, filename=download_name, media_type="video/mp4")


# ─── DELETE /recordings/{recording_id} ───────────────────────────────────────
@router.delete("/{recording_id}")
async def delete_recording(
    recording_id: int,
    db: deps.DbSession,
    current_user: User = Depends(deps.get_current_admin)
) -> Any:
    stmt = select(Recording).where(Recording.id == recording_id)
    result = await db.execute(stmt)
    recording = result.scalar_one_or_none()
    if not recording:
        raise HTTPException(status_code=404, detail="Recording not found")
    await db.delete(recording)
    await db.commit()
    return {"message": "Recording deleted"}


# ─── Legacy: POST /recordings/trigger-upload ─────────────────────────────────
def upload_job_sync(file_path: str, camera_id: int, minio_key: str):
    try:
        success = upload_file_to_s3(file_path, minio_key)
        if success:
            os.remove(file_path)
    except Exception:
        logger.exception(f"Upload job failed for {file_path}")

@router.post("/trigger-upload", status_code=202)
async def trigger_upload(
    camera_id: int,
    background_tasks: BackgroundTasks,
    db: deps.DbSession,
    current_user: User = Depends(deps.get_current_admin)
):
    """Legacy: Upload rekaman ke MinIO."""
    cam_result = await db.execute(select(Camera).where(Camera.id == camera_id))
    camera = cam_result.scalar_one_or_none()
    if not camera:
        raise HTTPException(status_code=404, detail="Camera not found")
    if current_user.role != UserRole.ADMIN and camera.owner_id != current_user.id:
        raise HTTPException(status_code=403, detail="Akses ditolak")

    cam_path = f"cam_{camera.owner_id}_{camera.id}"
    file_path = os.path.join(ALLOWED_RECORDING_ROOT, cam_path, "latest.mp4")
    real_path = os.path.realpath(file_path)
    if not real_path.startswith(os.path.realpath(ALLOWED_RECORDING_ROOT)):
        raise HTTPException(status_code=400, detail="Path tidak valid")
    if not os.path.exists(file_path):
        raise HTTPException(status_code=400, detail="File rekaman belum tersedia")

    file_size = os.path.getsize(file_path)
    file_name = Path(file_path).name
    minio_key = f"camera_{camera_id}/{file_name}"

    rec = Recording(camera_id=camera_id, minio_key=minio_key, duration=300, size_bytes=file_size)
    db.add(rec)
    await db.commit()
    background_tasks.add_task(upload_job_sync, file_path, camera_id, minio_key)
    return {"message": "Upload triggered"}
