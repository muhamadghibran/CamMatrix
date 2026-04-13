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
  <img src="https://img.shields.io/badge/License-MIT-green?style=flat-square" />
</p>

<p align="center">
  CamMatrix adalah platform SaaS manajemen kamera CCTV berbasis web yang dirancang untuk keamanan profesional. Dibangun dengan antarmuka futuristik bergaya <strong>glassmorphism</strong> dan <strong>neon-cyan accent</strong>, CamMatrix memberikan pengalaman pemantauan kamera yang mulus, intuitif, dan siap untuk integrasi AI.
</p>

</div>

---

## 📸 Tampilan

| Dashboard | Live View | Rekaman |
|-----------|-----------|---------|
| Statistik real-time & grafik | Multi-layout kamera grid | Daftar & analitik wajah |

---

## ✨ Fitur Utama

### 📊 Dashboard
- **Statistik Real-time** — Kamera aktif, siaran langsung, rekaman berjalan, deteksi AI, penyimpanan, dan peringatan diperbarui otomatis setiap 2 detik
- **Sparkline Charts** — Grafik mini yang bergerak dinamis di setiap kartu statistik
- **Status Kamera** — Monitoring status seluruh kamera (Live/Offline/Recording) dalam satu tampilan
- **Feed Peringatan** — Daftar peringatan terbaru dengan tingkat keparahan (High/Medium/Low)
- **Navigasi Cepat** — Tombol langsung ke halaman Kamera dan Rekaman

### 📹 Live View
- **Multi-Layout Grid** — Pilih tampilan 1×1, 2×2, 3×3, atau 4×4 secara instan
- **Animasi Premium** — Setiap sel kamera muncul dengan staggered entrance animation
- **Efek Visual Sinematik** — Scan line, CRT interlace, corner brackets, dan vignette overlay
- **Live Clock** — Jam digital berdetak di setiap sel kamera
- **Fullscreen Mode** — Klik tombol Expand untuk tampilan kamera layar penuh
- **Status Real-time** — Indikator animasi untuk status Live, Recording, dan Offline

### 🎥 Kamera (CRUD Penuh)
- **Tambah Kamera** — Modal form untuk menambahkan kamera RTSP baru (nama, lokasi, IP, port, username, password)
- **Edit Kamera** — Ubah data kamera yang sudah ada
- **Hapus Kamera** — Hapus dengan dialog konfirmasi aman
- **Pencarian** — Filter kamera berdasarkan nama atau lokasi secara real-time
- **Status Monitoring** — Indikator Live/Recording/Offline dengan warna berbeda

### 🎬 Rekaman
- **Daftar Rekaman** — Tabel semua rekaman dengan info kamera, tanggal, durasi, dan ukuran file
- **Putar/Pause** — Simulasi pemutaran rekaman langsung dari tabel
- **Unduh** — Tombol download dengan notifikasi toast konfirmasi
- **Pencarian & Filter** — Cari berdasarkan nama kamera atau tanggal, filter per kamera
- **Tab Analitik Wajah** — Beralih ke mode analitik AI tanpa meninggalkan halaman

### 🤖 Analitik Wajah (AI)
- **Statistik Deteksi** — Total deteksi, wajah unik, dan pencocokan dengan trend
- **Tabel Tracking** — Lacak pergerakan wajah antar kamera dengan timestamp dan confidence score
- **Confidence Bar** — Visual progress bar dengan warna berdasarkan tingkat kepercayaan (Hijau/Kuning/Merah)
- **Terintegrasi** — Tersedia langsung di halaman Rekaman tanpa halaman terpisah

### 👥 Pengguna (CRUD Penuh)
- **Tambah Pengguna** — Daftarkan pengguna baru dengan nama, email, password, dan role
- **Edit Pengguna** — Ubah data dan role pengguna
- **Hapus Pengguna** — Hapus dengan konfirmasi dialog
- **Toggle Status** — Aktifkan/nonaktifkan pengguna langsung dari tabel
- **Role System** — Admin, Operator, Viewer dengan badge warna berbeda
- **Pencarian** — Filter berdasarkan nama atau email

### ⚙️ Pengaturan (State Aktif)
- **Tema** — Ganti antara Dark Mode dan Light Mode secara instan
- **Bahasa** — Dukungan multi-bahasa: Indonesia 🇮🇩, English 🇺🇸, 中文 🇨🇳
- **Notifikasi** — Toggle independen untuk: Alert Wajah, Alert Kamera, Peringatan Storage
- **AI Engine** — Konfigurasi perangkat inferensi (Auto/CPU/CUDA), Frame Rate, dan threshold Confidence
- **Rekaman** — Atur chunk rekaman, auto-delete, dan retensi penyimpanan
- **Keamanan** — Toggle 2FA dan durasi sesi login

### 🔔 Notifikasi Global
- **Panel Notifikasi** — Klik ikon lonceng untuk melihat 5 peringatan terbaru
- **Badge Merah** — Menampilkan jumlah notifikasi yang belum dibaca
- **Mark as Read** — Klik satu notifikasi atau "Tandai Semua" untuk menandai sudah dibaca
- **Auto-close** — Panel tertutup otomatis jika klik di luar area

### 🔍 Pencarian Global
- **Modal Search** — Tekan `Ctrl+K` (atau klik tombol "Cari...") untuk membuka pencarian global
- **Navigasi Cepat** — Cari nama halaman atau fitur, klik untuk langsung navigasi
- **Keyboard Support** — Tekan `ESC` untuk menutup modal

---

## 🏗️ Struktur Proyek

```
CamMatrix/
├── frontend/                    # Aplikasi React
│   ├── src/
│   │   ├── components/
│   │   │   ├── layout/
│   │   │   │   ├── MainLayout.jsx      # Layout utama (sidebar + topbar)
│   │   │   │   ├── Sidebar.jsx         # Navigasi samping dengan collapse
│   │   │   │   └── Topbar.jsx          # Header (search, notifikasi, theme toggle)
│   │   │   └── AnimatedText.jsx        # Komponen teks animasi
│   │   ├── pages/
│   │   │   ├── HomePage.jsx            # Landing page
│   │   │   ├── LoginPage.jsx           # Halaman login dengan auth
│   │   │   ├── DashboardPage.jsx       # Dashboard utama
│   │   │   ├── LiveViewPage.jsx        # Grid kamera live
│   │   │   ├── CamerasPage.jsx         # Manajemen kamera (CRUD)
│   │   │   ├── RecordingsPage.jsx      # Rekaman + Analitik Wajah
│   │   │   ├── FaceAnalyticsPage.jsx   # Komponen analitik AI
│   │   │   ├── UsersPage.jsx           # Manajemen pengguna (CRUD)
│   │   │   └── SettingsPage.jsx        # Pengaturan sistem
│   │   ├── store/
│   │   │   ├── authStore.js            # State autentikasi (Zustand + persist)
│   │   │   ├── themeStore.js           # State dark/light mode
│   │   │   ├── languageStore.js        # State bahasa & terjemahan
│   │   │   └── cameraStore.js          # State data kamera
│   │   ├── locales/
│   │   │   └── id.js                   # File terjemahan bahasa
│   │   ├── index.css                   # Design system, animasi, CSS variables
│   │   └── App.jsx                     # Router & route definitions
├── backend/                     # API FastAPI (Python)
│   ├── app/                     # Modul aplikasi
│   ├── main.py                  # Entry point FastAPI
│   └── requirements.txt         # Dependensi Python
├── media_server/                # Server streaming media
├── docker-compose.yml           # Konfigurasi Docker
└── README.md
```

---

## 🎨 Design System

### Palet Warna

| Mode | Primary | Accent | Background |
|------|---------|--------|------------|
| **Dark** | `#06b6d4` Cyan | `#00ffff` Neon | `#000000` Pure Black |
| **Light** | `#06b6d4` Cyan Dove | `#cceef2` Soft Cyan | `#ffffff` Pure White |

### Animasi
- **Entrance Stagger** — Elemen muncul berurutan dengan delay 60–100ms
- **Spring Physics** — `cubic-bezier(0.16, 1, 0.3, 1)` untuk efek kenyal alami
- **Scan Line** — Animasi garis vertikal pada live view kamera
- **Hover Glow** — Box shadow berwarna sesuai status kamera
- **Glass Morphism** — `backdrop-filter: blur` pada elemen overlay

---

## 🛠️ Teknologi yang Digunakan

### Frontend
| Teknologi | Versi | Fungsi |
|-----------|-------|--------|
| **React** | 19 | UI Library — komponen reaktif |
| **Vite** | 8 | Build tool & dev server ultra-cepat |
| **Tailwind CSS** | 4 | Utility-first CSS framework |
| **React Router DOM** | 7 | Routing SPA (Single Page Application) |
| **Zustand** | 5 | State management global yang ringan |
| **Lucide React** | 1.8 | Icon library konsisten & modern |

### Backend (Siap Integrasi)
| Teknologi | Fungsi |
|-----------|--------|
| **FastAPI** | REST API & WebSocket server |
| **Uvicorn** | ASGI server performa tinggi |
| **SQLAlchemy** | ORM untuk database relasional |
| **asyncpg** | Driver PostgreSQL async |
| **Alembic** | Migrasi database |
| **python-jose** | JWT token authentication |
| **passlib bcrypt** | Hash password yang aman |
| **boto3 / MinIO** | Penyimpanan file rekaman (S3-compatible) |
| **websockets** | Real-time streaming data |

---

## 🚀 Cara Menjalankan

### Prasyarat
- [Node.js](https://nodejs.org/) v18+
- [Python](https://www.python.org/) 3.11+
- [Git](https://git-scm.com/)

### 1. Clone Repository

```bash
git clone https://github.com/muhamadghibran/CamMatrix.git
cd CamMatrix
```

### 2. Jalankan Frontend

```bash
cd frontend
npm install
npm run dev
```

Aplikasi akan berjalan di: **http://localhost:5173**

### 3. Jalankan Backend (Opsional)

```bash
cd backend
pip install -r requirements.txt
cp .env.example .env   # Sesuaikan konfigurasi
python main.py
```

API akan berjalan di: **http://localhost:8000**

---

## 🔑 Akun Demo

Gunakan kredensial berikut untuk masuk ke dashboard:

| Field | Nilai |
|-------|-------|
| **Email / Username** | `admin@vms.com` atau `admin` |
| **Password** | `admin123` |

---

## 📋 Halaman & Rute

| Rute | Halaman | Deskripsi |
|------|---------|-----------|
| `/` | Home | Landing page CamMatrix |
| `/login` | Login | Autentikasi pengguna |
| `/app/dashboard` | Dashboard | Ringkasan sistem & statistik |
| `/app/live` | Live View | Grid kamera real-time |
| `/app/cameras` | Kamera | Manajemen kamera CCTV |
| `/app/recordings` | Rekaman | Daftar rekaman & analitik wajah |
| `/app/users` | Pengguna | Manajemen akun pengguna |
| `/app/settings` | Pengaturan | Konfigurasi sistem |

---

## 🔐 Sistem Autentikasi

- **Mock Auth** — Login dengan email/password divalidasi di frontend (mode demo)
- **Persistent Session** — Auth state tersimpan di `localStorage` via Zustand persist
- **Protected Routes** — Halaman `/app/*` hanya dapat diakses setelah login
- **Auto Redirect** — Pengguna yang belum login akan diarahkan ke `/login`
- **JWT Ready** — Backend FastAPI sudah dikonfigurasi dengan JWT untuk produksi

---

## 🌐 Dukungan Multi-Bahasa

CamMatrix mendukung 3 bahasa:

| Kode | Bahasa |
|------|--------|
| `id` | 🇮🇩 Bahasa Indonesia (default) |
| `en` | 🇺🇸 English |
| `zh` | 🇨🇳 中文 (Mandarin Sederhana) |

Ubah bahasa melalui **Pengaturan → Bahasa**.

---

## 📱 Responsivitas

CamMatrix dirancang responsif untuk berbagai ukuran layar:

- **Desktop** (1280px+) — Sidebar penuh + konten
- **Tablet** (768px-1280px) — Sidebar dapat di-collapse
- **Mobile** (< 768px) — Sidebar tersembunyi, hamburger menu

---

## 🗺️ Roadmap

- [ ] Integrasi backend FastAPI dengan database PostgreSQL
- [ ] Streaming kamera RTSP via WebRTC
- [ ] Rekaman video otomatis ke storage MinIO/S3
- [ ] Deteksi wajah real-time dengan AI (YOLO / DeepFace)
- [ ] Auto-discovery kamera ONVIF dalam jaringan lokal
- [ ] WebSocket untuk data real-time dari backend
- [ ] Sistem notifikasi push ke browser
- [ ] Export laporan PDF

---

## 👨‍💻 Pengembang

**Muhamad Ghibran**
- GitHub: [@muhamadghibran](https://github.com/muhamadghibran)

---

## 📄 Lisensi

Proyek ini menggunakan lisensi **MIT** — bebas digunakan, dimodifikasi, dan didistribusikan.

---

<div align="center">

Dibuat dengan ❤️ menggunakan **React + FastAPI**

⭐ Jika proyek ini bermanfaat, berikan bintang di GitHub!

</div>
