# 📋 CamMatrix — Security & Bug Audit Report

**Repository**: https://github.com/muhamadghibran/CamMatrix
**Commit yang di-audit**: `7bf55b9` (branch main, satu-satunya commit)
**Auditor**: Senior DevOps / IEP Platform
**Tanggal audit**: 2026-04-23
**Scope**: Backend (FastAPI), Frontend (React/Vite), Deployment scripts (systemd), Infra config (Docker, MediaMTX, MinIO, PostgreSQL), Alembic migrations

**Konsep produk** (dikonfirmasi user): platform manajemen CCTV mirip LeuitCam — ada halaman publik untuk melihat CCTV tanpa login admin + area admin untuk manage kamera, user, rekaman.

**Ringkasan temuan**:
- 🔴 **11 Critical** — bypass autentikasi, hijack stream, arbitrary file read/delete, info disclosure
- 🟠 **14 High** — privilege escalation vectors, weak crypto defaults, deployment hardening
- 🟡 **20 Medium** — bug fungsional, konsistensi data, race conditions
- 🟢 **~20 Low** — kualitas kode, UX, dokumentasi

Keseluruhan: **struktur proyek di atas rata-rata untuk level magang** (async FastAPI pattern benar, Alembic dipakai dari awal, i18n 3 bahasa, Zustand store terpisah per domain). Tapi **backend-nya punya banyak lubang auth & kontrol akses** yang menggagalkan visi keamanan platform CCTV. Dokumen ini me-listing semua temuan dengan file:line supaya anak magang bisa langsung buka dan fix tanpa tebak-tebakan.

---

## Daftar Isi
1. [Gap Konsep vs Implementasi](#gap-konsep-vs-implementasi)
2. [Critical (🔴)](#critical-)
3. [High (🟠)](#high-)
4. [Medium (🟡)](#medium-)
5. [Low (🟢)](#low-)
6. [Information Disclosure](#information-disclosure)
7. [Hal yang Sudah Bagus](#hal-yang-sudah-bagus)
8. [Rekomendasi Handoff (3 Milestone)](#rekomendasi-handoff-3-milestone)
9. [Checklist PR Gate](#checklist-pr-gate)
10. [Pelajaran untuk Anak Magang](#pelajaran-untuk-anak-magang)

---

## Gap Konsep vs Implementasi

README.md dan BLUEPRINT menjanjikan 3 fitur inti yang **belum ada di kode**:

| Klaim di README | Kondisi kode |
|---|---|
| "Kamera Publik — Admin dapat menandai kamera sebagai publik untuk semua pengguna" (README:63-66) | `Camera` model (`backend/app/models/camera.py:5-14`) **tidak punya kolom `is_public`**. Semua endpoint `/cameras/*` require `Depends(get_current_user)`. Tidak ada route publik di `App.jsx`. |
| "Deteksi wajah real-time dengan AI (YOLO / DeepFace)" (README:73-77) | `FaceAnalyticsPage.jsx` 100% mock. Tidak ada inference code, tidak ada model weights, tidak ada endpoint `/api/v1/face`. |
| "Rekaman video otomatis ke storage MinIO/S3" (README:49-71) | `RecordingsPage.jsx:7-15` pakai **array hardcoded**. Endpoint `/recordings/trigger-upload` ada tapi mock (duration hardcoded 300s, tidak ada worker real). |
| "Statistik Real-time" | Polling 15 detik via `setInterval`, bukan WebSocket. |

**Action untuk intern**: pilih satu dari dua jalur — (A) implementasikan fitur yang dijanjikan, atau (B) revisi README supaya jujur dengan kondisi kode sekarang. Lebih cepat & lebih profesional menggunakan jalur B dulu, baru bangun fitur sesuai kemampuan.

---

## Critical (🔴)

### C1 — Google OAuth tanpa verifikasi signature (authentication bypass total)
**File**: `backend/app/api/v1/endpoints/auth.py:79-134` + `frontend/src/pages/LoginPage.jsx:135-146`

Frontend base64-decode JWT Google tanpa verify, lalu kirim `{google_id, email, full_name}` sebagai plain dict ke backend. Komentar kode bahkan mengaku: *"Decode JWT dari Google (tanpa verifikasi — backend harus verify di produksi)"*. Backend trust begitu saja.

**Exploit**:
```bash
curl -X POST http://server:8000/api/v1/auth/google \
  -H "Content-Type: application/json" \
  -d '{"google_id":"attacker-x","email":"admin@vms.com","full_name":"x"}'
# → dapat access_token ADMIN kalau admin@vms.com sudah terdaftar
```

**Fix**:
```python
from google.oauth2 import id_token
from google.auth.transport import requests as grq

idinfo = id_token.verify_oauth2_token(
    payload["credential"],          # kirim ID token utuh, bukan dict
    grq.Request(),
    settings.GOOGLE_CLIENT_ID,
)
email, sub, name = idinfo["email"], idinfo["sub"], idinfo.get("name")
```
Frontend kirim `{credential: response.credential}` saja — jangan decode di client.

---

### C2 — MediaMTX publik tanpa auth, bisa hijack stream + admin API
**File**: `backend/app/api/v1/endpoints/cameras.py:97-105` (auto-generate) + `media_server/mediamtx.yml:19-27` + `docker-compose.yml:54`

```yaml
authInternalUsers:
  - user: any
    pass:
    ips: []
    permissions: [publish, read, playback, api]
```

Siapapun dari internet bisa:
1. Baca stream semua kamera (HLS :8888, WebRTC :8889)
2. **Hijack stream** dengan publish ke path yang sama (override feed asli)
3. Panggil MediaMTX admin API :9997 → add/delete paths, baca konfigurasi
4. `docker-compose.yml:54` expose `9997:9997` publik

**Fix**:
```yaml
authInternalUsers:
  - user: publisher
    pass: <random-strong>
    ips: [127.0.0.1]
    permissions:
      - {action: publish}
      - {action: api}
  - user: any            # anonymous viewer — read only, khusus path publik
    pass:
    permissions:
      - {action: read, path: "pub_*"}
      - {action: playback, path: "pub_*"}
```
Plus: bind API ke 127.0.0.1, jangan expose :9997 di compose, pisah path naming `pub_*` untuk publik vs `cam_*` untuk private.

---

### C3 — Demo login fallback + hardcoded admin123
**File**: `frontend/src/pages/LoginPage.jsx:85-93` + `backend/create_admin.py:32` + `README.md:258`

```js
} catch {
  if ((form.email === "admin@vms.com" || form.email === "admin") && form.password === "admin123") {
    setAuth({ name: "Administrator", email: form.email, role: "ADMIN" }, null);
    navigate("/app/dashboard");  // ← login admin fake saat backend unreachable
  }
}
```

Attacker cukup block backend (DNS/firewall) di browser → auto-login ADMIN di frontend, bisa lihat semua UI admin. `create_admin.py:32` juga create admin asli dengan password `admin123`. README publik di GitHub eksposed kredensial ini.

**Fix**: hapus total fallback dari `LoginPage.jsx`, hapus `create_admin.py` (gunakan `install_all.sh` yang generate password random), hapus baris kredensial dari README.

---

### C4 — Endpoint admin tanpa auth dependency
**File**: `backend/main.py:75-112`

```python
@app.post("/api/v1/cameras/sync-mediamtx", tags=["Admin"])
async def sync_cameras_to_mediamtx():
    ...
```

Tidak ada `Depends(get_current_admin)`. Siapapun trigger → backend enumerate semua kamera dari DB + tulis ulang `mediamtx.yml` + expose list kamera dalam response termasuk `cam.rtsp_url`.

**Fix**: tambah `current_user: User = Depends(deps.get_current_admin)` di parameter. Atau pindahkan ke `endpoints/cameras.py` yang sudah ada router proper.

---

### C5 — Info disclosure: siapapun bisa list semua recording
**File**: `backend/app/api/v1/endpoints/recordings.py:17-39`

```python
@router.get("/", response_model=List[RecordingResponse])
async def read_recordings(db, skip, limit, camera_id=None,
                          current_user: User = Depends(deps.get_current_user)):
    stmt = select(Recording)
    if camera_id is not None:
        stmt = stmt.where(Recording.camera_id == camera_id)
    # ← TIDAK ADA filter ownership
```

Viewer biasa bisa `GET /recordings/?camera_id=1,2,3,...` dan dapat URL presigned dari semua rekaman user lain.

**Fix**: join ke `Camera`, filter `Camera.owner_id == current_user.id` (kecuali admin):
```python
stmt = select(Recording).join(Camera)
if current_user.role != UserRole.ADMIN:
    stmt = stmt.where(Camera.owner_id == current_user.id)
if camera_id is not None:
    stmt = stmt.where(Recording.camera_id == camera_id)
```

---

### C6 — Arbitrary file read & delete via `/trigger-upload`
**File**: `backend/app/api/v1/endpoints/recordings.py:66-98`

```python
async def trigger_upload(
    camera_id: int, file_path: str,  # ← user-supplied path!
    ...
):
    if not os.path.exists(file_path):
        raise HTTPException(...)
    file_size = os.path.getsize(file_path)
    ...
    background_tasks.add_task(upload_job_sync, file_path, camera_id, minio_key)
    # upload_job_sync() panggil upload_file_to_s3() + os.remove()
```

Admin endpoint, tapi:
1. Upload file apapun yang readable oleh process (termasuk `.env`, `/etc/shadow` kalau service run as root — dan memang run as root, lihat H2) ke S3 (attacker bucket)
2. **Hapus file apapun** setelah upload sukses (`os.remove(file_path)` di `upload_job_sync`)
3. Filename di `minio_key = f"camera_{camera_id}/{file_name}"` — kalau filename mengandung `..`, escape bucket prefix

**Fix**: jangan terima path dari user. Generate path internal dari konvensi MediaMTX (misal `/var/lib/mediamtx/recordings/{path_name}/{timestamp}.mp4`), validate dengan `os.path.realpath(p).startswith(ALLOWED_ROOT)`, tolak jika tidak match.

---

### C7 — SQLAlchemy internal state bocor ke response
**File**: `backend/app/api/v1/endpoints/recordings.py:34-37`

```python
for rec in recordings:
    rec_dict = rec.__dict__.copy()         # ← termasuk _sa_instance_state
    rec_dict["url"] = generate_presigned_url(rec.minio_key) or ""
    response_list.append(rec_dict)
```

`rec.__dict__` berisi `_sa_instance_state` (SQLAlchemy internal). Pydantic `RecordingResponse` mungkin gagal serialize, atau worse: bocorkan instance state ke klien.

**Fix**: gunakan schema conversion:
```python
return [
    RecordingResponse.model_validate(rec).model_copy(
        update={"url": generate_presigned_url(rec.minio_key) or ""}
    )
    for rec in recordings
]
```

---

### C8 — Password kamera RTSP plaintext + dikembalikan ke client
**File**: `backend/app/models/camera.py:14`, `backend/app/api/v1/endpoints/cameras.py:130`, `backend/app/schemas/camera.py:21`

- Model: `password: Mapped[str | None]` — plaintext di PostgreSQL
- Endpoint: `camera_to_dict` return `"password": cam.password` di response
- Schema: `CameraResponse(CameraBase)` mewarisi field `password` dari `CameraBase`

Setiap owner kamera (dan admin) dapat response JSON yang berisi plaintext password IP cam. Kalau satu akun di-compromise, credential puluhan IP cam ikut bocor.

**Fix**:
1. Enkripsi at-rest: gunakan `cryptography.fernet` dengan key dari `settings` (atau KMS). Simpan ciphertext.
2. **Jangan pernah return password** ke client. Buat schema terpisah:
   ```python
   class CameraResponse(BaseModel):
       id: int
       name: str
       location: str
       status: str
       stream_url: str
       # NO password, NO rtsp_url (kalau rtsp_url berisi credential inline)
   ```
3. Di `register_camera_to_mediamtx`, construct RTSP URL dengan credential di sana: `rtsp://{user}:{pass}@host/path` — MediaMTX yang fetch, bukan client.

---

### C9 — SSRF via RTSP URL user-controlled
**File**: `backend/app/api/v1/endpoints/cameras.py:199-226`

```python
camera = Camera(
    ..., rtsp_url=camera_in.rtsp_url, ...  # ← tanpa validasi
)
await register_camera_to_mediamtx(current_user.id, camera.id, camera.rtsp_url)
```

User bisa submit:
- `http://169.254.169.254/latest/meta-data/` (AWS metadata endpoint — leak instance credentials)
- `http://localhost:9997/v3/config/paths/list` (MediaMTX admin API)
- `file:///etc/passwd` (bergantung implementasi MediaMTX)
- `http://internal.corp/admin` (pivot internal network)

MediaMTX akan fetch dari server side → SSRF pivot.

**Fix**:
```python
from urllib.parse import urlparse
import ipaddress

def validate_rtsp_url(url: str) -> str:
    parsed = urlparse(url)
    if parsed.scheme not in ("rtsp", "rtsps"):
        raise HTTPException(400, "Only rtsp:// or rtsps:// allowed")
    host = parsed.hostname
    try:
        ip = ipaddress.ip_address(host)
        if ip.is_private or ip.is_loopback or ip.is_link_local or ip.is_reserved:
            raise HTTPException(400, "Private/loopback IPs not allowed")
    except ValueError:
        pass  # hostname, akan di-resolve MediaMTX — tambah DNS rebinding guard jika perlu
    return url
```

---

### C10 — SECRET_KEY default tertanam di kode
**File**: `backend/app/core/config.py:10`

```python
SECRET_KEY: str = "change-this-to-a-very-strong-secret-key"
```

Deploy tanpa `.env` → JWT signing pakai secret yang diketahui publik (repo GitHub). Attacker bisa forge JWT untuk ADMIN user mana saja.

**Fix**: jangan kasih default. Raise di startup kalau env kosong:
```python
SECRET_KEY: str  # no default

@field_validator("SECRET_KEY")
@classmethod
def secret_key_strong(cls, v):
    if not v or len(v) < 32 or v.startswith("change-this"):
        raise ValueError("SECRET_KEY must be set to a strong random value >= 32 chars")
    return v
```

---

### C11 — Hardcoded IP publik + CORS permissive
**File**: `backend/main.py:49-55` dan `backend/app/api/v1/endpoints/cameras.py:16`

```python
# main.py
allow_origins=["http://localhost:5173", "http://103.180.198.240:5173"],
allow_methods=["*"], allow_headers=["*"],
allow_credentials=True,

# cameras.py
HLS_BASE = "http://103.180.198.240:8888"
```

Masalah:
1. IP publik `103.180.198.240` hardcoded di 2 file — deploy ke server lain = broken
2. `allow_methods=["*"]` + `allow_headers=["*"]` + `allow_credentials=True` = overly permissive (subtle: walau origin specific, tetap risky untuk pattern matching mistake di masa depan)
3. Tidak ada HTTPS — semua URL `http://`

**Fix**: pindah ke env var:
```python
# config.py
CORS_ORIGINS: list[str] = Field(default_factory=list)
HLS_BASE_URL: str = "http://localhost:8888"
```
Parse `CORS_ORIGINS` dari `.env`, whitelist method explicit: `["GET","POST","PUT","DELETE"]`.

---

## High (🟠)

### H1 — Admin password 48-bit + f-string SQL injection pattern
**File**: `linux_deployment/install_all.sh:33,144`

```bash
ADMIN_PASS=$(openssl rand -hex 6)       # = 48 bit saja, bruteforce beberapa jam
...
await session.execute(text(f"INSERT INTO users ... VALUES (..., '{hashed}', ...)"))
```

Hash bcrypt char-set aman, tapi pola f-string interpolation ke raw SQL = anti-pattern dan harus dihindari.

**Fix**:
```bash
ADMIN_PASS=$(openssl rand -base64 24)   # ≥128 bit
```
```python
await session.execute(
    text("INSERT INTO users (full_name, email, hashed_password, role, is_active) "
         "VALUES (:fn, :em, :hp, :rl, :ac) ON CONFLICT DO NOTHING"),
    {"fn": "System Admin", "em": "admin@vms.com", "hp": hashed, "rl": "ADMIN", "ac": True}
)
```

---

### H2 — Semua systemd service jalan sebagai root
**File**: `linux_deployment/cammatrix-backend.service:6`, `cammatrix-frontend.service:6`, `mediamtx.service:9`, `minio.service:11-12`

```ini
[Service]
User=root
```

Kalau ada RCE di salah satu service (backend punya beberapa vector di atas), attacker langsung dapat root → full compromise server. Plus `install_all.sh` copy proyek ke `/var/www/CamMatrix/` dengan ownership root — backend write file di path owned root.

**Fix**:
```bash
# install_all.sh
useradd -r -s /bin/false cammatrix
chown -R cammatrix:cammatrix /var/www/CamMatrix
```
```ini
# cammatrix-backend.service
[Service]
User=cammatrix
Group=cammatrix
NoNewPrivileges=true
ProtectSystem=strict
ProtectHome=true
PrivateTmp=true
ReadWritePaths=/var/www/CamMatrix/backend /var/log/cammatrix
CapabilityBoundingSet=
AmbientCapabilities=
RestrictNamespaces=true
RestrictRealtime=true
LockPersonality=true
MemoryDenyWriteExecute=true
```
Apply serupa untuk mediamtx, frontend (npx serve atau nginx), minio.

---

### H3 — Kredensial ter-commit di `docker-compose.yml`
**File**: `docker-compose.yml:11,28`

```yaml
POSTGRES_PASSWORD: yourpassword
MINIO_ROOT_PASSWORD: minioadmin
```

**Fix**: gunakan `env_file: .env` atau `${POSTGRES_PASSWORD}` dan dokumentasikan di `.env.example` untuk di-supply user.

---

### H4 — Rate limiting di-declare tapi tidak di-wire
**File**: `backend/requirements.txt:30`

```
slowapi>=0.1.9
```

Tapi tidak ada `SlowAPIMiddleware` di `main.py`, tidak ada `@limiter.limit()` di endpoint manapun. Endpoint `/auth/login`, `/auth/register`, `/auth/google` brute-forceable.

**Fix**:
```python
# main.py
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded

limiter = Limiter(key_func=get_remote_address)
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# auth.py
@router.post("/login")
@limiter.limit("5/minute")
async def login(request: Request, ...): ...

@router.post("/register")
@limiter.limit("3/hour")
async def register(request: Request, ...): ...

@router.post("/google")
@limiter.limit("10/minute")
async def google(request: Request, ...): ...
```

---

### H5 — JWT expiry inkonsisten, tidak ada revocation
**File**: `backend/app/core/config.py:12` (24 jam) vs `linux_deployment/install_all.sh:40` (30 menit)

Plus: tidak ada refresh token, tidak ada blacklist/revocation list. Logout hanya hapus token di client — token server-side masih valid sampai expire.

**Fix**: samakan ke 60 menit access token + implement refresh token endpoint + Redis-backed jti blacklist untuk logout/revocation.

---

### H6 — JWT claim minimal, tidak ada issuer/audience
**File**: `backend/app/core/security.py:18-34`

```python
payload = {"sub": str(subject), "exp": expire, "iat": datetime.now(timezone.utc)}
if extra_claims:
    payload.update(extra_claims)       # ← bisa override sub/exp/iat!
```

Masalah:
1. Tidak ada `iss` (issuer), `aud` (audience), `jti` (unique ID) → susah untuk revocation & multi-service trust
2. `payload.update(extra_claims)` bisa override `sub`/`exp`/`iat` kalau dipanggil dengan `extra_claims={"exp": far_future_date}`. Walau caller saat ini tidak abuse, pattern-nya risky

**Fix**:
```python
payload = {
    "sub": str(subject),
    "exp": expire,
    "iat": datetime.now(timezone.utc),
    "iss": settings.JWT_ISSUER,
    "aud": settings.JWT_AUDIENCE,
    "jti": str(uuid.uuid4()),
}
reserved = {"sub", "exp", "iat", "iss", "aud", "jti"}
if extra_claims:
    for k, v in extra_claims.items():
        if k not in reserved:
            payload[k] = v
```
Saat decode: `jwt.decode(token, key, algorithms=[ALG], audience=settings.JWT_AUDIENCE, issuer=settings.JWT_ISSUER)`.

---

### H7 — Presigned URL 1 jam dikirim massal di response
**File**: `backend/app/core/storage.py:15-29` + `recordings.py:36`

```python
def generate_presigned_url(object_name, expiration=3600) -> Optional[str]: ...
# recordings.py
rec_dict["url"] = generate_presigned_url(rec.minio_key) or ""
```

URL dengan signature valid 1 jam diserahkan ke client — bisa disebar/share ke pihak ketiga, tidak ada auth ulang saat fetch video.

**Fix**: kecilkan `ExpiresIn=300` (5 menit), plus log + audit trail setiap pembuatan URL. Lebih aman: proxy streaming via backend dengan re-auth per request.

---

### H8 — `cp -r . $APP_DIR || true` silent ignore
**File**: `linux_deployment/install_all.sh:24`

Copy gagal tidak ter-report. Installer tampak sukses meski project tidak ter-copy → systemd service gagal start dengan error tidak jelas.

**Fix**: hapus `|| true`, atau ganti dengan `rsync -a --exclude=.git --exclude=node_modules ./ "$APP_DIR/"` yang lebih robust.

---

### H9 — MediaMTX bind 0.0.0.0 tanpa firewall
**File**: `linux_deployment/mediamtx.service` + `install_all.sh`

MediaMTX listen di `:8554` RTSP, `:8888` HLS, `:8889` WebRTC, `:9997` API — semua 0.0.0.0. Installer tidak setup `ufw`/`iptables`.

**Fix**: tambah ke `install_all.sh`:
```bash
ufw --force enable
ufw default deny incoming
ufw allow 22/tcp                    # SSH
ufw allow 5173/tcp                  # frontend (temporary, nanti pindah nginx 80/443)
ufw allow 8888/tcp                  # HLS public stream
ufw allow 8889/tcp                  # WebRTC public stream
# port 8554, 9997 tidak di-allow → MediaMTX API + RTSP hanya dari localhost
```

---

### H10 — Boto3 client dibuat ulang tiap call + error swallow
**File**: `backend/app/core/storage.py:7-38`

```python
def get_s3_client():
    return boto3.client("s3", ...)       # ← bikin baru tiap panggilan

def generate_presigned_url(...):
    try: ...
    except Exception:
        return None                       # ← swallow tanpa log
```

Performance: boto3 client creation ~100ms. Di list recording 100 items = 10 detik overhead.
Debugging: error dimakan, console kosong.

**Fix**: singleton module-level client + proper logging.

---

### H11 — Password minimum 6 char, no complexity
**File**: `frontend/src/pages/LoginPage.jsx:103`

```js
if (form.password.length < 6) { setError("Password minimal 6 karakter."); return; }
```

Plus: tidak ada check common passwords, tidak ada complexity rule. Backend juga tidak re-validate.

**Fix**: minimum 10 karakter, block top-1000 common passwords (bisa pakai library `zxcvbn-python` di backend), enforce juga di FastAPI schema:
```python
class UserRegister(BaseModel):
    password: str = Field(min_length=10, max_length=128)

    @field_validator("password")
    @classmethod
    def not_common(cls, v):
        if v.lower() in COMMON_PASSWORDS:
            raise ValueError("Password terlalu umum")
        return v
```

---

### H12 — `isAuthenticated` persisted tanpa re-verify
**File**: `frontend/src/store/authStore.js` + `frontend/src/App.jsx:19-22`

```js
export const useAuthStore = create(
  persist((set) => ({ isAuthenticated: false, ... }), { name: "vms-auth" })
);

function ProtectedRoute({ children }) {
  const { isAuthenticated } = useAuthStore();
  return isAuthenticated ? children : <Navigate to="/login" replace />;
}
```

Kalau JWT sudah expired, frontend tetap percaya sudah login (stale state di localStorage). User baru tahu setelah hit API 401 → redirect.

**Fix**: pada app mount, panggil `GET /auth/me` sekali untuk verify token masih valid. Kalau 401, auto-logout sebelum render `/app/*`.

---

### H13 — 2FA + session_duration di DB tapi tidak di-enforce
**File**: `backend/app/models/setting.py:25-26` + `backend/app/api/v1/endpoints/settings.py`

```python
two_factor: Mapped[bool] = mapped_column(Boolean, default=False)
session_duration: Mapped[int] = mapped_column(Integer, default=60)
```

User bisa toggle `two_factor=True` di settings tapi login endpoint tidak pernah check — fake 2FA. Sama untuk `session_duration`.

**Fix**: kalau belum implement 2FA, **hapus field** dari model & schema. Jangan simpan placeholder yang kasih user false sense of security.

---

### H14 — Lifespan startup sync tanpa auth ke MediaMTX
**File**: `backend/main.py:11-33`

```python
async with httpx.AsyncClient(timeout=3.0) as client:
    for cam in cameras:
        await client.post(f"{settings.MEDIAMTX_API_URL}/v3/config/paths/add/{path}",
                          json={"source": cam.rtsp_url})
```

Sekarang MediaMTX tanpa auth (C2), jadi POST-nya sukses. Setelah C2 di-fix (MediaMTX auth aktif), sync ini akan 401 — startup silent fail (dibungkus try/except).

**Fix**: saat C2 di-fix, tambah basic auth:
```python
async with httpx.AsyncClient(
    timeout=3.0,
    auth=(settings.MEDIAMTX_API_USER, settings.MEDIAMTX_API_PASS)
) as client: ...
```

---

## Medium (🟡)

### M1 — Role case inkonsisten antara backend & frontend
**File**: `backend/app/models/user.py:7-10` vs `frontend/src/pages/UsersPage.jsx:7-11` + `frontend/src/pages/LoginPage.jsx` + `App.jsx:27`

```python
# backend
class UserRole(str, enum.Enum):
    ADMIN = "admin"           # ← value lowercase
    OPERATOR = "operator"
    VIEWER = "viewer"
```
```js
// frontend
const roleStyle = {
  ADMIN: {...}, OPERATOR: {...}, VIEWER: {...}  // ← key uppercase
};
<option value="ADMIN">Admin</option>
```

Pydantic v2 default serialize `str+Enum` dengan `.value` = lowercase. Tapi SQLAlchemy `Enum(UserRole)` simpan dengan `.name` = uppercase di kolom `userrole` (Postgres enum type dengan labels `ADMIN/OPERATOR/VIEWER`). Hasilnya:

| Flow | Behavior |
|---|---|
| `install_all.sh:144` raw SQL insert `role='ADMIN'` | OK (match Postgres enum label uppercase) |
| Backend read user via ORM → `user.role = UserRole.ADMIN` | OK |
| `UserResponse` serialize → JSON `"role": "admin"` (lowercase value) | Dikirim ke frontend |
| `UsersPage.jsx` badge lookup `roleStyle[u.role]` = `roleStyle["admin"]` → `undefined` → fallback VIEWER styling | 🐛 Bug visual: semua badge terlihat seperti Viewer |
| `AdminRoute` check `role === "ADMIN" \|\| "admin"` | Kebetulan handle keduanya |
| Frontend modal kirim create user dengan `role: "ADMIN"` | Backend Pydantic reject (value harus "admin") |

**Fix** (pilih salah satu, konsisten):
- **Opsi A**: ubah `UserRole` value jadi uppercase supaya match Postgres label:
  ```python
  class UserRole(str, enum.Enum):
      ADMIN = "ADMIN"; OPERATOR = "OPERATOR"; VIEWER = "VIEWER"
  ```
- **Opsi B**: serialize Pydantic dengan `.name` bukan `.value`. Tambah `model_config = ConfigDict(use_enum_values=False)` + custom serializer.
- **Opsi C**: ubah frontend ke lowercase + update raw SQL di install_all.sh.

Saya rekomendasikan **Opsi A** — paling sedikit perubahan.

---

### M2 — Migration `add_owner_id` fail kalau belum ada admin user
**File**: `backend/alembic/versions/a1b2c3d4e5f6_add_owner_id_to_cameras.py:27-34`

```python
op.execute("""
    UPDATE cameras
    SET owner_id = (SELECT id FROM users WHERE role = 'ADMIN' ORDER BY id LIMIT 1)
    WHERE owner_id IS NULL
""")
op.alter_column('cameras', 'owner_id', nullable=False)   # ← fail kalau UPDATE set NULL
```

Scenario: migration rev 1 sudah run, ada existing cameras, tapi table `users` kosong → subquery return NULL → UPDATE set NULL → `NOT NULL` alter fail → migration stuck.

**Fix**: guard dengan existence check:
```python
admin = op.get_bind().execute(
    sa.text("SELECT id FROM users WHERE role = 'ADMIN' ORDER BY id LIMIT 1")
).scalar()
if admin is None:
    # either delete existing rows, or bail out with clear error
    op.execute("DELETE FROM cameras")
else:
    op.execute(sa.text("UPDATE cameras SET owner_id = :a WHERE owner_id IS NULL"),
               {"a": admin})
op.alter_column(...)
```

---

### M3 — `write_cameras_to_config` hardcode path, abaikan settings
**File**: `backend/app/api/v1/endpoints/cameras.py:63-117`

```python
def write_cameras_to_config(cameras: list):
    config_path = "/etc/mediamtx/mediamtx.yml"    # ← hardcoded
```

Sedangkan `config.py:24` punya `MEDIAMTX_CONFIG_PATH: str = "../media_server/mediamtx.yml"` yang tidak dipakai. Path absolut butuh root-writable — di Docker akan silent-fail dengan `print(...)` (bukan raise).

**Fix**: pakai `settings.MEDIAMTX_CONFIG_PATH`, raise kalau gagal, dokumentasikan di install_all.sh supaya ownership writable oleh user `cammatrix`.

---

### M4 — File I/O sinkron di async handler
**File**: `backend/app/api/v1/endpoints/cameras.py:112-117` (dipanggil dari `create_camera`/`delete_camera`)

```python
with open(config_path, "w", encoding="utf-8") as f:
    f.write(content)
```

Blocking file I/O di event loop → semua request async lain ngetag sementara write berlangsung.

**Fix**: `aiofiles` atau wrap dengan `asyncio.to_thread(sync_write, ...)`.

---

### M5 — Race condition `mediamtx.yml` concurrent write
**File**: `backend/app/api/v1/endpoints/cameras.py:221-224, 270-272`

2 user create kamera barengan → 2 handler load daftar kamera + rewrite file → salah satu overwrite hasil yang lain.

**Fix**: `asyncio.Lock` module-level, atau debounce dengan `asyncio.create_task` + flag "dirty", atau panggil MediaMTX API saja tanpa rewrite file (MediaMTX persist state sendiri).

---

### M6 — Password kamera hilang saat edit rename
**File**: `frontend/src/pages/CamerasPage.jsx:18` + `backend/app/api/v1/endpoints/cameras.py:240-244`

```js
// modal edit init
{ ..., password: "" }  // ← selalu kosong

// handleEdit kirim semua field
await updateCamera(editCamera.id, { ..., password: form.password });

// backend update_camera:244
setattr(camera, field, value or None if isinstance(value, str) and field in ("username","password") else value)
```

User yang cuma mau rename kamera → password dikirim sebagai `""` → backend evaluate `value or None` = `None` → password di DB di-NULL. **Credential kamera hilang tanpa warning.**

**Fix**: backend hanya update field yang non-None:
```python
update_data = camera_in.model_dump(exclude_unset=True, exclude_none=True)
```
Dan frontend: kalau user tidak mengisi field password baru, jangan kirim field `password` sama sekali.

---

### M7 — Dead code di `users.py`
**File**: `backend/app/api/v1/endpoints/users.py:73-77`

```python
@router.get("/{user_id}", response_model=UserResponse)
async def read_user_by_id(
    user_id: int, db,
    current_user: User = Depends(deps.get_current_admin),  # ← sudah admin-only
):
    ...
    if user == current_user: return user          # ← unreachable (admin always reach this)
    if current_user.role != "admin":              # ← unreachable (get_current_admin raise)
        raise HTTPException(403, ...)
```

**Fix**: hapus cabang unreachable atau ganti ke `get_current_user` + add explicit self-or-admin logic.

---

### M8 — Role comparison inkonsisten (3 pola berbeda)
**File**: `backend/app/api/v1/endpoints/users.py:75`, `backend/app/api/deps.py:47`, `backend/app/api/v1/endpoints/cameras.py:147`

```python
# users.py:75
if current_user.role != "admin":

# deps.py:47
if current_user.role != "admin":

# cameras.py:147
if current_user.role == UserRole.ADMIN:
```

Bekerja kebetulan (`str+Enum` punya `__eq__` cocok dengan string value), tapi jelek.

**Fix**: semua pakai enum:
```python
if current_user.role != UserRole.ADMIN: ...
```

---

### M9 — RecordingsPage 100% mock
**File**: `frontend/src/pages/RecordingsPage.jsx:7-15`

```js
const allRecordings = [
  { id: 1, camera: "Main Entrance", date: "Apr 10, 2026", ... },
  ...
];
```

Tidak ada fetch ke `/api/v1/recordings/`. Tombol "Download" hanya trigger toast fake.

**Fix**: wire up ke API seperti `UsersPage.jsx` sudah contohkan.

---

### M10 — FaceAnalyticsPage mock, tidak ada AI backend
Dari README: "Deteksi wajah real-time dengan AI (YOLO / DeepFace)" — tidak ada implementasi. Roadmap mark unchecked tapi halaman dibangun seolah working.

**Fix**: revisi README (Opsi B di Gap Analysis) atau implementasi real. Jangan biarkan marketing vs realita berbeda — ini tanda kualitas produk rendah.

---

### M11 — `get_db` commit di setiap request
**File**: `backend/app/core/database.py:22-31`

```python
async def get_db():
    async with AsyncSessionLocal() as session:
        try:
            yield session
            await session.commit()   # ← commit juga untuk request read-only
```

Postgres WAL bertambah tanpa perlu. Minor performance, tapi impact di skala.

**Fix**: commit hanya di endpoint yang memang write (let handler commit explicit, atau gunakan 2 dep: `get_db_ro` dan `get_db_rw`).

---

### M12 — 401 handler hard reload
**File**: `frontend/src/utils/api.js:22-25`

```js
if (error.response?.status === 401) {
  localStorage.removeItem("access_token");
  window.location.href = "/login";  // ← full page reload
}
```

Kehilangan state Zustand yang tidak persisted, flicker.

**Fix**: pakai router navigate + toast notification.

---

### M13 — Double source-of-truth token
**File**: `frontend/src/store/authStore.js` vs `frontend/src/utils/api.js:11` vs `frontend/src/store/cameraStore.js:7`

Token disimpan di:
1. Zustand `authStore` (persisted)
2. `localStorage.access_token` (manual)
3. `getHeaders()` di `cameraStore.js` baca dari Zustand
4. `api.interceptors` baca dari `localStorage`

Kalau satu di-update tapi lainnya tidak → auth drift.

**Fix**: satu sumber kebenaran. Pilih Zustand persist, hapus manual localStorage. Interceptor baca dari `useAuthStore.getState().token`.

---

### M14 — cameraStore pakai `fetch` bukan axios instance
**File**: `frontend/src/store/cameraStore.js:21,38,67,81,95`

Duplicate header construction, ngga kena 401 interceptor, ngga konsisten dengan `UsersPage.jsx` yang pakai `api` axios.

**Fix**: `import api from "../utils/api"` di cameraStore, ganti semua `fetch(...)` ke `api.get/post/put/delete`.

---

### M15 — `AdminRoute` check dua case
**File**: `frontend/src/App.jsx:27`

```js
const isAdmin = user?.role === "ADMIN" || user?.role === "admin";
```

Hint bahwa author sendiri bingung case mana yang benar (lihat M1). Setelah M1 di-fix, tinggal satu.

---

### M16 — Badge "WebRTC" di HLS player
**File**: `frontend/src/pages/LiveViewPage.jsx:266`

```jsx
{isOffline ? "OFFLINE" : "WebRTC"}
```

Player-nya HLS (Hls.js di line 38-76), bukan WebRTC. Label misleading.

**Fix**: ganti `"HLS"` atau `"LIVE"`.

---

### M17 — docker-compose.yml partial (tidak include app)
**File**: `docker-compose.yml`

Hanya postgres + minio + mediamtx. Frontend/backend tidak ada. User baca README "docker compose up" tapi dapat infra saja.

**Fix**: tambah service `backend` (Dockerfile Python) dan `frontend` (multi-stage Node → nginx), plus networks/volumes yang proper. Atau **hapus compose kalau sudah ada install_all.sh native** — jangan leave half-feature.

---

### M18 — `.env.example` DATABASE_URL scheme salah
**File**: `backend/.env.example:13`

```
DATABASE_URL=postgresql://postgres:yourpassword@localhost:5432/cctv_vms
```

`database.py:5` replace `postgresql://` → `postgresql+asyncpg://`. OK, tapi beberapa provider pakai `postgres://` (short form, tanpa `ql`) yang lolos replace. Dan `install_all.sh:37` langsung pakai `postgresql+asyncpg://`. Inkonsisten.

**Fix**: standardize ke `postgresql+asyncpg://` di semua tempat, atau robust replace yang handle kedua prefix.

---

### M19 — Vite config telanjang
**File**: `frontend/vite.config.js`

Tidak ada `build.sourcemap: false` untuk production (expose source di prod), tidak ada `server.proxy` untuk dev proxy ke backend (maka butuh CORS config, padahal dev seharusnya pakai proxy).

**Fix**:
```js
export default defineConfig({
  plugins: [react(), tailwindcss()],
  build: { sourcemap: false, chunkSizeWarningLimit: 1000 },
  server: { proxy: { "/api": "http://localhost:8000" } },
});
```

---

### M20 — Frontend service pakai `npx serve` di production
**File**: `linux_deployment/cammatrix-frontend.service:11`

```ini
ExecStart=/usr/bin/npx serve -s dist -l 5173
```

`npx serve` = single-threaded Node serve. Tidak cocok produksi: tidak ada HTTP/2, tidak ada gzip/brotli yang tuned, tidak ada cache header, tidak ada TLS termination.

**Fix**: ganti nginx atau caddy serving `/var/www/CamMatrix/frontend/dist` dengan config standard + reverse proxy `/api/*` ke backend :8000.

---

## Low (🟢)

- **L1** `backend/main.py:29-31,104-105`: `print(...)` bukan `logging` — tidak ter-struktur
- **L2** `backend/app/core/security.py:18-34`: JWT `extra_claims` via `dict.update` bisa override reserved claims (lihat H6)
- **L3** `backend/app/core/storage.py:27-29,36-38`: `except Exception: return None/False` swallow error tanpa log — debug nightmare
- **L4** `backend/app/models/recording.py`: `created_at` tidak punya index, tapi `recordings.py:29` order by `created_at.desc()` → full scan di scale
- **L5** `backend/app/api/v1/endpoints/cameras.py:244`: oneliner operator precedence tricky, pecah jadi 3 baris
- **L6** `frontend/src/pages/LiveViewPage.jsx:71-74`: HLS fatal error reload `setTimeout(..., 3000)` tanpa exponential backoff
- **L7** `frontend/src/pages/UsersPage.jsx:180,198,213`: `alert(...)` untuk error — UX amatir, pakai toast
- **L8** `frontend/src/pages/RecordingsPage.jsx:59-63`: tombol Download cuma trigger toast fake
- **L9** `README.md:63-66`: klaim fitur "Kamera Publik" tapi feature tidak ada di kode
- **L10** `README.md:49`: klaim "Statistik Real-time" tapi hanya polling 15s, bukan WebSocket
- **L11** `backend/app/models/user.py:18,21,22`: type hint `Mapped[str]` untuk kolom `nullable=True` — harus `Mapped[str | None]`
- **L12** `package.json` di root (74 byte) — kosongan, hapus
- **L13** Tidak ada `LICENSE` file meski README klaim MIT
- **L14** `backend/create_admin.py` vs `install_all.sh:129-153`: duplicate admin creation logic — DRY violation, hapus salah satu
- **L15** Tidak ada test coverage (`pytest` di requirements tapi folder `tests/` kosong)
- **L16** `authInternalUsers` di `media_server/mediamtx.yml` dan di `cameras.py:97-105` **duplikat** — sumber kebenaran ganda
- **L17** `backend/app/api/deps.py:10`: `OAuth2PasswordBearer(tokenUrl=f"/api/v1/auth/login")` — f-string tanpa interpolation, ganti string biasa
- **L18** Semua migrations `Create Date` pakai 2026 (future) — OK untuk context user, tapi aware
- **L19** `frontend/src/pages/RecordingsPage.jsx:5`: import `FaceAnalyticsPage` sebagai child di halaman Recordings — coupling yang aneh
- **L20** `backend/app/api/v1/endpoints/settings.py:23-26`: auto-create Setting row tiap first-GET — minor, tidak breakable tapi prefer explicit

---

## Information Disclosure

Bukan exploit aktif, tapi leak yang memudahkan attacker:

- `backend/main.py:29`: `print(f"✅ Synced camera {cam.id} ({cam.name}) ...")` → journalctl systemd berisi nama kamera user
- `linux_deployment/install_all.sh:175,179,183`: admin password, DB password, MinIO password ter-print ke stdout saat install → masuk journalctl dan shell history
- `README.md:258`: credential demo `admin@vms.com / admin123` eksposed publik di GitHub
- `backend/main.py:43`: `docs_url="/api/docs"` → OpenAPI eksplor semua endpoint di produksi, attacker enumerate dengan mudah. Matikan di prod: `docs_url=None if not settings.DEBUG else "/api/docs"`
- `backend/app/api/v1/endpoints/cameras.py:16`: `HLS_BASE = "http://103.180.198.240:8888"` hardcoded IP publik di repo

---

## Hal yang Sudah Bagus

Supaya feedback seimbang — berikut hal-hal yang anak magang sudah lakukan dengan baik:

- ✅ Struktur backend modular: `core/api/models/schemas` terpisah — setara level senior
- ✅ Async SQLAlchemy + FastAPI Depends pattern benar (`DbSession = Annotated[...]`)
- ✅ Alembic migration dipakai dari awal, bukan `create_all` (kecuali di `create_admin.py` backup — minor)
- ✅ i18n 3 bahasa (ID/EN/ZH) dengan store terpisah
- ✅ Theme dark/light mode dengan persist
- ✅ Per-user MediaMTX path (`cam_{owner_id}_{camera_id}`) — desain bagus, menghindari collision
- ✅ Owner-check helper `_get_owned_camera` konsisten di semua write endpoint kamera
- ✅ Install script `set -e` + generate kredensial random (walau weak, ada intent)
- ✅ `.gitignore` rapih, tidak commit `.env` atau `node_modules`
- ✅ Debounce offline state di `cameraStore.fetchStatuses` — sophisticated untuk level magang
- ✅ HLS player config fine-tuned (lowLatencyMode, retry strategy)
- ✅ UI glassmorphism konsisten, stagger animation, live clock per-cell — polish visual tinggi
- ✅ Foreign key CASCADE di migrations (`users → cameras → recordings`)
- ✅ Bcrypt password hashing (via passlib) — correct
- ✅ JWT library pakai `python-jose[cryptography]` — correct, bukan `PyJWT` yang rentan confusion

---

## Rekomendasi Handoff (3 Milestone)

Buat anak magang jadikan **3 milestone** sebelum "aman untuk di-host":

### 🏁 Milestone 1 — Hentikan eksploitasi langsung (estimasi 1-2 hari)

Fokus: bypass auth & info disclosure paling gawat.

- [ ] **C1**: Google OAuth verify signature server-side
- [ ] **C2**: MediaMTX auth config pisah publisher (127.0.0.1 + password) vs reader anonymous (path `pub_*` only)
- [ ] **C3**: Hapus demo fallback di `LoginPage.jsx:85-93`, hapus `create_admin.py`, hapus kredensial dari README
- [ ] **C4**: Tambah `Depends(get_current_admin)` di `/cameras/sync-mediamtx`
- [ ] **C5**: Filter ownership di `GET /recordings/`
- [ ] **C6**: Hapus `file_path` dari parameter `/trigger-upload`, pakai path internal yang di-generate
- [ ] **C10**: `SECRET_KEY` raise di startup kalau kosong/default
- [ ] **H1**: Admin password minimal `openssl rand -base64 24`
- [ ] **H4**: Wire up `slowapi` di `/auth/*`

### 🛡 Milestone 2 — Privilege & isolation (estimasi 2 hari)

Fokus: kebocoran data, privilege escalation, hardening infra.

- [ ] **C7**: Ganti `rec.__dict__.copy()` dengan Pydantic `model_validate`
- [ ] **C8**: Enkripsi password RTSP at-rest, tidak return ke client
- [ ] **C9**: Validasi RTSP URL (scheme whitelist + IP private/loopback block)
- [ ] **C11**: Pindah hardcoded IP ke env var, whitelist HTTP methods explicit
- [ ] **H2**: User non-root + `NoNewPrivileges`/`ProtectSystem` di semua `.service`
- [ ] **H3**: Hapus kredensial dari `docker-compose.yml`, pakai `env_file`
- [ ] **H9**: `ufw` setup di `install_all.sh`
- [ ] **M1**: Sinkronkan role case backend ↔ frontend
- [ ] **M2**: Migration robustness untuk kondisi no-admin-user

### ✨ Milestone 3 — Functional parity dengan klaim README (estimasi 1 minggu, atau revisi README)

Fokus: hilangkan mock, penuhi ekspektasi produk.

- [ ] **Gap Konsep**: tambah `is_public` di Camera + endpoint publik + frontend route `/watch/*` + MediaMTX path scheme pub/cam
- [ ] **M6**: Perbaiki password-preservation di camera edit
- [ ] **M9**: Wire up `RecordingsPage` ke API sungguhan
- [ ] **M10**: Implementasi AI face atau revisi README
- [ ] **M11,M12,M13,M14**: Bersihkan auth drift di frontend
- [ ] **M20**: Ganti `npx serve` dengan nginx/caddy + reverse proxy
- [ ] Tambah test suite — minimal happy path auth + camera CRUD

**Alternatif cepat**: kalau waktu mepet, cukup **revisi README agar jujur dengan kondisi kode**. Lebih profesional daripada mengklaim fitur yang tidak ada.

---

## Checklist PR Gate

Buat sebagai **PR template** di `.github/pull_request_template.md`:

```markdown
## Checklist Security

- [ ] Tidak ada hardcoded credential (password/secret/token) di file `.py/.js/.yml/.sh/.service`
- [ ] Tidak ada endpoint `@router.*` tanpa `Depends(get_current_user)` atau
      `Depends(get_current_admin)` (kecuali `/auth/*`, `/health`, `/`, `/public/*`)
- [ ] Tidak ada endpoint admin yang cuma diproteksi oleh frontend route guard
- [ ] Semua query user-scoped punya filter `owner_id`/`user_id`
- [ ] Tidak ada user-supplied filesystem path yang di-pass ke `open()`, `os.remove()`,
      `os.path.*` tanpa validation + realpath check
- [ ] Semua OAuth/JWT/token diverifikasi signature server-side (bukan base64 decode)
- [ ] Service systemd pakai `User=<nonroot>` + `NoNewPrivileges=true` + `ProtectSystem=strict`
- [ ] `SECRET_KEY`, `DATABASE_URL`, kredensial lain dibaca dari env, tidak punya default
- [ ] Password kamera RTSP / credential sensitif TIDAK dikembalikan di response API
- [ ] `grep -r "admin123\|change-this\|yourpassword\|minioadmin\|103.180" .` mengembalikan 0 hasil
```

---

## Pelajaran untuk Anak Magang

Prinsip yang worth ditekankan berdasarkan pola bug yang ditemukan:

### 1. **Default-deny, bukan default-allow**
Setiap endpoint HARUS dimulai dari asumsi "tidak ada yang boleh akses", baru kasih exception. Contoh nyata di kode kalian: `/sync-mediamtx` lupa auth. Kalau kalian bangun dari pattern:
```python
@router.post("/endpoint")
async def handler(current_user: User = Depends(get_current_admin)):  # ← pertama
    ...
```
Lebih sulit lupa daripada "oh iya tambah auth-nya nanti".

### 2. **Trust boundary = server-side saja**
Apapun yang datang dari browser = untrusted. Kalau client kirim JWT Google, client kirim email, client kirim role, client kirim file_path — **SEMUANYA harus diverifikasi ulang di server**. Frontend cuma UX sugar. Contoh kalian: `/auth/google` trust email dari frontend → bypass total.

### 3. **Credential & secret tidak boleh bulak-balik**
Password kamera masuk ke DB → kembali ke response → disimpan lagi ke client → dikirim ulang saat edit. Setiap bolak-balik = satu kesempatan bocor. Prinsip: **secret disimpan 1x, dikeluarkan 0x**. Kalau perlu di-edit, user submit secret baru, jangan edit yang lama.

### 4. **Jangan commit kredensial, pernah**
`docker-compose.yml` kalian commit `yourpassword`. README kalian commit `admin123`. Sekali credential masuk git history, walau di-hapus commit berikutnya, tetap ada di history. Gunakan `.env.example` dengan nilai placeholder, `.env` di `.gitignore`. Tools: `git-secrets`, `gitleaks`, `trufflehog`.

### 5. **"Tidak jalan di prod" ≠ "aman"**
Banyak bug di kode kalian hanya "meledak" di produksi (hardcoded IP, root user, default secret, CORS wildcard). Dev mode maaf. Prod tidak. Biasakan test "apakah ini masih aman kalau 1000 orang random coba?"

### 6. **Enum dan case sensitivity**
Kalian punya `UserRole(str, Enum)` dengan value lowercase, Postgres enum uppercase, frontend styling uppercase. 3 source of truth yang rusak. Pelajaran: **konvensi harus dipilih satu di awal, ditulis di README, dan di-enforce dengan linter**.

### 7. **Klaim marketing = hutang kode**
Tiap baris di README yang tidak ada di kode = user marah nanti. Pilih: (a) bangun fiturnya, atau (b) hapus klaimnya. Jangan posisi ketiga "nanti saja" karena 6 bulan lagi ada yang pakai dan merasa ditipu.

### 8. **Log everything, swallow nothing**
`except Exception: pass` atau `return None` tanpa log = debug nightmare. Selalu `logger.exception(...)` minimal. Pakai `structlog` atau FastAPI middleware untuk request ID.

### 9. **Race condition itu nyata**
Kalian punya 2 user create kamera barengan → `mediamtx.yml` salah satu overwrite yang lain. Pattern umum: **read-modify-write tanpa lock**. Kalau file/resource di-share, perlu lock/mutex/atomic operation.

### 10. **Test coverage itu asuransi**
Tidak ada test = tiap deploy adalah judi. Minimal test happy path auth (register → login → /me) + camera CRUD (create → list → update → delete) + permission matrix (VIEWER can't delete other's camera). 20 test = 80% confidence.

---

## Penutup

CamMatrix punya **fondasi yang bagus** dan menunjukkan skill React + FastAPI yang di atas rata-rata magang. Masalah utama bukan kemampuan coding, tapi **security awareness** dan **konsistensi** — hal yang wajar karena biasanya mahasiswa diajar "bikin fitur jalan" bukan "bikin fitur aman & konsisten".

Laporan ini bukan untuk menjatuhkan, tapi untuk jadi **peta** supaya mereka bisa belajar dari kesalahan yang spesifik, bukan nasihat general. Tiap temuan punya file:line dan fix suggestion yang bisa langsung diterapkan.

Rekomendasi saya:
1. **Minta mereka review dokumen ini bareng**, tiap temuan didiskusikan 2-3 menit
2. **Assign Milestone 1 sebagai exit-criteria magang** — tidak selesai M1 = tidak bisa dibilang "project ready"
3. **Pair review**: kalian sebagai mentor approve setiap PR yang address temuan, supaya mereka belajar security-aware code review process

Overall: **kerjaan mereka bagus untuk magang, tapi belum siap produksi**. Dengan 1 minggu fokus ke Milestone 1+2, bisa jadi solid MVP yang aman.

---

**Audit ini**: lengkap untuk commit `7bf55b9`. Kalau ada fix masuk, re-audit tiap temuan di file yang berubah. Security audit bukan one-shot — setiap perubahan bisa reopen bug lama atau introduce yang baru.
