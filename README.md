<div align="center">

<img src="https://img.shields.io/badge/CamMatrix-CCTV%20Platform-00ffff?style=for-the-badge&logo=camera&logoColor=white" alt="CamMatrix">

# CamMatrix
### 🎥 Platform Manajemen CCTV Berbasis Web Modern

<p align="center">
  <img src="https://img.shields.io/badge/React-19-61DAFB?style=flat-square&logo=react&logoColor=black" />
  <img src="https://img.shields.io/badge/Vite-8-646CFF?style=flat-square&logo=vite&logoColor=white" />
  <img src="https://img.shields.io/badge/FastAPI-0.115-009688?style=flat-square&logo=fastapi&logoColor=white" />
  <img src="https://img.shields.io/badge/Python-3.11+-3776AB?style=flat-square&logo=python&logoColor=white" />
  <img src="https://img.shields.io/badge/PostgreSQL-16-4169E1?style=flat-square&logo=postgresql&logoColor=white" />
  <img src="https://img.shields.io/badge/MediaMTX-v1.9-orange?style=flat-square" />
  <img src="https://img.shields.io/badge/License-MIT-green?style=flat-square" />
</p>

<p align="center">
  CamMatrix adalah platform manajemen kamera CCTV berbasis web yang dirancang untuk keamanan profesional. Dibangun dengan antarmuka futuristik bergaya <strong>glassmorphism</strong> dan <strong>neon-cyan accent</strong>, CamMatrix memberikan pengalaman pemantauan kamera yang mulus, intuitif, dan mudah diakses.
</p>

</div>

---

## 📸 Tampilan

| Halaman | Akses | Deskripsi |
|---------|-------|-----------|
| 🏠 Landing Page | Publik | Hero section animasi |
| 📺 Siaran Langsung | **Publik — tanpa login** | Lihat semua kamera secara langsung |
| 🔐 Login Admin | Publik | Form login untuk administrator |
| 📊 Dashboard | Admin | Statistik real-time & grafik |
| 📹 Live View (Admin) | Admin | Grid kamera multi-layout dengan kontrol |
| 🎥 Kamera | Admin | Manajemen kamera CCTV (CRUD) |
| 🎬 Rekaman | Admin | Daftar rekaman video |
| 👥 Pengguna | Admin | Manajemen akun pengguna |

---

## ✨ Fitur Utama

### 📺 Siaran Langsung Publik (Tanpa Login)
- **URL Publik `/live`** — Siapapun dapat melihat siaran langsung kamera tanpa perlu login
- **HLS Streaming** — Ditenagai MediaMTX, ditampilkan via HLS.js
- **Auto-refresh** — Status kamera diperbarui otomatis tiap 15 detik
- **Tombol Admin** — Link ke halaman login di pojok kanan atas

### 🔐 Autentikasi Admin
- **Login Email + Password** — Form sederhana dan aman
- **JWT Authentication** — Semua API admin dilindungi dengan JWT Token
- **Rate Limiting** — Login dibatasi 5x/menit untuk mencegah brute-force
- **Session** — Token disimpan aman, logout membersihkan semua state

### 🛡️ Keamanan & Hardening (Audit Sesi 2)
- **Wajib Ganti Password** — Admin baru yang dibuat via script wajib mengganti password saat login pertama kali (Scope terisolasi).
- **Isolasi API Streaming** — API MediaMTX (port 9997) dikunci hanya untuk akses `127.0.0.1` (backend), mencegah manipulasi dari internet.
- **Otentikasi Streaming Spesifik** — Akses *wildcard* dihapus, diganti dengan 2 role spesifik (*Publisher* dan *Viewer*).
- **Enkripsi Kredensial Kamera** — Password CCTV dienkripsi menggunakan *Fernet* di dalam database PostgreSQL.
- **Obfuscasi Konfigurasi YAML** — Kredensial RTSP disimpan di file terpisah (`cameras.env` mode 600) untuk mencegah *plaintext* di `mediamtx.yml`.
- **Validasi RTSP & Anti-SSRF** — Hanya `rtsp://` dan `rtsps://` yang diizinkan, menolak injeksi IP lokal palsu.
- **Startup Safety Check** — Server menolak hidup jika mendeteksi password admin masih default (`admin123`) di mode Production.

### 📊 Dashboard
- **Statistik Real-time** — Kamera aktif, rekaman, penyimpanan
- **Status Kamera** — Monitoring status seluruh kamera (Live/Offline)

### 🎥 Manajemen Kamera (CRUD Penuh)
- **Tambah Kamera RTSP** — Input nama, lokasi, URL RTSP, username, password
- **Mode Publisher (Push)** — Kirim stream dari HP menggunakan Larix Broadcaster
- **Enkripsi Otomatis** — Password kamera dienkripsi saat disimpan
- **Edit & Hapus** — Manajemen lengkap dengan konfirmasi dialog
- **Pencarian** — Filter kamera berdasarkan nama atau lokasi
- **Sinkronisasi MediaMTX** — Kamera baru otomatis terdaftar ke server streaming

### 👥 Manajemen Pengguna
- **CRUD Pengguna** — Tambah, edit, hapus pengguna dari panel admin
- **Data Real Database** — Tabel menampilkan semua pengguna dari PostgreSQL
- **Statistik** — Total pengguna, pengguna aktif
- **Pencarian** — Filter berdasarkan nama atau email

### ⚙️ Pengaturan
- **Tema** — Dark Mode dan Light Mode
- **Bahasa** — Indonesia 🇮🇩, English 🇺🇸, 中文 🇨🇳
- **Notifikasi** — Toggle untuk berbagai jenis peringatan

---

## 🏗️ Struktur Proyek

```
CamMatrix/
├── frontend/                    # Aplikasi React (Vite)
│   ├── src/
│   │   ├── pages/
│   │   │   ├── LivePublicPage.jsx      # ✅ Siaran langsung publik (tanpa login)
│   │   │   ├── LoginPage.jsx           # Login admin (email+password)
│   │   │   ├── HomePage.jsx            # Landing page
│   │   │   ├── DashboardPage.jsx       # Dashboard statistik
│   │   │   ├── LiveViewPage.jsx        # Grid kamera live (admin)
│   │   │   ├── CamerasPage.jsx         # Manajemen kamera CCTV
│   │   │   ├── RecordingsPage.jsx      # Rekaman video
│   │   │   ├── UsersPage.jsx           # Manajemen pengguna
│   │   │   └── SettingsPage.jsx        # Pengaturan sistem
│   │   ├── store/
│   │   │   ├── authStore.js            # State autentikasi (Zustand)
│   │   │   ├── cameraStore.js          # State data kamera
│   │   │   ├── themeStore.js           # Dark/light mode
│   │   │   └── languageStore.js        # Multi-bahasa
│   │   └── utils/
│   │       └── api.js                  # Axios + JWT interceptor
├── backend/                     # API FastAPI (Python)
│   ├── app/api/v1/endpoints/
│   │   ├── public.py            # ✅ Endpoint publik (tanpa auth)
│   │   ├── auth.py              # Login + /me
│   │   ├── cameras.py           # CRUD kamera (dengan enkripsi)
│   │   ├── users.py             # CRUD pengguna (admin)
│   │   ├── recordings.py        # Manajemen rekaman
│   │   └── settings.py          # Pengaturan sistem
│   ├── app/core/
│   │   ├── security.py          # JWT + bcrypt + Fernet enkripsi
│   │   └── config.py            # Konfigurasi dari .env
│   ├── alembic/                 # Migrasi database
│   ├── main.py                  # Entry point FastAPI
│   └── requirements.txt
├── media_server/                # Konfigurasi MediaMTX
├── linux_deployment/            # Script deploy VPS
│   ├── install_all.sh           # Installer otomatis
│   └── *.service                # Systemd service files
└── docker-compose.yml           # Konfigurasi infra (Postgres + MinIO + MediaMTX)
```

---

## 🛠️ Teknologi yang Digunakan

### Frontend
| Teknologi | Versi | Fungsi |
|-----------|-------|--------|
| **React** | 19 | UI Library |
| **Vite** | 8 | Build tool & dev server |
| **React Router DOM** | 7 | Routing SPA |
| **Zustand** | 5 | State management |
| **Axios** | latest | HTTP client + JWT interceptor |
| **HLS.js** | latest | Video streaming HLS |
| **Lucide React** | latest | Icon library |

### Backend
| Teknologi | Fungsi |
|-----------|--------|
| **FastAPI** | REST API server |
| **Uvicorn** | ASGI server |
| **SQLAlchemy (Async)** | ORM database |
| **Alembic** | Migrasi schema database |
| **python-jose** | JWT authentication |
| **passlib bcrypt** | Hash password user |
| **cryptography (Fernet)** | Enkripsi password kamera |
| **slowapi** | Rate limiting |
| **PostgreSQL** | Database utama |
| **MediaMTX** | Server streaming RTSP/HLS |

---

## 🚀 Cara Menjalankan

### Opsi A: Lokal (Development)

**Prasyarat:** Node.js v20+, Python 3.11+, PostgreSQL 16+

```bash
# Backend
cd backend
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env      # Sesuaikan nilai di .env
alembic upgrade head
uvicorn main:app --reload
```
*API berjalan di: http://localhost:8000*

```bash
# Frontend
cd frontend
npm install
npm run dev
```
*Web berjalan di: http://localhost:5173*

### Opsi B: Deploy ke VPS Production (Ubuntu 24.04)

```bash
# Clone dan jalankan installer otomatis
git clone https://github.com/muhamadghibran/CamMatrix.git
cd CamMatrix
sudo chmod +x linux_deployment/install_all.sh
sudo bash linux_deployment/install_all.sh
```

Installer akan otomatis:
- Install PostgreSQL, MinIO, MediaMTX, Node.js, Python
- Setup database dan jalankan migrasi
- Buat akun admin dengan password acak (≥128-bit)
- Daftarkan semua layanan ke systemd (auto-start)

---

## 🔑 Sistem Akses

### 2 Mode Pengguna

| Mode | URL | Login? | Kemampuan |
|------|-----|--------|-----------|
| **Viewer Publik** | `/live` | ❌ Tidak perlu | Lihat siaran langsung kamera |
| **Administrator** | `/login` → `/app/*` | ✅ Wajib | Kelola kamera, pengguna, rekaman, pengaturan |

### Membuat Akun Admin Baru

Akun admin hanya dapat dibuat melalui terminal VPS (tidak ada form registrasi publik):

```bash
cd /var/www/CamMatrix/backend
source venv/bin/activate
python3 << 'EOF'
import asyncio, os
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker
from passlib.context import CryptContext
from sqlalchemy import text

EMAIL    = "admin_baru@domain.com"
PASSWORD = "PasswordKuat123!"
NAME     = "Nama Admin"

# Gunakan parameter binding, JANGAN PAKAI f-string untuk SQL!
# Detail: https://docs.sqlalchemy.org/en/20/core/tutorial.html#using-textual-sql
async def seed():
    engine  = create_async_engine(os.getenv("DATABASE_URL"))
    session = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)()
    pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
    hashed = pwd_context.hash(PASSWORD)
    
    async with session.begin():
        sql = text("""
            INSERT INTO users (full_name, email, hashed_password, role, is_active, must_change_password) 
            VALUES (:name, :email, :password, 'ADMIN', true, true) 
            ON CONFLICT (email) DO NOTHING;
        """)
        await session.execute(sql, {"name": NAME, "email": EMAIL, "password": hashed})
    await session.close()

asyncio.run(seed())
print(f"✅ Admin dibuat: {EMAIL}")
EOF
```

### Konfigurasi .env Backend

```env
DATABASE_URL=postgresql+asyncpg://postgres:PASSWORD@localhost:5432/cctv_vms
SECRET_KEY=your-random-key-minimum-32-chars        # Generate: python -c "import secrets; print(secrets.token_hex(32))"
ENCRYPTION_KEY=your-random-key-minimum-32-chars    # Generate: python -c "import secrets; print(secrets.token_hex(32))"
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=60
MINIO_ENDPOINT=localhost:9000
MINIO_ACCESS_KEY=admin
MINIO_SECRET_KEY=your-minio-password
MINIO_BUCKET_NAME=records
CORS_ORIGINS=["http://YOUR_SERVER_IP:5173","http://localhost:5173"]
HLS_BASE_URL=http://YOUR_SERVER_IP:8888
DEBUG=false
```

---

## 📋 Rute Aplikasi

| Rute | Halaman | Akses |
|------|---------|-------|
| `/` | Landing Page | Publik |
| `/live` | 📺 **Siaran Langsung** | **Publik — tanpa login** |
| `/login` | Login Admin | Publik |
| `/app/dashboard` | Dashboard | Admin |
| `/app/live` | Live View (dengan kontrol) | Admin |
| `/app/cameras` | Manajemen Kamera | Admin |
| `/app/recordings` | Rekaman | Admin |
| `/app/face` | Analitik Wajah | Admin |
| `/app/settings` | Pengaturan | Admin |
| `/app/users` | Manajemen Pengguna | Admin |

---

## 🗄️ Database Schema

```sql
-- Tabel users
users (
  id              SERIAL PRIMARY KEY,
  full_name       VARCHAR(255),
  email           VARCHAR(255) UNIQUE NOT NULL,
  hashed_password VARCHAR(255),
  role            ENUM('ADMIN', 'OPERATOR', 'VIEWER') DEFAULT 'VIEWER',
  is_active       BOOLEAN DEFAULT TRUE,
  must_change_password BOOLEAN DEFAULT FALSE,
  created_at      TIMESTAMP WITH TIME ZONE DEFAULT NOW()
)

-- Tabel cameras
cameras (
  id        SERIAL PRIMARY KEY,
  owner_id  INTEGER REFERENCES users(id),
  name      VARCHAR(255),
  location  VARCHAR(255),
  rtsp_url  VARCHAR(500),
  username  VARCHAR(255),
  password  TEXT,     -- Terenkripsi dengan Fernet (tidak pernah disimpan plaintext)
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
)
```

---

## 🌐 Dukungan Multi-Bahasa

| Kode | Bahasa |
|------|--------|
| `id` | 🇮🇩 Bahasa Indonesia (default) |
| `en` | 🇺🇸 English |
| `zh` | 🇨🇳 中文 (Mandarin) |

Ubah bahasa melalui **Pengaturan → Bahasa**.

---

## 🗺️ Roadmap

- [x] Autentikasi JWT (Login/Logout) dengan rate limiting
- [x] Enkripsi password kamera RTSP (Fernet)
- [x] Halaman siaran langsung publik tanpa login (`/live`)
- [x] Mode Publisher — kirim stream dari HP (Larix Broadcaster) ke server
- [x] CRUD kamera dengan validasi RTSP URL (anti-SSRF)
- [x] Kamera per-user dengan isolasi data (owner_id)
- [x] Multi-bahasa (ID/EN/ZH)
- [x] Dark/Light mode
- [ ] Streaming RTSP pull dari kamera IP (tergantung firewall ISP)
- [ ] Rekaman video otomatis ke MinIO
- [ ] Deteksi wajah real-time (YOLO / DeepFace)
- [ ] WebSocket untuk update status real-time
- [ ] Notifikasi push ke browser
- [ ] Nginx + TLS/HTTPS

---

## 👨‍💻 Pengembang

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

Dibuat dengan ❤️ menggunakan **React + FastAPI + PostgreSQL + MediaMTX**

⭐ Jika proyek ini bermanfaat, berikan bintang di GitHub!

</div>
