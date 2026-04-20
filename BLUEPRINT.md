# Architecture Blueprint - CamMatrix

Dokumen ini memetakan rancang bangun (arsitektur) perangkat lunak dari platform CamMatrix. Pendekatan arsitektural yang digunakan adalah **Decoupled Client-Server Mircro-ecosystem**.

## 1. Top-Level Design

Sistem ini disusun berdasarkan tumpukan teknologi modern dengan 5 pilar layanan utama:

1. **Frontend / Presentasi (React 19 + Vite)**
   - Bertanggung jawab memproses pengalaman grafis interaktif pengguna, animasi, pemutar video, dan konsumsi API.
   - Tidak melakukan operasi sensitif (Pure Client-side Rendering).

2. **Backend Engine / Logika Bisnis (FastAPI + Python 3.11)**
   - Berfungsi memutus dan memvalidasi jalur data. Mengatur semua interaksi ke *Database* dan *Streaming Service*.

3. **Streaming Gateway (MediaMTX)**
   - Media Proxy Server mandiri (Golang-based). Menerima beban berat siaran langsung RTSP kamera, lalu mengecilkannya (remux/transcode) membaginya ke Ribuan Klien web (WebRTC/HLS/LL-HLS) dalam waktu seketika.

4. **Katalog Data (PostgreSQL 16 + pgvector)**
   - Menyimpan seluruh identifikasi statis, kredensial sandi (bcrypt), tautan string kamera, penanda log deteksi wajah (AI), dan status hak kepemilikan data (Owner id).

5. **Storage Gudang (MinIO)**
   - Obyek storage berbasis *Bucket S3* penampung gigabit file `.mp4` / siaran rekaman mentah setiap jam.


## 2. Peta Node Konektivitas (Network Map)

```text
  [Kamera IP/CCTV Fisik]
         │ (RTSP Stream - TCP 554)
         ▼
  [MediaMTX (Port 8554, 8888, 8889)]  ◄────── (REST API Port 9997) ──────┐
         │                                                               │
     (WebRTC / HLS)                           (SQL TCP 5432)             │ (Internal Network)
         │                                          │                    │
         ▼                                          ▼                    │
  [Browser Pengguna] ◄─── (HTTP 8000) ─── [FastAPI Backend Server] ──────┘
         │                                          │                    
         │ (React.js UI)                            │ (S3 API 9000)      
         │                                          ▼                    
         └─────────────────────────────── [MinIO Object Storage]
                                            (Penyimpanan Rekaman)
```

## 3. Database Schema Blueprint (Entity-Relationship)

### Tabel `users`
Penyimpanan sentral kewenangan.
- `id` (PK, Serial)
- `email` (Unique, Varchar)
- `hashed_password` / `google_id` (Auth identifiers)
- `role` (Enum: admin/operator/viewer)

### Tabel `cameras`
Katalog identifikasi mata kamera.
- `id` (PK, Serial)
- `rtsp_url` (Endpoint konektivitas kamera)
- `owner_id` (FK -> users.id, pembatas privasi kamera)
- `status` (Live/Offline)

*(Tabel dapat dipercayakan untuk menampung Face Logs dan event notifications).*

## 4. Mekanisme Keamanan
- **Proteksi Rute (Route Guarding)**: API diamankan menggunakan `OAuth2PasswordBearer`. Semua entitas yang tidak memiliki header `Authorization: Bearer <token>` akan ditolak mutlak.
- **Proteksi Media**: *Stream* video HLS/WebRTC dari MediaMTX dapat dikonfigurasi melalui validasi Token sehingga pengguna iseng tidak dapat meretas alamat `.m3u8` di latar belakang jaringan publik.
- **Secret Management**: Tidak ada password yang diletakkan di *source code*. Semuanya diekstrak melaui *Environment Variables* (`.env`).
