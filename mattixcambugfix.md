# CamMatrix — Bugfix Guide (Round 3 Audit Response)

> **Untuk**: tim magang CamMatrix
> **Basis**: audit putaran 3 di commit `249dc19` (lihat `/mnt/magangcam-reaudit-249dc19.md`)
> **Tujuan**: bukan sekadar tutup finding, tapi pahami **kenapa** supaya pola yang sama tidak berulang di project lain.
>
> Dikerjakan urut. Prio 0 dulu (Hari Ini), baru Prio 1 (Minggu Ini). Tiap fix punya 4 bagian:
> 1. **Apa masalahnya** (file:line, gejala)
> 2. **Kenapa salah** (threat model, bukan opini)
> 3. **Cara fix** (kode siap-copy)
> 4. **Pelajaran** (prinsip umum)

---

## Prio 0 — Selesaikan hari ini

### Fix 0 — P5: MediaMTX env var di field `source:` tidak ter-resolve (BLOCKER)

> **Ditemukan saat live test di production VM `cam00@103.180.198.240` (2026-04-27)**.
> MediaMTX restart counter sudah 489x sebelum saya datang. Semua kamera **offline indefinite** karena bug ini.

#### Apa masalahnya
Backend `cameras.py:117-176` (`write_cameras_paths`) emit `mediamtx.yml` dengan pattern:
```yaml
paths:
  cam_2_19:
    source: ${CAM_2_19_RTSP_URL}              # ← env var reference
    sourceOnDemandCloseAfter: 60s
```
Dan `cameras.env` (mode 600):
```
CAM_2_19_RTSP_URL=rtsp://192.168.28.6/user=admin&password=PJN03030362&channel=2&stream=0.sdp
```
systemd unit load `cameras.env` via `EnvironmentFile=-/etc/mediamtx/cameras.env`. Niat baik: credential terpisah dari config file utama.

**MediaMTX v1.9.0 tidak melakukan env substitution di field `source:` paths.** Hasilnya MediaMTX terima string literal `${CAM_2_19_RTSP_URL}`, gagal parse sebagai URL, exit dengan:
```
ERR: invalid source: '${CAM_2_19_RTSP_URL}'
```
systemd auto-restart, gagal lagi, infinite loop. Restart counter 489 saat saya datang = ~24 jam loop kontinyu.

#### Bukti dari live test
URL kamera user (`rtsp://192.168.28.6/user=admin&password=PJN03030362&channel=2&stream=0.sdp`) saya tambahkan via API. Backend terima (HTTP 201), tulis ke YAML + env file dengan benar. **Tapi MediaMTX langsung crash.**

Saya bypass dengan tulis URL plain langsung ke `mediamtx.yml`:
```yaml
paths:
  cam_2_19:
    source: rtsp://192.168.28.6/user=admin&password=PJN03030362&channel=2&stream=0.sdp
    sourceOnDemandCloseAfter: 60s
```
MediaMTX langsung start, pull stream H264 944x1080 11.5fps, HLS playlist HTTP 200, byte transfer normal. **URL kamera valid, only backend yang broken.**

#### Kenapa bug ini lolos audit & development
- Test development di laptop biasanya pakai 1 kamera dummy yang creator handle manual → tidak trigger flow `write_cameras_paths`.
- `mediamtx -c <yml>` di shell user mewarisi env vars shell → kelihatan kerja.
- Production via systemd dengan `EnvironmentFile` mewariskan env var ke proses MediaMTX, **tapi MediaMTX tidak substitute di YAML**.
- Tidak ada integration test yang cek mediamtx exit-code setelah `write_cameras_paths` dipanggil.

#### Fix — pilih satu pendekatan

**Pendekatan A (paling aman, recommended) — pakai MediaMTX HTTP API, JANGAN tulis YAML**

MediaMTX expose `/v3/config/paths/add/{name}` POST endpoint yang accept `source` sebagai URL plain. Stop tulis YAML sama sekali. Pattern jadi:

```python
# backend/app/services/mediamtx_client.py
import httpx
from app.core.config import settings

async def add_path(slug: str, rtsp_url: str):
    async with httpx.AsyncClient() as client:
        r = await client.post(
            f"{settings.MEDIAMTX_API_URL}/v3/config/paths/add/{slug}",
            json={
                "source": rtsp_url,
                "sourceOnDemandCloseAfter": "60s",
            },
            auth=(settings.MTX_API_USER, settings.MTX_API_PASS),  # setelah pasang authMethod
            timeout=5,
        )
        r.raise_for_status()

async def remove_path(slug: str):
    async with httpx.AsyncClient() as client:
        r = await client.post(
            f"{settings.MEDIAMTX_API_URL}/v3/config/paths/delete/{slug}",
            auth=(...),
        )
        r.raise_for_status()
```

`mediamtx.yml` tinggal config base + auth saja, tidak ada `paths:` block dinamis. Backend orchestrate via API.

**Pro**: state hanya di MediaMTX (single source of truth), tidak ada race condition write-yml + reload, tidak ada env substitution issue, support hot-add tanpa restart.
**Con**: kalau MediaMTX restart, paths hilang (memory-only). Solusi: `pathDefaults` di yml + boot-time `lifespan` startup yang re-register semua kamera dari DB ke API.

**Pendekatan B (paling cepat fix sekarang) — tulis URL plain langsung ke YAML**

Hapus pattern env var substitution. `cameras.env` tetap untuk credential (kalau perlu mask), tapi `mediamtx.yml` carry plain URL.

```python
# backend/app/api/v1/endpoints/cameras.py:117-176 (write_cameras_paths)
def write_cameras_paths(db_session, mediamtx_yml_path, _cameras_env_path):
    cameras = db_session.query(Camera).all()
    
    # Read base config up to marker
    with open(mediamtx_yml_path) as f:
        base_lines = []
        for line in f:
            base_lines.append(line)
            if line.strip() == "all_others:":
                break
    
    # Append plain paths
    paths_block = ["\n"]
    for cam in cameras:
        slug = f"cam_{cam.owner_id}_{cam.id}"
        rtsp_url = _build_rtsp_with_auth(cam)  # plain URL, decrypt JIT
        paths_block.append(f"  {slug}:\n")
        paths_block.append(f"    source: {rtsp_url}\n")  # ← PLAIN, bukan ${VAR}
        paths_block.append(f"    sourceOnDemandCloseAfter: 60s\n\n")
    
    # Atomic write: tulis ke .tmp lalu rename
    tmp_path = mediamtx_yml_path + ".tmp"
    with open(tmp_path, "w") as f:
        f.writelines(base_lines + paths_block)
    os.chmod(tmp_path, 0o600)              # ← mode 600 supaya credential tidak public
    os.rename(tmp_path, mediamtx_yml_path)
    
    # Reload mediamtx
    subprocess.run(["sudo", "systemctl", "reload", "mediamtx"], check=True)
```

**Pro**: minimum perubahan kode, fix langsung jalan.
**Con**: credential plaintext di `mediamtx.yml`. Mode 600 + owner root mitigate, tapi bukan defense-in-depth.

**Pendekatan C (kompromi) — pakai env substitution pattern lain MediaMTX**

MediaMTX support env substitution di YAML **HANYA untuk konfigurasi top-level fields** (mis. `apiAddress`, `rtspAddress`, `authInternalUsers[].pass`). Tidak di nested `paths.*.source`. Ini design MediaMTX, bukan bug. Tidak ada workaround di sisi YAML.

Jadi pendekatan C = tidak ada. Pilih A atau B.

#### Rekomendasi
**Pendekatan A** untuk arsitektur yang benar. Sekalian solve 3 hal:
1. Fix P5
2. Solve audit-finding lama soal `write_cameras_paths` race condition saat 2 admin add bersamaan
3. Persiapan multi-MediaMTX deployment (kalau scale): tinggal tukar URL API

**Pendekatan B** kalau magang butuh fix cepat tonight + ship demo besok. Refactor ke A nanti.

#### Side-fix wajib setelah Fix 0
Setelah backend tidak crash MediaMTX, **kamera test 192.168.28.6 yang URL-nya pakai parameter di path** (`?user=X&password=Y&channel=2`) **valid** dan bisa di-pull MediaMTX. Bukti: live test berhasil pull H264 944x1080. Format URL ini umum untuk IP camera China (Vivotek, Topaz, OEM clones). Backend `_validate_rtsp_url` sudah accept URL ini (scheme + private IP lolos). **Tidak perlu special handling**.

#### Pelajaran
**Test integration di environment production-like**, bukan dev shell. Bug ini akan ketahuan dalam 30 detik kalau ada smoke test:
```bash
# tests/integration/test_mediamtx_flow.sh
systemctl restart mediamtx
sleep 2
[ "$(systemctl is-active mediamtx)" = "active" ] || { echo "FAIL"; exit 1; }
curl -fsS http://127.0.0.1:9997/v3/paths/list >/dev/null || { echo "FAIL"; exit 1; }
```
Jalankan sebelum tiap deploy. CI tidak cukup karena CI mungkin tidak punya MediaMTX binary.

**Asumsi tentang sistem eksternal harus diverifikasi.** "MediaMTX akan substitute env var" = asumsi. Verifikasi dengan baca docs **dan** test runtime. Jangan trust intuition tentang behavior tool eksternal.

---

### Fix 1 — P1: Pisahkan publisher backend dengan publisher mobile

#### Apa masalahnya
File `media_server/mediamtx.yml:25-32`. Commit `7e1e3a9` menghapus baris `ips: [127.0.0.1/32]` dari role `publisher` supaya Larix di HP bisa push stream.

```yaml
# State sekarang (BAHAYA)
authInternalUsers:
  - user: publisher
    pass: ${MTX_PUBLISHER_PASS}
    permissions:
      - action: publish
      - action: api          ← role ini bisa CRUD path MediaMTX
```

#### Kenapa salah
Role `publisher` punya 2 permission: `publish` (push stream) **dan** `api` (akses admin API MediaMTX di port 9997). Sebelum `7e1e3a9`, kredensial ini hanya boleh dipakai dari `127.0.0.1` — artinya cuma backend FastAPI di server yang sama yang bisa login. Setelah dihapus, **siapa saja yang punya password publisher bisa**:
- Push stream palsu menimpa kamera asli (`rtsp://attacker_ip → rtsp://server:8554/cam-parkir`)
- Panggil admin API: `curl -u publisher:PASS http://server:9997/v3/config/paths/list` → enumerate semua kamera + RTSP source
- Panggil `/v3/config/paths/delete/<path>` → DoS

Password disimpan di `/etc/mediamtx/mediamtx.env` (mode 600 ✓), tapi bisa bocor lewat: backup tarball, journalctl error dump, `docker inspect`, log install_all.sh yang sempat print ke stdout.

**Larix-nya tetap valid** — tapi jangan pakai user yang punya `api`. Buat user baru dengan permission minimal.

#### Fix
**File**: `media_server/mediamtx.yml`

```yaml
authInternalUsers:
  # Backend FastAPI di server yang sama → push stream dari kamera RTSP eksternal
  - user: publisher
    pass: ${MTX_PUBLISHER_PASS}
    ips: [127.0.0.1/32]                  # ← KEMBALIKAN baris ini
    permissions:
      - action: publish
      - action: api

  # Mobile (Larix) → publish saja, dari mana saja, ke path mobile_* saja
  - user: mobile_publisher                # ← USER BARU
    pass: ${MTX_MOBILE_PUBLISHER_PASS}
    permissions:
      - action: publish
        path: mobile_*                    # path-prefix restriction

  # Public viewer (HLS + WebRTC) — biarkan
  - user: viewer
    pass: ${MTX_VIEWER_PASS}
    permissions:
      - action: read
      - action: playback
```

**File**: `linux_deployment/install_all.sh`

Tambah generate password mobile di sebelah `MTX_PUBLISHER_PASS` dan `MTX_VIEWER_PASS` (cari baris generate kedua password lama, tambah satu baris):

```bash
MTX_PUBLISHER_PASS=$(openssl rand -hex 16)
MTX_VIEWER_PASS=$(openssl rand -hex 16)
MTX_MOBILE_PUBLISHER_PASS=$(openssl rand -hex 16)   # ← TAMBAH

cat <<EOF > /etc/mediamtx/mediamtx.env
MTX_PUBLISHER_PASS=${MTX_PUBLISHER_PASS}
MTX_VIEWER_PASS=${MTX_VIEWER_PASS}
MTX_MOBILE_PUBLISHER_PASS=${MTX_MOBILE_PUBLISHER_PASS}    # ← TAMBAH
EOF
chmod 600 /etc/mediamtx/mediamtx.env
```

Cetak instruksi Larix di akhir installer (supaya operator tahu kredensial mobile):
```bash
echo "Larix mobile streaming:"
echo "  Server: rtsp://${SERVER_IP}:8554/mobile_<NAMA_KAMERA>"
echo "  User:   mobile_publisher"
echo "  Pass:   ${MTX_MOBILE_PUBLISHER_PASS}"
```

#### Pelajaran
**Prinsip Least Privilege** — satu kredensial = satu permission set. Jangan pernah kasih satu user multiple kapabilitas yang exposure-nya beda. Kalau Larix cuma butuh push, jangan kasih dia akses admin API. Defense-in-depth = auth + IP restriction + permission scope. Hilangkan satu lapis, attack chain jadi pendek.

---

### Fix 2 — P3: Urutan variable di `install_all.sh`

#### Apa masalahnya
File `linux_deployment/install_all.sh:60-71`. `SERVER_IP` di-`curl` di line 71, padahal sudah dipakai di line 67 untuk render `.env` backend. Hasilnya `.env` punya:
```
CORS_ORIGINS=["http://:5173","http://localhost:5173"]
HLS_BASE_URL=http://:8888
```

Backend startup tidak error (bash variable kosong = string kosong, bukan undefined), tapi runtime broken: CORS reject frontend dari IP publik, HLS URL tidak resolvable.

#### Kenapa salah
Bash interpret variable kosong sebagai string kosong, tidak fail. `set -e` tidak trigger. Test installer di laptop lokal mungkin lolos karena `localhost` masuk CORS list. Begitu deploy ke VM dengan IP publik, frontend di `http://<vm-ip>:5173` di-blok CORS oleh backend.

Bug tipe ini sulit ketahuan karena gejalanya muncul di tahap pemakaian (CORS error di browser console), bukan di install.

#### Fix
**File**: `linux_deployment/install_all.sh`

Pindah baris `SERVER_IP=$(curl -s ifconfig.me)` ke ATAS, sebelum penulisan `.env` backend pertama:

```bash
# === Network setup (LETAKKAN DI AWAL) ===
SERVER_IP=$(curl -s --max-time 5 ifconfig.me || echo "127.0.0.1")
if [ -z "$SERVER_IP" ] || [ "$SERVER_IP" = "127.0.0.1" ]; then
    echo "WARNING: cannot detect public IP. Using local IP."
    SERVER_IP=$(hostname -I | awk '{print $1}')
fi
echo "Detected SERVER_IP=${SERVER_IP}"

# === Generate creds ===
JWT_SECRET=$(openssl rand -hex 32)
DB_PASS=$(openssl rand -hex 16)
# ... dst

# === Tulis backend .env (SEKARANG SERVER_IP sudah set) ===
cat <<EOF > $APP_DIR/backend/.env
SECRET_KEY=${JWT_SECRET}
DATABASE_URL=postgresql://cctv:${DB_PASS}@localhost/cctv_vms
CORS_ORIGINS=["http://${SERVER_IP}:5173","http://localhost:5173"]
HLS_BASE_URL=http://${SERVER_IP}:8888
EOF

# === Tulis frontend .env ===
cat <<EOF > $APP_DIR/frontend/.env
VITE_API_BASE_URL=http://${SERVER_IP}:8000/api/v1
EOF
```

Ditambah safety: kalau `curl ifconfig.me` gagal (tidak ada internet), fallback ke `hostname -I` supaya install tetap bisa lanjut di lab tanpa internet.

#### Pelajaran
**Bash + `set -e` ≠ defensive script.** Variable yang belum di-set diam-diam dipakai sebagai string kosong. Selalu set dulu, baru pakai. Untuk script install, **selalu test di VM fresh** (Vagrant/LXC sekali pakai), bukan re-run di laptop development yang sudah punya state.

Pattern aman: deklarasi semua variable di blok atas, `cat <<EOF` di blok bawah.

---

### Fix 3 — P4: Enforce JWT scope `password_change_only`

#### Apa masalahnya
File `backend/app/api/v1/endpoints/auth.py:32-37` sudah inject `extra_claims["scope"] = "password_change_only"` ke JWT kalau `must_change_password=True`. **Tapi `backend/app/api/deps.py:14-44` tidak pernah membaca claim itu.**

Akibatnya: admin yang baru di-seed pakai install_all.sh login → dapat token "scope-limited" → langsung hit `/cameras`, `/users`, `/recordings`, semua kepala bisa diakses. Fitur "must change password" cuma cosmetic.

#### Kenapa salah
Threat model: install_all.sh print password awal ke stdout → bisa kelihatan di shell history operator, journalctl, screen capture, log SSH session yang di-record. Mitigasi seharusnya: token awal cuma boleh dipakai untuk reset password, bukan untuk operasi lain.

JWT claim adalah **klaim**, bukan enforcement. Kalau backend tidak baca dan act on it, klaim itu pemanis hambar.

#### Fix
**File**: `backend/app/api/deps.py`

Tambah dependency `get_current_user_full_scope`:

```python
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.security import decode_access_token
from app.db.session import get_db
from app.models.user import User, UserRole

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/v1/auth/login")


async def get_current_user(
    token: str = Depends(oauth2_scheme),
    db: AsyncSession = Depends(get_db),
) -> User:
    """Validate JWT, return user. Catatan: TIDAK cek scope. Hanya pakai dep ini
    di endpoint yang sengaja accept scope-limited token (mis. /change-password)."""
    credentials_exc = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = decode_access_token(token)
        user_id = payload.get("sub")
        if not user_id:
            raise credentials_exc
    except JWTError:
        raise credentials_exc

    user = await db.get(User, int(user_id))
    if not user or not user.is_active:
        raise credentials_exc
    return user


async def get_current_user_full_scope(
    token: str = Depends(oauth2_scheme),
    db: AsyncSession = Depends(get_db),
) -> User:
    """Sama dengan get_current_user TAPI tolak token scope-limited.
    Pakai dep ini di SEMUA endpoint kecuali /auth/change-password dan /auth/me."""
    user = await get_current_user(token, db)
    payload = decode_access_token(token)
    if payload.get("scope") == "password_change_only":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Password change required before accessing this resource",
        )
    return user


async def get_current_admin(
    user: User = Depends(get_current_user_full_scope),  # ← admin = full scope + role
) -> User:
    if user.role != UserRole.ADMIN:
        raise HTTPException(403, "Admin only")
    return user
```

**Lalu di SETIAP router non-auth**, ganti `Depends(get_current_user)` jadi `Depends(get_current_user_full_scope)`. Cari pakai grep:

```bash
grep -rn "Depends(get_current_user)" backend/app/api/v1/endpoints/
```

Ganti semua kecuali file `auth.py` (endpoint `/change-password`, `/me`, `/logout` boleh accept scope-limited).

**File**: `backend/app/api/v1/endpoints/auth.py` — pastikan endpoint `/change-password` masih pakai `get_current_user` biasa (bukan `_full_scope`), supaya scope-limited token tetap bisa pakai endpoint ini untuk reset.

#### Pelajaran
**Klaim ≠ kontrol.** Setiap claim di JWT (scope, role, tenant) HARUS dipasangkan dengan kode yang membaca dan memutuskan. Kalau backend tidak baca, claim itu cuma metadata kosong yang bisa di-bypass karena tidak ada cek.

Pattern: untuk setiap claim yang ditambahkan ke JWT, harus ada test minimum 2:
1. Token dengan claim → endpoint A boleh, endpoint B tolak
2. Token tanpa claim → endpoint A tolak, endpoint B boleh

Tanpa test ini, claim bisa berubah jadi cosmetic dalam refactor berikutnya tanpa ketahuan.

---

### Fix 4 — C3 lingering: Hapus `create_admin.py`

#### Apa masalahnya
File `backend/create_admin.py:22-36`. Script ini buat admin dengan password hardcoded `admin123` dan **tidak set** `must_change_password=True`. Siapa pun yang `cd backend && python create_admin.py` (sengaja atau tidak sengaja, mis. di Dockerfile, README, tutorial yang ke-copy) langsung dapat admin lemah.

Script ini duplikat fungsi dengan `install_all.sh`-nya `seed_admin.py` inline (yang sudah aman). Tidak ada alasan keep-nya.

#### Kenapa salah
**Setiap codepath yang bisa create user adalah surface area.** Punya 2 path (install_all.sh aman + create_admin.py tidak aman) berarti security level = path terlemah. Operator yang baca README mungkin pilih `create_admin.py` karena lebih cepat. Hasilnya bypass total terhadap hardening install_all.sh.

C3 startup safety check di `main.py:23-30` cuma block start kalau password = literal `admin123`. Begitu admin login + ganti password ke `admin124`, check itu lewat — tapi user awal yang lemah sudah ter-create dan paham celah-nya.

#### Fix
```bash
git rm backend/create_admin.py
```

Update `README.md` — cari semua referensi `create_admin.py` dan ganti dengan instruksi:
> "Untuk seed admin awal, gunakan `linux_deployment/install_all.sh` (production) atau `python -m app.cli seed-admin --email <x> --password-from-stdin` (development)."

Kalau development butuh quick seed, buat CLI command pakai Click/Typer:

```python
# backend/app/cli.py
import asyncio
import getpass
import sys
import typer
from sqlalchemy import text
from app.db.session import async_session
from app.core.security import hash_password
from app.models.user import User, UserRole

app = typer.Typer()

@app.command()
def seed_admin(email: str, name: str = "Admin"):
    """Create admin user. Password dibaca dari stdin (tidak di-log)."""
    pwd = getpass.getpass("Admin password: ")
    pwd2 = getpass.getpass("Confirm: ")
    if pwd != pwd2:
        typer.echo("Mismatch", err=True)
        sys.exit(1)
    if len(pwd) < 12:
        typer.echo("Min 12 chars", err=True)
        sys.exit(1)

    async def _seed():
        async with async_session() as db:
            user = User(
                email=email,
                name=name,
                hashed_password=hash_password(pwd),
                role=UserRole.ADMIN,
                is_active=True,
                must_change_password=False,  # operator pilih sendiri = sadar
            )
            db.add(user)
            await db.commit()

    asyncio.run(_seed())
    typer.echo(f"Admin {email} created.")


if __name__ == "__main__":
    app()
```

Pakai: `python -m app.cli seed-admin admin@company.com`. Password tidak pernah masuk argv, tidak masuk shell history, tidak masuk Process listing.

#### Pelajaran
**Surface area minimization.** Setiap script alternatif yang bisa create privileged user = security debt. Kalau ada path A (aman) dan path B (tidak aman), hapus B. Jangan dokumentasikan B "untuk kasus tertentu" — pasti suatu hari operator pilih B.

`getpass.getpass()` lebih aman daripada CLI argument karena tidak masuk shell history dan tidak terlihat di `ps aux`.

---

## Prio 1 — Selesaikan minggu ini

### Fix 5 — N1 + N2: Tambah `is_public` + filter dashboard per-owner

#### Apa masalahnya
- `backend/app/api/v1/endpoints/public.py:21-44`: endpoint `/public/cameras` `select(Camera)` **tanpa filter is_public** — semua kamera dari user manapun otomatis publik.
- `backend/app/api/v1/endpoints/dashboard.py:39-57,80-105`: dashboard `select(Camera)` tanpa filter owner — operator A bisa lihat nama+lokasi kamera operator B.

#### Kenapa salah
Privacy by-default. User mendaftarkan kamera di akun mereka tidak otomatis berarti dia setuju publik. Default harus `is_public=False`, opt-in eksplisit.

Cross-tenant leak di dashboard = horizontal privilege escalation. Operator lain bisa enumerate properti, lokasi, nama kamera → reconnaissance untuk attack fisik.

#### Fix

**Migration**: `backend/alembic/versions/<new>_add_is_public_to_cameras.py`
```python
def upgrade():
    op.add_column(
        "cameras",
        sa.Column("is_public", sa.Boolean(),
                  server_default="false", nullable=False),
    )
    op.create_index("ix_cameras_is_public", "cameras", ["is_public"])

def downgrade():
    op.drop_index("ix_cameras_is_public", "cameras")
    op.drop_column("cameras", "is_public")
```

**Model**: `backend/app/models/camera.py`
```python
is_public: Mapped[bool] = mapped_column(
    Boolean, default=False, server_default="false", nullable=False
)
```

**Schema**: `backend/app/schemas/camera.py`
```python
class CameraCreate(BaseModel):
    name: str
    location: str | None = None
    rtsp_url: str
    username: str | None = None
    password: str | None = None
    is_public: bool = False  # ← default False
```

**Endpoint public**: `backend/app/api/v1/endpoints/public.py`
```python
@router.get("/cameras")
async def list_public_cameras(db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(Camera).where(Camera.is_public == True)  # ← FILTER
    )
    cameras = result.scalars().all()
    return [public_camera_to_dict(c) for c in cameras]
```

**Endpoint dashboard**: `backend/app/api/v1/endpoints/dashboard.py`
```python
@router.get("/cameras-status")
async def cameras_status(
    current_user: User = Depends(get_current_user_full_scope),
    db: AsyncSession = Depends(get_db),
):
    stmt = select(Camera)
    if current_user.role != UserRole.ADMIN:
        stmt = stmt.where(Camera.owner_id == current_user.id)
    result = await db.execute(stmt)
    return [camera_to_dict(c) for c in result.scalars().all()]
```

Sama untuk endpoint `/dashboard/stats` — count harus per-owner kecuali admin.

**Frontend**: tambah toggle `is_public` di form Add Camera (default off). Halaman publik `/live` cuma tampilkan kamera dengan `is_public=true`.

#### Pelajaran
**Default tertutup, akses dibuka eksplisit** (deny-by-default). Public exposure = ada kolom dedicated yang user harus opt-in nyalakan. Tidak ada "diam-diam jadi publik karena lupa filter".

Dashboard endpoint untuk operator harus selalu **scope by owner** kecuali role = admin. Pattern ini diulang di banyak endpoint — pertimbangkan helper `apply_owner_filter(stmt, user)` agar tidak lupa.

---

### Fix 6 — N3: Pisah `ENCRYPTION_KEY` dari `SECRET_KEY`

#### Apa masalahnya
File `backend/app/core/security.py:11-15`:
```python
def _get_fernet() -> Fernet:
    digest = hashlib.sha256(settings.SECRET_KEY.encode()).digest()
    key = base64.urlsafe_b64encode(digest)
    return Fernet(key)
```

Fernet key di-derive dari `SECRET_KEY` (yang juga dipakai sign JWT). Kalau `SECRET_KEY` bocor (env file bocor, log dump, error trace) → attacker bisa **forge JWT admin** DAN **decrypt password kamera**. Single point of failure.

#### Kenapa salah
**Prinsip key separation**: setiap kunci untuk fungsi berbeda. JWT signing key ≠ data encryption key. Compromise satu, satu fungsi terdampak — bukan dua.

#### Fix
**Settings**: `backend/app/core/config.py`
```python
class Settings(BaseSettings):
    SECRET_KEY: str
    ENCRYPTION_KEY: str  # ← TAMBAH (32 bytes hex = 64 chars, separate)

    @field_validator("ENCRYPTION_KEY")
    @classmethod
    def validate_encryption_key(cls, v: str) -> str:
        if not v or len(v) < 64 or v.startswith("change-this"):
            raise ValueError(
                "ENCRYPTION_KEY must be set (64-char hex via openssl rand -hex 32)"
            )
        return v
```

**Security**: `backend/app/core/security.py`
```python
def _get_fernet() -> Fernet:
    digest = hashlib.sha256(settings.ENCRYPTION_KEY.encode()).digest()
    key = base64.urlsafe_b64encode(digest)
    return Fernet(key)
```

**install_all.sh**: generate key terpisah:
```bash
JWT_SECRET=$(openssl rand -hex 32)
ENCRYPTION_KEY=$(openssl rand -hex 32)        # ← TAMBAH

cat <<EOF > $APP_DIR/backend/.env
SECRET_KEY=${JWT_SECRET}
ENCRYPTION_KEY=${ENCRYPTION_KEY}
...
EOF
```

**`.env.example`**: tambah baris `ENCRYPTION_KEY=` dengan placeholder.

**Migration data lama**: kalau sudah ada password kamera ter-encrypt dengan key lama (derived dari SECRET_KEY), harus re-encrypt:
```python
# scripts/rotate_encryption_key.py
async def rotate():
    old_fernet = Fernet(...)  # derive dari SECRET_KEY
    new_fernet = Fernet(...)  # derive dari ENCRYPTION_KEY
    cameras = await db.execute(select(Camera))
    for cam in cameras.scalars():
        if cam.password_enc:
            plaintext = old_fernet.decrypt(cam.password_enc.encode())
            cam.password_enc = new_fernet.encrypt(plaintext).decode()
    await db.commit()
```
Jalankan sekali saat migrasi, lalu hapus.

#### Pelajaran
**Key derivation chain itu fragile.** Kalau key A derive dari key B, compromise B = compromise A. Selalu pisahkan kunci dengan tujuan berbeda. Cost-nya cuma 1 baris env var, benefit-nya layered defense.

---

### Fix 7 — Hapus pola SQL f-string interpolation

#### Apa masalahnya
File `linux_deployment/install_all.sh:159-167` (inline `seed_admin.py`) dan `README.md:228-235`:
```python
sql = f"INSERT INTO users (name, email, password, role, is_active) VALUES ('{NAME}', '{EMAIL}', '{hashed}', 'ADMIN', true) ON CONFLICT DO NOTHING;"
```

Walaupun di kasus ini value berasal dari script (bukan user), polanya = SQL injection antipattern. Kalau nanti `EMAIL` jadi argument CLI (`./seed-admin --email "$1"`), satu user input dengan tanda kutip = SQL injection.

README mengajarkan pola ini ke pembaca — propagasi antipattern.

#### Fix
**install_all.sh** seed_admin inline:
```python
from sqlalchemy import text
sql = text("""
    INSERT INTO users (name, email, password, role, is_active, must_change_password)
    VALUES (:name, :email, :password, :role, true, true)
    ON CONFLICT (email) DO NOTHING
""")
session.execute(sql, {
    "name": NAME,
    "email": EMAIL,
    "password": hashed,
    "role": "ADMIN",
})
session.commit()
```

**README.md:228-235**: ganti contoh dengan versi parametrized. Tambah catatan eksplisit:
> "**Jangan pakai f-string untuk SQL.** Gunakan parameter binding via `text(...)` + dict. Detail: https://docs.sqlalchemy.org/en/20/core/tutorial.html#using-textual-sql"

#### Pelajaran
**SQL injection bukan tentang malicious input — tentang trust boundary.** Hari ini value dari script sendiri. Besok refactor jadi terima dari arg/env/config file. Pola yang aman terhadap kedua skenario = parametrized query, selalu, tanpa exception. Cost = 0 (sama panjang kode), benefit = immune terhadap refactor masa depan.

---

## Prio 2 — Sebelum production (sketsa, magang explore sendiri)

| # | Apa | Hint singkat |
|---|---|---|
| H2 | systemd `User=root` → user khusus | `useradd -r -s /bin/false cammatrix` + `User=cammatrix Group=cammatrix` di service unit + chown direktori |
| H9 | RTSP/HLS/WebRTC tetap 0.0.0.0 tanpa firewall | `ufw allow 8888,8889/tcp` (publik), `ufw deny 8554,9997` (internal). Atau iptables: `-A INPUT -p tcp --dport 9997 ! -s 127.0.0.1 -j DROP` |
| H12 | `isAuthenticated` Zustand persist tanpa re-verify ke backend | Saat `App` mount, `useEffect` panggil `GET /auth/me`, kalau 401 → clear store + redirect /login |
| M20 | `npx serve` di production | Build static `npm run build`, serve via Caddy/nginx (kalau jadi tambah), atau vite preview di systemd dengan resource limit |
| P2 | docker-compose half-broken | Putuskan: hapus, atau lengkapi dengan `env_file: /etc/cammatrix/secrets.env` + script generate. Jangan keep half-feature |

---

## Verifikasi setelah fix

Jalankan checklist ini sebelum commit:

```bash
# 1. P1 — publisher mobile terpisah
grep -A2 "user: publisher$" media_server/mediamtx.yml | grep "127.0.0.1"
# expect: ada baris ips: [127.0.0.1/32]
grep -A2 "user: mobile_publisher" media_server/mediamtx.yml | grep -v "api"
# expect: tidak ada permission "api"

# 2. P3 — SERVER_IP order
grep -n "SERVER_IP" linux_deployment/install_all.sh | head -5
# expect: assignment SERVER_IP=$(curl ...) muncul SEBELUM cat .env

# 3. P4 — scope enforcement
grep -rn "Depends(get_current_user)" backend/app/api/v1/endpoints/ | grep -v "auth.py"
# expect: kosong (semua sudah pakai get_current_user_full_scope)

# 4. C3 — create_admin.py hilang
ls backend/create_admin.py 2>&1
# expect: No such file

# 5. N1 — is_public filter
grep -A3 "/cameras" backend/app/api/v1/endpoints/public.py | grep "is_public"
# expect: ada .where(Camera.is_public == True)

# 6. SQL injection
grep -rn 'f"INSERT\|f"SELECT\|f"UPDATE\|f"DELETE' backend/ linux_deployment/ README.md
# expect: kosong (semua parametrized)
```

Tulis test untuk masing-masing fix di `backend/tests/test_security.py`:
```python
async def test_must_change_password_blocks_other_endpoints(client, db):
    # seed user must_change=True
    # login → dapat token
    # hit /cameras dengan token → expect 403
    # hit /auth/change-password dengan token → expect 200
    ...

async def test_public_cameras_only_returns_is_public_true(client, db):
    # seed 2 cameras, satu is_public=True satu False
    # GET /public/cameras (no auth)
    # expect: hanya 1 returned
    ...
```

---

## Penutup — pelajaran arsitektural

Audit putaran 3 menunjukkan pola yang konsisten:
1. **Individual fix dipahami, threat model holistik belum.** Tiap finding di-tutup satu-satu, tapi layered defense tidak ditangkap sebagai pattern (bukti: `7e1e3a9` undo IP whitelist 1 hari setelah `9e82d45` add hardening).
2. **Klaim ≠ enforcement.** must_change_password ditambah ke schema, JWT, endpoint — tapi tidak di-cek di dependency. Pola yang sama bisa muncul di fitur lain (role, tenant, scope).
3. **Frontend security ≠ backend security.** Hide login link + reorganize folder bukan security boundary. Backend route guard yang menentukan.

**Minta yang harus dicetak di kepala**:
- Setiap permission yang dikasih user = surface area baru. Default `[]`, tambah satu-satu dengan justifikasi.
- Setiap claim yang ditambahkan ke JWT/session = konsekuensi backend code. Kalau tidak ada cek, jangan tambah.
- Setiap data yang exposed publik = kolom database `is_public` dengan default false. Tidak ada "publik karena lupa filter".
- Setiap script yang bisa create privileged user = single source of truth. Multiple path = security level path terlemah.

Setelah Prio 0 selesai, push ke branch `bugfix/round-3`, beritahu kami untuk audit putaran 4 (verifikasi cepat saja, fokus regresi).
