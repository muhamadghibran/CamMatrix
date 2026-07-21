<div align="center">

<img src="https://img.shields.io/badge/CamMatrix-CCTV%20Platform-00ffff?style=for-the-badge&logo=camera&logoColor=white" alt="CamMatrix">

# CamMatrix
### 🎥 Platform Manajemen CCTV Berbasis Web Modern

<p align="center">
  <img src="https://img.shields.io/badge/React-19-61DAFB?style=flat-square&logo=react&logoColor=black" />
  <img src="https://img.shields.io/badge/Vite-8-646CFF?style=flat-square&logo=vite&logoColor=white" />
  <img src="https://img.shields.io/badge/TailwindCSS-4-38BDF8?style=flat-square&logo=tailwindcss&logoColor=white" />
  <img src="https://img.shields.io/badge/FastAPI-0.115-009688?style=flat-square&logo=fastapi&logoColor=white" />
  <img src="https://img.shields.io/badge/Python-3.11+-3776AB?style=flat-square&logo=python&logoColor=white" />
  <img src="https://img.shields.io/badge/PostgreSQL-16+pgvector-4169E1?style=flat-square&logo=postgresql&logoColor=white" />
  <img src="https://img.shields.io/badge/MediaMTX-v1.9-orange?style=flat-square" />
  <img src="https://img.shields.io/badge/MinIO-S3%20Storage-red?style=flat-square&logo=minio&logoColor=white" />
  <img src="https://img.shields.io/badge/License-MIT-green?style=flat-square" />
</p>

<p align="center">
  CamMatrix adalah platform manajemen kamera CCTV berbasis web yang dirancang untuk keamanan profesional. Dibangun dengan antarmuka futuristik bergaya <strong>glassmorphism</strong> dan <strong>neon-cyan accent</strong>, CamMatrix memberikan pengalaman pemantauan kamera yang mulus, intuitif, dan mudah diakses — lengkap dengan AI Face Analytics dan Cross-Camera Person Tracking.
</p>

</div>

---

## 📸 Tampilan Halaman

| Halaman | Rute | Akses | Deskripsi |
|---------|------|-------|-----------|
| 🏠 Landing Page | `/` | Publik | Hero section animasi dengan CosmicBackground |
| 📺 Siaran Langsung | `/live` | **Publik — tanpa login** | Lihat semua kamera secara langsung via HLS |
| 🔐 Login Admin | `/login` | Publik | Form login JWT dengan force-change-password |
| 📊 Dashboard | `/app/dashboard` | Admin | Statistik real-time & grafik kamera |
| 📹 Live View (Admin) | `/app/live` | Admin | Grid kamera multi-layout dengan WebSocket status |
| 🎥 Manajemen Kamera | `/app/cameras` | Admin | CRUD kamera RTSP dengan enkripsi |
| 🎬 Rekaman | `/app/recordings` | Admin | Daftar & putar rekaman video dari MediaMTX |
| 🧠 Face Analytics | `/app/face` | Admin | AI Face Detection + Cross-Camera Tracking |
| 👥 Pengguna | `/app/users` | Admin | Manajemen akun & role pengguna |
| ⚙️ Pengaturan | `/app/settings` | Admin | Tema, bahasa, dan notifikasi |

---

## ✨ Fitur Utama

### 📺 Siaran Langsung Publik (Tanpa Login)
- **URL Publik `/live`** — Siapapun dapat melihat siaran langsung kamera tanpa perlu login
- **HLS Streaming** — Ditenagai MediaMTX, ditampilkan via HLS.js di browser
- **Auto-refresh** — Status kamera diperbarui otomatis tiap 15 detik
- **Tombol Admin** — Link ke halaman login di pojok kanan atas

### 🔐 Autentikasi Admin
- **Login Email + Password** — Form sederhana dan aman
- **JWT Authentication** — Semua API admin dilindungi dengan JWT Token
- **Rate Limiting** — Login dibatasi via `slowapi` untuk mencegah brute-force
- **Force Change Password** — Admin baru wajib ganti password saat login pertama (`must_change_password=true`)
- **Session** — Token disimpan via Zustand store, logout membersihkan semua state

### 🛡️ Keamanan & Hardening
- **Wajib Ganti Password** — Admin baru yang dibuat via script wajib mengganti password saat login pertama kali
- **Isolasi API Streaming** — API MediaMTX (port 9997) dikunci hanya untuk akses `127.0.0.1`, mencegah manipulasi dari internet
- **Otentikasi Streaming** — Role spesifik: `publisher` (backend pull RTSP), `mobile_publisher` (push dari HP), `any` (view HLS)
- **Enkripsi Kredensial Kamera** — Password CCTV dienkripsi menggunakan `cryptography.fernet` di dalam database PostgreSQL
- **Validasi RTSP & Anti-SSRF** — Hanya `rtsp://` dan `rtsps://` yang diizinkan, menolak injeksi IP lokal palsu
- **Startup Safety Check** — Server menolak hidup jika password admin masih `admin123` di mode Production
- **pgvector** — Face embedding 128-dimensi tersimpan aman di PostgreSQL (bukan file sistem)

### 📊 Dashboard
- **Statistik Real-time** — Kamera aktif, total rekaman, penyimpanan terpakai
- **Status Kamera** — Monitoring status seluruh kamera (Live/Offline) per-user

### 🎥 Manajemen Kamera (CRUD Penuh)
- **Tambah Kamera RTSP Pull** — Input nama, lokasi, URL RTSP, username, password
- **Mode Publisher (Push)** — Kirim stream dari HP menggunakan Larix Broadcaster via `rtsp://SERVER:8554/mobile_<nama>`
- **Enkripsi Otomatis** — Password kamera dienkripsi saat disimpan, dekripsi saat digunakan backend
- **Edit & Hapus** — Manajemen lengkap dengan konfirmasi dialog
- **Pencarian** — Filter kamera berdasarkan nama atau lokasi
- **Sinkronisasi MediaMTX** — Kamera baru otomatis terdaftar ke MediaMTX via REST API saat startup & CRUD

### 🎬 Manajemen Rekaman
- **Rekaman Otomatis** — MediaMTX merekam stream ke `/var/www/CamMatrix/recordings/` dalam segmen 300 detik
- **Daftar Rekaman** — Tampil di halaman admin dengan filter per kamera
- **Putar Video** — Modal player dengan HLS.js langsung dari server
- **Hapus Rekaman** — Penghapusan file dari server via API

### 🧠 AI Face Analytics (Fitur Unggulan)
- **Face Detection** — Deteksi wajah dari file rekaman menggunakan `opencv-python-headless` (haar cascade)
- **Face Recognition** — Ekstrak 128-dimensi face embedding menggunakan `face_recognition` (dlib)
- **Cross-Camera Person Tracking** — Melacak individu yang sama melalui beberapa kamera berbeda menggunakan embedding similarity
- **Real-time Detection** — WebSocket `/ws/realtime/{camera_id}` untuk deteksi wajah dari live HLS stream
- **Always-On Detection** — Worker deteksi berjalan terus-menerus di background, auto-stop jika tidak ada subscriber
- **Job Queue** — Analisis rekaman berjalan sebagai background task dengan status: `pending` → `running` → `done`/`failed`
- **Face Analytics Page** — Tampilan sighting lintas kamera, timeline kemunculan, badge live/recorded

### 👥 Manajemen Pengguna
- **CRUD Pengguna** — Tambah, edit, hapus pengguna dari panel admin
- **Role System** — `ADMIN`, `OPERATOR`, `VIEWER`
- **Statistik** — Total pengguna, pengguna aktif
- **Pencarian** — Filter berdasarkan nama atau email
- **Isolasi Data** — Kamera terisolasi per `owner_id`, tidak bocor antar pengguna

### ⚙️ Pengaturan
- **Tema** — Dark Mode dan Light Mode (via Zustand `themeStore`)
- **Bahasa** — Indonesia 🇮🇩, English 🇺🇸, 中文 🇨🇳 (via i18n `locales/`)
- **Notifikasi** — Toggle untuk berbagai jenis peringatan

---

## 🏗️ Struktur Proyek

```
CamMatrix/
├── frontend/                    # Aplikasi React 19 (Vite 8 + TailwindCSS 4)
│   ├── src/
│   │   ├── pages/
│   │   │   ├── public/
│   │   │   │   ├── HomePage.jsx            # Landing page (CosmicBackground + AnimatedText)
│   │   │   │   └── LivePublicPage.jsx      # Siaran langsung publik (tanpa login)
│   │   │   ├── auth/
│   │   │   │   └── LoginPage.jsx           # Login admin (JWT + force change password)
│   │   │   └── admin/                      # Halaman admin (wajib login)
│   │   │       ├── DashboardPage.jsx       # Statistik kamera & rekaman real-time
│   │   │       ├── LiveViewPage.jsx        # Grid kamera live (WebSocket status)
│   │   │       ├── CamerasPage.jsx         # CRUD kamera RTSP
│   │   │       ├── RecordingsPage.jsx      # Manajemen & putar rekaman
│   │   │       ├── FaceAnalyticsPage.jsx   # AI Face Detection + Cross-Camera Tracking
│   │   │       ├── UsersPage.jsx           # Manajemen pengguna & role
│   │   │       └── SettingsPage.jsx        # Tema, bahasa, notifikasi
│   │   ├── components/
│   │   │   ├── AnimatedText.jsx            # Teks animasi typing
│   │   │   ├── CamLogo.jsx                 # Logo SVG animasi
│   │   │   ├── CosmicBackground.jsx        # Background partikel animasi
│   │   │   ├── VideoPlayerModal.jsx        # Modal pemutar HLS video
│   │   │   └── layout/
│   │   │       └── MainLayout.jsx          # Layout sidebar + topbar admin
│   │   ├── store/
│   │   │   ├── authStore.js                # State autentikasi (Zustand)
│   │   │   ├── cameraStore.js              # State data kamera
│   │   │   ├── themeStore.js               # Dark/light mode
│   │   │   └── languageStore.js            # Multi-bahasa
│   │   ├── locales/                        # File terjemahan (ID/EN/ZH)
│   │   ├── constants/
│   │   │   └── api.js                      # Konstanta URL API
│   │   └── utils/
│   │       └── api.js                      # Axios instance + JWT interceptor
│   ├── tailwind.config.js                  # Konfigurasi TailwindCSS 4
│   ├── vite.config.js
│   └── package.json
│
├── backend/                     # API FastAPI (Python 3.11+)
│   ├── app/
│   │   ├── api/v1/endpoints/
│   │   │   ├── public.py            # Endpoint publik (tanpa auth) — /live
│   │   │   ├── auth.py              # Login, /me, change-password
│   │   │   ├── cameras.py           # CRUD kamera + enkripsi Fernet + MediaMTX sync
│   │   │   ├── users.py             # CRUD pengguna (admin only)
│   │   │   ├── recordings.py        # Manajemen rekaman (list, play, delete)
│   │   │   ├── dashboard.py         # Statistik dashboard real-time
│   │   │   ├── settings.py          # Pengaturan sistem
│   │   │   ├── ai.py                # AI Face Analysis job endpoint
│   │   │   ├── tracking.py          # Cross-camera person tracking
│   │   │   └── realtime_ws.py       # WebSocket real-time face detection
│   │   ├── services/
│   │   │   ├── face_service.py          # Background job face detection (opencv + dlib)
│   │   │   ├── realtime_detection.py    # Always-on HLS stream detector + WebSocket publisher
│   │   │   ├── tracking_service.py      # Cross-camera tracking via face embedding similarity
│   │   │   └── mediamtx_client.py       # REST client untuk MediaMTX API
│   │   ├── models/
│   │   │   ├── user.py              # Model User (role, must_change_password)
│   │   │   ├── camera.py            # Model Camera (rtsp_url, password terenkripsi)
│   │   │   ├── recording.py         # Model Recording (minio_key, path lokal)
│   │   │   ├── face_analysis.py     # Model FaceAnalysisJob + FaceDetection
│   │   │   ├── person_tracking.py   # Model PersonTrack + TrackSighting
│   │   │   └── setting.py           # Model pengaturan sistem
│   │   ├── schemas/                 # Pydantic schemas (request/response)
│   │   ├── core/
│   │   │   ├── config.py            # Settings dari .env (pydantic-settings)
│   │   │   ├── database.py          # Async SQLAlchemy + AsyncSessionLocal
│   │   │   ├── security.py          # JWT + bcrypt + Fernet enkripsi
│   │   │   ├── storage.py           # MinIO S3 client
│   │   │   └── dlib_lock.py         # Global lock untuk thread-safe dlib
│   │   └── api/deps.py              # Dependency injection (get_current_user, get_db)
│   ├── alembic/                     # Migrasi database
│   ├── main.py                      # Entry point FastAPI + startup sync kamera
│   ├── requirements.txt
│   └── .env.example
│
├── media_server/
│   └── mediamtx.yml                 # Konfigurasi MediaMTX (auth, HLS, RTSP, paths)
│
├── linux_deployment/                # Script deploy VPS Ubuntu 24.04
│   ├── install_all.sh               # Installer otomatis (8 langkah)
│   ├── update_deployment.sh         # Updater otomatis (git pull + build + restart)
│   ├── cammatrix-backend.service    # Systemd unit: FastAPI via uvicorn
│   ├── cammatrix-frontend.service   # Systemd unit: React via npx serve
│   ├── mediamtx.service             # Systemd unit: MediaMTX streaming server
│   └── minio.service                # Systemd unit: MinIO object storage
│
├── SSH-COMMANDS.md                  # Cheatsheet perintah SSH & manajemen server
├── docker-compose.yml               # Konfigurasi infra lokal (Postgres + MinIO + MediaMTX)
├── BLUEPRINT.md                     # Arsitektur sistem (network map, ER diagram)
└── WHITEPAPER.md                    # Dokumen teknis mendalam
```

---

## 🛠️ Teknologi yang Digunakan

### Frontend
| Teknologi | Versi | Fungsi |
|-----------|-------|--------|
| **React** | 19 | UI Library |
| **Vite** | 8 | Build tool & dev server |
| **TailwindCSS** | 4 | Utility-first CSS framework |
| **React Router DOM** | 7 | Routing SPA |
| **Zustand** | 5 | State management (auth, camera, theme, language) |
| **Axios** | 1.15+ | HTTP client + JWT interceptor |
| **HLS.js** | 1.6+ | Video streaming HLS di browser |
| **Lucide React** | latest | Icon library |

### Backend
| Teknologi | Versi | Fungsi |
|-----------|-------|--------|
| **FastAPI** | 0.115+ | REST API server + WebSocket |
| **Uvicorn** | 0.34+ | ASGI server |
| **SQLAlchemy (Async)** | 2.0+ | ORM async database |
| **Alembic** | 1.15+ | Migrasi schema database |
| **python-jose** | 3.3+ | JWT authentication |
| **passlib + bcrypt** | 1.7+ | Hash password user |
| **cryptography (Fernet)** | 42+ | Enkripsi password kamera RTSP |
| **slowapi** | 0.1.9+ | Rate limiting per-IP |
| **httpx** | 0.28+ | Async HTTP client (komunikasi ke MediaMTX) |
| **opencv-python-headless** | 4.8+ | Face detection (haar cascade) |
| **face_recognition (dlib)** | 1.3+ | 128-dim face embedding |
| **psutil** | 6.0+ | System metrics (CPU, RAM, disk) |

### Infrastruktur
| Teknologi | Port | Fungsi |
|-----------|------|--------|
| **PostgreSQL 16 + pgvector** | 5432 | Database utama + face vector storage |
| **MediaMTX v1.9** | 8554/8888/8889 | RTSP → HLS/WebRTC streaming gateway |
| **MinIO** | 9000/9001 | S3-compatible object storage rekaman |

---

## 🚀 Cara Menjalankan

### Opsi A: Lokal (Development) dengan Docker

**Prasyarat:** Docker & Docker Compose

```bash
# Clone repository
git clone https://github.com/muhamadghibran/CamMatrix.git
cd CamMatrix

# Jalankan infrastruktur (PostgreSQL + MinIO + MediaMTX)
docker compose up -d

# Cek status container
docker compose ps
```

Akses:
- **PostgreSQL** → `localhost:5432`
- **MinIO Console** → `http://localhost:9001` (user: `minioadmin`, pass: `minioadmin`)
- **MediaMTX HLS** → `http://localhost:8888`

```bash
# Backend
cd backend
python -m venv venv
source venv/bin/activate          # Windows: venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env              # Sesuaikan nilai di .env
alembic upgrade head
uvicorn main:app --reload
```
*API berjalan di: `http://localhost:8000`*  
*Docs (dev mode): `http://localhost:8000/api/docs`*

```bash
# Frontend (terminal baru)
cd frontend
npm install
npm run dev
```
*Web berjalan di: `http://localhost:5173`*

---

### Opsi B: Deploy ke VPS Production (Ubuntu 24.04)

```bash
# Clone dan jalankan installer otomatis
git clone https://github.com/muhamadghibran/CamMatrix.git
cd CamMatrix
sudo chmod +x linux_deployment/install_all.sh
sudo bash linux_deployment/install_all.sh
```

Installer otomatis akan:
1. Install PostgreSQL 16 + pgvector, MinIO, MediaMTX v1.9, Node.js 20, Python 3
2. Generate kredensial acak (JWT secret, encryption key, DB password, MinIO password)
3. Setup database `cctv_vms` dan jalankan migrasi Alembic
4. Buat akun admin `admin@vms.com` dengan password acak (≥128-bit, wajib ganti saat login pertama)
5. Build frontend React ke folder `dist/`
6. Daftarkan semua layanan ke systemd (auto-start saat reboot)

Akses setelah install:
- **Frontend** → `http://YOUR_SERVER_IP:5173`
- **Backend API** → `http://YOUR_SERVER_IP:8000`
- **MinIO Console** → `http://YOUR_SERVER_IP:9001`

### Update Aplikasi di VPS

```bash
cd /var/www/CamMatrix
sudo bash linux_deployment/update_deployment.sh
```

---

## 🔑 Sistem Akses

### 2 Mode Pengguna

| Mode | URL | Login? | Kemampuan |
|------|-----|--------|-----------|
| **Viewer Publik** | `/live` | ❌ Tidak perlu | Lihat siaran langsung semua kamera |
| **Administrator** | `/login` → `/app/*` | ✅ Wajib JWT | Kelola kamera, pengguna, rekaman, AI analytics, pengaturan |

### Konfigurasi `.env` Backend

```env
# Keamanan
SECRET_KEY=your-random-key-minimum-32-chars     # python -c "import secrets; print(secrets.token_hex(32))"
ENCRYPTION_KEY=your-random-key-minimum-32-chars  # openssl rand -hex 32
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=1440
DEBUG=false

# Database
DATABASE_URL=postgresql+asyncpg://postgres:PASSWORD@localhost:5432/cctv_vms

# MinIO Storage
MINIO_ENDPOINT=localhost:9000
MINIO_ACCESS_KEY=admin
MINIO_SECRET_KEY=your-minio-password
MINIO_BUCKET_NAME=records
MINIO_SECURE=False

# MediaMTX
MEDIAMTX_API_URL=http://localhost:9997
MEDIAMTX_RTSP_BASE=rtsp://localhost:8554
MTX_PUBLISHER_PASS=your-generated-publisher-pass

# CORS & HLS (ganti dengan IP VPS kamu)
CORS_ORIGINS=["http://YOUR_SERVER_IP:5173","http://localhost:5173"]
HLS_BASE_URL=http://YOUR_SERVER_IP:8888

# AI Engine
AI_DEVICE=auto             # auto | cuda | cpu
AI_FRAME_SAMPLE_RATE=5
AI_FACE_CONFIDENCE=0.75
AI_SIMILARITY_THRESHOLD=0.60
AI_REALTIME_FPS=5
AI_REALTIME_TIMEOUT=30
```

### Konfigurasi `.env` Frontend

```env
VITE_API_BASE_URL=http://YOUR_SERVER_IP:8000/api/v1
VITE_WS_BASE_URL=ws://YOUR_SERVER_IP:8000/ws
VITE_MEDIAMTX_URL=http://YOUR_SERVER_IP:8889
```

---

## 📋 Rute Aplikasi

| Rute | Halaman | Akses | Komponen |
|------|---------|-------|----------|
| `/` | Landing Page | Publik | `HomePage.jsx` |
| `/live` | 📺 Siaran Langsung | **Publik — tanpa login** | `LivePublicPage.jsx` |
| `/login` | Login Admin | Publik | `LoginPage.jsx` |
| `/app/dashboard` | Dashboard | Admin | `DashboardPage.jsx` |
| `/app/live` | Live View (Admin) | Admin | `LiveViewPage.jsx` |
| `/app/cameras` | Manajemen Kamera | Admin | `CamerasPage.jsx` |
| `/app/recordings` | Rekaman | Admin | `RecordingsPage.jsx` |
| `/app/face` | 🧠 AI Face Analytics | Admin | `FaceAnalyticsPage.jsx` |
| `/app/settings` | Pengaturan | Admin | `SettingsPage.jsx` |
| `/app/users` | Manajemen Pengguna | Admin | `UsersPage.jsx` |

---

## 🌐 API Endpoints

### Publik (Tanpa Auth)
| Method | Endpoint | Deskripsi |
|--------|----------|-----------|
| `GET` | `/` | Health check root |
| `GET` | `/health` | Status server |
| `POST` | `/api/v1/auth/login` | Login (form: username + password) |
| `GET` | `/api/v1/public/cameras` | Daftar kamera untuk halaman `/live` |

### Admin (Wajib JWT Bearer Token)
| Method | Endpoint | Deskripsi |
|--------|----------|-----------|
| `GET` | `/api/v1/auth/me` | Info user yang sedang login |
| `POST` | `/api/v1/auth/change-password` | Ganti password |
| `GET/POST/PUT/DELETE` | `/api/v1/cameras` | CRUD kamera |
| `POST` | `/api/v1/cameras/sync-mediamtx` | Sinkronisasi kamera ke MediaMTX |
| `GET/DELETE` | `/api/v1/recordings` | List & hapus rekaman |
| `GET` | `/api/v1/dashboard` | Statistik dashboard |
| `GET/POST/PUT/DELETE` | `/api/v1/users` | CRUD pengguna |
| `POST` | `/api/v1/ai/analyze/{recording_id}` | Mulai job analisis wajah |
| `GET` | `/api/v1/ai/jobs/{job_id}` | Status job analisis |
| `GET` | `/api/v1/ai/jobs/{job_id}/results` | Hasil deteksi wajah |
| `GET` | `/api/v1/tracking/persons` | Daftar orang terlacak |
| `GET` | `/api/v1/tracking/persons/{id}/sightings` | Kemunculan per kamera |

### WebSocket
| Endpoint | Deskripsi |
|----------|-----------|
| `ws://SERVER:8000/ws/realtime/{camera_id}` | Real-time face detection stream |

---

## 🗄️ Database Schema

```sql
-- Tabel users
users (
  id                   SERIAL PRIMARY KEY,
  full_name            VARCHAR(255),
  email                VARCHAR(255) UNIQUE NOT NULL,
  hashed_password      VARCHAR(255),
  role                 ENUM('ADMIN', 'OPERATOR', 'VIEWER') DEFAULT 'VIEWER',
  is_active            BOOLEAN DEFAULT TRUE,
  must_change_password BOOLEAN DEFAULT FALSE,
  created_at           TIMESTAMP WITH TIME ZONE DEFAULT NOW()
)

-- Tabel cameras
cameras (
  id         SERIAL PRIMARY KEY,
  owner_id   INTEGER REFERENCES users(id),
  name       VARCHAR(255),
  location   VARCHAR(255),
  rtsp_url   VARCHAR(500),   -- 'publisher' untuk mode push
  username   VARCHAR(255),
  password   TEXT,            -- Terenkripsi Fernet (tidak pernah plaintext)
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
)

-- Tabel recordings (rekaman dari MediaMTX)
recordings (
  id          SERIAL PRIMARY KEY,
  camera_id   INTEGER REFERENCES cameras(id),
  minio_key   TEXT,           -- 'local:{uuid}:{/path/to/file.mp4}'
  duration    INTEGER,
  file_size   BIGINT,
  created_at  TIMESTAMP WITH TIME ZONE DEFAULT NOW()
)

-- Tabel face_analysis_jobs
face_analysis_jobs (
  id           UUID PRIMARY KEY,
  recording_id INTEGER REFERENCES recordings(id),
  status       ENUM('pending', 'running', 'done', 'failed'),
  progress     INTEGER DEFAULT 0,
  created_at   TIMESTAMP WITH TIME ZONE DEFAULT NOW()
)

-- Tabel face_detections (hasil deteksi per frame)
face_detections (
  id          SERIAL PRIMARY KEY,
  job_id      UUID REFERENCES face_analysis_jobs(id),
  track_id    INTEGER,
  timestamp   FLOAT,          -- detik dalam video
  embedding   VECTOR(128),    -- pgvector — 128-dim face embedding (dlib)
  created_at  TIMESTAMP WITH TIME ZONE DEFAULT NOW()
)

-- Tabel person_tracks (identitas orang terlacak)
person_tracks (
  id        SERIAL PRIMARY KEY,
  label     VARCHAR(255),
  embedding VECTOR(128),      -- rata-rata embedding wajah
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
)

-- Tabel track_sightings (kemunculan per kamera/rekaman)
track_sightings (
  id                SERIAL PRIMARY KEY,
  track_id          INTEGER REFERENCES person_tracks(id),
  camera_id         INTEGER REFERENCES cameras(id),
  recording_id      INTEGER REFERENCES recordings(id),
  first_timestamp   FLOAT,
  last_timestamp    FLOAT,
  count             INTEGER DEFAULT 1
)
```

---

## 🧠 Arsitektur AI Face Tracking

```
[Rekaman Video / HLS Live Stream]
        │
        ▼
[face_service.py / realtime_detection.py]
  opencv haar cascade → deteksi bounding box wajah
        │
        ▼
[face_recognition (dlib)]
  ekstrak 128-dimensi face embedding per wajah
        │
        ▼
[tracking_service.py]
  cosine similarity → cocokkan embedding antar kamera
  threshold: AI_SIMILARITY_THRESHOLD (default 0.60)
        │
        ▼
[PostgreSQL + pgvector]
  simpan PersonTrack + TrackSighting
  embedding disimpan sebagai VECTOR(128)
        │
        ▼
[FaceAnalyticsPage.jsx]
  tampilkan sighting lintas kamera, timeline, badge live/recorded
```

---

## 📺 Arsitektur Streaming

```
[Kamera CCTV] ──RTSP──► [MediaMTX :8554]
[Larix (HP)]  ──RTSP──► [MediaMTX :8554]  ◄── REST API :9997 ── [FastAPI Backend]
                              │
                    ┌─────────┼──────────┐
                    ▼         ▼          ▼
                [HLS :8888] [WebRTC :8889] [RTSP :8554]
                    │
                    ▼
             [Browser] ← HLS.js
```

**Format path kamera MediaMTX:**
- `cam_{owner_id}_{camera_id}` — RTSP pull dari kamera IP (backend publish)
- `mobile_{nama}` — RTSP push dari HP (Larix Broadcaster)

---

## 🌐 Dukungan Multi-Bahasa

| Kode | Bahasa |
|------|--------|
| `id` | 🇮🇩 Bahasa Indonesia (default) |
| `en` | 🇺🇸 English |
| `zh` | 🇨🇳 中文 (Mandarin) |

Ubah bahasa melalui **Pengaturan → Bahasa** atau via `languageStore`.

---

## 🗺️ Roadmap

- [x] Autentikasi JWT (Login/Logout) dengan rate limiting
- [x] Force change password saat login pertama
- [x] Enkripsi password kamera RTSP (Fernet)
- [x] Halaman siaran langsung publik tanpa login (`/live`)
- [x] Mode Publisher — kirim stream dari HP (Larix Broadcaster)
- [x] CRUD kamera dengan validasi RTSP URL (anti-SSRF)
- [x] Kamera per-user dengan isolasi data (owner_id)
- [x] Multi-bahasa (ID/EN/ZH)
- [x] Dark/Light mode
- [x] Rekaman video otomatis via MediaMTX
- [x] AI Face Detection dari rekaman (opencv + dlib)
- [x] Cross-Camera Person Tracking (pgvector + embedding similarity)
- [x] Real-time face detection via WebSocket
- [x] Always-on detection worker (auto-start/stop)
- [x] Dashboard statistik real-time
- [x] Systemd auto-deploy (installer otomatis)
- [ ] Nginx + TLS/HTTPS (domain + SSL)
- [ ] Push notification ke browser (Web Push API)
- [ ] Mobile app (React Native / PWA)
- [ ] Multi-tenant (multiple organization)

---

## 📖 Dokumentasi Tambahan

| File | Deskripsi |
|------|-----------|
| [SSH-COMMANDS.md](./SSH-COMMANDS.md) | Cheatsheet perintah SSH, restart, monitoring, troubleshooting |
| [BLUEPRINT.md](./BLUEPRINT.md) | Arsitektur sistem, network map, ER diagram |
| [WHITEPAPER.md](./WHITEPAPER.md) | Dokumen teknis mendalam |
| [TUTORIAL-DEPLOYMENT.md](./TUTORIAL-DEPLOYMENT.md) | Tutorial deploy langkah demi langkah |
| [WORKFLOW.md](./WORKFLOW.md) | Alur kerja pengembangan |

---

## 👨‍💻 Tim Pengembang

**Muhamad Ghibran Muslih** — [@muhamadghibran](https://github.com/muhamadghibran)

**Muhammad Fathir Bagas** — [@CHOCOcheeseE](https://github.com/CHOCOcheeseE)

**Muhammad Sinar Agusta** — [@muhamadghibran](https://github.com/muhamadghibran)

**Muh Agung Hanapi** — [@muhagunghanapi](https://github.com/muhagunghanapi)

**Ferdi Supyandi** — [@ferdisupyandi](https://github.com/ferdisupyandi)

**Citra** — [@citrarafril](https://github.com/citrarafril)

**Haiza** — [@haizaputri](https://github.com/haizaputri)

---

## 📄 Lisensi

Proyek ini menggunakan lisensi **MIT** — bebas digunakan, dimodifikasi, dan didistribusikan.

---

<div align="center">

Dibuat dengan ❤️ menggunakan **React 19 + FastAPI + PostgreSQL + MediaMTX + AI Face Recognition**

⭐ Jika proyek ini bermanfaat, berikan bintang di GitHub!

</div>
