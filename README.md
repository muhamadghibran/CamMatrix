<div align="center">

<img src="https://img.shields.io/badge/CamMatrix-CCTV%20Platform-00ffff?style=for-the-badge&logo=camera&logoColor=white" alt="CamMatrix">

# CamMatrix
### 🎥 Platform Manajemen CCTV Berbasis Web Modern

<p align="center">
  <img src="https://img.shields.io/badge/React-19-61DAFB?style=flat-square&logo=react&logoColor=black" />
  <img src="https://img.shields.io/badge/Vite-8-646CFF?style=flat-square&logo=vite&logoColor=white" />
  <img src="https://img.shields.io/badge/TailwindCSS-4-06B6D4?style=flat-square&logo=tailwindcss&logoColor=white" />
  <img src="https://img.shields.io/badge/FastAPI-0.115-009688?style=flat-square&logo=fastapi&logoColor=white" />
  <img src="https://img.shields.io/badge/Python-3.11+-3776AB?style=flat-square&logo=python&logoColor=white" />
  <img src="https://img.shields.io/badge/PostgreSQL-16-4169E1?style=flat-square&logo=postgresql&logoColor=white" />
  <img src="https://img.shields.io/badge/License-MIT-green?style=flat-square" />
</p>

<p align="center">
  CamMatrix adalah platform manajemen kamera CCTV berbasis web yang dirancang untuk keamanan profesional. Dibangun dengan antarmuka futuristik bergaya <strong>glassmorphism</strong> dan <strong>neon-cyan accent</strong>, CamMatrix memberikan pengalaman pemantauan kamera yang mulus, intuitif, dan siap untuk integrasi AI.
</p>

</div>

---

## 📸 Tampilan

| Halaman | Deskripsi |
|---------|-----------|
| 🏠 Landing Page | Hero section animasi + mockup browser |
| 🔐 Login / Register | Daftar via Email atau Google OAuth |
| 📊 Dashboard | Statistik real-time & grafik sparkline |
| 📹 Live View | Grid kamera multi-layout |
| 🎬 Rekaman | Daftar rekaman + analitik wajah |
| 👥 Pengguna | Manajemen akun (hanya ADMIN) |

---

## ✨ Fitur Utama

### 🔐 Autentikasi & Registrasi
- **Daftar via Email** — Form registrasi (Nama, Email, Password) langsung tersimpan ke database
- **Login via Google OAuth** — Satu klik masuk atau daftar menggunakan akun Google
- **JWT Authentication** — Semua API dilindungi dengan JWT Token
- **Role-based Access** — ADMIN, OPERATOR, VIEWER dengan hak akses berbeda
- **Protected Routes** — Halaman `/app/*` hanya dapat diakses setelah login
- **Admin-only Pages** — Halaman Pengguna hanya muncul dan dapat diakses oleh ADMIN

### 📊 Dashboard
- **Statistik Real-time** — Kamera aktif, siaran langsung, rekaman berjalan, deteksi AI, penyimpanan, dan peringatan
- **Sparkline Charts** — Grafik mini yang bergerak dinamis di setiap kartu statistik
- **Status Kamera** — Monitoring status seluruh kamera (Live/Offline/Recording)
- **Feed Peringatan** — Daftar peringatan terbaru dengan tingkat keparahan (High/Medium/Low)

### 📹 Live View
- **Multi-Layout Grid** — Pilih tampilan 1×1, 2×2, 3×3, atau 4×4
- **Efek Visual Sinematik** — Scan line, CRT interlace, corner brackets, dan vignette overlay
- **Live Clock** — Jam digital berdetak di setiap sel kamera
- **Fullscreen Mode** — Tampilan kamera layar penuh

### 🎥 Kamera (CRUD Penuh)
- **Tambah Kamera CCTV Pribadi** — Pengguna dapat menambahkan kamera RTSP milik sendiri (nama, lokasi, IP, port, username, password)
- **Privasi Kamera** — Kamera pribadi hanya dapat dilihat oleh pemiliknya sendiri
- **Kamera Publik** — Admin dapat menandai kamera sebagai publik untuk semua pengguna
- **Edit & Hapus** — Manajemen lengkap kamera dengan konfirmasi dialog
- **Pencarian** — Filter kamera berdasarkan nama atau lokasi

### 🎬 Rekaman
- **Daftar Rekaman** — Tabel semua rekaman dengan info kamera, tanggal, durasi, dan ukuran file
- **Unduh Video** — Tombol download langsung dari daftar rekaman
- **Pencarian & Filter** — Cari berdasarkan nama kamera atau tanggal

### 🤖 Analitik Wajah (AI)
- **Statistik Deteksi** — Total deteksi, wajah unik, dan pencocokan dengan trend
- **Tabel Tracking** — Lacak pergerakan wajah antar kamera dengan timestamp dan confidence score
- **Confidence Bar** — Visual progress bar berdasarkan tingkat kepercayaan

### 👥 Manajemen Pengguna (Admin Only)
- **Data Real dari Database** — Tabel menampilkan semua pengguna terdaftar dari database
- **Tambah / Edit / Hapus** — CRUD pengguna lengkap dengan konfirmasi
- **Role System** — Admin, Operator, Viewer dengan badge warna berbeda
- **Statistik** — Total pengguna, jumlah admin, pengguna aktif
- **Pencarian** — Filter berdasarkan nama atau email
- **Tombol Refresh** — Muat ulang data terbaru dari database

### 🌐 Navbar
- **Hide on Scroll** — Navbar menghilang saat halaman di-scroll, muncul kembali di posisi atas

### ⚙️ Pengaturan
- **Tema** — Dark Mode dan Light Mode
- **Bahasa** — Indonesia 🇮🇩, English 🇺🇸, 中文 🇨🇳
- **Notifikasi** — Toggle untuk berbagai jenis peringatan
- **AI Engine** — Konfigurasi perangkat inferensi, Frame Rate, dan threshold Confidence

---

## 🏗️ Struktur Proyek

```
CamMatrix/
├── frontend/                    # Aplikasi React (Vite)
│   ├── src/
│   │   ├── components/
│   │   │   ├── layout/
│   │   │   │   ├── MainLayout.jsx      # Layout utama (sidebar + topbar)
│   │   │   │   ├── Sidebar.jsx         # Navigasi samping (admin-aware)
│   │   │   │   └── Topbar.jsx          # Header (search, notifikasi)
│   │   │   └── AnimatedText.jsx        # Komponen teks animasi
│   │   ├── pages/
│   │   │   ├── HomePage.jsx            # Landing page + animated hero
│   │   │   ├── LoginPage.jsx           # Login + Register (Email & Google)
│   │   │   ├── DashboardPage.jsx       # Dashboard statistik real-time
│   │   │   ├── LiveViewPage.jsx        # Grid kamera live
│   │   │   ├── CamerasPage.jsx         # Manajemen kamera CCTV (CRUD)
│   │   │   ├── RecordingsPage.jsx      # Rekaman + download
│   │   │   ├── FaceAnalyticsPage.jsx   # Analitik wajah AI
│   │   │   ├── UsersPage.jsx           # Manajemen pengguna — ADMIN ONLY
│   │   │   └── SettingsPage.jsx        # Pengaturan sistem
│   │   ├── store/
│   │   │   ├── authStore.js            # State autentikasi (Zustand + persist)
│   │   │   ├── themeStore.js           # State dark/light mode
│   │   │   ├── languageStore.js        # State bahasa & terjemahan
│   │   │   └── cameraStore.js          # State data kamera
│   │   ├── utils/
│   │   │   └── api.js                  # Axios instance + JWT interceptor
│   │   ├── locales/
│   │   │   ├── id.js                   # Bahasa Indonesia
│   │   │   ├── en.js                   # English
│   │   │   └── zh.js                   # 中文
│   │   ├── index.css                   # Design system, animasi, CSS variables
│   │   └── App.jsx                     # Router + route guards
│   └── .env                            # VITE_GOOGLE_CLIENT_ID
├── backend/                     # API FastAPI (Python)
│   ├── app/
│   │   ├── api/v1/endpoints/
│   │   │   ├── auth.py          # Login, Register, Google OAuth, /me
│   │   │   ├── users.py         # CRUD pengguna (admin only)
│   │   │   └── cameras.py       # CRUD kamera (dengan owner/privasi)
│   │   ├── models/
│   │   │   ├── user.py          # Model User (+ google_id, created_at)
│   │   │   └── camera.py        # Model Camera (+ owner_id)
│   │   ├── schemas/
│   │   │   ├── user.py          # Pydantic schemas (UserRegister, etc.)
│   │   │   └── camera.py        # Pydantic schemas kamera
│   │   └── core/
│   │       ├── security.py      # JWT + bcrypt
│   │       └── database.py      # Async SQLAlchemy engine
│   ├── alembic/versions/        # Migrasi database
│   ├── main.py                  # Entry point FastAPI
│   └── requirements.txt         # Dependensi Python
├── media_server/                # MediaMTX streaming server
├── docker-compose.yml           # Konfigurasi Docker
└── README.md
```

---

## 🎨 Design System

### Palet Warna

| Mode | Primary | Accent | Background |
|------|---------|--------|------------|
| **Dark** | `#06b6d4` Cyan | `#00ffff` Neon | `#000000` Pure Black |
| **Light** | `#06b6d4` Cyan | `#cceef2` Soft Cyan | `#ffffff` Pure White |

### Animasi
- **Entrance Stagger** — Elemen muncul berurutan dengan delay animasi
- **Spring Physics** — `cubic-bezier(0.16, 1, 0.3, 1)` untuk efek kenyal alami
- **Scan Line** — Animasi garis vertikal pada live view kamera
- **Hover Glow** — Box shadow berwarna sesuai status kamera
- **Glass Morphism** — `backdrop-filter: blur` pada elemen overlay
- **Hide-on-Scroll Navbar** — Navbar menghilang/muncul berdasarkan posisi scroll

---

## 🛠️ Teknologi yang Digunakan

### Frontend
| Teknologi | Versi | Fungsi |
|-----------|-------|--------|
| **React** | 19 | UI Library — komponen reaktif |
| **Vite** | 8 | Build tool & dev server |
| **Tailwind CSS** | 4 | Utility-first CSS framework |
| **React Router DOM** | 7 | Routing SPA |
| **Zustand** | 5 | State management global |
| **Axios** | latest | HTTP client + JWT interceptor |
| **Lucide React** | latest | Icon library modern |

### Backend
| Teknologi | Fungsi |
|-----------|--------|
| **FastAPI** | REST API server |
| **Uvicorn** | ASGI server performa tinggi |
| **SQLAlchemy (Async)** | ORM database relasional |
| **asyncpg** | Driver PostgreSQL async |
| **Alembic** | Migrasi database schema |
| **python-jose** | JWT token authentication |
| **passlib bcrypt** | Hash password aman |
| **PostgreSQL** | Database utama |

---

## 🚀 Cara Menjalankan

### Opsi A: Menjalankan Lokal (Development / Windows)
Cara ini sangat cocok saat kamu sedang melakukan *coding* pengembangan.

**Prasyarat Lokal:** Node.js v20+, Python 3.11+, PostgreSQL 16+

**1. Setup Backend**
```bash
cd backend
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
cp .env.example .env   # Sesuaikan DATABASE_URL
alembic upgrade head   
python main.py
```
*API berjalan di: http://localhost:8000*

**2. Setup Frontend**
```bash
cd frontend
npm install
cp .env.example .env
npm run dev
```
*Web berjalan di: http://localhost:5173*

---

### Opsi B: Deploy ke Production (Ubuntu 24.04 Native / Systemd)
Ini adalah rute deployment resmi jika kamu menyewa server Linux VPS agar aplikasi online 24 jam. Semua proses instalasi DB hingga Web server diotomatisasi tanpa Docker!

**Cara Pemasangan:**
1. Sewa Server VPS dengan OS **Ubuntu 24.04 LTS**.
2. Clone repo ini ke server.
3. Jalankan *Installer* sakti:
```bash
cd CamMatrix
sudo chmod +x linux_deployment/install_all.sh
sudo bash linux_deployment/install_all.sh
# Ambil kopi sambil menunggu skrip memasang seluruh aplikasi
```
*Semua 5 layanan (MinIO, MediaMTX, Frontend, Backend, PostgreSQL) akan tertanam permanen di dalam manajer `systemd` Linux kamu.*

---

## 🔑 Akun Demo

Gunakan kredensial berikut (saat backend tidak berjalan):

| Field | Nilai |
|-------|-------|
| **Email** | `admin@vms.com` atau `admin` |
| **Password** | `admin123` |

> Saat backend aktif, gunakan akun yang terdaftar di database.

---

## 🔐 Sistem Autentikasi

### Alur Registrasi
1. Pengguna mengisi form (Nama, Email, Password) atau klik **Google**
2. Data dikirim ke `POST /api/v1/auth/register`
3. Password di-hash dengan **bcrypt**, disimpan ke database PostgreSQL
4. Role otomatis `VIEWER` untuk pengguna baru
5. Pengguna dapat langsung masuk

### Alur Google OAuth
1. Pengguna klik tombol **Masuk/Daftar dengan Google**
2. Google Identity Services menampilkan popup pilihan akun
3. Token Google dikirim ke `POST /api/v1/auth/google`
4. Jika email belum terdaftar → auto-register sebagai VIEWER
5. Jika sudah terdaftar → langsung login

### Hak Akses Role

| Fitur | ADMIN | OPERATOR | VIEWER |
|-------|:-----:|:--------:|:------:|
| Dashboard | ✅ | ✅ | ✅ |
| Live View | ✅ | ✅ | ✅ |
| Kamera Publik | ✅ | ✅ | ✅ |
| Kamera Pribadi | ✅ | ✅ | ✅ |
| Rekaman & Download | ✅ | ✅ | ✅ |
| Analitik Wajah | ✅ | ✅ | ✅ |
| **Manajemen Pengguna** | ✅ | ❌ | ❌ |

---

## 📋 Rute Aplikasi

| Rute | Halaman | Akses |
|------|---------|-------|
| `/` | Landing Page | Publik |
| `/login` | Login / Register | Publik |
| `/app/dashboard` | Dashboard | Login |
| `/app/live` | Live View | Login |
| `/app/cameras` | Kamera | Login |
| `/app/recordings` | Rekaman | Login |
| `/app/face` | Analitik Wajah | Login |
| `/app/settings` | Pengaturan | Login |
| `/app/users` | Pengguna | **ADMIN only** |

---

## 🌐 Dukungan Multi-Bahasa

| Kode | Bahasa |
|------|--------|
| `id` | 🇮🇩 Bahasa Indonesia (default) |
| `en` | 🇺🇸 English |
| `zh` | 🇨🇳 中文 (Mandarin) |

Ubah bahasa melalui **Pengaturan → Bahasa**.

---

## 🗄️ Database Schema (Update Terbaru)

```sql
-- Tabel users
users (
  id            SERIAL PRIMARY KEY,
  full_name     VARCHAR(255),
  email         VARCHAR(255) UNIQUE NOT NULL,
  hashed_password VARCHAR(255),          -- NULL untuk user Google OAuth
  role          ENUM('admin','operator','viewer') DEFAULT 'viewer',
  is_active     BOOLEAN DEFAULT TRUE,
  google_id     VARCHAR(255) UNIQUE,     -- ID unik dari Google
  created_at    TIMESTAMP WITH TIME ZONE DEFAULT NOW()
)

-- Tabel cameras
cameras (
  id        SERIAL PRIMARY KEY,
  name      VARCHAR(255),
  location  VARCHAR(255),
  rtsp_url  VARCHAR(500),
  owner_id  INTEGER REFERENCES users(id), -- NULL = kamera publik
  is_active BOOLEAN DEFAULT TRUE,
  ...
)
```

---

## 🗺️ Roadmap

- [x] Autentikasi JWT (Login/Logout)
- [x] Registrasi via Email — tersimpan ke database
- [x] Login/Register via Google OAuth
- [x] Role-based Access Control (ADMIN, OPERATOR, VIEWER)
- [x] Halaman Pengguna hanya untuk ADMIN
- [x] Data pengguna real dari database PostgreSQL
- [x] Kamera pribadi dengan sistem privasi per-user
- [x] Hide-on-scroll navbar
- [ ] Streaming kamera RTSP via WebRTC
- [ ] Rekaman video otomatis ke storage MinIO/S3
- [ ] Deteksi wajah real-time dengan AI (YOLO / DeepFace)
- [ ] Auto-discovery kamera ONVIF dalam jaringan lokal
- [ ] WebSocket untuk data real-time dari backend
- [ ] Sistem notifikasi push ke browser
- [ ] Export laporan PDF

---

## 👨‍💻 Pengembang

**Muhamad Ghibran Muslih**
- GitHub: [@MuhamadGhibran](https://github.com/muhamadghibran)

**Muhammad Fathir Bagas**
- GitHub: [@MuhammadFathir](https://github.com/CHOCOcheeseE)

**Muhammad Sinar Agusta**
- GitHub: [@MuhammadSinar](https://github.com/muhamadghibran)

**Muh Agung Hanapi**
- GitHub: [@MuhAgungHanapi](https://github.com/muhagunghanapi)

**Ferdi Supyandi**
- GitHub: [@Ato](https://github.com/ferdisupyandi)
  
**Citra**
- GitHub: [@Citra](https://github.com/citrarafril)

**Haiza**
- GitHub: [@Haiza](https://github.com/haizaputri)


---

## 📄 Lisensi

Proyek ini menggunakan lisensi **MIT** — bebas digunakan, dimodifikasi, dan didistribusikan.

---

<div align="center">

Dibuat dengan ❤️ menggunakan **React + FastAPI + PostgreSQL**

⭐ Jika proyek ini bermanfaat, berikan bintang di GitHub!

</div>
